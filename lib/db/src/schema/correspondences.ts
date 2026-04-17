import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { departmentsTable } from "./departments";
import { employeesTable } from "./employees";

export const correspondencesTable = pgTable("correspondences", {
  id: serial("id").primaryKey(),
  referenceNumber: text("reference_number").notNull().unique(),
  subject: text("subject").notNull(),
  body: text("body"),
  type: text("type").notNull().default("internal"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  fromDepartmentId: integer("from_department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
  toDepartmentId: integer("to_department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
  assignedToId: integer("assigned_to_id").references(() => employeesTable.id, { onDelete: "set null" }),
  createdById: integer("created_by_id").references(() => employeesTable.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCorrespondenceSchema = createInsertSchema(correspondencesTable).omit({ id: true, createdAt: true, updatedAt: true, referenceNumber: true });
export type InsertCorrespondence = z.infer<typeof insertCorrespondenceSchema>;
export type Correspondence = typeof correspondencesTable.$inferSelect;
