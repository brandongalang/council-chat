import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

/** SQLite database file path */
const dbPath = path.join(process.cwd(), 'sqlite.db');

/** SQLite database instance */
const sqlite = new Database(dbPath);

/**
 * Drizzle ORM database instance.
 * Configured with better-sqlite3 for local-only mode.
 */
export const db = drizzle(sqlite, { schema });
