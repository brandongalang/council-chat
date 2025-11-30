import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(), // Should reference auth.users.id
  email: text("email"),
  full_name: text("full_name"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const userApiKeys = pgTable("user_api_keys", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  provider: text("provider").default('openrouter').notNull(),
  encrypted_key: text("encrypted_key").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const councils = pgTable("councils", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  judge_model: text("judge_model"), // e.g. "openai/gpt-4o"
  judge_settings: text("judge_settings").default('{}'), // JSON string
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const councilModels = pgTable("council_models", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  council_id: uuid("council_id").references(() => councils.id, { onDelete: 'cascade' }).notNull(),
  model_id: text("model_id").notNull(), // e.g. "anthropic/claude-3-opus"
  settings: text("settings").default('{}'), // JSON string
  system_prompt_override: text("system_prompt_override"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  chat_id: uuid("chat_id").references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  annotations: text("annotations"), // JSON string for Council data
  created_at: timestamp("created_at").defaultNow().notNull(),
});
