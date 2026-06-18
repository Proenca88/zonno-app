import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { CaretLeft } from 'phosphor-react-native';
import { supabase } from '../remote/supabase';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function RegisterScreen({ navigation }: any) {
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [nomeComercial, setNomeComercial] = useState('');
  const [nicho, setNicho] = useState<'estetica' | 'barbearia' | 'cabeleireiro' | 'tattoo' | 'clinica' | 'outros' | null>(null);
  const [email, setEmail] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [focusedField, setFocusedField] = useState<'nomeResponsavel' | 'nomeComercial' | 'email' | 'telemovel' | 'password' | null>(null);

  const niches = [
    { id: 'estetica', label: 'Estética' },
    { id: 'barbearia', label: 'Barbearia' },
    { id: 'cabeleireiro', label: 'Cabeleireiro' },
    { id: 'tattoo', label: 'Tatuagem' },
    { id: 'clinica', label: 'Clínica' },
    { id: 'outros', label: 'Outros' }
  ];

  const handleRegister = async () => {
    if (!nomeResponsavel || !nomeComercial || !email || !telemovel || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!nicho) {
      setErrorMsg('Por favor, selecione o seu Nicho de Negócio.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('Deve aceitar os Termos e Condições.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Criar a Empresa no Supabase
      const empresaId = generateUUID();
      const { data: newEmpresa, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          id: empresaId,
          nome_comercial: nomeComercial.trim(),
          nicho: nicho,
          status_subscricao: 'teste', // Período de 14 dias de teste
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (empresaError) {
        throw new Error('Erro ao criar a empresa: ' + empresaError.message);
      }

      // 2. Criar o Utilizador Administrador associado a essa empresa
      const userId = generateUUID();
      const { error: userError } = await supabase
        .from('usuarios')
        .insert({
          id: userId,
          empresa_id: empresaId,
          nome: nomeResponsavel.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          perfil: 'admin',
          status: 'ativo',
          must_change_password: false,
          created_at: new Date().toISOString()
        });

      if (userError) {
        // Rollback da empresa criada
        await supabase.from('empresas').delete().eq('id', empresaId);
        throw new Error('Erro ao criar o utilizador: ' + userError.message);
      }

      // 3. Criar uma configuração inicial para a empresa
      await supabase
        .from('configuracoes')
        .insert({
          id: empresaId,
          valor: JSON.stringify({
            nome: nomeComercial.trim(),
            telefone: telemovel.trim(),
            email: email.trim(),
            metodos_pagamento: ['Dinheiro', 'MBWay', 'Cartão', 'Transferência']
          })
        });

      alert('Espaço e conta criados com sucesso! Faça login para iniciar os seus 14 dias de teste.');
      navigation.navigate('Login');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocorreu um erro no registo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <CaretLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.brandText}>Zonno</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.introSection}>
            <Text style={styles.titleText}>Criar Conta</Text>
            <Text style={styles.subtitleText}>
              Registe o seu espaço em segundos e comece já a gerir o seu negócio.
            </Text>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.form}>
            {/* Nome do Responsável */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nome do Responsável</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'nomeResponsavel' && styles.inputFocused
                ]}
                placeholder="Ex: Maria Silva"
                placeholderTextColor="#9ca3af"
                value={nomeResponsavel}
                onChangeText={(text) => { setNomeResponsavel(text); setErrorMsg(''); }}
                onFocus={() => setFocusedField('nomeResponsavel')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Nome da Empresa */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nome do Espaço / Clínica</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'nomeComercial' && styles.inputFocused
                ]}
                placeholder="Ex: Barber Glow Coimbra"
                placeholderTextColor="#9ca3af"
                value={nomeComercial}
                onChangeText={(text) => { setNomeComercial(text); setErrorMsg(''); }}
                onFocus={() => setFocusedField('nomeComercial')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Nicho de Negócio */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nicho de Negócio</Text>
              <View style={styles.nicheContainer}>
                {niches.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.nicheButton,
                      nicho === item.id && styles.nicheButtonActive
                    ]}
                    onPress={() => setNicho(item.id as any)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.nicheButtonText,
                        nicho === item.id && styles.nicheButtonTextActive
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* E-mail Profissional */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>E-mail Profissional</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'email' && styles.inputFocused
                ]}
                placeholder="contacto@negocio.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(text) => { setEmail(text); setErrorMsg(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Telemóvel */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Telemóvel</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'telemovel' && styles.inputFocused
                ]}
                placeholder="912 345 678"
                placeholderTextColor="#9ca3af"
                value={telemovel}
                onChangeText={(text) => { setTelemovel(text); setErrorMsg(''); }}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('telemovel')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Palavra-passe */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Palavra-passe</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'password' && styles.inputFocused
                ]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorMsg(''); }}
                secureTextEntry
                autoCapitalize="none"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Checkbox de Termos */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.checkboxLabel}>
                Li e aceito os <Text style={styles.boldLink}>Termos de Serviço e Política de Privacidade</Text>.
              </Text>
            </TouchableOpacity>

            {/* Botão de Submeter */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Criar Conta e Iniciar Teste</Text>
              )}
            </TouchableOpacity>

            {/* Link para Login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginLabel}>Já tem uma conta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Iniciar Sessão</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
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
    paddingHorizontal: 16,
    lineHeight: 20,
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
    marginBottom: 24,
    textAlign: 'center',
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
  nicheContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  nicheButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  nicheButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  nicheButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  nicheButtonTextActive: {
    color: COLORS.surface,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 16,
    gap: 10,
    paddingHorizontal: 2,
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
    marginTop: 2,
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
  checkboxLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  boldLink: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  loginLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});

