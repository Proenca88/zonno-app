import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, ScrollView } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';

interface OnboardingScreenProps {
  onStartClick: () => void;
}

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'Agenda Inteligente',
    description: 'Faça a gestão dos seus agendamentos, clientes e faturação num único lugar, de forma simples e rápida.',
    image: require('../../assets/onboarding-illustration.png'),
  },
  {
    id: 2,
    title: 'Campanhas & Vouchers',
    description: 'Crie programas de fidelidade, ofertas especiais e vouchers de desconto para atrair e reter mais clientes.',
    image: require('../../assets/onboarding-vouchers.png'),
  },
  {
    id: 3,
    title: 'Finanças & Resultados',
    description: 'Controle o seu faturamento mensal, transações e métodos de pagamento com gráficos claros e intuitivos.',
    image: require('../../assets/onboarding-financas.png'),
  }
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStartClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: nextSlide * width, animated: true });
    } else {
      onStartClick();
    }
  };

  const handleDotPress = (index: number) => {
    setCurrentSlide(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  return (
    <View style={styles.container}>
      {/* Topo com nome da marca em caixa alta e espaçamento elegante */}
      <Text style={styles.logoText}>ZONNO</Text>

      {/* Carrossel interativo de slides horizontais */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentSlide(index);
        }}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slideContainer}>
            {/* Moldura ilustrativa com cantos arredondados e sombra premium */}
            <View style={styles.illustrationContainer}>
              <Image 
                source={slide.image} 
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Bloco de texto explicativo */}
            <View style={styles.textContainer}>
              <Text style={styles.titleText}>{slide.title}</Text>
              <Text style={styles.descText}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Indicadores de slides (dots) interativos */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={index === currentSlide ? styles.activeDot : styles.inactiveDot}
            onPress={() => handleDotPress(index)}
            activeOpacity={0.7}
          />
        ))}
      </View>

      {/* Botão de ação (Seguinte / Começar) */}
      <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.9}>
        <Text style={styles.buttonText}>
          {currentSlide === SLIDES.length - 1 ? 'COMEÇAR' : 'SEGUINTE'}
        </Text>
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
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  slideContainer: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  illustrationContainer: {
    width: width - 48,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  titleText: {
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 14,
  },
  descText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    height: 66, // Altura fixa para evitar pulos de layout entre slides
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
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
    width: width - 48,
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
    marginTop: 12,
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
