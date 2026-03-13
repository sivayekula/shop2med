// Modern Icache-inspired color palette for mobile applications
export const colors = {
  // Primary brand colors - vibrant and modern
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Main primary color - Medical Green
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Secondary accent colors
  secondary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main secondary color - Medical Blue
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Medical-themed backgrounds
  medical: {
    primary: '#4CAF50', // Medical green
    secondary: '#2196F3', // Medical blue
    light: '#E8F5E9', // Light medical green
    accent: '#9C27B0', // Medical purple
    warm: '#FF9800', // Medical orange
    danger: '#F44336', // Medical red
  },

  // Accent colors for highlights
  accent: {
    purple: {
      50: '#F3E5F5',
      100: '#E1BEE7',
      200: '#CE93D8',
      300: '#BA68C8',
      400: '#AB47BC',
      500: '#9C27B0',
      600: '#8E24AA',
      700: '#7B1FA2',
      800: '#6A1B9A',
      900: '#4A148C',
    },
    orange: {
      50: '#FFF3E0',
      100: '#FFE0B2',
      200: '#FFCC80',
      300: '#FFB74D',
      400: '#FFA726',
      500: '#FF9800',
      600: '#FB8C00',
      700: '#F57C00',
      800: '#EF6C00',
      900: '#E65100',
    },
  },

  // Neutral colors with modern tints
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Background colors
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
  },

  // Text colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    hint: '#9E9E9E',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },

  // Border and divider colors
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#757575',
  },

  // Shadow colors
  shadow: {
    color: '#000000',
    opacity: {
      light: 0.1,
      medium: 0.2,
      dark: 0.3,
    },
  },
};

// Pre-defined color combinations for common use cases
export const colorSchemes = {
  primary: {
    main: colors.primary[500],
    light: colors.primary[100],
    dark: colors.primary[700],
    contrast: colors.text.onPrimary,
  },
  secondary: {
    main: colors.secondary[500],
    light: colors.secondary[100],
    dark: colors.secondary[700],
    contrast: colors.text.onSecondary,
  },
  gradient: {
    primary: [colors.primary[400], colors.primary[600]],
    secondary: [colors.secondary[400], colors.secondary[600]],
    sunset: [colors.accent.orange[400], colors.primary[500]],
    ocean: [colors.secondary[400], colors.primary[500]],
  },
};
