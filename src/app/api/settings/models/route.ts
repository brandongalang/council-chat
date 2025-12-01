import { NextResponse } from 'next/server';
import { db } from '@/db';
import { savedModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const DEMO_USER_ID = 'demo-user';

export async function GET() {
    try {
        const models = await db.select().from(savedModels).where(eq(savedModels.user_id, DEMO_USER_ID));
        return NextResponse.json(models);
    } catch (error) {
        console.error('Error fetching saved models:', error);
        return NextResponse.json({ error: 'Failed to fetch saved models' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { modelId, name } = body;

        // Check for duplicates
        const [existing] = await db.select().from(savedModels).where(
            and(
                eq(savedModels.user_id, DEMO_USER_ID),
                eq(savedModels.model_id, modelId)
            )
        );

        if (existing) {
            return NextResponse.json({ error: 'Model already saved' }, { status: 400 });
        }

        const [newModel] = await db.insert(savedModels).values({
            user_id: DEMO_USER_ID,
            model_id: modelId,
            name: name || modelId
        }).returning();

        return NextResponse.json(newModel);
    } catch (error) {
        console.error('Error saving model:', error);
        return NextResponse.json({ error: 'Failed to save model' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }

        await db.delete(savedModels).where(
            and(
                eq(savedModels.id, id),
                eq(savedModels.user_id, DEMO_USER_ID)
            )
        );

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting saved model:', error);
        return NextResponse.json({ error: 'Failed to delete saved model' }, { status: 500 });
    }
}
