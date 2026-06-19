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
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Agendamento, Cliente, Servico, Usuario } from '../types';
import { Calendar, Users, SignOut, Plus, Phone, Chat, Clock, TrendUp, CurrencyDollar, X } from 'phosphor-react-native';

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
  const [modalAgendamentoSelecionado, setModalAgendamentoSelecionado] = useState<Agendamento | null>(null);
  
  // Estados para navegação de data e hora atual
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [agoraTime, setAgoraTime] = useState<Date>(new Date());

  // Estados para FAB expandido e modal de Registar Venda
  const [fabOpen, setFabOpen] = useState(false);
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [vendaClienteId, setVendaClienteId] = useState('');
  const [vendaClienteSearch, setVendaClienteSearch] = useState('');
  const [vendaServicosIds, setVendaServicosIds] = useState<string[]>([]);
  const [vendaValorManual, setVendaValorManual] = useState('');
  const [vendaMetodoPagamento, setVendaMetodoPagamento] = useState<'dinheiro' | 'mbway' | 'cartao'>('dinheiro');
  const [isSavingVenda, setIsSavingVenda] = useState(false);

  // Calcular total automático dos serviços selecionados
  const calcularTotalVenda = () => {
    const total = servicos
      .filter(sv => vendaServicosIds.includes(sv.id))
      .reduce((sum, sv) => sum + Number(sv.preco), 0);
    return total;
  };

  const toggleServicoVenda = (id: string, preco: number) => {
    setVendaServicosIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Clientes filtrados pela pesquisa
  const clientesFiltrados = clientes.filter(cl =>
    vendaClienteSearch.trim() === '' ? true :
    cl.nome.toLowerCase().includes(vendaClienteSearch.toLowerCase()) ||
    (cl.telemovel && cl.telemovel.includes(vendaClienteSearch))
  ).slice(0, 6);

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
    setModalAgendamentoSelecionado(ag);
  };

  const confirmarEliminarAgendamento = (id: string) => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm("Tem a certeza de que pretende eliminar permanentemente esta marcação?");
      if (confirmar) {
        executarEliminacaoAgendamento(id);
      }
    } else {
      Alert.alert(
        "Eliminar Marcação",
        "Tem a certeza de que pretende eliminar permanentemente esta marcação?",
        [
          { text: "Não", style: "cancel" },
          { 
            text: "Sim, Eliminar", 
            style: "destructive",
            onPress: () => executarEliminacaoAgendamento(id)
          }
        ]
      );
    }
  };

  const executarEliminacaoAgendamento = async (id: string) => {
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
    <>
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
        style={styles.scrollView}
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

      {/* FAB Expandido com 2 ações */}
      {fabOpen && (
        <TouchableOpacity
          style={styles.fabOverlay}
          activeOpacity={1}
          onPress={() => setFabOpen(false)}
        />
      )}

      {fabOpen && (
        <View style={styles.fabMenu}>
          {/* Botão Registar Venda */}
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => {
              setFabOpen(false);
              setVendaClienteId('');
              setVendaClienteSearch('');
              setVendaServicosIds([]);
              setVendaValorManual('');
              setVendaMetodoPagamento('dinheiro');
              setShowVendaModal(true);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.fabMenuItemContent}>
              <Text style={styles.fabMenuItemLabel}>Registar Venda</Text>
              <View style={styles.fabMenuItemIcon}>
                <CurrencyDollar size={20} color={COLORS.surface} weight="bold" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Botão Nova Marcação */}
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => {
              setFabOpen(false);
              navigation?.navigate('NewAppointment');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.fabMenuItemContent}>
              <Text style={styles.fabMenuItemLabel}>Nova Marcação</Text>
              <View style={styles.fabMenuItemIcon}>
                <Calendar size={20} color={COLORS.surface} weight="bold" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB Principal */}
      <TouchableOpacity 
        style={[styles.fab, fabOpen && styles.fabOpen]} 
        onPress={() => setFabOpen(!fabOpen)}
        activeOpacity={0.9}
      >
        {fabOpen ? (
          <X size={24} color={COLORS.surface} weight="bold" />
        ) : (
          <Plus size={24} color={COLORS.surface} weight="bold" />
        )}
      </TouchableOpacity>

      {/* Modal de Opções do Agendamento */}
      {modalAgendamentoSelecionado !== null && (
        <View style={styles.customModalOverlay}>
          <TouchableOpacity 
            style={styles.customModalCloseArea} 
            activeOpacity={1} 
            onPress={() => setModalAgendamentoSelecionado(null)}
          />
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Gerir Marcação</Text>
            {modalAgendamentoSelecionado && (() => {
              const ag = modalAgendamentoSelecionado;
              const cl = clientes.find(c => c.id === ag.cliente_id);
              const sv = servicos.find(s => s.id === ag.servico_id);
              const statusAtual = ag.status.toLowerCase();
              
              return (
                <>
                  <Text style={styles.modalSubTitle}>
                    Cliente: {cl?.nome || 'Desconhecido'}{'\n'}
                    Serviço: {sv?.nome || 'Serviço'} • {formatarHora(ag.hora)}{'\n'}
                    Estado atual: {ag.status.toUpperCase()}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.modalOptionBtn}
                    onPress={() => {
                      const novoStatus = statusAtual === 'confirmado' ? 'pendente' : 'confirmado';
                      atualizarEstadoAgendamento(ag.id, novoStatus);
                      setModalAgendamentoSelecionado(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>
                      {statusAtual === 'confirmado' ? 'Colocar Em Espera' : 'Confirmar Marcação'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOptionBtn}
                    onPress={() => {
                      atualizarEstadoAgendamento(ag.id, 'concluido');
                      setModalAgendamentoSelecionado(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Concluir Marcação</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalOptionBtn}
                    onPress={() => {
                      atualizarEstadoAgendamento(ag.id, 'cancelado');
                      setModalAgendamentoSelecionado(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Cancelar Marcação</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.modalOptionBtn, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      setModalAgendamentoSelecionado(null);
                      confirmarEliminarAgendamento(ag.id);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: COLORS.status.cancelado.text }]}>
                      Eliminar Marcação
                    </Text>
                  </TouchableOpacity>
                </>
              );
            })()}

            <TouchableOpacity 
              style={styles.modalCancelBtn}
              onPress={() => setModalAgendamentoSelecionado(null)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>

      {/* Modal de Registar Venda - Redesenhado */}
      <Modal
        visible={showVendaModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVendaModal(false)}
      >
        <View style={styles.customModalOverlay}>
          <TouchableOpacity
            style={styles.customModalCloseArea}
            activeOpacity={1}
            onPress={() => setShowVendaModal(false)}
          />
          <View style={[styles.optionsModalContent, { maxHeight: '90%', padding: 0, overflow: 'hidden' }]}>
            {/* Header do Modal */}
            <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={styles.modalTitle}>Registar Venda</Text>
              <Text style={styles.modalSubTitle}>Selecione os serviços realizados e o cliente.</Text>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ padding: 24 }}>

                {/* Serviços - Multi-seleção vertical */}
                <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 12, color: COLORS.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Serviços</Text>
                <View style={{ gap: 8, marginBottom: 20 }}>
                  {servicos.map(sv => {
                    const isSelected = vendaServicosIds.includes(sv.id);
                    return (
                      <TouchableOpacity
                        key={sv.id}
                        style={[
                          { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, gap: 12 },
                          isSelected && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' }
                        ]}
                        onPress={() => toggleServicoVenda(sv.id, sv.preco)}
                        activeOpacity={0.8}
                      >
                        {/* Checkbox */}
                        <View style={[
                          { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
                          isSelected && { borderColor: COLORS.primary, backgroundColor: COLORS.primary }
                        ]}>
                          {isSelected && <Text style={{ color: '#fff', fontSize: 13, fontFamily: TYPOGRAPHY.fontFamily.sansBold }}>✓</Text>}
                        </View>
                        {/* Info do serviço */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 14, color: isSelected ? COLORS.primary : COLORS.textPrimary }}>{sv.nome}</Text>
                          <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: 12, color: COLORS.textSecondary, marginTop: 1 }}>{sv.duracao} min</Text>
                        </View>
                        {/* Preço */}
                        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.serifBold, fontSize: 16, color: COLORS.primary }}>{Number(sv.preco).toFixed(2)}€</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Total Calculado */}
                {vendaServicosIds.length > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.inputBackground, padding: 14, borderRadius: 12, marginBottom: 20 }}>
                    <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansSemibold, fontSize: 14, color: COLORS.textSecondary }}>
                      {vendaServicosIds.length} serviço{vendaServicosIds.length > 1 ? 's' : ''} selecionado{vendaServicosIds.length > 1 ? 's' : ''}
                    </Text>
                    <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.serifBold, fontSize: 20, color: COLORS.primary }}>
                      {calcularTotalVenda().toFixed(2)}€
                    </Text>
                  </View>
                )}

                {/* Ajuste de valor manual */}
                <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 12, color: COLORS.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Valor Final (€)</Text>
                <TextInput
                  style={{
                    backgroundColor: COLORS.inputBackground,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                    fontSize: 16,
                    color: COLORS.textPrimary,
                    marginBottom: 20,
                  }}
                  value={vendaValorManual || (vendaServicosIds.length > 0 ? calcularTotalVenda().toFixed(2) : '')}
                  onChangeText={setVendaValorManual}
                  placeholder={vendaServicosIds.length > 0 ? calcularTotalVenda().toFixed(2) : '0.00'}
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />

                {/* Cliente - Campo de pesquisa + dropdown */}
                <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 12, color: COLORS.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Cliente (opcional)</Text>
                
                {/* Sem cliente */}
                <TouchableOpacity
                  style={[
                    { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, gap: 10, marginBottom: 8 },
                    vendaClienteId === '' && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' }
                  ]}
                  onPress={() => { setVendaClienteId(''); setVendaClienteSearch(''); }}
                >
                  <View style={[
                    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
                    vendaClienteId === '' && { borderColor: COLORS.primary }
                  ]}>
                    {vendaClienteId === '' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary }} />}
                  </View>
                  <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansSemibold, fontSize: 14, color: vendaClienteId === '' ? COLORS.primary : COLORS.textSecondary }}>Sem cliente específico</Text>
                </TouchableOpacity>

                {/* Campo de pesquisa */}
                <TextInput
                  style={{
                    backgroundColor: COLORS.inputBackground,
                    borderWidth: 1,
                    borderColor: vendaClienteSearch ? COLORS.primary : COLORS.border,
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                    fontSize: 14,
                    color: COLORS.textPrimary,
                    marginBottom: vendaClienteSearch ? 6 : 0,
                  }}
                  value={vendaClienteSearch}
                  onChangeText={setVendaClienteSearch}
                  placeholder="Pesquisar cliente por nome ou telemovel..."
                  placeholderTextColor={COLORS.textSecondary}
                />

                {/* Dropdown de resultados */}
                {vendaClienteSearch.trim() !== '' && (
                  <View style={{ borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 8 }}>
                    {clientesFiltrados.length === 0 ? (
                      <View style={{ padding: 12 }}>
                        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: 13, color: COLORS.textSecondary }}>Nenhum cliente encontrado</Text>
                      </View>
                    ) : clientesFiltrados.map((cl, idx) => (
                      <TouchableOpacity
                        key={cl.id}
                        style={[
                          { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: vendaClienteId === cl.id ? COLORS.primary + '08' : COLORS.surface },
                          idx < clientesFiltrados.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border }
                        ]}
                        onPress={() => { setVendaClienteId(cl.id); setVendaClienteSearch(cl.nome); }}
                      >
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.inputBackground, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 12, color: COLORS.primary }}>
                            {cl.nome.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 14, color: vendaClienteId === cl.id ? COLORS.primary : COLORS.textPrimary }}>{cl.nome}</Text>
                          {cl.telemovel ? <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: 12, color: COLORS.textSecondary }}>{cl.telemovel}</Text> : null}
                        </View>
                        {vendaClienteId === cl.id && <Text style={{ color: COLORS.primary, fontSize: 16 }}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Mostrar cliente selecionado */}
                {vendaClienteId !== '' && !vendaClienteSearch && (() => {
                  const cl = clientes.find(c => c.id === vendaClienteId);
                  return cl ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, backgroundColor: COLORS.primary + '10', marginBottom: 4, gap: 8 }}>
                      <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 13, color: COLORS.primary, flex: 1 }}>✓ {cl.nome}</Text>
                      <TouchableOpacity onPress={() => setVendaClienteId('')}>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 18 }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null;
                })()}

                {/* Método de Pagamento */}
                <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 12, color: COLORS.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 }}>Método de Pagamento</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['dinheiro', 'mbway', 'cartao'] as const).map(metodo => {
                    const labels: Record<string, string> = { dinheiro: '💵 Dinheiro', mbway: '📱 MBWay', cartao: '💳 Cartão' };
                    const isActive = vendaMetodoPagamento === metodo;
                    return (
                      <TouchableOpacity
                        key={metodo}
                        style={[
                          { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center' },
                          isActive && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' }
                        ]}
                        onPress={() => setVendaMetodoPagamento(metodo)}
                      >
                        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 12, color: isActive ? COLORS.primary : COLORS.textSecondary, textAlign: 'center' }}>{labels[metodo]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

              </View>
            </ScrollView>

            {/* Rodapé do Modal */}
            <View style={{ flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => setShowVendaModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 2, backgroundColor: vendaServicosIds.length === 0 ? COLORS.border : COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingVertical: 14, opacity: isSavingVenda ? 0.6 : 1 }}
                disabled={isSavingVenda || vendaServicosIds.length === 0}
                onPress={async () => {
                  const valorFinal = parseFloat(vendaValorManual) || calcularTotalVenda();
                  if (valorFinal <= 0) {
                    Alert.alert('Erro', 'O valor deve ser maior que zero.');
                    return;
                  }
                  if (vendaServicosIds.length === 0) {
                    Alert.alert('Erro', 'Selecione pelo menos um serviço.');
                    return;
                  }
                  try {
                    setIsSavingVenda(true);
                    const hoje = new Date();
                    const dataStr = hoje.toISOString().split('T')[0];
                    const horaStr = hoje.toTimeString().split(' ')[0].substring(0, 5);
                    // Inserir um agendamento por cada serviço (ou o primeiro como principal)
                    const servicoPrincipalId = vendaServicosIds[0];
                    const servicosExtra = vendaServicosIds.slice(1).map(id => {
                      const sv = servicos.find(s => s.id === id);
                      return { id, nome: sv?.nome || '', preco: sv?.preco || 0, duracao: sv?.duracao || 0 };
                    });
                    const { error } = await supabase.from('agendamentos').insert([{
                      empresa_id: currentUser.empresa_id,
                      cliente_id: vendaClienteId || null,
                      servico_id: servicoPrincipalId,
                      servicos_extra: servicosExtra.length > 0 ? JSON.stringify(servicosExtra) : null,
                      data: dataStr,
                      hora: horaStr,
                      status: 'concluido',
                      valor_pago: valorFinal,
                      metodo_pagamento: vendaMetodoPagamento,
                      observacoes: 'Venda direta registada',
                    }]);
                    if (error) throw error;
                    Alert.alert('Sucesso', `Venda de ${valorFinal.toFixed(2)}€ registada com sucesso!`);
                    setShowVendaModal(false);
                    setVendaServicosIds([]);
                    setVendaClienteId('');
                    setVendaClienteSearch('');
                    setVendaValorManual('');
                    setVendaMetodoPagamento('dinheiro');
                    fetchData();
                  } catch (e: any) {
                    Alert.alert('Erro', `Não foi possível registar a venda: ${e.message}`);
                  } finally {
                    setIsSavingVenda(false);
                  }
                }}
              >
                <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.sansBold, fontSize: 14, color: COLORS.surface }}>
                  {isSavingVenda ? 'A guardar...' : vendaServicosIds.length === 0 ? 'Selecione serviços' : `Registar ${calcularTotalVenda().toFixed(2)}€`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    height: Platform.OS === 'web' ? '100vh' : 'auto',
  },
  scrollView: {
    flex: 1,
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
    elevation: 6,
    zIndex: 100,
  },
  fabOpen: {
    backgroundColor: '#333333',
  },
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 90,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 152,
    right: 20,
    gap: 12,
    alignItems: 'flex-end',
    zIndex: 99,
  },
  fabMenuItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  fabMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fabMenuItemLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  fabMenuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  optionsModalContent: {
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
  modalTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    marginBottom: 8,
  },
  modalSubTitle: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalOptionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  },
});
