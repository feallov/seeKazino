const ADMIN_NICK = 'admin';
const ADMIN_PASS = 'adadwe';

const CATALOG = [
  { id: 'av_dragon',  type: 'avatar', name: 'Дракон',   icon: '🐲', price: 50 },
  { id: 'av_unicorn', type: 'avatar', name: 'Единорог', icon: '🦄', price: 50 },
  { id: 'av_panda',   type: 'avatar', name: 'Панда',    icon: '🐼', price: 60 },
  { id: 'av_clown',   type: 'avatar', name: 'Клоун',    icon: '🤡', price: 60 },
  { id: 'av_alien',   type: 'avatar', name: 'Пришелец', icon: '👽', price: 75 },
  { id: 'av_skull',   type: 'avatar', name: 'Скелет',   icon: '💀', price: 90 },
  { id: 'av_money',   type: 'avatar', name: 'Магнат',   icon: '🤑', price: 100 },
  { id: 'av_dino',    type: 'avatar', name: 'Дино',     icon: '🦖', price: 100 },
  { id: 'th_gold',    type: 'theme', name: 'Золотая',  icon: '👑', price: 200 },
  { id: 'th_purple',  type: 'theme', name: 'Неон',     icon: '🟣', price: 200 },
  { id: 'th_crimson', type: 'theme', name: 'Багровая', icon: '🔴', price: 200 },
  { id: 'th_ice',     type: 'theme', name: 'Лёд',      icon: '🧊', price: 200 },
  { id: 'th_sunset',  type: 'theme', name: 'Закат',    icon: '🌅', price: 200 },
  { id: 'th_matrix',  type: 'theme', name: 'Матрица',  icon: '🟩', price: 250 },
  { id: 'bp_xp2', type: 'boost', name: 'XP x2 (24ч)', icon: '⚡', price: 150 }
];

// rate = $/мин. Если денег капает слишком много — меняй цифры здесь.
const RARITY = {
  common:    { rate: 1,   chance: 60, label: 'Обычный',     color: '#8B9099' },
  uncommon:  { rate: 5,   chance: 25, label: 'Необычный',   color: '#4ADE80' },
  rare:      { rate: 15,  chance: 10, label: 'Редкий',      color: '#60A5FA' },
  epic:      { rate: 40,  chance: 4,  label: 'Эпический',   color: '#A78BFA' },
  legendary: { rate: 100, chance: 1,  label: 'Легендарный', color: '#F59E0B' }
};

const CASES = [
  { id: 'case_ice', name: 'Ледяной кейс', icon: '❄️', price: 100, colors: ['#0ea5e9', '#22d3ee'], nfts: [
    { id: 'nft_ice1', name: 'Снежинка', rarity: 'common' }, { id: 'nft_ice2', name: 'Льдинка', rarity: 'uncommon' },
    { id: 'nft_ice3', name: 'Морозный дух', rarity: 'rare' }, { id: 'nft_ice4', name: 'Кристальный голем', rarity: 'epic' },
    { id: 'nft_ice5', name: 'Вечная мерзлота', rarity: 'legendary' } ] },
  { id: 'case_dark', name: 'Чёрный кейс', icon: '🌑', price: 120, colors: ['#6b21a8', '#a855f7'], nfts: [
    { id: 'nft_dark1', name: 'Мрак', rarity: 'common' }, { id: 'nft_dark2', name: 'Ночной зверь', rarity: 'uncommon' },
    { id: 'nft_dark3', name: 'Тёмный рыцарь', rarity: 'rare' }, { id: 'nft_dark4', name: 'Пожиратель тьмы', rarity: 'epic' },
    { id: 'nft_dark5', name: 'Чёрная сингулярность', rarity: 'legendary' } ] },
  { id: 'case_fire', name: 'Огненный кейс', icon: '🔥', price: 150, colors: ['#dc2626', '#f97316'], nfts: [
    { id: 'nft_fire1', name: 'Искра', rarity: 'common' }, { id: 'nft_fire2', name: 'Уголёк', rarity: 'uncommon' },
    { id: 'nft_fire3', name: 'Огненный лис', rarity: 'rare' }, { id: 'nft_fire4', name: 'Лавовый голем', rarity: 'epic' },
    { id: 'nft_fire5', name: 'Феникс', rarity: 'legendary' } ] },
  { id: 'case_nature', name: 'Лесной кейс', icon: '🌿', price: 110, colors: ['#16a34a', '#84cc16'], nfts: [
    { id: 'nft_nat1', name: 'Росток', rarity: 'common' }, { id: 'nft_nat2', name: 'Гриб', rarity: 'uncommon' },
    { id: 'nft_nat3', name: 'Лесной волк', rarity: 'rare' }, { id: 'nft_nat4', name: 'Древний энт', rarity: 'epic' },
    { id: 'nft_nat5', name: 'Дух природы', rarity: 'legendary' } ] },
  { id: 'case_gold', name: 'Золотой кейс', icon: '👑', price: 200, colors: ['#b45309', '#f59e0b'], nfts: [
    { id: 'nft_gold1', name: 'Монетка', rarity: 'common' }, { id: 'nft_gold2', name: 'Слиток', rarity: 'uncommon' },
    { id: 'nft_gold3', name: 'Золотой жук', rarity: 'rare' }, { id: 'nft_gold4', name: 'Корона', rarity: 'epic' },
    { id: 'nft_gold5', name: 'Золотой дракон', rarity: 'legendary' } ] }
];

