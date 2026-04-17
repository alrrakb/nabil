import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { correspondencesTable } from "./correspondences";
import { employeesTable } from "./employees";

export const archiveTable = pgTable("archive", {
  id: serial("id").primaryKey(),
  correspondenceId: integer("correspondence_id").notNull().references(() => correspondencesTable.id, { onDelete: "cascade" }),
  archiveNumber: text("archive_number").notNull().unique(),
  archiveLocation: text("archive_location"),
  notes: text("notes"),
  archivedById: integer("archived_by_id").references(() => employeesTable.id, { onDelete: "set null" }),
  archivedAt: timestamp("archived_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArchiveSchema = createInsertSchema(archiveTable).omit({ id: true, archivedAt: true });
export type InsertArchive = z.infer<typeof insertArchiveSchema>;
export type Archive = typeof archiveTable.$inferSelect;
