const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zbgtbhiqdhjuqyfqlnmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3RiaGlxZGhqdXF5ZnFsbm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjY1NTIsImV4cCI6MjA5MjUwMjU1Mn0.e44u_lqPIHskSP7aPZoP0gQtv-IJ7TzrRrLzFxjopNQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMPRESA_ID = '75a038ec-afb6-4dc2-9320-1c235a1f8f1e'; // Barbearia Pro

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function populate() {
  console.log('=== POPULAR DADOS DE DEMONSTRAÇÃO (BARBEARIA) ===');

  try {
    // 1. Limpar dados anteriores de agendamentos, clientes e serviços para não duplicar no teste
    console.log('Limpando agendamentos antigos...');
    await supabase.from('agendamentos').delete().eq('empresa_id', EMPRESA_ID);
    console.log('Limpando clientes antigos...');
    await supabase.from('clientes').delete().eq('empresa_id', EMPRESA_ID);
    console.log('Limpando serviços antigos...');
    await supabase.from('servicos').delete().eq('empresa_id', EMPRESA_ID);

    // 2. Inserir Serviços
    console.log('\nInserindo serviços de barbearia...');
    const servicos = [
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Corte Degradê', preco: 15.00, duracao: 30 },
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Corte Clássico', preco: 12.00, duracao: 30 },
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Barba Toalha Quente', preco: 10.00, duracao: 30 },
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Corte & Barba Premium', preco: 22.00, duracao: 60 },
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Sobrancelha Navalha', preco: 5.00, duracao: 15 }
    ];

    const { data: servicosCriados, error: sError } = await supabase
      .from('servicos')
      .insert(servicos)
      .select();

    if (sError) throw sError;
    console.log(`${servicosCriados.length} serviços inseridos com sucesso.`);

    // 3. Inserir Clientes
    console.log('\nInserindo clientes fictícios...');
    const clientes = [
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Ricardo Fernandes', telemovel: '912345678', email: 'ricardo.fernandes@email.pt', morada: 'Rua do Ouro, Lisboa', nascimento: '1990-05-15', observacoes: 'Prefere degradê médio (mid-fade). Gosta de café curto sem açúcar.' },
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Ana Filipa Sousa', telemovel: '934567890', email: 'ana.sousa@corp.pt', morada: 'Avenida da Boavista, Porto', nascimento: '1995-11-20', observacoes: 'Vem para limpeza de contorno de cabelo. Tem pele sensível.' },
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'João Pedro Silva', telemovel: '967890123', email: 'joao.silva@teste.com', morada: 'Rua das Flores, Coimbra', nascimento: '1988-02-10', observacoes: 'Corte clássico tesoura nas laterais. Usa pomada mate.' },
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Carlos Antunes', telemovel: '915678901', email: 'carlos.antunes@outlook.pt', morada: 'Rua de Braga, Braga', nascimento: '1993-07-30', observacoes: 'Barba desenhada com toalha quente. Prefere óleo cítrico.' },
      { id: generateUUID(), empresa_id: EMPRESA_ID, nome: 'Miguel Oliveira', telemovel: '921112223', email: 'miguel.oliveira@gmail.com', morada: 'Rua da Estação, Aveiro', nascimento: '1998-09-05', observacoes: 'Corte undercut com risco na lateral.' }
    ];

    const { data: clientesCriados, error: cError } = await supabase
      .from('clientes')
      .insert(clientes)
      .select();

    if (cError) throw cError;
    console.log(`${clientesCriados.length} clientes inseridos com sucesso.`);

    // 4. Inserir Agendamentos para hoje (Timeline reativa!)
    console.log('\nInserindo agendamentos para o dia de hoje...');
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataHojeStr = `${ano}-${mes}-${dia}`;

    const formatarHora = (horas, minutos) => {
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`;
    };

    // Obter referências dos IDs
    const c1 = clientesCriados.find(c => c.nome.includes('Ricardo'));
    const c2 = clientesCriados.find(c => c.nome.includes('Ana'));
    const c3 = clientesCriados.find(c => c.nome.includes('João'));
    const c4 = clientesCriados.find(c => c.nome.includes('Carlos'));

    const sCorteDegrade = servicosCriados.find(s => s.nome.includes('Degradê'));
    const sCorteClassico = servicosCriados.find(s => s.nome.includes('Clássico'));
    const sBarba = servicosCriados.find(s => s.nome.includes('Barba'));
    const sPremium = servicosCriados.find(s => s.nome.includes('Premium'));

    const agendamentos = [
      {
        id: generateUUID(),
        empresa_id: EMPRESA_ID,
        cliente_id: c1.id,
        servico_id: sCorteDegrade.id,
        data: dataHojeStr,
        hora: formatarHora(9, 30),
        status: 'confirmado',
        valor_pago: sCorteDegrade.preco,
        observacoes: 'Degradê mid-fade',
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        empresa_id: EMPRESA_ID,
        cliente_id: c2.id,
        servico_id: sBarba.id,
        data: dataHojeStr,
        hora: formatarHora(10, 45),
        status: 'em espera',
        valor_pago: sBarba.preco,
        observacoes: 'Limpeza de pescoço',
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        empresa_id: EMPRESA_ID,
        cliente_id: c3.id,
        servico_id: sPremium.id,
        data: dataHojeStr,
        hora: formatarHora(14, 30),
        status: 'confirmado',
        valor_pago: sPremium.preco,
        observacoes: 'Corte e barba com massagem',
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        empresa_id: EMPRESA_ID,
        cliente_id: c4.id,
        servico_id: sCorteClassico.id,
        data: dataHojeStr,
        hora: formatarHora(16, 0),
        status: 'confirmado',
        valor_pago: sCorteClassico.preco,
        observacoes: 'Corte tesoura clássico',
        created_at: new Date().toISOString()
      }
    ];

    const { data: agCriados, error: agError } = await supabase
      .from('agendamentos')
      .insert(agendamentos)
      .select();

    if (agError) throw agError;
    console.log(`${agCriados.length} agendamentos de teste inseridos com sucesso para hoje.`);
    
    console.log('\n=== POPULAÇÃO CONCLUÍDA COM SUCESSO! ===');
  } catch (error) {
    console.error('Erro geral ao popular dados:', error.message || error);
  }
}

populate();
