import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userApiKeys } from '@/db/schema';
import { encrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';
import { ensureDefaultUser } from '@/lib/api-utils';

export async function POST(request: Request) {
  const userId = await ensureDefaultUser();

  const body = await request.json();
  const { apiKey } = body;

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
  }

  try {
    const encryptedKey = encrypt(apiKey);
    
    // Upsert key
    // We only support one key per provider ('openrouter') for now
    const existingKey = await db.query.userApiKeys.findFirst({
        where: (keys, { and, eq }) => and(eq(keys.user_id, userId), eq(keys.provider, 'openrouter'))
    });

    if (existingKey) {
        await db.update(userApiKeys)
            .set({ encrypted_key: encryptedKey, updated_at: new Date() })
            .where(eq(userApiKeys.id, existingKey.id));
    } else {
        await db.insert(userApiKeys).values({
            user_id: userId,
            provider: 'openrouter',
            encrypted_key: encryptedKey,
        });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error saving API key:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
    const userId = await ensureDefaultUser();

    try {
        const keyRecord = await db.query.userApiKeys.findFirst({
            where: (keys, { and, eq }) => and(eq(keys.user_id, userId), eq(keys.provider, 'openrouter'))
        });

        return NextResponse.json({ hasKey: !!keyRecord });
    } catch (err) {
        console.error('Error fetching API key status:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE() {
    const userId = await ensureDefaultUser();

    try {
        await db.delete(userApiKeys)
            .where(eq(userApiKeys.user_id, userId));
        
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting API key:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
