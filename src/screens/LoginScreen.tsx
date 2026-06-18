import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Usuario, Empresa } from '../types';
import { Eye, EyeSlash, Fingerprint } from 'phosphor-react-native';

interface LoginScreenProps {
  navigation: any;
  onLoginSuccess: (user: Usuario, empresa: Empresa) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Procurar utilizador correspondente no Supabase
      const { data: users, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('password', password)
        .eq('status', 'ativo');

      if (userError) throw userError;

      const user = users && users[0];

      if (!user) {
        setErrorMessage('E-mail ou palavra-passe incorretos ou conta inativa.');
        setIsLoading(false);
        return;
      }

      // 2. Procurar a empresa associada ao utilizador para verificar a subscrição
      const { data: empresas, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', user.empresa_id);

      if (empresaError) throw empresaError;

      const empresa = empresas && empresas[0];

      if (!empresa) {
        setErrorMessage('Empresa não encontrada ou desativada.');
        setIsLoading(false);
        return;
      }

      // 3. Verificação de Segurança da Subscrição
      const dataCriacao = new Date(empresa.created_at);
      const dataAtual = new Date();
      const diffTime = Math.abs(dataAtual.getTime() - dataCriacao.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const subscricaoAtiva = empresa.status_subscricao === 'ativo';
      const periodoTesteValido = diffDays <= 14;

      if (!subscricaoAtiva && !periodoTesteValido) {
        setIsLoading(false);
        navigation.navigate('SubscriptionExpired', {
          empresaNome: empresa.nome_comercial,
          diasExpirados: diffDays - 14
        });
        return;
      }

      // 4. Sucesso no Login
      onLoginSuccess(user as Usuario, empresa as Empresa);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(`Erro ao conectar: ${e.message || 'Erro de rede'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* Cabeçalho */}
          <Text style={styles.brandText}>Zonno</Text>
          <Text style={styles.titleText}>Iniciar Sessão</Text>
          <Text style={styles.subtitleText}>Inicie sessão para gerir o seu negócio.</Text>
          
          {/* Formulário */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'email' && styles.inputFocused
                ]}
                value={email}
                onChangeText={(text) => { setEmail(text); setErrorMessage(null); }}
                placeholder="Introduza o seu e-mail"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Palavra-passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    focusedField === 'password' && styles.inputFocused
                  ]}
                  value={password}
                  onChangeText={(text) => { setPassword(text); setErrorMessage(null); }}
                  placeholder="Introduza a sua password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={styles.visibilityButton}
                >
                  {isPasswordVisible ? (
                    <EyeSlash size={20} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={20} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Opções extras (Lembrar-me & Esqueceu-se) */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.rememberMeContainer}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.rememberMeText}>Lembrar-me</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Esqueceu-se da palavra-passe?</Text>
              </TouchableOpacity>
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            {/* Botão Entrar */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Biometria */}
            <TouchableOpacity 
              style={styles.biometryButton} 
              onPress={() => alert('Biometria não configurada neste dispositivo.')}
              activeOpacity={0.7}
            >
              <Fingerprint size={24} color={COLORS.textPrimary} weight="thin" />
              <Text style={styles.biometryText}>Entrar com Biometria</Text>
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login */}
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={() => alert('Login social indisponível de momento.')}
              activeOpacity={0.8}
            >
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleLetter}>G</Text>
              </View>
              <Text style={styles.googleText}>Continuar com Google</Text>
            </TouchableOpacity>

            {/* Link de registo */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerLabel}>Não tem conta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Criar Conta</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Copyright */}
          <Text style={styles.copyrightText}>
            © 2024 Zonno. Todos os direitos reservados.{"\n"}Termos  |  Privacidade
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontFamily: TYPOGRAPHY.fontFamily.serif,
    fontSize: 26,
    color: COLORS.primary,
    marginTop: 40,
    marginBottom: 24,
  },
  titleText: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 32,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 8,
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
  passwordContainer: {
    width: '100%',
    height: 52,
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingLeft: 16,
    paddingRight: 48,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
  },
  visibilityButton: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.surface,
  },
  rememberMeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  forgotText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.status.cancelado.text,
    backgroundColor: COLORS.status.cancelado.background,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
  },
  biometryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  biometryText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingHorizontal: 12,
  },
  googleButton: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleLetter: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  googleText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  registerLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  copyrightText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 16,
  },
});
