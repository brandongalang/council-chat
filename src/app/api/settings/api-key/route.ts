import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userApiKeys, profiles } from '@/db/schema';
import { encrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';

// Hardcoded user ID for local-only mode, matching src/app/api/chat/route.ts
const USER_ID = 'local-user';

async function ensureLocalUser() {
  const existingUser = await db.select().from(profiles).where(eq(profiles.id, USER_ID)).get();
  if (!existingUser) {
    await db.insert(profiles).values({
      id: USER_ID,
      email: 'local@user.com',
      full_name: 'Local User',
    });
  }
}

export async function POST(request: Request) {
  await ensureLocalUser();

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
      where: (keys, { and, eq }) => and(eq(keys.user_id, USER_ID), eq(keys.provider, 'openrouter'))
    });

    if (existingKey) {
      await db.update(userApiKeys)
        .set({ encrypted_key: encryptedKey, updated_at: new Date().toISOString() })
        .where(eq(userApiKeys.id, existingKey.id));
    } else {
      await db.insert(userApiKeys).values({
        user_id: USER_ID,
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

export async function GET(request: Request) {
  await ensureLocalUser();

  try {
    const keyRecord = await db.query.userApiKeys.findFirst({
      where: (keys, { and, eq }) => and(eq(keys.user_id, USER_ID), eq(keys.provider, 'openrouter'))
    });

    return NextResponse.json({ hasKey: !!keyRecord });
  } catch (err) {
    console.error('Error fetching API key status:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await ensureLocalUser();

  try {
    await db.delete(userApiKeys)
      .where(eq(userApiKeys.user_id, USER_ID));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting API key:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
