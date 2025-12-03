import { db } from '@/db';
import { messages } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Aggregate stats
        const stats = await db
            .select({
                totalPromptTokens: sql<number>`sum(${messages.prompt_tokens})`,
                totalCompletionTokens: sql<number>`sum(${messages.completion_tokens})`,
                totalCost: sql<number>`sum(cast(${messages.cost} as numeric))`,
                messageCount: sql<number>`count(*)`,
            })
            .from(messages);

        // Stats by model
        const modelStats = await db
            .select({
                model: messages.model,
                count: sql<number>`count(*)`,
                cost: sql<number>`sum(cast(${messages.cost} as numeric))`,
            })
            .from(messages)
            .groupBy(messages.model);

        return NextResponse.json({
            summary: stats[0],
            byModel: modelStats
        });
    } catch (error) {
        console.error('Failed to fetch analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
