import { useState, useCallback } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { Send, Paperclip } from '@/components/ui/Icons';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 };

interface MessageInputProps {
  onSend: (text: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export function MessageInput({ onSend, onTypingStart, onTypingStop }: MessageInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const sendScale = useSharedValue(1);
  const sendOpacity = useSharedValue(0);

  const hasText = text.trim().length > 0;

  const updateSendButton = useCallback((show: boolean) => {
    sendOpacity.value = withTiming(show ? 1 : 0, { duration: 150 });
  }, [sendOpacity]);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendScale.value = withSpring(0.85, SPRING_CONFIG, () => {
      sendScale.value = withSpring(1, SPRING_CONFIG);
    });
    onSend(text.trim());
    setText('');
    onTypingStop();
    updateSendButton(false);
  }, [text, onSend, onTypingStop, sendScale, updateSendButton]);

  const handleChangeText = useCallback((v: string) => {
    setText(v);
    if (v.length > 0) {
      onTypingStart();
      updateSendButton(true);
    } else {
      onTypingStop();
      updateSendButton(false);
    }
  }, [onTypingStart, onTypingStop, updateSendButton]);

  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
    opacity: sendOpacity.value,
  }));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: colors.card,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
      }}
    >
      <Pressable
        disabled
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
          marginRight: spacing.sm,
          opacity: 0.4,
        }}
      >
        <Paperclip size={22} color={colors.textSecondary} />
      </Pressable>

      <TextInput
        style={{
          ...typography.body,
          color: colors.textPrimary,
          flex: 1,
          minHeight: 36,
          maxHeight: 100,
          borderRadius: radii.lg,
          backgroundColor: colors.secondaryBackground,
          paddingHorizontal: spacing.md,
          paddingVertical: 8,
          marginRight: spacing.sm,
        }}
        placeholder="Message"
        placeholderTextColor={colors.textSecondary}
        value={text}
        onChangeText={handleChangeText}
        onBlur={() => onTypingStop()}
        multiline
        maxLength={4096}
      />

      <Animated.View style={[sendAnimatedStyle]}>
        <Pressable
          onPress={handleSend}
          disabled={!hasText}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}
        >
          <Send size={18} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}
