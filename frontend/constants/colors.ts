export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  card: string;
  secondaryBackground: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
  textPrimary: string;
  textSecondary: string;
  bubbleMine: string;
  bubbleOther: string;
  statusRead: string;
  overlay: string;
  avatarGradientStart: string;
  avatarGradientEnd: string;
}

export const lightColors: ColorPalette = {
  primary: '#C96B4A',
  primaryLight: '#D98969',
  primaryDark: '#A85337',
  background: '#d45535',
  card: '#FFFFFF',
  secondaryBackground: '#F2ECE8',
  border: '#E9DFDA',
  success: '#3FBF75',
  danger: '#E55252',
  warning: '#F2A541',
  textPrimary: '#1F1F1F',
  textSecondary: '#7B7B7B',
  bubbleMine: '#C96B4A',
  bubbleOther: '#F2ECE8',
  statusRead: '#C96B4A',
  overlay: 'rgba(0,0,0,0.4)',
  avatarGradientStart: '#D98969',
  avatarGradientEnd: '#A85337',
};

export const darkColors: ColorPalette = {
  primary: '#C96B4A',
  primaryLight: '#D98969',
  primaryDark: '#A85337',
  background: '#141210',
  card: '#1E1B18',
  secondaryBackground: '#28231E',
  border: '#38322C',
  success: '#3FBF75',
  danger: '#E55252',
  warning: '#F2A541',
  textPrimary: '#F5F0EC',
  textSecondary: '#9B958E',
  bubbleMine: '#A85337',
  bubbleOther: '#28231E',
  statusRead: '#D98969',
  overlay: 'rgba(0,0,0,0.6)',
  avatarGradientStart: '#D98969',
  avatarGradientEnd: '#8A4429',
};
