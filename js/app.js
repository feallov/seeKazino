const API = {
  async register(nick, password, avatar) {
    const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick, password, avatar }) });
    return res.json();
  },
  async login(nick, password) {
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick, password }) });
    return res.json();
  },
  async getUser(nick) {
    const res = await fetch('/api/user?nick=' + encodeURIComponent(nick));
    return res.json();
  },
  async updateStats(nick, bet, winAmount, cashoutMultiplier) {
    const res = await fetch('/api/update-stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick, bet, winAmount, cashoutMultiplier }) });
    const data = await res.json();
    if (window.Sounds) { (winAmount > 0) ? Sounds.win() : Sounds.lose(); }
    return data;
  }
};

const Store = {
  getNick() { return localStorage.getItem('seekazino_nick'); },
  setNick(nick) { localStorage.setItem('seekazino_nick', nick); },
  clearNick() { localStorage.removeItem('seekazino_nick'); localStorage.removeItem('seekazino_user'); localStorage.removeItem('seekazino_token'); },
  getUser() {
    try { const d = localStorage.getItem('seekazino_user'); return d ? JSON.parse(d) : null; }
    catch (e) { localStorage.removeItem('seekazino_user'); return null; }
  },
  setUser(user) { localStorage.setItem('seekazino_user', JSON.stringify(user)); },
  getBalance() { const u = this.getUser(); return u ? u.balance : 10.00; },
  setBalance(a) { const u = this.getUser(); if (u) { u.balance = a; this.setUser(u); updateBalanceDisplay(); } },
  async refreshUser() {
    const nick = this.getNick();
    if (!nick) return null;
    try {
      const data = await API.getUser(nick);
      if (data.user) { this.setUser(data.user); updateBalanceDisplay(); updateAuthDisplay(); }
      return data.user;
    } catch (e) { return this.getUser(); }
  }
};

function requireAuth() { if (!Store.getNick()) { window.location.href = '/login.html'; return false; } return true; }
function requireGuest() { if (Store.getNick()) window.location.href = '/index.html'; }

function updateBalanceDisplay() {
  const b = Store.getBalance();
  document.querySelectorAll('#balanceAmount, #profileBalance').forEach(el => { if (el) el.textContent = '$' + Number(b).toFixed(2); });
}

function updateAuthDisplay() {
  const user = Store.getUser();
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const avatarBtn = document.getElementById('avatarBtn');
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (avatarBtn) { avatarBtn.textContent = user.avatar || '😎'; avatarBtn.href = '/profile.html'; }
  }
}

const PROTECTED_PAGES = ['index.html', 'profile.html', 'game-crash.html', 'game-mines.html', 'game-slots.html', 'game-dice.html', 'game-roulette.html', 'game-plinko.html', 'game-blackjack.html', 'game-limbo.html', 'game-keno.html', 'game-wheel.html', 'shop.html', 'admin.html', 'leaderboard.html'];

document.addEventListener('DOMContentLoaded', async () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'login.html') { requireGuest(); }
  else if (PROTECTED_PAGES.includes(page)) { if (!requireAuth()) return; await Store.refreshUser(); }
  updateBalanceDisplay(); updateAuthDisplay(); initAuth(); initProfile(); injectHeaderLinks(); applyTheme(); initLobbyExtras(); pingOnline(); setInterval(pingOnline, 30000);
});

function initAuth() {
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active');
      if (tab.dataset.tab === 'login') { loginForm.style.display = 'block'; registerForm.style.display = 'none'; }
      else { loginForm.style.display = 'none'; registerForm.style.display = 'block'; }
      hideError();
    });
  });

  document.querySelectorAll('.avatar-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nick = document.getElementById('loginNick').value.trim();
    const pass = document.getElementById('loginPass').value;
    disableForm(loginForm, true);
    let data;
    try { data = await API.login(nick, pass); } catch (err) { disableForm(loginForm, false); showError('Сервер недоступен, попробуй ещё раз'); return; }
    disableForm(loginForm, false);
    if (!data.success) { showError(data.error || 'Ошибка входа'); return; }
    Store.setNick(nick); Store.setUser(data.user);
    if (data.token) localStorage.setItem('seekazino_token', data.token);
    window.location.href = '/index.html';
  });

  if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nick = document.getElementById('regNick').value.trim();
    const pass = document.getElementById('regPass').value;
    const avatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || '😎';
    disableForm(registerForm, true);
    let data;
    try { data = await API.register(nick, pass, avatar); } catch (err) { disableForm(registerForm, false); showError('Сервер недоступен, попробуй ещё раз'); return; }
    disableForm(registerForm, false);
    if (!data.success) { showError(data.error || 'Ошибка регистрации'); return; }
    Store.setNick(nick); Store.setUser(data.user);
    if (data.token) localStorage.setItem('seekazino_token', data.token);
    window.location.href = '/index.html';
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { Store.clearNick(); window.location.href = '/login.html'; });
}

