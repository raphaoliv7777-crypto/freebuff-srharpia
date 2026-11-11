# Plano de telas — SrHarpia

Plataforma de observabilidade e APM para o cluster `prd-south`. O plano abaixo foi derivado dos dois protótipos fornecidos (`MacBook Air - 1.svg` → Visão geral; `MacBook Air - 2.svg` → Mapa topológico) e do escopo do produto: saúde de serviços, CPU/memória, topologia interativa, séries temporais de alta frequência, logs em tempo real e distributed tracing.

## 1. Princípios extraídos do protótipo

- Fundo `#0A0A0A`, superfícies `#1E1E1E`, elevação `#2A2A2A`, bordas de 1px em `rgba(255,255,255,.045)` e raio de 8px nos cartões.
- Acento principal lima `#D7FF00`; verde de saúde `#1AFF53`, âmbar `#FFC61A`, vermelho `#FF2121`; azul `#6F9AFF`, magenta `#D3009E` e roxo `#8200BA` apenas em métricas.
- Tipografia Inter, títulos com tracking negativo (−0,028em), números tabulares, IPs e IDs em JetBrains Mono.
- Sidebar fixa de 232px com logo, navegação de 40px de altura e versão no rodapé. Conteúdo com 40px de respiro.
- Ícones de linha (traço 1,7), nunca preenchidos, sempre acompanhados de rótulo textual.
- Status é sempre **ponto colorido + texto** — sem pílulas, sem badges, sem emojis. A cor nunca é o único canal de informação.

## 2. Sitemap

| Tela | Rota | Objetivo | Blocos principais |
| --- | --- | --- | --- |
| Visão geral | `index.html` | Resumo operacional do dia | 4 KPIs, tráfego de requisições, status dos serviços, últimos eventos |
| Mapa topológico | `topologia.html` | Entender dependências e latência entre nós | mapa interativo (pan/zoom/arraste), inspetor de nó, legenda de latência, logs resumidos, uso das peças |
| Serviços | `servicos.html` | Catálogo e triagem | resumo de saúde, busca, filtros por tipo/saúde, tabela com SLO e dependências |
| Detalhe do serviço | `servico.html?id=` | Investigação por serviço | KPIs, percentis p50/p95/p99, requisições, metas e orçamento de erro, endpoints, dependências, logs |
| Distributed tracing | `tracing.html` | Rastrear requisições ponta a ponta | resumo, filtros, lista de traces com duração relativa, latência por serviço, drawer com waterfall |
| Métricas | `metricas.html` | Saúde de infraestrutura | seletor de nó, janelas 1h/6h/24h/7d, CPU, memória, disco, rede, top processos, eventos |
| Logs | `logs.html` | Depuração em tempo real | stream ao vivo, pausa, busca textual/regex, filtros combináveis, detalhe estruturado |
| Alertas | `alertas.html` | Operação do plantão | ativos com reconhecer/silenciar, histórico de incidentes, regras com ativação |
| Configurações | `configuracoes.html` | Administração | workspace, notificações, retenção, integrações, chaves, equipe |
| Second brain | `second-brain.html` | Conhecimento do projeto | grafo MOC interativo, índice de conteúdo, leitor de notas com ligações e backlinks |

Navegação: sidebar em todas as telas, busca global (Ctrl/Cmd + K) com telas, serviços e notas, e links contextuais entre serviço ↔ tracing ↔ logs ↔ topologia ↔ second brain.

## 3. Componentes compartilhados

- **Shell**: sidebar fixa (off-canvas abaixo de 900px), cabeçalho de página com título, subtítulo e ações.
- **Cartões**: `.card` com cabeçalho de 18/24px, corpo e rodapé opcionais.
- **KPI**: rótulo, variação com seta, valor com unidade, medida (barra ou sparkline).
- **Gráficos**: SVG próprio (`assets/js/charts.js`) com grade pontilhada, área em gradiente lima, tooltip no hover e eixo de tempo. Nenhuma biblioteca de terceiros.
- **Tabelas**: cabeçalho 11px cinza, linhas de 12,5px, hover discreto, colunas numéricas alinhadas à direita.
- **Estados**: ponto + rótulo; barras de medição; texto monoespaçado para IDs.
- **Sobreposições**: paleta de comandos, drawer de trace/nota, inspetor do mapa, menus de contexto e avisos (toast).

## 4. Second brain e grafo MOC

Modelo de conhecimento em cinco clusters, com um nó raiz **Mapa de conteúdo (MOC)** ligado aos hubs de cada área. Cada nota é um objeto com `slug`, `title`, `cluster`, `x`, `y`, `tags`, `links`, `body`, `owner` e `updated`.

- **Arquitetura** (lima): arquitetura de referência, mapa de serviços, gateway, mensageria, cache.
- **Observabilidade** (verde): pilares, métricas, tracing, logs, SLO, alertas.
- **Operação** (âmbar): runbooks de latência e de nó fora, capacidade, postmortem.
- **Dados e retenção** (magenta): modelo de dados, retenção em camadas, amostragem.
- **Decisões** (azul): ADR-001 a ADR-004.

O grafo é gerado a partir das ligações reais — não é uma ilustração. Arestas do MOC são mais fortes; ao abrir uma nota, vizinhos são destacados, ligações de saída e backlinks são recalculados, e o leitor permite navegar de nota em nota. O grafo aceita zoom, arraste, filtro por cluster, filtro “somente MOC” e busca.

## 5. Stack e arquitetura de arquivos

- HTML estático multipágina, CSS próprio sobre Bootstrap 5.3 (vendorizado, sem CDN em tempo de execução) e JavaScript sem framework.
- `assets/css/app.css` — tokens e componentes.
- `assets/js/icons.js` — biblioteca de ícones de linha.
- `assets/js/core.js` — shell, menus, paleta, drawers, avisos e utilidades.
- `assets/js/data.js` — dados simulados determinísticos (serviços, nós, arestas, séries, logs, traces e notas).
- `assets/js/charts.js` — gráficos SVG com tooltip e re-render no resize.
- `assets/js/*.js` — controladores por tela (`topology`, `services`, `service`, `tracing`, `metrics`, `logs`, `alerts`, `settings`, `brain`).

## 6. Dados simulados

Todos os números são gerados por PRNG com semente fixa, portanto a interface é estável entre recarregamentos. O stream de logs continua crescendo em tempo real (1 a 2 eventos a cada 1,8s) e pode ser pausado. Nenhuma chamada de rede é feita.

## 7. Checklist de aceite

- [x] Todas as telas navegáveis pela sidebar e por links contextuais.
- [x] Padrão visual e logo originais preservados.
- [x] Sem emojis, sem pílulas e sem badges.
- [x] Status sempre com ponto e texto.
- [x] Gráficos, mapa e grafo funcionais sem bibliotecas externas.
- [x] Second brain com grafo MOC, índice, leitor, ligações e backlinks.
- [x] Layout responsivo até 360px, com sidebar off-canvas.
- [ ] Integração real de telemetria (fora do escopo deste protótipo).
