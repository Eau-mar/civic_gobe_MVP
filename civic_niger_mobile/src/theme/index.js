// Charte graphique CivicTech Niger
export const COLORS = {
  // Brand colors
  primary: '#007F5F',       // Vert institutionnel
  primaryDark: '#005F47',
  primaryLight: '#00A67E',
  primaryGradientStart: '#007F5F',
  primaryGradientEnd: '#00A67E',
  
  accent: '#E76F00',        // Orange
  accentLight: '#FF8C33',
  accentDark: '#CC6200',
  accentGradientStart: '#E76F00',
  accentGradientEnd: '#FF8C33',

  // Backgrounds & Surfaces
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',
  surfaceGlass: 'rgba(255, 255, 255, 0.8)',
  
  // Dark mode / Web Sidebar
  dark: '#111827',
  darkLight: '#1F2937',
  sidebarBg: '#111827',
  sidebarText: '#9CA3AF',
  sidebarActive: 'rgba(0, 127, 95, 0.15)',
  sidebarHover: 'rgba(255, 255, 255, 0.05)',
  
  // Typography
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  white: '#FFFFFF',
  
  // States & Utility
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  overlay: 'rgba(17, 24, 39, 0.5)',
};

export const FONTS = {
  regular: {
    fontSize: 16,
    color: COLORS.text,
  },
  small: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  overline: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.textLight,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.dark,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 999, // Only use when strictly necessary (e.g., avatars)
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  }
};

export const ANIMATION = {
  fast: 150,
  smooth: 300,
  slow: 500,
};
