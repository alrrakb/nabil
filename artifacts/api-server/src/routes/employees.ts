import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { db, employeesTable, departmentsTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  DeleteEmployeeParams,
  ListEmployeesQueryParams,
} from "@workspace/api-zod";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const router: IRouter = Router();

function employeeSelect() {
  return {
    id: employeesTable.id,
    fullName: employeesTable.fullName,
    email: employeesTable.email,
    role: employeesTable.role,
    departmentId: employeesTable.departmentId,
    departmentName: departmentsTable.name,
    avatarUrl: employeesTable.avatarUrl,
    employeeCode: employeesTable.employeeCode,
    phoneNumber: employeesTable.phoneNumber,
    createdAt: employeesTable.createdAt,
  };
}

router.get("/employees", async (req, res): Promise<void> => {
  const query = ListEmployeesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select(employeeSelect())
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(query.data.departmentId ? eq(employeesTable.departmentId, query.data.departmentId) : undefined)
    .orderBy(employeesTable.fullName);

  res.json(rows);
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { temporaryPassword, employeeCode, phoneNumber, ...employeeFields } = parsed.data;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: employeeFields.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { force_password_reset: true, full_name: employeeFields.fullName },
  });

  if (authError) {
    res.status(400).json({ error: authError.message });
    return;
  }

  const [emp] = await db
    .insert(employeesTable)
    .values({
      fullName: employeeFields.fullName,
      email: employeeFields.email,
      role: employeeFields.role,
      departmentId: employeeFields.departmentId ?? null,
      employeeCode: employeeCode || null,
      phoneNumber: phoneNumber,
      authUserId: authData.user.id,
    })
    .returning();

  const [result] = await db
    .select(employeeSelect())
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
    .select(employeeSelect())
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

  // Build patch explicitly — passing parsed.data directly to set() causes Drizzle
  // to silently drop fields whose keys don't survive the compiled schema mapper.
  const patch: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) patch.fullName = parsed.data.fullName;
  if (parsed.data.email !== undefined) patch.email = parsed.data.email;
  if (parsed.data.role !== undefined) patch.role = parsed.data.role;
  if ("departmentId" in req.body) patch.departmentId = parsed.data.departmentId ?? null;
  if ("employeeCode" in req.body) patch.employeeCode = parsed.data.employeeCode || null;
  if ("phoneNumber" in req.body) patch.phoneNumber = parsed.data.phoneNumber || null;

  await db.update(employeesTable).set(patch).where(eq(employeesTable.id, params.data.id));
  const [emp] = await db
    .select(employeeSelect())
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
