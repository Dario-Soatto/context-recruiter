import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content"),
  parts: jsonb("parts"), // full message parts for assistant messages
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull().default("Untitled"),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatCandidates = pgTable("chat_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  aviatoId: text("aviato_id").notNull(),
  fullName: text("full_name").notNull(),
  location: text("location"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  enrichment: jsonb("enrichment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedCandidates = pgTable("saved_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  aviatoId: text("aviato_id").notNull(),
  fullName: text("full_name").notNull(),
  location: text("location"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  enrichment: jsonb("enrichment"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
