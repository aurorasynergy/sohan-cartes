import { CARDS, MARKET_EVENTS, BOOSTER_TYPES, THEO_DIALOGS, RAPH_DIALOGS } from './data.js';
import { defaultState, saveGame, loadGame, generateShopCards, cardPrice, advanceDay, addXP, xpProgress, albumCap, bonPapaQuote, daysUntilBonPapa, generatePackCards } from './game.js';

let S = null;
let _modalCb = null;
let _dlgTimer = null;
let _bourseCard = null;
let _bourseGoUp = true;
let _naimPow = 50;
let _tutoStep = 0;

const NAIM_LINES = [
  { speaker:'Naïm', text:'Hé frérot ! J\'ai des cartes pour toi 🎴', cards:[] },
  { speaker:'Naïm', text:'Tu vois ma collection ? Je te la donne pour que tu deviennes le meilleur marchand ! 💪', cards:[] },
  { speaker:'Naïm', text:'J\'ai 10 cartes pour toi... dont une légendaire 🔥', cards:['🌿','🦎','🐢','⚡','🐱'] },
  { speaker:'Naïm', text:'Et voilà le reste ! Prends soin d\'elles, surtout le Dracaufeu !', cards:['🦆','👻','🎤','🐉','🔥'] },
  { speaker:'Naïm', text:'Bonne chance Sohan ! Achète bas, vends haut 😎', cards:[] },
];

const el = id => document.getElementById(id);
const txt = (id, v) => { const e = el(id); if(e) e.textContent = v; };

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const s = el('screen-' + name);
  if(s) s.classList.add('active');
}

// ── STARS ──
function makeStars() {
  const c = el('splashStars');
  if(!c) return;
  for(let i=0;i<60;i++){
    const s = document.createElement('div');
    s.className = 'star';
    s.style.cssText = `width:${1+Math.random()*3}px;height:${1+Math.random()*3}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${2+Math.random()*4}s;animation-delay:${Math.random()*4}s`;
    c.appendChild(s);
  }
}

// ── NAÏM ──
let _naimStep = 0;
function renderNaimStep() {
  const line = NAIM_LINES[_naimStep];
  const textEl = el('naimText');
  const speakerEl = el('naimSpeaker');
  const cardsEl = el('naimCards');
  const btn = el('naimNextBtn');
  if(!textEl) return;

  // Animate bubble
  const bubble = el('naimBubble');
  bubble.style.animation = 'none';
  setTimeout(() => { bubble.style.animation = 'bubbleIn .35s ease'; }, 10);

  textEl.textContent = line.text;
  speakerEl.textContent = line.speaker;

  // Cards
  cardsEl.innerHTML = '';
  line.cards.forEach((emoji, i) => {
    const d = document.createElement('div');
    d.className = 'gift-card';
    d.style.animationDelay = (i * .1) + 's';
    d.textContent = emoji;
    cardsEl.appendChild(d);
  });

  // Last step
  btn.textContent = _naimStep >= NAIM_LINES.length - 1 ? 'Commencer ! 🎮' : 'Suivant ➜';
}

