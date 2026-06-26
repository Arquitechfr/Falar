import { Message } from './message.model.js';
import { User } from '../users/user.model.js';

export interface ConversationSummary {
  conversationId: string;
  lastMessage: {
    encryptedPayload: string;
    nonce: string;
    senderId: string;
  };
  lastTimestamp: Date;
  unreadCount: number;
  participantId: string;
  participantDisplayName: string;
  participantPublicKey: string;
  participantAvatarUrl: string;
}

export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { recipientId: userId }],
      },
    },
    {
      $sort: { serverTimestamp: -1 },
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$encryptedPayload' },
        lastNonce: { $first: '$nonce' },
        lastSenderId: { $first: '$senderId' },
        lastTimestamp: { $first: '$serverTimestamp' },
        lastRecipientId: { $first: '$recipientId' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$recipientId', userId] }, { $ne: ['$status', 'read'] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $sort: { lastTimestamp: -1 },
    },
  ]);

  if (conversations.length === 0) return [];

  const participantIds = conversations.map((c) => {
    const participantId =
      c.lastSenderId.toString() === userId ? c.lastRecipientId : c.lastSenderId;
    return participantId;
  });

  const users = await User.find({ _id: { $in: participantIds } }).lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return conversations.map((c) => {
    const participantId =
      c.lastSenderId.toString() === userId ? c.lastRecipientId.toString() : c.lastSenderId.toString();
    const participant = userMap.get(participantId);

    return {
      conversationId: c._id,
      lastMessage: {
        encryptedPayload: c.lastMessage,
        nonce: c.lastNonce,
        senderId: c.lastSenderId.toString(),
      },
      lastTimestamp: c.lastTimestamp,
      unreadCount: c.unreadCount,
      participantId,
      participantDisplayName: participant?.displayName || '',
      participantPublicKey: participant?.publicKey || '',
      participantAvatarUrl: participant?.avatarUrl || '',
    };
  });
}
