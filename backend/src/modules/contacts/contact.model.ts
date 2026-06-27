import { Schema, model, Types } from 'mongoose';

export interface IContact {
  _id: string;
  userId: Types.ObjectId;
  phoneHash: string;
  contactName: string;
  isMember: boolean;
  memberId: Types.ObjectId | null;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phoneHash: { type: String, required: true },
    contactName: { type: String, default: '' },
    isMember: { type: Boolean, default: false },
    memberId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

contactSchema.index({ userId: 1, phoneHash: 1 }, { unique: true });

export const Contact = model<IContact>('Contact', contactSchema);
