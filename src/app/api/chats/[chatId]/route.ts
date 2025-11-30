import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;

    try {
        // Verify chat ownership
        const chat = await db.query.chats.findFirst({
            where: (c, { and, eq }) => and(eq(c.id, chatId), eq(c.user_id, user.id))
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
