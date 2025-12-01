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
  /** JSON string for Judge model settings */
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
  /** Optional override for the system prompt */
  system_prompt_override: text("system_prompt_override"),
  /** Optional prompt template ID */
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
export const councilsRelations = relations(councils, ({ many }) => ({
  models: many(councilModels),
}));

export const councilModelsRelations = relations(councilModels, ({ one }) => ({
  council: one(councils, {
    fields: [councilModels.council_id],
    references: [councils.id],
  }),
}));
