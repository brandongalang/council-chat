import { db } from '@/db';
import { messages } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppConfig } from '@/config/app-config';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    const userId = AppConfig.defaultUser.id;
    const { chatId } = await params;

    try {
        // Verify chat ownership
        const chat = await db.query.chats.findFirst({
            where: (c, { and, eq }) => and(eq(c.id, chatId), eq(c.user_id, userId))
        });

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        const chatMessages = await db.query.messages.findMany({
            where: eq(messages.chat_id, chatId),
            orderBy: [asc(messages.created_at)],
        });

        return NextResponse.json(chatMessages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
