import { Schema, model } from 'mongoose';

export interface IUser {
  _id: string;
  phoneHash: string;
  phoneE164: string;
  publicKey: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  username: string;
  deviceToken: string;
  keySalt: string;
  allowDirectMessages: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneHash: { type: String, required: true, unique: true, index: true },
    phoneE164: { type: String, required: true },
    publicKey: { type: String, required: true },
    displayName: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 200 },
    username: { type: String, default: '', index: true },
    deviceToken: { type: String, default: '' },
    keySalt: { type: String, default: '' },
    allowDirectMessages: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
