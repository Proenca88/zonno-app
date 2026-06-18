import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { ShieldWarning, Globe, WhatsappLogo, SignOut } from 'phosphor-react-native';

export function SubscriptionExpiredScreen({ route, navigation }: any) {
  const { empresaNome } = route.params || { empresaNome: 'O seu Espaço' };

  const handleSupport = () => {
    // Abrir WhatsApp de Suporte do SaaS
    Linking.openURL('https://wa.me/351964274647?text=Olá, preciso de ajuda com a subscrição do espaço ' + encodeURIComponent(empresaNome));
  };

  const handleWebPanel = () => {
    // Abrir Painel Web da Vercel
    Linking.openURL('https://gracielamakeup.vercel.app');
  };

  const handleLogout = () => {
    // Voltar para a tela de Login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ShieldWarning size={48} color={COLORS.status.cancelado.text} weight="thin" />
        </View>

        <Text style={styles.title}>Subscrição Expirada</Text>
        
        <Text style={styles.clinicName}>
          {empresaNome}
        </Text>

        <Text style={styles.description}>
          O período de testes grátis de 14 dias ou a sua subscrição mensal terminou. Para continuar a utilizar o aplicativo móvel e aceder aos dados da sua agenda, regularize o pagamento.
        </Text>

        <View style={styles.actionCard}>
          <Text style={styles.actionCardTitle}>O que fazer a seguir?</Text>
          <Text style={styles.actionCardDesc}>
            Pode aceder ao Painel Administrativo Web no computador para gerir a faturação, ou falar com o nosso suporte comercial.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleWebPanel} activeOpacity={0.9}>
            <Globe size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>
              Abrir Painel Web
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSupport} activeOpacity={0.8}>
            <WhatsappLogo size={20} color={COLORS.textPrimary} style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>
              Falar com Suporte
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <SignOut size={20} color={COLORS.textSecondary} style={styles.buttonIcon} />
        <Text style={styles.logoutButtonText}>Voltar ao Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.status.cancelado.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 28,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  clinicName: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.status.cancelado.text,
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  actionCardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionCardDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

