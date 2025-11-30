import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { councils, councilModels } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch councils with their models
    const userCouncils = await db.query.councils.findMany({
      where: eq(councils.user_id, user.id),
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
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, judgeModel, members } = body;

    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Transaction to insert council and its models
    const result = await db.transaction(async (tx) => {
      const [newCouncil] = await tx.insert(councils).values({
        user_id: user.id,
        name,
        description,
        judge_model: judgeModel,
      }).returning();

      if (!newCouncil) throw new Error('Failed to create council');

      const modelValues = members.map((modelId: string) => ({
        council_id: newCouncil.id,
        model_id: modelId,
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
