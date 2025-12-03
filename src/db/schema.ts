import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Table schema for user profiles.
 * Local-only mode user storage.
 */
export const profiles = sqliteTable("profiles", {
  /** Primary key */
  id: text("id").primaryKey().notNull(),
  /** User's email address */
  email: text("email"),
  /** User's full name */
  full_name: text("full_name"),
  /** Timestamp of last update */
  updated_at: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Table schema for storing user API keys (encrypted).
 * Used for BYOK (Bring Your Own Key) functionality.
 */
export const userApiKeys = sqliteTable("user_api_keys", {
  /** Unique identifier for the API key entry */
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  /** Foreign key to profiles table */
  user_id: text("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  /** The provider of the API key (e.g., 'openrouter') */
  provider: text("provider").default('openrouter').notNull(),
  /** The encrypted API key string */
  encrypted_key: text("encrypted_key").notNull(),
  /** Timestamp of creation */
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  /** Timestamp of last update */
  updated_at: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Table schema for reusable prompts.
 * Prompts can be used across multiple councils for judges or members.
 */
export const prompts = sqliteTable("prompts", {
  /** Unique identifier for the prompt */
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  /** Foreign key to profiles table (owner) */
  user_id: text("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  /** Name of the prompt */
  name: text("name").notNull(),
  /** The actual prompt content/instructions */
  content: text("content").notNull(),
  /** Type of prompt: 'judge' for synthesizers, 'member' for council members */
  type: text("type").notNull(), // 'judge' | 'member'
  /** Optional description of what this prompt does */
  description: text("description"),
  /** Whether this is a system-provided default prompt */
  is_system: integer("is_system", { mode: "boolean" }).default(false),
  /** Timestamp of creation */
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  /** Timestamp of last update */
  updated_at: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Table schema for Councils.
 * A Council represents a group of AI models and settings.
 */
export const councils = sqliteTable("councils", {
  /** Unique identifier for the Council */
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  /** Foreign key to profiles table (owner) */
  user_id: text("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  /** Name of the Council */
  name: text("name").notNull(),
  /** Description of the Council */
  description: text("description"),
  /** The model ID used as the Judge */
  judge_model: text("judge_model"),
  /** Foreign key to prompts table for judge prompt */
  judge_prompt_id: text("judge_prompt_id").references(() => prompts.id, { onDelete: 'set null' }),
  /** JSON string for Judge model settings (legacy, use judge_prompt_id instead) */
  judge_settings: text("judge_settings").default('{}'),
  /** Timestamp of creation */
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  /** Timestamp of last update */
  updated_at: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Table schema for associating models with a Council.
 */
export const councilModels = sqliteTable("council_models", {
  /** Unique identifier for the Council Model association */
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  /** Foreign key to councils table */
  council_id: text("council_id").references(() => councils.id, { onDelete: 'cascade' }).notNull(),
  /** The model identifier string */
  model_id: text("model_id").notNull(),
  /** JSON string for model specific settings */
  settings: text("settings").default('{}'),
  /** Foreign key to prompts table for member prompt */
  prompt_id: text("prompt_id").references(() => prompts.id, { onDelete: 'set null' }),
  /** Optional override for the system prompt (legacy, use prompt_id instead) */
  system_prompt_override: text("system_prompt_override"),
  /** Optional prompt template ID (legacy) */
  prompt_template_id: text("prompt_template_id"),
  /** Timestamp of creation */
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Table schema for chat sessions.
 */
export const chats = sqliteTable("chats", {
  /** Unique identifier for the chat session */
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  /** Foreign key to profiles table (owner) */
  user_id: text("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  /** Title of the chat session */
  title: text("title").notNull(),
  /** Timestamp of creation */
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  /** Timestamp of last update */
  updated_at: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Table schema for chat messages.
 */
export const messages = sqliteTable("messages", {
  /** Unique identifier for the message */
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  /** Foreign key to chats table */
  chat_id: text("chat_id").references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  /** The role of the message sender ('user' or 'assistant') */
  role: text("role").notNull(),
  /** The content of the message */
  content: text("content").notNull(),
  /** JSON string for additional metadata/annotations */
  annotations: text("annotations"),
  /** Number of tokens in the prompt */
  prompt_tokens: integer("prompt_tokens"),
  /** Number of tokens in the completion */
  completion_tokens: integer("completion_tokens"),
  /** Cost of the API call */
  cost: text("cost"),
  /** Model used for the message */
  model: text("model"),
  /** Timestamp of creation */
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Relations
export const councilsRelations = relations(councils, ({ many, one }) => ({
  models: many(councilModels),
  judgePrompt: one(prompts, {
    fields: [councils.judge_prompt_id],
    references: [prompts.id],
  }),
}));

export const councilModelsRelations = relations(councilModels, ({ one }) => ({
  council: one(councils, {
    fields: [councilModels.council_id],
    references: [councils.id],
  }),
  prompt: one(prompts, {
    fields: [councilModels.prompt_id],
    references: [prompts.id],
  }),
}));

export const promptsRelations = relations(prompts, ({ many }) => ({
  councils: many(councils),
  councilModels: many(councilModels),
}));
