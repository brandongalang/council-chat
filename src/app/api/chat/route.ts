import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userApiKeys, chats, messages as messagesTable } from '@/db/schema';
import { decrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messages, model, councilContext, councilData, chatId: requestedChatId, judgePrompt } = await req.json();

    // 1. Get API Key
    const keyRecord = await db.query.userApiKeys.findFirst({
      where: (keys, { and, eq }) => and(eq(keys.user_id, user.id), eq(keys.provider, 'openrouter'))
    });

    if (!keyRecord) {
      return NextResponse.json({ error: 'OpenRouter API Key not configured. Please go to Settings.' }, { status: 400 });
    }

    const apiKey = decrypt(keyRecord.encrypted_key);

    // 2. Initialize OpenRouter Provider
    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
    });

    // 3. Handle Chat Session
    let chatId = requestedChatId;
    if (!chatId) {
      // Create new chat
      const title = messages[messages.length - 1].content.slice(0, 50) + '...';
      const [newChat] = await db.insert(chats).values({
        user_id: user.id,
        title: title,
      }).returning();
      chatId = newChat.id;
    } else {
      // Verify ownership
      const chat = await db.query.chats.findFirst({
        where: (c, { and, eq }) => and(eq(c.id, chatId), eq(c.user_id, user.id))
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
      content: lastUserMsg.content,
    });

    // 5. Stream Text
    const targetModel = model || 'openai/gpt-4o';
    const processedMessages = [...messages];
    let systemPrompt = undefined;

    // If councilContext is present, inject it into the last message content for the LLM only
    if (councilContext && processedMessages.length > 0) {
      const lastMsg = processedMessages[processedMessages.length - 1];
      const originalContent = lastMsg.content;

      systemPrompt = judgePrompt || `You are the Chief Justice of an AI Council.Your role is to synthesize the perspectives provided above into a single, authoritative response.

1. ** Analyze:** Briefly evaluate the strengths and weaknesses of each Council Member's argument.
2. ** Synthesize:** Merge the best insights from all members.
3. ** Decide:** Provide a final answer to the User's Query.

Tone: Diplomatic but decisive.Acknowledge nuance, but do not equivocate.
  Format: Use clear headings or bullet points for the analysis if helpful, but keep the final answer direct.`;

      lastMsg.content = `User Query: ${originalContent}

--- COUNCIL DELIBERATIONS-- -
  ${councilContext} `;
    }

    const result = await streamText({
      model: openrouter(targetModel),
      messages: convertToCoreMessages(processedMessages),
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

