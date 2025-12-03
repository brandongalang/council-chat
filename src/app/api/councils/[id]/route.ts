import { db } from '@/db';
import { councilModels, councils } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppConfig } from '@/config/app-config';

const normalizeMembers = (raw: unknown): Array<{ modelId: string; persona?: string }> => {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((member) => {
            if (typeof member === 'string') {
                return { modelId: member };
            }
            if (member && typeof member === 'object' && 'modelId' in member) {
                const modelId = (member as { modelId?: unknown }).modelId;
                if (typeof modelId === 'string' && modelId.trim().length > 0) {
                    const persona = (member as { persona?: unknown }).persona;
                    return {
                        modelId,
                        persona: typeof persona === 'string' && persona.length > 0 ? persona : undefined,
                    };
                }
            }
            return null;
        })
        .filter((value): value is { modelId: string; persona?: string } => value !== null);
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = AppConfig.defaultUser.id;
    const { id } = await params;

    try {
        const council = await db.query.councils.findFirst({
            where: and(eq(councils.id, id), eq(councils.user_id, userId)),
            with: {
                models: true,
                judgePrompt: true,
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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = AppConfig.defaultUser.id;
    const { id } = await params;

    try {
        const body = await request.json();
        const { name, judgeModel, judgePromptId, judgePrompt } = body;
        const members = normalizeMembers(body.members ?? body.models);

        if (!name || !judgeModel || members.length === 0) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const existing = await db.query.councils.findFirst({
            where: and(eq(councils.id, id), eq(councils.user_id, userId)),
        });

        if (!existing) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const updated = await db.transaction(async (tx) => {
            await tx.update(councils)
                .set({
                    name,
                    judge_model: judgeModel,
                    judge_prompt_id: judgePromptId || null,
                    judge_settings: judgePrompt !== undefined
                        ? (judgePrompt ? JSON.stringify({ systemPrompt: judgePrompt }) : JSON.stringify({}))
                        : existing.judge_settings,
                    updated_at: new Date(),
                })
                .where(eq(councils.id, id));

            await tx.delete(councilModels).where(eq(councilModels.council_id, id));
            await tx.insert(councilModels).values(
                members.map(member => ({
                    council_id: id,
                    model_id: member.modelId,
                    system_prompt_override: member.persona,
                }))
            );

            return tx.query.councils.findFirst({
                where: eq(councils.id, id),
                with: {
                    models: true,
                    judgePrompt: true,
                }
            });
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error('Error updating council:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = AppConfig.defaultUser.id;
    const { id } = await params;

    try {
        // Verify ownership and delete
        const deleted = await db.delete(councils)
            .where(and(eq(councils.id, id), eq(councils.user_id, userId)))
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
