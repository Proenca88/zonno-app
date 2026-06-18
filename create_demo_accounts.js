const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const supabaseUrl = 'https://zbgtbhiqdhjuqyfqlnmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3RiaGlxZGhqdXF5ZnFsbm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjY1NTIsImV4cCI6MjA5MjUwMjU1Mn0.e44u_lqPIHskSP7aPZoP0gQtv-IJ7TzrRrLzFxjopNQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const nichos = [
  { id: 'barbearia', email: 'barbearia@demo.pt', nomeEmpresa: 'Zonno Barbearia Demo', nomeResponsavel: 'Barbeiro Demo' },
  { id: 'estetica', email: 'estetica@demo.pt', nomeEmpresa: 'Zonno Estética Demo', nomeResponsavel: 'Esteticista Demo' },
  { id: 'tattoo', email: 'tattoo@demo.pt', nomeEmpresa: 'Zonno Tattoo Demo', nomeResponsavel: 'Tatuador Demo' },
  { id: 'pilates', email: 'pilates@demo.pt', nomeEmpresa: 'Zonno Pilates Demo', nomeResponsavel: 'Instrutor Pilates Demo' }
];

async function createAccounts() {
  console.log('--- CRIANDO CONTAS DE DEMONSTRAÇÃO ---');
  
  for (const n of nichos) {
    console.log(`\nProcessando nicho: ${n.id}...`);
    
    // 1. Verificar se o utilizador já existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', n.email)
      .limit(1);
      
    if (existingUser && existingUser.length > 0) {
      console.log(`A conta ${n.email} já existe na base de dados. Saltando.`);
      continue;
    }
    
    // 2. Gerar UUIDs válidos
    const empresaId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    
    // 3. Inserir Empresa
    const { error: empError } = await supabase
      .from('empresas')
      .insert({
        id: empresaId,
        nome_comercial: n.nomeEmpresa,
        nicho: n.id,
        status_subscricao: 'teste',
        created_at: new Date().toISOString()
      });
      
    if (empError) {
      console.error(`Erro ao criar empresa para ${n.id}:`, empError.message);
      continue;
    }
    console.log(`Empresa "${n.nomeEmpresa}" criada com ID: ${empresaId}`);
    
    // 4. Inserir Utilizador Admin
    const { error: userError } = await supabase
      .from('usuarios')
      .insert({
        id: userId,
        empresa_id: empresaId,
        nome: n.nomeResponsavel,
        email: n.email,
        password: 'demo123',
        perfil: 'admin',
        status: 'ativo',
        must_change_password: false,
        created_at: new Date().toISOString()
      });
      
    if (userError) {
      console.error(`Erro ao criar utilizador para ${n.id}:`, userError.message);
      // Rollback
      await supabase.from('empresas').delete().eq('id', empresaId);
      continue;
    }
    console.log(`Utilizador "${n.email}" criado.`);
    
    // 5. Inserir Configurações iniciais
    const configValor = {
      nome: n.nomeEmpresa,
      telefone: '912345678',
      email: n.email,
      metodos_pagamento: ['Dinheiro', 'MBWay', 'Cartão', 'Transferência'],
      horarios: {
        seg: { aberto: true, inicio: '09:00', fim: '19:00' },
        ter: { aberto: true, inicio: '09:00', fim: '19:00' },
        qua: { aberto: true, inicio: '09:00', fim: '19:00' },
        qui: { aberto: true, inicio: '09:00', fim: '19:00' },
        sex: { aberto: true, inicio: '09:00', fim: '19:00' },
        sab: { aberto: false, inicio: '09:00', fim: '13:00' },
        dom: { aberto: false, inicio: '09:00', fim: '13:00' }
      }
    };
    
    const { error: configError } = await supabase
      .from('configuracoes')
      .insert({
        id: empresaId,
        valor: JSON.stringify(configValor)
      });
      
    if (configError) {
      console.error(`Erro ao criar configurações para ${n.id}:`, configError.message);
    } else {
      console.log(`Configurações iniciais criadas para a empresa.`);
    }
  }
  
  console.log('\n--- PROCESSO DE CONTAS CONCLUÍDO ---');
}

createAccounts();
