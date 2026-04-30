import { Shortcut, Tip, Exercise, Badge, SurvivalTopic, FAQ } from './types';

export const SURVIVAL_TOPICS: SurvivalTopic[] = [
  {
    id: 'st-word-1',
    program: 'Word',
    title: 'Interface Básica',
    content: 'O Word é dividido em Abas (Página Inicial, Inserir, Layout). A "Página Inicial" contém as ferramentas de texto (Negrito, Fonte, Cor). A aba "Inserir" é para tabelas e imagens. "Layout" é onde você define o tamanho da folha e margens.'
  },
  {
    id: 'st-excel-1',
    program: 'Excel',
    title: 'Células e Colunas',
    content: 'O Excel é uma grade. Colunas são letras (A, B, C) e Linhas são números (1, 2, 3). No encontro delas temos a Célula (ex: A1). Toda fórmula começa com o sinal de igual (=).'
  },
  {
    id: 'st-pp-1',
    program: 'PowerPoint',
    title: 'O Plano de Slide',
    content: 'Slides são suas páginas. Use "Novo Slide" para adicionar conteúdo. Mantenha pouco texto por slide e use imagens de alta qualidade. O segredo está na aba "Transições" para mudar de um slide para outro.'
  },
  {
    id: 'st-ws-1',
    program: 'Workspace',
    title: 'Nuvem e Colaboração',
    content: 'No Google Workspace, tudo é salvo automaticamente. O Drive é o seu HD na nuvem. O diferencial é o botão "Compartilhar", que permite que várias pessoas editem o mesmo arquivo simultaneamente.'
  }
];

export const FAQS: FAQ[] = [
  // Word
  {
    id: 'faq-w1',
    program: 'Word',
    question: 'Como crio uma tabela no Word?',
    answer: 'Vá na aba "Inserir", clique no botão "Tabela" e arraste o mouse para escolher o número de colunas e linhas desejadas.'
  },
  {
    id: 'faq-w2',
    program: 'Word',
    question: 'Como ajusto as margens no Word?',
    answer: 'Vá na aba "Layout", clique no botão "Margens". Você pode escolher padrões como "Normal" ou configurar manualmente em "Margens Personalizadas".'
  },
  {
    id: 'faq-w3',
    program: 'Word',
    question: 'Como salvo como PDF?',
    answer: 'Vá em Arquivo > Salvar Como (ou Exportar) e selecione a extensão .pdf na lista de tipos de arquivo.'
  },
  // Excel
  {
    id: 'faq-e1',
    program: 'Excel',
    question: 'Como faço uma soma simples?',
    answer: 'Selecione a célula onde quer o resultado e digite =SOMA( então selecione os números que deseja somar com o mouse e pressione Enter.'
  },
  {
    id: 'faq-e2',
    program: 'Excel',
    question: 'Como congelar o topo da planilha?',
    answer: 'Vá na aba "Exibir", clique em "Congelar Painéis" e escolha "Congelar Linha Superior". Isso mantém o cabeçalho visível ao rolar para baixo.'
  },
  // PowerPoint
  {
    id: 'faq-p1',
    program: 'PowerPoint',
    question: 'Como insiro um vídeo no slide?',
    answer: 'Vá na aba "Inserir", procure pelo grupo "Mídia" no lado direito e selecione "Vídeo" > "Este Dispositivo" ou "Vídeos Online".'
  },
  // Workspace
  {
    id: 'faq-ws1',
    program: 'Workspace',
    question: 'Como compartilho um arquivo no Drive?',
    answer: 'Clique com o botão direito no arquivo ou use o botão azul "Compartilhar". Insira o e-mail da pessoa e escolha se ela pode apenas "Ler" ou também "Editar".'
  },
  {
    id: 'faq-ws2',
    program: 'Workspace',
    question: 'Como encontro a lixeira do Google Drive?',
    answer: 'No menu lateral esquerdo do Google Drive, clique na opção "Lixeira". Os arquivos ficam lá por 30 dias antes de serem excluídos permanentemente.'
  },
  {
    id: 'faq-ws3',
    program: 'Workspace',
    question: 'Onde vejo quem alterou meu documento?',
    answer: 'Vá em Arquivo > Histórico de versões > Ver histórico de versões. Você verá uma lista à direita com todas as alterações e quem as fez.'
  }
];

