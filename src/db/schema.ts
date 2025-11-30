import { pgTable, text, timestamp, uuid, integer, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Profiles (Users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(), // Should reference auth.users.id
  email: text("email"),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Councils
export const councils = pgTable("councils", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  user_id: uuid("user_id").notNull(), // References profiles.id
  name: text("name").notNull(),
  description: text("description"),
  judge_model: text("judge_model").notNull(), // The model ID for the judge
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Council Models
export const councilModels = pgTable("council_models", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  council_id: uuid("council_id").references(() => councils.id, { onDelete: 'cascade' }).notNull(),
  model_id: text("model_id").notNull(), // The OpenRouter/Provider model ID
  display_name: text("display_name"),
  temperature: doublePrecision("temperature"),
  max_tokens: integer("max_tokens"),
  order: integer("order").default(0),
});

// Conversations
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  user_id: uuid("user_id").notNull(),
  council_id: uuid("council_id").references(() => councils.id, { onDelete: 'set null' }),
  title: text("title").notNull().default("New Conversation"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  conversation_id: uuid("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Council Responses
export const councilResponses = pgTable("council_responses", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  message_id: uuid("message_id").references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  model_id: text("model_id").notNull(),
  content: text("content"),
  tokens_in: integer("tokens_in"),
  tokens_out: integer("tokens_out"),
  cost: doublePrecision("cost"),
  duration_ms: integer("duration_ms"),
  status: text("status").notNull(), // 'pending', 'completed', 'error'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  councils: many(councils),
  conversations: many(conversations),
}));

export const councilsRelations = relations(councils, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [councils.user_id],
    references: [profiles.id],
  }),
  models: many(councilModels),
  conversations: many(conversations),
}));

export const councilModelsRelations = relations(councilModels, ({ one }) => ({
  council: one(councils, {
    fields: [councilModels.council_id],
    references: [councils.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [conversations.user_id],
    references: [profiles.id],
  }),
  council: one(councils, {
    fields: [conversations.council_id],
    references: [councils.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id],
  }),
  councilResponses: many(councilResponses),
}));

export const councilResponsesRelations = relations(councilResponses, ({ one }) => ({
  message: one(messages, {
    fields: [councilResponses.message_id],
    references: [messages.id],
  }),
}));
