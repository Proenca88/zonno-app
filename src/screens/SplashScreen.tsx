import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';

interface SplashScreenProps {
  onTimeout: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onTimeout }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeout();
    }, 2500); // 2.5 segundos de splash
    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <View style={styles.container}>
      {/* Centro - Nome da marca e slogan */}
      <View style={styles.centerContainer}>
        <Text style={styles.logoText}>Zonno</Text>
        <Text style={styles.subtitleText}>GESTÃO DE NEGÓCIOS</Text>
      </View>
      
      {/* Rodapé - Carregamento dinâmico como no Stitch */}
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#9ca3af" style={styles.spinner} />
        <Text style={styles.loadingText}>A INICIAR...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: '#111827', // Cor escura / carvão profunda do Stitch
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: '#9ca3af',
    letterSpacing: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: '#9ca3af',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
