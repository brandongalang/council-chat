import { db } from '@/db';
import { messages, chats } from '@/db/schema';
import { sql, eq, and, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppConfig } from '@/config/app-config';

export async function GET() {
    const userId = AppConfig.defaultUser.id;

    try {
        // 1. Total Chats
        const totalChatsResult = await db.select({ count: sql<number>`count(*)` })
            .from(chats)
            .where(eq(chats.user_id, userId))
            .get();
        const totalChats = totalChatsResult?.count || 0;

        // 2. Total Stats from messages
        const messageStats = await db.select({
            count: sql<number>`count(*)`,
            promptTokens: sql<number>`sum(${messages.prompt_tokens})`,
            completionTokens: sql<number>`sum(${messages.completion_tokens})`,
            cost: sql<number>`sum(${messages.cost})`
        })
            .from(messages)
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), eq(messages.role, 'assistant')))
            .get();

        const totalTokens = (messageStats?.promptTokens || 0) + (messageStats?.completionTokens || 0);
        const totalCost = messageStats?.cost || 0;

        // 3. Daily Usage (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString();

        const dailyUsage = await db.select({
            date: sql<string>`date(${messages.created_at})`,
            tokens: sql<number>`sum(coalesce(${messages.prompt_tokens}, 0) + coalesce(${messages.completion_tokens}, 0))`,
            cost: sql<number>`sum(coalesce(${messages.cost}, 0))`
        })
            .from(messages)
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), gte(messages.created_at, dateStr), eq(messages.role, 'assistant')))
            .groupBy(sql`date(${messages.created_at})`)
            .orderBy(sql`date(${messages.created_at})`)
            .all();

        // 4. Model Breakdown
        const modelBreakdown = await db.select({
            modelId: messages.model,
            cost: sql<number>`sum(${messages.cost})`,
            count: sql<number>`count(*)`
        })
            .from(messages)
            .innerJoin(chats, eq(messages.chat_id, chats.id))
            .where(and(eq(chats.user_id, userId), eq(messages.role, 'assistant')))
            .groupBy(messages.model)
            .orderBy(sql`sum(${messages.cost}) DESC`)
            .all();

        return NextResponse.json({
            totalChats,
            totalTokens,
            totalCost,
            dailyUsage,
            modelBreakdown: modelBreakdown.filter(m => m.modelId)
        });

    } catch (err) {
        console.error('Analytics error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
