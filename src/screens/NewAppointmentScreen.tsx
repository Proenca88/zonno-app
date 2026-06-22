import React, { useEffect, useState } from 'react';
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
  Modal,
} from 'react-native';
import { TYPOGRAPHY } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../remote/supabase';
import { Usuario, Empresa } from '../types';
import { CaretLeft, Calendar, Clock, CurrencyEur, Note, User, Sparkle } from 'phosphor-react-native';

interface NewAppointmentScreenProps {
  currentUser: Usuario;
  empresa: Empresa;
  navigation: any;
}

interface ClienteData {
  id: string;
  nome: string;
  telemovel: string | null;
}

interface ServicoData {
  id: string;
  nome: string;
  preco: number;
  duracao: number; // duração em minutos
}

const SLOTS_HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export function NewAppointmentScreen({ currentUser, empresa, navigation }: NewAppointmentScreenProps) {
  const { COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [servicos, setServicos] = useState<ServicoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados do formulário
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null);
  const [showClientesList, setShowClientesList] = useState(false);

  const [servicoSearch, setServicoSearch] = useState('');
  const [selectedServicos, setSelectedServicos] = useState<ServicoData[]>([]);
  const [showServicosList, setShowServicosList] = useState(false);
  
  // Controle do Picker de Hora
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);

  // Inicializar com a data de hoje formatada (AAAA-MM-DD)
  const formatarDataISO = (d: Date) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const formatarHoraISO = (d: Date) => {
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    // Arredondar para o slot de 30 min mais próximo para UX premium
    const minsNum = d.getMinutes();
    const minsRounded = minsNum < 15 ? '00' : minsNum < 45 ? '30' : '00';
    let hrsNum = d.getHours();
    if (minsNum >= 45) hrsNum = (hrsNum + 1) % 24;
    const hrsStr = String(hrsNum).padStart(2, '0');
    return `${hrsStr}:${minsRounded}`;
  };

  const [data, setData] = useState(formatarDataISO(new Date()));
  const [hora, setHora] = useState(formatarHoraISO(new Date()));
  const [valor, setValor] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clResult, svResult] = await Promise.all([
          supabase
            .from('clientes')
            .select('id, nome, telemovel')
            .eq('empresa_id', currentUser.empresa_id)
            .order('nome', { ascending: true }),
          supabase
            .from('servicos')
            .select('id, nome, preco, duracao')
            .eq('empresa_id', currentUser.empresa_id)
            .order('nome', { ascending: true }),
        ]);

        if (clResult.data) setClientes(clResult.data as ClienteData[]);
        if (svResult.data) setServicos(svResult.data as ServicoData[]);
      } catch (e) {
        console.error('Erro ao carregar dados do Supabase:', e);
        setErrorMessage('Erro ao carregar os dados. Verifique a sua ligação.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser.empresa_id]);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleSelectCliente = (cliente: ClienteData) => {
    setSelectedCliente(cliente);
    setClienteSearch(cliente.nome);
    setShowClientesList(false);
    setErrorMessage(null);
  };

  const handleSelectServico = (servico: ServicoData) => {
    if (!selectedServicos.find(s => s.id === servico.id)) {
      const novosServicos = [...selectedServicos, servico];
      setSelectedServicos(novosServicos);
      const precoTotal = novosServicos.reduce((sum, s) => sum + Number(s.preco), 0);
      setValor(precoTotal.toFixed(2));
    }
    setServicoSearch('');
    setShowServicosList(false);
    setErrorMessage(null);
  };

  const handleRemoveServico = (id: string) => {
    const novosServicos = selectedServicos.filter(s => s.id !== id);
    setSelectedServicos(novosServicos);
    const precoTotal = novosServicos.reduce((sum, s) => sum + Number(s.preco), 0);
    setValor(precoTotal.toFixed(2));
  };

  const handleSave = async () => {
    if (!selectedCliente) {
      setErrorMessage('Por favor, selecione um Cliente.');
      return;
    }
    if (selectedServicos.length === 0) {
      setErrorMessage('Por favor, selecione pelo menos um Serviço.');
      return;
    }
    if (!data.trim() || !hora.trim()) {
      setErrorMessage('Por favor, indique a Data e a Hora da marcação.');
      return;
    }

    // Validar formato de Data (AAAA-MM-DD)
    const regexData = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexData.test(data.trim())) {
      setErrorMessage('Formato de data inválido. Use AAAA-MM-DD (Ex: 2026-06-18).');
      return;
    }

    // Validar formato de Hora (HH:MM)
    const regexHora = /^\d{2}:\d{2}$/;
    if (!regexHora.test(hora.trim())) {
      setErrorMessage('Formato de hora inválido. Use HH:MM (Ex: 14:30).');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const servicoPrincipal = selectedServicos[0];
      const extras = selectedServicos.slice(1).map(s => ({
        id: s.id,
        nome: s.nome,
        preco: Number(s.preco),
        duracao: s.duracao
      }));

      const novoAgendamento = {
        id: generateUUID(),
        empresa_id: currentUser.empresa_id,
        cliente_id: selectedCliente.id,
        servico_id: servicoPrincipal.id,
        data: data.trim(),
        hora: `${hora.trim()}:00`,
        status: 'confirmado',
        valor_pago: valor ? parseFloat(valor) : selectedServicos.reduce((sum, s) => sum + Number(s.preco), 0),
        observacoes: observacoes.trim() || null,
        servicos_extra: extras.length > 0 ? JSON.stringify(extras) : null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('agendamentos').insert([novoAgendamento]);

      if (error) throw error;

      Alert.alert('Sucesso', 'Marcação agendada com sucesso!');
      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      setErrorMessage(`Erro ao guardar agendamento: ${e.message || 'Erro de rede'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtragem local de clientes e serviços
  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const filteredServicos = servicos.filter(s =>
    s.nome.toLowerCase().includes(servicoSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* TopBar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <CaretLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Marcação</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>A carregar dados do espaço...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.introSection}>
              <Text style={styles.helperText}>
                Registe um novo agendamento na agenda de {empresa.nome_comercial}.
              </Text>
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <View style={styles.form}>
              {/* Pesquisa / Seleção de Cliente */}
              <View style={[styles.inputWrapper, { zIndex: 50 }]}>
                <Text style={styles.label}>Cliente *</Text>
                <View style={styles.searchContainer}>
                  <User size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.inputWithIcon,
                      focusedField === 'cliente' && styles.inputFocused
                    ]}
                    value={clienteSearch}
                    onChangeText={(text) => {
                      setClienteSearch(text);
                      setSelectedCliente(null);
                      setShowClientesList(true);
                      setErrorMessage(null);
                    }}
                    placeholder="Pesquise por nome do cliente..."
                    placeholderTextColor="#9ca3af"
                    onFocus={() => {
                      setFocusedField('cliente');
                      setShowClientesList(true);
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                
                {/* Lista suspensa de sugestões de clientes */}
                {showClientesList && clienteSearch.length > 0 && (
                  <View style={styles.dropdownList}>
                    {filteredClientes.length === 0 ? (
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setShowClientesList(false);
                          navigation.navigate('NovoCliente');
                        }}
                      >
                        <Text style={styles.addNewText}>+ Criar novo cliente "{clienteSearch}"</Text>
                      </TouchableOpacity>
                    ) : (
                      filteredClientes.slice(0, 5).map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectCliente(item)}
                        >
                          <Text style={styles.dropdownItemText}>{item.nome}</Text>
                          {item.telemovel && <Text style={styles.dropdownItemSubtext}>{item.telemovel}</Text>}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>

              {/* Pesquisa / Seleção de Serviços */}
              <View style={[styles.inputWrapper, { zIndex: 40 }]}>
                <Text style={styles.label}>Serviços Selecionados *</Text>

                {selectedServicos.length > 0 && (
                  <View style={styles.selectedServicosContainer}>
                    {selectedServicos.map(s => (
                      <View key={s.id} style={styles.servicoTag}>
                        <Text style={styles.servicoTagText}>{s.nome} ({Number(s.preco).toFixed(2)} €)</Text>
                        <TouchableOpacity onPress={() => handleRemoveServico(s.id)} style={styles.removeServicoBtn}>
                          <Text style={styles.removeServicoBtnText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.searchContainer}>
                  <Sparkle size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.inputWithIcon,
                      focusedField === 'servico' && styles.inputFocused
                    ]}
                    value={servicoSearch}
                    onChangeText={(text) => {
                      setServicoSearch(text);
                      setShowServicosList(true);
                      setErrorMessage(null);
                    }}
                    placeholder="Pesquise e adicione um serviço..."
                    placeholderTextColor="#9ca3af"
                    onFocus={() => {
                      setFocusedField('servico');
                      setShowServicosList(true);
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                {/* Lista suspensa de sugestões de serviços */}
                {showServicosList && (
                  <View style={styles.dropdownList}>
                    {filteredServicos.length === 0 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemSubtext}>Nenhum serviço encontrado.</Text>
                      </View>
                    ) : (
                      filteredServicos.slice(0, 5).map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectServico(item)}
                        >
                          <Text style={styles.dropdownItemText}>{item.nome}</Text>
                          <Text style={styles.dropdownItemSubtext}>{Number(item.preco).toFixed(2)} €</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>

              {/* Data da Marcação */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Data (AAAA-MM-DD) *</Text>
                <View style={styles.searchContainer}>
                  <Calendar size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.inputWithIcon,
                      focusedField === 'data' && styles.inputFocused
                    ]}
                    value={data}
                    onChangeText={setData}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#9ca3af"
                    onFocus={() => setFocusedField('data')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Hora da Marcação (Seletor de Hora Premium) */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Hora (HH:MM) *</Text>
                <TouchableOpacity 
                  style={styles.searchContainer}
                  onPress={() => setShowTimePickerModal(true)}
                  activeOpacity={0.8}
                >
                  <Clock size={20} color="#9ca3af" style={styles.inputIcon} />
                  <View style={[
                    styles.inputWithIcon,
                    styles.fakeInput,
                    showTimePickerModal && styles.inputFocused
                  ]}>
                    <Text style={[styles.fakeInputText, !hora && styles.fakeInputPlaceholder]}>
                      {hora || 'Selecione o horário...'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>



              {/* Observações */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Observações / Notas</Text>
                <View style={styles.searchContainer}>
                  <Note size={20} color="#9ca3af" style={[styles.inputIcon, { marginTop: 14 }]} />
                  <TextInput
                    style={[
                      styles.inputWithIcon,
                      styles.textArea,
                      focusedField === 'observacoes' && styles.inputFocused
                    ]}
                    value={observacoes}
                    onChangeText={setObservacoes}
                    placeholder="Informação adicional sobre o agendamento..."
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                    onFocus={() => setFocusedField('observacoes')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Botão de Guardar */}
              <TouchableOpacity
                style={[styles.button, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.9}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Confirmar Marcação</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modal Seletor de Hora Premium */}
      <Modal
        visible={showTimePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolha o Horário</Text>
            
            <ScrollView contentContainerStyle={styles.timeGrid}>
              {SLOTS_HORARIOS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.timeSlotBtn,
                    hora === item && styles.timeSlotBtnActive
                  ]}
                  onPress={() => {
                    setHora(item);
                    setShowTimePickerModal(false);
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.timeSlotText,
                    hora === item && styles.timeSlotTextActive
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeModalBtn}
              onPress={() => setShowTimePickerModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeModalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
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
    position: 'relative',
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  inputWithIcon: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingLeft: 48,
    paddingRight: 16,
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
  dropdownList: {
    position: 'absolute',
    top: 84,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  dropdownItemSubtext: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  addNewText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 13,
    color: COLORS.primary,
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
  selectedServicosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  servicoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  servicoTagText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  removeServicoBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeServicoBtnText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
    lineHeight: 12,
  },
  fakeInput: {
    justifyContent: 'center',
  },
  fakeInputText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  fakeInputPlaceholder: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timeSlotBtn: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timeSlotBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textPrimary,
  },
  timeSlotTextActive: {
    color: COLORS.surface,
  },
  closeModalBtn: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
});
