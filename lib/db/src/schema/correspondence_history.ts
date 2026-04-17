import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { correspondencesTable } from "./correspondences";
import { employeesTable } from "./employees";

export const correspondenceHistoryTable = pgTable("correspondence_history", {
  id: serial("id").primaryKey(),
  correspondenceId: integer("correspondence_id").notNull().references(() => correspondencesTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  notes: text("notes"),
  performedById: integer("performed_by_id").references(() => employeesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCorrespondenceHistorySchema = createInsertSchema(correspondenceHistoryTable).omit({ id: true, createdAt: true });
export type InsertCorrespondenceHistory = z.infer<typeof insertCorrespondenceHistorySchema>;
export type CorrespondenceHistory = typeof correspondenceHistoryTable.$inferSelect;
