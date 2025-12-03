import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AppConfig } from '@/config/app-config';

/**
 * Ensures the default local user profile exists and returns the user ID.
 * Local development uses a single hard-coded user; this helper centralizes
 * the creation logic to avoid duplicating it across API routes.
 */
export async function ensureDefaultUser(): Promise<string> {
  const userId = AppConfig.defaultUser.id;

  const existingUser = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .get();

  if (!existingUser) {
    await db.insert(profiles).values({
      id: userId,
      email: AppConfig.defaultUser.email,
      full_name: AppConfig.defaultUser.name,
    });
  }

  return userId;
}

