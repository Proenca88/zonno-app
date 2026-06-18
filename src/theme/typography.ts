import { Platform } from 'react-native';

export const TYPOGRAPHY = {
  fontFamily: {
    serif: Platform.select({
      web: '"Playfair Display", serif',
      default: 'PlayfairDisplay_600SemiBold'
    }),
    serifBold: Platform.select({
      web: '"Playfair Display", serif',
      default: 'PlayfairDisplay_700Bold'
    }),
    sans: Platform.select({
      web: '"Plus Jakarta Sans", sans-serif',
      default: 'PlusJakartaSans_400Regular'
    }),
    sansSemibold: Platform.select({
      web: '"Plus Jakarta Sans", sans-serif',
      default: 'PlusJakartaSans_600SemiBold'
    }),
    sansBold: Platform.select({
      web: '"Plus Jakarta Sans", sans-serif',
      default: 'PlusJakartaSans_700Bold'
    }),
  },
  
  // Custom font styles mapped from Design System
  h1: {
    fontFamily: Platform.select({
      web: '"Playfair Display", serif',
      default: 'PlayfairDisplay_700Bold'
    }),
    fontSize: 28,
    lineHeight: 36,
  },
  h2: {
    fontFamily: Platform.select({
      web: '"Playfair Display", serif',
      default: 'PlayfairDisplay_600SemiBold'
    }),
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: Platform.select({
      web: '"Plus Jakarta Sans", sans-serif',
      default: 'PlusJakartaSans_600SemiBold'
    }),
    fontSize: 15,
    lineHeight: 22,
  },
  body: {
    fontFamily: Platform.select({
      web: '"Plus Jakarta Sans", sans-serif',
      default: 'PlusJakartaSans_400Regular'
    }),
    fontSize: 14,
    lineHeight: 20,
  },
  bodyBold: {
    fontFamily: Platform.select({
      web: '"Plus Jakarta Sans", sans-serif',
      default: 'PlusJakartaSans_600SemiBold'
    }),
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: Platform.select({
      web: '"Plus Jakarta Sans", sans-serif',
      default: 'PlusJakartaSans_400Regular'
    }),
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: Platform.select({
      web: '"Plus Jakarta Sans", sans-serif',
      default: 'PlusJakartaSans_600SemiBold'
    }),
    fontSize: 15,
    lineHeight: 20,
  }
};

