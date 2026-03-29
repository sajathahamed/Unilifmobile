// Color Palette: Indigo & Slate
// A premium, modern palette following popular design systems

export const lightColors = {
  // Primary - Vibrant Indigo
  primary: '#4F46E5',        // Indigo 600
  primaryLight: '#818CF8',   // Indigo 400
  primaryDark: '#3730A3',    // Indigo 800
  onPrimary: '#FFFFFF',
  
  // Secondary - Soft Rose/Pink for accents
  secondary: '#E11D48',      // Rose 600
  secondaryLight: '#FB7185', // Rose 400
  secondaryDark: '#9F1239',  // Rose 800
  onSecondary: '#FFFFFF',
  
  // Neutrals - Slate based
  background: '#F8FAFC',     // Slate 50
  backgroundSecondary: '#F1F5F9', // Slate 100
  backgroundTertiary: '#E2E8F0',  // Slate 200
  
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  onSurface: '#0F172A',      // Slate 900
  
  // Text
  text: '#0F172A',           // Slate 900 (High Emphasis)
  textSecondary: '#475569',  // Slate 600 (Medium Emphasis)
  textTertiary: '#94A3B8',   // Slate 400 (Disabled/Hint)
  textInverse: '#FFFFFF',
  
  // Border & Dividers
  border: '#E2E8F0',         // Slate 200
  borderSecondary: '#CBD5E1', // Slate 300
  
  // Status Colors
  success: '#10B981',        // Emerald 500
  successLight: '#D1FAE5',   // Emerald 100
  onSuccess: '#064E3B',      // Emerald 900
  
  warning: '#F59E0B',        // Amber 500
  warningLight: '#FEF3C7',   // Amber 100
  onWarning: '#78350F',      // Amber 900
  
  error: '#EF4444',          // Rose 500
  errorLight: '#FEE2E2',     // Rose 100
  onError: '#7F1D1D',        // Rose 900
  
  info: '#3B82F6',           // Blue 500
  infoLight: '#DBEAFE',      // Blue 100
  onInfo: '#1E3A8A',         // Blue 900
  
  // Dashboard Module Accents
  dashboardLaundry: '#10B981',   // Emerald
  dashboardTrip: '#0EA5E9',     // Sky
  dashboardFood: '#F97316',     // Orange
  dashboardTimetable: '#8B5CF6', // Violet

  // Misc
  overlay: 'rgba(15, 23, 42, 0.4)',
  shadow: 'rgba(15, 23, 42, 0.08)',
  disabled: '#CBD5E1',
  placeholder: '#94A3B8',
};

export const darkColors = {
  // Primary - Vibrant Indigo
  primary: '#818CF8',        // Indigo 400
  primaryLight: '#A5B4FC',   // Indigo 300
  primaryDark: '#6366F1',    // Indigo 500
  onPrimary: '#0F172A',
  
  // Secondary
  secondary: '#FB7185',      // Rose 400
  secondaryLight: '#FDA4AF', // Rose 300
  secondaryDark: '#E11D48',  // Rose 600
  onSecondary: '#0F172A',
  
  // Neutrals - Deep Slate
  background: '#0F172A',     // Slate 900
  backgroundSecondary: '#1E293B', // Slate 800
  backgroundTertiary: '#334155',  // Slate 700
  
  surface: '#1E293B',        // Slate 800
  surfaceSecondary: '#334155', // Slate 700
  onSurface: '#F8FAFC',      // Slate 50
  
  // Text
  text: '#F8FAFC',           // Slate 50
  textSecondary: '#CBD5E1',  // Slate 300
  textTertiary: '#64748B',   // Slate 500
  textInverse: '#0F172A',
  
  // Border & Dividers
  border: '#334155',         // Slate 700
  borderSecondary: '#475569', // Slate 600
  
  // Status Colors
  success: '#34D399',        // Emerald 400
  successLight: 'rgba(52, 211, 153, 0.1)',
  onSuccess: '#D1FAE5',
  
  warning: '#FBBF24',        // Amber 400
  warningLight: 'rgba(251, 191, 36, 0.1)',
  onWarning: '#FEF3C7',
  
  error: '#F87171',          // Rose 400
  errorLight: 'rgba(248, 113, 113, 0.1)',
  onError: '#FEE2E2',
  
  info: '#60A5FA',           // Blue 400
  infoLight: 'rgba(96, 165, 250, 0.1)',
  onInfo: '#DBEAFE',
  
  // Dashboard Module Accents
  dashboardLaundry: '#34D399',
  dashboardTrip: '#38BDF8',
  dashboardFood: '#FB923C',
  dashboardTimetable: '#A78BFA',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.4)',
  disabled: '#475569',
  placeholder: '#475569',
};

export type ThemeColors = typeof lightColors;

