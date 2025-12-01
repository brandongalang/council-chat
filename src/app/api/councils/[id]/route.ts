import { NextResponse } from 'next/server';
import { db } from '@/db';
import { councils, councilModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const DEMO_USER_ID = 'demo-user';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [council] = await db.select().from(councils).where(and(eq(councils.id, id), eq(councils.user_id, DEMO_USER_ID)));

        if (!council) {
            return NextResponse.json({ error: 'Council not found' }, { status: 404 });
        }

        const models = await db.select().from(councilModels).where(eq(councilModels.council_id, id));

        return NextResponse.json({
            ...council,
            models: models.map(m => ({
                model_id: m.model_id,
                system_prompt_override: m.system_prompt_override
            }))
        });
    } catch (error) {
        console.error('Error fetching council:', error);
        return NextResponse.json({ error: 'Failed to fetch council' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, judgeModel, judgePrompt, members } = body;

        // Verify ownership
        const [existingCouncil] = await db.select().from(councils).where(and(eq(councils.id, id), eq(councils.user_id, DEMO_USER_ID)));
        if (!existingCouncil) {
            return NextResponse.json({ error: 'Council not found' }, { status: 404 });
        }

        // Update council
        await db.update(councils)
            .set({
                name,
                description,
                judge_model: judgeModel,
                judge_settings: JSON.stringify({ systemPrompt: judgePrompt }),
                updated_at: new Date().toISOString()
            })
            .where(eq(councils.id, id));

        // Update members (delete all and re-insert)
        await db.delete(councilModels).where(eq(councilModels.council_id, id));

        if (members && members.length > 0) {
            await db.insert(councilModels).values(
                members.map((m: any) => ({
                    council_id: id,
                    model_id: m.modelId,
                    system_prompt_override: m.persona
                }))
            );
        }

        const updatedModels = await db.select().from(councilModels).where(eq(councilModels.council_id, id));
        const [updatedCouncil] = await db.select().from(councils).where(eq(councils.id, id));

        return NextResponse.json({
            ...updatedCouncil,
            models: updatedModels.map(m => ({
                model_id: m.model_id,
                system_prompt_override: m.system_prompt_override
            }))
        });
    } catch (error) {
        console.error('Error updating council:', error);
        return NextResponse.json({ error: 'Failed to update council' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verify ownership
        const [existingCouncil] = await db.select().from(councils).where(and(eq(councils.id, id), eq(councils.user_id, DEMO_USER_ID)));
        if (!existingCouncil) {
            return NextResponse.json({ error: 'Council not found' }, { status: 404 });
        }

        await db.delete(councils).where(eq(councils.id, id));
        // Cascade delete handles councilModels

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting council:', error);
        return NextResponse.json({ error: 'Failed to delete council' }, { status: 500 });
    }
}
