import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(), // Should reference auth.users.id
  email: text("email"),
  full_name: text("full_name"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
