export const club = {
  fullName: 'Grêmio Esportivo Jardim Santo Alberto',
  shortName: 'Santo Alberto',
  foundation: '04.02.1974',
  city: 'Santo André, SP',
  arena: 'Arena Santo Alberto',
  instagram: 'https://www.instagram.com/gremiosantoalberto/',
  instagramLabel: '@gremiosantoalberto',
} as const;

export const navigation = [
  { label: 'Início', href: '#inicio' },
  { label: 'História', href: '#historia' },
  { label: 'Nossa casa', href: '#arena' },
  { label: 'Futebol', href: '#futebol' },
  { label: 'Em campo', href: '#em-campo' },
  { label: 'Momentos', href: '#momentos' },
  { label: 'Faça parte', href: '#faca-parte' },
  { label: 'Parceiros', href: '#parceiros' },
  { label: 'Contato', href: '#contato' },
] as const;

export const gallery = [
  {
    title: 'A chegada',
    caption: 'Um lugar para o encontro antes de a bola rolar.',
    art: 'arrival',
    image: 'football-illustrative.webp',
  },
  {
    title: 'As linhas',
    caption: 'O campo como ponto de encontro do bairro.',
    art: 'lines',
    image: 'arena-illustrative.webp',
  },
  {
    title: 'O detalhe',
    caption: 'As cores que atravessam gerações.',
    art: 'fabric',
    image: 'ball-illustrative.webp',
  },
  {
    title: 'A arquibancada',
    caption: 'Toda história precisa de quem a acompanha.',
    art: 'stands',
    image: 'terrace-illustrative.webp',
  },
] as const;

export const demoUpdates = [
  {
    type: 'Agenda ilustrativa',
    title: 'Um próximo encontro no campo',
    detail: 'Exemplo de como uma partida futura seria apresentada.',
    symbol: '90′',
  },
  {
    type: 'Notícia ilustrativa',
    title: 'O futebol que reúne o bairro',
    detail: 'Espaço para notícias, registros e histórias do clube.',
    symbol: 'GSA',
  },
] as const;
