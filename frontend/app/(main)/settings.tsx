import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { List } from 'react-native-paper';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';
import { ScreenHeader } from '@/components/ui';
import { User, Shield, Bell, Moon, Database, Globe, HelpCircle, Info, ChevronRight, Users } from '@/components/ui/Icons';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const iconBg = (icon: React.ReactNode) => (
    <View style={{
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.secondaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {icon}
    </View>
  );

  const rightArrow = () => <ChevronRight size={20} color={colors.textSecondary} />;

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Paramètres" onBack={() => router.back()} showBack />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        <List.Section>
          <List.Subheader style={{ color: colors.textSecondary, fontFamily: 'Outfit_500Medium', fontSize: 13, letterSpacing: 0.5 }}>
            COMPTE
          </List.Subheader>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' }}>
            <List.Item
              title="Profil"
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<User size={20} color={colors.primary} />)}
              right={rightArrow}
              onPress={() => router.push('/(main)/profile')}
              style={{ paddingVertical: spacing.sm }}
            />
            <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 60 }} />
            <List.Item
              title="Contacts"
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<Users size={20} color={colors.primary} />)}
              right={rightArrow}
              onPress={() => router.push('/(main)/contacts')}
              style={{ paddingVertical: spacing.sm }}
            />
            <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 60 }} />
            <List.Item
              title="Confidentialité"
              description="Activée"
              descriptionStyle={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13 }}
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<Shield size={20} color={colors.primary} />)}
              right={rightArrow}
              style={{ paddingVertical: spacing.sm }}
            />
          </View>
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: colors.textSecondary, fontFamily: 'Outfit_500Medium', fontSize: 13, letterSpacing: 0.5 }}>
            NOTIFICATIONS
          </List.Subheader>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' }}>
            <List.Item
              title="Notifications push"
              description="Activées"
              descriptionStyle={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13 }}
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<Bell size={20} color={colors.primary} />)}
              style={{ paddingVertical: spacing.sm }}
            />
          </View>
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: colors.textSecondary, fontFamily: 'Outfit_500Medium', fontSize: 13, letterSpacing: 0.5 }}>
            APPARENCE
          </List.Subheader>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' }}>
            <List.Item
              title="Thème"
              description="Automatique"
              descriptionStyle={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13 }}
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<Moon size={20} color={colors.primary} />)}
              style={{ paddingVertical: spacing.sm }}
            />
          </View>
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: colors.textSecondary, fontFamily: 'Outfit_500Medium', fontSize: 13, letterSpacing: 0.5 }}>
            DONNÉES
          </List.Subheader>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' }}>
            <List.Item
              title="Stockage"
              description="0 Mo"
              descriptionStyle={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13 }}
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<Database size={20} color={colors.primary} />)}
              style={{ paddingVertical: spacing.sm }}
            />
            <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 60 }} />
            <List.Item
              title="Langue"
              description="Français"
              descriptionStyle={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13 }}
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<Globe size={20} color={colors.primary} />)}
              style={{ paddingVertical: spacing.sm }}
            />
          </View>
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: colors.textSecondary, fontFamily: 'Outfit_500Medium', fontSize: 13, letterSpacing: 0.5 }}>
            AIDE
          </List.Subheader>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' }}>
            <List.Item
              title="Centre d'aide"
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<HelpCircle size={20} color={colors.primary} />)}
              right={rightArrow}
              style={{ paddingVertical: spacing.sm }}
            />
            <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 60 }} />
            <List.Item
              title="À propos de Falar"
              description="v1.0.0"
              descriptionStyle={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13 }}
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<Info size={20} color={colors.primary} />)}
              style={{ paddingVertical: spacing.sm }}
            />
          </View>
        </List.Section>
      </ScrollView>
    </SafeScreen>
  );
}