export const SHORTCUTS: Shortcut[] = [
  // Excel
  { id: 'ex-1', keys: 'Ctrl + ;', action: 'Inserir Data Atual', category: 'Inserção', program: 'Excel' },
  { id: 'ex-2', keys: 'Alt + =', action: 'AutoSoma de Células', category: 'Fórmulas', program: 'Excel' },
  { id: 'ex-3', keys: 'Ctrl + Shift + L', action: 'Ativar/Desativar Filtros', category: 'Dados', program: 'Excel' },
  { id: 'ex-4', keys: 'F2', action: 'Editar Célula Selecionada', category: 'Edição', program: 'Excel' },
  { id: 'ex-5', keys: 'Ctrl + Shift + $', action: 'Formatar como Moeda', category: 'Formatação', program: 'Excel' },
  { id: 'ex-6', keys: 'Ctrl + Shift + %', action: 'Formatar como Porcentagem', category: 'Formatação', program: 'Excel' },
  { id: 'ex-7', keys: 'Alt + Enter', action: 'Nova Linha na Mesma Célula', category: 'Edição', program: 'Excel' },
  
  // Word
  { id: 'wd-1', keys: 'Ctrl + Shift + C', action: 'Copiar Formatação', category: 'Formatação', program: 'Word' },
  { id: 'wd-2', keys: 'Ctrl + K', action: 'Inserir Hiperlink', category: 'Inserção', program: 'Word' },
  { id: 'wd-3', keys: 'Ctrl + Enter', action: 'Quebra de Página', category: 'Layout', program: 'Word' },
  { id: 'wd-4', keys: 'Ctrl + [', action: 'Diminuir Tamanho da Fonte', category: 'Formatação', program: 'Word' },
  { id: 'wd-5', keys: 'Ctrl + ]', action: 'Aumentar Tamanho da Fonte', category: 'Formatação', program: 'Word' },
  { id: 'wd-6', keys: 'Alt + Shift + D', action: 'Inserir Data Automática', category: 'Inserção', program: 'Word' },

  // PowerPoint
  { id: 'pp-1', keys: 'Ctrl + D', action: 'Duplicar Slide ou Objeto', category: 'Edição', program: 'PowerPoint' },
  { id: 'pp-2', keys: 'F5', action: 'Iniciar Apresentação', category: 'Apresentação', program: 'PowerPoint' },
  { id: 'pp-3', keys: 'Shift + F5', action: 'Apresentação do Slide Atual', category: 'Apresentação', program: 'PowerPoint' },
  { id: 'pp-4', keys: 'Ctrl + G', action: 'Agrupar Objetos Selecionados', category: 'Organização', program: 'PowerPoint' },
  { id: 'pp-5', keys: 'Ctrl + Shift + G', action: 'Desagrupar Objetos', category: 'Organização', program: 'PowerPoint' },

  // Workspace
  { id: 'ws-1', keys: 'Shift + Z', action: 'Adicionar Atalho para Pasta', category: 'Navegação', program: 'Workspace' },
  { id: 'ws-2', keys: 'Z', action: 'Mover Arquivo para Pasta', category: 'Organização', program: 'Workspace' },
  { id: 'ws-3', keys: '.', action: 'Abrir Configurações de Compartilhamento', category: 'Geral', program: 'Workspace' },
  { id: 'ws-4', keys: 'Shift + T', action: 'Criar Novo Documento', category: 'Geral', program: 'Workspace' },
];

