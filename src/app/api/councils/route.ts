import { NextResponse } from 'next/server';
import { db } from '@/db';
import { councils, councilModels } from '@/db/schema';
import { eq } from 'drizzle-orm';

const DEMO_USER_ID = 'demo-user';

export async function GET() {
    try {
        const userCouncils = await db.select().from(councils).where(eq(councils.user_id, DEMO_USER_ID));

        const results = await Promise.all(userCouncils.map(async (council) => {
            const models = await db.select().from(councilModels).where(eq(councilModels.council_id, council.id));
            return {
                ...council,
                models: models.map(m => ({
                    model_id: m.model_id,
                    prompt_template_id: m.prompt_template_id,
                    system_prompt_override: m.system_prompt_override
                }))
            };
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error fetching councils:', error);
        return NextResponse.json({ error: 'Failed to fetch councils' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, judgeModel, judgePrompt, members } = body;

        const [newCouncil] = await db.insert(councils).values({
            user_id: DEMO_USER_ID,
            name,
            description,
            judge_model: judgeModel,
            judge_settings: JSON.stringify({ systemPrompt: judgePrompt }),
        }).returning();

        if (members && members.length > 0) {
            await db.insert(councilModels).values(
                members.map((m: any) => ({
                    council_id: newCouncil.id,
                    model_id: m.modelId,
                    prompt_template_id: m.promptTemplateId,
                    system_prompt_override: m.customPrompt || m.persona // Support both new and legacy
                }))
            );
        }

        const models = await db.select().from(councilModels).where(eq(councilModels.council_id, newCouncil.id));

        return NextResponse.json({
            ...newCouncil,
            models: models.map(m => ({
                model_id: m.model_id,
                prompt_template_id: m.prompt_template_id,
                system_prompt_override: m.system_prompt_override
            }))
        });
    } catch (error) {
        console.error('Error creating council:', error);
        return NextResponse.json({ error: 'Failed to create council' }, { status: 500 });
    }
}
