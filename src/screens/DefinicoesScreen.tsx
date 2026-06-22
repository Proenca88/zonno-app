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
  Switch
} from 'react-native';
import { TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { useTheme } from '../context/ThemeContext';
import { Usuario, Empresa } from '../types';
import { 
  Storefront, 
  Clock, 
  Trash, 
  FloppyDisk, 
  CaretRight, 
  Scissors, 
  FirstAidKit,
  Pen,
  FlowerLotus,
  Barbell,
  DotsThree,
  Ticket,
  Gear,
  Sparkle,
  Crown
} from 'phosphor-react-native';

interface DefinicoesScreenProps {
  currentUser: Usuario;
  empresa: Empresa;
  navigation: any;
  onLogoutClick?: () => void;
}

interface HorarioDia {
  aberto: boolean;
  inicio: string;
  fim: string;
}

interface HorariosSemana {
  [key: string]: HorarioDia;
}

const DIAS_TRADUCAO: Record<string, { nome: string; abrev: string }> = {
  seg: { nome: 'Segunda-feira', abrev: 'SEG' },
  ter: { nome: 'Terça-feira', abrev: 'TER' },
  qua: { nome: 'Quarta-feira', abrev: 'QUA' },
  qui: { nome: 'Quinta-feira', abrev: 'QUI' },
  sex: { nome: 'Sexta-feira', abrev: 'SEX' },
  sab: { nome: 'Sábado', abrev: 'SÁB' },
  dom: { nome: 'Domingo', abrev: 'DOM' }
};

export const DefinicoesScreen: React.FC<DefinicoesScreenProps> = ({
  currentUser,
  empresa: empresaInicial,
  navigation,
  onLogoutClick
}) => {
  const { isDark: darkMode, toggleTheme, COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);

  const [nomeComercial, setNomeComercial] = useState(empresaInicial?.nome_comercial || '');
  const [nicho, setNicho] = useState<string>(empresaInicial?.nicho || 'estetica');
  const [nif, setNif] = useState('');
  const [morada, setMorada] = useState('');
  const [telefone, setTelefone] = useState('');
  const [emailNegocio, setEmailNegocio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [statusSubscricao, setStatusSubscricao] = useState(empresaInicial?.status_subscricao || 'teste');

  const calcularDiasTesteRestantes = () => {
    if (!empresaInicial?.created_at) return 14;
    const dataCriacao = new Date(empresaInicial.created_at);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - dataCriacao.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const restantes = 14 - diffDays;
    return restantes > 0 ? restantes : 0;
  };

  const handleUpgradeEmpresa = async (plano: string) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('empresas')
        .update({ status_subscricao: 'ativo' })
        .eq('id', currentUser.empresa_id);

      if (error) throw error;

      Alert.alert(
        "Sucesso",
        `Upgrade concluído com sucesso no plano ${plano}! Obrigado por confiar no Zonno.`
      );
      setStatusSubscricao('ativo');
      setShowUpgradeModal(false);
    } catch (e: any) {
      Alert.alert("Erro", `Não foi possível processar o upgrade: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  const [isLoading, setIsLoading] = useState(true);

  // Horários de funcionamento
  const [horarios, setHorarios] = useState<HorariosSemana>({
    seg: { aberto: true, inicio: '09:00', fim: '19:00' },
    ter: { aberto: true, inicio: '09:00', fim: '19:00' },
    qua: { aberto: true, inicio: '09:00', fim: '19:00' },
    qui: { aberto: true, inicio: '09:00', fim: '19:00' },
    sex: { aberto: true, inicio: '09:00', fim: '19:00' },
    sab: { aberto: false, inicio: '09:00', fim: '13:00' },
    dom: { aberto: false, inicio: '09:00', fim: '13:00' }
  });

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('id', currentUser.empresa_id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 é o código para nenhum registo encontrado
          throw error;
        }

        if (data && data.valor) {
          const configJson = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
          setNif(configJson.nif || '');
          setMorada(configJson.morada || '');
          setTelefone(configJson.telefone || '');
          setEmailNegocio(configJson.email || currentUser.email);
          if (configJson.horarios) {
            setHorarios(configJson.horarios);
          }
        } else {
          // Fallback para valores iniciais
          setEmailNegocio(currentUser.email);
        }
      } catch (err) {
        console.error('Erro ao ler configurações:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, [currentUser.empresa_id]);

  const handleSave = async () => {
    if (!nomeComercial.trim()) {
      Alert.alert('Erro', 'O nome do negócio é obrigatório.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Atualizar a tabela de empresas
      const { error: empresaError } = await supabase
        .from('empresas')
        .update({
          nome_comercial: nomeComercial.trim(),
          nicho: nicho
        })
        .eq('id', currentUser.empresa_id);

      if (empresaError) throw empresaError;

      // 2. Atualizar ou inserir as configurações
      const configValor = {
        nome: nomeComercial.trim(),
        nif: nif.trim(),
        morada: morada.trim(),
        telefone: telefone.trim(),
        email: emailNegocio.trim(),
        horarios: horarios
      };

      // Tentar verificar se já existe a configuração para dar update ou insert
      const { data: existingConfig } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('id', currentUser.empresa_id)
        .single();

      let configError;
      if (existingConfig) {
        const { error } = await supabase
          .from('configuracoes')
          .update({
            valor: JSON.stringify(configValor)
          })
          .eq('id', currentUser.empresa_id);
        configError = error;
      } else {
        const { error } = await supabase
          .from('configuracoes')
          .insert({
            id: currentUser.empresa_id,
            valor: JSON.stringify(configValor)
          });
        configError = error;
      }

      if (configError) throw configError;

      Alert.alert('Sucesso', 'Definições do negócio gravadas com sucesso!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro ao gravar', err.message || 'Ocorreu um erro ao gravar as definições.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDia = (dia: string) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        aberto: !prev[dia].aberto
      }
    }));
  };

  const handleChangeHora = (dia: string, tipo: 'inicio' | 'fim', valor: string) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [tipo]: valor
      }
    }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Atenção',
      'Esta ação irá eliminar permanentemente a sua conta de negócio e todos os dados associados. Pretende continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => Alert.alert('Aviso', 'Por motivos de segurança, a exclusão automática de conta deve ser solicitada ao suporte técnico.') 
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.pageTitle}>Definições</Text>
            <Text style={styles.pageSubtitle}>Gira as configurações do seu negócio e preferências.</Text>
          </View>

          {/* Card de Subscrição/Período de Teste */}
          {statusSubscricao === 'teste' && (
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Sparkle size={20} color={COLORS.primary} weight="fill" />
                <Text style={styles.subscriptionTitle}>Período de Teste Ativo</Text>
              </View>
              <Text style={styles.subscriptionText}>
                A sua conta encontra-se no período de avaliação de 14 dias. Restam-lhe{' '}
                <Text style={styles.daysHighlight}>{calcularDiasTesteRestantes()} dias</Text> para explorar
                todas as ferramentas de gestão. Faça o upgrade agora para garantir acesso ilimitado.
              </Text>
              <TouchableOpacity 
                style={styles.upgradeBtn}
                onPress={() => setShowUpgradeModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.upgradeBtnText}>EFETUAR UPGRADE DA CONTA</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Secção: Perfil do Negócio */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Storefront size={20} color={COLORS.primary} weight="bold" />
              <Text style={styles.cardTitle}>Perfil do Negócio</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome da Empresa</Text>
              <TextInput
                style={styles.input}
                value={nomeComercial}
                onChangeText={setNomeComercial}
                placeholder="Ex: Studio Alvorada"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>NIF / Contribuinte</Text>
                <TextInput
                  style={styles.input}
                  value={nif}
                  onChangeText={setNif}
                  placeholder="NIF da empresa"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Telefone de Contacto</Text>
                <TextInput
                  style={styles.input}
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="Telefone"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Morada Principal</Text>
              <TextInput
                style={styles.input}
                value={morada}
                onChangeText={setMorada}
                placeholder="Morada da empresa"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Secção: Nicho de Atuação (Bento Grid) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Gear size={20} color={COLORS.primary} weight="bold" />
              <Text style={styles.cardTitle}>Nicho de Atuação</Text>
            </View>

            <View style={styles.bentoGrid}>
              {[
                { id: 'barbearia', label: 'Barbearia', icon: Scissors },
                { id: 'clinica', label: 'Clínica', icon: FirstAidKit },
                { id: 'tattoo', label: 'Tatuagens', icon: Pen },
                { id: 'estetica', label: 'Estética', icon: FlowerLotus },
                { id: 'pilates', label: 'Pilates', icon: Barbell },
                { id: 'outros', label: 'Outro', icon: DotsThree }
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = nicho === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.bentoButton,
                      isSelected && styles.bentoButtonActive
                    ]}
                    onPress={() => setNicho(item.id)}
                    activeOpacity={0.8}
                  >
                    <IconComponent 
                      size={24} 
                      color={isSelected ? COLORS.primary : COLORS.textSecondary} 
                      weight={isSelected ? 'fill' : 'regular'} 
                    />
                    <Text style={[
                      styles.bentoText,
                      isSelected && styles.bentoTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Secção: Horário de Funcionamento */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={20} color={COLORS.primary} weight="bold" />
              <Text style={styles.cardTitle}>Horário de Funcionamento</Text>
            </View>

            <View style={styles.horariosList}>
              {Object.keys(horarios).map((dia) => {
                const info = DIAS_TRADUCAO[dia];
                const hor = horarios[dia];
                return (
                  <View key={dia} style={[styles.horarioRow, !hor.aberto && styles.horarioRowClosed]}>
                    <View style={styles.horarioLeft}>
                      <View style={[styles.diaBadge, hor.aberto ? styles.diaBadgeOpen : styles.diaBadgeClosed]}>
                        <Text style={[styles.diaBadgeText, hor.aberto ? styles.diaBadgeTextOpen : styles.diaBadgeTextClosed]}>
                          {info.abrev}
                        </Text>
                      </View>
                      <Text style={[styles.diaNome, !hor.aberto && styles.diaNomeClosed]}>{info.nome}</Text>
                    </View>

                    <View style={styles.horarioRight}>
                      {hor.aberto ? (
                        <View style={styles.horasInputs}>
                          <TextInput
                            style={styles.horaInput}
                            value={hor.inicio}
                            onChangeText={(val) => handleChangeHora(dia, 'inicio', val)}
                            maxLength={5}
                            keyboardType="numbers-and-punctuation"
                          />
                          <Text style={styles.hSep}>—</Text>
                          <TextInput
                            style={styles.horaInput}
                            value={hor.fim}
                            onChangeText={(val) => handleChangeHora(dia, 'fim', val)}
                            maxLength={5}
                            keyboardType="numbers-and-punctuation"
                          />
                        </View>
                      ) : (
                        <Text style={styles.closedText}>Encerrado</Text>
                      )}
                      
                      <Switch
                        value={hor.aberto}
                        onValueChange={() => handleToggleDia(dia)}
                        trackColor={{ false: '#d1d5db', true: '#a3a3a3' }}
                        thumbColor={hor.aberto ? COLORS.primary : '#f4f4f5'}
                        style={styles.switch}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Secção: Preferências do App */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Gear size={20} color={COLORS.primary} weight="bold" />
              <Text style={styles.cardTitle}>Preferências</Text>
            </View>

            {/* Toggle Escuro */}
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.prefTitle}>Modo Escuro</Text>
                <Text style={styles.prefSubtitle}>Interface otimizada para pouca luz</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d1d5db', true: '#a3a3a3' }}
                thumbColor={darkMode ? COLORS.primary : '#f4f4f5'}
              />
            </View>

            {/* Link para Vouchers */}
            <TouchableOpacity 
              style={styles.preferenceLink} 
              onPress={() => navigation.navigate('Vouchers')}
              activeOpacity={0.7}
            >
              <View style={styles.preferenceLeftRow}>
                <Ticket size={22} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.prefTitle}>Vouchers e Fidelização</Text>
                  <Text style={styles.prefSubtitle}>Configurar descontos e ofertas</Text>
                </View>
              </View>
              <CaretRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <Trash size={18} color={COLORS.status.cancelado.text} style={{ marginRight: 8 }} />
              <Text style={styles.deleteButtonText}>Eliminar Conta de Negócio</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Botão Flutuante para Gravar */}
        <TouchableOpacity
          style={[styles.floatingSaveButton, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.9}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <>
              <FloppyDisk size={20} color={COLORS.surface} weight="bold" />
              <Text style={styles.saveBtnText}>Gravar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
        {/* Modal de Upgrade de Conta */}
        {showUpgradeModal && (
          <View style={styles.customModalOverlay}>
            <TouchableOpacity 
              style={styles.customModalCloseArea} 
              activeOpacity={1} 
              onPress={() => setShowUpgradeModal(false)}
            />
            <View style={styles.upgradeModalContent}>
              <View style={styles.upgradeHeader}>
                <Crown size={32} color="#b45309" weight="fill" />
                <Text style={styles.upgradeTitle}>Upgrade para Premium</Text>
                <Text style={styles.upgradeSubTitle}>Escolha o plano que melhor se adapta ao seu negócio e garanta acesso ilimitado.</Text>
              </View>

              <TouchableOpacity 
                style={styles.planCard}
                onPress={() => handleUpgradeEmpresa('Mensal')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Plano Mensal</Text>
                  <Text style={styles.planPrice}>29.90€<Text style={styles.planUnit}> / mês</Text></Text>
                  <Text style={styles.planDesc}>Faturação mensal recorrente. Cancele quando quiser.</Text>
                </View>
                <CaretRight size={20} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.planCard, styles.planCardRecommended]}
                onPress={() => handleUpgradeEmpresa('Anual')}
                activeOpacity={0.8}
              >
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>MELHOR PREÇO</Text>
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Plano Anual</Text>
                  <Text style={styles.planPrice}>249.00€<Text style={styles.planUnit}> / ano</Text></Text>
                  <Text style={styles.planDesc}>Equivale a ~20.75€/mês. Poupe mais de 100€ por ano!</Text>
                </View>
                <CaretRight size={20} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setShowUpgradeModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100
  },
  headerSection: {
    marginBottom: 24,
    marginTop: 8
  },
  pageTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  pageSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: 12
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginLeft: 10
  },
  formGroup: {
    marginBottom: 14
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textPrimary
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  bentoButton: {
    width: '48%',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center'
  },
  bentoButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderColor: COLORS.primary,
    borderWidth: 1.5
  },
  bentoText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8
  },
  bentoTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700'
  },
  horariosList: {
    marginTop: 4
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)'
  },
  horarioRowClosed: {
    opacity: 0.7
  },
  horarioLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  diaBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  diaBadgeOpen: {
    backgroundColor: 'rgba(0,0,0,0.04)'
  },
  diaBadgeClosed: {
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  diaBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 11
  },
  diaBadgeTextOpen: {
    color: COLORS.textPrimary
  },
  diaBadgeTextClosed: {
    color: COLORS.textSecondary
  },
  diaNome: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 14,
    color: COLORS.textPrimary
  },
  diaNomeClosed: {
    color: COLORS.textSecondary
  },
  horarioRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  horasInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  horaInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    color: COLORS.textPrimary,
    width: 48,
    backgroundColor: '#ffffff'
  },
  hSep: {
    marginHorizontal: 4,
    color: COLORS.textSecondary,
    fontSize: 12
  },
  closedText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 12,
    color: COLORS.status.cancelado.text,
    marginRight: 16
  },
  switch: {
    transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : []
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)'
  },
  preferenceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14
  },
  preferenceLeft: {
    flex: 1,
    marginRight: 8
  },
  preferenceLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  prefTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 14,
    color: COLORS.textPrimary
  },
  prefSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  dangerZone: {
    marginTop: 8,
    marginBottom: 16
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.status.cancelado.background,
    backgroundColor: 'rgba(186, 26, 26, 0.02)',
    paddingVertical: 14,
    borderRadius: 12
  },
  deleteButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.status.cancelado.text
  },
  floatingSaveButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5
  },
  saveBtnDisabled: {
    backgroundColor: '#747878'
  },
  saveBtnText: {
    color: COLORS.surface,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 15,
    marginLeft: 8
  },
  subscriptionCard: {
    backgroundColor: '#fdf4f5',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f9d5d8',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  subscriptionText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  daysHighlight: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  upgradeBtnText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  customModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  customModalCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  upgradeModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 22,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    marginTop: 10,
    textAlign: 'center',
  },
  upgradeSubTitle: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  planCard: {
    width: '100%',
    backgroundColor: COLORS.inputBackground + '40',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planCardRecommended: {
    borderColor: '#f9d5d8',
    backgroundColor: '#fdf4f5',
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#b45309',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 8,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
  },
  planInfo: {
    flex: 1,
    marginRight: 12,
  },
  planName: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
  },
  planPrice: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  planUnit: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
  },
  planDesc: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  }
});
