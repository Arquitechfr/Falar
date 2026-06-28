import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Avatar } from '@/components/ui';
import { Mic, MicOff, Volume2, Bluetooth, Grid, PhoneOff, PhoneCall } from '@/components/ui/Icons';
import { useWebRTC } from '@/features/calls/useWebRTC';
import { useCallStore } from '@/features/calls/callStore';
import { startCall as startCallApi } from '@/features/calls/callsApi';
import { getSocket } from '@/services/socket';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 };

function CallButton({
  icon,
  onPress,
  active = false,
  bgColor,
  size = 60,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  bgColor?: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor || (active ? colors.primary : colors.card),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Pressable>
    </Animated.View>
  );
}

export default function AudioCallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ recipientName: string; recipientId: string }>();

  const [seconds, setSeconds] = useState(0);
  const [bluetooth, setBluetooth] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const webrtc = useWebRTC();
  const { state, muted, speakerEnabled, startedAt } = useCallStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await startCallApi(params.recipientId, 'audio');
        if (cancelled) return;

        useCallStore.getState().initOutgoing(
          params.recipientId,
          params.recipientName,
          'audio',
          result.callId,
          result.conversationId,
        );

        await webrtc.startOutgoingCall();
      } catch (err) {
        if (!cancelled) {
          console.error('[AudioCall] init error:', err);
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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleHangup = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    webrtc.endCall();
    router.back();
  }, [webrtc, router]);

  const statusText = state === 'connecting' ? 'Appel en cours...' : state === 'connected' ? 'Appel en cours' : state === 'ended' ? 'Appel terminé' : 'Connexion...';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xxl }}>
        <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxl }}>
          <Avatar name={params.recipientName || '?'} size={120} />
          <Text style={{ ...typography.heading, color: colors.textPrimary, marginTop: spacing.md }}>
            {params.recipientName || 'Appel'}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            {state === 'connected' ? formatTime(seconds) : statusText}
          </Text>
          {initError && (
            <Text style={{ ...typography.caption, color: colors.danger }}>{initError}</Text>
          )}
        </View>

        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PhoneCall size={16} color={state === 'connected' ? colors.success : colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={{ ...typography.caption, color: state === 'connected' ? colors.success : colors.textSecondary }}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', gap: spacing.lg, paddingBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ marginRight: spacing.lg }}>
              <CallButton
                icon={muted ? <MicOff size={24} color="#FFFFFF" /> : <Mic size={24} color={colors.textPrimary} />}
                onPress={webrtc.toggleMute}
                active={muted}
              />
            </View>
            <View style={{ marginRight: spacing.lg }}>
              <CallButton
                icon={<Volume2 size={24} color={speakerEnabled ? '#FFFFFF' : colors.textPrimary} />}
                onPress={webrtc.toggleSpeaker}
                active={speakerEnabled}
              />
            </View>
            <CallButton
              icon={<Bluetooth size={24} color={bluetooth ? '#FFFFFF' : colors.textPrimary} />}
              onPress={() => setBluetooth(!bluetooth)}
              active={bluetooth}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ marginRight: spacing.lg }}>
              <CallButton
                icon={<Grid size={24} color={showKeypad ? '#FFFFFF' : colors.textPrimary} />}
                onPress={() => setShowKeypad(!showKeypad)}
                active={showKeypad}
                size={50}
              />
            </View>
            <CallButton
              icon={<PhoneOff size={28} color="#FFFFFF" />}
              onPress={handleHangup}
              bgColor={colors.danger}
              size={70}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