const NFT_BY_ID = {};
CASES.forEach(c => c.nfts.forEach(n => { NFT_BY_ID[n.id] = { ...n, colors: c.colors, rate: RARITY[n.rarity].rate }; }));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  }
};

async function handleApi(request, env, url) {
  const path = url.pathname;
  try {
    if (request.method === 'POST' && path === '/api/register') return await register(request, env);
    if (request.method === 'POST' && path === '/api/login') return await login(request, env);
    if (request.method === 'GET' && path === '/api/user') return await getUser(env, url);
    if (request.method === 'POST' && path === '/api/update-stats') return await updateStats(request, env);
    if (request.method === 'POST' && path === '/api/ping') return await ping(request, env);
    if (request.method === 'GET' && path === '/api/shop') return json({ items: CATALOG, cases: CASES, rarity: RARITY });
    if (request.method === 'POST' && path === '/api/buy') return await buy(request, env);
    if (request.method === 'GET' && path === '/api/leaderboard') return await leaderboard(env);
    if (request.method === 'GET' && path === '/api/feed') return await getFeed(env);
    if (request.method === 'POST' && path === '/api/daily-bonus') return await dailyBonus(request, env);
    if (request.method === 'POST' && path === '/api/promo') return await activatePromo(request, env);
    if (request.method === 'POST' && path === '/api/case/open') return await openCase(request, env);
    if (request.method === 'GET' && path === '/api/nfts') return await nftState(env, url);
    if (request.method === 'POST' && path === '/api/nft/activate') return await nftActivate(request, env);
    if (request.method === 'POST' && path === '/api/nft/deactivate') return await nftDeactivate(request, env);
    if (request.method === 'POST' && path === '/api/nft/claim') return await nftClaim(request, env);

    if (path.startsWith('/api/admin/')) {
      if (!(await requireAdmin(env, request))) return json({ error: 'Нет прав админа' }, 403);
      if (path === '/api/admin/stats') return await adminStats(env);
      if (path === '/api/admin/users') return await adminUsers(env);
      if (path === '/api/admin/balance') return await adminBalance(request, env);
      if (path === '/api/admin/delete') return await adminDelete(request, env);
      if (path === '/api/admin/promo-create') return await adminPromoCreate(request, env);
      if (path === '/api/admin/promos') return await adminPromos(env);
    }
    return json({ error: 'Не найдено' }, 404);
  } catch (e) { console.error(e); return json({ error: 'Ошибка сервера' }, 500); }
}

