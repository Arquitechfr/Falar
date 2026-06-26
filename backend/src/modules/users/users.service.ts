import { User } from './user.model.js';
import type { UpdateMeInput } from './users.schema.js';

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;
  return user;
}

export async function updateMe(userId: string, data: UpdateMeInput) {
  const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
  return user;
}

export async function searchByPhone(phone: string) {
  const user = await User.findOne({ phone });
  if (!user) return null;
  return {
    id: user._id.toString(),
    phone: user.phone,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    publicKey: user.publicKey,
  };
}
