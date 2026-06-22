export interface Empresa {
  id: string;
  nome_comercial: string;
  nicho: 'estetica' | 'barbearia' | 'cabeleireiro' | 'tattoo' | 'clinica' | 'outros';
  status_subscricao: 'ativo' | 'teste' | 'suspenso' | 'cancelado';
  created_at: string; // ISO String
}

export interface Usuario {
  id: string;
  empresa_id: string; // Associação Multi-Tenant
  nome: string;
  email: string;
  password?: string;
  perfil: 'admin' | 'profissional';
  status: 'ativo' | 'inativo';
  created_at?: string;
  avatar?: string | null;
  profissional_id?: string | null;
  must_change_password?: boolean;
}

export interface Cliente {
  id: string;
  empresa_id: string; // Associação Multi-Tenant
  nome: string;
  telemovel: string;
  email?: string | null;
  nascimento?: string | null;
  morada?: string | null;
  observacoes?: string | null;
  dados_adicionais: Record<string, any>; // Coluna JSONB dinâmica para multi-nicho
  created_at?: string | null;
}

export interface Servico {
  id: string;
  empresa_id: string; // Associação Multi-Tenant
  nome: string;
  preco: number;
  duracao: number; // em minutos
  cor?: string | null;
  categoria?: string | null;
  created_at?: string;
}

export interface Agendamento {
  id: string;
  empresa_id: string; // Associação Multi-Tenant
  cliente_id: string;
  servico_id: string;
  profissional_id: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
  valor_pago?: number | null;
  observacoes?: string | null;
  confirmado?: boolean;
  created_at?: string;
  servicos_extra?: any; // Múltiplos serviços adicionais
  metodo_pagamento?: string | null;
}

export interface Categoria {
  id: string;
  empresa_id: string;
  nome: string;
  cor?: string | null;
  created_at?: string;
}

export interface Voucher {
  id: string;
  empresa_id: string;
  codigo: string;
  valor: number;
  status: 'ativo' | 'usado' | 'expirado';
  data_validade?: string | null;
  cliente_id?: string | null;
  servico_id?: string | null;
  data_criacao?: string;
  created_at?: string;
}

