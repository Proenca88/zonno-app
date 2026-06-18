import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { Calendar } from 'phosphor-react-native';

interface OnboardingScreenProps {
  onStartClick: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStartClick }) => {
  return (
    <View style={styles.container}>
      {/* Topo com nome da marca */}
      <Text style={styles.logoText}>Zonno</Text>

      {/* Ilustração geométrica premium estilizada */}
      <View style={styles.illustrationContainer}>
        <View style={styles.outerCircle}>
          <View style={styles.midCircle}>
            <Calendar size={64} color={COLORS.primary} weight="thin" />
          </View>
        </View>
      </View>

      {/* Bloco de texto explicativo */}
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>Agenda Inteligente</Text>
        <Text style={styles.descText}>
          Faça a gestão dos seus clientes e marcações num só sítio e com o máximo de facilidade e rapidez.
        </Text>
      </View>

      {/* Botão de início */}
      <TouchableOpacity style={styles.button} onPress={onStartClick} activeOpacity={0.9}>
        <Text style={styles.buttonText}>Começar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    marginTop: 40,
  },
  illustrationContainer: {
    height: 240,
    width: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    height: 200,
    width: 200,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    // Ghost shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  midCircle: {
    height: 140,
    width: 140,
    borderRadius: 70,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  titleText: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  descText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
  },
});
