import { ViewStyle, TextStyle } from 'react-native';

// 1. Define Types for your Theme
export interface ThemeColors {
  primary: string;         // Brand color (e.g., Logo, Buttons, Active tabs)
  primaryLight: string;    // Light variations (e.g., Category backgrounds, format toggles)
  secondary: string;       // Secondary accents
  background: string;      // Main app background
  surface: string;         // Card backgrounds
  cardBg?: string;         // Alias for surface
  textMain: string;        // Primary text (Headings, titles)
  text?: string;           // Alias for textMain
  textMuted: string;       // Secondary text (Subtitles, authors)
  textSecondary?: string;   // Alias for textMuted
  textLight: string;       // Placeholder text, old prices
  border: string;          // Card and input borders
  danger: string;          // LIVE badge, Notification dot
  success: string;         // Discount texts
  overlay: string;         // Dark gradient overlay for "Live Now" card
  white: string;
  transparent: string;
}

export interface ThemeTypography {
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  weights: {
    regular: TextStyle['fontWeight'];
    medium: TextStyle['fontWeight'];
    semiBold: TextStyle['fontWeight'];
    bold: TextStyle['fontWeight'];
    extraBold: TextStyle['fontWeight'];
  };
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeRadii {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

export interface ThemeShadows {
  light: ViewStyle;
  medium: ViewStyle;
  nav: ViewStyle;
  elite: ViewStyle;
  deep: ViewStyle;
}

export const COLORS: ThemeColors = {
  primary: '#5B64E8',
  primaryLight: '#EFEFFF',
  secondary: '#3B82F6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  textMain: '#1E293B',
  text: '#1E293B',
  textMuted: '#64748B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const DARK_COLORS: ThemeColors = {
  primary: '#818CF8',
  primaryLight: '#312E81',
  secondary: '#60A5FA',
  background: '#0B0F19',
  surface: '#141A28',
  cardBg: '#141A28',
  textMain: '#F8FAFC',
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
  textSecondary: '#CBD5E1',
  textLight: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.1)',
  danger: '#F87171',
  success: '#34D399',
  overlay: 'rgba(0, 0, 0, 0.75)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const TYPOGRAPHY: ThemeTypography = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

export const SPACING: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const RADII: ThemeRadii = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 20,
  round: 999,
};

export const SHADOWS: ThemeShadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20, 
  },
  elite: {
    shadowColor: '#6366F6', 
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  deep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 24,
  }
};

// Helper function to get theme based on appearance
export const getTheme = (isDarkMode: boolean) => ({
  colors: isDarkMode ? DARK_COLORS : COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radii: RADII,
  shadows: SHADOWS,
  dark: isDarkMode,
});

export const theme = getTheme(false); // Default export for legacy support