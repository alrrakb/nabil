import { Router, type IRouter } from "express";
import { eq, sql, desc, asc } from "drizzle-orm";
import { db, correspondencesTable, departmentsTable, employeesTable } from "@workspace/db";
import { GetRecentCorrespondencesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [corrStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${correspondencesTable.status} = 'pending')::int`,
      inProgress: sql<number>`count(*) filter (where ${correspondencesTable.status} = 'in_progress')::int`,
      approved: sql<number>`count(*) filter (where ${correspondencesTable.status} = 'approved')::int`,
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
    approvedCount: corrStats.approved,
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
  const senders = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("sender");
  const receivers = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("receiver");

  const rows = await db
    .select({
      id: correspondencesTable.id,
      referenceNumber: correspondencesTable.referenceNumber,
      subject: correspondencesTable.subject,
      body: correspondencesTable.body,
      status: correspondencesTable.status,
      priority: correspondencesTable.priority,
      type: correspondencesTable.type,
      senderId: correspondencesTable.senderId,
      senderName: senders.fullName,
      receiverId: correspondencesTable.receiverId,
      receiverName: receivers.fullName,
      departmentId: correspondencesTable.departmentId,
      departmentName: departmentsTable.name,
      attachmentUrl: correspondencesTable.attachmentUrl,
      createdAt: correspondencesTable.createdAt,
      updatedAt: correspondencesTable.updatedAt,
    })
    .from(correspondencesTable)
    .leftJoin(senders, eq(correspondencesTable.senderId, senders.id))
    .leftJoin(receivers, eq(correspondencesTable.receiverId, receivers.id))
    .leftJoin(departmentsTable, eq(correspondencesTable.departmentId, departmentsTable.id))
    .orderBy(desc(correspondencesTable.createdAt))
    .limit(limit);

  res.json(rows);
});

router.get("/dashboard/by-department", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      departmentId: departmentsTable.id,
      departmentName: departmentsTable.name,
      departmentColor: departmentsTable.color,
      count: sql<number>`count(${correspondencesTable.id})::int`,
    })
    .from(departmentsTable)
    .leftJoin(correspondencesTable, eq(correspondencesTable.departmentId, departmentsTable.id))
    .groupBy(departmentsTable.id, departmentsTable.name, departmentsTable.color)
    .orderBy(desc(sql`count(${correspondencesTable.id})`));

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
