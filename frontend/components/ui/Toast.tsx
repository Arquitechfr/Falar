import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { CheckCircle, AlertCircle, Info } from './Icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const toastIdRef = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = ++toastIdRef.current;
    setToast({ id, message, type, duration });
    opacity.value = withTiming(1, { duration: 250 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });

    setTimeout(() => {
      if (toastIdRef.current === id) {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(-100, { duration: 200, easing: Easing.in(Easing.ease) });
        setTimeout(() => setToast(null), 200);
      }
    }, duration);
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const iconColor: Record<ToastType, string> = {
    success: colors.success,
    error: colors.danger,
    warning: colors.warning,
    info: colors.textSecondary,
  };

  const Icon = toast ? TOAST_ICONS[toast.type] : Info;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: insets.top + spacing.sm,
              left: spacing.md,
              right: spacing.md,
              zIndex: 999,
            },
            animatedStyle,
          ]}
          pointerEvents="none"
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.card,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              ...colors.shadows.md,
            }}
          >
            <Icon size={22} color={iconColor[toast.type]} />
            <Text
              style={{
                ...typography.bodyMedium,
                color: colors.textPrimary,
                flex: 1,
              }}
            >
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
