import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userApiKeys, profiles } from '@/db/schema';
import { encrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { apiKey } = body;

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
  }

  try {
    const encryptedKey = encrypt(apiKey);
    
    // Ensure profile exists (supabase auth user might not be in public.profiles yet if trigger failed or first time)
    // Upsert profile first
    await db.insert(profiles).values({
        id: user.id,
        email: user.email,
    }).onConflictDoNothing();

    // Upsert key
    // We only support one key per provider ('openrouter') for now
    const existingKey = await db.query.userApiKeys.findFirst({
        where: (keys, { and, eq }) => and(eq(keys.user_id, user.id), eq(keys.provider, 'openrouter'))
    });

    if (existingKey) {
        await db.update(userApiKeys)
            .set({ encrypted_key: encryptedKey, updated_at: new Date() })
            .where(eq(userApiKeys.id, existingKey.id));
    } else {
        await db.insert(userApiKeys).values({
            user_id: user.id,
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
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
  
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const keyRecord = await db.query.userApiKeys.findFirst({
            where: (keys, { and, eq }) => and(eq(keys.user_id, user.id), eq(keys.provider, 'openrouter'))
        });

        return NextResponse.json({ hasKey: !!keyRecord });
    } catch (err) {
        console.error('Error fetching API key status:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
  
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await db.delete(userApiKeys)
            .where(eq(userApiKeys.user_id, user.id));
        
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting API key:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
