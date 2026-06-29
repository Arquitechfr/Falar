import React, { useEffect, useCallback, memo } from 'react';
import { View, Text, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useNetInfo } from '@react-native-community/netinfo';
import { getAccessToken } from '@/services/api';
import { connect, disconnect } from '@/services/socket';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { MessageCircle, User, Users } from '@/components/ui/Icons';
import { useIncomingCall } from '@/features/calls/useIncomingCall';

const ConversationsIcon = memo(({ color, size }: { color: ColorValue; size: number; focused?: boolean }) => <MessageCircle size={size} color={color as string} />);
const ContactsIcon = memo(({ color, size }: { color: ColorValue; size: number; focused?: boolean }) => <Users size={size} color={color as string} />);
const ProfileIcon = memo(({ color, size }: { color: ColorValue; size: number; focused?: boolean }) => <User size={size} color={color as string} />);

export default function MainLayout() {
  const { colors } = useTheme();
  const netInfo = useNetInfo();

  useIncomingCall();

  useEffect(() => {
    let socket: ReturnType<typeof connect> | null = null;

    (async () => {
      const token = await getAccessToken();
      if (token) {
        socket = connect(token);
      }
    })();

    return () => {
      disconnect();
    };
  }, []);

  const renderTabBar = useCallback(
    (props: any) => <BottomTabBar {...props} />,
    [],
  );

  const isOffline = netInfo.isConnected === false;

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
        tabBar={renderTabBar}
      >
        <Tabs.Screen
          name="conversations"
          options={{
            title: 'Messages',
            tabBarIcon: ConversationsIcon,
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: 'Contacts',
            tabBarIcon: ContactsIcon,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ProfileIcon,
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
