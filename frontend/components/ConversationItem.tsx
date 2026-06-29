import { useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Avatar } from '@/components/ui';
import { ContextMenu, type ActionSheetItem } from '@/components/ui/ContextMenu';
import { Pin, Archive, Trash, BellOff } from '@/components/ui/Icons';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 };
const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

interface ConversationItemProps {
  contact: string;
  lastMessagePreview: string;
  lastTimestamp: string;
  unreadCount: number;
  avatarUrl?: string;
  online?: boolean;
  isNew?: boolean;
  onPress: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

function formatTime(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export const ConversationItem = memo(function ConversationItem({
  contact,
  lastMessagePreview,
  lastTimestamp,
  unreadCount,
  avatarUrl,
  online = false,
  isNew = false,
  onPress,
  onPin,
  onArchive,
  onMute,
  onDelete,
  style,
}: ConversationItemProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const newMsgScale = useSharedValue(isNew ? 0.95 : 1);
  const newMsgOpacity = useSharedValue(isNew ? 0 : 1);

  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;
  const onArchiveRef = useRef(onArchive);
  onArchiveRef.current = onArchive;
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    if (isNew) {
      newMsgScale.value = withSpring(1, SPRING_CONFIG);
      newMsgOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [isNew, newMsgScale, newMsgOpacity]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressRef.current?.();
  }, []);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDeleteRef.current?.();
  }, []);

  const handleArchive = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onArchiveRef.current?.();
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeActivationDistance(20)
        .failOffsetY([-5, 5])
        .onUpdate((e) => {
          translateX.value = e.translationX;
        })
        .onEnd((e) => {
          if (e.translationX < -SWIPE_THRESHOLD) {
            runOnJS(handleDelete)();
          } else if (e.translationX > SWIPE_THRESHOLD) {
            runOnJS(handleArchive)();
          }
          translateX.value = withSpring(0, SPRING_CONFIG);
        }),
    [translateX, handleDelete, handleArchive],
  );

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const newMsgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: newMsgScale.value }],
    opacity: newMsgOpacity.value,
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
    transform: [{ translateX: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [-ACTION_WIDTH, 0], 'clamp') }],
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], 'clamp'),
    transform: [{ translateX: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [ACTION_WIDTH, 0], 'clamp') }],
  }));

  const actions: ActionSheetItem[] = [];
  if (onPin) actions.push({ label: 'Épingler', icon: <Pin size={20} color={colors.textPrimary} />, onPress: onPin });
  if (onMute) actions.push({ label: 'Mettre en silencieux', icon: <BellOff size={20} color={colors.textPrimary} />, onPress: onMute });
  if (onArchive) actions.push({ label: 'Archiver', icon: <Archive size={20} color={colors.textPrimary} />, onPress: onArchive });
  if (onDelete) actions.push({ label: 'Supprimer', icon: <Trash size={20} color={colors.danger} />, onPress: onDelete, destructive: true });

  return (
    <ContextMenu actions={actions} title={contact}>
      <View style={{ overflow: 'hidden' }}>
        {/* Left actions (Archive + Mute) */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
            },
            leftActionStyle,
          ]}
        >
          {onArchive && (
            <View
              style={{
                width: ACTION_WIDTH,
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.secondaryBackground,
              }}
            >
              <Archive size={22} color={colors.textPrimary} />
            </View>
          )}
          {onMute && (
            <View
              style={{
                width: ACTION_WIDTH,
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.border,
              }}
            >
              <BellOff size={22} color={colors.textPrimary} />
            </View>
          )}
        </Animated.View>

        {/* Right actions (Delete) */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
            },
            rightActionStyle,
          ]}
        >
          <View
            style={{
              width: ACTION_WIDTH,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.danger,
            }}
          >
            <Trash size={22} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Main content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[animatedContentStyle, animatedScaleStyle, newMsgStyle]}>
            <Pressable
              onPress={handlePress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
                backgroundColor: pressed ? colors.secondaryBackground : colors.background,
              })}
            >
              <Avatar name={contact} size={52} avatarUrl={avatarUrl} online={online} />
              <View style={{ flex: 1, marginLeft: spacing.sm + 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text
                    style={{
                      ...typography.subtitle,
                      color: colors.textPrimary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {contact}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: unreadCount > 0 ? colors.primary : colors.textSecondary,
                      marginLeft: spacing.sm,
                    }}
                  >
                    {formatTime(lastTimestamp)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <Text
                    style={{
                      ...typography.caption,
                      color: unreadCount > 0 ? colors.textPrimary : colors.textSecondary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {lastMessagePreview}
                  </Text>
                  {unreadCount > 0 && (
                    <View
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 6,
                        marginLeft: spacing.sm,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.micro,
                          fontFamily: 'Outfit_700Bold',
                          color: '#FFFFFF',
                          fontWeight: '700',
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </ContextMenu>
  );
});
