import { Notification } from './notification.model.js';

export async function getNotifications(userId: string, limit: number = 50): Promise<unknown[]> {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return notifications;
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await Notification.findOneAndUpdate({ _id: notificationId, userId }, { read: true });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await Notification.updateMany({ userId, read: false }, { read: true });
}

export async function createNotification(
  userId: string,
  type: 'message' | 'call' | 'contact' | 'system',
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  await Notification.create({ userId, type, title, body, data, read: false });
}