window.G = {

  goToNaim() {
    _naimStep = 0;
    showScreen('naim');
    renderNaimStep();
  },

  naimNext() {
    _naimStep++;
    if(_naimStep >= NAIM_LINES.length) {
      showScreen('name');
      return;
    }
    renderNaimStep();
  },

  previewName() {
    const val = el('ni').value.trim();
    txt('ncpName', val || '...');
  },

  async start() {
    const name = el('ni').value.trim();
    if(!name) { toast('Entre ton prénom d\'abord !', 'error'); return; }
    S = defaultState(name);
    el('sni').value = name;
    _tutoStep = 0;
    showScreen('tuto');
    renderTuto();
  },

  tutoNext() {
    _tutoStep++;
    if(_tutoStep >= 4) {
      showScreen('game');
      render();
      startDialogs();
      toast(`🎁 C'est parti ${S.playerName} ! Naïm t'a donné 10 cartes !`, 'gold');
      autoSave();
      return;
    }
    renderTuto();
  },

  async restore() {
    const name = el('ri').value.trim();
    if(!name) { toast('Entre ton prénom !', 'error'); return; }
    toast('⏳ Chargement...', 'info');
    try {
      const state = await loadGame(name);
      if(!state) { toast('❌ Aucune partie trouvée.', 'error'); return; }
      S = state;
      el('sni').value = name;
      showScreen('game');
      render();
      startDialogs();
      toast(`✅ Partie de ${name} restaurée !`, 'success');
    } catch(e) { toast('❌ Erreur de connexion.', 'error'); }
  },

  tab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
    if(name === 'save') genSaveCode();
    if(name === 'bp') renderBourse();
  },

  nextDay() {
    S = advanceDay(S);
    _naimPow = 30 + Math.floor(Math.random() * 70);
    render();
    toast(S.marketLabel, 'info');
    autoSave();
  },

  bonPapa() {
    S.money += 50;
    S.bonPapaAvailable = false;
    const r = addXP(S, 5); S = r.state;
    if(r.leveled) showLvlup(S.level);
    render();
    toast('👴 Bon Papa te donne 50 € !', 'gold');
    particles('💰', 10);
    autoSave();
  },

  duelPick() {
    const idx = el('duelSelect').value;
    if(idx === '') { txt('myPow', '?'); return; }
    txt('myPow', S.album[idx].power);
  },

  duel() {
    if(S.duelDoneToday) { toast('Duel déjà fait aujourd\'hui !', 'error'); return; }
    const idx = el('duelSelect').value;
    if(idx === '') { toast('Choisis une carte !', 'error'); return; }
    const myCard = S.album[idx];
    S.duelDoneToday = true;
    if(myCard.power >= _naimPow) {
      const gain = 10 + Math.floor(Math.random() * 21);
      S.money += gain;
      const r = addXP(S, 5); S = r.state;
      if(r.leveled) showLvlup(S.level);
      toast(`⚔️ Tu bats Naïm ! +${gain} € 🎉`, 'success');
      particles('⭐', 8);
    } else {
      toast(`😤 Naïm gagne... (${myCard.power} vs ${_naimPow})`, 'error');
    }
    render();
    autoSave();
  },

  bourse(dir) {
    if(!S || S.bourseLeft <= 0) return;
    const correct = (dir === 'up' && _bourseGoUp) || (dir === 'dn' && !_bourseGoUp);
    S.bourseLeft--;
    if(correct) {
      S.money += 4;
      toast('✅ Bonne réponse ! +4 €', 'success');
      particles('💚', 5);
    } else {
      toast(`❌ Raté ! Le prix ${_bourseGoUp ? 'montait' : 'baissait'}`, 'error');
    }
    renderBourse();
    renderTopbar();
    autoSave();
  },

  closeModal(e) {
    if(e && e.target !== el('modal')) return;
    el('modal').classList.remove('open');
    _modalCb = null;
  },

  async cloudSave() {
    const name = el('sni').value.trim() || S?.playerName;
    if(!name || !S) return;
    toast('⏳ Sauvegarde...', 'info');
    try {
      await saveGame(name, S);
      toast('☁️ Sauvegardé !', 'success');
    } catch(e) { toast('❌ Erreur.', 'error'); }
  },

  async cloudLoad() {
    const name = el('sni').value.trim();
    if(!name) { toast('Entre ton prénom !', 'error'); return; }
    toast('⏳ Chargement...', 'info');
    try {
      const state = await loadGame(name);
      if(!state) { toast('❌ Aucune partie trouvée.', 'error'); return; }
      S = state;
      render();
      toast('✅ Partie chargée !', 'success');
    } catch(e) { toast('❌ Erreur.', 'error'); }
  },

  copyCode() {
    const code = el('saveCode').textContent;
    if(navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => toast('📋 Code copié !', 'success'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      toast('📋 Code copié !', 'success');
    }
  },

  closeLvlup() { el('lvlupOverlay').classList.remove('show'); render(); },
};

function renderTuto() {
  document.querySelectorAll('.tuto-step').forEach((s,i) => s.classList.toggle('active', i === _tutoStep));
  document.querySelectorAll('.tuto-dot').forEach((d,i) => d.classList.toggle('active', i === _tutoStep));
  const btn = el('tutoBtn');
  if(btn) btn.textContent = _tutoStep >= 3 ? '🎮 Jouer !' : 'Suivant ➜';
}