function disableForm(form, d) { form.querySelectorAll('button, input').forEach(el => el.disabled = d); }
function showError(msg) { const el = document.getElementById('authError'); if (el) { el.textContent = msg; el.style.display = 'block'; } }
function hideError() { const el = document.getElementById('authError'); if (el) el.style.display = 'none'; }

// ===== ЧАСТЬ 2: ДОСТИЖЕНИЯ, ПРОФИЛЬ, ТЕМЫ, ЗВУКИ, ЛЕНТА, NFT =====

const ACHIEVEMENTS = {
  first_win: { icon: '🥇', name: 'Первая победа', desc: 'Выиграй первый раунд' },
  streak_5: { icon: '🔥', name: 'Серия x5', desc: '5 побед подряд' },
  high_roller: { icon: '💎', name: 'Хайроллер', desc: 'Выиграй со ставки $50+' },
  sharp_eye: { icon: '🎯', name: 'Острый глаз', desc: 'Забери на множителе 5x+' },
  whale: { icon: '👑', name: 'Whale', desc: 'Накопи $1000+' },
  speedrun: { icon: '⚡', name: 'Спидран', desc: 'Забери в первые 2 секунды' }
};

function initProfile() {
  const user = Store.getUser();
  if (!user) return;
  setText('profileName', user.nick);
  const av = document.getElementById('profileAvatar'); if (av) av.textContent = user.avatar || '😎';
  const levels = [
    { level: 1, name: 'Newbie', xp: 0 }, { level: 2, name: 'Regular', xp: 500 },
    { level: 3, name: 'Grinder', xp: 2000 }, { level: 4, name: 'High Roller', xp: 5000 },
    { level: 5, name: 'Shark', xp: 15000 }, { level: 6, name: 'Whale', xp: 50000 }
  ];
  const cur = levels.filter(l => user.xp >= l.xp).pop() || levels[0];
  const next = levels.find(l => l.xp > user.xp);
  const lb = document.getElementById('levelBadge'); if (lb) lb.textContent = 'Уровень ' + cur.level;
  const ln = document.getElementById('levelName'); if (ln) ln.textContent = cur.name;
  const xpBar = document.getElementById('xpBar');
  if (xpBar && next) xpBar.style.width = Math.min(((user.xp - cur.xp) / (next.xp - cur.xp)) * 100, 100) + '%';
  const xpText = document.getElementById('xpText'); if (xpText && next) xpText.textContent = user.xp + ' / ' + next.xp + ' XP';
  if (user.bets !== undefined) {
    setText('statBets', user.bets); setText('statWins', user.wins); setText('statLosses', user.losses);
    setText('statWagered', '$' + (user.wagered || 0).toFixed(2));
    const p = user.profit || 0;
    setText('statProfit', (p >= 0 ? '+$' : '-$') + Math.abs(p).toFixed(2));
    setText('statBiggest', '$' + (user.biggestWin || 0).toFixed(2));
  }
  renderAchievements(user.achievements || []);
}

function renderAchievements(list) {
  const c = document.getElementById('achievementsGrid');
  if (!c) return;
  c.innerHTML = '';
  Object.keys(ACHIEVEMENTS).forEach(id => {
    const a = ACHIEVEMENTS[id];
    const un = list.includes(id);
    const d = document.createElement('div');
    d.className = 'achievement-card ' + (un ? 'achievement-unlocked' : 'achievement-locked');
    d.innerHTML = '<span class="achievement-icon">' + a.icon + '</span><span class="achievement-name">' + a.name + '</span><span class="achievement-desc">' + (un ? '✓ Получено' : a.desc) + '</span>';
    c.appendChild(d);
  });
}

