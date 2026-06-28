import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Avatar } from '@/components/ui';
import { Phone, Video, PhoneOff } from '@/components/ui/Icons';
import { useWebRTC } from '@/features/calls/useWebRTC';
import { useCallStore } from '@/features/calls/callStore';
import { getSocket } from '@/services/socket';

export default function IncomingCallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    callId: string;
    callerId: string;
    type: 'audio' | 'video';
    conversationId: string;
  }>();

  const webrtc = useWebRTC();
  const { state, type } = useCallStore();
  const [callerName, setCallerName] = useState('Appel entrant');

  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    ringScale.value = withRepeat(
      withTiming(1.4, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      true,
    );
    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onOffer = (data: { callId: string; callerId: string; sdp: unknown }) => {
      if (data.callId === params.callId && data.callerId === params.callerId) {
        webrtc.handleRemoteOffer(data.sdp as RTCSessionDescriptionInit);
      }
    };

    const onIce = (data: { callerId: string; candidate: unknown }) => {
      if (data.callerId === params.callerId) {
        webrtc.handleIceCandidate(data.candidate as RTCIceCandidateInit);
      }
    };

    const onEnd = (data: { callId: string }) => {
      if (data.callId === params.callId) {
        useCallStore.getState().setCallState('ended');
        setTimeout(() => {
          useCallStore.getState().reset();
          router.back();
        }, 500);
      }
    };

    socket.on('call:offer', onOffer);
    socket.on('call:ice-candidate', onIce);
    socket.on('call:end', onEnd);

    return () => {
      socket.off('call:offer', onOffer);
      socket.off('call:ice-candidate', onIce);
      socket.off('call:end', onEnd);
    };
  }, [params.callId, params.callerId, router]);

  const handleAccept = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await webrtc.acceptIncomingCall();

    if (params.type === 'video') {
      router.replace('/(main)/call/video', { params: { recipientName: callerName, recipientId: params.callerId } });
    } else {
      router.replace('/(main)/call/audio', { params: { recipientName: callerName, recipientId: params.callerId } });
    }
  }, [webrtc, params, callerName, router]);

  const handleReject = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    webrtc.rejectCall();
    router.back();
  }, [webrtc, router]);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xxl }}>
        {/* Top: Caller info */}
        <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxl }}>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            Appel {type === 'video' ? 'vidéo' : 'audio'} entrant
          </Text>
          <Text style={{ ...typography.heading, color: colors.textPrimary }}>
            {callerName}
          </Text>
        </View>

        {/* Middle: Avatar with ringing animation */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={[
              {
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: colors.primary,
                position: 'absolute',
              },
              ringAnimatedStyle,
            ]}
          />
          <Avatar name={callerName} size={120} />
        </View>

        {/* Bottom: Accept / Reject */}
        <View style={{ alignItems: 'center', gap: spacing.lg, paddingBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', gap: spacing.sm, marginRight: 60 }}>
              <Pressable
                onPress={handleReject}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.danger,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PhoneOff size={28} color="#FFFFFF" />
              </Pressable>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>Refuser</Text>
            </View>

            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <Pressable
                onPress={handleAccept}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.success,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {type === 'video' ? (
                  <Video size={28} color="#FFFFFF" />
                ) : (
                  <Phone size={28} color="#FFFFFF" />
                )}
              </Pressable>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>Accepter</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
