import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { db } from '@/db';
import { userApiKeys, chats, messages as messagesTable, profiles, councilResponses } from '@/db/schema';
import { decrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { calculateCost } from '@/lib/pricing';

export async function POST(req: Request) {
  // Local-only mode: Hardcoded user
  const userId = 'local-user';

  // Ensure local user profile exists
  const existingUser = await db.select().from(profiles).where(eq(profiles.id, userId)).get();
  if (!existingUser) {
    await db.insert(profiles).values({
      id: userId,
      email: 'local@user.com',
      full_name: 'Local User',
    });
  }

  try {
    const { messages, model, councilContext, councilData, chatId: requestedChatId, judgePrompt, persona, save = true } = await req.json();

    // 1. Get API Key
    const keyRecord = await db.query.userApiKeys.findFirst({
      where: (keys, { and, eq }) => and(eq(keys.user_id, userId), eq(keys.provider, 'openrouter'))
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

    // 3. Handle Chat Session (Only if save is true)
    let chatId = requestedChatId;
    if (save) {
      if (!chatId) {
        // Create new chat
        const title = messages[messages.length - 1].content.slice(0, 50) + '...';
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
        content: lastUserMsg.content,
      });
    }

    // 5. Stream Text
    const targetModel = model || 'openai/gpt-4o';
    const processedMessages = [...messages];
    let systemPrompt = undefined;

    // If councilContext is present, inject it into the last message content for the LLM only
    if (councilContext && processedMessages.length > 0) {
      const lastMsg = processedMessages[processedMessages.length - 1];
      const originalContent = lastMsg.content;

      systemPrompt = judgePrompt || `You are the Chief Justice of an AI Council. Your role is to synthesize the perspectives provided above into a single, authoritative response.

1. **Analyze:** Briefly evaluate the strengths and weaknesses of each Council Member's argument.
2. **Synthesize:** Merge the best insights from all members.
3. **Decide:** Provide a final answer to the User's Query.

Tone: Diplomatic but decisive. Acknowledge nuance, but do not equivocate.
Format: Use clear headings or bullet points for the analysis if helpful, but keep the final answer direct.`;

      lastMsg.content = `User Query: ${originalContent}

--- COUNCIL DELIBERATIONS ---
${councilContext}`;
    } else if (persona) {
      systemPrompt = persona;
    }

    const result = await streamText({
      model: openrouter(targetModel),
      messages: convertToCoreMessages(processedMessages),
      system: systemPrompt,
      onFinish: async ({ text, usage }) => {
        // Save the assistant's response to the database
        if (save && chatId) {
          const [assistantMsg] = await db.insert(messagesTable).values({
            chat_id: chatId,
            role: 'assistant',
            content: text,
            annotations: councilData ? JSON.stringify(councilData) : null,
            prompt_tokens: (usage as any)?.promptTokens || 0,
            completion_tokens: (usage as any)?.completionTokens || 0,
          }).returning();

          // Save Council Metrics if available
          if (councilData && Array.isArray(councilData)) {
            const councilInserts = councilData.map((c: any) => ({
              message_id: assistantMsg.id,
              model_id: c.modelId,
              content: c.content,
              prompt_tokens: c.promptTokens || 0,
              completion_tokens: c.completionTokens || 0,
              cost: calculateCost(c.modelId, c.promptTokens || 0, c.completionTokens || 0),
              duration_ms: 0 // We aren't tracking duration yet in the API, maybe client sends it?
            }));

            if (councilInserts.length > 0) {
              await db.insert(councilResponses).values(councilInserts);
            }
          }
        }

        // Log usage for debugging
        if (usage) {
          console.log('Token Usage:', usage);
        }
      },
    });

    const response = result.toTextStreamResponse();
    if (chatId) {
      response.headers.set('X-Chat-Id', chatId);
    }
    return response;

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
