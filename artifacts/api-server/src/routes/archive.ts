import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, archiveTable, correspondencesTable, departmentsTable, employeesTable } from "@workspace/db";
import { ListArchiveQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/archive", async (req, res): Promise<void> => {
  const query = ListArchiveQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const fromDepts = db.select({ id: departmentsTable.id, name: departmentsTable.name }).from(departmentsTable).as("from_dept");
  const toDepts = db.select({ id: departmentsTable.id, name: departmentsTable.name }).from(departmentsTable).as("to_dept");
  const assignees = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("assignee");
  const creators = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("creator");
  const archivers = db.select({ id: employeesTable.id, name: employeesTable.name }).from(employeesTable).as("archiver");

  const rows = await db
    .select({
      id: archiveTable.id,
      correspondenceId: archiveTable.correspondenceId,
      archiveNumber: archiveTable.archiveNumber,
      archiveLocation: archiveTable.archiveLocation,
      notes: archiveTable.notes,
      archivedById: archiveTable.archivedById,
      archivedByName: archivers.name,
      archivedAt: archiveTable.archivedAt,
      correspondence: {
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
      },
    })
    .from(archiveTable)
    .leftJoin(archivers, eq(archiveTable.archivedById, archivers.id))
    .leftJoin(correspondencesTable, eq(archiveTable.correspondenceId, correspondencesTable.id))
    .leftJoin(fromDepts, eq(correspondencesTable.fromDepartmentId, fromDepts.id))
    .leftJoin(toDepts, eq(correspondencesTable.toDepartmentId, toDepts.id))
    .leftJoin(assignees, eq(correspondencesTable.assignedToId, assignees.id))
    .leftJoin(creators, eq(correspondencesTable.createdById, creators.id))
    .orderBy(archiveTable.archivedAt);

  res.json(rows);
});

export default router;