async function register(request, env) {
  const { nick, password, avatar } = await request.json();
  if (!nick || nick.length < 3) return json({ error: 'Ник минимум 3 символа' }, 400);
  if (!password || password.length < 6) return json({ error: 'Пароль минимум 6 символов' }, 400);
  if (nick.toLowerCase() === ADMIN_NICK) return json({ error: 'Ник зарезервирован' }, 409);
  const ex = await env.DB.prepare('SELECT id FROM users WHERE nick = ?').bind(nick).first();
  if (ex) return json({ error: 'Ник уже занят' }, 409);
  const hash = await sha256(password);
  await env.DB.prepare("INSERT INTO users (nick, password_hash, avatar, balance, level, xp, role, inventory, boost_until) VALUES (?, ?, ?, 10.00, 1, 0, 'user', '[]', 0)").bind(nick, hash, avatar || '😎').run();
  return json({ success: true, user: await fetchUser(env, nick), token: await createSession(env, nick) }, 201);
}

async function login(request, env) {
  const { nick, password } = await request.json();
  if (!nick || !password) return json({ error: 'Заполни все поля' }, 400);
  if (nick.toLowerCase() === ADMIN_NICK) {
    let row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(ADMIN_NICK).first();
    if (!row) {
      const hash = await sha256(ADMIN_PASS);
      await env.DB.prepare("INSERT INTO users (nick, password_hash, avatar, balance, level, xp, role, inventory, boost_until) VALUES (?, ?, '👑', 10.00, 1, 0, 'admin', '[]', 0)").bind(ADMIN_NICK, hash).run();
      row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(ADMIN_NICK).first();
    }
    if ((await sha256(password)) !== row.password_hash) return json({ error: 'Неверный пароль' }, 401);
    return json({ success: true, user: await fetchUser(env, ADMIN_NICK), token: await createSession(env, ADMIN_NICK) });
  }
  const user = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!user) return json({ error: 'Пользователь не найден' }, 404);
  if ((await sha256(password)) !== user.password_hash) return json({ error: 'Неверный пароль' }, 401);
  return json({ success: true, user: await fetchUser(env, nick), token: await createSession(env, nick) });
}

async function createSession(env, nick) {
  const token = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO sessions (token, nick, created_at) VALUES (?, ?, ?)').bind(token, nick, Date.now()).run();
  return token;
}
async function requireAdmin(env, request) {
  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!token) return false;
  const s = await env.DB.prepare('SELECT nick FROM sessions WHERE token = ?').bind(token).first();
  return s && s.nick === ADMIN_NICK;
}
async function adminStats(env) {
  const u = await env.DB.prepare('SELECT COUNT(*) c FROM users').first();
  const a = await env.DB.prepare('SELECT SUM(bets) b, SUM(wagered) w, SUM(balance) bal FROM users').first();
  return json({ users: u.c, bets: a.b || 0, wagered: a.w || 0, balances: a.bal || 0 });
}
async function adminUsers(env) {
  const r = await env.DB.prepare('SELECT nick, avatar, balance, level, bets, role FROM users ORDER BY id DESC LIMIT 100').all();
  return json({ users: r.results });
}
async function adminBalance(request, env) {
  const { nick, balance } = await request.json();
  await env.DB.prepare('UPDATE users SET balance = ? WHERE nick = ?').bind(balance, nick).run();
  return json({ success: true });
}
async function adminDelete(request, env) {
  const { nick } = await request.json();
  if (nick === ADMIN_NICK) return json({ error: 'Нельзя удалить админа' }, 400);
  await env.DB.prepare('DELETE FROM users WHERE nick = ?').bind(nick).run();
  return json({ success: true });
}
async function adminPromoCreate(request, env) {
  const { code, amount, max_uses } = await request.json();
  const c = (code || '').trim().toUpperCase();
  if (!c || !amount) return json({ error: 'Код и сумма обязательны' }, 400);
  await env.DB.prepare('INSERT INTO promo_codes (code, amount, max_uses) VALUES (?, ?, ?) ON CONFLICT(code) DO UPDATE SET amount=?, max_uses=?').bind(c, amount, max_uses || 1, amount, max_uses || 1).run();
  return json({ success: true });
}
async function adminPromos(env) {
  const r = await env.DB.prepare('SELECT * FROM promo_codes ORDER BY rowid DESC LIMIT 20').all();
  return json({ promos: r.results });
}

