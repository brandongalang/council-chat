import { db } from '@/db';
import { prompts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppConfig } from '@/config/app-config';

/**
 * GET /api/prompts
 * List all prompts for the current user
 */
export async function GET(req: Request) {
  const userId = AppConfig.defaultUser.id;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'judge' | 'member' | null (all)

    const query = db.query.prompts.findMany({
      where: type
        ? (p, { and, eq: e }) => and(e(p.user_id, userId), e(p.type, type))
        : eq(prompts.user_id, userId),
      orderBy: [desc(prompts.updated_at)],
    });

    const userPrompts = await query;
    return NextResponse.json(userPrompts);
  } catch (err) {
    console.error('Error fetching prompts:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/prompts
 * Create a new prompt
 */
export async function POST(req: Request) {
  const userId = AppConfig.defaultUser.id;

  try {
    const { name, content, type, description } = await req.json();

    if (!name || !content || !type) {
      return NextResponse.json(
        { error: 'Name, content, and type are required' },
        { status: 400 }
      );
    }

    if (!['judge', 'member'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "judge" or "member"' },
        { status: 400 }
      );
    }

    const [newPrompt] = await db.insert(prompts).values({
      user_id: userId,
      name,
      content,
      type,
      description: description || null,
    }).returning();

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (err) {
    console.error('Error creating prompt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
