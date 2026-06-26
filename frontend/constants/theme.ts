export const theme = {
  primary: '#C66B4A',
  primaryDark: '#A85638',
  primaryLight: '#E08866',
  background: '#1A1410',
  surface: '#2A2018',
  surfaceLight: '#3A2E24',
  bubbleMine: '#C66B4A',
  bubbleOther: '#2A2018',
  textPrimary: '#F5EDE6',
  textSecondary: '#A89684',
  statusRead: '#7CB9E8',
} as const;

export type Theme = typeof theme;
