// MIGLI · Conteúdo & marca — fonte única da verdade
// ---------------------------------------------------
// Todo o texto visível ao usuário vive aqui. Tom: premium brasileiro,
// cinematográfico, natural — nunca tradução literal do inglês.

export const BRAND = {
  name: 'MIGLI',
  tagline: 'Experiências imersivas em 3D para o mercado imobiliário.',
  longTagline:
    'Transforme imóveis em experiências cinematográficas, navegáveis e inesquecíveis. Capture com o celular, deixe a IA reconstruir, compartilhe com um link.',
  region: 'Brasil',
}

export const NAV_LINKS = [
  { label: 'Experiência', href: '#viewer' },
  { label: 'Recursos', href: '#features' },
  { label: 'Capturar', href: '#upload' },
  { label: 'Planos', href: '#pricing' },
]

export const STATS = [
  { value: 2400, suffix: '', label: 'Imóveis digitalizados' },
  { value: 180, suffix: '', label: 'Imobiliárias parceiras' },
  { value: 340, suffix: '%', label: 'Mais engajamento' },
  { value: 58, suffix: 's', label: 'Tempo médio do tour' },
]

export const FEATURES = [
  {
    icon: 'Smartphone',
    title: 'Captura pelo celular',
    desc: 'Filme o imóvel com seu próprio smartphone. Sem equipamento profissional, sem complicação.',
  },
  {
    icon: 'Sparkles',
    title: 'Renderização em Gaussian Splatting',
    desc: 'A tecnologia mais avançada de reconstrução 3D do mundo, rodando direto no navegador do seu cliente.',
  },
  {
    icon: 'Zap',
    title: 'Tour pronto em minutos',
    desc: 'Da gravação ao link compartilhável em um piscar de olhos. Surpreenda seu cliente no mesmo dia.',
  },
  {
    icon: 'Link2',
    title: 'Link premium para compartilhar',
    desc: 'Cada imóvel recebe um link imersivo e elegante. Acessível pelo celular ou desktop, sem instalar nada.',
  },
  {
    icon: 'BarChart3',
    title: 'Insights em tempo real',
    desc: 'Descubra quanto tempo cada lead passou em cada cômodo. Inteligência que nenhum CRM tradicional oferece.',
  },
  {
    icon: 'Bot',
    title: 'IA que escreve por você',
    desc: 'Descrições, medidas e sugestões de preço geradas automaticamente. Você só aprova e publica.',
  },
]

export const UPLOAD_FORMATS = ['JPG · PNG', 'MP4 · MOV', 'PLY · SPLAT', 'OBJ · GLB', 'ZIP']

// Estágios do pipeline de reconstrução — mapeados em src/lib/upload/uploadQueue.js
export const UPLOAD_STEPS = [
  'Analisando arquivos',
  'Detectando geometria',
  'Reconstruindo em 3D',
  'Otimizando splats',
  'Gerando seu tour imersivo',
  'Tudo pronto ✦',
]

export const FOOTER_LINKS = [
  { label: 'Privacidade', href: '#' },
  { label: 'Termos', href: '#' },
  { label: 'Contato', href: '#' },
]

// Metadados do imóvel-demo usado no viewer da homepage
export const DEMO_PROPERTY = {
  name: 'Apartamento — Pinheiros, SP',
  status: 'Tour imersivo · ao vivo',
  rooms: ['3 quartos', '2 banheiros', '120 m²', '1 vaga'],
  price: 'R$ 1.250.000',
  area: '120 m²',
  highlight: 'Pé-direito alto',
}

// ---------------------------------------------------------------
// PLANO ÚNICO — MIGLI PRO
// Estratégia: simplicidade, baixo atrito, percepção premium.
// ---------------------------------------------------------------
export const PRICING = {
  badge: 'MIGLI PRO · Acesso completo',
  name: 'Migli Pro',
  price: 99,
  currency: 'R$',
  cycle: '/mês',
  oneLiner: 'Tudo o que você precisa para transformar imóveis em experiências.',
  benefits: [
    'Experiências imersivas ilimitadas',
    'Captura direta pelo celular',
    'Processamento por IA em minutos',
    'Hospedagem na nuvem incluída',
    'Links premium compartilháveis',
    'Visualizador 3D cinematográfico',
    'Suporte humano de verdade',
    'Sem fidelidade — cancele quando quiser',
  ],
  primaryCta: 'Começar agora',
  secondaryCta: 'Falar com a equipe',
  reassurance: '7 dias grátis · Sem cartão de crédito',
}

// Tom para microcopy de captura — usado pelo overlay de onboarding
export const CAPTURE_COPY = {
  permissionTitle: 'Pronto para escanear?',
  permissionBody:
    'A MIGLI usa a câmera do seu celular para criar o tour 3D. Nada sai do seu aparelho até você publicar.',
  permissionDenied:
    'O acesso à câmera foi bloqueado. Você precisa liberar pelas configurações do navegador.',
  permissionDeniedSteps: [
    'Toque no cadeado ou ícone de configurações ao lado do endereço',
    'Habilite "Câmera" para o site MIGLI',
    'Recarregue esta página',
  ],
  permissionUnavailable:
    'Este navegador não suporta captura de vídeo. Tente abrir no Safari (iOS) ou Chrome (Android) de um celular moderno.',
  cta: 'Liberar câmera',
  ctaRetry: 'Tentar novamente',
  privacyTitle: 'Privado',
  privacyText: 'Processado no seu aparelho até você publicar',
  mobileTitle: 'Feito para celular',
  mobileText: 'Otimizado para captura em smartphones',
}
