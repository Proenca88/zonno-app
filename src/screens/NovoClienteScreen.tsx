import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Usuario, Empresa } from '../types';
import { CaretLeft } from 'phosphor-react-native';

const niches = [
  { id: 'estetica', label: 'Estética' },
  { id: 'barbearia', label: 'Barbearia' },
  { id: 'cabeleireiro', label: 'Cabeleireiro' },
  { id: 'tattoo', label: 'Tatuagem' },
  { id: 'clinica', label: 'Clínica' },
  { id: 'outros', label: 'Outros' }
];

interface NovoClienteScreenProps {
  currentUser: Usuario;
  empresa: Empresa;
  onBackClick: () => void;
  onSuccess: () => void;
  clienteEdicao?: any;
}

export const NovoClienteScreen: React.FC<NovoClienteScreenProps> = ({
  currentUser,
  empresa,
  onBackClick,
  onSuccess,
  clienteEdicao,
}) => {
  const [nome, setNome] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [email, setEmail] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [morada, setMorada] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Estado dinâmico para os campos específicos de cada nicho
  const [nicheValues, setNicheValues] = useState<Record<string, string>>({});

  // Inicializar dados se estiver em modo de edição
  React.useEffect(() => {
    if (clienteEdicao) {
      setNome(clienteEdicao.nome || '');
      setTelemovel(clienteEdicao.telemovel || '');
      setEmail(clienteEdicao.email || '');
      setNascimento(clienteEdicao.nascimento || '');
      setMorada(clienteEdicao.morada || '');
      setObservacoes(clienteEdicao.observacoes || '');
      setNicheValues(clienteEdicao.dados_adicionais || {});
    }
  }, [clienteEdicao]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const getNicheFields = () => {
    switch (empresa.nicho) {
      case 'estetica':
        return [
          { key: 'tipo_pele', label: 'Tipo de Pele', placeholder: 'Ex: Seca, oleosa, mista...', type: 'text' },
          { key: 'alergias', label: 'Alergias / Contraindicações', placeholder: 'Ex: Ácido glicólico, grávida...', type: 'text' },
          { key: 'observacoes_estetica', label: 'Notas de Estética', placeholder: 'Preferências ou histórico...', type: 'textarea' }
        ];
      case 'barbearia':
        return [
          { key: 'estilo_corte', label: 'Estilo de Corte Favorito', placeholder: 'Ex: Degradê, undercut, clássico...', type: 'text' },
          { key: 'tipo_barba', label: 'Preferências de Barba', placeholder: 'Ex: Barba desenhada, escanhoada...', type: 'text' },
          { key: 'observacoes_barbearia', label: 'Notas da Barbearia', placeholder: 'Frequência, preferências...', type: 'textarea' }
        ];
      case 'cabeleireiro':
        return [
          { key: 'tipo_cabelo', label: 'Tipo / Textura do Cabelo', placeholder: 'Ex: Liso, ondulado, crespo...', type: 'text' },
          { key: 'quimicas_anteriores', label: 'Químicas / Colorações Anteriores', placeholder: 'Ex: Progressiva, descoloração...', type: 'text' },
          { key: 'observacoes_cabeleireiro', label: 'Notas de Cabelo', placeholder: 'Produtos preferidos...', type: 'textarea' }
        ];
      case 'tattoo':
        return [
          { key: 'alergias_tintas', label: 'Alergias (Tintas/Metais/Látex)', placeholder: 'Ex: Alergia a níquel, látex...', type: 'text' },
          { key: 'local_corpo', label: 'Localização da Tattoo/Piercing', placeholder: 'Ex: Antebraço, lóbulo...', type: 'text' },
          { key: 'observacoes_tattoo', label: 'Notas de Tattoo', placeholder: 'Estilo da arte, tamanho...', type: 'textarea' }
        ];
      case 'clinica':
        return [
          { key: 'alergias_medicamentos', label: 'Alergias a Medicamentos', placeholder: 'Ex: Penicilina, aspirina...', type: 'text' },
          { key: 'condicoes_medicas', label: 'Condições Médicas Relevantes', placeholder: 'Ex: Diabetes, hipertensão...', type: 'text' },
          { key: 'observacoes_clinica', label: 'Notas da Consulta', placeholder: 'Queixa principal, histórico...', type: 'textarea' }
        ];
      case 'outros':
      default:
        return [
          { key: 'observacoes_gerais', label: 'Observações Gerais', placeholder: 'Informações adicionais...', type: 'textarea' }
        ];
    }
  };

  const handleSave = async () => {
    if (!nome.trim() || !telemovel.trim()) {
      setErrorMessage('Por favor, preencha o Nome Completo e o Telemóvel.');
      return;
    }

    if (telemovel.trim().length !== 9) {
      setErrorMessage('O número de telemóvel deve ter exatamente 9 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Validar duplicados apenas se o telemóvel for novo ou alterado
      const telemovelAlterado = !clienteEdicao || clienteEdicao.telemovel !== telemovel.trim();
      
      if (telemovelAlterado) {
        const { data: existe } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('telemovel', telemovel.trim())
          .eq('empresa_id', currentUser.empresa_id);

        if (existe && existe.length > 0) {
          setErrorMessage(`Já existe um cliente com o telemóvel ${telemovel} (${existe[0].nome}).`);
          setIsLoading(false);
          return;
        }
      }

      const dadosCliente = {
        nome: nome.trim(),
        telemovel: telemovel.trim(),
        email: email.trim() || null,
        nascimento: nascimento.trim() || null,
        morada: morada.trim() || null,
        observacoes: observacoes.trim() || null,
        dados_adicionais: nicheValues
      };

      if (clienteEdicao) {
        // Modo de Edição: UPDATE
        const { error } = await supabase
          .from('clientes')
          .update(dadosCliente)
          .eq('id', clienteEdicao.id);

        if (error) throw error;
        Alert.alert('Sucesso', 'Dados do cliente atualizados com sucesso!');
      } else {
        // Modo de Criação: INSERT
        const novoCliente = {
          id: generateUUID(),
          empresa_id: currentUser.empresa_id,
          ...dadosCliente
        };

        const { error } = await supabase
          .from('clientes')
          .insert([novoCliente]);

        if (error) throw error;
        Alert.alert('Sucesso', 'Cliente guardado com sucesso!');
      }

      onSuccess();
    } catch (e: any) {
      setErrorMessage(`Erro ao guardar cliente: ${e.message || 'Erro de rede'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* TopBar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackClick} style={styles.backButton} activeOpacity={0.7}>
            <CaretLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{clienteEdicao ? 'Editar Cliente' : 'Novo Cliente'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.introSection}>
            <Text style={styles.helperText}>
              {clienteEdicao 
                ? 'Edite as informações e especificações do registo do cliente.' 
                : 'Crie um novo registo de cliente na sua base de dados Zonno.'}
            </Text>
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <View style={styles.form}>
            {/* Nome Completo */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'nome' && styles.inputFocused
                ]}
                value={nome}
                onChangeText={(text) => { setNome(text); setErrorMessage(null); }}
                placeholder="Nome Completo do Cliente"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('nome')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Telemóvel */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Telemóvel *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'telemovel' && styles.inputFocused
                ]}
                value={telemovel}
                onChangeText={(text) => { setTelemovel(text.replace(/[^0-9]/g, '')); setErrorMessage(null); }}
                placeholder="9xxxxxxxx"
                keyboardType="number-pad"
                maxLength={9}
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('telemovel')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* E-mail */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'email' && styles.inputFocused
                ]}
                value={email}
                onChangeText={(text) => { setEmail(text); setErrorMessage(null); }}
                placeholder="nome@dominio.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Data de Nascimento */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'nascimento' && styles.inputFocused
                ]}
                value={nascimento}
                onChangeText={setNascimento}
                placeholder="AAAA-MM-DD (Ex: 1995-10-15)"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('nascimento')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Morada */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Morada</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'morada' && styles.inputFocused
                ]}
                value={morada}
                onChangeText={setMorada}
                placeholder="Morada do Cliente"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('morada')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Observações Gerais */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Observações Gerais</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  focusedField === 'observacoes' && styles.inputFocused
                ]}
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Escreva observações de atendimento gerais..."
                multiline={true}
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedField('observacoes')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Separador Visual de Informações Adicionais */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>
                Dados Adicionais ({niches.find(n => n.id === empresa.nicho)?.label || 'Outros'})
              </Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Campos Dinâmicos do Nicho */}
            {getNicheFields().map((field) => (
              <View key={field.key} style={styles.inputWrapper}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={[
                    styles.input,
                    field.type === 'textarea' && styles.textArea,
                    focusedField === field.key && styles.inputFocused
                  ]}
                  value={nicheValues[field.key] || ''}
                  onChangeText={(text) => setNicheValues({ ...nicheValues, [field.key]: text })}
                  placeholder={field.placeholder}
                  placeholderTextColor="#9ca3af"
                  multiline={field.type === 'textarea'}
                  numberOfLines={field.type === 'textarea' ? 4 : 1}
                  onFocus={() => setFocusedField(field.key)}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            ))}

            {/* Botão Guardar */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.surface} size="small" />
              ) : (
                <Text style={styles.buttonText}>Guardar Cliente</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  headerTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  introSection: {
    marginBottom: 24,
  },
  helperText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
  textArea: {
    height: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 12,
    color: COLORS.primary,
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
  button: {
    width: '100%',
    height: 54,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
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
