import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userApiKeys } from '@/db/schema';
import { decrypt } from '@/lib/encryption';
import { AppConfig } from '@/config/app-config';

export async function GET() {
  const userId = AppConfig.defaultUser.id;

  try {
    // Get API key for authenticated request (optional - OpenRouter models endpoint is public)
    const keyRecord = await db.query.userApiKeys.findFirst({
      where: (keys, { and, eq }) => and(eq(keys.user_id, userId), eq(keys.provider, 'openrouter'))
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if available for better rate limits
    if (keyRecord) {
      try {
        const apiKey = decrypt(keyRecord.encrypted_key);
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      } catch (e) {
        // Continue without auth - models endpoint is public
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers,
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to simpler format
    const models = data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      provider: model.id.split('/')[0] || 'Unknown',
      context_length: model.context_length,
      pricing: model.pricing,
    }));

    return NextResponse.json(models);
  } catch (err) {
    console.error('Error fetching models:', err);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
