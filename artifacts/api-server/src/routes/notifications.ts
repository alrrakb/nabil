import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { ListNotificationsQueryParams, CreateNotificationBody, MarkNotificationReadParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const query = ListNotificationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, query.data.userId))
    .orderBy(desc(notificationsTable.createdAt));

  res.json(rows);
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [notif] = await db
    .insert(notificationsTable)
    .values({
      userId: parsed.data.userId,
      title: parsed.data.title,
      message: parsed.data.message,
    })
    .returning();

  res.status(201).json(notif);
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notif] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();

  if (!notif) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(notif);
});

export default router;
