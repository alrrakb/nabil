/**
 * Database Seeder — Project Team Members + Mock Correspondences
 * Run: npx tsx --env-file=artifacts/api-server/.env scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { departmentsTable, employeesTable, correspondencesTable } from "../lib/db/src/schema";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error("Missing env vars. Run with --env-file=artifacts/api-server/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

// ── Team Data ─────────────────────────────────────────────────────────────────
const TEAM = [
  { name: "نبيل محمد نبيل جمعة محمد نعمه",      code: "2202057" },
  { name: "محمود الجيوشي محمود على المنيلي",      code: "2202037" },
  { name: "صبحي عبد العظيم صلاح المليجى",        code: "2202073" },
  { name: "احمد عيد ابراهيم محمد",               code: "2202053" },
  { name: "احمد صلاح لطفى العدل المتولى",        code: "2201958" },
  { name: "محمود محمد جودة عبد المقصود",         code: "2202024" },
  { name: "محمود رضا السيد مصطفى الحنفى",       code: "2201949" },
  { name: "احمد حسن احمد محمد الباز",            code: "2202066" },
  { name: "عبدالله طارق السيد على خيرالله",      code: "2202015" },
  { name: "احمد خالد رشاد العطافي",              code: "2202007" },
  { name: "ابراهيم على محمد على مندور",          code: "2201962" },
  { name: "محمد محمد جودة ابو العنين",           code: "2202058" },
  { name: "اسامة محمد فتحى احمد شوقى",          code: "2201963" },
  { name: "احمد سعيد السيد محمد",               code: "2202059" },
  { name: "خالد احمد السعيد عبدالباري",          code: "2202055" },
  { name: "عبدالرؤوف وائل عبدالرؤوف محمد",      code: "2202038" },
];

// Roles: index 0-1 → admin, 2-5 → supervisor, rest → employee
function assignRole(index: number): "admin" | "supervisor" | "employee" {
  if (index < 2) return "admin";
  if (index < 6) return "supervisor";
  return "employee";
}

// ── Correspondence Fixtures ───────────────────────────────────────────────────
const SUBJECTS = [
  "طلب إجازة اعتيادية",
  "تقرير تسليم مشروع التخرج",
  "طلب معدات تقنية",
  "مراجعة تقييم الأداء",
  "إشعار باجتماع قسم الحاسب الآلي",
  "طلب تمديد مهلة تسليم التقرير",
  "موافقة على خطة المشروع النهائي",
  "طلب صرف بدل انتقال",
  "تقرير متابعة التدريب الميداني",
  "إحالة طلب لمراجعة اللجنة",
  "إخطار بتغيير موعد الاختبار",
  "طلب الحصول على نسخة من الشهادة",
  "تقرير الأداء الشهري لفريق العمل",
  "طلب حضور دورة تدريبية",
  "إشعار بانتهاء عقد العمل المؤقت",
  "مقترح تطوير نظام الأرشفة الإلكترونية",
  "طلب مراجعة بنود اللائحة الداخلية",
  "إخطار باعتماد الخطة السنوية",
  "طلب إضافة صلاحيات على النظام",
  "تقرير نتائج اختبار النظام الجديد",
];

const BODIES = [
  "يرجى الاطلاع على المرفقات واتخاذ الإجراء اللازم في أقرب وقت ممكن.",
  "نحيطكم علماً بأن هذا الطلب يستلزم الرد خلال ثلاثة أيام عمل.",
  "بناءً على توجيهات الإدارة، نرجو التكرم بالمراجعة والاعتماد.",
  "تمت مراجعة المستندات المرفقة ونرجو التوقيع والإعادة.",
  "يُعدّ هذا الإشعار جزءاً من الإجراءات الرسمية المعتمدة في المؤسسة.",
];

const STATUSES = ["pending", "in_progress", "approved", "rejected", "archived"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const TYPES = ["incoming", "outgoing", "internal"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function refNum(i: number): string {
  return `CORR-2026-${String(i + 1).padStart(4, "0")}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting seed...\n");

  // 1. Ensure department exists
  let departmentId: string;
  const existing = await db.select().from(departmentsTable).limit(1);
  if (existing.length > 0) {
    departmentId = existing[0].id;
    console.log(`✅ Using existing department: ${existing[0].name} (${departmentId})`);
  } else {
    const [dept] = await db
      .insert(departmentsTable)
      .values({ name: "قسم الحاسب الآلي", code: "CS", color: "#3b82f6" })
      .returning();
    departmentId = dept.id;
    console.log(`✅ Created department: ${dept.name} (${departmentId})`);
  }

  // 2. Create auth users + employees
  const employeeIds: string[] = [];

  for (let i = 0; i < TEAM.length; i++) {
    const { name, code } = TEAM[i];
    const email = `${code}@delta.edu.eg`;
    const role = assignRole(i);

    // Check if employee already exists
    const existing = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⚠️  Skip (exists): ${name} — ${email}`);
      employeeIds.push(existing[0].id);
      continue;
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "Password123!",
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError) {
      console.error(`❌ Auth error for ${email}:`, authError.message);
      continue;
    }

    // Insert employee row
    const [emp] = await db
      .insert(employeesTable)
      .values({
        authUserId: authData.user.id,
        fullName: name,
        email,
        role,
        employeeCode: code,
        phoneNumber: "01000000000",
        departmentId,
      })
      .returning();

    employeeIds.push(emp.id);
    console.log(`✅ Created [${role.padEnd(10)}] ${name} — ${email}`);
  }

  console.log(`\n👥 ${employeeIds.length} employees ready.\n`);

  // 3. Generate correspondences
  const COUNT = 20;
  let created = 0;

  for (let i = 0; i < COUNT; i++) {
    // Pick distinct sender & receiver
    let sIdx = Math.floor(Math.random() * employeeIds.length);
    let rIdx: number;
    do { rIdx = Math.floor(Math.random() * employeeIds.length); } while (rIdx === sIdx);

    try {
      await db.insert(correspondencesTable).values({
        referenceNumber: refNum(i),
        subject: SUBJECTS[i % SUBJECTS.length],
        body: pick(BODIES),
        type: pick(TYPES),
        status: pick(STATUSES),
        priority: pick(PRIORITIES),
        senderId: employeeIds[sIdx],
        receiverId: employeeIds[rIdx],
        departmentId,
      });
      created++;
      console.log(`📨 [${String(i + 1).padStart(2)}] ${SUBJECTS[i % SUBJECTS.length]}`);
    } catch (err: any) {
      console.error(`❌ Correspondence ${i + 1}:`, err.message);
    }
  }

  console.log(`\n✅ Seed complete — ${created}/${COUNT} correspondences created.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  pool.end();
  process.exit(1);
});
