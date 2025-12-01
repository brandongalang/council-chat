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

        // 2. Total Stats (Judge + Council)
        // We can sum up everything from messages (Judge) and council_responses (Council)

        // Judge Stats (from messages table)
        const judgeStats = await db.select({
            count: sql<number>`count(*)`,
            promptTokens: sql<number>`sum(${messages.prompt_tokens})`,
            completionTokens: sql<number>`sum(${messages.completion_tokens})`,
            cost: sql<number>`sum(${messages.cost})`
        })
            .from(messages)
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), eq(messages.role, 'assistant')))
            .get();

        // Council Stats (from council_responses table)
        const councilStats = await db.select({
            count: sql<number>`count(*)`,
            promptTokens: sql<number>`sum(${councilResponses.prompt_tokens})`,
            completionTokens: sql<number>`sum(${councilResponses.completion_tokens})`,
            cost: sql<number>`sum(${councilResponses.cost})`
        })
            .from(councilResponses)
            .innerJoin(messages, eq(councilResponses.message_id, messages.id))
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(eq(chats.user_id, userId))
            .get();

        const totalTokens = (judgeStats?.promptTokens || 0) + (judgeStats?.completionTokens || 0) +
            (councilStats?.promptTokens || 0) + (councilStats?.completionTokens || 0);

        const totalCost = (judgeStats?.cost || 0) + (councilStats?.cost || 0);

        // 3. Daily Usage (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString();

        // We need to combine daily usage from both tables. 
        // This is a bit complex in one query without a UNION.
        // Let's just get daily usage from messages (Judge) and we might miss Council usage date if it differs?
        // Actually, Council responses are created at the same time as messages roughly.
        // But to be accurate we should sum tokens from both.
        // For simplicity in this iteration, let's assume the message timestamp covers the session.
        // We will sum tokens from messages (Judge) + tokens from associated council responses?
        // Easier: Just query messages for daily stats (Judge) and query council_responses for daily stats (Council) and merge in JS.

        const dailyJudge = await db.select({
            date: sql<string>`date(${messages.created_at})`,
            tokens: sql<number>`sum(coalesce(${messages.prompt_tokens}, 0) + coalesce(${messages.completion_tokens}, 0))`,
            cost: sql<number>`sum(coalesce(${messages.cost}, 0))`
        })
            .from(messages)
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), gte(messages.created_at, dateStr), eq(messages.role, 'assistant')))
            .groupBy(sql`date(${messages.created_at})`)
            .all();

        const dailyCouncil = await db.select({
            date: sql<string>`date(${councilResponses.created_at})`,
            tokens: sql<number>`sum(coalesce(${councilResponses.prompt_tokens}, 0) + coalesce(${councilResponses.completion_tokens}, 0))`,
            cost: sql<number>`sum(coalesce(${councilResponses.cost}, 0))`
        })
            .from(councilResponses)
            .innerJoin(messages, eq(councilResponses.message_id, messages.id))
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), gte(councilResponses.created_at, dateStr)))
            .groupBy(sql`date(${councilResponses.created_at})`)
            .all();

        // Merge Daily Stats
        const dailyMap = new Map<string, { date: string, tokens: number, cost: number }>();

        [...dailyJudge, ...dailyCouncil].forEach(item => {
            const existing = dailyMap.get(item.date) || { date: item.date, tokens: 0, cost: 0 };
            existing.tokens += item.tokens;
            existing.cost += item.cost;
            dailyMap.set(item.date, existing);
        });

        const dailyUsage = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // 4. Model Breakdown
        // Judge Models
        const judgeModels = await db.select({
            modelId: messages.model,
            cost: sql<number>`sum(${messages.cost})`,
            count: sql<number>`count(*)`
        })
            .from(messages)
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), eq(messages.role, 'assistant')))
            .groupBy(messages.model)
            .all();

        // Council Models
        const councilModels = await db.select({
            modelId: councilResponses.model_id,
            cost: sql<number>`sum(${councilResponses.cost})`,
            count: sql<number>`count(*)`
        })
            .from(councilResponses)
            .innerJoin(messages, eq(councilResponses.message_id, messages.id))
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(eq(chats.user_id, userId))
            .groupBy(councilResponses.model_id)
            .all();

        // Merge Model Stats
        const modelMap = new Map<string, { modelId: string, cost: number, count: number }>();

        [...judgeModels, ...councilModels].forEach(item => {
            if (!item.modelId) return;
            const existing = modelMap.get(item.modelId) || { modelId: item.modelId, cost: 0, count: 0 };
            existing.cost += item.cost || 0;
            existing.count += item.count;
            modelMap.set(item.modelId, existing);
        });

        const modelBreakdown = Array.from(modelMap.values()).sort((a, b) => b.cost - a.cost);

        return NextResponse.json({
            totalChats,
            totalTokens,
            totalCost,
            dailyUsage,
            modelBreakdown
        });

    } catch (err) {
        console.error('Analytics error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
