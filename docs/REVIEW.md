# Revisão técnica do GremioLanding

Data da revisão: 9 de outubro de 2026

## Escopo e veredito

Revisão estática do código, configuração, documentação e fluxo de publicação. Veredito: **falhou**. A proposta tem uma base visual consistente e cuidados visíveis com conteúdo demonstrativo, preferência por movimento reduzido e links externos. Ainda há riscos concretos de desempenho durante a rolagem, recuperação incompleta de falhas no módulo 3D e lacunas de validação automatizada e privacidade para uma futura publicação oficial.

Não fiz validação visual em navegador, teste com leitor de tela, medição de desempenho, auditoria de dependências ou publicação. Esses pontos permanecem sem prova nesta revisão.

## Achados prioritários

### P1. Falha do WebGL pode derrubar a árvore da interface

Em `src/components/Crest3D.tsx:96-110`, o componente escolhe o modo 3D após testar a existência de um contexto WebGL. Em `src/App.tsx:181-182`, o `Suspense` cobre apenas o carregamento lazy e seu estado de espera. Não há tratamento de erro ao redor de `Crest3D` ou do `Canvas` para falhas posteriores, como erro ao criar o renderer, carregar a textura ou perder o contexto. O fallback 2D existe apenas quando a detecção inicial escolhe `still`.

**Impacto:** em um navegador que passa na detecção e falha durante a inicialização do Three.js, a interface pode apresentar erro de renderização em vez de manter o escudo estático.

**Correção recomendada:** envolver a experiência 3D em um limite de erro local que altere o modo para a imagem 2D. Confirmar com uma falha simulada de textura e uma falha de criação do renderer.

### P2. A rolagem força renderização do componente inteiro a cada quadro

Em `src/App.tsx:36-54`, o listener de rolagem atualiza `scrollProgress` dentro de `requestAnimationFrame`. O valor muda continuamente enquanto a página rola e é usado no topo do próprio `App`, que também contém todas as seções da página. Assim, uma página longa pode reconciliar novamente toda a árvore a cada quadro de rolagem.

**Impacto:** o custo cresce com o conteúdo e pode competir com o movimento do medalhão e a animação da página em dispositivos mais lentos.

**Correção recomendada:** manter a barra de progresso fora da árvore que contém as seções, ou atualizar sua escala por uma propriedade CSS sem renderizar todo o `App`. Manter o estado compacto do cabeçalho separado e atualizado apenas quando cruzar o limite de 90 pixels.

### P2. A galeria não garante o fim do gesto de arraste fora da área

Em `src/App.tsx:108-119`, o início e o fim do gesto são tratados no próprio contêiner da galeria. Não há captura do ponteiro. Se o usuário soltar o botão fora do contêiner, `onGalleryPointerUp` não recebe o evento e `dragStartRef` permanece preenchido. Uma interação posterior pode ser interpretada usando a posição antiga.

**Impacto:** em desktop, arrastar para fora da galeria pode deixar estado de gesto obsoleto e causar avanço ou retorno inesperado na próxima interação.

**Correção recomendada:** capturar o ponteiro no início do gesto ou limpar o estado em um listener de `pointerup` na janela, mantendo o cancelamento já existente.

### P2. Não há comando ou pipeline para testes de comportamento

`package.json:6-12` define lint, checagem de tipos, build e preview, mas não define teste unitário, teste de componentes ou teste de navegador. O workflow `.github/workflows/deploy.yml:45-50` executa lint, checagem de tipos e build antes de publicar.

**Impacto:** a automação atual detecta problemas estáticos e de compilação, mas não prova o comportamento do menu, da galeria, dos links de navegação ou do fallback do WebGL.

**Correção recomendada:** adicionar testes de comportamento para menu mobile, avanço e limites da galeria e conteúdo demonstrativo antes de evoluir a página para um site oficial. Incluir esses testes no workflow antes da etapa de publicação.

### P2. O carregamento de fontes depende de um serviço externo

`src/styles.css:1` importa Barlow Condensed e DM Sans de `fonts.googleapis.com`. `docs/ASSETS.md` registra as alternativas de sistema em `src/styles.css`, mas não há hospedagem local. Se o serviço estiver bloqueado ou indisponível, a página continua com fontes alternativas, porém a composição usa títulos em escala muito grande e pode mudar de quebra e espaçamento.

**Impacto:** a aparência depende de uma requisição a terceiro e a tipografia pode variar conforme rede e sistema. A requisição também expõe dados de conexão do visitante ao provedor de fontes.

**Correção recomendada:** para publicação oficial, decidir entre hospedar as fontes licenciadas localmente ou documentar e avaliar a dependência externa junto da política de privacidade. Validar a composição com as fontes alternativas.

## Pontos de atenção para publicação oficial

- `index.html:7` define `noindex, nofollow`. Isso é coerente com a proposta demonstrativa e precisa ser revisto explicitamente antes de uma publicação oficial. A regra não impede que qualquer pessoa com o endereço acesse a página, como o próprio `docs/README.md` explica.
- `src/App.tsx:196-199` apresenta a data de fundação como confirmada. `docs/ASSETS.md` limita a evidência ao cadastro da Liga Santoandreense de 2025, enquanto `docs/CONTENT_PENDING.md` pede validação institucional antes do uso oficial. Manter a atribuição da fonte ou registrar aprovação direta do clube antes de tratar o dado como institucional.
- `docs/CONTENT_PENDING.md` lista pendências de identidade, arena, futebol, galeria, parceiros, contato e governança. São dependências de produto e autorização, não tarefas que a revisão possa resolver por código.
- `src/App.tsx:233-234` implementa uma galeria com controles próprios, rolagem horizontal, teclado e gesto de mouse. A revisão do código não substitui teste com teclado, toque e tecnologia assistiva nos navegadores de destino.
- `src/components/Crest3D.tsx:96-110` considera movimento reduzido e ponteiro grosseiro ao escolher o modo estático. A verificação de `prefers-reduced-motion` está presente. Ainda falta validar visualmente a troca de modo e a recuperação quando a preferência muda durante a sessão.

## Práticas a implementar

1. Definir testes automatizados para o comportamento interativo e executá-los no workflow antes de publicar.
2. Isolar os elementos que mudam com a rolagem para evitar renderização da página inteira em cada quadro.
3. Ter fallback 2D também para erros de execução do WebGL, além da seleção preventiva de modo.
4. Validar navegação e galeria com teclado, leitor de tela, toque e preferência de movimento reduzido.
5. Antes de tornar o site oficial, obter validação institucional do conteúdo e dos direitos de uso, resolver as pendências de `docs/CONTENT_PENDING.md` e decidir sobre fontes externas e indexação.
6. Medir o desempenho em um dispositivo móvel de referência antes de ampliar os efeitos visuais. Esta revisão não inclui medições.

## Evidência ainda necessária

A revisão não executou lint, checagem de tipos ou build, e não abriu a página em navegador. Portanto, não confirma o estado visual, o comportamento real em navegadores, os tempos de carregamento ou o resultado dos comandos existentes. O workflow contém as etapas estáticas de validação, mas não há log de execução disponível nesta análise.
