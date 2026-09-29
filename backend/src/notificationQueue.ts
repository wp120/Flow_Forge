import { Queue } from "bullmq";
import IORedis from "ioredis";

export const NOTIFICATION_QUEUE_NAME = "flowforge-notifications";

let queue: Queue | undefined;
let connection: IORedis | undefined;

function getQueue() {
  if (!queue) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy: (attempt) => (attempt < 3 ? attempt * 250 : null),
    });
    queue = new Queue(NOTIFICATION_QUEUE_NAME, { connection });
  }
  return queue;
}

export function enqueueNotification(notificationId: string) {
  return getQueue().add("process-notification", { notificationId }, {
    jobId: `notification-${notificationId}`,
    removeOnComplete: 500,
    removeOnFail: 1000,
  });
}

export async function closeNotificationQueue() {
  await queue?.close();
  await connection?.quit();
  queue = undefined;
  connection = undefined;
}
