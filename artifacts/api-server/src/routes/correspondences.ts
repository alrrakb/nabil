import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, correspondencesTable, departmentsTable, employeesTable, correspondenceHistoryTable, archiveTable } from "@workspace/db";
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
} from "@workspace/api-zod";

const router: IRouter = Router();

const fromDept = departmentsTable;
const toDeptAlias = db.$with("to_dept").as(
  db.select().from(departmentsTable)
);

function generateRefNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CORR-${year}-${rand}`;
}

async function getCorrespondenceById(id: number) {
  const fromDepts = db.select({ id: departmentsTable.id, name: departmentsTable.name }).from(departmentsTable).as("from_dept");
  const toDepts = db.select({ id: departmentsTable.id, name: departmentsTable.name }).from(departmentsTable).as("to_dept");
  const assignees = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("assignee");
  const creators = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("creator");

  const [row] = await db
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
    .where(eq(correspondencesTable.id, id));

  return row;
}

router.get("/correspondences", async (req, res): Promise<void> => {
  const query = ListCorrespondencesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const fromDepts = db.select({ id: departmentsTable.id, name: departmentsTable.name }).from(departmentsTable).as("from_dept");
  const toDepts = db.select({ id: departmentsTable.id, name: departmentsTable.name }).from(departmentsTable).as("to_dept");
  const assignees = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("assignee");
  const creators = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("creator");

  const conditions = [];
  if (query.data.status) conditions.push(eq(correspondencesTable.status, query.data.status));
  if (query.data.type) conditions.push(eq(correspondencesTable.type, query.data.type));
  if (query.data.departmentId) conditions.push(eq(correspondencesTable.toDepartmentId, query.data.departmentId));
  if (query.data.assignedTo) conditions.push(eq(correspondencesTable.assignedToId, query.data.assignedTo));

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
    performedById: parsed.data.createdById ?? null,
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

  const history = await db
    .select({
      id: correspondenceHistoryTable.id,
      correspondenceId: correspondenceHistoryTable.correspondenceId,
      action: correspondenceHistoryTable.action,
      notes: correspondenceHistoryTable.notes,
      performedById: correspondenceHistoryTable.performedById,
      performedByName: employeesTable.name,
      createdAt: correspondenceHistoryTable.createdAt,
    })
    .from(correspondenceHistoryTable)
    .leftJoin(employeesTable, eq(correspondenceHistoryTable.performedById, employeesTable.id))
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
      performedById: null,
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

  const now = new Date();
  const archiveNumber = `ARCH-${now.getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

  await db.update(correspondencesTable).set({ status: "archived" }).where(eq(correspondencesTable.id, params.data.id));

  const [archive] = await db.insert(archiveTable).values({
    correspondenceId: params.data.id,
    archiveNumber,
    archiveLocation: parsed.data.archiveLocation ?? null,
    notes: parsed.data.notes ?? null,
    archivedById: parsed.data.archivedById ?? null,
  }).returning();

  await db.insert(correspondenceHistoryTable).values({
    correspondenceId: params.data.id,
    action: "تم أرشفة المراسلة",
    notes: `رقم الأرشيف: ${archiveNumber}`,
    performedById: parsed.data.archivedById ?? null,
  });

  const updatedCorr = await getCorrespondenceById(params.data.id);
  res.json({ ...archive, correspondence: updatedCorr });
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
    performedById: parsed.data.performedById ?? null,
  }).returning();

  const [result] = await db
    .select({
      id: correspondenceHistoryTable.id,
      correspondenceId: correspondenceHistoryTable.correspondenceId,
      action: correspondenceHistoryTable.action,
      notes: correspondenceHistoryTable.notes,
      performedById: correspondenceHistoryTable.performedById,
      performedByName: employeesTable.name,
      createdAt: correspondenceHistoryTable.createdAt,
    })
    .from(correspondenceHistoryTable)
    .leftJoin(employeesTable, eq(correspondenceHistoryTable.performedById, employeesTable.id))
    .where(eq(correspondenceHistoryTable.id, histEntry.id));

  res.status(201).json(result);
});

export default router;
