import { lightColors, darkColors, type ColorPalette } from './colors';
import { typography, type Typography } from './typography';
import { spacing, type Spacing } from './spacing';
import { lightShadows, darkShadows, type Shadows } from './shadows';
import { radius, type Radius } from './radius';

export const radii = radius;
export type Radii = Radius;

export const elevation = { light: lightShadows, dark: darkShadows };

export interface Theme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
  radii: Radii;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  shadows: lightShadows,
  radii,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  shadows: darkShadows,
  radii,
  isDark: true,
};

export type { ColorPalette, Typography, Spacing, Shadows };
export { lightColors, darkColors, typography, spacing, lightShadows, darkShadows };

/**
 * Backward-compatible flat theme export.
 * Uses light colors by default. Screens should migrate to useTheme() in Phase 2/3.
 */
export const theme = {
  primary: lightColors.primary,
  primaryDark: lightColors.primaryDark,
  primaryLight: lightColors.primaryLight,
  background: lightColors.background,
  surface: lightColors.card,
  surfaceLight: lightColors.secondaryBackground,
  bubbleMine: lightColors.bubbleMine,
  bubbleOther: lightColors.bubbleOther,
  textPrimary: lightColors.textPrimary,
  textSecondary: lightColors.textSecondary,
  statusRead: lightColors.statusRead,
  border: lightColors.border,
  success: lightColors.success,
  danger: lightColors.danger,
  warning: lightColors.warning,
  card: lightColors.card,
  secondaryBackground: lightColors.secondaryBackground,
} as const;

export type ThemeLegacy = typeof theme;
