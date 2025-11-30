import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/** Database connection string from environment variables. */
const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

/**
 * Drizzle ORM database instance.
 * configured with the postgres client and the schema.
 */
export const db = drizzle(client, { schema });
