import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { supabase } from '../remote/supabase';
import { Cliente, Usuario, Empresa } from '../types';
import { CaretLeft, Phone, Envelope, CalendarBlank, MapPin, Notebook } from 'phosphor-react-native';

interface FichaClienteScreenProps {
  currentUser: Usuario;
  empresa: Empresa;
  clienteId: string;
  onBackClick: () => void;
}

export const FichaClienteScreen: React.FC<FichaClienteScreenProps> = ({
  currentUser,
  empresa,
  clienteId,
  onBackClick,
}) => {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', clienteId)
          .eq('empresa_id', currentUser.empresa_id)
          .single();

        if (error) throw error;
        if (data) setCliente(data as Cliente);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCliente();
  }, [clienteId]);

  const getNicheLabel = (nicho: string) => {
    switch (nicho) {
      case 'estetica': return 'Estética';
      case 'barbearia': return 'Barbearia';
      case 'cabeleireiro': return 'Cabeleireiro';
      case 'tattoo': return 'Tatuagem';
      case 'clinica': return 'Consulta';
      default: return 'Ficha Técnica';
    }
  };

  const formatKeyLabel = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatarData = (dataStr?: string | null) => {
    if (!dataStr) return 'Não informada';
    try {
      const d = new Date(dataStr);
      return d.toLocaleDateString('pt-PT');
    } catch {
      return dataStr;
    }
  };

  // Obter iniciais
  const getIniciais = (nome?: string | null) => {
    if (!nome) return '';
    const partesNome = nome.trim().split(' ');
    return partesNome.length > 1
      ? (partesNome[0].charAt(0) + partesNome[partesNome.length - 1].charAt(0)).toUpperCase()
      : partesNome[0].charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TopBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackClick} style={styles.backButton} activeOpacity={0.7}>
          <CaretLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ficha do Cliente</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : cliente ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Avatar Grande */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getIniciais(cliente.nome)}</Text>
            </View>
            <Text style={styles.nomeText}>{cliente.nome}</Text>
          </View>

          {/* Card de Informações de Contacto */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados de Contacto</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <Phone size={16} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Telemóvel</Text>
                <Text style={styles.infoValue}>{cliente.telemovel || 'Não informado'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <Envelope size={16} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>E-mail</Text>
                <Text style={styles.infoValue}>{cliente.email || 'Não informado'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <CalendarBlank size={16} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Data de Nascimento</Text>
                <Text style={styles.infoValue}>{formatarData(cliente.nascimento)}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <MapPin size={16} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Morada</Text>
                <Text style={styles.infoValue}>{cliente.morada || 'Não informada'}</Text>
              </View>
            </View>
          </View>

          {/* Card de Dados Específicos do Nicho (JSONB) */}
          {cliente.dados_adicionais && Object.keys(cliente.dados_adicionais).length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dados do Nicho ({getNicheLabel(empresa.nicho)})</Text>
              {Object.entries(cliente.dados_adicionais).map(([key, value]) => (
                <View key={key} style={styles.infoItemNiche}>
                  <Text style={styles.nicheLabel}>{formatKeyLabel(key)}</Text>
                  <Text style={styles.nicheValue}>{String(value) || 'Não informado'}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Card de Observações/Anamnese */}
          <View style={styles.card}>
            <View style={styles.obsHeader}>
              <Notebook size={16} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.cardTitleObs}>Histórico & Observações Gerais</Text>
            </View>
            <Text
              style={[
                styles.obsText,
                !cliente.observacoes && styles.obsTextEmpty,
              ]}
            >
              {cliente.observacoes || 'Nenhuma observação registada.'}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cliente não encontrado.</Text>
        </View>
      )}
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: 'rgba(246, 250, 254, 0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  },
  nomeText: {
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  infoItemNiche: {
    marginBottom: 14,
  },
  nicheLabel: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textSecondary,
  },
  nicheValue: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  obsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleObs: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  obsText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  obsTextEmpty: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
  },
});

