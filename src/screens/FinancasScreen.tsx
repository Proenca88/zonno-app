import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Agendamento, Cliente, Servico, Usuario, Empresa } from '../types';
import { TrendUp, Wallet, ArrowUpRight, Plus, Sparkle, Scissors, PaintBrush, Stethoscope } from 'phosphor-react-native';

interface FinancasScreenProps {
  currentUser: Usuario;
  empresa: Empresa;
  navigation?: any;
}

export function FinancasScreen({ currentUser, empresa, navigation }: FinancasScreenProps) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [agResult, clResult, svResult] = await Promise.all([
        supabase.from('agendamentos').select('*').eq('empresa_id', currentUser.empresa_id),
        supabase.from('clientes').select('*').eq('empresa_id', currentUser.empresa_id),
        supabase.from('servicos').select('*').eq('empresa_id', currentUser.empresa_id),
      ]);

      if (agResult.data) setAgendamentos(agResult.data as Agendamento[]);
      if (clResult.data) setClientes(clResult.data as Cliente[]);
      if (svResult.data) setServicos(svResult.data as Servico[]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Cálculos financeiros
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // Filtrar concluídos/confirmados
  const agendamentosValidos = agendamentos.filter(
    (ag) => ag.status === 'concluido' || ag.status === 'confirmado'
  );

  const faturadoHoje = agendamentosValidos
    .filter((ag) => {
      const d = new Date(ag.data);
      return d.getDate() === hoje.getDate() &&
             d.getMonth() === mesAtual &&
             d.getFullYear() === anoAtual;
    })
    .reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0);

  const faturadoMes = agendamentosValidos
    .filter((ag) => {
      const d = new Date(ag.data);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    })
    .reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0);

  // Transações recentes (agendamentos concluídos ou confirmados ordenados por data decrescente)
  const transacoesRecentes = agendamentosValidos
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  const formatarData = (dataStr: string) => {
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) + ', ' +
           d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>Zonno</Text>
          <Text style={styles.welcomeText}>Faturação & Métricas</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} activeOpacity={0.7}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Título */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Finanças</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.container}>
            {/* Card Principal: Faturação Mês */}
            <View style={styles.mainCard}>
              <View style={styles.mainCardHeader}>
                <Text style={styles.cardPeriodLabel}>FATURAÇÃO TOTAL (MÊS)</Text>
                <Wallet size={20} color={COLORS.primary} style={{ opacity: 0.6 }} />
              </View>
              <Text style={styles.mainValueText}>{faturadoMes.toFixed(2)} €</Text>
              <View style={styles.trendContainer}>
                <TrendUp size={16} color="#15803d" />
                <Text style={styles.trendText}>+12.4% vs mês anterior</Text>
              </View>

              <View style={styles.subGrid}>
                <View style={styles.subCard}>
                  <Text style={styles.subLabel}>Hoje</Text>
                  <Text style={styles.subValue}>{faturadoHoje.toFixed(2)} €</Text>
                </View>
                <View style={styles.subCard}>
                  <Text style={styles.subLabel}>Previsão Mês</Text>
                  <Text style={styles.subValue}>{(faturadoMes * 1.15).toFixed(2)} €</Text>
                </View>
              </View>
            </View>

            {/* Repartição de Métodos de Pagamento (Visual / Demonstrativo) */}
            <View style={styles.paymentCard}>
              <Text style={styles.sectionTitle}>Métodos de Pagamento</Text>

              <View style={styles.paymentItem}>
                <View style={styles.paymentItemHeader}>
                  <View style={styles.paymentLabelContainer}>
                    <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                    <Text style={styles.paymentName}>MB Way</Text>
                  </View>
                  <Text style={styles.paymentValue}>{(faturadoMes * 0.52).toFixed(2)} €</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: '52%', backgroundColor: COLORS.primary }]} />
                </View>
              </View>

              <View style={styles.paymentItem}>
                <View style={styles.paymentItemHeader}>
                  <View style={styles.paymentLabelContainer}>
                    <View style={[styles.dot, { backgroundColor: COLORS.textSecondary }]} />
                    <Text style={styles.paymentName}>Multibanco</Text>
                  </View>
                  <Text style={styles.paymentValue}>{(faturadoMes * 0.34).toFixed(2)} €</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: '34%', backgroundColor: COLORS.textSecondary }]} />
                </View>
              </View>

              <View style={styles.paymentItem}>
                <View style={styles.paymentItemHeader}>
                  <View style={styles.paymentLabelContainer}>
                    <View style={[styles.dot, { backgroundColor: '#a1a1aa' }]} />
                    <Text style={styles.paymentName}>Dinheiro</Text>
                  </View>
                  <Text style={styles.paymentValue}>{(faturadoMes * 0.14).toFixed(2)} €</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: '14%', backgroundColor: '#a1a1aa' }]} />
                </View>
              </View>
            </View>

            {/* Transações Recentes */}
            <View style={styles.transactionsSection}>
              <Text style={styles.sectionTitle}>Transações Recentes</Text>

              {transacoesRecentes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Nenhuma transação concluída.</Text>
                </View>
              ) : (
                <View style={styles.transactionsList}>
                  {transacoesRecentes.map((item) => {
                    const cliente = clientes.find((c) => c.id === item.cliente_id);
                    const servico = servicos.find((s) => s.id === item.servico_id);

                    const getNichoIcon = () => {
                      const nicho = empresa?.nicho;
                      if (nicho === 'barbearia' || nicho === 'cabeleireiro') {
                        return Scissors;
                      } else if (nicho === 'tattoo') {
                        return PaintBrush;
                      } else if (nicho === 'clinica') {
                        return Stethoscope;
                      }
                      return Sparkle;
                    };

                    const IconComponent = getNichoIcon();

                    return (
                      <View key={item.id} style={styles.transactionCard}>
                        <View style={styles.transactionLeft}>
                          <View style={styles.iconContainer}>
                            <IconComponent size={18} color={COLORS.primary} weight="bold" />
                          </View>
                          <View style={styles.transactionInfo}>
                            <Text style={styles.transactionName}>{servico?.nome || 'Serviço'}</Text>
                            <Text style={styles.transactionMeta}>
                              Cliente: {cliente?.nome || 'Desconhecido'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.transactionRight}>
                          <Text style={styles.transactionAmount}>
                            + {Number(item.valor_pago || 0).toFixed(2)} €
                          </Text>
                          <Text style={styles.transactionDate}>{formatarData(item.data)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB para Registar Venda */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation?.navigate('NewAppointment')}
          activeOpacity={0.9}
        >
          <Plus size={20} color={COLORS.surface} weight="bold" style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>Registar Venda</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  welcomeText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  refreshButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 13,
    color: COLORS.primary,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 32,
    color: COLORS.primary,
  },
  container: {
    paddingHorizontal: 20,
    gap: 24,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPeriodLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  mainValueText: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 36,
    color: COLORS.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  trendText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 12,
    color: '#15803d',
  },
  subGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  subCard: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    padding: 12,
  },
  subLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  subValue: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  paymentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 20,
  },
  paymentItem: {
    marginBottom: 16,
  },
  paymentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentName: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  paymentValue: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  progressBg: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  transactionsSection: {
    marginTop: 4,
  },
  transactionsList: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  transactionMeta: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  transactionAmount: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  transactionDate: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.surface,
  },
});

