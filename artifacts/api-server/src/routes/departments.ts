import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, departmentsTable } from "@workspace/db";
import {
  CreateDepartmentBody,
  GetDepartmentParams,
  UpdateDepartmentParams,
  UpdateDepartmentBody,
  DeleteDepartmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/departments", async (_req, res): Promise<void> => {
  const departments = await db
    .select()
    .from(departmentsTable)
    .orderBy(departmentsTable.name);
  res.json(departments);
});

router.post("/departments", async (req, res): Promise<void> => {
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [dept] = await db.insert(departmentsTable).values(parsed.data).returning();
  res.status(201).json(dept);
});

router.get("/departments/:id", async (req, res): Promise<void> => {
  const params = GetDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, params.data.id));
  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }
  res.json(dept);
});

router.put("/departments/:id", async (req, res): Promise<void> => {
  const params = UpdateDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [dept] = await db.update(departmentsTable).set(parsed.data).where(eq(departmentsTable.id, params.data.id)).returning();
  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }
  res.json(dept);
});

router.delete("/departments/:id", async (req, res): Promise<void> => {
  const params = DeleteDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [dept] = await db.delete(departmentsTable).where(eq(departmentsTable.id, params.data.id)).returning();
  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }
  res.json({ success: true, id: params.data.id });
});

export default router;
