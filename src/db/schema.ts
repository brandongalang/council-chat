import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

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
  cost: real("cost"),
  model: text("model"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const councils = sqliteTable("councils", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").notNull(), // No reference for now as we use demo-user
  name: text("name").notNull(),
  description: text("description"),
  judge_model: text("judge_model"),
  judge_settings: text("judge_settings", { mode: 'json' }),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const councilModels = sqliteTable("council_models", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  council_id: text("council_id").references(() => councils.id, { onDelete: 'cascade' }).notNull(),
  model_id: text("model_id").notNull(),
  settings: text("settings", { mode: 'json' }),
  prompt_template_id: text("prompt_template_id"), // Reference to built-in template
  system_prompt_override: text("system_prompt_override"), // Custom prompt (takes precedence)
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const savedModels = sqliteTable("saved_models", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").notNull(), // No reference for now as we use demo-user
  model_id: text("model_id").notNull(),
  name: text("name"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userCouncilPrompts = sqliteTable("user_council_prompts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  system_prompt: text("system_prompt").notNull(),
  tags: text("tags", { mode: 'json' }),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userSynthesizerPrompts = sqliteTable("user_synthesizer_prompts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  system_prompt: text("system_prompt").notNull(),
  tags: text("tags", { mode: 'json' }),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});
