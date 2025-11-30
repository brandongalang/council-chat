import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userChats = await db.query.chats.findMany({
            where: eq(chats.user_id, user.id),
            orderBy: [desc(chats.updated_at)],
        });

        return NextResponse.json(userChats);
    } catch (err) {
        console.error('Error fetching chats:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
