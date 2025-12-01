import { NextResponse } from 'next/server';
import { db } from '@/db';
import { savedModels, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Hardcoded user ID for local-only mode
const USER_ID = 'local-user';

async function ensureLocalUser() {
    const existingUser = await db.select().from(profiles).where(eq(profiles.id, USER_ID)).get();
    if (!existingUser) {
        await db.insert(profiles).values({
            id: USER_ID,
            email: 'local@user.com',
            full_name: 'Local User',
        });
    }
}

export async function GET() {
    await ensureLocalUser();

    try {
        const models = await db.select().from(savedModels).where(eq(savedModels.user_id, USER_ID));
        return NextResponse.json(models);
    } catch (error) {
        console.error('Error fetching saved models:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await ensureLocalUser();

    try {
        const body = await request.json();
        const { modelId, name } = body;

        if (!modelId) {
            return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
        }

        // Check if already saved
        const existing = await db.select().from(savedModels).where(
            and(
                eq(savedModels.user_id, USER_ID),
                eq(savedModels.model_id, modelId)
            )
        ).get();

        if (existing) {
            return NextResponse.json({ error: 'Model already saved' }, { status: 400 });
        }

        const newModel = await db.insert(savedModels).values({
            user_id: USER_ID,
            model_id: modelId,
            name: name || null,
        }).returning().get();

        return NextResponse.json(newModel);
    } catch (error) {
        console.error('Error saving model:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    await ensureLocalUser();

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.delete(savedModels).where(
            and(
                eq(savedModels.id, id),
                eq(savedModels.user_id, USER_ID)
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting saved model:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
