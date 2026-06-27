import { Platform } from 'react-native';

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

function createShadow(
  color: string,
  offset: { width: number; height: number },
  opacity: number,
  radius: number,
  elevation: number,
): ShadowPreset {
  return Platform.select({
    ios: { shadowColor: color, shadowOffset: offset, shadowOpacity: opacity, shadowRadius: radius, elevation },
    default: { shadowColor: color, shadowOffset: offset, shadowOpacity: opacity, shadowRadius: radius, elevation },
  }) as ShadowPreset;
}

export const lightShadows = {
  sm: createShadow('#1F1F1F', { width: 0, height: 1 }, 0.05, 3, 1),
  md: createShadow('#1F1F1F', { width: 0, height: 2 }, 0.08, 8, 3),
  lg: createShadow('#1F1F1F', { width: 0, height: 4 }, 0.10, 16, 5),
  fab: createShadow('#C96B4A', { width: 0, height: 4 }, 0.25, 12, 6),
} as const;

export const darkShadows = {
  sm: createShadow('#000000', { width: 0, height: 1 }, 0.20, 3, 1),
  md: createShadow('#000000', { width: 0, height: 2 }, 0.30, 8, 3),
  lg: createShadow('#000000', { width: 0, height: 4 }, 0.40, 16, 5),
  fab: createShadow('#000000', { width: 0, height: 4 }, 0.40, 12, 6),
} as const;

export type Shadows = typeof lightShadows;
