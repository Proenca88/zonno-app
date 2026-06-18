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
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Cliente, Usuario } from '../types';
import { MagnifyingGlass, Plus, CaretRight, Users, Calendar } from 'phosphor-react-native';

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

  const renderCliente = ({ item }: { item: Cliente }) => {
    // Obter iniciais
    const partesNome = item.nome.trim().split(' ');
    const iniciais = partesNome.length > 1
      ? (partesNome[0].charAt(0) + partesNome[partesNome.length - 1].charAt(0)).toUpperCase()
      : partesNome[0].charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onClienteClick(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.telemovel}>{item.telemovel || 'Sem telemóvel'}</Text>
        </View>

        <CaretRight size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
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
            </View>

            {/* Bento KPIs */}
            <View style={styles.bentoGrid}>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{totalClientes}</Text>
                <Text style={styles.bentoLabel}>Total Registados</Text>
              </View>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoValue}>{clientesComTelemovel}</Text>
                <Text style={styles.bentoLabel}>Contacto Ativo</Text>
              </View>
            </View>

            {/* Barra de Pesquisa */}
            <View style={styles.searchWrapper}>
              <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
                <MagnifyingGlass size={20} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Pesquisar por nome, telemóvel..."
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </View>
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

      {/* Botão Flutuante de Adicionar */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onAddClienteClick}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 13,
    color: COLORS.primary,
  },
  listContent: {
    paddingBottom: 120,
  },
  headerSection: {
    paddingBottom: 8,
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
  bentoGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 90,
    justifyContent: 'center',
  },
  bentoValue: {
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    fontSize: 24,
    color: COLORS.primary,
  },
  bentoLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    width: '100%',
    height: 52,
    borderRadius: 8,
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
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  nome: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  telemovel: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: 2,
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

