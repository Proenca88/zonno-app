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
import { Agendamento, Cliente, Servico, Usuario } from '../types';
import { Calendar, Users, SignOut, Plus, Phone, Chat, Clock, TrendUp } from 'phosphor-react-native';

interface DashboardScreenProps {
  currentUser: Usuario;
  onNavigateToClientes: () => void;
  onLogoutClick: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentUser,
  onNavigateToClientes,
  onLogoutClick,
}) => {
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

  // Filtrar dados para hoje
  const hoje = new Date();
  const agendamentosHoje = agendamentos.filter(ag => {
    const d = new Date(ag.data);
    return d.getDate() === hoje.getDate() &&
           d.getMonth() === hoje.getMonth() &&
           d.getFullYear() === hoje.getFullYear();
  });

  const totalMarcaçõesHoje = agendamentosHoje.length;
  const faturamentoHoje = agendamentosHoje.reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0);

  // Próximo cliente
  const agora = new Date();
  const proximoAgendamento = agendamentos
    .filter(ag => new Date(ag.data) > agora)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];

  const proximoCliente = proximoAgendamento
    ? clientes.find(c => c.id === proximoAgendamento.cliente_id)
    : null;

  const proximoServico = proximoAgendamento
    ? servicos.find(s => s.id === proximoAgendamento.servico_id)
    : null;

  const formatarHora = (dataStr: string) => {
    const d = new Date(dataStr);
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusStyle = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === 'concluido' || lower === 'confirmado') {
      return COLORS.status.concluido;
    } else if (lower === 'pendente') {
      return COLORS.status.pendente;
    } else {
      return COLORS.status.cancelado;
    }
  };

  // Formatar data de cabeçalho
  const dataCabecalho = hoje.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const dataCabecalhoFormatada = dataCabecalho.charAt(0).toUpperCase() + dataCabecalho.slice(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>Zonno</Text>
          <Text style={styles.welcomeText}>Olá, {currentUser.nome.split(' ')[0]}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogoutClick} activeOpacity={0.7}>
          <SignOut size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Título & Data */}
        <View style={styles.titleSection}>
          <Text style={styles.dateLabel}>{dataCabecalhoFormatada}</Text>
          <Text style={styles.pageTitle}>A Sua Agenda</Text>
        </View>

        {/* Bento Layout Cards */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoRow}>
            {/* Card 1: Marcações */}
            <View style={styles.bentoCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#f0f4f8' }]}>
                <Calendar size={20} color={COLORS.textPrimary} />
              </View>
              <View style={styles.bentoCardBottom}>
                <Text style={styles.bentoValue}>{totalMarcaçõesHoje} Marcações</Text>
                <Text style={styles.bentoLabel}>Agendadas para hoje</Text>
              </View>
            </View>

            {/* Card 2: Faturamento */}
            <View style={styles.bentoCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#f0f4f8' }]}>
                <TrendUp size={20} color={COLORS.textPrimary} />
              </View>
              <View style={styles.bentoCardBottom}>
                <Text style={styles.bentoValue}>{faturamentoHoje.toFixed(2)} €</Text>
                <Text style={styles.bentoLabel}>Faturado hoje</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Próximo Cliente */}
          <View style={[styles.bentoCardLarge, { backgroundColor: COLORS.primary }]}>
            <View style={styles.bentoCardLargeHeader}>
              <Text style={styles.nextClientLabel}>PRÓXIMO CLIENTE</Text>
              <Clock size={16} color={COLORS.surface} style={{ opacity: 0.7 }} />
            </View>
            {proximoAgendamento && proximoCliente ? (
              <View>
                <Text style={styles.nextClientName}>{proximoCliente.nome}</Text>
                <Text style={styles.nextClientDesc}>
                  {proximoServico?.nome || 'Serviço'} • {formatarHora(proximoAgendamento.data)}
                </Text>
              </View>
            ) : (
              <Text style={styles.nextClientName}>Sem marcações futuras</Text>
            )}
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Horário do Dia</Text>

          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : agendamentos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Sem agendamentos registados.</Text>
            </View>
          ) : (
            <View style={styles.timelineBody}>
              {/* Linha vertical da timeline */}
              <View style={styles.timelineLine} />

              {/* Ordenar agendamentos do dia por hora */}
              {agendamentos
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                .map((item) => {
                  const cliente = clientes.find((c) => c.id === item.cliente_id);
                  const servico = servicos.find((s) => s.id === item.servico_id);
                  const statusInfo = getStatusStyle(item.status);

                  return (
                    <View key={item.id} style={styles.timelineSlot}>
                      {/* Hora do slot */}
                      <View style={styles.slotHourContainer}>
                        <Text style={styles.slotHour}>{formatarHora(item.data)}</Text>
                      </View>

                      {/* Indicador de nó na linha */}
                      <View style={styles.timelineNode} />

                      {/* Card de Agendamento */}
                      <View style={styles.slotCard}>
                        <View style={styles.slotCardHeader}>
                          <Text style={styles.clientNameText}>{cliente?.nome || 'Cliente Desconhecido'}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusInfo.background }
                            ]}
                          >
                            <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                              {item.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.serviceText}>
                          {servico?.nome || 'Serviço'} • {item.valor_pago ? `${Number(item.valor_pago).toFixed(2)}€` : ''}
                        </Text>

                        {/* Botões de contacto rápido se for confirmado e tiver telemóvel */}
                        {cliente?.telemovel && (
                          <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.7}>
                              <Phone size={16} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.7}>
                              <Chat size={16} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => alert('Nova marcação através do painel principal.')}
        activeOpacity={0.9}
      >
        <Plus size={24} color={COLORS.surface} weight="bold" />
      </TouchableOpacity>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} disabled={true}>
          <Calendar size={22} color={COLORS.primary} weight="fill" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={onNavigateToClientes} activeOpacity={0.7}>
          <Users size={22} color={COLORS.textSecondary} weight="regular" />
          <Text style={styles.tabLabel}>Clientes</Text>
        </TouchableOpacity>
      </View>
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
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  dateLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pageTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 32,
    color: COLORS.primary,
  },
  bentoGrid: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  bentoCardBottom: {
    marginTop: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoValue: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 18,
    color: COLORS.primary,
  },
  bentoLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bentoCardLarge: {
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  bentoCardLargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextClientLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 10,
    color: COLORS.surface,
    opacity: 0.7,
    letterSpacing: 1,
  },
  nextClientName: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 22,
    color: COLORS.surface,
  },
  nextClientDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: 2,
  },
  timelineContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 16,
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
  timelineBody: {
    position: 'relative',
    paddingLeft: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 72,
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  timelineSlot: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  slotHourContainer: {
    width: 52,
    marginRight: 10,
    paddingTop: 14,
    alignItems: 'flex-end',
  },
  slotHour: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    marginTop: 17,
    marginLeft: 4,
    marginRight: 16,
    zIndex: 10,
  },
  slotCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  slotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientNameText: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 16,
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 9,
  },
  serviceText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  actionIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  fab: {
    position: 'absolute',
    bottom: 84,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 76 : 64,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
  },
});

