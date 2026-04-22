import { Router, type IRouter } from "express";
import { eq, and, or } from "drizzle-orm";
import { db, correspondencesTable, departmentsTable, employeesTable, correspondenceHistoryTable, archiveTable, notificationsTable } from "@workspace/db";
import {
  CreateCorrespondenceBody,
  GetCorrespondenceParams,
  UpdateCorrespondenceParams,
  UpdateCorrespondenceBody,
  DeleteCorrespondenceParams,
  ListCorrespondencesQueryParams,
  ArchiveCorrespondenceParams,
  ArchiveCorrespondenceBody,
  AddCorrespondenceHistoryParams,
  AddCorrespondenceHistoryBody,
  CorrespondenceActionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateRefNumber(): string {
  const now = new Date();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CORR-${now.getFullYear()}-${rand}`;
}

function corrSelect() {
  const senders = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("sender");
  const receivers = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("receiver");
  return { senders, receivers };
}

async function getCorrespondenceById(id: string) {
  const senders = db.select({ id: employeesTable.id, fullName: employeesTable.fullName, employeeCode: employeesTable.employeeCode }).from(employeesTable).as("sender");
  const receivers = db.select({ id: employeesTable.id, fullName: employeesTable.fullName, employeeCode: employeesTable.employeeCode }).from(employeesTable).as("receiver");

  const [row] = await db
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
      senderCode: senders.employeeCode,
      receiverId: correspondencesTable.receiverId,
      receiverName: receivers.fullName,
      receiverCode: receivers.employeeCode,
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
    .where(eq(correspondencesTable.id, id));

  return row;
}

router.get("/correspondences", async (req, res): Promise<void> => {
  const query = ListCorrespondencesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const senders = db.select({ id: employeesTable.id, fullName: employeesTable.fullName, employeeCode: employeesTable.employeeCode }).from(employeesTable).as("sender");
  const receivers = db.select({ id: employeesTable.id, fullName: employeesTable.fullName, employeeCode: employeesTable.employeeCode }).from(employeesTable).as("receiver");

  const conditions = [];
  if (query.data.status) conditions.push(eq(correspondencesTable.status, query.data.status));
  if (query.data.type) conditions.push(eq(correspondencesTable.type, query.data.type));
  if (query.data.departmentId) conditions.push(eq(correspondencesTable.departmentId, query.data.departmentId));
  if (query.data.senderId) conditions.push(eq(correspondencesTable.senderId, query.data.senderId));
  if (query.data.viewerRole === "employee" && query.data.viewerId) {
    conditions.push(
      or(
        eq(correspondencesTable.senderId, query.data.viewerId),
        eq(correspondencesTable.receiverId, query.data.viewerId),
      )!
    );
  }

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
      senderCode: senders.employeeCode,
      receiverId: correspondencesTable.receiverId,
      receiverName: receivers.fullName,
      receiverCode: receivers.employeeCode,
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(correspondencesTable.createdAt);

  res.json(rows);
});

router.post("/correspondences", async (req, res): Promise<void> => {
  const parsed = CreateCorrespondenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const referenceNumber = generateRefNumber();
  const [corr] = await db
    .insert(correspondencesTable)
    .values({ ...parsed.data, referenceNumber })
    .returning();

  await db.insert(correspondenceHistoryTable).values({
    correspondenceId: corr.id,
    action: "تم إنشاء المراسلة",
    notes: `تم إنشاء المراسلة برقم المرجع ${referenceNumber}`,
    actorId: parsed.data.senderId ?? null,
  });

  const result = await getCorrespondenceById(corr.id);
  res.status(201).json(result);
});

router.get("/correspondences/:id", async (req, res): Promise<void> => {
  const params = GetCorrespondenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const corr = await getCorrespondenceById(params.data.id);
  if (!corr) {
    res.status(404).json({ error: "Correspondence not found" });
    return;
  }

  const actors = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("actor");

  const history = await db
    .select({
      id: correspondenceHistoryTable.id,
      correspondenceId: correspondenceHistoryTable.correspondenceId,
      action: correspondenceHistoryTable.action,
      notes: correspondenceHistoryTable.notes,
      actorId: correspondenceHistoryTable.actorId,
      actorName: actors.fullName,
      createdAt: correspondenceHistoryTable.createdAt,
    })
    .from(correspondenceHistoryTable)
    .leftJoin(actors, eq(correspondenceHistoryTable.actorId, actors.id))
    .where(eq(correspondenceHistoryTable.correspondenceId, params.data.id))
    .orderBy(correspondenceHistoryTable.createdAt);

  res.json({ ...corr, history });
});

router.put("/correspondences/:id", async (req, res): Promise<void> => {
  const params = UpdateCorrespondenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCorrespondenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await getCorrespondenceById(params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Correspondence not found" });
    return;
  }

  await db.update(correspondencesTable).set(parsed.data).where(eq(correspondencesTable.id, params.data.id));

  if (parsed.data.status && parsed.data.status !== existing.status) {
    await db.insert(correspondenceHistoryTable).values({
      correspondenceId: params.data.id,
      action: `تم تغيير الحالة إلى "${parsed.data.status}"`,
      notes: null,
      actorId: null,
    });
  }

  const result = await getCorrespondenceById(params.data.id);
  res.json(result);
});

router.delete("/correspondences/:id", async (req, res): Promise<void> => {
  const params = DeleteCorrespondenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [corr] = await db.delete(correspondencesTable).where(eq(correspondencesTable.id, params.data.id)).returning();
  if (!corr) {
    res.status(404).json({ error: "Correspondence not found" });
    return;
  }
  res.json({ success: true, id: params.data.id });
});

router.post("/correspondences/:id/archive", async (req, res): Promise<void> => {
  const params = ArchiveCorrespondenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ArchiveCorrespondenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const corr = await getCorrespondenceById(params.data.id);
  if (!corr) {
    res.status(404).json({ error: "Correspondence not found" });
    return;
  }

  await db.update(correspondencesTable).set({ status: "archived" }).where(eq(correspondencesTable.id, params.data.id));

  const [archive] = await db.insert(archiveTable).values({
    correspondenceId: params.data.id,
    archivedBy: parsed.data.archivedBy ?? null,
    archiveReason: parsed.data.archiveReason ?? null,
  }).returning();

  await db.insert(correspondenceHistoryTable).values({
    correspondenceId: params.data.id,
    action: "تم أرشفة المراسلة",
    notes: parsed.data.archiveReason ?? null,
    actorId: parsed.data.archivedBy ?? null,
  });

  const updatedCorr = await getCorrespondenceById(params.data.id);
  res.json({ ...archive, correspondence: updatedCorr });
});

const ACTION_LABELS: Record<string, string> = {
  approved: "تمت الموافقة على المراسلة",
  rejected: "تم رفض المراسلة",
  archived: "تم أرشفة المراسلة",
};

router.patch("/correspondences/:id/action", async (req, res): Promise<void> => {
  const params = GetCorrespondenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CorrespondenceActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const corr = await getCorrespondenceById(params.data.id);
  if (!corr) {
    res.status(404).json({ error: "Correspondence not found" });
    return;
  }

  const { action, notes, actorId, actorRole } = parsed.data;

  if (actorRole !== "admin" && corr.receiverId !== actorId) {
    res.status(403).json({ error: "غير مصرح بتنفيذ هذا الإجراء" });
    return;
  }

  await db.update(correspondencesTable)
    .set({ status: action })
    .where(eq(correspondencesTable.id, params.data.id));

  await db.insert(correspondenceHistoryTable).values({
    correspondenceId: params.data.id,
    action: ACTION_LABELS[action] ?? action,
    notes: notes ?? null,
    actorId: actorId ?? null,
  });

  if (action === "archived") {
    await db.insert(archiveTable).values({
      correspondenceId: params.data.id,
      archivedBy: actorId ?? null,
      archiveReason: notes ?? "الأرشيف الرئيسي",
    });
  }

  // Auto-notify the other party
  const notifyTargetId = actorId === corr.senderId ? corr.receiverId : corr.senderId;
  if (notifyTargetId) {
    const ACTION_NOTIFY_LABELS: Record<string, string> = {
      approved: "تمت الموافقة",
      rejected: "تم الرفض",
      archived: "تم الأرشفة",
    };
    await db.insert(notificationsTable).values({
      userId: notifyTargetId,
      title: ACTION_NOTIFY_LABELS[action] ?? action,
      message: `المراسلة "${corr.subject}" (${corr.referenceNumber}): ${ACTION_NOTIFY_LABELS[action] ?? action}`,
    });
  }

  const result = await getCorrespondenceById(params.data.id);
  res.json(result);
});

router.post("/correspondences/:id/history", async (req, res): Promise<void> => {
  const params = AddCorrespondenceHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddCorrespondenceHistoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [histEntry] = await db.insert(correspondenceHistoryTable).values({
    correspondenceId: params.data.id,
    action: parsed.data.action,
    notes: parsed.data.notes ?? null,
    actorId: parsed.data.actorId ?? null,
  }).returning();

  const actors = db.select({ id: employeesTable.id, fullName: employeesTable.fullName }).from(employeesTable).as("actor");

  const [result] = await db
    .select({
      id: correspondenceHistoryTable.id,
      correspondenceId: correspondenceHistoryTable.correspondenceId,
      action: correspondenceHistoryTable.action,
      notes: correspondenceHistoryTable.notes,
      actorId: correspondenceHistoryTable.actorId,
      actorName: actors.fullName,
      createdAt: correspondenceHistoryTable.createdAt,
    })
    .from(correspondenceHistoryTable)
    .leftJoin(actors, eq(correspondenceHistoryTable.actorId, actors.id))
    .where(eq(correspondenceHistoryTable.id, histEntry.id));

  res.status(201).json(result);
});

export default router;
