import {
  CARDS, MARKET_EVENTS, BOOSTER_TYPES,
  LEVEL_XP_THRESHOLDS, ALBUM_CAPS,
  NAIM_STARTER_IDS, BONPAPA_QUOTES,
} from './data.js';

const SUPABASE_URL = 'https://sabbaglzwwodifqkvrsv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LkiwgwGckr_WSQWHMRmCWw_XXIV1Ac0';

async function sbFetch(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=representation' : '',
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

export async function saveGame(playerName, state) {
  return sbFetch('/saves?on_conflict=player_name', 'POST', {
    player_name: playerName.toLowerCase().trim(),
    game_state: state,
  });
}

export async function loadGame(playerName) {
  const rows = await sbFetch(`/saves?player_name=eq.${encodeURIComponent(playerName.toLowerCase().trim())}&select=game_state`);
  return rows && rows[0] ? rows[0].game_state : null;
}

export function defaultState(playerName) {
  const album = NAIM_STARTER_IDS.map(id => {
    const c = CARDS.find(x => x.id === id);
    return { ...c, boughtPrice: 0, fromNaim: true };
  });
  return {
    playerName,
    day: 1,
    money: 0,
    xp: 0,
    level: 1,
    album,
    shopCards: generateShopCards(),
    shopRefreshDay: 1,
    boostersUsed: 0,
    bonPapaAvailable: false,
    duelDoneToday: false,
    bourseLeft: 5,
    bourseLastDay: 0,
    marketMult: 1.0,
    marketLabel: '📊 Marché calme aujourd\'hui',
  };
}

export function generateShopCards() {
  const commons  = CARDS.filter(c => c.rarity === 'common');
  const rares    = CARDS.filter(c => c.rarity === 'rare');
  const others   = CARDS.filter(c => c.rarity !== 'common' && c.rarity !== 'rare');
  const pool     = [...commons, ...others];
  const picks    = [rares[Math.floor(Math.random() * rares.length)]];
  while (picks.length < 7) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    if (!picks.find(x => x.id === c.id)) picks.push({ ...c });
  }
  return picks.sort(() => Math.random() - .5);
}

export function cardPrice(card, mult, type = 'buy') {
  const base = type === 'buy' ? card.buyBase : card.sellBase;
  const rand = 0.92 + Math.random() * 0.16;
  return Math.max(1, Math.round(base * mult * rand));
}

export function advanceDay(state) {
  const s = { ...state, day: state.day + 1 };
  const ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
  s.marketMult  = ev.mult;
  s.marketLabel = ev.label;
  s.duelDoneToday = false;
  if (s.bourseLastDay !== s.day) { s.bourseLeft = 5; s.bourseLastDay = s.day; }
  if (s.day % 7 === 0) s.bonPapaAvailable = true;
  if (s.day - s.shopRefreshDay >= 7) {
    s.shopCards      = generateShopCards();
    s.shopRefreshDay = s.day;
    s.boostersUsed   = 0;
  }
  return s;
}

export function addXP(state, amount) {
  const s = { ...state, xp: state.xp + amount };
  const newLevel = LEVEL_XP_THRESHOLDS.findIndex(t => s.xp < t) + 1;
  const capped   = Math.min(5, newLevel < 1 ? 5 : newLevel);
  const leveled  = capped > s.level;
  s.level        = Math.max(s.level, capped);
  return { state: s, leveled };
}

export function xpProgress(state) {
  const lvl     = state.level;
  const prev    = LEVEL_XP_THRESHOLDS[lvl - 2] || 0;
  const next    = LEVEL_XP_THRESHOLDS[lvl - 1]  || 160;
  const current = state.xp - prev;
  const range   = next - prev;
  return { current, range, pct: Math.min(100, Math.round((current / range) * 100)) };
}

export function albumCap(level) {
  return ALBUM_CAPS[Math.min(level - 1, ALBUM_CAPS.length - 1)];
}

export function bonPapaQuote(day) {
  return BONPAPA_QUOTES[Math.floor((day - 1) / 7) % BONPAPA_QUOTES.length];
}

export function daysUntilBonPapa(day) {
  return day % 7 === 0 ? 0 : 7 - (day % 7);
}

export function generatePackCards(boosterId) {
  const commons  = CARDS.filter(c => c.rarity === 'common');
  const rares    = CARDS.filter(c => c.rarity === 'rare');
  const specials = CARDS.filter(c => c.rarity === 'ultra' || c.rarity === 'legendary');
  let pool = boosterId === 'basic' ? commons
           : boosterId === 'feu'   ? [...commons, ...rares]
           : CARDS;
  return Array.from({ length: 5 }, (_, i) => {
    if (i === 4 && boosterId === 'dore') return { ...specials[Math.floor(Math.random() * specials.length)] };
    if (i === 4 && boosterId === 'feu')  return { ...rares[Math.floor(Math.random() * rares.length)] };
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  });
}
