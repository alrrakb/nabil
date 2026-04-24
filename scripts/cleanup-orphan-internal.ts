/**
 * Deletes internal correspondences whose sender no longer exists in the system
 * (sender_id = NULL due to onDelete: "set null") but still have a valid receiver.
 *
 * Run: npx tsx --env-file=artifacts/api-server/.env scripts/cleanup-orphan-internal.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { isNull, isNotNull, eq, and } from "drizzle-orm";
import { correspondencesTable } from "../lib/db/src/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Run with --env-file=artifacts/api-server/.env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

async function main() {
  const targets = await db
    .select({
      id: correspondencesTable.id,
      referenceNumber: correspondencesTable.referenceNumber,
      subject: correspondencesTable.subject,
      status: correspondencesTable.status,
      receiverId: correspondencesTable.receiverId,
      createdAt: correspondencesTable.createdAt,
    })
    .from(correspondencesTable)
    .where(
      and(
        eq(correspondencesTable.type, "internal"),
        isNull(correspondencesTable.senderId),
        isNotNull(correspondencesTable.receiverId),
      ),
    );

  if (targets.length === 0) {
    console.log("No orphan internal correspondences found. Nothing to delete.");
    await pool.end();
    return;
  }

  console.log(`Found ${targets.length} internal correspondence(s) with deleted sender:\n`);
  for (const c of targets) {
    console.log(`  [${c.referenceNumber}] "${c.subject}" — status: ${c.status} — created: ${c.createdAt?.toISOString().slice(0, 10)}`);
  }

  const ids = targets.map((c) => c.id);
  let deleted = 0;
  for (const id of ids) {
    await db.delete(correspondencesTable).where(eq(correspondencesTable.id, id));
    deleted++;
  }

  console.log(`\nDeleted ${deleted} correspondence(s). Related history and archive entries were removed automatically (cascade).`);
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  pool.end();
  process.exit(1);
});
