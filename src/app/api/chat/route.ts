import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { db } from '@/db';
import { chats, messages as messagesTable } from '@/db/schema';
import { decrypt } from '@/lib/encryption';
import { NextResponse } from 'next/server';
import { calculateModelCost, INITIAL_PRICING } from '@/lib/model-pricing';
import { getMessageContent } from '@/lib/message-utils';
import { DEFAULT_JUDGE_PROMPT } from '@/config/prompts';
import { ensureDefaultUser } from '@/lib/api-utils';

type RawMessage =
  | string
  | {
      role?: string;
      content?: string;
      text?: string;
      parts?: Array<{ type?: string; text?: string | null } | null>;
    };

type NormalizedMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// XML format instructions that are always appended to synthesizer prompts
const XML_FORMAT_INSTRUCTIONS = `You MUST structure your response in exactly two sections:

<reasoning>
Your analysis of the council members' responses, identifying agreements, disagreements, and key insights.
</reasoning>

<answer>
Your synthesized final answer based on the council discussion.
</answer>`;

export async function POST(req: Request) {
  const userId = await ensureDefaultUser();

  try {
    const { messages, model, councilContext, councilData, chatId: requestedChatId, judgePrompt, persona, isCouncilMember, isJudge } = await req.json();

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required and cannot be empty' }, { status: 400 });
    }

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
    const openrouter = createOpenRouter({
      apiKey: apiKey,
    });

    // 3. Handle Chat Session
    // Skip chat creation for council member requests (they don't need to save separately)
    let chatId = requestedChatId;
    if (!chatId && !isCouncilMember) {
      // Create new chat only for main chat requests (not council members)
      const lastMsgContent = getMessageContent(messages[messages.length - 1]);
      const title = lastMsgContent.slice(0, 50) + '...';
      const [newChat] = await db.insert(chats).values({
        user_id: userId,
        title: title,
      }).returning();
      chatId = newChat.id;
    } else if (chatId) {
      // Verify ownership only if chatId is provided
      const chat = await db.query.chats.findFirst({
        where: (c, { and, eq }) => and(eq(c.id, chatId), eq(c.user_id, userId))
      });
      if (!chat) {
        return NextResponse.json({ error: 'Invalid Chat ID' }, { status: 404 });
      }
    }

    // 4. Save User Message (only for non-council member requests)
    if (!isCouncilMember && chatId) {
      const lastUserMsg = messages[messages.length - 1];
      await db.insert(messagesTable).values({
        chat_id: chatId,
        role: 'user',
        content: getMessageContent(lastUserMsg),
      });
    }

    // 5. Stream Text
    const targetModel = model || 'openai/gpt-4o';

    // For judge requests, messages are already properly formatted as {role, content} strings
    // For other requests, detect format and convert appropriately
    const rawMessages = messages as RawMessage[];

    const normalizeMessage = (msg: RawMessage): NormalizedMessage => ({
      role: (typeof msg === 'object' && msg?.role ? msg.role : 'user') as NormalizedMessage['role'],
      content: getMessageContent(msg),
    });

    let modelMessages = rawMessages
      .map(normalizeMessage)
      .filter((msg) => msg.content && msg.content.trim() !== '');

    const shouldUseJudgePrompt = Boolean(isJudge || councilContext);
    const baseJudgePrompt = shouldUseJudgePrompt
      ? (judgePrompt || DEFAULT_JUDGE_PROMPT)
      : null;
    const judgeSystemPrompt = baseJudgePrompt
      ? `${baseJudgePrompt.trim()}\n\n${XML_FORMAT_INSTRUCTIONS}`
      : undefined;

    let systemPrompt = undefined;

    // If councilContext is present, inject it into the last message content for the LLM only
    if (councilContext && modelMessages.length > 0) {
      const lastMsg = modelMessages[modelMessages.length - 1];
      const originalContent = lastMsg.content;

      systemPrompt = judgeSystemPrompt;

      // Create new message array with injected council context
      const injectedContent = `User Query: ${originalContent}

--- COUNCIL DELIBERATIONS ---
${councilContext}`;
      modelMessages = [
        ...modelMessages.slice(0, -1),
        { ...lastMsg, content: injectedContent }
      ];
    } else if (isJudge && judgeSystemPrompt) {
      systemPrompt = judgeSystemPrompt;
    } else if (persona) {
      systemPrompt = persona;
    }

    const result = await streamText({
      model: openrouter(targetModel, { usage: { include: true } }),
      messages: modelMessages,
      system: systemPrompt,
      onFinish: async ({ text, usage, providerMetadata }) => {
        // Save the assistant's response to the database
        if (chatId) {
          // Build annotations array with council data and judge model if present
          let annotationsToSave = null;
          if (councilData) {
            annotationsToSave = JSON.stringify([councilData, { judgeModel: targetModel }]);
          }

          // Extract usage from standard usage object or OpenRouter provider metadata
          const openrouterUsage = providerMetadata?.openrouter?.usage as { promptTokens?: number; completionTokens?: number; cost?: number } | undefined;
          const promptTokens = usage?.inputTokens ?? openrouterUsage?.promptTokens ?? 0;
          const completionTokens = usage?.outputTokens ?? openrouterUsage?.completionTokens ?? 0;
          
          // Use OpenRouter's reported cost if available, otherwise calculate
          const cost = openrouterUsage?.cost ?? calculateModelCost(
            targetModel,
            promptTokens,
            completionTokens,
            INITIAL_PRICING
          );

          await db.insert(messagesTable).values({
            chat_id: chatId,
            role: 'assistant',
            content: text,
            annotations: annotationsToSave,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            cost: cost.toFixed(10),
            model: targetModel,
          });
        }

        // Log usage for debugging
        if (usage) {
          console.log('Token Usage:', usage);
        }
      },
    });

    // Use toTextStreamResponse for council members and judge (easier to parse)
    // Use toUIMessageStreamResponse for main chat (required for useChat hook)
    if (isCouncilMember || isJudge) {
      const response = result.toTextStreamResponse();
      // Council members and judge don't need X-Chat-Id header
      return response;
    }

    const response = result.toUIMessageStreamResponse();
    if (chatId) {
      response.headers.set('X-Chat-Id', chatId);
    }
    return response;

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

