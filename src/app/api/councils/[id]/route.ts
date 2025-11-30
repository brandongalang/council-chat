import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { councils } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const council = await db.query.councils.findFirst({
            where: and(eq(councils.id, id), eq(councils.user_id, user.id)),
            with: {
                models: true
            }
        });

        if (!council) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(council);
    } catch (err) {
        console.error('Error fetching council:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Verify ownership and delete
        const deleted = await db.delete(councils)
            .where(and(eq(councils.id, id), eq(councils.user_id, user.id)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting council:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