function render() {
  if(!S) return;
  renderTopbar();
  renderShop();
  renderBoosters();
  renderAlbum();
  renderBonPapa();
  renderDuel();
  renderBourse();
  genSaveCode();
}

function renderTopbar() {
  txt('dayBadge', `Jour ${S.day}`);
  const mb = el('moneyBadge');
  mb.textContent = `💰 ${S.money} €`;
  mb.classList.add('bump');
  setTimeout(() => mb.classList.remove('bump'), 300);
  const { current, range, pct } = xpProgress(S);
  txt('lvlLabel', `Niv.${S.level}`);
  txt('xpLabel', `${current} / ${range} XP`);
  el('xpFill').style.width = pct + '%';
}

function renderShop() {
  txt('marketPill', S.marketLabel);
  const dLeft = 7 - ((S.day - S.shopRefreshDay) % 7);
  txt('restockInfo', `🔄 Nouvelles cartes dans ${dLeft} jour${dLeft > 1 ? 's' : ''}`);
  const grid = el('shopGrid');
  grid.innerHTML = '';
  S.shopCards.forEach(card => {
    const price = cardPrice(card, S.marketMult, 'buy');
    const div = document.createElement('div');
    div.className = `card-item ${card.rarity !== 'common' ? card.rarity : ''}`;
    div.innerHTML = `<div class="card-emoji">${card.emoji}</div><div class="card-name">${card.name}</div><div class="rarity-badge rb-${card.rarity}">${card.rarity.toUpperCase()}</div><div class="card-price">${price} €</div>`;
    div.onclick = () => openBuyModal(card, price);
    grid.appendChild(div);
  });
}

function renderBoosters() {
  txt('boostLimit', `3 boosters par semaine • ${S.boostersUsed}/3 ouverts`);
  const grid = el('boosterGrid');
  grid.innerHTML = '';
  for(let i=0;i<10;i++) {
    const bt = BOOSTER_TYPES[i % 3];
    const used = i < S.boostersUsed;
    const div = document.createElement('div');
    div.className = `booster-item ${used ? 'used' : ''}`;
    div.innerHTML = `<div class="booster-icon">${used ? '✅' : bt.emoji}</div><div class="booster-label">${bt.label}</div><div class="booster-price">${bt.price}€</div>`;
    if(!used) div.onclick = () => openBoosterModal(bt);
    grid.appendChild(div);
  }
}

function renderAlbum() {
  const cap = albumCap(S.level);
  txt('albumCount', `${S.album.length} carte${S.album.length !== 1 ? 's' : ''}`);
  txt('albumCap', `/ ${cap}`);
  el('albumFill').style.width = `${Math.min(100,(S.album.length/cap)*100)}%`;
  const grid = el('albumGrid');
  grid.innerHTML = '';
  S.album.forEach((card,i) => {
    const sell = cardPrice(card, S.marketMult, 'sell');
    const profit = sell - (card.boughtPrice || 0);
    const div = document.createElement('div');
    div.className = `card-item ${card.rarity !== 'common' ? card.rarity : ''}`;
    div.innerHTML = `<div class="card-emoji">${card.emoji}</div><div class="card-name">${card.name}</div>${card.fromNaim ? '<div class="gift-tag">🎁 Cadeau</div>' : ''}<div class="card-price">${sell} €</div><div class="${profit >= 0 ? 'profit-pos' : 'profit-neg'}">${profit >= 0 ? '+' : ''}${profit} €</div>`;
    div.onclick = () => openSellModal(card, i, sell);
    grid.appendChild(div);
  });
  for(let i=S.album.length;i<cap;i++) {
    const d = document.createElement('div');
    d.className = 'empty-slot';
    d.textContent = '＋';
    grid.appendChild(d);
  }
}

function renderBonPapa() {
  txt('bpQuote', bonPapaQuote(S.day));
  if(S.bonPapaAvailable) {
    txt('bpCountdown', '🎉 Bon Papa est là !');
    el('bpBtn').disabled = false;
  } else {
    const d = daysUntilBonPapa(S.day);
    txt('bpCountdown', `Arrive dans ${d} jour${d > 1 ? 's' : ''}`);
    el('bpBtn').disabled = true;
  }
}

