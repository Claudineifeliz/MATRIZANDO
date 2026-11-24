# MATRIZANDO — Laboratório Interativo de Álgebra Linear

Aplicação web educacional e interativa para experimentação visual, algébrica e criptográfica em **Álgebra Linear**, desenvolvida em HTML5, CSS3 e JavaScript puro (sem dependências externas de build) com foco em **Interação Humano-Computador (IHC)**, visualização dinâmica, acessibilidade e agentes pedagógicos interativos.

---

## Como executar

1. Clone ou extraia a pasta `MATRIZANDO`.
2. Abra o arquivo `index.html` diretamente no navegador (Chrome, Edge ou Firefox) **ou** execute com a extensão **Live Server** no Visual Studio Code.
3. > **Dica para a narração em voz natural:** no **Microsoft Edge** ou **Google Chrome**, as vozes neurais femininas em Português do Brasil (como *Francisca Natural*, *Thalita Natural* ou *Google português do Brasil*) são detectadas e selecionadas automaticamente na aula ao vivo da Central de Criptografia.

---

## Principais Funcionalidades e Novidades

### 1. Tela de Boas-Vindas Cinematográfica com Campo Magnético
- Exibida automaticamente sempre que o navegador abre ou recarrega a página (e pode ser revista a qualquer momento clicando em **`✦ Intro`** na barra superior ou **`TELA DE BOAS-VINDAS`** no rodapé).
- **Campo Magnético Interativo em Canvas (`welcomeMagnetCanvas`)**: partículas vetoriais e símbolos de Álgebra Linear (`[A]`, `det`, `λ`, `K⁻¹`, `mod 26`, `R²`) reagem ao movimento do mouse como um ímã em tempo real, formando linhas de campo e gerando pulsos expansivos ao clicar.
- **Animação de textos estilo vídeo**: 3 cenas coreografadas com transição suave de foco, barras diagonais douradas (`////`), moldura de arcos metálicos, linha de progresso e botão central magnético **`ENTRAR NO LABORATÓRIO →`** (também acionável via `Enter` ou `Esc`).

### 2. Identidade Visual, Layout e Navegação
- **Design arquitetônico de alto contraste**: fundo obsidian carbono com detalhes em dourado metálico e carmesim, tipografia técnica (`Barlow Condensed`, `Rajdhani`, `Inter` e `JetBrains Mono`), trilha técnica lateral, botão flutuante de voltar ao topo e **rodapé completo** com breadcrumb dinâmico, links rápidos, campo de inscrição, ícones sociais e divisória mecânica com chanfros opostos.
- **Barra Lateral Recolhível e Expansível**: alterne entre o modo completo (`296px`) e o trilho compacto de ícones (`78px`) clicando no botão de seta (`‹`) ou na área livre da barra lateral, com estado salvo automaticamente no `localStorage`.
- **Ícones SVG Duotone Personalizados**: todos os 7 itens da barra lateral e os 6 cards do dashboard utilizam ícones vetoriais próprios de alta legibilidade, com destaque ativo e aumento automático no modo recolhido.
- **Seletor de Temas em Menu Suspenso (`◑ Tema ▾`)**: escolha diretamente com prévia de paleta entre **Escuro**, **Claro** e **Alto Contraste** (todos com contraste auditado e redesenho instantâneo do plano cartesiano 2D).

### 3. Central de Criptografia — Grade Matricial & Aula ao Vivo com Voz Feminina Natural
- Suporte completo à **Cifra de Hill** em matrizes **`2×2`** e **`3×3`**, com validação em tempo real de invertibilidade módulo 26 (`mdc(det(K), 26) = 1`), gerador de chaves válidas, teste de chave inválida e tabela interativa `A=0 … Z=25`.
- **Resultado Direto + Barra Hero Output**:
  - Exibe instantaneamente a conclusão com contagem de blocos, referência compacta da matriz `K` (ou `K⁻¹`), botão **Copiar resultado**, pílulas clicáveis por bloco cifrado (com destaque cruzado e rolagem suave até o card correspondente) e o switch **`Mostrar cálculo intermediário`** (mostra/oculta o produto matricial bruto antes da redução `mod 26`).
- **Grade Responsiva de Blocos (3 / 2 / 1 colunas)**: cada bloco exibe a equação matricial com **colchetes matemáticos reais em CSS**, etiquetas das letras nos vetores de entrada/saída e botão individual **`🔊`** para ouvir a explicação daquele bloco.
- **Aula ao Vivo Opcional com Narração Natural (`▶ Assistir aula ao vivo (com voz)`)**:
  - Só é iniciada quando o usuário clicar (nunca interrompe o resultado direto).
  - Mini-player com equalizador animado, transcrição sincronizada, barra de progresso, controles `⏮ Anterior / ⏸ Pausar / Próximo ⏭ / ✕` e **seletor de voz**.
  - Motor de voz otimizado em PT-BR: prioriza vozes neurais femininas naturais, utiliza pitch nativo (`1.0`) e ritmo fluido (`0.96`), enfileira frases com pausas naturais sem cortes abruptos e aplica roteiro fonético para soletrar pares cifrados e símbolos (`K`, `K⁻¹`) sem distorções.
