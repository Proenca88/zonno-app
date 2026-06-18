const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zbgtbhiqdhjuqyfqlnmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3RiaGlxZGhqdXF5ZnFsbm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjY1NTIsImV4cCI6MjA5MjUwMjU1Mn0.e44u_lqPIHskSP7aPZoP0gQtv-IJ7TzrRrLzFxjopNQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectAndFix() {
  console.log('--- ANÁLISE DE CONTAS ---');
  
  // 1. Ler todos os utilizadores
  const { data: users, error: userError } = await supabase.from('usuarios').select('*');
  if (userError) {
    console.error('Erro ao ler utilizadores:', userError.message);
    return;
  }
  console.log('Utilizadores na BD:');
  users.forEach(u => console.log(`- ID: ${u.id}, Nome: ${u.nome}, Email: ${u.email}, Empresa ID: ${u.empresa_id}`));

  // 2. Ler todas as empresas
  const { data: empresas, error: empError } = await supabase.from('empresas').select('*');
  if (empError) {
    console.error('Erro ao ler empresas:', empError.message);
    return;
  }
  console.log('\nEmpresas na BD:');
  empresas.forEach(e => console.log(`- ID: ${e.id}, Nome: ${e.nome_comercial}, Nicho: ${e.nicho}`));

  // 3. Verificar qual empresa o admin/user logado está a usar
}

inspectAndFix();
