import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { ScreenHeader, Avatar, EmptyState, Skeleton } from '@/components/ui';
import api from '@/services/api';
import { Bell, Phone, MessageCircle, User, Info } from '@/components/ui/Icons';

interface NotificationItem {
  _id: string;
  type: 'message' | 'call' | 'contact' | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  message: <MessageCircle size={20} color="#FFFFFF" />,
  call: <Phone size={20} color="#FFFFFF" />,
  contact: <User size={20} color="#FFFFFF" />,
  system: <Info size={20} color="#FFFFFF" />,
};

const typeColors: Record<string, string> = {
  message: '#C96B4A',
  call: '#3FBF75',
  contact: '#F2A541',
  system: '#7B7B7B',
};

function formatTimeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Maintenant';
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d}j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: NotificationItem[] }>('/notifications');
      setNotifications(res.data.notifications);
    } catch {
      toast.show('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.show('Notifications marquées comme lues', 'success');
    } catch {
      toast.show('Erreur', 'error');
    }
  }, [toast]);

  const renderItem = useCallback(({ item }: { item: NotificationItem }) => (
    <Pressable
      onPress={() => { if (!item.read) { /* mark as read */ } }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm + 2,
        backgroundColor: pressed ? colors.secondaryBackground : (item.read ? 'transparent' : colors.secondaryBackground + '40'),
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: typeColors[item.type] || colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {typeIcons[item.type] || <Bell size={20} color="#FFFFFF" />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ ...typography.subtitle, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ ...typography.micro, color: colors.textSecondary }}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        {item.body && (
          <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={2}>
            {item.body}
          </Text>
        )}
      </View>
      {!item.read && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 }} />
      )}
    </Pressable>
  ), [colors]);

  if (loading) {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Notifications" onBack={() => router.back()} showBack />
        <View style={{ paddingTop: spacing.md, gap: spacing.sm }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm + 2 }}>
              <Skeleton width={40} height={40} radius={20} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={16} radius={8} />
                <Skeleton width="90%" height={14} radius={7} />
              </View>
            </View>
          ))}
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Notifications"
        onBack={() => router.back()}
        showBack
        rightActions={
          notifications.some((n) => !n.read) ? (
            <Pressable onPress={handleMarkAllRead} hitSlop={8}>
              <Text style={{ ...typography.captionMedium, color: colors.primary }}>Tout lire</Text>
            </Pressable>
          ) : undefined
        }
      />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: spacing.lg + 40 + spacing.sm + 2 }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Bell size={32} color={colors.textSecondary} />}
            title="Aucune notification"
            description="Vos notifications apparaîtront ici"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadNotifications(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingVertical: spacing.sm }}
      />
    </SafeScreen>
  );
}