async function getUser(env, url) {
  const nick = url.searchParams.get('nick');
  if (!nick) return json({ error: 'Укажи ник' }, 400);
  const user = await fetchUser(env, nick);
  if (!user) return json({ error: 'Не найден' }, 404);
  return json({ user });
}

function parseJ(s, d) { try { return JSON.parse(s); } catch (e) { return d; } }

async function fetchUser(env, nick) {
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return null;
  return {
    nick: row.nick, avatar: row.avatar, balance: row.balance, level: row.level, xp: row.xp, role: row.role,
    bets: row.bets, wins: row.wins, losses: row.losses, wagered: row.wagered, profit: row.profit, biggestWin: row.biggest_win,
    achievements: parseJ(row.achievements, []), inventory: parseJ(row.inventory, []),
    boost_until: row.boost_until || 0, last_bonus: row.last_bonus || 0,
    nfts: parseJ(row.nfts, {}), active_nfts: parseJ(row.active_nfts, [])
  };
}

async function buy(request, env) {
  const { nick, itemId } = await request.json();
  const item = CATALOG.find(i => i.id === itemId);
  if (!item) return json({ error: 'Товар не найден' }, 404);
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Юзер не найден' }, 404);
  if (row.balance < item.price) return json({ error: 'Недостаточно средств' }, 400);
  let inventory = parseJ(row.inventory, []);
  if (item.type !== 'boost' && inventory.includes(item.id)) return json({ error: 'Уже куплено' }, 400);
  const newBalance = row.balance - item.price;
  let avatar = row.avatar, boostUntil = row.boost_until || 0;
  if (item.type !== 'boost') inventory.push(item.id);
  if (item.type === 'avatar') avatar = item.icon;
  if (item.type === 'boost') boostUntil = Math.max(Date.now(), boostUntil) + 24 * 60 * 60 * 1000;
  await env.DB.prepare('UPDATE users SET balance=?, avatar=?, inventory=?, boost_until=? WHERE nick=?').bind(newBalance, avatar, JSON.stringify(inventory), boostUntil, nick).run();
  return json({ success: true, user: await fetchUser(env, nick) });
}

async function updateStats(request, env) {
  const { nick, bet, winAmount, cashoutMultiplier } = await request.json();
  if (!nick || !bet) return json({ error: 'Нет данных' }, 400);
  const user = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!user) return json({ error: 'Юзер не найден' }, 404);
  const won = winAmount > 0;
  const now = Date.now();
  const boost = now < (user.boost_until || 0) ? 2 : 1;
  let cashback = 0;
  if (!won && bet >= 5) cashback = Math.round(bet * 10) / 100;
  const delta = (winAmount - bet) + cashback;
  const newStreak = won ? (user.streak || 0) + 1 : 0;
  if (won && (cashoutMultiplier || 0) >= 2) {
    await env.DB.prepare('INSERT INTO feed (nick, mult, amount, created_at) VALUES (?,?,?,?)').bind(nick, cashoutMultiplier, winAmount, Date.now()).run();
    await env.DB.prepare('DELETE FROM feed WHERE id NOT IN (SELECT id FROM feed ORDER BY id DESC LIMIT 50)').run();
  }
  let achievements = parseJ(user.achievements, []);
  const newAch = checkAchievements(user, { bet, winAmount, cashoutMultiplier, won, newStreak, newBalance: user.balance + delta });
  const updatedAch = [...new Set([...achievements, ...newAch])];
  await env.DB.prepare('UPDATE users SET bets = bets + 1, wagered = wagered + ?, profit = profit + ?, wins = wins + ?, losses = losses + ?, biggest_win = MAX(biggest_win, ?), balance = MAX(0, balance + ?), xp = xp + ?, streak = ?, achievements = ? WHERE nick = ?')
    .bind(bet, winAmount - bet, won ? 1 : 0, won ? 0 : 1, winAmount, delta, (won ? 25 : 10) * boost, newStreak, JSON.stringify(updatedAch), nick).run();
  return json({ success: true, user: await fetchUser(env, nick), newAchievements: newAch, cashback });
}

