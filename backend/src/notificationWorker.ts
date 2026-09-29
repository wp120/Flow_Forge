import "./env";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { NOTIFICATION_QUEUE_NAME } from "./notificationQueue";
import { getOwnedUploadPrefix, getStorageClient, STORAGE_BUCKET } from "./storage";
import { Resend } from "resend";

const prisma = new PrismaClient();

async function cleanupAbandonedUploads() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const storage = getStorageClient().storage.from(STORAGE_BUCKET);
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, companyId: true },
  });

  for (const user of users) {
    const prefix = getOwnedUploadPrefix(user.companyId, user.id);
    for (let offset = 0; ; offset += 1000) {
      const { data: objects, error } = await storage.list(prefix, { limit: 1000, offset, sortBy: { column: "created_at", order: "asc" } });
      if (error) throw error;
      if (objects.length === 0) break;

      const abandonedPaths = objects
        .filter((object) => object.created_at && new Date(object.created_at).getTime() < cutoff)
        .map((object) => `${prefix}${object.name}`);
      if (abandonedPaths.length > 0) {
        const attached = await prisma.submissionFile.findMany({
          where: { storagePath: { in: abandonedPaths } },
          select: { storagePath: true },
        });
        const attachedPaths = new Set(attached.map((file) => file.storagePath));
        const orphanPaths = abandonedPaths.filter((path) => !attachedPaths.has(path));
        if (orphanPaths.length > 0) {
          const { error: removeError } = await storage.remove(orphanPaths);
          if (removeError) throw removeError;
          console.log(`Removed ${orphanPaths.length} abandoned upload(s) for user ${user.id}.`);
        }
      }

      if (objects.length < 1000) break;
    }
  }
}

const connection = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

const resend = new Resend(process.env.RESEND_API_KEY);

const worker = new Worker(
  NOTIFICATION_QUEUE_NAME,
  async (job) => {
    const notification = await prisma.notification.findUnique({
      where: { id: job.data.notificationId },
    //   select: { id: true, type: true },
    });
    if (!notification) throw new Error(`Notification ${job.data.notificationId} does not exist.`);

    console.log("notification: ", notification);

    if(["SUBMISSION_REJECTED", "SUBMISSION_APPROVED"].includes(notification.type)){
        await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            // to: notification.userId,
            to: "parthbhosle2002@gmail.com",
            subject: notification.title,
            html: notification.message,
        });
    }

    console.log(`Notification ${notification.id} (${notification.type}) processed.`);
  },
  { connection },
);

cleanupAbandonedUploads().catch((error) => console.error("Initial abandoned upload cleanup failed:", error));
const cleanupInterval = setInterval(() => {
  cleanupAbandonedUploads().catch((error) => console.error("Abandoned upload cleanup failed:", error));
}, 24 * 60 * 60 * 1000);

worker.on("completed", (job) => console.log(`Notification job ${job.id} completed.`));
worker.on("failed", (job, error) => console.error(`Notification job ${job?.id} failed:`, error));

async function shutdown() {
  await worker.close();
  clearInterval(cleanupInterval);
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
console.log(`FlowForge notification worker listening on ${NOTIFICATION_QUEUE_NAME}.`);
