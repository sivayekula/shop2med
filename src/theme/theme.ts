import { colors, colorSchemes } from './colors';

// Modern theme configuration
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const theme = {
  colors,
  colorSchemes,
  
  // Spacing scale (8px base)
  spacing,
  
  // Border radius scale
  borderRadius,

  // Typography scale
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      huge: 40,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Shadow configurations
  shadows: {
    sm: {
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: colors.shadow.opacity.light,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colors.shadow.opacity.medium,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.shadow.opacity.dark,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colors.shadow.opacity.dark,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  // Component-specific styles
  components: {
    // Button styles
    button: {
      primary: {
        backgroundColor: colorSchemes.primary.main,
        color: colorSchemes.primary.contrast,
        borderRadius: borderRadius.md,
      },
      secondary: {
        backgroundColor: 'transparent',
        color: colorSchemes.secondary.main,
        borderColor: colorSchemes.secondary.main,
        borderWidth: 1,
        borderRadius: borderRadius.md,
      },
      outline: {
        backgroundColor: 'transparent',
        color: colorSchemes.primary.main,
        borderColor: colorSchemes.primary.main,
        borderWidth: 1,
        borderRadius: borderRadius.md,
      },
    },

    // Input styles
    input: {
      default: {
        backgroundColor: colors.background.paper,
        borderColor: colors.border.light,
        borderRadius: borderRadius.md,
        borderWidth: 1,
      },
      focused: {
        borderColor: colorSchemes.primary.main,
        borderWidth: 2,
      },
      error: {
        borderColor: colors.error,
        borderWidth: 2,
      },
    },

    // Card styles
    card: {
      default: {
        backgroundColor: colors.background.paper,
        borderRadius: borderRadius.lg,
      },
      elevated: {
        backgroundColor: colors.background.paper,
        borderRadius: borderRadius.lg,
      },
    },

    // Surface styles
    surface: {
      default: {
        backgroundColor: colors.background.paper,
        borderRadius: borderRadius.xl,
      },
      glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: borderRadius.xl,
      },
    },
  },

  // Gradient configurations
  gradients: {
    primary: {
      colors: colorSchemes.gradient.primary,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    secondary: {
      colors: colorSchemes.gradient.secondary,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    sunset: {
      colors: colorSchemes.gradient.sunset,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    ocean: {
      colors: colorSchemes.gradient.ocean,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
};

// Export theme as default
export default theme;
