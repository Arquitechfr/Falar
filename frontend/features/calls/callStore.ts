import { create } from 'zustand';

// Lazy import type for WebRTC to reduce bundle size
type MediaStream = any;

export type CallState = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';
export type CallType = 'audio' | 'video';
export type CallRole = 'caller' | 'callee';

interface CallData {
  state: CallState;
  type: CallType;
  role: CallRole;
  callId: string | null;
  recipientId: string;
  recipientName: string;
  conversationId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  videoEnabled: boolean;
  speakerEnabled: boolean;
  startedAt: number | null;
}

interface CallStore extends CallData {
  setCallState: (state: CallState) => void;
  initOutgoing: (recipientId: string, recipientName: string, type: CallType, callId: string, conversationId: string) => void;
  initIncoming: (callerId: string, callerName: string, type: CallType, callId: string, conversationId: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setMuted: (muted: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setSpeakerEnabled: (enabled: boolean) => void;
  setStartedAt: (ts: number) => void;
  reset: () => void;
}

const initialState: CallData = {
  state: 'idle',
  type: 'audio',
  role: 'caller',
  callId: null,
  recipientId: '',
  recipientName: '',
  conversationId: '',
  localStream: null,
  remoteStream: null,
  muted: false,
  videoEnabled: true,
  speakerEnabled: false,
  startedAt: null,
};

export const useCallStore = create<CallStore>((set) => ({
  ...initialState,

  setCallState: (state) => set({ state }),

  initOutgoing: (recipientId, recipientName, type, callId, conversationId) =>
    set({
      state: 'connecting',
      type,
      role: 'caller',
      callId,
      recipientId,
      recipientName,
      conversationId,
      startedAt: Date.now(),
    }),

  initIncoming: (callerId, callerName, type, callId, conversationId) =>
    set({
      state: 'ringing',
      type,
      role: 'callee',
      callId,
      recipientId: callerId,
      recipientName: callerName,
      conversationId,
    }),

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setMuted: (muted) => set({ muted }),
  setVideoEnabled: (videoEnabled) => set({ videoEnabled }),
  setSpeakerEnabled: (speakerEnabled) => set({ speakerEnabled }),
  setStartedAt: (startedAt) => set({ startedAt }),

  reset: () => set({ ...initialState }),
}));
