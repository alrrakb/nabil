import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { departmentsTable } from "./departments";

export const employeesTable = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("employee"),
  departmentId: uuid("department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
  avatarUrl: text("avatar_url"),
  employeeCode: text("employee_code"),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
