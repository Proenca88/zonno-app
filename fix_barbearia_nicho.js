const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zbgtbhiqdhjuqyfqlnmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3RiaGlxZGhqdXF5ZnFsbm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjY1NTIsImV4cCI6MjA5MjUwMjU1Mn0.e44u_lqPIHskSP7aPZoP0gQtv-IJ7TzrRrLzFxjopNQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fix() {
  console.log('Atualizando nicho da Barbearia Pro...');
  const { data, error } = await supabase
    .from('empresas')
    .update({ nicho: 'barbearia' })
    .eq('id', '75a038ec-afb6-4dc2-9320-1c235a1f8f1e')
    .select();

  if (error) {
    console.error('Erro ao atualizar:', error.message);
  } else {
    console.log('Sucesso! Empresa atualizada:', data);
  }
}

fix();
