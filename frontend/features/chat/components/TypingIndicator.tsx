import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      );

    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 200);
    const anim3 = animate(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-center gap-1 px-4 py-2">
      <Animated.View
        className="w-2 h-2 rounded-full bg-textSecondary"
        style={{ opacity: dot1 }}
      />
      <Animated.View
        className="w-2 h-2 rounded-full bg-textSecondary"
        style={{ opacity: dot2 }}
      />
      <Animated.View
        className="w-2 h-2 rounded-full bg-textSecondary"
        style={{ opacity: dot3 }}
      />
    </View>
  );
}
