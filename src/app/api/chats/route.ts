import { db } from '@/db';
import { chats } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppConfig } from '@/config/app-config';

export async function GET() {
    const userId = AppConfig.defaultUser.id;

    try {
        const userChats = await db.query.chats.findMany({
            where: eq(chats.user_id, userId),
            orderBy: [desc(chats.updated_at)],
        });

        return NextResponse.json(userChats);
    } catch (err) {
        console.error('Error fetching chats:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
