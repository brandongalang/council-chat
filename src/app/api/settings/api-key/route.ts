import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userApiKeys, profiles } from '@/db/schema';
import { encrypt, decrypt } from '@/lib/encryption';
import { eq, and } from 'drizzle-orm';
import { AppConfig } from '@/config/app-config';

const USER_ID = AppConfig.defaultUser.id;
const PROVIDER = 'openrouter';

/**
 * GET /api/settings/api-key
 * Check if user has an API key configured
 */
export async function GET() {
    try {
        const keyRecord = await db.query.userApiKeys.findFirst({
            where: (keys, { and, eq }) => and(
                eq(keys.user_id, USER_ID),
                eq(keys.provider, PROVIDER)
            )
        });

        return NextResponse.json({ hasKey: !!keyRecord });
    } catch (error) {
        console.error('Error checking API key:', error);
        return NextResponse.json({ error: 'Failed to check API key status' }, { status: 500 });
    }
}

/**
 * POST /api/settings/api-key
 * Save or update user's API key
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { apiKey } = body;

        if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
            return NextResponse.json({ error: 'API key is required' }, { status: 400 });
        }

        // Encrypt the API key
        const encryptedKey = encrypt(apiKey.trim());

        // Check if key already exists
        const existingKey = await db.query.userApiKeys.findFirst({
            where: (keys, { and, eq }) => and(
                eq(keys.user_id, USER_ID),
                eq(keys.provider, PROVIDER)
            )
        });

        if (existingKey) {
            // Update existing key
            await db.update(userApiKeys)
                .set({
                    encrypted_key: encryptedKey,
                    updated_at: new Date().toISOString(),
                })
                .where(
                    and(
                        eq(userApiKeys.user_id, USER_ID),
                        eq(userApiKeys.provider, PROVIDER)
                    )
                );
        } else {
            // Insert new key
            await db.insert(userApiKeys).values({
                user_id: USER_ID,
                provider: PROVIDER,
                encrypted_key: encryptedKey,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving API key:', error);
        return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 });
    }
}

/**
 * DELETE /api/settings/api-key
 * Remove user's API key
 */
export async function DELETE() {
    try {
        await db.delete(userApiKeys).where(
            and(
                eq(userApiKeys.user_id, USER_ID),
                eq(userApiKeys.provider, PROVIDER)
            )
        );

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting API key:', error);
        return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }
}
