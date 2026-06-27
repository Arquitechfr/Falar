import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { ScreenHeader, Card } from '@/components/ui';
import { User, Shield, Bell, Moon, Database, Globe, HelpCircle, Info, ChevronRight, Users } from '@/components/ui/Icons';

interface SettingsItem {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const sections: SettingsSection[] = [
    {
      title: 'Compte',
      items: [
        { icon: <User size={20} color={colors.primary} />, label: 'Profil', onPress: () => router.push('/(main)/profile') },
        { icon: <Users size={20} color={colors.primary} />, label: 'Contacts', onPress: () => router.push('/(main)/contacts') },
        { icon: <Shield size={20} color={colors.primary} />, label: 'Confidentialité', value: 'Activée' },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { icon: <Bell size={20} color={colors.primary} />, label: 'Notifications push', value: 'Activées' },
      ],
    },
    {
      title: 'Apparence',
      items: [
        { icon: <Moon size={20} color={colors.primary} />, label: 'Thème', value: 'Automatique' },
      ],
    },
    {
      title: 'Données',
      items: [
        { icon: <Database size={20} color={colors.primary} />, label: 'Stockage', value: '0 Mo' },
        { icon: <Globe size={20} color={colors.primary} />, label: 'Langue', value: 'Français' },
      ],
    },
    {
      title: 'Aide',
      items: [
        { icon: <HelpCircle size={20} color={colors.primary} />, label: 'Centre d\'aide' },
        { icon: <Info size={20} color={colors.primary} />, label: 'À propos de Falar', value: 'v1.0.0' },
      ],
    },
  ];

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Paramètres" onBack={() => router.back()} showBack />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg }}>
        {sections.map((section, sIndex) => (
          <View key={sIndex} style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.captionMedium, color: colors.textSecondary, marginLeft: spacing.xs }}>
              {section.title.toUpperCase()}
            </Text>
            <Card padding={0}>
              {section.items.map((item, iIndex) => (
                <Pressable
                  key={iIndex}
                  onPress={item.onPress}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    gap: spacing.sm,
                    backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
                    borderBottomWidth: iIndex < section.items.length - 1 ? 0.5 : 0,
                    borderBottomColor: colors.border,
                  })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondaryBackground, alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </View>
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>
                    {item.label}
                  </Text>
                  {item.value && (
                    <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                      {item.value}
                    </Text>
                  )}
                  <ChevronRight size={16} color={colors.textSecondary} />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeScreen>
  );
}
