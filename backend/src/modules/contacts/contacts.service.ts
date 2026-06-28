import { createHash } from 'node:crypto';
import { Contact } from './contact.model.js';
import { User } from '../users/user.model.js';
import type { SyncContactsInput } from './contacts.schema.js';

function hashPhone(phone: string): string {
  return createHash('sha256').update(phone).digest('hex');
}

export interface SyncedContact {
  contactName: string;
  phone: string;
  isMember: boolean;
  memberId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  username: string | null;
  publicKey: string | null;
}

export async function syncContacts(
  userId: string,
  input: SyncContactsInput,
): Promise<SyncedContact[]> {
  const phoneHashes = input.contacts.map((c) => hashPhone(c.phone));
  const phones = input.contacts.map((c) => c.phone);

  const memberUsers = await User.find({ phoneE164: { $in: phones } }).lean();
  const phoneToUser = new Map(memberUsers.map((u) => [u.phoneE164, u]));

  const results: SyncedContact[] = [];
  const upsertOps: Promise<unknown>[] = [];

  for (const entry of input.contacts) {
    const memberUser = phoneToUser.get(entry.phone);
    const phoneHash = hashPhone(entry.phone);
    const isMember = !!memberUser;

    results.push({
      contactName: entry.name,
      phone: entry.phone,
      isMember,
      memberId: memberUser ? memberUser._id.toString() : null,
      displayName: memberUser ? memberUser.displayName : null,
      avatarUrl: memberUser ? memberUser.avatarUrl : null,
      username: memberUser ? memberUser.username : null,
      publicKey: memberUser ? memberUser.publicKey : null,
    });

    upsertOps.push(
      Contact.updateOne(
        { userId, phoneHash },
        {
          $set: {
            userId,
            phoneHash,
            contactName: entry.name,
            isMember,
            memberId: memberUser ? memberUser._id : null,
            syncedAt: new Date(),
          },
        },
        { upsert: true },
      ),
    );
  }

  await Promise.all(upsertOps);

  return results;
}

export async function getStoredContacts(userId: string): Promise<SyncedContact[]> {
  const contacts = await Contact.find({ userId }).lean();

  const memberIds = contacts
    .filter((c) => c.isMember && c.memberId)
    .map((c) => c.memberId!);

  const memberUsers = memberIds.length > 0
    ? await User.find({ _id: { $in: memberIds } }).lean()
    : [];

  const userMap = new Map(memberUsers.map((u) => [u._id.toString(), u]));

  return contacts.map((c) => {
    const memberUser = c.memberId ? userMap.get(c.memberId.toString()) : null;
    return {
      contactName: c.contactName,
      phone: '',
      isMember: c.isMember,
      memberId: c.memberId ? c.memberId.toString() : null,
      displayName: memberUser ? memberUser.displayName : null,
      avatarUrl: memberUser ? memberUser.avatarUrl : null,
      username: memberUser ? memberUser.username : null,
      publicKey: memberUser ? memberUser.publicKey : null,
    };
  });
}
