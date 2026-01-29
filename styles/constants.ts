/**
 * Shared style constants for consistent spacing, sizing, and styling across the app
 * These constants support responsive design and maintain visual consistency
 */

export interface StyleConstants {
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export const STYLE_CONSTANTS: StyleConstants = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
  },
};

/**
 * Helper function to calculate responsive dimensions based on screen width
 * @param screenWidth - Current screen width in pixels
 * @param percentage - Percentage of screen width (0.0 to 1.0)
 * @returns Calculated dimension in pixels
 */
export const calculateResponsiveDimension = (
  screenWidth: number,
  percentage: number
): number => {
  return Math.round(screenWidth * percentage);
};

/**
 * Helper function to get responsive spacing based on screen width
 * Scales spacing for larger screens
 * @param baseSpacing - Base spacing value
 * @param screenWidth - Current screen width
 * @returns Scaled spacing value
 */
export const getResponsiveSpacing = (
  baseSpacing: number,
  screenWidth: number
): number => {
  // Scale up spacing on larger screens (tablets, etc.)
  const scaleFactor = screenWidth > 768 ? 1.5 : 1;
  return Math.round(baseSpacing * scaleFactor);
};
