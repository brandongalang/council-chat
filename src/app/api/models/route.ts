import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { decrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';

export async function GET() {
    // Local-only mode: Hardcoded user
    const userId = 'local-user';

    try {
        // 1. Get API Key from database
        const keyRecord = await db.query.userApiKeys.findFirst({
            where: (keys, { and, eq }) => and(eq(keys.user_id, userId), eq(keys.provider, 'openrouter'))
        });

        if (!keyRecord) {
            return NextResponse.json({ error: 'OpenRouter API Key not configured' }, { status: 400 });
        }

        const apiKey = decrypt(keyRecord.encrypted_key);

        // 2. Fetch models from OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const data = await response.json();

        // 3. Return the models
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }
}
