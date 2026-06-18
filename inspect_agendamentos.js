const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zbgtbhiqdhjuqyfqlnmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3RiaGlxZGhqdXF5ZnFsbm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjY1NTIsImV4cCI6MjA5MjUwMjU1Mn0.e44u_lqPIHskSP7aPZoP0gQtv-IJ7TzrRrLzFxjopNQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log('Inspecionando tabela agendamentos...');
  const { data, error } = await supabase.from('agendamentos').select('*').limit(1);
  if (error) {
    console.error('Erro ao ler agendamentos:', error.message);
  } else {
    console.log('Amostra de agendamento:', data[0]);
    console.log('Colunas de agendamentos:', Object.keys(data[0] || {}));
  }
}

inspect();
