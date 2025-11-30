import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(), // Should reference auth.users.id
  email: text("email"),
  full_name: text("full_name"),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userApiKeys = sqliteTable("user_api_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  provider: text("provider").default('openrouter').notNull(),
  encrypted_key: text("encrypted_key").notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const councils = sqliteTable("councils", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  judge_model: text("judge_model"), // e.g. "openai/gpt-4o"
  judge_settings: text("judge_settings").default('{}'), // JSON string
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const councilModels = sqliteTable("council_models", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  council_id: text("council_id").references(() => councils.id, { onDelete: 'cascade' }).notNull(),
  model_id: text("model_id").notNull(), // e.g. "anthropic/claude-3-opus"
  settings: text("settings").default('{}'), // JSON string
  system_prompt_override: text("system_prompt_override"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chat_id: text("chat_id").references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  annotations: text("annotations", { mode: 'json' }), // JSON string for Council data
  prompt_tokens: integer("prompt_tokens"),
  completion_tokens: integer("completion_tokens"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const councilResponses = sqliteTable("council_responses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  message_id: text("message_id").references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  model_id: text("model_id").notNull(),
  content: text("content"),
  prompt_tokens: integer("prompt_tokens"),
  completion_tokens: integer("completion_tokens"),
  cost: real("cost"),
  duration_ms: integer("duration_ms"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});
