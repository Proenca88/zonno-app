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
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Servico, Categoria, Usuario, Empresa } from '../types';
import { Sparkle, Plus, Clock, Tag, Trash, FloppyDisk } from 'phosphor-react-native';

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

  // Form estados
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formPreco, setFormPreco] = useState('');
  const [formDuracao, setFormDuracao] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState('');
  const [formCor, setFormCor] = useState('#af4f57');
  const [isSaving, setIsSaving] = useState(false);

  const handleNovoServico = () => {
    setEditingServico(null);
    setFormNome('');
    setFormPreco('');
    setFormDuracao('30');
    setFormCategoriaId(categorias[0]?.id || '');
    setFormCor('#af4f57');
    setShowFormModal(true);
  };

  const handleEditServico = (servico: Servico) => {
    setEditingServico(servico);
    setFormNome(servico.nome);
    setFormPreco(String(servico.preco));
    setFormDuracao(String(servico.duracao));
    setFormCategoriaId(servico.categoria_id || categorias[0]?.id || '');
    setFormCor(servico.cor || '#af4f57');
    setShowFormModal(true);
  };

  const handleSaveServico = async () => {
    if (!formNome.trim()) {
      Alert.alert("Erro", "O nome do serviço é obrigatório.");
      return;
    }
    const precoNum = parseFloat(formPreco);
    if (isNaN(precoNum) || precoNum < 0) {
      Alert.alert("Erro", "Introduza um preço válido (positivo).");
      return;
    }
    const duracaoNum = parseInt(formDuracao, 10);
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      Alert.alert("Erro", "Introduza uma duração válida em minutos.");
      return;
    }

    try {
      setIsSaving(true);
      const servicoData = {
        empresa_id: currentUser.empresa_id,
        nome: formNome.trim(),
        preco: precoNum,
        duracao: duracaoNum,
        cor: formCor,
        categoria_id: formCategoriaId || null,
      };

      if (editingServico) {
        // UPDATE
        const { error } = await supabase
          .from('servicos')
          .update(servicoData)
          .eq('id', editingServico.id);

        if (error) throw error;
        Alert.alert("Sucesso", "Serviço atualizado com sucesso!");
      } else {
        // INSERT
        const { error } = await supabase
          .from('servicos')
          .insert([servicoData]);

        if (error) throw error;
        Alert.alert("Sucesso", "Serviço adicionado com sucesso!");
      }

      setShowFormModal(false);
      fetchData();
    } catch (e: any) {
      Alert.alert("Erro", `Não foi possível guardar o serviço: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteServico = () => {
    if (!editingServico) return;

    if (Platform.OS === 'web') {
      const confirmar = window.confirm(`Tem a certeza de que pretende eliminar permanentemente o serviço "${editingServico.nome}"?`);
      if (confirmar) {
        handleDeleteServico();
      }
    } else {
      Alert.alert(
        "Eliminar Serviço",
        `Tem a certeza de que pretende eliminar permanentemente o serviço "${editingServico.nome}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: handleDeleteServico }
        ]
      );
    }
  };

  const handleDeleteServico = async () => {
    if (!editingServico) return;
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', editingServico.id);

      if (error) throw error;

      Alert.alert("Sucesso", "Serviço eliminado com sucesso!");
      setShowFormModal(false);
      fetchData();
    } catch (e: any) {
      Alert.alert("Erro", `Não foi possível eliminar o serviço: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

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
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleEditServico(item)}
        activeOpacity={0.8}
      >
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
      </TouchableOpacity>
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
        onPress={handleNovoServico}
        activeOpacity={0.9}
      >
        <Plus size={24} color={COLORS.surface} weight="bold" />
      </TouchableOpacity>

      {/* Modal de Formulário do Serviço (Adicionar/Editar) */}
      <Modal
        visible={showFormModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.customModalOverlay}>
          <TouchableOpacity 
            style={styles.customModalCloseArea} 
            activeOpacity={1} 
            onPress={() => setShowFormModal(false)}
          />
          <View style={styles.formModalContent}>
            <Text style={styles.modalTitle}>
              {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome do Serviço</Text>
              <TextInput
                style={styles.input}
                value={formNome}
                onChangeText={setFormNome}
                placeholder="Ex: Corte de Cabelo"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Preço (€)</Text>
                <TextInput
                  style={styles.input}
                  value={formPreco}
                  onChangeText={setFormPreco}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Duração (min)</Text>
                <TextInput
                  style={styles.input}
                  value={formDuracao}
                  onChangeText={setFormDuracao}
                  placeholder="30"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoria</Text>
              <View style={styles.categoriesRow}>
                {categorias.map((cat) => {
                  const isSelected = formCategoriaId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        isSelected && styles.categoryOptionActive
                      ]}
                      onPress={() => setFormCategoriaId(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextActive
                      ]}>
                        {cat.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Cor do Serviço</Text>
              <View style={styles.colorPalette}>
                {[
                  '#af4f57', // Vinho/Rosa
                  '#1e3a8a', // Azul
                  '#15803d', // Verde
                  '#b45309', // Dourado
                  '#6b21a8', // Roxo
                  '#111827', // Preto
                ].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      formCor === color && styles.colorCircleActive,
                    ]}
                    onPress={() => setFormCor(color)}
                    activeOpacity={0.8}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              {editingServico && (
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.btnDelete]}
                  onPress={confirmDeleteServico}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Trash size={18} color="#b91c1c" />
                  <Text style={styles.btnDeleteText}>Eliminar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.actionBtn, styles.btnSave, { flex: editingServico ? 1.5 : 1 }]}
                onPress={handleSaveServico}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <>
                    <FloppyDisk size={18} color={COLORS.surface} />
                    <Text style={styles.btnSaveText}>Gravar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.modalCancelBtn}
              onPress={() => setShowFormModal(false)}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  formModalContent: {
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
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
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
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textSecondary,
  },
  categoryOptionTextActive: {
    color: COLORS.surface,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: COLORS.textPrimary,
    transform: [{ scale: 1.1 }],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  btnDelete: {
    flex: 1,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  btnDeleteText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: '#b91c1c',
  },
  btnSave: {
    backgroundColor: COLORS.primary,
  },
  btnSaveText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 14,
    color: COLORS.surface,
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  },
});
