import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration for database migrations and studio.
 * Using SQLite for local-only mode.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './sqlite.db',
  },
});
