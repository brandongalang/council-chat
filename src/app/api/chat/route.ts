import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { db } from '@/db';
import { userApiKeys, chats, messages as messagesTable, profiles } from '@/db/schema';
import { decrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { calculateCost } from '@/lib/pricing';

import { AppConfig } from '@/config/app-config';
import { COUNCIL_MEMBER_PROMPTS, SYNTHESIZER_PROMPTS } from '@/constants/council-prompts';
import { DEFAULT_JUDGE_PROMPT } from '@/constants/council';

export async function POST(req: Request) {
  // Local-only mode: Hardcoded user
  const userId = AppConfig.defaultUser.id;

  // Ensure local user profile exists
  const existingUser = await db.select().from(profiles).where(eq(profiles.id, userId)).get();
  if (!existingUser) {
    await db.insert(profiles).values({
      id: userId,
      email: AppConfig.defaultUser.email,
      full_name: AppConfig.defaultUser.name,
    });
  }

  try {
    const { messages, model, councilContext, councilData, chatId: requestedChatId, judgePrompt, persona, promptTemplateId, customPrompt, save = true } = await req.json();

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required and cannot be empty' }, { status: 400 });
    }

    // Helper to extract content from message (handles both old 'content' and new 'text' formats)
    const getMessageContent = (msg: any): string => {
      if (typeof msg === 'string') return msg;
      return msg?.content || msg?.text || '';
    };

    // 1. Get API Key
    const keyRecord = await db.query.userApiKeys.findFirst({
      where: (keys, { and, eq }) => and(eq(keys.user_id, userId), eq(keys.provider, 'openrouter'))
    });

    if (!keyRecord) {
      return NextResponse.json({ error: 'OpenRouter API Key not configured. Please go to Settings.' }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = decrypt(keyRecord.encrypted_key);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return NextResponse.json({ error: 'Failed to decrypt API key. Please reset it in Settings.' }, { status: 500 });
    }

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json({ error: 'Invalid API key format. Please check Settings.' }, { status: 400 });
    }

    // 2. Initialize OpenRouter Provider
    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
    });

    // 3. Handle Chat Session (Only if save is true)
    let chatId = requestedChatId;
    if (save) {
      if (!chatId) {
        // Create new chat
        const lastMsgContent = getMessageContent(messages[messages.length - 1]);
        const title = lastMsgContent.slice(0, 50) + '...';
        const [newChat] = await db.insert(chats).values({
          user_id: userId,
          title: title,
        }).returning();
        chatId = newChat.id;
      } else {
        // Verify ownership
        const chat = await db.query.chats.findFirst({
          where: (c, { and, eq }) => and(eq(c.id, chatId), eq(c.user_id, userId))
        });
        if (!chat) {
          return NextResponse.json({ error: 'Invalid Chat ID' }, { status: 404 });
        }
      }

      // 4. Save User Message
      const lastUserMsg = messages[messages.length - 1];
      await db.insert(messagesTable).values({
        chat_id: chatId,
        role: 'user',
        content: getMessageContent(lastUserMsg),
      });
    }

    // 5. Stream Text
    const targetModel = model || 'openai/gpt-4o';

    // Normalize messages to ensure they have role and content fields
    const normalizedMessages = messages.map((msg: any) => ({
      role: msg.role || 'user',
      content: getMessageContent(msg)
    }));

    let systemPrompt = undefined;

    // Helper to build the Judge's user prompt
    const buildJudgeUserPrompt = (
      userMessage: string,
      responses: Array<{ modelName: string; content: string }>
    ) => `
User Query: ${userMessage}

Model Responses:
${responses.map(r => `
### ${r.modelName}
${r.content}
`).join('\n')}

Please analyze these responses and provide your synthesis.
`;

    // Prompt Resolution Logic
    const resolveSystemPrompt = () => {
      // Priority: customPrompt > promptTemplateId > persona (legacy)
      if (customPrompt) return customPrompt;

      if (promptTemplateId) {
        // Check both libraries as we don't know context (member vs judge) strictly here
        // though usually 'save=true' implies judge context
        const memberTemplate = COUNCIL_MEMBER_PROMPTS.find(p => p.id === promptTemplateId);
        if (memberTemplate) return memberTemplate.systemPrompt;

        const synthTemplate = SYNTHESIZER_PROMPTS.find(p => p.id === promptTemplateId);
        if (synthTemplate) return synthTemplate.systemPrompt;
      }

      return persona; // Fallback to legacy
    };

    // If councilData is present, inject it into the last message content for the LLM only
    let messagesForLLM = normalizedMessages;
    if (councilData && normalizedMessages.length > 0) {
      const lastMsg = normalizedMessages[normalizedMessages.length - 1];
      const originalContent = lastMsg.content;

      // For Judge: Use judgePrompt if provided (legacy/direct), otherwise resolve
      // Note: judgePrompt is passed as a string from frontend currently
      systemPrompt = judgePrompt || resolveSystemPrompt() || DEFAULT_JUDGE_PROMPT;

      // Construct the full prompt for the Judge
      const judgePromptContent = buildJudgeUserPrompt(originalContent, councilData);

      // Create a new message with the judge prompt (don't mutate normalized)
      messagesForLLM = [
        ...normalizedMessages.slice(0, -1),
        { ...lastMsg, content: judgePromptContent }
      ];

    } else {
      // For Council Member or Solo
      systemPrompt = resolveSystemPrompt();
    }

    const result = await streamText({
      model: openrouter(targetModel),
      messages: messagesForLLM,
      system: systemPrompt,
      onFinish: async ({ text, usage }) => {
        // Save the assistant's response to the database
        if (save && chatId) {
          const promptTokens = (usage as any)?.promptTokens || 0;
          const completionTokens = (usage as any)?.completionTokens || 0;
          const cost = calculateCost(targetModel, promptTokens, completionTokens);

          await db.insert(messagesTable).values({
            chat_id: chatId,
            role: 'assistant',
            content: text,
            annotations: councilData ? JSON.stringify(councilData) : null,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            cost: cost,
            model: targetModel,
          });
        }

        // Log usage for debugging
        if (usage) {
          console.log('Token Usage:', usage);
        }
      },
    });

    // Create a custom stream to append usage data
    const stream = new ReadableStream({
      async start(controller) {
        const reader = result.textStream.getReader();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(encoder.encode(value));
          }

          // Append usage data
          const usage = await result.usage;
          if (usage) {
            controller.enqueue(encoder.encode(`\n__USAGE__:${JSON.stringify(usage)}`));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(chatId ? { 'X-Chat-Id': chatId } : {})
      }
    });

    return response;

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