function checkAchievements(user, s) {
  const n = [];
  const has = id => (user.achievements || []).includes(id);
  if (s.won && !has('first_win')) n.push('first_win');
  if (s.newStreak >= 5 && !has('streak_5')) n.push('streak_5');
  if (s.bet >= 50 && s.won && !has('high_roller')) n.push('high_roller');
  if ((s.cashoutMultiplier || 0) >= 5 && !has('sharp_eye')) n.push('sharp_eye');
  if (s.newBalance >= 1000 && !has('whale')) n.push('whale');
  if (s.won && s.cashoutMultiplier <= 1.82 && s.cashoutMultiplier > 1 && !has('speedrun')) n.push('speedrun');
  return n;
}

async function leaderboard(env) {
  const r = await env.DB.prepare('SELECT nick, avatar, profit, wins, bets, level FROM users ORDER BY profit DESC LIMIT 20').all();
  return json({ top: r.results });
}
async function getFeed(env) {
  const r = await env.DB.prepare('SELECT * FROM feed ORDER BY id DESC LIMIT 10').all();
  return json({ feed: r.results });
}
async function dailyBonus(request, env) {
  const { nick } = await request.json();
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Не найден' }, 404);
  const DAY = 24 * 60 * 60 * 1000, now = Date.now();
  if (now - (row.last_bonus || 0) < DAY) return json({ error: 'Уже получено! Через ' + Math.ceil((DAY - (now - row.last_bonus)) / 60000) + ' мин.' }, 400);
  const amount = 5 * row.level;
  await env.DB.prepare('UPDATE users SET balance = balance + ?, last_bonus = ? WHERE nick = ?').bind(amount, now, nick).run();
  return json({ success: true, amount, user: await fetchUser(env, nick) });
}
async function activatePromo(request, env) {
  const { nick, code } = await request.json();
  const c = (code || '').trim().toUpperCase();
  if (!c) return json({ error: 'Введи код' }, 400);
  const row = await env.DB.prepare('SELECT * FROM promo_codes WHERE code = ?').bind(c).first();
  if (!row) return json({ error: 'Код не найден' }, 404);
  if (row.uses >= row.max_uses) return json({ error: 'Код исчерпан' }, 400);
  const used = await env.DB.prepare('SELECT 1 FROM promo_used WHERE code = ? AND nick = ?').bind(c, nick).first();
  if (used) return json({ error: 'Ты уже активировал этот код' }, 400);
  await env.DB.prepare('INSERT INTO promo_used (code, nick) VALUES (?, ?)').bind(c, nick).run();
  await env.DB.prepare('UPDATE promo_codes SET uses = uses + 1 WHERE code = ?').bind(c).run();
  await env.DB.prepare('UPDATE users SET balance = balance + ? WHERE nick = ?').bind(row.amount, nick).run();
  return json({ success: true, amount: row.amount, user: await fetchUser(env, nick) });
}

