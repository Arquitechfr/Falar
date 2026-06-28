import { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import type { ChatMessage } from '../chatStore';
import { StatusIcon } from './StatusIcon';

const SPRING_CONFIG = { damping: 18, stiffness: 300, mass: 0.6 };

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onRetry?: () => void;
  onReply?: (message: ChatMessage) => void;
  onLongPress?: () => void;
}

export function MessageBubble({ message, isMine, onRetry, onReply, onLongPress }: MessageBubbleProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);

  const time = new Date(message.serverTimestamp || message.clientTimestamp).toLocaleTimeString(
    'fr-FR',
    { hour: '2-digit', minute: '2-digit' },
  );

  const isUnread = message.decryptedText === '[message illisible]';
  const status = message.optimisticStatus || message.status;

  const panGesture = Gesture.Pan()
    .activeActivationDistance(10)
    .onUpdate((e) => {
      const direction = isMine ? -1 : 1;
      translateX.value = Math.max(0, e.translationX * direction) * direction;
    })
    .onEnd((e) => {
      const direction = isMine ? -1 : 1;
      const shouldReply = Math.abs(e.translationX) > 60 && e.translationX * direction > 0;
      if (shouldReply && onReply) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onReply)(message);
      }
      translateX.value = withSpring(0, SPRING_CONFIG);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      if (onLongPress) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onLongPress)();
      }
    });

  const composedGesture = Gesture.Race(panGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetry?.();
  }, [onRetry]);

  const bubbleBg = isMine ? colors.bubbleMine : colors.bubbleOther;
  const textColor = isMine ? '#FFFFFF' : colors.textPrimary;
  const timeColor = isMine ? 'rgba(255,255,255,0.6)' : colors.textSecondary;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            justifyContent: isMine ? 'flex-end' : 'flex-start',
            paddingHorizontal: spacing.md,
            paddingVertical: 2,
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            maxWidth: '78%',
            backgroundColor: bubbleBg,
            borderRadius: radii.md,
            borderTopLeftRadius: isMine ? radii.md : radii.xs,
            borderTopRightRadius: isMine ? radii.xs : radii.md,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: spacing.sm,
          }}
        >
          {isUnread ? (
            <Text style={{ ...typography.body, color: timeColor, fontStyle: 'italic' }}>
              [message illisible]
            </Text>
          ) : (
            <Text style={{ ...typography.body, color: textColor }}>
              {message.decryptedText}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, alignSelf: 'flex-end' }}>
            <Text style={{ ...typography.micro, color: timeColor, marginRight: 4 }}>{time}</Text>
            {isMine && <StatusIcon status={status} />}
          </View>

          {message.optimisticStatus === 'failed' && onRetry && (
            <Pressable
              onPress={handleRetry}
              hitSlop={8}
              style={{ marginTop: 4, alignSelf: 'flex-end' }}
            >
              <Text style={{ ...typography.caption, fontFamily: 'Outfit_600SemiBold', color: colors.danger, fontWeight: '600' }}>
                Réessayer
              </Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
