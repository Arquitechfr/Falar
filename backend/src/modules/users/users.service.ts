import { User } from './user.model.js';
import { Message } from '../messages/message.model.js';
import { Types } from 'mongoose';
import type { UpdateMeInput } from './users.schema.js';

export async function getMe(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    phone: user.phoneE164,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    username: user.username,
    publicKey: user.publicKey,
    keySalt: user.keySalt,
    lastSeen: user.lastSeen,
  };
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    phone: user.phoneE164,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    username: user.username,
    publicKey: user.publicKey,
    lastSeen: user.lastSeen,
  };
}

export async function updateMe(userId: string, data: UpdateMeInput) {
  const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
  return user;
}

export async function searchByPhone(phone: string) {
  const user = await User.findOne({ phoneE164: phone });
  if (!user) return null;
  return {
    id: user._id.toString(),
    phone: user.phoneE164,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    username: user.username,
    publicKey: user.publicKey,
  };
}

export async function getContacts(userId: string) {
  const userObjectId = new Types.ObjectId(userId);
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userObjectId }, { recipientId: userObjectId }],
      },
    },
    {
      $group: {
        _id: '$conversationId',
        participantId: {
          $first: {
            $cond: [
              { $eq: ['$senderId', userObjectId] },
              '$recipientId',
              '$senderId',
            ],
          },
        },
        lastTimestamp: { $first: '$serverTimestamp' },
      },
    },
    { $sort: { lastTimestamp: -1 } },
  ]);

  const participantIds = messages.map((m) => m.participantId);
  const users = await User.find({ _id: { $in: participantIds } }).lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return messages
    .map((m) => {
      const user = userMap.get(m.participantId.toString());
      if (!user) return null;
      return {
        id: user._id.toString(),
        phone: user.phoneE164,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        username: user.username,
        publicKey: user.publicKey,
        lastSeen: user.lastSeen,
      };
    })
    .filter(Boolean);
}
