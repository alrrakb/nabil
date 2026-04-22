import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { correspondencesTable } from "./correspondences";
import { employeesTable } from "./employees";

export const archiveTable = pgTable("archive", {
  id: uuid("id").primaryKey().defaultRandom(),
  correspondenceId: uuid("correspondence_id").notNull().references(() => correspondencesTable.id, { onDelete: "cascade" }),
  archivedBy: uuid("archived_by").references(() => employeesTable.id, { onDelete: "set null" }),
  archiveReason: text("archive_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertArchiveSchema = createInsertSchema(archiveTable).omit({ id: true, createdAt: true });
export type InsertArchive = z.infer<typeof insertArchiveSchema>;
export type Archive = typeof archiveTable.$inferSelect;
