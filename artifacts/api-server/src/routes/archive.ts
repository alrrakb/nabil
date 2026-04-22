import { Router, type IRouter } from "express";
import { eq, and, or, ilike, gte, lte, SQL } from "drizzle-orm";
import { db, archiveTable, correspondencesTable, departmentsTable, employeesTable } from "@workspace/db";
import { ListArchiveQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/archive", async (req, res): Promise<void> => {
  const query = ListArchiveQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  if (query.data.viewerRole === "employee") {
    res.status(403).json({ error: "ليس لديك صلاحية الوصول إلى الأرشيف" });
    return;
  }

  const senders = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("sender");
  const receivers = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("receiver");
  const archivers = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("archiver");

  const conditions: SQL[] = [];

  if (query.data.search) {
    const term = `%${query.data.search}%`;
    conditions.push(
      or(
        ilike(correspondencesTable.referenceNumber, term),
        ilike(correspondencesTable.subject, term),
        ilike(archiveTable.archiveReason, term),
      )!
    );
  }

  if (query.data.fromDate) {
    conditions.push(gte(archiveTable.createdAt, new Date(query.data.fromDate)));
  }

  if (query.data.toDate) {
    const toEnd = new Date(query.data.toDate);
    toEnd.setHours(23, 59, 59, 999);
    conditions.push(lte(archiveTable.createdAt, toEnd));
  }

  if (query.data.departmentId) {
    conditions.push(eq(correspondencesTable.departmentId, query.data.departmentId));
  }

  const rows = await db
    .select({
      id: archiveTable.id,
      correspondenceId: archiveTable.correspondenceId,
      archivedBy: archiveTable.archivedBy,
      archivedByName: archivers.fullName,
      archiveReason: archiveTable.archiveReason,
      createdAt: archiveTable.createdAt,
      correspondence: {
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
      },
    })
    .from(archiveTable)
    .leftJoin(archivers, eq(archiveTable.archivedBy, archivers.id))
    .leftJoin(correspondencesTable, eq(archiveTable.correspondenceId, correspondencesTable.id))
    .leftJoin(senders, eq(correspondencesTable.senderId, senders.id))
    .leftJoin(receivers, eq(correspondencesTable.receiverId, receivers.id))
    .leftJoin(departmentsTable, eq(correspondencesTable.departmentId, departmentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(archiveTable.createdAt);

  res.json(rows);
});

export default router;
