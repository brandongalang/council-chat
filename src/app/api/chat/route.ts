import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { db } from '@/db';
import { userApiKeys, chats, messages as messagesTable, profiles } from '@/db/schema';
import { decrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppConfig } from '@/config/app-config';

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
    const { messages, model, councilContext, councilData, chatId: requestedChatId, judgePrompt, persona } = await req.json();

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

    // 3. Handle Chat Session
    let chatId = requestedChatId;
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

    // 5. Stream Text
    const targetModel = model || 'openai/gpt-4o';

    // Normalize messages to ensure they have role and content fields
    const normalizedMessages = messages.map((msg: any) => ({
      role: msg.role || 'user',
      content: getMessageContent(msg)
    }));

    let systemPrompt = undefined;

    // If councilContext is present, inject it into the last message content for the LLM only
    let messagesForLLM = normalizedMessages;
    if (councilContext && normalizedMessages.length > 0) {
      const lastMsg = normalizedMessages[normalizedMessages.length - 1];
      const originalContent = lastMsg.content;

      systemPrompt = judgePrompt || `You are the Chief Justice of an AI Council.Your role is to synthesize the perspectives provided above into a single, authoritative response.

1. ** Analyze:** Briefly evaluate the strengths and weaknesses of each Council Member's argument.
2. ** Synthesize:** Merge the best insights from all members.
3. ** Decide:** Provide a final answer to the User's Query.

Tone: Diplomatic but decisive.Acknowledge nuance, but do not equivocate.
  Format: Use clear headings or bullet points for the analysis if helpful, but keep the final answer direct.`;

      // Create new message array to avoid mutation
      const injectedContent = `User Query: ${originalContent}

--- COUNCIL DELIBERATIONS-- -
  ${councilContext} `;
      messagesForLLM = [
        ...normalizedMessages.slice(0, -1),
        { ...lastMsg, content: injectedContent }
      ];
    } else if (persona) {
      systemPrompt = persona;
    }

    const result = await streamText({
      model: openrouter(targetModel),
      messages: messagesForLLM,
      system: systemPrompt,
      onFinish: async ({ text, usage }) => {
        // Save the assistant's response to the database
        if (chatId) {
          await db.insert(messagesTable).values({
            chat_id: chatId,
            role: 'assistant',
            content: text,
            annotations: councilData ? JSON.stringify(councilData) : null,
            prompt_tokens: (usage as any)?.promptTokens || 0,
            completion_tokens: (usage as any)?.completionTokens || 0,
          });
        }

        // Log usage for debugging
        if (usage) {
          console.log('Token Usage:', usage);
        }
      },
    });

    const response = result.toTextStreamResponse();
    response.headers.set('X-Chat-Id', chatId);
    return response;

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