function showAchievementToast(id) {
  const a = ACHIEVEMENTS[id];
  if (!a) return;
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:80px;right:20px;z-index:1000;background:linear-gradient(135deg,#1A4D3A,#22C55E);color:white;padding:16px 20px;border-radius:12px;box-shadow:0 8px 32px rgba(34,197,94,0.3);';
  t.innerHTML = '<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:32px;">' + a.icon + '</span><div><div style="font-size:11px;opacity:0.8;text-transform:uppercase;">Новое достижение</div><div style="font-weight:700;">' + a.name + '</div></div></div>';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

function injectHeaderLinks() {
  const right = document.querySelector('.header-right');
  if (!right) return;
  if (!document.getElementById('lbLink')) {
    const lb = document.createElement('a');
    lb.href = '/leaderboard.html'; lb.className = 'btn btn-ghost'; lb.id = 'lbLink'; lb.textContent = '🏆 Топ';
    right.insertBefore(lb, right.firstChild);
  }
  if (!document.getElementById('shopLink')) {
    const a = document.createElement('a');
    a.href = '/shop.html'; a.className = 'btn btn-ghost'; a.id = 'shopLink'; a.textContent = '🛒 Магазин';
    right.insertBefore(a, right.firstChild);
  }
  const user = Store.getUser();
  if (user && (user.role === 'admin' || user.nick === 'admin') && !document.getElementById('adminLink')) {
    const a = document.createElement('a');
    a.href = '/admin.html'; a.className = 'btn btn-ghost'; a.id = 'adminLink'; a.textContent = '👑 Админ';
    right.insertBefore(a, right.firstChild);
  }
}

function applyTheme() {
  const theme = localStorage.getItem('seekazino_theme');
  const user = Store.getUser();
  const owned = user && user.inventory && user.inventory.includes(theme);
  if (theme && owned) document.documentElement.setAttribute('data-theme', theme.replace('th_', ''));
  else document.documentElement.removeAttribute('data-theme');
}

// ===== ЗВУКИ =====
const Sounds = {
  ctx: null,
  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  beep(f, d, type, vol, when) {
    const t = this.ctx.currentTime + (when || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + d);
  },
  win() { this.ensure(); [523, 659, 784, 1047].forEach((f, i) => this.beep(f, 0.18, 'sine', 0.12, i * 0.09)); },
  lose() { this.ensure(); this.beep(196, 0.25, 'sawtooth', 0.07); this.beep(147, 0.35, 'sawtooth', 0.07, 0.15); },
  click() { this.ensure(); this.beep(880, 0.05, 'square', 0.04); }
};

document.addEventListener('click', (e) => {
  if (e.target.closest('.btn, .preset-btn, .game-card, .mine-cell, .keno-cell, .avatar-option')) {
    try { Sounds.click(); } catch (err) {}
  }
});

// ===== ЛЕНТА + ЕЖЕДНЕВНЫЙ БОНУС =====
async function initLobbyExtras() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page !== 'index.html') return;

  const loadFeed = async () => {
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      const row = document.getElementById('feedRow');
      if (!row) return;
      row.innerHTML = (data.feed || []).map(f =>
        '<span class="feed-pill"><b>' + f.nick + '</b> выбил <b class="text-green">' + Number(f.mult).toFixed(1) + 'x</b> → $' + Number(f.amount).toFixed(2) + '</span>'
      ).join('');
    } catch (e) {}
  };
  loadFeed();
  setInterval(loadFeed, 10000);

  const user = Store.getUser();
  const banner = document.getElementById('dailyBanner');
  const DAY = 24 * 60 * 60 * 1000;
  if (user && user.role !== 'admin' && banner) {
    if (Date.now() - (user.last_bonus || 0) >= DAY) banner.style.display = 'flex';
    const btn = document.getElementById('dailyBtn');
    if (btn) btn.addEventListener('click', async () => {
      const res = await fetch('/api/daily-bonus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick: user.nick }) });
      const data = await res.json();
      if (data.success) {
        Store.setUser(data.user); updateBalanceDisplay();
        banner.style.display = 'none';
        alert('🎁 Получено $' + data.amount + '!');
      } else { alert(data.error); banner.style.display = 'none'; }
    });
  }
}

// ===== ОНЛАЙН =====
function getSid() {
  let sid = localStorage.getItem('seekazino_sid');
  if (!sid) { sid = 's' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('seekazino_sid', sid); }
  return sid;
}

