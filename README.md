# SrHarpia

Protótipo navegável de uma plataforma de observabilidade e APM para um cluster de microsserviços (`prd-south`). O visual foi construído a partir dos dois SVG de referência: a visão geral e o mapa topológico.

## Como abrir

Não há etapa de build. Basta servir a pasta:

```bash
npx serve .
# ou
python -m http.server 4173
```

Também é possível abrir `index.html` diretamente no navegador — todos os dados são simulados localmente e não há requisições de API.

## Telas

| Arquivo | Tela |
| --- | --- |
| `index.html` | Visão geral |
| `topologia.html` | Mapa topológico interativo |
| `servicos.html` | Catálogo de serviços |
| `servico.html?id=api-gateway` | Detalhe do serviço |
| `tracing.html` | Distributed tracing |
| `metricas.html` | Métricas de infraestrutura |
| `logs.html` | Logs em tempo real |
| `alertas.html` | Alertas e incidentes |
| `configuracoes.html` | Configurações |
| `second-brain.html` | Second brain com grafo MOC |

O plano completo, tokens e decisões estão em [`docs/plano-telas.md`](docs/plano-telas.md).

## Stack

- HTML multipágina, CSS próprio sobre Bootstrap 5.3 (vendorizado em `assets/vendor`).
- JavaScript sem framework.
- Gráficos, mapa topológico e grafo de conhecimento desenhados em SVG puro.
- Ícones de linha próprios em `assets/js/icons.js`.

## Estrutura

```
assets/
  css/app.css        tokens, componentes, responsivo
  img/logo.svg       marca extraída do protótipo
  img/mark.svg       símbolo para o favicon
  js/core.js         shell, menus, paleta (Ctrl K), drawers, avisos
  js/data.js         dados simulados determinísticos
  js/charts.js       área/linha/sparkline com tooltip
  js/topology.js     pan, zoom, arraste de nós, inspetor
  js/logs.js         stream ao vivo, regex e filtros
  js/tracing.js      lista e waterfall de spans
  js/brain.js        grafo MOC e leitor de notas
  js/*.js            controladores das demais telas
docs/plano-telas.md   planejamento das telas
```

## Padrões de interface

- Fundo `#0A0A0A`, superfícies `#1E1E1E`, acento `#D7FF00`.
- Tipografia Inter; IDs, IPs e métricas em JetBrains Mono.
- Estados sempre com ponto colorido e rótulo textual.
- Sem emojis, sem pílulas e sem badges.
- Área de toque mínima de 34px e navegação off-canvas abaixo de 900px.

## Second brain

O grafo MOC é gerado a partir das ligações declaradas nas notas (23 notas, 5 clusters). Clicar em um nó abre a nota; ligações e backlinks são recalculados e navegáveis. O grafo aceita zoom, arraste, filtro por cluster e modo "somente MOC".

## Dados

Tudo é simulado com PRNG de semente fixa: serviços, nós, arestas, séries temporais, logs e traces. O stream de logs continua crescendo em tempo real e pode ser pausado. Nenhuma credencial ou chamada externa faz parte do projeto.
