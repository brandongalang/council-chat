import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

/**
 * Table schema for user profiles.
 * Mirrors Supabase Auth users but extends with application specific fields.
 */
export const profiles = pgTable("profiles", {
  /** Primary key, references auth.users.id from Supabase */
  id: uuid("id").primaryKey().notNull(), // Should reference auth.users.id
  /** User's email address */
  email: text("email"),
  /** User's full name */
  full_name: text("full_name"),
  /** Timestamp of last update */
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Table schema for storing user API keys (encrypted).
 * Used for BYOK (Bring Your Own Key) functionality.
 */
export const userApiKeys = pgTable("user_api_keys", {
  /** Unique identifier for the API key entry */
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  /** Foreign key to profiles table */
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  /** The provider of the API key (e.g., 'openrouter') */
  provider: text("provider").default('openrouter').notNull(),
  /** The encrypted API key string */
  encrypted_key: text("encrypted_key").notNull(),
  /** Timestamp of creation */
  created_at: timestamp("created_at").defaultNow().notNull(),
  /** Timestamp of last update */
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Table schema for Councils.
 * A Council represents a group of AI models and settings.
 */
export const councils = pgTable("councils", {
  /** Unique identifier for the Council */
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  /** Foreign key to profiles table (owner) */
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  /** Name of the Council */
  name: text("name").notNull(),
  /** Description of the Council */
  description: text("description"),
  /** The model ID used as the Judge */
  judge_model: text("judge_model"), // e.g. "openai/gpt-4o"
  /** JSON string for Judge model settings */
  judge_settings: text("judge_settings").default('{}'), // JSON string
  /** Timestamp of creation */
  created_at: timestamp("created_at").defaultNow().notNull(),
  /** Timestamp of last update */
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Table schema for associating models with a Council.
 */
export const councilModels = pgTable("council_models", {
  /** Unique identifier for the Council Model association */
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  /** Foreign key to councils table */
  council_id: uuid("council_id").references(() => councils.id, { onDelete: 'cascade' }).notNull(),
  /** The model identifier string */
  model_id: text("model_id").notNull(), // e.g. "anthropic/claude-3-opus"
  /** JSON string for model specific settings */
  settings: text("settings").default('{}'), // JSON string
  /** Optional override for the system prompt */
  system_prompt_override: text("system_prompt_override"),
  /** Timestamp of creation */
  created_at: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Table schema for chat sessions.
 */
export const chats = pgTable("chats", {
  /** Unique identifier for the chat session */
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  /** Foreign key to profiles table (owner) */
  user_id: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  /** Title of the chat session */
  title: text("title").notNull(),
  /** Timestamp of creation */
  created_at: timestamp("created_at").defaultNow().notNull(),
  /** Timestamp of last update */
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Table schema for chat messages.
 */
export const messages = pgTable("messages", {
  /** Unique identifier for the message */
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  /** Foreign key to chats table */
  chat_id: uuid("chat_id").references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  /** The role of the message sender ('user' or 'assistant') */
  role: text("role").notNull(), // 'user' | 'assistant'
  /** The content of the message */
  content: text("content").notNull(),
  /** JSON string for additional metadata/annotations (e.g. Council processing info) */
  annotations: text("annotations"), // JSON string for Council data
  /** Number of tokens in the prompt */
  prompt_tokens: integer("prompt_tokens"),
  /** Number of tokens in the completion */
  completion_tokens: integer("completion_tokens"),
  /** Timestamp of creation */
  created_at: timestamp("created_at").defaultNow().notNull(),
});