export const TIPS: Tip[] = [
  {
    id: 'tip-1',
    program: 'Excel',
    title: 'Preenchimento Relâmpago (Flash Fill)',
    description: 'Deixe o Excel extrair ou combinar dados automaticamente sem fórmulas.',
    fullTutorial: 'O Flash Fill reconhece padrões. Se você tem "NOME SOBRENOME" e quer apenas o primeiro nome, digite o primeiro nome na coluna ao lado. Pressione Ctrl + E na célula abaixo e observe a mágica.',
    xp: 25
  },
  {
    id: 'tip-2',
    program: 'Excel',
    title: 'Tabelas Dinâmicas Expressas',
    description: 'Resuma grandes volumes de dados em segundos.',
    fullTutorial: 'Selecione seus dados e vá em Inserir > Tabela Dinâmica. Use o painel de campos para arrastar categorias para "Linhas" e valores para "Valores". É a ferramenta mais poderosa para análise.',
    xp: 40
  },
  {
    id: 'tip-3',
    program: 'Word',
    title: 'Navegação por Títulos',
    description: 'Organize documentos longos com facilidade.',
    fullTutorial: 'Aplique estilos de "Título 1" e "Título 2" (Página Inicial). Use Ctrl + F e clique na aba "Títulos" para ver a estrutura completa e navegar instantaneamente.',
    xp: 20
  },
  {
    id: 'tip-4',
    program: 'PowerPoint',
    title: 'Guia de Design Inteligente',
    description: 'Transforme slides simples em designs profissionais automaticamente.',
    fullTutorial: 'Com imagens e texto no seu slide, vá em Design > Ideias de Design. O Office 365 sugerirá layouts modernos e limpos baseados no seu conteúdo.',
    xp: 30
  },
  {
    id: 'tip-ws-1',
    program: 'Workspace',
    title: 'Busca Avançada no Drive',
    description: 'Encontre qualquer arquivo instantaneamente.',
    fullTutorial: 'Use filtros na barra de busca, como "type:pdf" ou "owner:eu". Isso economiza horas de procura manual em pastas bagunçadas.',
    xp: 25
  }
];

export const EXERCISES: Exercise[] = [
  {
    id: 'exe-1',
    program: 'Excel',
    title: 'Análise de Vendas Trimestrais',
    task: 'Use referências absolutas e funções básicas.',
    instructions: [
      'Calcule a comissão multiplicando a venda pela taxa fixa.',
      'Use o símbolo $ (ex: $B$1) para travar a célula da taxa.',
      'Arraste a fórmula para preencher o resto da tabela.'
    ],
    difficulty: 'Médio',
    xp: 60
  },
  {
    id: 'exe-2',
    program: 'Word',
    title: 'Sumário Automático',
    task: 'Crie um índice que se atualiza sozinho.',
    instructions: [
      'Formate dois parágrafos como "Título 1".',
      'Vá no topo do documento.',
      'Em Referências, selecione Sumário > Sumário Automático.'
    ],
    difficulty: 'Médio',
    xp: 50
  },
  {
    id: 'exe-ws-1',
    program: 'Workspace',
    title: 'Mestre da Colaboração',
    task: 'Configure permissões e histórico de versões.',
    instructions: [
      'Crie um documento "Teste de Equipe".',
      'Simule o compartilhamento com link de "Apenas Leitura".',
      'Encontre e restaure uma versão anterior do arquivo.'
    ],
    difficulty: 'Médio',
    xp: 70
  }
];

export const BADGES: Badge[] = [
  { id: 'badge-1', name: 'Iniciante Office', description: 'Completou seu primeiro exercício.', icon: 'Star', requirement: '1 exercício concluído' },
  { id: 'badge-2', name: 'Rápido no Gatilho', description: 'Visualizou 10 atalhos.', icon: 'Zap', requirement: '10 atalhos visualizados' },
  { id: 'badge-3', name: 'Especialista em Planilhas', description: 'Ganhou 500 XP em Excel.', icon: 'Table', requirement: '500 XP Excel' },
  { id: 'badge-4', name: 'Arquiteto da Nuvem', description: 'Ganhou 500 XP em Workspace.', icon: 'Cloud', requirement: '500 XP Workspace' }
];
