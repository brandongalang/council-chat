import { db } from '@/db';
import { prompts, councils, councilModels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AppConfig } from '@/config/app-config';

/**
 * GET /api/prompts/[id]
 * Get a single prompt by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = AppConfig.defaultUser.id;
  const { id } = await params;

  try {
    const prompt = await db.query.prompts.findFirst({
      where: (p, { and, eq: e }) => and(e(p.id, id), e(p.user_id, userId)),
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (err) {
    console.error('Error fetching prompt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/prompts/[id]
 * Update a prompt
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = AppConfig.defaultUser.id;
  const { id } = await params;

  try {
    const { name, content, type, description } = await req.json();

    // Verify ownership
    const existing = await db.query.prompts.findFirst({
      where: (p, { and, eq: e }) => and(e(p.id, id), e(p.user_id, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Don't allow editing system prompts
    if (existing.is_system) {
      return NextResponse.json(
        { error: 'Cannot edit system prompts' },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(prompts)
      .set({
        name: name ?? existing.name,
        content: content ?? existing.content,
        type: type ?? existing.type,
        description: description !== undefined ? description : existing.description,
        updated_at: new Date(),
      })
      .where(eq(prompts.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating prompt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/prompts/[id]
 * Delete a prompt (returns usage info if in use)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = AppConfig.defaultUser.id;
  const { id } = await params;

  try {
    // Verify ownership
    const existing = await db.query.prompts.findFirst({
      where: (p, { and, eq: e }) => and(e(p.id, id), e(p.user_id, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Don't allow deleting system prompts
    if (existing.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system prompts' },
        { status: 403 }
      );
    }

    // Check if prompt is in use by any councils
    const councilsUsingAsJudge = await db
      .select({ id: councils.id, name: councils.name })
      .from(councils)
      .where(eq(councils.judge_prompt_id, id));

    const modelsUsingPrompt = await db
      .select({
        council_id: councilModels.council_id,
        model_id: councilModels.model_id
      })
      .from(councilModels)
      .where(eq(councilModels.prompt_id, id));

    // If in use, return info about usage (allow deletion anyway, refs will be nulled)
    const usageInfo = {
      judgeUsage: councilsUsingAsJudge.length,
      memberUsage: modelsUsingPrompt.length,
    };

    // Delete the prompt (foreign keys are set to SET NULL)
    await db.delete(prompts).where(eq(prompts.id, id));

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted',
      usage: usageInfo
    });
  } catch (err) {
    console.error('Error deleting prompt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