- **Gráfico de Frequência Limpo e Interativo**: gráfico de barras direto comparando `Original × Cifrado`, com eixo Y escalonado, filtros **`Comparar | Original | Cifrado`** e leitura instantânea ao passar o mouse em cada letra.

### 4. Agentes Pedagógicos Arrastáveis ("Professor ao Lado")
- Três mentores contextuais integrados: **Professor Matriz**, **Dra. Vetor** e **Agente Cipher**.
- **Arraste livre por toda a tela**: mova tanto o botão flutuante quanto o painel aberto (pela barra de título `⋮⋮`) para qualquer posição da tela com mouse ou toque, com limites automáticos na viewport e posição salva no `localStorage`.
- **Comportamento não intrusivo**: o popup só abre quando clicado pelo usuário (sinalizando novas dicas discretamente com pulso no indicador), fecha ao clicar em qualquer lugar fora dele na página ou com `Esc`, e executa o **Tour Guiado (Spotlight IHC)** na tela ativa.

### 5. Os 6 Módulos Interativos
1. **Central de Criptografia**: Cifra de Hill `2×2` / `3×3`, grade de blocos, cálculo intermediário, aula ao vivo narrada e gráfico de frequência.
2. **Sala de Investigação**: 4 dossiês investigativos de criptoanálise para quebrar chaves matriciais e decifrar mensagens interceptadas.
3. **Laboratório de Matrizes**: soma, multiplicação, transposta, determinante, inversa e resolução de sistemas lineares por Gauss-Jordan com mapa de calor (*heatmap*) e passo a passo.
4. **Transformações Visuais 2D**: plano cartesiano interativo em Canvas HiDPI com rotação contínua, matriz `2×2` editável, presets (escala, cisalhamento, reflexão, colapso `det = 0`), telemetria de determinante, traço e autovalores.
5. **Arena de Desafios**: quizzes dinâmicos com feedback explicativo, sequência de acertos (*streak*), ganho de XP, patentes e gráfico Radar de desempenho por tópico.
6. **Central de Aprendizagem**: lições guiadas de Álgebra Linear com mini-simuladores embutidos e controle de conclusão.

---

## Estrutura do Projeto

```text
MATRIZANDO/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   ├── tokens.css      # Design tokens, tipografia, barras //// e temas (Escuro, Claro, Alto Contraste)
    │   ├── welcome.css     # Tela de boas-vindas cinematográfica, arcos dourados e botão magnético
    │   ├── layout.css      # Shell, sidebar recolhível, ícones SVG, seletor de temas, trilha lateral e rodapé
    │   └── modules.css     # 6 módulos, grade de blocos da Cifra de Hill, mini-player, gráficos e popup arrastável
    └── js/
        ├── core/
        │   ├── store.js    # Estado global e persistência (XP, tema, fonte, sidebar recolhida, posição do agente)
        │   ├── welcome.js  # Motor Canvas do campo magnético, pulsos de clique e sequência de cenas da intro
        │   ├── charts.js   # Gráficos SVG limpos e interativos (barras com filtro/leitura, heatmap e radar)
        │   └── agents.js   # Mentores virtuais arrastáveis, fechamento por clique externo e Tour Spotlight IHC
        ├── crypto/
        │   ├── matrix.js   # Aritmética modular (mod 26), determinante, mdc e inversão matricial
        │   ├── hill.js     # Motor da Cifra de Hill (2×2 e 3×3) e normalização A–Z
        │   └── crypto-ui.js# Central de Criptografia, grade de blocos, cálculo intermediário e aula narrada PT-BR
        ├── lab/
        │   ├── lab-math.js # Operações matriciais em ℝ (soma, produto, transposta, det, inversa, Gauss-Jordan)
        │   └── lab-ui.js   # Interface do Laboratório de Matrizes + Heatmap + passo a passo
        ├── modules/
        │   ├── modules.js            # Catálogo dos 6 módulos com ícones SVG duotone
        │   ├── investigation-ui.js   # Sala de Investigação (4 dossiês criptográficos)
        │   ├── transformations-ui.js # Transformações Visuais 2D em Canvas interativo
        │   ├── challenges-ui.js      # Arena de Desafios com Radar de Competências
        │   └── learning-ui.js        # Central de Aprendizagem com mini-simuladores
        ├── navigation.js   # Roteamento SPA, Dashboard dinâmico e sincronização de breadcrumbs
        └── main.js         # Inicialização, sidebar recolhível, menu de temas, rodapé e atalhos de teclado
```

---

## Acessibilidade, IHC e Persistência

- **Controles de leitura**: ajuste de escala de fonte (`A−`, `A`, `A+`) de `88%` a `122%`.
- **Navegação por teclado**: setas direcionais (`↑`, `↓`, `←`, `→`) para navegar entre células das matrizes, atalho *Skip Link*, foco visível de alto contraste, tecla `Esc` para fechar menus/popups e suporte a `prefers-reduced-motion`.
- **Persistência local (`localStorage`)**: salva automaticamente nome do estudante, XP, patente, módulos visitados/concluídos, casos resolvidos, lições concluídas, estatísticas da Arena, tema escolhido, escala de fonte, estado recolhido da barra lateral e posição do popup do agente.
