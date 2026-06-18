const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zbgtbhiqdhjuqyfqlnmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3RiaGlxZGhqdXF5ZnFsbm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjY1NTIsImV4cCI6MjA5MjUwMjU1Mn0.e44u_lqPIHskSP7aPZoP0gQtv-IJ7TzrRrLzFxjopNQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMPRESA_ID = '75a038ec-afb6-4dc2-9320-1c235a1f8f1e';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testInsert() {
  console.log('=== TESTE DE INSERÇÃO DE SERVIÇOS EXTRA ===');
  
  try {
    // Obter um cliente e dois serviços de barbearia existentes
    const { data: clientes } = await supabase.from('clientes').select('id').eq('empresa_id', EMPRESA_ID).limit(1);
    const { data: servicos } = await supabase.from('servicos').select('id, nome, preco').eq('empresa_id', EMPRESA_ID).limit(2);
    
    if (!clientes || clientes.length === 0 || !servicos || servicos.length < 2) {
      console.log('Não há clientes ou serviços suficientes para o teste.');
      return;
    }
    
    const clienteId = clientes[0].id;
    const servicoPrincipal = servicos[0];
    const servicoExtra = servicos[1];
    
    const testId = generateUUID();
    
    const novoAgendamento = {
      id: testId,
      empresa_id: EMPRESA_ID,
      cliente_id: clienteId,
      servico_id: servicoPrincipal.id,
      data: '2026-06-18',
      hora: '18:00:00',
      status: 'confirmado',
      valor_pago: servicoPrincipal.preco + servicoExtra.preco, // Valor total somado
      observacoes: 'Teste de múltiplos serviços',
      servicos_extra: [
        {
          id: servicoExtra.id,
          nome: servicoExtra.nome,
          preco: servicoExtra.preco
        }
      ],
      created_at: new Date().toISOString()
    };
    
    console.log('Tentando inserir agendamento com serviços extra...');
    const { data, error } = await supabase.from('agendamentos').insert([novoAgendamento]).select();
    
    if (error) {
      console.error('Erro ao inserir:', error.message);
    } else {
      console.log('Inserção bem-sucedida!', data[0]);
      
      // Limpar registo de teste
      console.log('Limpando registo de teste...');
      await supabase.from('agendamentos').delete().eq('id', testId);
      console.log('Limpeza concluída.');
    }
    
  } catch (err) {
    console.error('Erro inesperado:', err.message || err);
  }
}

testInsert();
