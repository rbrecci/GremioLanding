# Grêmio Santo Alberto: proposta conceitual

Landing page independente criada por RBrecci para apresentar uma possível presença digital do Grêmio Esportivo Jardim Santo Alberto. É um protótipo público de demonstração e não representa o site oficial do clube. Conteúdo de exemplo e imagens ilustrativas são identificados na interface e registrados em [ASSETS.md](ASSETS.md).

## Stack

React 19, Vite 8, TypeScript 5.9, CSS próprio, Three.js, React Three Fiber e Drei. Não há backend, cadastro, envio de formulário ou atualização automática de partidas. O projeto gera arquivos estáticos em `dist/`.

Barlow Condensed e DM Sans são carregadas pelo Google Fonts. A página usa fontes alternativas do sistema quando esse serviço não estiver disponível.

Requisito: Node.js 20.19 ou superior, ou Node.js 22.12 ou superior. O workflow usa Node.js 22.

## Executar localmente

```bash
npm ci
npm run dev
```

O endereço local aparece no terminal do Vite. Para verificar o código e gerar a versão estática:

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

`npm run build` também executa a conferência de tipos. `npm run preview` serve os arquivos de `dist/` localmente.

## GitHub Pages

O workflow em `.github/workflows/deploy.yml` executa após push em `main` ou acionamento manual. Ele instala com `npm ci`, roda lint, confere tipos, gera `dist/` e envia o artefato ao GitHub Pages. Para publicar, selecione **Settings > Pages > Build and deployment > Source: GitHub Actions** no repositório e acompanhe a execução em **Actions**. O workflow preparado por si só não publica o site.

O Vite usa `VITE_BASE_PATH` para definir o caminho dos arquivos. Localmente, o padrão é `/`. No workflow, o valor é calculado pelo nome real do repositório: `/GremioLanding/` neste caso. Para um repositório de site de usuário com nome terminado em `.github.io`, ele usa `/`. Uma variável de repositório chamada `VITE_BASE_PATH` pode substituir esse valor, inclusive para domínio próprio. Informe um caminho iniciado e terminado em `/`.

Para testar localmente o mesmo caminho previsto para esta publicação, no PowerShell:

```powershell
$env:VITE_BASE_PATH = '/GremioLanding/'
npm run build
npm run preview
```

No Git Bash:

```bash
VITE_BASE_PATH=/GremioLanding/ npm run build
npm run preview
```

Abra o endereço do preview acrescido de `/GremioLanding/`. Ao concluir o teste no PowerShell, use `Remove-Item Env:VITE_BASE_PATH` para voltar à base local padrão. Caminhos de assets em `public/` devem usar `import.meta.env.BASE_URL` no código. Links entre seções usam âncoras, sem depender de rotas do servidor.

O fluxo segue as orientações oficiais do [Vite para GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages) e do [GitHub Pages para workflows próprios](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Os metadados incluem `noindex, nofollow` para desencorajar indexação da proposta. Isso não restringe acesso público ao endereço do GitHub Pages.

## Conteúdo e estrutura

- `src/App.tsx` reúne as seções e a navegação da página.
- `src/components/` contém componentes visuais e a experiência 3D.
- `src/styles.css` define o sistema visual e os layouts responsivos.
- `public/` guarda o escudo de referência, o favicon conceitual e as imagens ilustrativas.
- `docs/DESIGN.md` registra as decisões de direção de arte.
- `docs/ASSETS.md` registra origem, classificação e autorização de cada recurso visual.
- `docs/CONTENT_PENDING.md` reúne os dados e permissões necessários para eventual uso oficial.

Para atualizar textos ou exemplos, edite o conteúdo demonstrativo do aplicativo e preserve as identificações visíveis de dados simulados. Antes de substituir imagens, confirme a autorização de uso, registre a nova origem em `docs/ASSETS.md` e revise textos alternativos e créditos. Antes de converter a proposta em site oficial, resolva os itens de `docs/CONTENT_PENDING.md` com o clube.

## Créditos

Conceito e desenvolvimento: [RBrecci](https://www.linkedin.com/in/rbrecci). Informações públicas de referência: [Liga Santoandreense, cadastro de 2025](https://ligasa.com.br/2025/Times1.php?cat=Terceira&time=417). A presença de um recurso público no projeto não equivale a autorização institucional para uso oficial.
