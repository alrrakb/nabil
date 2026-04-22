import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { correspondencesTable } from "./correspondences";
import { employeesTable } from "./employees";

export const correspondenceHistoryTable = pgTable("correspondence_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  correspondenceId: uuid("correspondence_id").notNull().references(() => correspondencesTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  notes: text("notes"),
  actorId: uuid("actor_id").references(() => employeesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertCorrespondenceHistorySchema = createInsertSchema(correspondenceHistoryTable).omit({ id: true, createdAt: true });
export type InsertCorrespondenceHistory = z.infer<typeof insertCorrespondenceHistorySchema>;
export type CorrespondenceHistory = typeof correspondenceHistoryTable.$inferSelect;
