import { db } from '@/db';
import { councils, councilModels } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppConfig } from '@/config/app-config';

export async function GET() {
  const userId = AppConfig.defaultUser.id;

  try {
    // Fetch councils with their models
    const userCouncils = await db.query.councils.findMany({
      where: eq(councils.user_id, userId),
      orderBy: [desc(councils.updated_at)],
      with: {
        models: true
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
    const { name, description, judgeModel, members, judgePrompt } = body;

    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Transaction to insert council and its models
    const result = await db.transaction(async (tx) => {
      const [newCouncil] = await tx.insert(councils).values({
        user_id: userId,
        name,
        description,
        judge_model: judgeModel,
        judge_settings: JSON.stringify({ systemPrompt: judgePrompt }),
      }).returning();

      if (!newCouncil) throw new Error('Failed to create council');

      const modelValues = members.map((member: string | { modelId: string; persona?: string }) => {
        if (typeof member === 'string') {
          return {
            council_id: newCouncil.id,
            model_id: member,
          };
        }
        return {
          council_id: newCouncil.id,
          model_id: member.modelId,
          system_prompt_override: member.persona,
        };
      });

      await tx.insert(councilModels).values(modelValues);

      return newCouncil;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error creating council:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
