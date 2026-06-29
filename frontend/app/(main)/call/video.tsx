import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Avatar } from '@/components/ui';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from '@/components/ui/Icons';
import { useWebRTC } from '@/features/calls/useWebRTC';
import { useCallStore } from '@/features/calls/callStore';
import { startCall as startCallApi } from '@/features/calls/callsApi';
import { getSocket } from '@/services/socket';
import { logger } from '@/services/api';

// Lazy import RTCView to reduce bundle size
let RTCView: any = null;
const getRTCView = () => {
  if (!RTCView) {
    RTCView = require('react-native-webrtc').RTCView;
  }
  return RTCView;
};

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 };

function VideoCallButton({
  icon,
  onPress,
  active = false,
  bgColor,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  bgColor?: string;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onPressIn={() => { scale.value = withSpring(0.9, SPRING_CONFIG); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG); }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: bgColor || (active ? colors.primary : 'rgba(255,255,255,0.15)'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Pressable>
    </Animated.View>
  );
}

export default function VideoCallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ recipientName: string; recipientId: string }>();

  const [seconds, setSeconds] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const webrtc = useWebRTC();
  const { state, muted, videoEnabled, startedAt, localStream, remoteStream } = useCallStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await startCallApi(params.recipientId, 'video');
        if (cancelled) return;

        useCallStore.getState().initOutgoing(
          params.recipientId,
          params.recipientName,
          'video',
          result.callId,
          result.conversationId,
        );

        await webrtc.startOutgoingCall();
      } catch (err) {
        if (!cancelled) {
          logger.error('[VideoCall] init error:', err);
          setInitError('Impossible de démarrer l\'appel');
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onAnswer = (data: { callId: string; sdp: unknown }) => {
      if (data.callId === useCallStore.getState().callId && data.sdp) {
        webrtc.handleRemoteAnswer(data.sdp as RTCSessionDescriptionInit);
      }
    };

    const onIce = (data: { callerId: string; candidate: unknown }) => {
      if (data.callerId === params.recipientId) {
        webrtc.handleIceCandidate(data.candidate as RTCIceCandidateInit);
      }
    };

    const onReject = (data: { callId: string }) => {
      if (data.callId === useCallStore.getState().callId) {
        useCallStore.getState().setCallState('ended');
        setTimeout(() => router.back(), 1000);
      }
    };

    const onEnd = (data: { callId: string }) => {
      if (data.callId === useCallStore.getState().callId) {
        useCallStore.getState().setCallState('ended');
        setTimeout(() => router.back(), 1000);
      }
    };

    socket.on('call:answer', onAnswer);
    socket.on('call:ice-candidate', onIce);
    socket.on('call:reject', onReject);
    socket.on('call:end', onEnd);

    return () => {
      socket.off('call:answer', onAnswer);
      socket.off('call:ice-candidate', onIce);
      socket.off('call:reject', onReject);
      socket.off('call:end', onEnd);
    };
  }, [params.recipientId, router]);

  useEffect(() => {
    if (state === 'connected' && startedAt) {
      const interval = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state, startedAt]);

  const controlsVisibleRef = useRef(controlsVisible);
  controlsVisibleRef.current = controlsVisible;

  useEffect(() => {
    if (!controlsVisible) return;
    const timeout = setTimeout(() => {
      if (controlsVisibleRef.current) {
        setControlsVisible(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [controlsVisible]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(controlsVisible ? 1 : 0, { duration: 300 }),
  }));

  const handleHangup = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    webrtc.endCall();
    router.back();
  }, [webrtc, router]);

  const toggleControls = useCallback(() => {
    setControlsVisible((v) => !v);
  }, []);

  const statusText = state === 'connecting' ? 'Connexion...' : state === 'connected' ? formatTime(seconds) : state === 'ended' ? 'Terminé' : 'Connexion...';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <Pressable onPress={toggleControls} style={{ flex: 1 }}>
        {/* Remote video (full screen) */}
        {remoteStream ? (
          getRTCView()({
            streamURL: remoteStream.toURL(),
            style: { flex: 1, backgroundColor: '#000000' },
            objectFit: 'cover',
            mirror: false,
          })
        ) : (
          <View style={{ flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar name={params.recipientName || '?'} size={120} />
            <Text style={{ ...typography.body, color: '#FFFFFF', opacity: 0.5, marginTop: spacing.md }}>
              {statusText}
            </Text>
            {initError && (
              <Text style={{ ...typography.caption, color: colors.danger, marginTop: spacing.sm }}>
                {initError}
              </Text>
            )}
          </View>
        )}

        {/* Self view floating */}
        <View
          style={{
            position: 'absolute',
            top: spacing.xl,
            right: spacing.lg,
            width: 100,
            height: 140,
            borderRadius: 16,
            backgroundColor: '#333',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}
        >
          {localStream && videoEnabled ? (
            getRTCView()({
              streamURL: localStream.toURL(),
              style: { flex: 1 },
              objectFit: 'cover',
              mirror: true,
            })
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ ...typography.micro, color: '#FFFFFF', opacity: 0.5 }}>Vous</Text>
            </View>
          )}
        </View>

        {/* Top info */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: spacing.xxl,
              left: 0,
              right: 0,
              alignItems: 'center',
            },
            controlsAnimatedStyle,
          ]}
        >
          <Text style={{ ...typography.subtitle, color: '#FFFFFF' }}>
            {params.recipientName || 'Appel vidéo'}
          </Text>
          <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {statusText}
          </Text>
        </Animated.View>

        {/* Bottom controls */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: spacing.xxl,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
            },
            controlsAnimatedStyle,
          ]}
        >
          <View style={{ marginRight: spacing.lg }}>
            <VideoCallButton
              icon={muted ? <MicOff size={24} color="#FFFFFF" /> : <Mic size={24} color="#FFFFFF" />}
              onPress={webrtc.toggleMute}
              active={muted}
            />
          </View>
          <View style={{ marginRight: spacing.lg }}>
            <VideoCallButton
              icon={videoEnabled ? <Video size={24} color="#FFFFFF" /> : <VideoOff size={24} color="#FFFFFF" />}
              onPress={webrtc.toggleVideo}
              active={!videoEnabled}
            />
          </View>
          <VideoCallButton
            icon={<PhoneOff size={24} color="#FFFFFF" />}
            onPress={handleHangup}
            bgColor={colors.danger}
          />
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}
