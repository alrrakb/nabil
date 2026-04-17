import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, correspondencesTable, departmentsTable, employeesTable, archiveTable } from "@workspace/db";
import { GetRecentCorrespondencesQueryParams } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [corrStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${correspondencesTable.status} = 'pending')::int`,
      inProgress: sql<number>`count(*) filter (where ${correspondencesTable.status} = 'in_progress')::int`,
      completed: sql<number>`count(*) filter (where ${correspondencesTable.status} = 'completed')::int`,
      archived: sql<number>`count(*) filter (where ${correspondencesTable.status} = 'archived')::int`,
      urgent: sql<number>`count(*) filter (where ${correspondencesTable.priority} = 'urgent')::int`,
    })
    .from(correspondencesTable);

  const [deptCount] = await db.select({ total: sql<number>`count(*)::int` }).from(departmentsTable);
  const [empCount] = await db.select({ total: sql<number>`count(*)::int` }).from(employeesTable);

  res.json({
    totalCorrespondences: corrStats.total,
    pendingCount: corrStats.pending,
    inProgressCount: corrStats.inProgress,
    completedCount: corrStats.completed,
    archivedCount: corrStats.archived,
    urgentCount: corrStats.urgent,
    totalDepartments: deptCount.total,
    totalEmployees: empCount.total,
  });
});

router.get("/dashboard/recent", async (req, res): Promise<void> => {
  const query = GetRecentCorrespondencesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 10;
  const fromDepts = db.select({ id: departmentsTable.id, name: departmentsTable.name }).from(departmentsTable).as("from_dept");
  const toDepts = db.select({ id: departmentsTable.id, name: departmentsTable.name }).from(departmentsTable).as("to_dept");
  const assignees = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("assignee");
  const creators = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("creator");

  const rows = await db
    .select({
      id: correspondencesTable.id,
      referenceNumber: correspondencesTable.referenceNumber,
      subject: correspondencesTable.subject,
      body: correspondencesTable.body,
      type: correspondencesTable.type,
      status: correspondencesTable.status,
      priority: correspondencesTable.priority,
      fromDepartmentId: correspondencesTable.fromDepartmentId,
      fromDepartmentName: fromDepts.name,
      toDepartmentId: correspondencesTable.toDepartmentId,
      toDepartmentName: toDepts.name,
      assignedToId: correspondencesTable.assignedToId,
      assignedToName: assignees.name,
      createdById: correspondencesTable.createdById,
      createdByName: creators.name,
      dueDate: correspondencesTable.dueDate,
      createdAt: correspondencesTable.createdAt,
      updatedAt: correspondencesTable.updatedAt,
    })
    .from(correspondencesTable)
    .leftJoin(fromDepts, eq(correspondencesTable.fromDepartmentId, fromDepts.id))
    .leftJoin(toDepts, eq(correspondencesTable.toDepartmentId, toDepts.id))
    .leftJoin(assignees, eq(correspondencesTable.assignedToId, assignees.id))
    .leftJoin(creators, eq(correspondencesTable.createdById, creators.id))
    .orderBy(desc(correspondencesTable.createdAt))
    .limit(limit);

  res.json(rows);
});

router.get("/dashboard/by-department", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      departmentId: departmentsTable.id,
      departmentName: departmentsTable.name,
      count: sql<number>`count(${correspondencesTable.id})::int`,
    })
    .from(departmentsTable)
    .leftJoin(correspondencesTable, eq(correspondencesTable.toDepartmentId, departmentsTable.id))
    .groupBy(departmentsTable.id, departmentsTable.name)
    .orderBy(departmentsTable.name);

  res.json(rows);
});

router.get("/dashboard/by-status", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      status: correspondencesTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(correspondencesTable)
    .groupBy(correspondencesTable.status);

  res.json(rows);
});

export default router;
