import { Schema, model } from 'mongoose';

export interface IUser {
  _id: string;
  phone: string;
  publicKey: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  username: string;
  deviceToken: string;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, index: true },
    publicKey: { type: String, required: true },
    displayName: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 200 },
    username: { type: String, default: '', index: true },
    deviceToken: { type: String, default: '' },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
