import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro)
const baseWidth = 393;
const baseHeight = 852;

// Scale functions for responsive design
export const scale = (size: number) => (width / baseWidth) * size;
export const verticalScale = (size: number) => (height / baseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'Inter_400Regular',
      android: 'Inter_400Regular',
      default: 'Inter_400Regular',
    }),
    medium: Platform.select({
      ios: 'Inter_500Medium',
      android: 'Inter_500Medium',
      default: 'Inter_500Medium',
    }),
    semiBold: Platform.select({
      ios: 'Inter_600SemiBold',
      android: 'Inter_600SemiBold',
      default: 'Inter_600SemiBold',
    }),
    bold: Platform.select({
      ios: 'Inter_700Bold',
      android: 'Inter_700Bold',
      default: 'Inter_700Bold',
    }),
  },
  fontSize: {
    xs: 12,      // Captions
    sm: 14,      // Secondary body
    md: 16,      // Primary body
    lg: 18,      // Small headings / UI labels
    xl: 20,      // Section headings
    xxl: 24,     // Page titles
    xxxl: 32,    // Hero titles
    display: 48, // Massive display text
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 44,
    display: 60,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  }
};

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};


export const layout = {
  screenWidth: width,
  screenHeight: height,
  isSmallDevice: width < 375,
  isTablet: width >= 768,
  headerHeight: Platform.select({ ios: 44, android: 56, default: 56 }),
  tabBarHeight: Platform.select({ ios: 83, android: 60, default: 60 }),
  statusBarHeight: Platform.select({ ios: 47, android: 24, default: 24 }),
};
