import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Script to test AI streaming functionality using a mock OpenAI key.
 * Logs the structure of the streaming result.
 */
async function test() {
    const openai = createOpenAI({ apiKey: 'test' });
    const result = await streamText({
        model: openai('gpt-4o'),
        messages: [{ role: 'user', content: 'hi' }],
    });
    console.log(Object.keys(result));
    console.log(Object.getPrototypeOf(result));
}

test().catch(console.error);
