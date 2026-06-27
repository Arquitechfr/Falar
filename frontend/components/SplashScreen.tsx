import { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Defs, LinearGradient, RadialGradient, Stop, Svg, Ellipse, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LOGO_WIDTH = 200;

const SPRING_CONFIG = { damping: 14, stiffness: 120, mass: 1 };

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const sceneOpacity = useSharedValue(1);

  useEffect(() => {
    // Phase 1: Scale + Fade in (0-800ms)
    logoScale.value = withSpring(1, SPRING_CONFIG);
    logoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });

    // Phase 2: Glow pulse (800-2000ms) — 2 repetitions
    glowOpacity.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        2,
        false,
      ),
    );

    // Phase 3: Fade out scene (2100-2500ms)
    sceneOpacity.value = withDelay(
      2100,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(onComplete)();
      }),
    );
  }, [logoScale, logoOpacity, glowOpacity, sceneOpacity, onComplete]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const sceneAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, sceneAnimatedStyle]}>
      {/* Background gradient */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A85337" />
            <Stop offset="0.5" stopColor="#C96B4A" />
            <Stop offset="1" stopColor="#D98969" />
          </LinearGradient>
        </Defs>
        <Rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#bgGradient)" />
      </Svg>

      {/* Organic shapes — very subtle */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        {/* Top-left blob */}
        <Defs>
          <RadialGradient id="blob1" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.10" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blob2" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#D98969" stopOpacity="0.15" />
            <Stop offset="1" stopColor="#D98969" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blob3" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.06" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={SCREEN_WIDTH * 0.15} cy={SCREEN_HEIGHT * 0.2} rx={120} ry={100} fill="url(#blob1)" />
        <Ellipse cx={SCREEN_WIDTH * 0.85} cy={SCREEN_HEIGHT * 0.75} rx={140} ry={110} fill="url(#blob2)" />
        <Ellipse cx={SCREEN_WIDTH * 0.7} cy={SCREEN_HEIGHT * 0.15} rx={80} ry={70} fill="url(#blob3)" />
        <Ellipse cx={SCREEN_WIDTH * 0.2} cy={SCREEN_HEIGHT * 0.85} rx={90} ry={75} fill="url(#blob3)" />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Glow layer behind logo */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: LOGO_WIDTH + 60,
                height: LOGO_WIDTH + 60,
                borderRadius: (LOGO_WIDTH + 60) / 2,
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
              glowAnimatedStyle,
            ]}
          />

          {/* Logo */}
          <Animated.View style={logoAnimatedStyle}>
            <Image
              source={require('@/assets/texte_logo.png')}
              style={{
                width: LOGO_WIDTH,
                height: LOGO_WIDTH * 0.35,
                resizeMode: 'contain',
              }}
              accessibilityLabel="Falar logo"
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
