import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
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

  // Seletor de data de nascimento (calendário puro React Native)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear() - 25); // Iniciar com ~25 anos atrás por UX
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [showYearSelector, setShowYearSelector] = useState(false);

  const diasDaSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const anos = [];
  for (let y = new Date().getFullYear(); y >= 1920; y--) {
    anos.push(y);
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleSelectDay = (day: number) => {
    const dataFormatada = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setNascimento(dataFormatada);
    setShowDatePicker(false);
  };

  const renderCalendarModal = () => {
    const totalDays = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    // Gerar grade de dias
    const gridDays = [];
    // Espaços vazios antes do dia 1
    for (let i = 0; i < firstDay; i++) {
      gridDays.push(null);
    }
    // Dias do mês
    for (let d = 1; d <= totalDays; d++) {
      gridDays.push(d);
    }

    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={calendarStyles.modalOverlay}>
          <View style={calendarStyles.modalContent}>
            {/* Cabeçalho do Calendário */}
            <View style={calendarStyles.header}>
              <TouchableOpacity 
                onPress={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(prev => prev - 1);
                  } else {
                    setCurrentMonth(prev => prev - 1);
                  }
                }}
                style={calendarStyles.navButton}
              >
                <Text style={calendarStyles.navButtonText}>{"<"}</Text>
              </TouchableOpacity>
              
              <View style={calendarStyles.headerTitleContainer}>
                <TouchableOpacity onPress={() => setShowYearSelector(!showYearSelector)} style={calendarStyles.headerTitleBtn}>
                  <Text style={calendarStyles.headerTitleText}>
                    {nomesMeses[currentMonth]} {currentYear} ▾
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(prev => prev + 1);
                  } else {
                    setCurrentMonth(prev => prev + 1);
                  }
                }}
                style={calendarStyles.navButton}
              >
                <Text style={calendarStyles.navButtonText}>{">"}</Text>
              </TouchableOpacity>
            </View>

            {showYearSelector ? (
              /* Seletor de Ano Rápido */
              <View style={calendarStyles.yearSelectorContainer}>
                <Text style={calendarStyles.selectorTitle}>Selecione o Ano de Nascimento</Text>
                <ScrollView style={calendarStyles.yearScrollView} contentContainerStyle={{ paddingBottom: 16 }} nestedScrollEnabled={true}>
                  <View style={calendarStyles.yearGrid}>
                    {anos.map(y => (
                      <TouchableOpacity 
                        key={y} 
                        style={[
                          calendarStyles.yearItem,
                          y === currentYear && calendarStyles.yearItemActive
                        ]}
                        onPress={() => {
                          setCurrentYear(y);
                          setShowYearSelector(false);
                        }}
                      >
                        <Text style={[
                          calendarStyles.yearItemText,
                          y === currentYear && calendarStyles.yearItemTextActive
                        ]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <TouchableOpacity onPress={() => setShowYearSelector(false)} style={calendarStyles.closeSelectorBtn}>
                  <Text style={calendarStyles.closeSelectorBtnText}>Voltar para o Calendário</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Grade do Calendário */
              <View style={calendarStyles.calendarGrid}>
                {/* Dias da semana */}
                <View style={calendarStyles.weekDaysRow}>
                  {diasDaSemana.map((day, idx) => (
                    <Text key={idx} style={calendarStyles.weekDayText}>{day}</Text>
                  ))}
                </View>

                {/* Dias do mês */}
                <View style={calendarStyles.daysGrid}>
                  {gridDays.map((day, idx) => {
                    const isSelected = day && nascimento === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    return (
                      <TouchableOpacity
                        key={idx}
                        disabled={!day}
                        style={[
                          calendarStyles.dayCell,
                          !day && calendarStyles.dayCellEmpty,
                          isSelected && calendarStyles.dayCellSelected
                        ]}
                        onPress={() => day && handleSelectDay(day)}
                      >
                        {day && (
                          <Text style={[
                            calendarStyles.dayText,
                            isSelected && calendarStyles.dayTextSelected
                          ]}>
                            {day}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Ações Inferiores */}
            <View style={calendarStyles.footerActions}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={calendarStyles.cancelBtn}>
                <Text style={calendarStyles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* TopBar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackClick} style={styles.backButton} activeOpacity={0.7}>
            <CaretLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{clienteEdicao ? 'Editar Cliente' : 'Novo Cliente'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={[{}]}
          keyExtractor={() => 'form'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          renderItem={() => (
            <>
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
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dateInputContainer,
                  showDatePicker && styles.inputFocused
                ]}
                onPress={() => {
                  // Se houver uma data válida já selecionada, inicializar o calendário nela
                  if (nascimento && nascimento.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const parts = nascimento.split('-');
                    setCurrentYear(parseInt(parts[0]));
                    setCurrentMonth(parseInt(parts[1]) - 1);
                  }
                  setShowDatePicker(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.dateInputText,
                  !nascimento && styles.dateInputPlaceholder
                ]}>
                  {nascimento || 'Selecionar data de nascimento...'}
                </Text>
              </TouchableOpacity>
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
            </>
          )}
        />
      </KeyboardAvoidingView>
      {renderCalendarModal()}
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
    flexGrow: 1,
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
  dateInputContainer: {
    justifyContent: 'center',
  },
  dateInputText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
  },
  dateInputPlaceholder: {
    color: '#9ca3af',
  },
});

const calendarStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  headerTitleText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textPrimary,
  },
  calendarGrid: {
    width: '100%',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: '#9ca3af',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
  },
  dayTextSelected: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  yearSelectorContainer: {
    height: 240,
    alignItems: 'center',
  },
  selectorTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  yearScrollView: {
    flex: 1,
    width: '100%',
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  yearItem: {
    width: '30%',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    marginBottom: 8,
  },
  yearItemActive: {
    backgroundColor: COLORS.primary,
  },
  yearItemText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
  },
  yearItemTextActive: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  closeSelectorBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  closeSelectorBtnText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textPrimary,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textSecondary,
  },
});
