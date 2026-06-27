export type FontWeight = '400' | '500' | '600' | '700';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number;
}

const OUTFIT = 'Outfit';

export const typography = {
  display: {
    fontFamily: OUTFIT,
    fontSize: 34,
    fontWeight: '700' as FontWeight,
    lineHeight: 41,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: OUTFIT,
    fontSize: 28,
    fontWeight: '700' as FontWeight,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: OUTFIT,
    fontSize: 22,
    fontWeight: '600' as FontWeight,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: OUTFIT,
    fontSize: 17,
    fontWeight: '600' as FontWeight,
    lineHeight: 22,
    letterSpacing: 0,
  },
  body: {
    fontFamily: OUTFIT,
    fontSize: 16,
    fontWeight: '400' as FontWeight,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: OUTFIT,
    fontSize: 16,
    fontWeight: '500' as FontWeight,
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: OUTFIT,
    fontSize: 13,
    fontWeight: '400' as FontWeight,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  captionMedium: {
    fontFamily: OUTFIT,
    fontSize: 13,
    fontWeight: '500' as FontWeight,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  micro: {
    fontFamily: OUTFIT,
    fontSize: 11,
    fontWeight: '500' as FontWeight,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
} as const;

export type TypographyKey = keyof typeof typography;
export type Typography = typeof typography;
