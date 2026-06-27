import { Schema, model, Types } from 'mongoose';

export type CallType = 'audio' | 'video';
export type CallStatus = 'initiated' | 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';

export interface ICall {
  _id: string;
  callerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  conversationId: string;
  type: CallType;
  status: CallStatus;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    type: { type: String, enum: ['audio', 'video'], required: true },
    status: { type: String, enum: ['initiated', 'ringing', 'accepted', 'rejected', 'ended', 'missed'], default: 'initiated' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: null },
  },
  { timestamps: true },
);

callSchema.index({ callerId: 1, recipientId: 1, createdAt: -1 });

export const Call = model<ICall>('Call', callSchema);
