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
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
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
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 44,
    display: 52,
  },
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
