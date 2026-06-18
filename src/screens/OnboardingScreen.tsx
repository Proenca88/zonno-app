import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';

interface OnboardingScreenProps {
  onStartClick: () => void;
}

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStartClick }) => {
  return (
    <View style={styles.container}>
      {/* Topo com nome da marca em caixa alta e espaçamento elegante */}
      <Text style={styles.logoText}>ZONNO</Text>

      {/* Ilustração premium real obtida do Stitch */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={require('../../assets/onboarding-illustration.png')} 
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Bloco de texto explicativo */}
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>Agenda Inteligente</Text>
        <Text style={styles.descText}>
          Faça a gestão dos seus agendamentos, clientes e faturação num único lugar, de forma simples e rápida.
        </Text>
      </View>

      {/* Indicadores de slides (dots) como no Stitch */}
      <View style={styles.dotsContainer}>
        <View style={styles.activeDot} />
        <View style={styles.inactiveDot} />
        <View style={styles.inactiveDot} />
      </View>

      {/* Botão de início em caixa alta */}
      <TouchableOpacity style={styles.button} onPress={onStartClick} activeOpacity={0.9}>
        <Text style={styles.buttonText}>COMEÇAR</Text>
      </TouchableOpacity>

      {/* Link de login inferior */}
      <TouchableOpacity style={styles.loginLink} onPress={onStartClick} activeOpacity={0.7}>
        <Text style={styles.loginLinkText}>
          Já tem conta? <Text style={styles.loginLinkHighlight}>Entrar</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    letterSpacing: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  illustrationContainer: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  titleText: {
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  descText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  activeDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6c4b47', // Cor de destaque escura / marrom do Stitch
    marginHorizontal: 4,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: 10,
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
  },
  loginLinkHighlight: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
