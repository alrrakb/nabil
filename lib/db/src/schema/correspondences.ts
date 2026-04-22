import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { departmentsTable } from "./departments";
import { employeesTable } from "./employees";

export const correspondencesTable = pgTable("correspondences", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: text("reference_number").notNull().unique(),
  subject: text("subject").notNull(),
  body: text("body"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("normal"),
  type: text("type").notNull(),
  senderId: uuid("sender_id").references(() => employeesTable.id, { onDelete: "set null" }),
  receiverId: uuid("receiver_id").references(() => employeesTable.id, { onDelete: "set null" }),
  departmentId: uuid("department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertCorrespondenceSchema = createInsertSchema(correspondencesTable).omit({ id: true, createdAt: true, updatedAt: true, referenceNumber: true });
export type InsertCorrespondence = z.infer<typeof insertCorrespondenceSchema>;
export type Correspondence = typeof correspondencesTable.$inferSelect;
