import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useNetInfo } from '@react-native-community/netinfo';
import { getAccessToken } from '@/services/api';
import { connect, disconnect } from '@/services/socket';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { MessageCircle, User, Users } from '@/components/ui/Icons';
import { useIncomingCall } from '@/features/calls/useIncomingCall';

export default function MainLayout() {
  const { colors } = useTheme();
  const netInfo = useNetInfo();

  useIncomingCall();

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        const socket = connect(token);
        socket.on('connect', () => {});
        socket.on('disconnect', () => {});
      }
    })();

    return () => {
      disconnect();
    };
  }, []);

  const isOffline = !netInfo.isConnected;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isOffline && (
        <View style={{ backgroundColor: colors.warning, paddingVertical: 6, alignItems: 'center' }}>
          <Text style={{ ...typography.captionMedium, color: '#FFFFFF' }}>Pas de connexion</Text>
        </View>
      )}
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <BottomTabBar {...props} />}
      >
        <Tabs.Screen
          name="conversations"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: 'Contacts',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="new-chat" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="search" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
      </Tabs>
    </View>
  );
}