function renderDuel() {
  const sel = el('duelSelect');
  sel.innerHTML = '<option value="">— Choisis une carte —</option>';
  S.album.forEach((card,i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${card.emoji} ${card.name} (Force: ${card.power})`;
    sel.appendChild(opt);
  });
  txt('naimPow', _naimPow);
  el('duelBtn').disabled = S.duelDoneToday;
  el('duelBtn').textContent = S.duelDoneToday ? '✅ Duel fait aujourd\'hui' : '⚔️ Combattre !';
}

function renderBourse() {
  if(!S) return;
  if(S.bourseLastDay !== S.day) { S.bourseLeft = 5; S.bourseLastDay = S.day; }
  txt('bourseLeft', `${S.bourseLeft} question${S.bourseLeft !== 1 ? 's' : ''} restante${S.bourseLeft !== 1 ? 's' : ''}`);
  if(S.bourseLeft <= 0) {
    el('bourseDisplay').innerHTML = '<div style="padding:10px;font-size:.85rem;color:var(--muted)">Reviens demain ! 😴</div>';
    document.querySelector('.bourse-btns').style.display = 'none';
    return;
  }
  document.querySelector('.bourse-btns').style.display = 'flex';
  _bourseCard = CARDS[Math.floor(Math.random() * CARDS.length)];
  _bourseGoUp = Math.random() > 0.5;
  const price = cardPrice(_bourseCard, S.marketMult, 'buy');
  txt('bourseEmoji', _bourseCard.emoji);
  txt('bourseName', _bourseCard.name);
  txt('boursePrice', `${price} €`);
}

function openBuyModal(card, price) {
  const cap = albumCap(S.level);
  if(S.album.length >= cap) { toast('📒 Album plein ! Monte de niveau !', 'error'); return; }
  el('mTitle').textContent = `Acheter ${card.name} ?`;
  el('mEmoji').textContent = card.emoji;
  el('mPrice').textContent = `${price} €`;
  el('mSub').textContent = `Tu as ${S.money} €`;
  el('mConfirm').textContent = `✅ Acheter ${price} €`;
  _modalCb = () => {
    if(S.money < price) { toast('❌ Pas assez d\'argent !', 'error'); G.closeModal(); return; }
    S.money -= price;
    S.album.push({...card, boughtPrice: price, fromNaim: false});
    const r = addXP(S, 2); S = r.state;
    if(r.leveled) showLvlup(S.level);
    toast(`✅ ${card.name} dans l'album !`, 'success');
    particles(card.emoji, 5);
    G.closeModal();
    render();
    autoSave();
  };
  el('mConfirm').onclick = () => _modalCb && _modalCb();
  el('modal').classList.add('open');
}

function openSellModal(card, idx, price) {
  const profit = price - (card.boughtPrice || 0);
  el('mTitle').textContent = `Vendre ${card.name} ?`;
  el('mEmoji').textContent = card.emoji;
  el('mPrice').textContent = `+${price} €`;
  el('mSub').textContent = `Profit : ${profit >= 0 ? '+' : ''}${profit} €`;
  el('mConfirm').textContent = `💰 Vendre ${price} €`;
  _modalCb = () => {
    S.money += price;
    S.album.splice(idx, 1);
    const r = addXP(S, profit > 0 ? 4 : 1); S = r.state;
    if(r.leveled) showLvlup(S.level);
    toast(`💰 ${card.name} vendu ${price} € !`, profit > 0 ? 'success' : 'info');
    particles('💰', 5);
    G.closeModal();
    render();
    autoSave();
  };
  el('mConfirm').onclick = () => _modalCb && _modalCb();
  el('modal').classList.add('open');
}

function openBoosterModal(bt) {
  if(S.boostersUsed >= 3) { toast('🚫 3 boosters max cette semaine !', 'error'); return; }
  if(S.money < bt.price) { toast('❌ Pas assez d\'argent !', 'error'); return; }
  const cap = albumCap(S.level);
  if(S.album.length + 5 > cap) { toast('📒 Album presque plein !', 'error'); return; }
  el('mTitle').textContent = `Ouvrir un booster ${bt.label} ?`;
  el('mEmoji').textContent = bt.emoji;
  el('mPrice').textContent = `${bt.price} €`;
  el('mSub').textContent = `Tu as ${S.money} €`;
  el('mConfirm').textContent = `✅ Ouvrir ${bt.price} €`;
  _modalCb = () => {
    S.money -= bt.price;
    S.boostersUsed++;
    const r = addXP(S, 3); S = r.state;
    if(r.leveled) showLvlup(S.level);
    G.closeModal();
    openPackOpening(bt);
    render();
  };
  el('mConfirm').onclick = () => _modalCb && _modalCb();
  el('modal').classList.add('open');
}

function openPackOpening(bt) {
  const packCards = generatePackCards(bt.id);
  const overlay = el('packOverlay');
  const stage = el('packStage');
  overlay.classList.add('show');
  let cardIdx = 0;
  let phase = 'tear';

  stage.innerHTML = `<div style="text-align:center"><div class="pack-hint">Déchire le booster !</div><div class="pack-booster" id="packVisual">${bt.emoji}</div><div class="pack-hint" style="margin-top:8px">Appuie pour déchirer !</div></div>`;

  function advance() {
    if(phase === 'tear') {
      el('packVisual').classList.add('tearing');
      phase = 'cards';
      setTimeout(showCard, 380);
      return;
    }
    if(phase === 'cards') { cardIdx++; if(cardIdx < packCards.length) showCard(); else showAll(); }
  }

  function showCard() {
    const c = packCards[cardIdx];
    const cap = albumCap(S.level);
    if(S.album.length < cap) S.album.push({...c, boughtPrice:0, fromNaim:false});
    stage.innerHTML = `<div style="text-align:center"><div class="pack-counter">${cardIdx+1} / ${packCards.length}</div><div class="pack-single"><div class="pack-single-emoji">${c.emoji}</div><div class="pack-single-name">${c.name}</div><div class="rarity-badge rb-${c.rarity}">${c.rarity.toUpperCase()}</div></div><div class="pack-hint" style="margin-top:12px">Appuie pour continuer...</div></div>`;
    stage.onclick = advance;
  }

  function showAll() {
    stage.innerHTML = `<div style="text-align:center;width:100%"><div style="font-family:'Baloo 2',sans-serif;font-size:1.1rem;font-weight:800;color:var(--gold);margin-bottom:14px">🎉 Tes cartes !</div><div class="pack-all-grid">${packCards.map((c,i)=>`<div class="pac" style="animation-delay:${i*.1}s"><div class="pac-emoji">${c.emoji}</div><div class="pac-name">${c.name}</div></div>`).join('')}</div><button class="btn-pack-go" onclick="closePack()">✅ Partir !</button></div>`;
    stage.onclick = null;
    autoSave();
  }

  stage.onclick = advance;
  window.closePack = () => { overlay.classList.remove('show'); render(); };
}

function showLvlup(lvl) {
  const caps = [10,20,40,60,80,100];
  txt('lvlupTitle', `NIVEAU ${lvl} ! 🎉`);
  txt('lvlupSub', `Album agrandi à ${caps[Math.min(lvl-1,caps.length-1)]} cartes !`);
  el('lvlupOverlay').classList.add('show');
  particles('⭐', 15);
}

function toast(msg, type='info') {
  const c = el('toasts');
  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
}

function particles(emoji, count) {
  for(let i=0;i<count;i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'particle';
      p.textContent = emoji;
      p.style.left = (15+Math.random()*70)+'%';
      p.style.top = (25+Math.random()*45)+'%';
      p.style.animationDuration = (.55+Math.random()*.6)+'s';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }, i*75);
  }
}

function startDialogs() {
  clearInterval(_dlgTimer);
  updateDialogs();
  _dlgTimer = setInterval(updateDialogs, 4500);
}

function updateDialogs() {
  txt('theo-dlg', THEO_DIALOGS[Math.floor(Math.random()*THEO_DIALOGS.length)]);
  txt('raph-dlg', RAPH_DIALOGS[Math.floor(Math.random()*RAPH_DIALOGS.length)]);
}

function genSaveCode() {
  const e = el('saveCode');
  if(e && S) e.textContent = btoa(JSON.stringify(S));
}

async function autoSave() {
  if(!S?.playerName) return;
  try { await saveGame(S.playerName, S); } catch(_) {}
}

// INIT
makeStars();
showScreen('splash');
_naimPow = 30 + Math.floor(Math.random() * 70);
