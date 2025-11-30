import { db } from '@/db';
import { messages, councilResponses, chats } from '@/db/schema';
import { sql, eq, and, gte, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    const userId = 'local-user';

    try {
        // 1. Total Chats
        const totalChatsResult = await db.select({ count: sql<number>`count(*)` })
            .from(chats)
            .where(eq(chats.user_id, userId))
            .get();
        const totalChats = totalChatsResult?.count || 0;

        // 2. Total Messages & Tokens (Judge)
        // We need to join with chats to ensure we only count messages for this user
        const judgeStats = await db.select({
            count: sql<number>`count(*)`,
            promptTokens: sql<number>`sum(${messages.prompt_tokens})`,
            completionTokens: sql<number>`sum(${messages.completion_tokens})`
        })
            .from(messages)
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), eq(messages.role, 'assistant')))
            .get();

        // 3. Council Stats
        // Council responses are linked to messages, which are linked to chats
        const councilStats = await db.select({
            count: sql<number>`count(*)`,
            promptTokens: sql<number>`sum(${councilResponses.prompt_tokens})`,
            completionTokens: sql<number>`sum(${councilResponses.completion_tokens})`,
            totalCost: sql<number>`sum(${councilResponses.cost})`
        })
            .from(councilResponses)
            .innerJoin(messages, eq(councilResponses.message_id, messages.id))
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(eq(chats.user_id, userId))
            .get();

        // Calculate Total Cost (Judge + Council)
        // Note: We aren't storing Judge cost in DB yet, so we'll estimate it or just show Council cost for now.
        // Wait, the plan said "Total Cost (sum of all cost fields)". 
        // Currently only `council_responses` has a `cost` field.
        // We should probably calculate Judge cost on the fly or add a cost column to messages.
        // For now, let's just use Council Cost + Estimate Judge Cost.
        // Actually, let's just return what we have.

        // 4. Daily Usage (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString();

        const dailyUsage = await db.select({
            date: sql<string>`date(${messages.created_at})`,
            tokens: sql<number>`sum(coalesce(${messages.prompt_tokens}, 0) + coalesce(${messages.completion_tokens}, 0))`
        })
            .from(messages)
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), gte(messages.created_at, dateStr)))
            .groupBy(sql`date(${messages.created_at})`)
            .orderBy(sql`date(${messages.created_at})`)
            .all();

        // 5. Model Breakdown (Council Only for now as Judge model isn't stored in messages)
        const modelBreakdown = await db.select({
            modelId: councilResponses.model_id,
            cost: sql<number>`sum(${councilResponses.cost})`,
            count: sql<number>`count(*)`
        })
            .from(councilResponses)
            .innerJoin(messages, eq(councilResponses.message_id, messages.id))
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(eq(chats.user_id, userId))
            .groupBy(councilResponses.model_id)
            .orderBy(desc(sql`sum(${councilResponses.cost})`))
            .all();

        return NextResponse.json({
            totalChats,
            totalTokens: (judgeStats?.promptTokens || 0) + (judgeStats?.completionTokens || 0) + (councilStats?.promptTokens || 0) + (councilStats?.completionTokens || 0),
            totalCost: councilStats?.totalCost || 0, // Only Council cost for now
            dailyUsage,
            modelBreakdown
        });

    } catch (err) {
        console.error('Analytics error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