async function pingOnline() {
  try {
    const res = await fetch('/api/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid: getSid() }) });
    const data = await res.json();
    const el = document.getElementById('onlineCount');
    if (el && data.online !== undefined) el.textContent = data.online;
  } catch (e) {}
}

// ===== NFT В ПРОФИЛЕ =====
async function renderNFTs(inv) {
  const grid = document.getElementById('nftGrid');
  if (!grid) return;
  const res = await fetch('/api/shop');
  const data = await res.json();
  const nfts = (data.items || []).filter(i => i.type === 'nft' && inv.includes(i.id));
  if (!nfts.length) { grid.innerHTML = '<p class="section-sub">Пока нет NFT — загляни в магазин! 🖼️</p>'; return; }
  grid.innerHTML = '';
  nfts.forEach(n => {
    const d = document.createElement('div');
    d.className = 'nft-item rarity-' + n.rarity;
    d.innerHTML = '<span class="nft-icon">' + n.icon + '</span><span class="nft-name">' + n.name + '</span>';
    grid.appendChild(d);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('nftGrid')) return;
  const draw = () => { const u = Store.getUser(); if (u) renderNFTs(u.inventory || []); };
  draw();
  setTimeout(draw, 800);
});

// ===== ФИКС: повторы запроса + тост кешбека =====
(function () {
  const orig = API.updateStats.bind(API);
  API.updateStats = async function (nick, bet, winAmount, cashoutMultiplier) {
    let data = null;
    for (let i = 0; i < 3; i++) {
      try { data = await orig(nick, bet, winAmount, cashoutMultiplier); break; }
      catch (e) { if (i < 2) await new Promise(r => setTimeout(r, 700)); }
    }
    if (!data) return { error: 'Сервер недоступен' };
    if (data.cashback > 0) showCashbackToast(data.cashback);
    return data;
  };
})();

function showCashbackToast(amount) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:80px;right:20px;z-index:1000;background:linear-gradient(135deg,#92400E,#F59E0B);color:#fff;padding:14px 18px;border-radius:12px;box-shadow:0 8px 32px rgba(245,158,11,.3);';
  t.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:26px;">💸</span><div><div style="font-size:11px;opacity:.85;text-transform:uppercase;">Кешбек</div><div style="font-weight:700;">+$' + Number(amount).toFixed(2) + '</div></div></div>';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ===== СТАВКИ: ПРЕСЕТЫ + БЛОКИРОВКА =====
(function(){
var P=[['0.25',function(){return .25}],['0.5',function(){return .5}],['⅓',function(){return Store.getBalance()/3}],['½',function(){return Store.getBalance()/2}],['MAX',function(){return Store.getBalance()}]];
var S=['startBtn','spinBtn','rollBtn','dropBtn','dealBtn','limboRollBtn','kenoPlay','wheelSpin'];
function ctl(){return document.querySelectorAll('#betAmount,.bet-adjust,.bet-preset')}
window.lockBet=function(){ctl().forEach(function(e){e.disabled=true})};
window.unlockBet=function(){ctl().forEach(function(e){e.disabled=false})};
function set(v){var i=document.getElementById('betAmount');if(!i)return;v=Math.max(.1,Math.floor(v*100)/100);i.value=v.toFixed(2);i.dispatchEvent(new Event('change'))}
document.addEventListener('DOMContentLoaded',function(){
var i=document.getElementById('betAmount');if(!i)return;
var r=document.querySelector('.bet-presets');
if(!r){r=document.createElement('div');r.className='bet-presets';var g=document.querySelector('.bet-input-group');(g&&g.parentNode?g.parentNode:i.parentNode).insertBefore(r,g?g.nextSibling:null)}
r.innerHTML='';
P.forEach(function(p){var b=document.createElement('button');b.type='button';b.className='preset-btn bet-preset';b.textContent=p[0];b.onclick=function(){set(p[1]())};r.appendChild(b)});
S.forEach(function(id){var b=document.getElementById(id);if(!b)return;b.addEventListener('click',function(){lockBet();setTimeout(function(){var run=b.disabled||b.offsetParent===null||(id==='kenoPlay'&&document.getElementById('kenoStatus')&&document.getElementById('kenoStatus').textContent.indexOf('Розыгрыш')===0);if(!run)unlockBet()},350)})});
});
var pu=API.updateStats.bind(API);
API.updateStats=function(){return pu.apply(API,arguments).then(function(d){unlockBet();return d})};
})();
