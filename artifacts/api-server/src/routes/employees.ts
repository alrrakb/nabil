import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, employeesTable, departmentsTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  DeleteEmployeeParams,
  ListEmployeesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/employees", async (req, res): Promise<void> => {
  const query = ListEmployeesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select({
      id: employeesTable.id,
      name: employeesTable.name,
      email: employeesTable.email,
      role: employeesTable.role,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      createdAt: employeesTable.createdAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(
      query.data.departmentId
        ? eq(employeesTable.departmentId, query.data.departmentId)
        : undefined
    )
    .orderBy(employeesTable.createdAt);

  res.json(rows);
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [emp] = await db.insert(employeesTable).values(parsed.data).returning();
  const [result] = await db
    .select({
      id: employeesTable.id,
      name: employeesTable.name,
      email: employeesTable.email,
      role: employeesTable.role,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      createdAt: employeesTable.createdAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.id, emp.id));
  res.status(201).json(result);
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [emp] = await db
    .select({
      id: employeesTable.id,
      name: employeesTable.name,
      email: employeesTable.email,
      role: employeesTable.role,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      createdAt: employeesTable.createdAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.id, params.data.id));
  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(emp);
});

router.put("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.update(employeesTable).set(parsed.data).where(eq(employeesTable.id, params.data.id));
  const [emp] = await db
    .select({
      id: employeesTable.id,
      name: employeesTable.name,
      email: employeesTable.email,
      role: employeesTable.role,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      createdAt: employeesTable.createdAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.id, params.data.id));
  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(emp);
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [emp] = await db.delete(employeesTable).where(eq(employeesTable.id, params.data.id)).returning();
  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json({ success: true, id: params.data.id });
});

export default router;
