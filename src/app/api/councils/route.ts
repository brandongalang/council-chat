import { db } from '@/db';
import { councils, councilModels } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
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

export async function GET() {
  const userId = AppConfig.defaultUser.id;

  try {
    // Fetch councils with their models and judge prompt metadata
    const userCouncils = await db.query.councils.findMany({
      where: eq(councils.user_id, userId),
      orderBy: [desc(councils.updated_at)],
      with: {
        models: true,
        judgePrompt: true,
      }
    });

    return NextResponse.json(userCouncils);
  } catch (err) {
    console.error('Error fetching councils:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = AppConfig.defaultUser.id;

  try {
    const body = await req.json();
    const { name, judgeModel, judgePrompt, judgePromptId } = body;
    const members = normalizeMembers(body.members ?? body.models);

    if (!name || !judgeModel || members.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Transaction to insert council and its models
    const result = await db.transaction(async (tx) => {
      const [newCouncil] = await tx.insert(councils).values({
        user_id: userId,
        name,
        description: body.description ?? null,
        judge_model: judgeModel,
        judge_prompt_id: judgePromptId || null,
        judge_settings: judgePrompt
          ? JSON.stringify({ systemPrompt: judgePrompt })
          : JSON.stringify({}),
      }).returning();

      if (!newCouncil) throw new Error('Failed to create council');

      const modelValues = members.map((member) => ({
        council_id: newCouncil.id,
        model_id: member.modelId,
        system_prompt_override: member.persona,
      }));

      await tx.insert(councilModels).values(modelValues);

      return newCouncil;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error creating council:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
