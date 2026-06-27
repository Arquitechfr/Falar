import { useRef, useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { markOnboardingSeen } from '@/utils/onboarding';
import { Button } from '@/components/ui';
import {
  OnboardingIllustration1,
  OnboardingIllustration2,
  OnboardingIllustration3,
} from '@/components/ui/OnboardingIllustrations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPRING_CONFIG = { damping: 16, stiffness: 280, mass: 0.6 };

interface Page {
  illustration: React.ReactNode;
  title: string;
  description: string;
}

const PAGES: Page[] = [
  {
    illustration: <OnboardingIllustration1 />,
    title: 'Les conversations qui comptent.',
    description: 'Restez connecté à vos proches avec une messagerie simple et élégante.',
  },
  {
    illustration: <OnboardingIllustration2 />,
    title: 'Votre vie privée avant tout.',
    description: 'Vos messages sont chiffrés de bout en bout. Personne ne peut les lire, pas même nous.',
  },
  {
    illustration: <OnboardingIllustration3 />,
    title: 'Simple. Rapide. Sécurisé.',
    description: 'Une messagerie qui respecte votre vie privée sans compromis sur l\'expérience.',
  },
];

function OnboardingPage({ item, index, scrollX }: { item: Page; index: number; scrollX: SharedValue<number> }) {
  const { colors } = useTheme();
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const illustrationStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], 'clamp'),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], 'clamp'),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], 'clamp'),
    transform: [
      {
        translateY: interpolate(scrollX.value, inputRange, [20, 0, -20], 'clamp'),
      },
    ],
  }));

  return (
    <View style={{ width: SCREEN_WIDTH, alignItems: 'center', paddingHorizontal: spacing.xl }}>
      <Animated.View style={illustrationStyle}>
        {item.illustration}
      </Animated.View>
      <Animated.View style={[textStyle, { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm }]}>
        <Text style={{ ...typography.heading, color: colors.textPrimary, textAlign: 'center' }}>
          {item.title}
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );
}

function ProgressDot({ index, activeIndex }: { index: number; activeIndex: number }) {
  const { colors } = useTheme();
  const isActive = index === activeIndex;

  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(isActive ? 24 : 8, SPRING_CONFIG),
    backgroundColor: withTiming(isActive ? colors.primary : colors.border, { duration: 200 }),
  }));

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList<Page>>(null);

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  }, [scrollX]);

  const handleSkip = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markOnboardingSeen();
    router.replace('/(auth)/phone');
  }, [router]);

  const handleStart = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markOnboardingSeen();
    router.replace('/(auth)/phone');
  }, [router]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [currentIndex]);

  const renderItem = useCallback(({ item, index }: { item: Page; index: number }) => (
    <OnboardingPage item={item} index={index} scrollX={scrollX} />
  ), [scrollX]);

  const isLastPage = currentIndex === PAGES.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        {/* Skip button */}
        {!isLastPage && (
          <Pressable
            onPress={handleSkip}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: spacing.md,
              right: spacing.lg,
              zIndex: 10,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
            }}
          >
            <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>
              Passer
            </Text>
          </Pressable>
        )}

        {/* Pages */}
        <FlatList
          ref={flatListRef}
          data={PAGES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: spacing.xxl + spacing.lg }}
        />

        {/* Bottom section: progress + button */}
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl,
            gap: spacing.lg,
          }}
        >
          {/* Progress indicator */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {PAGES.map((_, index) => (
              <ProgressDot key={index} index={index} activeIndex={currentIndex} />
            ))}
          </View>

          {/* CTA */}
          {isLastPage ? (
            <Button
              label="Commencer"
              onPress={handleStart}
              fullWidth
            />
          ) : (
            <Button
              label="Suivant"
              onPress={handleNext}
              fullWidth
              variant="secondary"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
