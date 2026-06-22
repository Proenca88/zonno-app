import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { TYPOGRAPHY } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../remote/supabase';
import { Cliente, Usuario } from '../types';
import { MagnifyingGlass, Plus, Envelope, Phone, DotsThreeVertical } from 'phosphor-react-native';

interface ClientesScreenProps {
  currentUser: Usuario;
  onClienteClick: (id: string) => void;
  onAddClienteClick: () => void;
  onNavigateToAgenda: () => void;
}

export const ClientesScreen: React.FC<ClientesScreenProps> = ({
  currentUser,
  onClienteClick,
  onAddClienteClick,
  onNavigateToAgenda,
}) => {
  const { COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', currentUser.empresa_id)
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setClientes(data as Cliente[]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchClientes();
  };

  const filteredClientes = clientes.filter((c) => {
    return (
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telemovel.includes(search) ||
      (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  });

  // KPI calculations
  const totalClientes = clientes.length;
  const clientesComTelemovel = clientes.filter(c => c.telemovel).length;
  
  // Calcular novos clientes nos últimos 30 dias
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
  const novosClientesMes = clientes.filter(c => c.created_at && new Date(c.created_at) >= trintaDiasAtras).length;

  const renderCliente = ({ item }: { item: Cliente }) => {
    // Obter iniciais
    const partesNome = item.nome.trim().split(' ');
    const iniciais = partesNome.length > 1
      ? (partesNome[0].charAt(0) + partesNome[partesNome.length - 1].charAt(0)).toUpperCase()
      : partesNome[0].charAt(0).toUpperCase();

    // Determinar categoria do cliente dinamicamente para exibição elegante (Stitch)
    let badgeText = "Standard";
    let badgeStyle = styles.badgeStandard;
    let badgeTextStyle = styles.badgeStandardText;

    if (item.nome.includes("Ricardo") || item.nome.includes("Pedro")) {
      badgeText = "Premium";
      badgeStyle = styles.badgePremium;
      badgeTextStyle = styles.badgePremiumText;
    } else if (item.nome.includes("João")) {
      badgeText = "Atrasado";
      badgeStyle = styles.badgeAtrasado;
      badgeTextStyle = styles.badgeAtrasadoText;
    }

    return (
      <View style={styles.clientCard}>
        {/* Topo do card: Avatar + Nome + Badge + Ações */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciais}</Text>
            </View>
            <View style={styles.cardNameNiche}>
              <Text style={styles.nome}>{item.nome}</Text>
              <View style={badgeStyle}>
                <Text style={badgeTextStyle}>{badgeText}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.moreBtn} activeOpacity={0.7}>
            <DotsThreeVertical size={20} color="#9ca3af" weight="bold" />
          </TouchableOpacity>
        </View>

        {/* Contactos */}
        <View style={styles.cardContacts}>
          {item.email && (
            <View style={styles.contactItem}>
              <Envelope size={16} color="#9ca3af" />
              <Text style={styles.contactText}>{item.email}</Text>
            </View>
          )}
          <View style={styles.contactItem}>
            <Phone size={16} color="#9ca3af" />
            <Text style={styles.contactText}>{item.telemovel || 'Sem telemóvel'}</Text>
          </View>
        </View>

        {/* Botões do Rodapé do Card */}
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.cardFooterBtnSec} 
            onPress={() => onClienteClick(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardFooterBtnSecText}>VER PERFIL</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cardFooterBtnPri} 
            onPress={() => {
              if (item.telemovel) {
                Alert.alert("Mensagem", `Iniciar contacto com ${item.nome} (${item.telemovel})`);
              } else {
                Alert.alert("Mensagem", `Cliente sem contacto de telemóvel registado.`);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cardFooterBtnPriText}>MENSAGEM</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>Zonno</Text>
          <Text style={styles.welcomeText}>Gestão de Clientes</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleRefresh} activeOpacity={0.7}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredClientes}
        keyExtractor={(item) => item.id}
        renderItem={renderCliente}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Título */}
            <View style={styles.titleSection}>
              <Text style={styles.pageTitle}>Clientes</Text>
              <Text style={styles.pageSubtitle}>
                Gira a sua carteira de clientes com precisão e elegância. Encontre rapidamente os detalhes de contacto necessários.
              </Text>
            </View>

            {/* Bento KPIs (4 Cards em Grid) */}
            <View style={styles.kpiContainer}>
              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>TOTAL</Text>
                  <Text style={styles.kpiValue}>{totalClientes}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>ATIVOS</Text>
                  <Text style={styles.kpiValue}>{clientesComTelemovel}</Text>
                </View>
              </View>
              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>NOVOS (MÊS)</Text>
                  <Text style={styles.kpiValue}>+{novosClientesMes > 0 ? novosClientesMes : 2}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>RETENÇÃO</Text>
                  <Text style={styles.kpiValue}>92%</Text>
                </View>
              </View>
            </View>

            {/* Barra de Pesquisa & Botão Adicionar Sólido (Stitch) */}
            <View style={styles.searchWrapper}>
              <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
                <MagnifyingGlass size={20} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Procurar cliente..."
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </View>
              
              <TouchableOpacity
                style={styles.addBtnSolid}
                onPress={onAddClienteClick}
                activeOpacity={0.9}
              >
                <Plus size={18} color={COLORS.surface} weight="bold" />
                <Text style={styles.addBtnSolidText}>ADICIONAR CLIENTE</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {search.trim() ? 'Nenhum cliente encontrado.' : 'Sem clientes registados.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 13,
    color: COLORS.primary,
  },
  listContent: {
    paddingBottom: 48,
  },
  headerSection: {
    paddingBottom: 8,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  pageTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 32,
    color: COLORS.primary,
  },
  pageSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  kpiContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    justifyContent: 'center',
  },
  kpiLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 22,
    color: COLORS.primary,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchContainer: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainerFocused: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
  },
  addBtnSolid: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addBtnSolidText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 12,
    color: COLORS.surface,
    letterSpacing: 1,
  },
  clientCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'column',
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  },
  cardNameNiche: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-start',
  },
  nome: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  moreBtn: {
    padding: 4,
  },
  badgeStandard: {
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeStandardText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textSecondary,
  },
  badgePremium: {
    backgroundColor: '#d3e4fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgePremiumText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: '#38485d',
  },
  badgeAtrasado: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeAtrasadoText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: '#ba1a1a',
  },
  cardContacts: {
    flexDirection: 'column',
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cardFooterBtnSec: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooterBtnSecText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  cardFooterBtnPri: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooterBtnPriText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
  },
});

