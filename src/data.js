export const CARDS = [
  { id:'bulb',    name:'Bulbizarre',  emoji:'🌿', rarity:'common',    buyBase:3,  sellBase:2,  power:30 },
  { id:'sala',    name:'Salamèche',   emoji:'🦎', rarity:'common',    buyBase:4,  sellBase:3,  power:35 },
  { id:'cara',    name:'Carapuce',    emoji:'🐢', rarity:'common',    buyBase:3,  sellBase:2,  power:32 },
  { id:'pika',    name:'Pikachu',     emoji:'⚡', rarity:'common',    buyBase:5,  sellBase:4,  power:40 },
  { id:'meow',    name:'Miaouss',     emoji:'🐱', rarity:'common',    buyBase:2,  sellBase:1,  power:25 },
  { id:'psy',     name:'Psykokwak',   emoji:'🦆', rarity:'common',    buyBase:3,  sellBase:2,  power:28 },
  { id:'geno',    name:'Gengar',      emoji:'👻', rarity:'common',    buyBase:4,  sellBase:3,  power:38 },
  { id:'rondou',  name:'Rondoudou',   emoji:'🎤', rarity:'common',    buyBase:2,  sellBase:1,  power:22 },
  { id:'gyara',   name:'Léviator',    emoji:'🐉', rarity:'rare',      buyBase:15, sellBase:12, power:70 },
  { id:'lapras',  name:'Lokhlass',    emoji:'🦋', rarity:'rare',      buyBase:12, sellBase:10, power:65 },
  { id:'snorlax', name:'Ronflex',     emoji:'😴', rarity:'rare',      buyBase:18, sellBase:15, power:80 },
  { id:'vaporeon',name:'Aquali',      emoji:'💧', rarity:'rare',      buyBase:14, sellBase:11, power:72 },
  { id:'mewtwo',  name:'Mewtwo',      emoji:'🔮', rarity:'ultra',     buyBase:35, sellBase:30, power:110 },
  { id:'mew',     name:'Mew',         emoji:'🌸', rarity:'ultra',     buyBase:40, sellBase:35, power:105 },
  { id:'dracau',  name:'Dracaufeu',   emoji:'🔥', rarity:'legendary', buyBase:80, sellBase:70, power:150 },
];

export const MARKET_EVENTS = [
  { label:'📊 Marché calme aujourd\'hui', mult:1.0 },
  { label:'📈 Prix en hausse !',          mult:1.3 },
  { label:'🛍️ Soldes aujourd\'hui !',     mult:0.75 },
  { label:'⭐ Ultra Rares en vedette !',   mult:1.5 },
  { label:'🚀 Tout monte !',              mult:1.4 },
  { label:'📉 Légère baisse...',          mult:0.9 },
];

export const BOOSTER_TYPES = [
  { id:'basic', label:'Basic', emoji:'📦', price:8  },
  { id:'feu',   label:'Feu',   emoji:'🔥', price:20 },
  { id:'dore',  label:'Doré',  emoji:'✨', price:40 },
];

export const LEVEL_XP_THRESHOLDS = [10, 30, 60, 100, 160];
export const ALBUM_CAPS = [10, 20, 40, 60, 80, 100];
export const NAIM_STARTER_IDS = ['bulb','sala','cara','pika','meow','psy','geno','rondou','gyara','dracau'];

export const BONPAPA_QUOTES = [
  '"Mon petit, chaque carte a de la valeur !"',
  '"Achète bas, vends haut — la sagesse du marché !"',
  '"Les rares d\'aujourd\'hui sont les trésors de demain !"',
  '"Patience et persévérance font les grands marchands !"',
  '"Ne vends jamais ta Dracaufeu, mon fils !"',
  '"Le vrai trésor c\'est de partager ta passion !"',
];

export const THEO_DIALOGS = [
  'Bienvenue !', 'Nouvelles cartes fraîches !',
  'Regarde cette rare... 👀', 'Les boosters sont top !',
  'Théo conseille : achète des rares !',
];

export const RAPH_DIALOGS = [
  'Regarde les rares...', 'Ouais, les boosters c\'est cool 🎧',
  'Ce Mewtwo est fou !', 'J\'adore les légendaires 🔥',
  'Un booster Doré, t\'as vu ?',
];
