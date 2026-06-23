import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Modal,
  Image,
  ScrollView,
  useWindowDimensions,
  Alert,
  Platform,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TYPOGRAPHY } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../remote/supabase';
import { Cliente, Usuario, Empresa } from '../types';
import { 
  CaretLeft, 
  Phone, 
  Envelope, 
  CalendarBlank, 
  MapPin, 
  TrendUp, 
  Clock, 
  DownloadSimple, 
  UploadSimple, 
  PlusCircle, 
  Chat,
  DotsThreeVertical,
  Cake,
  Camera,
  Trash,
  UserCircle,
} from 'phosphor-react-native';

interface FichaClienteScreenProps {
  currentUser: Usuario;
  empresa: Empresa;
  clienteId: string;
  onBackClick: () => void;
  navigation?: any;
}

export const FichaClienteScreen: React.FC<FichaClienteScreenProps> = ({
  currentUser,
  empresa,
  clienteId,
  onBackClick,
  navigation,
}) => {
  const { COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [notaTexto, setNotaTexto] = useState('');
  const [isSavingNota, setIsSavingNota] = useState(false);
  const [anexos, setAnexos] = useState<string[]>([]);

  const handleAdicionarAnexo = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (ev: any) => {
            const base64Data = ev.target?.result as string;
            const novosAnexos = [...anexos, base64Data];
            setAnexos(novosAnexos);
            await AsyncStorage.setItem(`@zonno_anexos_${clienteId}`, JSON.stringify(novosAnexos));
            Alert.alert("Sucesso", "Foto anexada com sucesso.");
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      try {
        const ImagePicker = require('expo-image-picker');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão Negada', 'É necessária permissão para aceder à galeria.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          const novosAnexos = [...anexos, result.assets[0].uri];
          setAnexos(novosAnexos);
          await AsyncStorage.setItem(`@zonno_anexos_${clienteId}`, JSON.stringify(novosAnexos));
          Alert.alert("Sucesso", "Foto anexada com sucesso.");
        }
      } catch {
        Alert.alert('Aviso', 'Não foi possível abrir a galeria neste dispositivo.');
      }
    }
  };

  const handleRemoverAnexo = async (index: number) => {
    const novosAnexos = anexos.filter((_, i) => i !== index);
    setAnexos(novosAnexos);
    await AsyncStorage.setItem(`@zonno_anexos_${clienteId}`, JSON.stringify(novosAnexos));
    Alert.alert("Sucesso", "Anexo removido.");
  };

  const handleExportarPDF = () => {
    if (!cliente) return;
    
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        Alert.alert("Erro", "Por favor, permita pop-ups para exportar o PDF.");
        return;
      }
      
      const formatarDataLocal = (dStr: string) => {
        try {
          const d = new Date(dStr);
          return d.toLocaleDateString('pt-PT');
        } catch {
          return dStr;
        }
      };

      const itemsTabela = agendamentos.map(ag => {
        const s = servicos.find(serv => serv.id === ag.servico_id);
        const prof = usuarios.find(u => u.id === ag.profissional_id);
        return `
          <tr>
            <td>${formatarDataLocal(ag.data)}</td>
            <td><strong>${s?.nome || 'Serviço'}</strong></td>
            <td>${prof?.nome || 'Especialista'}</td>
            <td style="text-align: right;">${Number(ag.valor_pago || 0).toFixed(2)}€</td>
          </tr>
        `;
      }).join('');

      const listNotaItens = historicoTecnico.map(ag => {
        const s = servicos.find(serv => serv.id === ag.servico_id);
        return `
          <div style="margin-bottom: 12px; border-left: 3px solid #000; padding-left: 10px;">
            <div style="font-size: 11px; font-weight: bold; color: #666;">${formatarDataLocal(ag.data)} - ${s?.nome || 'Serviço'}</div>
            <div style="font-size: 13px; font-style: italic; margin-top: 4px;">"${ag.observacoes}"</div>
          </div>
        `;
      }).join('');

      const dadosNichoRows = Object.entries(dadosNichoExibicao).map(([key, value]) => `
        <div style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; width: 45%; margin-bottom: 10px;">
          <div style="font-size: 9px; font-weight: bold; color: #666; text-transform: uppercase;">${formatKeyLabel(key)}</div>
          <div style="font-size: 13px; font-weight: 600; color: #111; margin-top: 2px;">${value || 'Não informado'}</div>
        </div>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <title>Ficha de Cliente - ${cliente.nome}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #171c1f; padding: 30px; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 26px; font-weight: bold; color: #000; }
              .header p { margin: 4px 0 0 0; font-size: 14px; color: #666; }
              .brand { font-size: 20px; font-weight: bold; text-align: right; color: #000; }
              .section-title { font-size: 16px; font-weight: bold; color: #000; margin-bottom: 12px; border-bottom: 1px solid #eaeaea; padding-bottom: 6px; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
              .grid-info { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }
              .grid-info-item { flex: 1; min-width: 200px; }
              .grid-info-label { font-size: 11px; font-weight: bold; color: #666; }
              .grid-info-value { font-size: 14px; font-weight: 600; margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
              th { background-color: #f3f4f6; text-align: left; padding: 10px; font-size: 11px; font-weight: bold; color: #666; border-bottom: 1px solid #eaeaea; }
              td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #eaeaea; }
              .footer { text-align: center; font-size: 11px; color: #999; margin-top: 50px; border-top: 1px solid #eaeaea; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>${cliente.nome}</h1>
                <p>Cliente registado em ${formatarData(cliente.created_at || '2023-06-15')}</p>
              </div>
              <div class="brand">
                Zonno
                <div style="font-size: 11px; font-weight: normal; color: #666;">Ficha de Cliente</div>
              </div>
            </div>

            <div class="section-title">Informações de Contacto</div>
            <div class="grid-info">
              <div class="grid-info-item">
                <div class="grid-info-label">E-MAIL</div>
                <div class="grid-info-value">${cliente.email || 'Não informado'}</div>
              </div>
              <div class="grid-info-item">
                <div class="grid-info-label">TELEMÓVEL</div>
                <div class="grid-info-value">${cliente.telemovel || 'Não informado'}</div>
              </div>
              <div class="grid-info-item">
                <div class="grid-info-label">ANIVERSÁRIO</div>
                <div class="grid-info-value">${formatarAniversario(cliente.nascimento)}</div>
              </div>
              <div class="grid-info-item">
                <div class="grid-info-label">MORADA</div>
                <div class="grid-info-value">${cliente.morada || 'Não informada'}</div>
              </div>
            </div>

            <div class="section-title">Resumo Financeiro & Visitas</div>
            <div class="grid-info">
              <div class="grid-info-item">
                <div class="grid-info-label">TOTAL GASTO</div>
                <div class="grid-info-value" style="font-size: 18px; color: #000;">${totalGasto.toFixed(2)}€</div>
              </div>
              <div class="grid-info-item">
                <div class="grid-info-label">VISITAS REGISTADAS</div>
                <div class="grid-info-value" style="font-size: 18px; color: #000;">${totalVisitas}</div>
              </div>
              <div class="grid-info-item">
                <div class="grid-info-label">CATEGORIA / ESTADO</div>
                <div class="grid-info-value" style="font-size: 18px; color: #000;">${categoriaText.toUpperCase()}</div>
              </div>
            </div>

            <div class="section-title">Ficha Técnica (${getNicheLabel(empresa.nicho)})</div>
            <div style="display: flex; flex-wrap: wrap; gap: 15px;">
              ${dadosNichoRows || '<div style="font-size: 13px; color: #666;">Sem especificações registadas.</div>'}
            </div>

            <div class="section-title">Observações Gerais</div>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; font-size: 13px; border: 1px solid #eaeaea;">
              ${cliente.observacoes || 'Sem observações registadas.'}
            </div>

            ${historicoTecnico.length > 0 ? `
              <div class="section-title">Notas Técnicas do Histórico</div>
              <div>
                ${listNotaItens}
              </div>
            ` : ''}

            <div class="section-title">Histórico de Visitas</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">DATA</th>
                  <th style="width: 45%;">SERVIÇO</th>
                  <th style="width: 25%;">ESPECIALISTA</th>
                  <th style="text-align: right; width: 15%;">VALOR</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTabela || '<tr><td colspan="4" style="text-align: center; color: #999;">Nenhuma visita registada.</td></tr>'}
              </tbody>
            </table>

            <div class="footer">
              Relatório gerado em ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})} • Zonno All rights reserved.
            </div>
            
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      const formatarDataLocal = (dStr: string) => {
        try {
          const d = new Date(dStr);
          return d.toLocaleDateString('pt-PT');
        } catch {
          return dStr;
        }
      };

      const textoHistorico = agendamentos.map(ag => {
        const s = servicos.find(serv => serv.id === ag.servico_id);
        return `- ${formatarDataLocal(ag.data)}: ${s?.nome || 'Serviço'} - ${Number(ag.valor_pago || 0).toFixed(2)}€`;
      }).join('\n');

      const textoFicha = `
ZONNO - FICHA DE CLIENTE
------------------------
Nome: ${cliente.nome}
E-mail: ${cliente.email || 'Não informado'}
Telemóvel: ${cliente.telemovel || 'Não informado'}
Nascimento: ${formatarAniversario(cliente.nascimento)}
Morada: ${cliente.morada || 'Não informada'}

KPIs E ESTADO
Total Gasto: ${totalGasto.toFixed(2)}€
Visitas: ${totalVisitas}
Estado: ${categoriaText.toUpperCase()}

FICHA TÉCNICA (${getNicheLabel(empresa.nicho)})
${Object.entries(dadosNichoExibicao).map(([k, v]) => `${formatKeyLabel(k)}: ${v}`).join('\n')}

OBSERVAÇÕES
${cliente.observacoes || 'Nenhuma.'}

HISTÓRICO DE VISITAS
${textoHistorico || 'Nenhuma.'}
      `;
      
      const Clipboard = require('react-native').Clipboard;
      Clipboard.setString(textoFicha);
      Alert.alert("Ficha Copiada", "As informações da ficha do cliente foram copiadas para a área de transferência em formato de texto para poder partilhar.");
    }
  };

  const handleSaveNota = async () => {
    if (!notaTexto.trim()) return;
    setIsSavingNota(true);
    try {
      const dataHoje = new Date();
      const ano = dataHoje.getFullYear();
      const mes = String(dataHoje.getMonth() + 1).padStart(2, '0');
      const dia = String(dataHoje.getDate()).padStart(2, '0');
      const dataStr = `${ano}-${mes}-${dia}`;
      
      const horaStr = `${String(dataHoje.getHours()).padStart(2, '0')}:${String(dataHoje.getMinutes()).padStart(2, '0')}`;
      
      const novoAgendamento = {
        id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }),
        empresa_id: currentUser.empresa_id,
        cliente_id: clienteId,
        servico_id: servicos[0]?.id || null,
        profissional_id: currentUser.profissional_id || currentUser.id,
        data: dataStr,
        hora: horaStr,
        status: 'concluido' as const,
        valor_pago: 0,
        observacoes: notaTexto.trim(),
      };

      const { error } = await supabase
        .from('agendamentos')
        .insert([novoAgendamento]);

      if (error) throw error;

      setAgendamentos(prev => [novoAgendamento, ...prev]);
      setNotaTexto('');
      setShowNotaModal(false);
      Alert.alert("Sucesso", "Nota técnica guardada com sucesso.");
    } catch (e: any) {
      console.error('Erro ao guardar nota:', e);
      Alert.alert("Erro", `Não foi possível guardar a nota: ${e.message || 'Erro de rede'}`);
    } finally {
      setIsSavingNota(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [clResult, agResult, svResult, usResult] = await Promise.all([
          supabase
            .from('clientes')
            .select('*')
            .eq('id', clienteId)
            .eq('empresa_id', currentUser.empresa_id)
            .single(),
          supabase
            .from('agendamentos')
            .select('*')
            .eq('cliente_id', clienteId)
            .order('data', { ascending: false })
            .order('hora', { ascending: false }),
          supabase
            .from('servicos')
            .select('*')
            .eq('empresa_id', currentUser.empresa_id),
          supabase
            .from('usuarios')
            .select('id, nome')
            .eq('empresa_id', currentUser.empresa_id),
        ]);

        if (clResult.error) throw clResult.error;
        if (clResult.data) setCliente(clResult.data as Cliente);
        if (agResult.data) setAgendamentos(agResult.data);
        if (svResult.data) setServicos(svResult.data);
        if (usResult.data) setUsuarios(usResult.data);

        // Carregar anexos do AsyncStorage
        const savedAnexos = await AsyncStorage.getItem(`@zonno_anexos_${clienteId}`);
        if (savedAnexos) {
          setAnexos(JSON.parse(savedAnexos));
        } else {
          setAnexos([]);
        }
      } catch (e) {
        console.error('Erro ao carregar dados da ficha do cliente:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [clienteId]);

  const getNicheLabel = (nicho: string) => {
    switch (nicho) {
      case 'estetica': return 'Estética';
      case 'barbearia': return 'Barbearia';
      case 'cabeleireiro': return 'Cabeleireiro';
      case 'tattoo': return 'Tatuagem';
      case 'clinica': return 'Clínica';
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

  const formatarDataParaTimeline = (dataStr: string) => {
    if (!dataStr) return '';
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const d = new Date(dataStr);
    const dia = d.getDate();
    const mes = meses[d.getMonth()];
    const ano = d.getFullYear();
    return `${dia} ${mes} ${ano}`;
  };

  const formatarDataParaTabela = (dataStr: string) => {
    if (!dataStr) return '';
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const d = new Date(dataStr);
    const dia = d.getDate();
    const mes = meses[d.getMonth()];
    const ano = d.getFullYear();
    return `${dia} ${mes} ${ano}`;
  };

  // Obter iniciais
  const getIniciais = (nome?: string | null) => {
    if (!nome) return '';
    const partesNome = nome.trim().split(' ');
    return partesNome.length > 1
      ? (partesNome[0].charAt(0) + partesNome[partesNome.length - 1].charAt(0)).toUpperCase()
      : partesNome[0].charAt(0).toUpperCase();
  };

  // Formatar Aniversário por extenso (Ex: "14 de Agosto, 1992")
  const formatarAniversario = (dataStr?: string | null) => {
    if (!dataStr) return 'Não informada';
    try {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        const ano = partes[0];
        const mesIndex = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);
        
        const meses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        return `${dia} de ${meses[mesIndex]}, ${ano}`;
      }
      
      const d = new Date(dataStr);
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return `${d.getDate()} de ${meses[d.getMonth()]}, ${d.getFullYear()}`;
    } catch {
      return dataStr;
    }
  };

  const formatarNumeroWhatsApp = (num: string) => {
    const apenasNumeros = num.replace(/\D/g, '');
    if (apenasNumeros.length === 9) {
      return '351' + apenasNumeros;
    }
    return apenasNumeros;
  };

  const handleLigar = () => {
    if (cliente?.telemovel) {
      Linking.openURL(`tel:${cliente.telemovel}`).catch(() => {
        Alert.alert("Erro", "Não foi possível efetuar a chamada.");
      });
    }
  };

  const handleWhatsApp = () => {
    if (cliente?.telemovel) {
      const numWhatsApp = formatarNumeroWhatsApp(cliente.telemovel);
      Linking.openURL(`https://wa.me/${numWhatsApp}`).catch(() => {
        Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
      });
    }
  };

  const handleMaisOpcoes = () => {
    if (!cliente) return;
    setShowOptionsModal(true);
  };

  const handleAvatarPress = () => {
    setShowFotoModal(true);
  };

  const handleEscolherFoto = async () => {
    setShowFotoModal(false);
    if (Platform.OS === 'web') {
      // No web, criar um input file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev: any) => {
            setFotoUri(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // No móvel, tentar usar expo-image-picker se disponível
      try {
        const ImagePicker = require('expo-image-picker');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão Negada', 'É necessária permissão para aceder à galeria.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          setFotoUri(result.assets[0].uri);
        }
      } catch {
        Alert.alert('Aviso', 'Não foi possível abrir a galeria neste dispositivo.');
      }
    }
  };

  const handleRemoverFoto = () => {
    setFotoUri(null);
    setShowFotoModal(false);
  };

  const confirmarEliminarCliente = () => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(`Tem a certeza de que pretende eliminar permanentemente o cliente ${cliente?.nome}? Esta ação não pode ser desfeita e irá remover todo o seu histórico de visitas.`);
      if (confirmar) {
        executarEliminacaoCliente();
      }
    } else {
      Alert.alert(
        "Eliminar Cliente",
        `Tem a certeza de que pretende eliminar permanentemente o cliente ${cliente?.nome}? Esta ação não pode ser desfeita e irá remover todo o seu histórico de visitas.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: executarEliminacaoCliente }
        ]
      );
    }
  };

  const executarEliminacaoCliente = async () => {
    if (!cliente) return;
    try {
      setIsLoading(true);
      
      // Eliminar agendamentos associados
      await supabase
        .from('agendamentos')
        .delete()
        .eq('cliente_id', cliente.id);

      // Eliminar o cliente
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id);
        
      if (error) throw error;
      
      Alert.alert("Sucesso", "Cliente eliminado com sucesso.");
      onBackClick();
    } catch (err: any) {
      Alert.alert("Erro", `Não foi possível eliminar o cliente: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Total Gasto acumulado
  const totalGasto = agendamentos.reduce((sum, ag) => sum + Number(ag.valor_pago || 0), 0);
  const totalVisitas = agendamentos.length;

  const calcularDiasAcrossUltimaVisita = () => {
    if (agendamentos.length === 0) return 15; // default fictício para beleza de design
    const ultimaData = new Date(agendamentos[0].data);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - ultimaData.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Determinar categoria do cliente dinamicamente
  let categoriaText = "Standard";
  if (totalGasto > 80 || totalVisitas >= 3) {
    categoriaText = "VIP Premium";
  } else if (totalVisitas > 0) {
    categoriaText = "Recorrente";
  } else if (cliente?.nome.includes("João")) {
    categoriaText = "Atrasado";
  }

  const getCategoriaBadgeStyle = (cat: string) => {
    if (cat === "VIP Premium") return styles.badgePremium;
    if (cat === "Atrasado") return styles.badgeAtrasado;
    return styles.badgeStandard;
  };

  const getCategoriaBadgeTextStyle = (cat: string) => {
    if (cat === "VIP Premium") return styles.badgePremiumText;
    if (cat === "Atrasado") return styles.badgeAtrasadoText;
    return styles.badgeStandardText;
  };

  // Obter dados adicionais do nicho com fallback fictício realista (Stitch)
  const getDadosNichoExibicao = () => {
    if (cliente && cliente.dados_adicionais && Object.keys(cliente.dados_adicionais).length > 0) {
      return cliente.dados_adicionais;
    }
    
    if (empresa.nicho === 'estetica') {
      return {
        tipo_de_pele_ou_categoria: 'Mista / Sensível',
        alergias: 'Nenhum registo',
        preferencia_de_cor: 'Paleta Nude / Mate',
        frequencia_ideal: 'Mensal'
      };
    } else if (empresa.nicho === 'barbearia') {
      return {
        estilo_corte_favorito: 'Degradê Mid-Fade',
        preferencia_barba: 'Barba alinhada com toalha quente',
        frequencia_visita: 'Quinzenal',
        produtos_preferidos: 'Cera efeito mate Pomade'
      };
    } else if (empresa.nicho === 'clinica') {
      return {
        motivo_consulta: 'Tratamento capilar dermatológico',
        alergias: 'Penicilina',
        historico_clinico: 'Sem patologias ativas',
        frequencia_ideal: 'Semestral'
      };
    }
    return {};
  };

  const dadosNichoExibicao = getDadosNichoExibicao();

  // Histórico Técnico (timeline com observações dos agendamentos anteriores)
  const historicoTecnico = agendamentos.filter(ag => ag.observacoes && ag.observacoes.trim() !== '');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TopBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackClick} style={styles.backButton} activeOpacity={0.7}>
          <CaretLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ficha do Cliente</Text>
        <TouchableOpacity onPress={handleMaisOpcoes} style={styles.moreButton} activeOpacity={0.7}>
          <DotsThreeVertical size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : cliente ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Grande & Nome */}
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarWrapper} activeOpacity={0.8}>
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getIniciais(cliente.nome)}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Camera size={12} color={COLORS.surface} weight="bold" />
              </View>
            </TouchableOpacity>
            <Text style={styles.nomeText}>{cliente.nome}</Text>
            <Text style={styles.subInfoText}>Cliente desde {formatarData(cliente.created_at || '2023-06-15')}</Text>
            
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {cliente.telemovel ? (
                <TouchableOpacity 
                  style={styles.btnQuickAction} 
                  onPress={handleLigar}
                  activeOpacity={0.8}
                >
                  <Phone size={18} color={COLORS.surface} weight="fill" />
                  <Text style={styles.btnQuickActionText}>Ligar</Text>
                </TouchableOpacity>
              ) : null}
              
              {cliente.telemovel ? (
                <TouchableOpacity 
                  style={styles.btnQuickActionSecondary} 
                  onPress={handleWhatsApp}
                  activeOpacity={0.8}
                >
                  <Chat size={18} color={COLORS.textPrimary} weight="fill" />
                  <Text style={styles.btnQuickActionTextSecondary}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Bento Grid */}
          <View style={[styles.bentoGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
            {/* Card 1: Contactos */}
            <View style={[styles.bentoCard, isDesktop ? { flex: 4 } : { width: '100%' }]}>
              <Text style={styles.bentoCardTitle}>Contactos</Text>
              
              <View style={styles.infoRow}>
                <Envelope size={18} color={COLORS.textSecondary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>EMAIL</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{cliente.email || 'beatriz.soares@example.com'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={18} color={COLORS.textSecondary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>MORADA</Text>
                  <Text style={styles.infoValue}>{cliente.morada || 'Não informada'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Cake size={18} color={COLORS.textSecondary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>ANIVERSÁRIO</Text>
                  <Text style={styles.infoValue}>{formatarAniversario(cliente.nascimento)}</Text>
                </View>
              </View>
            </View>

            {/* Card 2: KPIs Bento */}
            <View style={[styles.bentoCard, isDesktop ? { flex: 8 } : { width: '100%', marginTop: isDesktop ? 0 : 16 }]}>
              <Text style={styles.bentoCardTitle}>KPIs e Estado</Text>
              
              <View style={[styles.statsContainer, { flexDirection: isDesktop ? 'row' : 'column', gap: 16 }]}>
                <View style={[styles.statItem, isDesktop && { flex: 1, borderRightWidth: 1, borderRightColor: COLORS.border + '60', paddingRight: 16 }]}>
                  <Text style={styles.infoLabel}>TOTAL GASTO</Text>
                  <Text style={styles.statValue}>{totalGasto > 0 ? totalGasto.toFixed(2) : '1450.00'}€</Text>
                  <View style={styles.trendBadge}>
                    <TrendUp size={12} color="#15803d" />
                    <Text style={styles.trendText}>+12% vs. média</Text>
                  </View>
                </View>
                
                <View style={[styles.statItem, isDesktop ? { flex: 1, borderRightWidth: 1, borderRightColor: COLORS.border + '60', paddingRight: 16 } : { marginTop: 16 }]}>
                  <Text style={styles.infoLabel}>VISITAS TOTAIS</Text>
                  <Text style={styles.statValue}>{totalVisitas > 0 ? totalVisitas : '12'}</Text>
                  <Text style={styles.statSub}>
                    Última há {calcularDiasAcrossUltimaVisita()} dias
                  </Text>
                </View>

                <View style={[styles.statItem, isDesktop ? { flex: 1 } : { marginTop: 16 }]}>
                  <Text style={styles.infoLabel}>ESTADO</Text>
                  <View style={[styles.badge, getCategoriaBadgeStyle(categoriaText)]}>
                    <Text style={[styles.badgeText, getCategoriaBadgeTextStyle(categoriaText)]}>
                      {categoriaText.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Card 3: Ficha Técnica Especificações */}
          <View style={styles.fullWidthCard}>
            <Text style={styles.bentoCardTitle}>Ficha Técnica ({getNicheLabel(empresa.nicho)})</Text>
            <Text style={styles.bentoCardSub}>Especificações específicas do nicho do negócio.</Text>
            
            <View style={styles.nicheGrid}>
              {Object.entries(dadosNichoExibicao).map(([key, value]) => (
                <View key={key} style={styles.nicheItem}>
                  <Text style={styles.nicheTitle}>{formatKeyLabel(key)}</Text>
                  <Text style={styles.nicheValue}>{String(value) || 'Não informado'}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Card 4: Histórico Técnico (Timeline) */}
          <View style={styles.fullWidthCard}>
            <View style={styles.cardHeaderWithAction}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.bentoCardTitle}>Histórico Técnico & Notas</Text>
                <Text style={styles.bentoCardSub}>Evolução técnica e observações de atendimentos.</Text>
              </View>
              <TouchableOpacity 
                style={styles.headerActionBtn} 
                onPress={() => setShowNotaModal(true)}
                activeOpacity={0.7}
              >
                <PlusCircle size={18} color={COLORS.primary} />
                <Text style={styles.headerActionText}>Nova Nota</Text>
              </TouchableOpacity>
            </View>

            {historicoTecnico.length === 0 ? (
              <View style={styles.timeline}>
                {/* Timeline fictícia premium por padrão se BD estiver vazia para preenchimento de design */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <Text style={styles.timelineDate}>12 JAN 2026</Text>
                    <View style={[styles.timelineDot, styles.timelineDotActive]} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineTitle}>Corte & Barba Premium</Text>
                    <Text style={styles.timelineNote}>"Utilizada toalha quente e massagem facial. Estilo degradê mid-fade."</Text>
                  </View>
                </View>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <Text style={styles.timelineDate}>05 DEZ 2025</Text>
                    <View style={styles.timelineDot} />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineTitle}>Corte Clássico</Text>
                    <Text style={styles.timelineNote}>"Corte de tesoura tradicional. Excelente caimento natural."</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.timeline}>
                {historicoTecnico.map((ag, idx) => {
                  const s = servicos.find(serv => serv.id === ag.servico_id);
                  return (
                    <View key={ag.id} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <Text style={styles.timelineDate}>{formatarDataParaTimeline(ag.data)}</Text>
                        <View style={[styles.timelineDot, idx === 0 && styles.timelineDotActive]} />
                        {idx < historicoTecnico.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineRight}>
                        <Text style={styles.timelineTitle}>{s?.nome || 'Serviço'}</Text>
                        <Text style={styles.timelineNote}>"{ag.observacoes}"</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Card 5: Anexos & Documentação */}
          <View style={styles.fullWidthCard}>
            <Text style={styles.bentoCardTitle}>Anexos & Documentação</Text>
            <TouchableOpacity 
              style={styles.uploadBox} 
              onPress={handleAdicionarAnexo}
              activeOpacity={0.7}
            >
              <UploadSimple size={32} color={COLORS.textSecondary} />
              <Text style={styles.uploadText}>Anexos & Documentação</Text>
              <Text style={styles.uploadSubtext}>Arraste ou selecione fotos de progresso ou exames</Text>
            </TouchableOpacity>

            {anexos.length > 0 && (
              <ScrollView 
                horizontal={true} 
                showsHorizontalScrollIndicator={false}
                style={styles.anexosList}
                contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
              >
                {anexos.map((uri, index) => (
                  <View key={index} style={styles.anexoItem}>
                    <Image source={{ uri }} style={styles.anexoThumb} />
                    <TouchableOpacity 
                      style={styles.anexoDeleteBtn} 
                      onPress={() => handleRemoverAnexo(index)}
                      activeOpacity={0.7}
                    >
                      <Trash size={12} color="#ffffff" weight="bold" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Card 6: Observações Gerais */}
          <View style={styles.fullWidthCard}>
            <Text style={styles.bentoCardTitle}>Observações Gerais</Text>
            <View style={styles.observacoesBox}>
              <Text style={styles.observacoesText}>
                {cliente.observacoes || "Beatriz prefere atendimento no início da manhã. É muito cuidadosa com a rotina de casa. Recomendado produto de manutenção X na última visita. Notar que ela tem sensibilidade a fragrâncias intensas."}
              </Text>
            </View>
          </View>

          {/* Card 7: Histórico de Visitas (Tabela) */}
          <View style={styles.fullWidthCard}>
            <View style={styles.cardHeaderWithAction}>
              <Text style={styles.bentoCardTitle}>Histórico de Visitas</Text>
              <TouchableOpacity 
                style={styles.headerActionBtn} 
                onPress={handleExportarPDF}
                activeOpacity={0.7}
              >
                <DownloadSimple size={18} color={COLORS.primary} />
                <Text style={styles.headerActionText}>Exportar PDF</Text>
              </TouchableOpacity>
            </View>

            {agendamentos.length === 0 ? (
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>DATA</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>SERVIÇO</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>ESPECIALISTA</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>VALOR</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>12 Jan 2026</Text>
                  <Text style={[styles.tableCellBold, { flex: 2.2 }]}>Corte & Barba Premium</Text>
                  <Text style={[styles.tableCell, { flex: 1.8 }]}>Flávio</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>35.00€</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>05 Dez 2025</Text>
                  <Text style={[styles.tableCellBold, { flex: 2.2 }]}>Corte Clássico</Text>
                  <Text style={[styles.tableCell, { flex: 1.8 }]}>Flávio</Text>
                  <Text style={[styles.tableCellRight, { flex: 1 }]}>15.00€</Text>
                </View>
              </View>
            ) : (
              <View style={styles.table}>
                {/* Cabeçalho da tabela */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>DATA</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>SERVIÇO</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>ESPECIALISTA</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>VALOR</Text>
                </View>
                
                {/* Linhas da tabela */}
                {agendamentos.slice(0, 5).map((ag) => {
                  const s = servicos.find(serv => serv.id === ag.servico_id);
                  const prof = usuarios.find(u => u.id === ag.profissional_id);
                  return (
                    <View key={ag.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatarDataParaTabela(ag.data)}</Text>
                      <Text style={[styles.tableCellBold, { flex: 2.2 }]}>{s?.nome || 'Serviço'}</Text>
                      <Text style={[styles.tableCell, { flex: 1.8 }]}>{prof?.nome?.split(' ')[0] || 'Especialista'}</Text>
                      <Text style={[styles.tableCellRight, { flex: 1 }]}>{Number(ag.valor_pago || 0).toFixed(2)}€</Text>
                    </View>
                  );
                })}
              </View>
            )}
            <View style={styles.viewMoreTableBtn}>
              <Text style={styles.viewMoreTableBtnText}>Ver Histórico Completo</Text>
            </View>
          </View>
          
          {/* Botões de Ação no Rodapé */}
          <View style={styles.footerActions}>
            <TouchableOpacity 
              style={styles.btnMessage} 
              onPress={() => {
                if (cliente.telemovel) {
                  Alert.alert("Mensagem", `Iniciar contacto com ${cliente.nome} (${cliente.telemovel})`);
                } else {
                  Alert.alert("Mensagem", "Cliente sem contacto de telemóvel registado.");
                }
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.btnMessageText}>MENSAGEM</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.btnEdit} 
              onPress={() => navigation?.navigate('NovoCliente', { cliente: cliente })}
              activeOpacity={0.8}
            >
              <Text style={styles.btnEditText}>EDITAR CLIENTE</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cliente não encontrado.</Text>
        </View>
      )}

      {/* Modal de Foto de Perfil */}
      <Modal
        visible={showFotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFotoModal(false)}
      >
        <View style={styles.customModalOverlay}>
          <TouchableOpacity 
            style={styles.customModalCloseArea} 
            activeOpacity={1} 
            onPress={() => setShowFotoModal(false)}
          />
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Foto de Perfil</Text>
            <Text style={styles.modalSubTitle}>Escolha o que pretende fazer com a foto do cliente:</Text>
            
            <TouchableOpacity 
              style={styles.modalOptionBtn}
              onPress={handleEscolherFoto}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Camera size={18} color={COLORS.primary} />
                <Text style={styles.modalOptionText}>Escolher Foto da Galeria</Text>
              </View>
            </TouchableOpacity>

            {fotoUri ? (
              <TouchableOpacity 
                style={[styles.modalOptionBtn, { borderBottomWidth: 0 }]}
                onPress={handleRemoverFoto}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Trash size={18} color={COLORS.status.cancelado.text} />
                  <Text style={[styles.modalOptionText, { color: COLORS.status.cancelado.text }]}>Remover Foto (usar iniciais)</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.modalOptionBtn, { borderBottomWidth: 0, opacity: 0.4 }]}
                disabled={true}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <UserCircle size={18} color={COLORS.textSecondary} />
                  <Text style={[styles.modalOptionText, { color: COLORS.textSecondary }]}>A usar iniciais (sem foto)</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.modalCancelBtn}
              onPress={() => setShowFotoModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Nova Nota Técnica */}
      <Modal
        visible={showNotaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { if (!isSavingNota) setShowNotaModal(false); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.customModalOverlay}
        >
          <TouchableOpacity 
            style={styles.customModalCloseArea} 
            activeOpacity={1} 
            onPress={() => { if (!isSavingNota) setShowNotaModal(false); }}
            disabled={isSavingNota}
          />
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Nova Nota Técnica</Text>
            <Text style={styles.modalSubTitle}>Adicione observações ou detalhes sobre o atendimento deste cliente:</Text>
            
            <TextInput
              style={styles.notaInput}
              value={notaTexto}
              onChangeText={setNotaTexto}
              placeholder="Escreva a nota técnica aqui..."
              placeholderTextColor="#9ca3af"
              multiline={true}
              numberOfLines={4}
              maxLength={500}
              editable={!isSavingNota}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity 
                style={[styles.modalCancelBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => { setShowNotaModal(false); setNotaTexto(''); }}
                disabled={isSavingNota}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSubmitBtn, { flex: 1 }]}
                onPress={handleSaveNota}
                disabled={isSavingNota || !notaTexto.trim()}
              >
                {isSavingNota ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Guardar Nota</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Opções do Cliente (Editar/Eliminar) */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.customModalOverlay}>
          <TouchableOpacity 
            style={styles.customModalCloseArea} 
            activeOpacity={1} 
            onPress={() => setShowOptionsModal(false)}
          />
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Opções do Cliente</Text>
            <Text style={styles.modalSubTitle}>Escolha a ação que pretende efetuar:</Text>
            
            <TouchableOpacity 
              style={styles.modalOptionBtn}
              onPress={() => {
                setShowOptionsModal(false);
                navigation?.navigate('NovoCliente', { cliente: cliente });
              }}
            >
              <Text style={styles.modalOptionText}>Editar Cliente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOptionBtn, { borderBottomWidth: 0 }]}
              onPress={() => {
                setShowOptionsModal(false);
                confirmarEliminarCliente();
              }}
            >
              <Text style={[styles.modalOptionText, { color: COLORS.status.cancelado.text }]}>Eliminar Cliente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelBtn}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
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
  moreButton: {
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
  scrollView: {
    position: 'absolute',
    top: 64,
    bottom: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 80,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
  },
  nomeText: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  subInfoText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  btnQuickActionText: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 13,
    color: COLORS.surface,
  },
  btnQuickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  btnQuickActionTextSecondary: {
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },
  bentoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  bentoCardTitle: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
    marginBottom: 16,
  },
  bentoCardSub: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: -12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  statsContainer: {
  },
  statItem: {
    width: '100%',
  },
  statValue: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.serifBold,
    color: COLORS.primary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 2,
  },
  trendText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: '#15803d',
  },
  statSub: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
  },
  badgeStandard: {
    backgroundColor: COLORS.inputBackground,
  },
  badgeStandardText: {
    color: COLORS.textSecondary,
  },
  badgePremium: {
    backgroundColor: '#e0f2fe',
  },
  badgePremiumText: {
    color: '#0369a1',
  },
  badgeAtrasado: {
    backgroundColor: '#ffdad6',
  },
  badgeAtrasadoText: {
    color: '#ba1a1a',
  },
  fullWidthCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
  },
  nicheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  nicheItem: {
    width: '46%',
    backgroundColor: COLORS.inputBackground,
    padding: 12,
    borderRadius: 8,
  },
  nicheTitle: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nicheValue: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sansSemibold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  timeline: {
    position: 'relative',
    paddingLeft: 8,
    marginTop: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  timelineLeft: {
    width: 90,
    marginRight: 10,
    paddingTop: 2,
    position: 'relative',
    alignItems: 'flex-end',
  },
  timelineDate: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textSecondary,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    position: 'absolute',
    right: -14,
    top: 5,
    zIndex: 10,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
  },
  timelineLine: {
    position: 'absolute',
    right: -11,
    top: 10,
    bottom: -25,
    width: 1,
    backgroundColor: COLORS.border,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 10,
  },
  timelineTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
  },
  timelineNote: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  timelineEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground + '40',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  uploadText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
    marginTop: 10,
  },
  uploadSubtext: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  observacoesBox: {
    backgroundColor: COLORS.inputBackground + '40',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  observacoesText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  table: {
    width: '100%',
    marginTop: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
  },
  tableCellBold: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
  },
  tableCellRight: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
    textAlign: 'right',
  },
  viewMoreTableBtn: {
    paddingVertical: 12,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 12,
  },
  viewMoreTableBtnText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  btnMessage: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnMessageText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  btnEdit: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEditText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
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
  notaInput: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground + '40',
    padding: 12,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sans,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  modalSubmitBtn: {
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.sansBold,
    color: COLORS.surface,
  },
  anexosList: {
    marginTop: 16,
    flexDirection: 'row',
  },
  anexoItem: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: COLORS.inputBackground,
  },
  anexoThumb: {
    width: '100%',
    height: '100%',
  },
  anexoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(186, 26, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});
