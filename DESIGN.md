# Design System & UI Specification - EstéticaFlow Mobile

## 1. Cores e Identidade Visual (Light Mode Luxo B2B)
- **Fundo da App (Background):** #F8F9FA (Cinza-claro suave / Off-white)
- **Contentores/Cartões (Surface/Cards):** #FFFFFF (Branco puro) com cantos arredondados de 16dp e sombras muito subtis.
- **Texto Principal:** #111827 (Preto Sólido / Grafite Escuro) para todos os títulos principais, nomes de menus e rótulos de campos.
- **Texto Secundário:** #6B7280 (Cinza médio) para dados de suporte, descrições e legendas explicativas.
- **Cor de Destaque Primária (Botões):** #111827 (Preto Sólido)
- **Cores de Estado (Etiquetas/Badges):**
  - Concluído / Pago: Fundo #E6F4EA, Texto #137333 (Verde Pastel)
  - Confirmado / Agendado: Fundo #E8F0FE, Texto #1A73E8 (Azul Pastel)
  - Cancelado / Alerta: Fundo #FCE8E6, Texto #C5221F (Vermelho Suave)

## 2. Tipografia
- **Títulos Principais (Cabeçalhos):** Serif Font (Playfair Display ou similar), Bold, na cor #111827.
- **Textos de Apoio e Inputs:** Sans-Serif Font (Inter ou Montserrat), Regular/Medium.

## 3. Mecânica Própria de White-Label (Dinâmica de Marca)
O texto de cabeçalho nos ecrãs operacionais (`Agenda`, `Clientes`, `Serviços`, `Finanças`) deve ser alimentado dinamicamente com a string guardada no campo `nome_clinica` da tabela de registo do utilizador autenticado no Supabase. Caso o dado não esteja disponível, a app faz o fallback padrão para o nome do produto: "EstéticaFlow".

## 4. Arquitetura e Comportamento dos Ecrãs (13 Telas)

### Fluxo de Introdução e Autenticação
1. **Splash Screen:** Fundo claro (#F8F9FA), logótipo centralizado "EstéticaFlow" em fonte com serifa a preto. Indicador "A CARREGAR EXPERIÊNCIA" na base.
2. **Onboarding (Agenda Focus):**
   - Elemento Central: Imagem de maquete de portátil com interface real de agenda clínica, cortada programaticamente num círculo perfeito via código (`Modifier.clip(CircleShape)`).
   - Badge Flutuante: Botão quadrado sólido terracota (#BA7A74) com ícone de calendário a branco sobreposto na borda direita do círculo. Implementar animação contínua de salto vertical suave (Bounce).
   - Ações: Título "Agenda Inteligente", subtítulo descritivo em PT-PT e botão largo preto "COMEÇAR".
3. **Autenticação / Login:** Inputs arredondados para E-mail e Palavra-passe. Botão "ENTRAR", atalho para biometria e link na base: "Não tem conta? Registe a sua clínica".
4. **Recuperação de Palavra-passe:** Botão de retrocesso "<-", título "Recuperar Conta", input para e-mail e botão "ENVIAR LINK DE RECUPERAÇÃO".
5. **Criar Conta / Registar Clínica (SaaS Self-Service):** Cabeçalho com botão "<-" e título "Criar Conta". Inputs verticais uniformizados a preto/cinza escuro para Nome do Responsável, Nome da Clínica / Espaço (campo mestre de White-Label), E-mail Profissional, Telemóvel e Palavra-passe. Checkbox de termos e botão preto largo "Criar Conta e Iniciar Teste".

### Fluxo de Operação e Agenda
6. **Agenda Principal:** Seletor semanal horizontal, timeline vertical por horas com cartões brancos e botão flutuante (+) preto no canto inferior direito.
7. **Nova Marcação (Bottom Sheet):** Inputs arredondados para Cliente, Serviço, Preço, Data, Hora e Notas Adicionais. Botão largo "Confirmar Marcação".
8. **Fecho de Conta (Finalização de Serviço):** Apresentação do total a pagar, input de valor pago, seletor Switch automático para saldo de troco, histórico de transações e botão "Concluir e Emitir Recibo".

### Fluxo de Clientes e Serviços
9. **Lista de Clientes:** Barra de pesquisa superior, listagem vertical com avatares circulares e botão flutuante "+" preto.
10. **Adicionar Novo Cliente:** Inputs verticais para Nome Completo, Telemóvel, E-mail, Data de Nascimento e NIF. Secção de Ficha Clínica com "Alergias/Restrições" e "Observações Gerais". Botão "Guardar Cliente".
11. **Perfil da Cliente:** Cabeçalho com ações rápidas ("Ligar"/"Mensagem"), navegação por abas (Dados Pessoais, Ficha Clínica, Histórico) e listagem de cartões de diagnóstico.
12. **Catálogo de Serviços:** Lista estruturada por categorias expansíveis (Rosto, Corpo, Unhas) com nomes, durações e preços.

### Fluxo de Gestão
13. **Finanças e Análise Geral:** Indicadores mensais de faturação, gráfico de barras vertical semanal, lista de transações recentes e botão "Exportar PDF".