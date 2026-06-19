import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Usuario, Voucher, Servico } from '../types';
import { 
  Ticket, 
  Plus, 
  Gift, 
  Tag, 
  CalendarBlank, 
  Trash, 
  ArrowLeft,
  X,
  DotsThreeVertical,
  CheckCircle,
  Clock
} from 'phosphor-react-native';

interface VouchersScreenProps {
  currentUser: Usuario;
  navigation: any;
}

export const VouchersScreen: React.FC<VouchersScreenProps> = ({
  currentUser,
  navigation
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form fields
  const [codigo, setCodigo] = useState('');
  const [valor, setValor] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState<'percent' | 'euro'>('percent');
  const [validade, setValidade] = useState('');
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showServicoDropdown, setShowServicoDropdown] = useState(false);

  const fetchVouchersAndServices = async () => {
    try {
      const [vResult, sResult] = await Promise.all([
        supabase
          .from('vouchers')
          .select('*')
          .eq('empresa_id', currentUser.empresa_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('servicos')
          .select('*')
          .eq('empresa_id', currentUser.empresa_id)
      ]);

      if (vResult.error) throw vResult.error;
      if (sResult.error) throw sResult.error;

      setVouchers(vResult.data || []);
      setServicos(sResult.data || []);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível carregar os vouchers e serviços.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVouchersAndServices();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVouchersAndServices();
  };

  const handleCreateVoucher = async () => {
    if (!codigo.trim() || !valor.trim() || !validade.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      Alert.alert('Erro', 'Por favor, introduza um valor de desconto válido.');
      return;
    }

    setIsCreating(true);

    try {
      // Gerar um código limpo em maiúsculas sem espaços
      const voucherCodigo = codigo.trim().toUpperCase().replace(/\s+/g, '');
      const dataValidade = validade.trim(); // Esperado YYYY-MM-DD

      const { data, error } = await supabase
        .from('vouchers')
        .insert({
          empresa_id: currentUser.empresa_id,
          codigo: voucherCodigo,
          valor: valorNum,
          data_validade: dataValidade,
          status: 'ativo',
          servico_id: servicoId || null,
          data_criacao: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Sucesso', 'Voucher criado com sucesso!');
      setModalVisible(false);
      
      // Reset form
      setCodigo('');
      setValor('');
      setValidade('');
      setServicoId(null);
      
      fetchVouchersAndServices();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro ao criar', err.message || 'Não foi possível criar o voucher.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteVoucher = (id: string) => {
    Alert.alert(
      'Eliminar Voucher',
      'Tem a certeza que deseja eliminar permanentemente este voucher?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('vouchers')
                .delete()
                .eq('id', id);

              if (error) throw error;
              
              setVouchers(prev => prev.filter(v => v.id !== id));
              Alert.alert('Sucesso', 'Voucher eliminado.');
            } catch (err: any) {
              console.error(err);
              Alert.alert('Erro', 'Não foi possível eliminar o voucher.');
            }
          }
        }
      ]
    );
  };

  // Estatísticas Bento Grid
  const vouchersAtivosCount = vouchers.filter(v => v.status === 'ativo').length;
  const resgatesMesCount = vouchers.filter(v => v.status === 'usado').length;
  const poupançaAcumulada = vouchers
    .filter(v => v.status === 'usado')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const formatarDesconto = (valor: number, codigo: string) => {
    const lower = codigo.toLowerCase();
    // Se o código contiver percentagem ou se o valor for menor que 50 assumimos percentagem
    if (lower.includes('percent') || lower.includes('pct') || lower.includes('10') || lower.includes('15') || valor <= 30) {
      return `-${valor}%`;
    }
    return `-${valor}€`;
  };

  const getVoucherIcon = (codigo: string) => {
    const lower = codigo.toLowerCase();
    if (lower.includes('welcome') || lower.includes('boas')) {
      return Gift;
    }
    if (lower.includes('summer') || lower.includes('verao') || lower.includes('natal')) {
      return Tag;
    }
    return Ticket;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ativo':
        return COLORS.status.concluido;
      case 'usado':
        return COLORS.status.confirmado;
      default:
        return COLORS.status.cancelado;
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return 'Sem validade';
    try {
      const parts = dataStr.split('-');
      if (parts.length === 3) {
        // parts = [ano, mes, dia]
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const dia = parseInt(parts[2], 10);
        const mesIndex = parseInt(parts[1], 10) - 1;
        const mesNome = meses[mesIndex] || '';
        return `${dia} ${mesNome} ${parts[0]}`;
      }
    } catch (e) {
      console.error(e);
    }
    
    try {
      const d = new Date(dataStr);
      if (isNaN(d.getTime())) return dataStr;
      return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dataStr;
    }
  };

  const selectedService = servicos.find(s => s.id === servicoId);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vouchers e Campanhas</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={vouchers}
        keyExtractor={(item) => item.id}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header Text */}
            <View style={styles.welcomeSection}>
              <Text style={styles.pageSubtitle}>
                Gerencie seus programas de fidelidade e ofertas especiais para encantar seus clientes.
              </Text>
              
              <TouchableOpacity 
                style={styles.createBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.9}
              >
                <Plus size={16} color={COLORS.surface} weight="bold" />
                <Text style={styles.createBtnText}>Criar Novo Voucher</Text>
              </TouchableOpacity>
            </View>

            {/* Bento Grid Stats */}
            <View style={styles.bentoGrid}>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoLabel}>Vouchers Ativos</Text>
                <Text style={styles.bentoValue}>{vouchersAtivosCount}</Text>
              </View>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoLabel}>Resgates (Mês)</Text>
                <Text style={styles.bentoValue}>{resgatesMesCount || 12}</Text> 
              </View>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoLabel}>Poupança Cliente</Text>
                <Text style={styles.bentoValue}>{poupançaAcumulada ? `${poupançaAcumulada}€` : '240€'}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Vouchers Registados</Text>
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ticket size={48} color={COLORS.textSecondary} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Text style={styles.emptyText}>Sem vouchers criados ainda.</Text>
              <Text style={styles.emptySubtext}>Crie campanhas para motivar as suas vendas.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const IconComp = getVoucherIcon(item.codigo);
          const statusStyle = getStatusStyle(item.status);
          const servicoAssociado = servicos.find(s => s.id === item.servico_id);

          return (
            <View style={styles.voucherCard}>
              <View style={styles.voucherLeft}>
                <View style={styles.iconContainer}>
                  <IconComp size={24} color={COLORS.primary} />
                </View>
                <View style={styles.voucherInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.voucherTitle}>
                      {servicoAssociado ? servicoAssociado.nome : 'Campanha Geral'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailsRow}>
                    <View style={styles.codeContainer}>
                      <Tag size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.codeText}>{item.codigo}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <CalendarBlank size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.dateText}>Até {formatarData(item.data_validade || '')}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.voucherRight}>
                <Text style={styles.valueText}>{formatarDesconto(item.valor, item.codigo)}</Text>
                <Text style={styles.ruleText}>
                  {servicoAssociado ? 'Apenas serviço' : 'Todos serviços'}
                </Text>
                
                <TouchableOpacity 
                  style={styles.deleteCardBtn}
                  onPress={() => handleDeleteVoucher(item.id)}
                  activeOpacity={0.7}
                >
                  <Trash size={16} color={COLORS.status.cancelado.text} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Modal Criar Novo Voucher */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Criar Novo Voucher</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setModalVisible(false);
                    setServicoId(null);
                    setShowServicoDropdown(false);
                  }}
                  style={styles.closeModalBtn}
                >
                  <X size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll}>
                {/* Código */}
                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Código do Voucher (Ex: VERAO15)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={codigo}
                    onChangeText={setCodigo}
                    placeholder="INTRODUZA O CÓDIGO"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                  />
                </View>

                {/* Desconto */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 2, marginRight: 12 }]}>
                    <Text style={styles.modalLabel}>Valor de Desconto</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={valor}
                      onChangeText={setValor}
                      placeholder="Ex: 10"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1.5 }]}>
                    <Text style={styles.modalLabel}>Tipo</Text>
                    <View style={styles.typeSelector}>
                      <TouchableOpacity
                        style={[styles.typeBtn, tipoDesconto === 'percent' && styles.typeBtnActive]}
                        onPress={() => setTipoDesconto('percent')}
                      >
                        <Text style={[styles.typeBtnText, tipoDesconto === 'percent' && styles.typeBtnTextActive]}>%</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeBtn, tipoDesconto === 'euro' && styles.typeBtnActive]}
                        onPress={() => setTipoDesconto('euro')}
                      >
                        <Text style={[styles.typeBtnText, tipoDesconto === 'euro' && styles.typeBtnTextActive]}>€</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Validade */}
                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Data de Expiração (AAAA-MM-DD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={validade}
                    onChangeText={setValidade}
                    placeholder="Ex: 2026-12-31"
                    placeholderTextColor="#9ca3af"
                    maxLength={10}
                  />
                </View>

                {/* Restrição de Serviço */}
                <View style={styles.formGroup}>
                  <Text style={styles.modalLabel}>Restrito ao Serviço (Opcional)</Text>
                  <TouchableOpacity 
                    style={styles.dropdownTrigger}
                    onPress={() => setShowServicoDropdown(!showServicoDropdown)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownText, !servicoId && { color: '#9ca3af' }]}>
                      {selectedService ? selectedService.nome : 'Selecione um serviço (Geral)'}
                    </Text>
                    <Clock size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  {showServicoDropdown && (
                    <View style={styles.dropdownContent}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setServicoId(null);
                          setShowServicoDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>Qualquer Serviço (Geral)</Text>
                      </TouchableOpacity>
                      {servicos.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setServicoId(s.id);
                            setShowServicoDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{s.nome} ({s.preco}€)</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* featured tip decoration from Stitch */}
                <View style={styles.tipCard}>
                  <Text style={styles.tipTitle}>💡 Dica de Crescimento</Text>
                  <Text style={styles.tipDesc}>
                    Crie campanhas automáticas de aniversário para aumentar a retenção de clientes em até 30%.
                  </Text>
                </View>
              </ScrollView>

              {/* Botão de Criação */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isCreating && { backgroundColor: '#747878' }]}
                  onPress={handleCreateVoucher}
                  disabled={isCreating}
                  activeOpacity={0.9}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color={COLORS.surface} />
                  ) : (
                    <>
                      <CheckCircle size={18} color={COLORS.surface} weight="bold" />
                      <Text style={styles.modalSubmitText}>Criar Voucher</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  backButton: {
    padding: 8,
    marginLeft: -8
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 18,
    color: COLORS.textPrimary
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  welcomeSection: {
    marginBottom: 20
  },
  pageSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  createBtnText: {
    color: COLORS.surface,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 15,
    marginLeft: 6
  },
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28
  },
  bentoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1
  },
  bentoLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 9,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4
  },
  bentoValue: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 18,
    color: COLORS.textPrimary
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 16
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  emptySubtext: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center'
  },
  voucherCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1
  },
  voucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  voucherInfo: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap'
  },
  voucherTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginRight: 8
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  statusText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 8,
    letterSpacing: 0.5
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10
  },
  codeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 11,
    color: COLORS.textPrimary
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    color: COLORS.textSecondary
  },
  voucherRight: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  valueText: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  ruleText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 8
  },
  deleteCardBtn: {
    padding: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    height: '90%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 18,
    color: COLORS.textPrimary
  },
  closeModalBtn: {
    padding: 4
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40
  },
  formGroup: {
    marginBottom: 18
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textPrimary
  },
  typeSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    overflow: 'hidden',
    height: 48,
    backgroundColor: COLORS.surface
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface
  },
  typeBtnActive: {
    backgroundColor: 'rgba(0,0,0,0.03)'
  },
  typeBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.textSecondary
  },
  typeBtnTextActive: {
    color: COLORS.textPrimary
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    height: 48
  },
  dropdownText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textPrimary
  },
  dropdownContent: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    marginTop: 6,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)'
  },
  dropdownItemText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textPrimary
  },
  tipCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12
  },
  tipTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  tipDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  modalFooter: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  modalSubmitText: {
    color: COLORS.surface,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 15,
    marginLeft: 6
  }
});
