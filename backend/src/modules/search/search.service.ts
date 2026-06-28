import { User } from '../users/user.model.js';
import { Message } from '../messages/message.model.js';

export async function searchUsers(userId: string, query: string): Promise<unknown[]> {
  const users = await User.find({
    _id: { $ne: userId },
    $or: [
      { displayName: { $regex: query, $options: 'i' } },
      { username: { $regex: query, $options: 'i' } },
      { phoneE164: { $regex: query, $options: 'i' } },
    ],
  })
    .limit(20)
    .lean();

  return users.map((u) => ({
    id: u._id.toString(),
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    username: u.username,
    phone: u.phoneE164,
  }));
}

export async function searchMedia(userId: string, query: string): Promise<unknown[]> {
  const messages = await Message.find({
    $or: [{ senderId: userId }, { recipientId: userId }],
    mediaUrl: { $regex: query, $options: 'i', $ne: '' },
  })
    .sort({ serverTimestamp: -1 })
    .limit(20)
    .lean();

  return messages.map((m) => ({
    id: m._id.toString(),
    mediaUrl: m.mediaUrl,
    conversationId: m.conversationId,
    timestamp: m.serverTimestamp,
  }));
}
