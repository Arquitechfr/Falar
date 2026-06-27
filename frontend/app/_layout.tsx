import { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreenNative from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { useAuth } from '@/features/auth/useAuth';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { ToastProvider } from '@/components/ui/Toast';
import { SplashScreen } from '@/components/SplashScreen';
import { hasSeenOnboarding } from '@/utils/onboarding';
import '@/global.css';

SplashScreenNative.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!isAuthenticated && !inAuthGroup && !inOnboardingGroup) {
      router.replace('/(auth)/phone');
    } else if (isAuthenticated && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(main)/conversations');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });
  const [splashDone, setSplashDone] = useState(false);
  const [onboardingNeeded, setOnboardingNeeded] = useState<boolean | null>(null);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreenNative.hideAsync().catch(() => {});
      hasSeenOnboarding().then((seen) => setOnboardingNeeded(!seen));
    }
  }, [fontsLoaded]);

  const handleSplashComplete = useCallback(() => {
    setSplashDone(true);
  }, []);

  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C96B4A' }}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              {!splashDone ? (
                <SplashScreen onComplete={handleSplashComplete} />
              ) : onboardingNeeded === null ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C96B4A' }}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              ) : onboardingNeeded ? (
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(onboarding)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(main)" />
                </Stack>
              ) : (
                <RootNavigator />
              )}
            </ToastProvider>
            <StatusBar style="auto" />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