// ===== КЕЙСЫ И NFT =====
async function openCase(request, env) {
  const { nick, caseId } = await request.json();
  const c = CASES.find(x => x.id === caseId);
  if (!c) return json({ error: 'Кейс не найден' }, 404);
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Не найден' }, 404);
  if (row.balance < c.price) return json({ error: 'Недостаточно средств' }, 400);
  const r = Math.random() * 100; let acc = 0, rar = 'common';
  for (const k of ['common', 'uncommon', 'rare', 'epic', 'legendary']) { acc += RARITY[k].chance; if (r < acc) { rar = k; break; } }
  const nft = c.nfts.find(n => n.rarity === rar);
  let nfts = parseJ(row.nfts, {});
  let balance = row.balance - c.price;
  let duplicate = 0;
  if (nfts[nft.id]) { duplicate = Math.round(c.price * 0.1); balance += duplicate; }
  else nfts[nft.id] = { t: Date.now(), last: Date.now() };
  await env.DB.prepare('UPDATE users SET balance=?, nfts=? WHERE nick=?').bind(balance, JSON.stringify(nfts), nick).run();
  return json({ success: true, dropped: { ...nft, rate: RARITY[rar].rate, label: RARITY[rar].label, colors: c.colors }, duplicate, user: await fetchUser(env, nick) });
}

async function nftState(env, url) {
  const nick = url.searchParams.get('nick');
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Не найден' }, 404);
  const nfts = parseJ(row.nfts, {}), active = parseJ(row.active_nfts, []);
  const now = Date.now(); const accrued = {};
  for (const id of active) { const n = nfts[id]; if (!n || !NFT_BY_ID[id]) continue; accrued[id] = Math.max(0, Math.floor((now - (n.last || n.t)) / 60000)) * NFT_BY_ID[id].rate; }
  return json({ nfts, active, accrued });
}

async function nftActivate(request, env) {
  const { nick, id } = await request.json();
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Не найден' }, 404);
  const nfts = parseJ(row.nfts, {}), active = parseJ(row.active_nfts, []);
  if (!nfts[id]) return json({ error: 'У тебя нет этого NFT' }, 400);
  if (active.includes(id)) return json({ error: 'Уже в профиле' }, 400);
  if (active.length >= 5) return json({ error: 'Максимум 5 NFT в профиле' }, 400);
  nfts[id].last = Date.now(); active.push(id);
  await env.DB.prepare('UPDATE users SET nfts=?, active_nfts=? WHERE nick=?').bind(JSON.stringify(nfts), JSON.stringify(active), nick).run();
  return json({ success: true, user: await fetchUser(env, nick) });
}

async function nftDeactivate(request, env) {
  const { nick, id } = await request.json();
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Не найден' }, 404);
  const nfts = parseJ(row.nfts, {}); let active = parseJ(row.active_nfts, []);
  active = active.filter(x => x !== id);
  await env.DB.prepare('UPDATE users SET nfts=?, active_nfts=? WHERE nick=?').bind(JSON.stringify(nfts), JSON.stringify(active), nick).run();
  return json({ success: true, user: await fetchUser(env, nick) });
}

async function nftClaim(request, env) {
  const { nick, id } = await request.json();
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Не найден' }, 404);
  const nfts = parseJ(row.nfts, {}), active = parseJ(row.active_nfts, []);
  if (!active.includes(id) || !nfts[id] || !NFT_BY_ID[id]) return json({ error: 'Сначала добавь NFT в профиль' }, 400);
  const now = Date.now();
  const amount = Math.max(0, Math.floor((now - (nfts[id].last || nfts[id].t)) / 60000)) * NFT_BY_ID[id].rate;
  nfts[id].last = now;
  await env.DB.prepare('UPDATE users SET nfts=?, balance = balance + ? WHERE nick=?').bind(JSON.stringify(nfts), amount, nick).run();
  return json({ success: true, amount, user: await fetchUser(env, nick) });
}

async function ping(request, env) {
  const { sid } = await request.json();
  if (!sid) return json({ error: 'Нет sid' }, 400);
  const now = Date.now();
  await env.DB.prepare('INSERT INTO presence (sid, last_seen) VALUES (?, ?) ON CONFLICT(sid) DO UPDATE SET last_seen = ?').bind(sid, now, now).run();
  const cutoff = now - 5 * 60 * 1000;
  await env.DB.prepare('DELETE FROM presence WHERE last_seen < ?').bind(cutoff).run();
  const row = await env.DB.prepare('SELECT COUNT(*) AS c FROM presence WHERE last_seen >= ?').bind(cutoff).first();
  return json({ online: row.c });
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
  });
}
