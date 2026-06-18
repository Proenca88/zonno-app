import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { CaretLeft } from 'phosphor-react-native';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleRecover = () => {
    if (!email) return;
    setLoading(true);
    // Simular envio
    setTimeout(() => {
      setLoading(false);
      alert('Link de recuperação enviado para o seu e-mail!');
      navigation.goBack();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <CaretLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.brandText}>Zonno</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.introSection}>
          <Text style={styles.titleText}>Recuperar Conta</Text>
          <Text style={styles.subtitleText}>
            Introduza o seu e-mail profissional. Enviaremos um link para redefinir a sua palavra-passe.
          </Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>E-mail Profissional</Text>
          <TextInput
            style={[
              styles.input,
              isFocused && styles.inputFocused
            ]}
            placeholder="nome@negocio.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, (!email || loading) && styles.buttonDisabled]} 
          onPress={handleRecover}
          disabled={!email || loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Enviar Link de Recuperação</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: 'rgba(246, 250, 254, 0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 20,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleText: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 32,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
  },
});

