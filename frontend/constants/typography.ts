export type FontWeight = '400' | '500' | '600' | '700';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number;
}

const FONT_REGULAR = 'Outfit_400Regular';
const FONT_MEDIUM = 'Outfit_500Medium';
const FONT_SEMI_BOLD = 'Outfit_600SemiBold';
const FONT_BOLD = 'Outfit_700Bold';

export const typography = {
  display: {
    fontFamily: FONT_BOLD,
    fontSize: 34,
    fontWeight: '700' as FontWeight,
    lineHeight: 41,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: FONT_BOLD,
    fontSize: 28,
    fontWeight: '700' as FontWeight,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: FONT_SEMI_BOLD,
    fontSize: 22,
    fontWeight: '600' as FontWeight,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FONT_SEMI_BOLD,
    fontSize: 17,
    fontWeight: '600' as FontWeight,
    lineHeight: 22,
    letterSpacing: 0,
  },
  body: {
    fontFamily: FONT_REGULAR,
    fontSize: 16,
    fontWeight: '400' as FontWeight,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: FONT_MEDIUM,
    fontSize: 16,
    fontWeight: '500' as FontWeight,
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    fontWeight: '400' as FontWeight,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  captionMedium: {
    fontFamily: FONT_MEDIUM,
    fontSize: 13,
    fontWeight: '500' as FontWeight,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  micro: {
    fontFamily: FONT_MEDIUM,
    fontSize: 11,
    fontWeight: '500' as FontWeight,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
} as const;

export type TypographyKey = keyof typeof typography;
export type Typography = typeof typography;
