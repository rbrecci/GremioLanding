# Revisão técnica do GremioLanding

Revisão inicial: 9 de outubro de 2026. Atualização: 10 de outubro de 2026.

## Escopo e veredito atual

Esta revisão cobre código, configuração, documentação e o fluxo preparado para publicação. Os cinco achados técnicos prioritários da revisão inicial receberam correções. O projeto passou em 9 testes de comportamento, lint, checagem de tipos e build com a base `/GremioLanding/`. O preview local com essa base renderizou; menu e galeria foram conferidos visualmente.

**Veredito para a proposta demonstrativa: passou nos critérios verificados.** Isso não equivale a aprovar uma publicação oficial. Ainda faltam autorização e validação do conteúdo pelo clube, medição de desempenho em dispositivo de referência e teste com tecnologia assistiva e hardware real.

## Achados técnicos resolvidos

| Prioridade inicial | Problema e impacto observado na revisão inicial | Correção implementada e evidência |
|---|---|---|
| P1 | Uma falha após a detecção inicial do WebGL podia derrubar a interface em vez de manter o escudo estático. | `src/App.tsx:25-60` envolve o módulo 3D em um limite de erro com `BrandMark` como fallback. `src/components/Crest3D.tsx` também troca para imagem estática quando recebe `webglcontextlost`. `src/App.test.tsx` simula falha de renderização e confirma que a página permanece presente. Perda real do contexto e falha real de textura ainda não foram reproduzidas em navegador. |
| P2 | O progresso de leitura atualizava o estado de `App` durante a rolagem e podia renderizar novamente toda a página. | `src/App.tsx:63-86` isola o progresso em `ReadingProgress`; `src/App.tsx:102-111` atualiza a classe do cabeçalho sem estado de `App`. Um teste de rolagem confirma que o módulo 3D não renderiza novamente e que `aria-valuenow` muda. `src/styles.css` usa uma animação CSS de rolagem quando disponível, com o valor inline como alternativa. O ganho em tempo de quadro ainda não foi medido. |
| P2 | Soltar o mouse fora da galeria podia deixar o gesto anterior ativo. | `src/App.tsx:165-178` captura o ponteiro no início do arraste; a galeria limpa o gesto em cancelamento e perda da captura. Testes verificam a chamada de `setPointerCapture` e o descarte após `lostpointercapture`. O gesto em dispositivos reais ainda precisa de validação. |
| P2 | O projeto e o workflow não tinham testes de comportamento. | `package.json` oferece `npm test` com Vitest. `src/App.test.tsx` contém 9 testes para menu, links e conteúdo demonstrativo, galeria, fallback do escudo, preferência de movimento, ponteiro grosseiro e isolamento da rolagem. `.github/workflows/deploy.yml` usa Node 24 e executa os testes antes do build. A execução do workflow remoto após push ainda não foi observada nesta atualização. |
| P2 | A tipografia dependia de uma requisição ao Google Fonts. | `src/main.tsx` importa Barlow Condensed e DM Sans pelos pacotes Fontsource; `src/styles.css` removeu o import remoto. O build gerou os arquivos de fonte sob `dist/assets`, e a busca no build não encontrou referências a Google Fonts. `docs/ASSETS.md` registra origem e licença. Ainda convém conferir composição e quebras de texto nos navegadores de destino. |

## Pontos pendentes e decisões de publicação

### P1. Conteúdo e direitos de uso ainda impedem uma publicação oficial

`docs/CONTENT_PENDING.md` lista validações de identidade, história, arena, futebol, galeria, parceiros e contato. `src/App.tsx:252-253` apresenta a data de fundação no texto e no destaque visual, enquanto `docs/ASSETS.md:24` identifica o cadastro da Liga Santoandreense de 2025 como fonte e pede confirmação direta com o clube para uso oficial. `public/crest.png` tem origem documentada, mas `docs/ASSETS.md:7` registra autorização de uso e redistribuição pendente.

**Ação:** obter aprovação do clube para fatos, marca, contatos e imagens antes de mudar a apresentação do projeto para oficial. Substituir material ilustrativo por arquivos autorizados e registrar créditos e consentimentos, especialmente para fotos com menores. O aviso de proposta independente em `src/App.tsx` e a lista de pendências devem permanecer até essa decisão.

### P2. O módulo 3D ainda exige medição de desempenho

O build produz um chunk lazy do escudo 3D com 916,44 kB, ou 243,42 kB comprimidos com gzip. `src/App.tsx:37-60` evita importar o módulo em dispositivos com `pointer: coarse` ou preferência por movimento reduzido, o que limita o custo nesses casos. Em desktop com ponteiro fino, o chunk continua relevante para carregamento e execução. O aviso de tamanho do Vite é um sinal para investigar, não prova de lentidão percebida.

**Ação:** medir carregamento, tempo de interação e fluidez em um desktop modesto e em um celular de referência. Se a experiência for prejudicada, comparar a versão 2D como padrão com a versão 3D atual antes de otimizar geometria ou trocar bibliotecas. Esta revisão não inclui essas medições.

### P2. Falta validar acessibilidade e interação em ambiente real

Os testes automatizados cobrem estados e eventos da galeria e do menu, mas usam `jsdom` e um módulo 3D simulado. O preview local confirmou renderização e uso visual de menu e galeria, sem substituir leitor de tela, teclado completo, toque e mudança da preferência de movimento durante a sessão. `src/App.tsx:37-58` reage à mudança de `matchMedia`, mas esse comportamento dinâmico não tem teste dedicado.

**Ação:** percorrer a página com teclado e leitor de tela, testar arraste em mouse e toque reais, alternar movimento reduzido com a página aberta e observar a recuperação após perda de contexto WebGL. Registrar navegador, dispositivo e resultado de cada caso.

### P2. A publicação depende de uma decisão explícita sobre indexação

`index.html:7` define `noindex, nofollow`, apropriado para a proposta demonstrativa. Essa meta não restringe o acesso a quem possui o endereço.

**Ação:** manter a meta enquanto o projeto for demonstração. Antes de uma publicação oficial, revisar indexação junto das aprovações de conteúdo e da configuração do domínio.

## Evidência e limites desta atualização

- `npm test`: 9 testes aprovados após as correções. Antes da implementação, a suíte registrou falhas para captura do ponteiro, fallback WebGL, renderização durante rolagem e escolha do escudo estático em movimento reduzido e ponteiro grosseiro.
- `npm run lint` e `npm run typecheck`: concluídos sem erros.
- `VITE_BASE_PATH=/GremioLanding/ npm run build`: concluído. O HTML e os assets gerados usam a base `/GremioLanding/`; o build emite aviso para o chunk 3D de 916,44 kB.
- Preview local da build com a base correta: página renderizada, com menu e galeria conferidos visualmente.
- Sem evidência nesta revisão: execução remota do GitHub Actions, métricas de desempenho, dispositivo físico, leitor de tela, falha real de textura ou perda real de contexto WebGL.
