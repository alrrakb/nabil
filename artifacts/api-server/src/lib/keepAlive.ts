import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

const INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

async function ping(): Promise<void> {
  await db.execute(sql`SELECT 1`);
}

export function startKeepAlive(): void {
  const run = async () => {
    try {
      await ping();
      logger.debug("keep-alive ping succeeded");
    } catch (err) {
      logger.warn({ err }, "keep-alive ping failed — will retry at next interval");
    }
  };

  // Delay first ping until the server is fully up
  setTimeout(() => {
    void run();
    setInterval(() => void run(), INTERVAL_MS);
  }, 5_000);
}
