import { useCallback } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Avatar, Badge } from '@/components/ui';
import { Share } from '@/components/ui/Icons';
import type { SyncedContact } from '@/features/contacts/contactsApi';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 };

function formatPhone(phone: string): string {
  const parsed = parsePhoneNumberFromString(phone);
  return parsed ? parsed.formatInternational() : phone;
}

export interface ContactItemProps {
  contact: SyncedContact;
  onPress?: (contact: SyncedContact) => void;
  onInvite?: (contact: SyncedContact) => void;
  style?: ViewStyle;
}

export function ContactItem({ contact, onPress, onInvite, style }: ContactItemProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (contact.isMember) {
      onPress?.(contact);
    } else {
      (onInvite ?? onPress)?.(contact);
    }
  }, [contact, onPress, onInvite]);

  const secondary = contact.isMember
    ? contact.username
      ? `@${contact.username}`
      : contact.displayName && contact.displayName !== contact.contactName
        ? contact.displayName
        : ''
    : formatPhone(contact.phone);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.98, SPRING_CONFIG); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG); }}
      style={({ pressed }) => [
        animatedStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Avatar
        name={contact.displayName || contact.contactName}
        size={52}
        avatarUrl={contact.avatarUrl || undefined}
      />
      <View style={{ flex: 1, marginLeft: spacing.sm + 2, justifyContent: 'center' }}>
        <Text style={{ ...typography.subtitle, color: colors.textPrimary }} numberOfLines={1}>
          {contact.contactName}
        </Text>
        {secondary ? (
          <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </View>
      <View style={{ marginLeft: spacing.sm }}>
        {contact.isMember ? (
          <Badge label="Membre" variant="success" size="sm" />
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Share size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={{ ...typography.micro, color: '#FFFFFF', fontWeight: '600' }}>
              Inviter
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}
