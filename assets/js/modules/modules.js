// ==========================================================================
// MATRIZANDO — Catálogo Central dos 6 Módulos Interativos
// ==========================================================================

window.MatrizandoModules = [
  {
    id: 'criptografia',
    number: '01',
    category: 'CRIPTOGRAFIA',
    title: 'Central de criptografia',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><circle cx="12" cy="15.5" r="1.6" fill="currentColor"/><path d="M12 17.1V18.8"/></svg>`,
    color: 'cyan',
    featured: true,
    description: 'Codifique e decodifique mensagens com a Cifra de Hill (2×2 e 3×3), aritmética modular e gráficos de frequência.'
  },
  {
    id: 'investigacao',
    number: '02',
    category: 'INVESTIGAÇÃO',
    title: 'Sala de investigação',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.8"/><path d="M15.6 15.6 21 21"/><path d="M10.5 7.4v6.2M7.4 10.5h6.2"/></svg>`,
    color: 'violet',
    featured: false,
    description: 'Resolva 4 dossiês criptográficos quebrando chaves matriciais interceptadas e reconstruindo vetores perdidos.'
  },
  {
    id: 'laboratorio',
    number: '03',
    category: 'MATRIZES',
    title: 'Laboratório de matrizes',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4H4v16h3M17 4h3v16h-3"/><rect x="8.2" y="7.2" width="3" height="3" rx="0.7" fill="currentColor"/><rect x="12.8" y="7.2" width="3" height="3" rx="0.7"/><rect x="8.2" y="13.8" width="3" height="3" rx="0.7"/><rect x="12.8" y="13.8" width="3" height="3" rx="0.7" fill="currentColor"/></svg>`,
    color: 'blue',
    featured: false,
    description: 'Calcule soma, produto, transposta, determinante, inversa e sistemas por Gauss-Jordan com mapas de calor.'
  },
  {
    id: 'transformacoes',
    number: '04',
    category: 'VISUALIZAÇÃO',
    title: 'Transformações visuais',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V5M4 20h15"/><path d="M2 7l2-2 2 2M17 18l2 2-2 2"/><polygon points="9,15 12,8 20,6 17,13" fill="currentColor" fill-opacity="0.22"/></svg>`,
    color: 'pink',
    featured: false,
    description: 'Manipule matrizes 2×2 em tempo real no plano cartesiano e observe rotações, cisalhamento e área do determinante.'
  },
  {
    id: 'desafios',
    number: '05',
    category: 'GAMIFICAÇÃO',
    title: 'Arena de desafios',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2 2 0 0 0 0 4H7M17 6h2.5a2 2 0 0 1 0 4H17"/><path d="M12 14v5M8.5 20h7"/><path d="M12.4 6.6 10.6 9.5h2l-.6 2.5 2.4-3.1h-2l.4-2.3Z" fill="currentColor"/></svg>`,
    color: 'orange',
    featured: false,
    description: 'Teste seu raciocínio com desafios dinâmicos, acumule XP, mantenha sequências e acompanhe seu radar de domínio.'
  },
  {
    id: 'aprendizagem',
    number: '06',
    category: 'APRENDIZAGEM',
    title: 'Central de aprendizagem',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H11a2 2 0 0 1 2 2v14l-1-.6a3.5 3.5 0 0 0-1.8-.5H5.5A2.5 2.5 0 0 1 3 16.4V6.5Z"/><path d="M21 6.5A2.5 2.5 0 0 0 18.5 4H13a2 2 0 0 0-2 2v14l1-.6a3.5 3.5 0 0 1 1.8-.5h4.7A2.5 2.5 0 0 0 21 16.4V6.5Z"/><path d="M6.5 8.5h2.5M6.5 12h2.5M15 8.5h2.5M15 12h2.5"/></svg>`,
    color: 'green',
    featured: false,
    description: 'Estude os fundamentos de Álgebra Linear com lições guiadas, simuladores embutidos e checklists de progresso.'
  }
];
