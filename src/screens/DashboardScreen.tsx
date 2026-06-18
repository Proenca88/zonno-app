import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  Alert,
  Linking,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Agendamento, Cliente, Servico, Usuario } from '../types';
import { Calendar, Users, SignOut, Plus, Phone, Chat, Clock, TrendUp } from 'phosphor-react-native';

interface DashboardScreenProps {
  currentUser: Usuario;
  onNavigateToClientes: () => void;
  onLogoutClick: () => void;
  navigation?: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentUser,
  onNavigateToClientes,
  onLogoutClick,
  navigation,
}) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para navegação de data e hora atual
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [agoraTime, setAgoraTime] = useState<Date>(new Date());

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [currentUser.empresa_id])
  );

  // Timer para atualizar a hora a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setAgoraTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const formatarNumeroWhatsApp = (num: string) => {
    const apenasNumeros = num.replace(/\D/g, '');
    if (apenasNumeros.length === 9) {
      return '351' + apenasNumeros;
    }
    return apenasNumeros;
  };

  const handleLigarCliente = (telemovel: string) => {
    Linking.openURL(`tel:${telemovel}`).catch(() => {
      Alert.alert("Erro", "Não foi possível efetuar a chamada.");
    });
  };

  const handleWhatsAppCliente = (telemovel: string) => {
    const numWhatsApp = formatarNumeroWhatsApp(telemovel);
    Linking.openURL(`https://wa.me/${numWhatsApp}`).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
    });
  };

  const handleAgendamentoClick = (ag: Agendamento) => {
    const cliente = clientes.find(c => c.id === ag.cliente_id);
    const servico = servicos.find(s => s.id === ag.servico_id);
    const nomeCliente = cliente?.nome || 'Cliente Desconhecido';
    const nomeServico = servico?.nome || 'Serviço';
    
    const statusAtual = ag.status.toLowerCase();
    
    const botoes = [
      statusAtual === 'confirmado' ? {
        text: "Colocar Em Espera",
        onPress: () => atualizarEstadoAgendamento(ag.id, 'pendente')
      } : {
        text: "Confirmar Marcação",
        onPress: () => atualizarEstadoAgendamento(ag.id, 'confirmado')
      },
      {
        text: "Concluir Marcação",
        onPress: () => atualizarEstadoAgendamento(ag.id, 'concluido')
      },
      {
        text: "Cancelar Marcação",
        onPress: () => atualizarEstadoAgendamento(ag.id, 'cancelado')
      },
      {
        text: "Eliminar Marcação",
        style: "destructive" as const,
        onPress: () => confirmarEliminarAgendamento(ag.id)
      },
      {
        text: "Cancelar",
        style: "cancel" as const
      }
    ];

    Alert.alert(
      "Gerir Marcação",
      `Marcação de ${nomeCliente}\nServiço: ${nomeServico}\nHora: ${formatarHora(ag.hora)}\nEstado atual: ${ag.status.toUpperCase()}`,
      botoes
    );
  };

  const atualizarEstadoAgendamento = async (id: string, novoStatus: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      
      await fetchData();
      Alert.alert("Sucesso", `Estado da marcação atualizado para ${novoStatus.toUpperCase()}!`);
    } catch (e: any) {
      Alert.alert("Erro", `Não foi possível atualizar o estado: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarEliminarAgendamento = (id: string) => {
    Alert.alert(
      "Eliminar Marcação",
      "Tem a certeza de que pretende eliminar permanentemente esta marcação?",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const { error } = await supabase
                .from('agendamentos')
                .delete()
                .eq('id', id);

              if (error) throw error;
              
              await fetchData();
              Alert.alert("Sucesso", "Marcação eliminada com sucesso!");
            } catch (e: any) {
              Alert.alert("Erro", `Não foi possível eliminar: ${e.message}`);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const navegarHoje = () => {
    setDataSelecionada(new Date());
  };

  const alterarDia = (dias: number) => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + dias);
    setDataSelecionada(novaData);
  };

  const eHoje = (date: Date) => {
    const hoje = new Date();
    return date.getDate() === hoje.getDate() &&
           date.getMonth() === hoje.getMonth() &&
           date.getFullYear() === hoje.getFullYear();
  };

  // Filtrar dados para o dia selecionado
  const agendamentosDia = agendamentos.filter(ag => {
    const d = new Date(ag.data);
    return d.getDate() === dataSelecionada.getDate() &&
           d.getMonth() === dataSelecionada.getMonth() &&
           d.getFullYear() === dataSelecionada.getFullYear();
  });

  const totalMarcaçõesDia = agendamentosDia.length;
  const faturamentoDia = agendamentosDia.reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0);

  // Função para parsear serviços adicionais
  const parseServicosExtra = (extras: any): any[] => {
    if (!extras) return [];
    if (typeof extras === 'string') {
      try {
        return JSON.parse(extras);
      } catch {
        return [];
      }
    }
    if (Array.isArray(extras)) {
      return extras;
    }
    return [];
  };

  // Calcular tempo ocupado real do dia (soma de serviço principal + extras)
  const calcularTempoOcupadoDia = () => {
    let totalMinutos = 0;
    agendamentosDia.forEach(ag => {
      const sPrincipal = servicos.find(s => s.id === ag.servico_id);
      totalMinutos += sPrincipal?.duracao || 30;

      const extras = parseServicosExtra(ag.servicos_extra);
      extras.forEach((ext: any) => {
        totalMinutos += ext.duracao || 0;
      });
    });
    return totalMinutos;
  };

  const minutosOcupados = calcularTempoOcupadoDia();
  const horasOcupadas = minutosOcupados / 60;
  const horasDisponiveis = Math.max(0, 8 - horasOcupadas);

  // Calcular taxa de ocupação real (considerando jornada de 8h = 480 minutos)
  const taxaOcupacao = Math.min(Math.round((minutosOcupados / 480) * 100), 100);

  // Próximo cliente (geral a partir de agora)
  const agora = new Date();
  const proximoAgendamento = agendamentos
    .filter(ag => {
      const dataHora = new Date(`${ag.data}T${ag.hora}`);
      return dataHora > agora;
    })
    .sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.hora}`);
      const dataHoraB = new Date(`${b.data}T${b.hora}`);
      return dataHoraA.getTime() - dataHoraB.getTime();
    })[0];

  const proximoCliente = proximoAgendamento
    ? clientes.find(c => c.id === proximoAgendamento.cliente_id)
    : null;

  const proximoServico = proximoAgendamento
    ? servicos.find(s => s.id === proximoAgendamento.servico_id)
    : null;

  const formatarHora = (horaStr: string) => {
    if (!horaStr) return '00:00';
    const partes = horaStr.split(':');
    if (partes.length >= 2) {
      return `${partes[0]}:${partes[1]}`;
    }
    return horaStr;
  };

  const getStatusStyle = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === 'concluido' || lower === 'confirmado') {
      return COLORS.status.confirmado;
    } else if (lower === 'pendente') {
      return COLORS.status.pendente;
    } else if (lower === 'em espera') {
      return { background: '#f0f4f8', text: '#505f76' }; // Neutro do design
    } else {
      return COLORS.status.cancelado;
    }
  };

  // Formatar data de cabeçalho
  const dataCabecalho = dataSelecionada.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const dataCabecalhoFormatada = dataCabecalho.charAt(0).toUpperCase() + dataCabecalho.slice(1);

  // Lógica para renderizar o marcador de tempo se for hoje
  const renderTimeMarker = (time: Date) => {
    const horaFormatada = time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={styles.markerContainer} key="time_marker">
        <View style={styles.markerLeftSpacer} />
        <View style={styles.markerLine}>
          <View style={styles.markerDot} />
          <View style={styles.markerLineActive} />
          <View style={styles.markerBadge}>
            <Text style={styles.markerBadgeText}>{horaFormatada}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Gerar itens para a timeline, incluindo agendamentos e o marcador de hora se for hoje
  const agendamentosOrdenados = [...agendamentosDia].sort(
    (a, b) => a.hora.localeCompare(b.hora)
  );

  const timelineItems: Array<{ type: 'appointment' | 'time_marker'; data?: Agendamento; time?: Date }> = [];
  
  if (eHoje(dataSelecionada)) {
    let markerInserted = false;
    const agoraMs = agoraTime.getTime();

    for (let i = 0; i < agendamentosOrdenados.length; i++) {
      const ag = agendamentosOrdenados[i];
      const agDate = new Date(`${ag.data}T${ag.hora}`);
      const agTime = agDate.getTime();
      
      if (!markerInserted && agoraMs < agTime) {
        timelineItems.push({ type: 'time_marker', time: agoraTime });
        markerInserted = true;
      }
      
      timelineItems.push({ type: 'appointment', data: ag });
    }
    
    if (!markerInserted) {
      timelineItems.push({ type: 'time_marker', time: agoraTime });
    }
  } else {
    agendamentosOrdenados.forEach(ag => {
      timelineItems.push({ type: 'appointment', data: ag });
    });
  }

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
        {/* Título & Data com Barra de Navegação */}
        <View style={styles.titleSectionContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.dateLabel}>{dataCabecalhoFormatada}</Text>
            <Text style={styles.pageTitle}>A Sua Agenda</Text>
          </View>
          
          <View style={styles.dateNavContainer}>
            <TouchableOpacity style={styles.todayButton} onPress={navegarHoje} activeOpacity={0.7}>
              <Calendar size={16} color={COLORS.textPrimary} />
              <Text style={styles.todayButtonText}>Hoje</Text>
            </TouchableOpacity>
            
            <View style={styles.arrowNavContainer}>
              <TouchableOpacity style={styles.arrowButton} onPress={() => alterarDia(-1)} activeOpacity={0.7}>
                <Text style={styles.arrowButtonText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowButton} onPress={() => alterarDia(1)} activeOpacity={0.7}>
                <Text style={styles.arrowButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bento Layout Cards (Empilhados Verticalmente) */}
        <View style={styles.bentoGrid}>
          {/* Card 1: Resumo / Ocupação */}
          <View style={styles.bentoCardVertical}>
            <View style={styles.bentoCardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.inputBackground }]}>
                <Calendar size={20} color={COLORS.primary} weight="bold" />
              </View>
              <View style={styles.ocupacaoBadge}>
                <Text style={styles.ocupacaoBadgeText}>{taxaOcupacao}% OCUPADO</Text>
              </View>
            </View>
            <View style={styles.bentoCardContent}>
              <Text style={styles.bentoValueText}>{totalMarcaçõesDia} Marcações</Text>
              <Text style={styles.bentoLabelText}>
                {horasDisponiveis % 1 === 0 ? horasDisponiveis.toFixed(0) : horasDisponiveis.toFixed(1)} horas restantes disponíveis
              </Text>
            </View>
          </View>

          {/* Card 2: Faturamento */}
          <View style={styles.bentoCardVertical}>
            <View style={styles.bentoCardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.inputBackground }]}>
                <TrendUp size={20} color={COLORS.primary} weight="bold" />
              </View>
            </View>
            <View style={styles.bentoCardContent}>
              <Text style={styles.bentoValueText}>{faturamentoDia.toFixed(2)} €</Text>
              <Text style={styles.bentoLabelText}>Volume estimado para o dia</Text>
            </View>
          </View>

          {/* Card 3: Próximo Cliente (Preto Sólido Clicável) */}
          <TouchableOpacity 
            style={[styles.bentoCardVertical, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
            onPress={() => proximoCliente && navigation?.navigate('PerfilCliente', { clienteId: proximoCliente.id })}
            disabled={!proximoCliente}
            activeOpacity={0.9}
          >
            <View style={styles.bentoCardHeader}>
              <Text style={styles.proximoClienteLabel}>PRÓXIMO CLIENTE</Text>
            </View>
            {proximoAgendamento && proximoCliente ? (
              <View style={styles.proximoClienteBody}>
                <View style={styles.proximoClienteInfo}>
                  <Text style={styles.proximoClienteName}>{proximoCliente.nome}</Text>
                  <Text style={styles.proximoClienteService}>
                    {proximoServico?.nome || 'Serviço'} • {formatarHora(proximoAgendamento.hora)}
                  </Text>
                </View>
                <View style={styles.proximoClienteArrowContainer}>
                  <Text style={styles.proximoClienteArrow}>→</Text>
                </View>
              </View>
            ) : (
              <View style={styles.proximoClienteBody}>
                <Text style={styles.proximoClienteName}>Sem marcações futuras</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Timeline Section */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Horário do Dia</Text>

          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : agendamentosDia.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Sem agendamentos registados para este dia.</Text>
            </View>
          ) : (
            <View style={styles.timelineBody}>
              {/* Linha vertical da timeline */}
              <View style={styles.timelineLine} />

              {/* Mapear itens da timeline (agendamentos e marcador de hora atual se for hoje) */}
              {timelineItems.map((item, index) => {
                if (item.type === 'time_marker' && item.time) {
                  return renderTimeMarker(item.time);
                }

                const ag = item.data!;
                const cliente = clientes.find((c) => c.id === ag.cliente_id);
                const servico = servicos.find((s) => s.id === ag.servico_id);
                const statusInfo = getStatusStyle(ag.status);

                return (
                  <View key={ag.id || index} style={styles.timelineSlot}>
                    {/* Hora do slot */}
                    <View style={styles.slotHourContainer}>
                      <Text style={styles.slotHour}>{formatarHora(ag.hora)}</Text>
                    </View>

                    {/* Indicador de nó na linha */}
                    <View style={styles.timelineNode} />

                    {/* Card de Agendamento */}
                    <TouchableOpacity 
                      style={styles.slotCard}
                      onPress={() => handleAgendamentoClick(ag)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.slotCardHeader}>
                        <Text style={styles.clientNameText}>{cliente?.nome || 'Cliente Desconhecido'}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: statusInfo.background }
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                            {ag.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {(() => {
                        const extras = parseServicosExtra(ag.servicos_extra);
                        const nomesServicos = [
                          servico?.nome || 'Serviço',
                          ...extras.map((ext: any) => ext.nome || 'Serviço Extra')
                        ].join(' + ');

                        const duracaoTotal = (servico?.duracao || 30) + 
                          extras.reduce((sum: number, ext: any) => sum + (ext.duracao || 0), 0);

                        return (
                          <Text style={styles.serviceText}>
                            {nomesServicos} • {duracaoTotal} min
                          </Text>
                        );
                      })()}

                      {/* Botões de contacto rápido se tiver telemóvel */}
                      {cliente?.telemovel && (
                        <View style={styles.cardActions}>
                          <TouchableOpacity 
                            style={styles.actionIconButton} 
                            onPress={() => handleLigarCliente(cliente.telemovel)}
                            activeOpacity={0.7}
                          >
                            <Phone size={16} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionIconButton} 
                            onPress={() => handleWhatsAppCliente(cliente.telemovel)}
                            activeOpacity={0.7}
                          >
                            <Chat size={16} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
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
        onPress={() => navigation?.navigate('NewAppointment')}
        activeOpacity={0.9}
      >
        <Plus size={24} color={COLORS.surface} weight="bold" />
      </TouchableOpacity>
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
  titleSectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  titleSection: {
    flex: 1,
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
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  todayButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  arrowNavContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  arrowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonText: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  },
  bentoGrid: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  bentoCardVertical: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  bentoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocupacaoBadge: {
    backgroundColor: COLORS.status.confirmado.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ocupacaoBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 10,
    color: COLORS.status.confirmado.text,
  },
  bentoCardContent: {
    marginTop: 12,
  },
  bentoValueText: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 20,
    color: COLORS.primary,
  },
  bentoLabelText: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proximoClienteLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 10,
    color: COLORS.surface,
    opacity: 0.7,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  proximoClienteBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  proximoClienteInfo: {
    flex: 1,
  },
  proximoClienteName: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 22,
    color: COLORS.surface,
  },
  proximoClienteService: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: 2,
  },
  proximoClienteArrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proximoClienteArrow: {
    fontSize: 18,
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  markerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  markerLeftSpacer: {
    width: 62,
  },
  markerLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 20,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
    zIndex: 20,
  },
  markerLineActive: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  markerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  markerBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 9,
    color: COLORS.surface,
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
});

