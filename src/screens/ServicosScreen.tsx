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
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Servico, Categoria, Usuario, Empresa } from '../types';
import { Sparkle, Plus, Clock, Tag } from 'phosphor-react-native';

interface ServicosScreenProps {
  currentUser: Usuario;
  empresa: Empresa;
}

export function ServicosScreen({ currentUser, empresa }: ServicosScreenProps) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null); // null means "Todos"
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [svResult, catResult] = await Promise.all([
        supabase.from('servicos').select('*').eq('empresa_id', currentUser.empresa_id).order('nome', { ascending: true }),
        supabase.from('categorias').select('*').eq('empresa_id', currentUser.empresa_id).order('nome', { ascending: true }),
      ]);

      if (svResult.data) setServicos(svResult.data as Servico[]);
      if (catResult.data) setCategorias(catResult.data as Categoria[]);
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

  const filteredServicos = selectedCategoria
    ? servicos.filter((s) => s.categoria_id === selectedCategoria)
    : servicos;

  const renderService = ({ item }: { item: Servico }) => {
    const categoria = categorias.find((c) => c.id === item.categoria_id);
    const serviceColor = item.cor || COLORS.primary;

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={[styles.iconContainer, { backgroundColor: `${serviceColor}15` }]}>
            <Sparkle size={20} color={serviceColor} weight="bold" />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.serviceName}>{item.nome}</Text>
            <Text style={styles.categoryText}>{categoria?.nome || 'Serviço Geral'}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Clock size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.detailText}>{item.duracao} min</Text>
          </View>
          <Text style={styles.priceText}>{Number(item.preco).toFixed(2)}€</Text>
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
          <Text style={styles.welcomeText}>Catálogo de Serviços</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} activeOpacity={0.7}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredServicos}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Título */}
            <View style={styles.titleSection}>
              <Text style={styles.pageTitle}>Serviços</Text>
            </View>

            {/* Categorias Horizontal Tabs */}
            <View style={styles.tabsWrapper}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ id: null, nome: 'Todos' }, ...categorias]}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.tabsContainer}
                renderItem={({ item }) => {
                  const isActive = selectedCategoria === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        isActive && styles.tabButtonActive
                      ]}
                      onPress={() => setSelectedCategoria(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          isActive && styles.tabTextActive
                        ]}
                      >
                        {item.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Sem serviços registados nesta categoria.</Text>
            </View>
          )
        }
      />

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => alert('Novo serviço através do painel principal.')}
        activeOpacity={0.9}
      >
        <Plus size={24} color={COLORS.surface} weight="bold" />
      </TouchableOpacity>
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
  listContent: {
    paddingBottom: 100,
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
  tabsWrapper: {
    marginBottom: 8,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.surface,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardDetails: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textSecondary,
  },
  priceText: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
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
    bottom: 24,
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

