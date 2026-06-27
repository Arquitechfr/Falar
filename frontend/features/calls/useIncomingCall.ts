import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getSocket } from '@/services/socket';
import { useCallStore } from './callStore';
import { endCall as endCallApi } from './callsApi';

interface IncomingCallData {
  callId: string;
  callerId: string;
  conversationId: string;
  type: 'audio' | 'video';
}

export function useIncomingCall() {
  const router = useRouter();
  const { initIncoming, state, callId, recipientId } = useCallStore();
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (data: IncomingCallData) => {
      if (stateRef.current !== 'idle') return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      initIncoming(
        data.callerId,
        'Appel entrant',
        data.type,
        data.callId,
        data.conversationId,
      );

      router.push({
        pathname: '/(main)/call/incoming',
        params: {
          callId: data.callId,
          callerId: data.callerId,
          type: data.type,
          conversationId: data.conversationId,
        },
      });
    };

    const onCallEnd = (data: { callId: string }) => {
      if (data.callId === callId) {
        useCallStore.getState().setCallState('ended');
        setTimeout(() => {
          useCallStore.getState().reset();
          router.back();
        }, 500);
      }
    };

    const onCallReject = (data: { callId: string }) => {
      if (data.callId === callId) {
        useCallStore.getState().setCallState('ended');
        setTimeout(() => {
          useCallStore.getState().reset();
          router.back();
        }, 500);
      }
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:end', onCallEnd);
    socket.on('call:reject', onCallReject);

    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:end', onCallEnd);
      socket.off('call:reject', onCallReject);
    };
  }, [router, initIncoming, callId, recipientId]);
}
