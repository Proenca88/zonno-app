import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';

interface SplashScreenProps {
  onTimeout: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onTimeout }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeout();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>Zonno</Text>
      <Text style={styles.subtitleText}>BUSINESS MANAGEMENT</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitleText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textSecondary,
    letterSpacing: 4,
    marginTop: 12,
  },
});
