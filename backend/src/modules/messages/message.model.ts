import { Schema, model } from 'mongoose';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  encryptedPayload: string;
  nonce: string;
  mediaUrl: string;
  status: MessageStatus;
  clientTimestamp: Date;
  serverTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    encryptedPayload: { type: String, required: true },
    nonce: { type: String, required: true },
    mediaUrl: { type: String, default: '' },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    clientTimestamp: { type: Date, required: true },
    serverTimestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, serverTimestamp: -1 });

export const Message = model<IMessage>('Message', messageSchema);
