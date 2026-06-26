import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useNetInfo } from '@react-native-community/netinfo';
import { getAccessToken } from '@/services/api';
import { connect, disconnect } from '@/services/socket';
import { useAuthStore } from '@/features/auth/authStore';
import { theme } from '@/constants/theme';

export default function MainLayout() {
  const user = useAuthStore((s) => s.user);
  const [socketConnected, setSocketConnected] = useState(false);
  const netInfo = useNetInfo();

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        const socket = connect(token);
        socket.on('connect', () => setSocketConnected(true));
        socket.on('disconnect', () => setSocketConnected(false));
      }
    })();

    return () => {
      disconnect();
    };
  }, []);

  const isOffline = !netInfo.isConnected;

  return (
    <View className="flex-1 bg-background">
      {isOffline && (
        <View className="bg-yellow-600 py-2 items-center">
          <Text className="text-white text-sm">Pas de connexion</Text>
        </View>
      )}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.background },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
        }}
      >
        <Tabs.Screen
          name="conversations"
          options={{ title: 'Conversations' }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profil' }}
        />
      </Tabs>
    </View>
  );
}
