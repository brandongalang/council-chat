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

    // If councilData is present, inject it into the last message content for the LLM only
    if (councilData && processedMessages.length > 0) {
      const lastMsg = processedMessages[processedMessages.length - 1];
      const originalContent = lastMsg.content;

      systemPrompt = judgePrompt || `You are a synthesis expert. You will receive responses from multiple AI models to the same user query. Your task is to:

1. Analyze each response for its unique strengths and weaknesses
2. Compare responses to identify what each model does better or worse than others
3. Synthesize the best elements into a comprehensive final response

Format your response as:

## Analysis
[For each model, provide 2-3 bullet points on strengths and weaknesses]

## Synthesis Approach
[Explain which elements you're taking from which model and why]

## Final Response
[Your synthesized answer that incorporates the best of all responses]
`;

      // Construct the full prompt for the Judge
      lastMsg.content = buildJudgeUserPrompt(originalContent, councilData);

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
          const promptTokens = (usage as any)?.promptTokens || 0;
          const completionTokens = (usage as any)?.completionTokens || 0;
          const cost = calculateCost(targetModel, promptTokens, completionTokens);

          const [assistantMsg] = await db.insert(messagesTable).values({
            chat_id: chatId,
            role: 'assistant',
            content: text,
            annotations: councilData ? JSON.stringify(councilData) : null,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            cost: cost,
            model: targetModel,
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
