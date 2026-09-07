import { Platform } from 'react-native';

export const Typography = {
  fontFamily: {
    sans: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'system-ui, -apple-system, sans-serif',
    }),
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'ui-monospace, Cascadia Mono, monospace',
    }),
  },
  fontSize: {
    tiny: 11,
    small: 12.5,
    body: 14,
    title: 15,
    heading: 16.5,
    largeHeading: 22,
    bigValue: 27,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '650' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};
