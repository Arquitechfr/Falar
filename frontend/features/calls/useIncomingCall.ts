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
  const initIncoming = useCallStore((s) => s.initIncoming);
  const state = useCallStore((s) => s.state);
  const stateRef = useRef(state);
  stateRef.current = state;
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const registerListeners = () => {
      const socket = getSocket();
      if (!socket) return () => {};

      const onIncoming = (data: IncomingCallData) => {
        if (stateRef.current !== 'idle') return;

        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;

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
        const { callId: currentCallId } = useCallStore.getState();
        if (data.callId === currentCallId) {
          useCallStore.getState().setCallState('ended');
          setTimeout(() => {
            useCallStore.getState().reset();
            isNavigatingRef.current = false;
            router.back();
          }, 500);
        }
      };

      const onCallReject = (data: { callId: string }) => {
        const { callId: currentCallId } = useCallStore.getState();
        if (data.callId === currentCallId) {
          useCallStore.getState().setCallState('ended');
          setTimeout(() => {
            useCallStore.getState().reset();
            isNavigatingRef.current = false;
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
    };

    const socket = getSocket();

    if (socket?.connected) {
      return registerListeners();
    }

    let cleanup: (() => void) | undefined;

    const onConnect = () => {
      cleanup = registerListeners();
    };

    if (socket) {
      socket.on('connect', onConnect);
      return () => {
        socket.off('connect', onConnect);
        cleanup?.();
      };
    }

    const retryTimer = setTimeout(() => {
      cleanup = registerListeners();
    }, 500);

    return () => {
      clearTimeout(retryTimer);
      cleanup?.();
    };
  }, [router, initIncoming]);
}
