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

  { id: 'bp_xp2', type: 'boost', name: 'XP x2 (24ч)', icon: '⚡', price: 150 },

  { id: 'nft_doge',   type: 'nft', name: 'Doge',        icon: '🐶', price: 100,  rarity: 'common' },
  { id: 'nft_pixel',  type: 'nft', name: 'Pixel Relic', icon: '👾', price: 250,  rarity: 'rare' },
  { id: 'nft_cat',    type: 'nft', name: 'Crypto Cat',  icon: '🐱', price: 300,  rarity: 'rare' },
  { id: 'nft_rocket', type: 'nft', name: 'Moon Ticket', icon: '🚀', price: 500,  rarity: 'epic' },
  { id: 'nft_gem',    type: 'nft', name: 'Genesis Gem', icon: '💎', price: 600,  rarity: 'epic' },
  { id: 'nft_ape',    type: 'nft', name: 'Bored Ape',   icon: '🦍', price: 1000, rarity: 'legendary' }
];

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
    if (request.method === 'GET' && path === '/api/shop') return json({ items: CATALOG });
    if (request.method === 'POST' && path === '/api/buy') return await buy(request, env);
    if (request.method === 'GET' && path === '/api/leaderboard') return await leaderboard(env);
    if (request.method === 'GET' && path === '/api/feed') return await getFeed(env);
    if (request.method === 'POST' && path === '/api/daily-bonus') return await dailyBonus(request, env);
    if (request.method === 'POST' && path === '/api/promo') return await activatePromo(request, env);

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
  } catch (e) {
    console.error(e);
    return json({ error: 'Ошибка сервера' }, 500);
  }
}

async function register(request, env) {
  const { nick, password, avatar } = await request.json();
  if (!nick || nick.length < 3) return json({ error: 'Ник минимум 3 символа' }, 400);
  if (!password || password.length < 6) return json({ error: 'Пароль минимум 6 символов' }, 400);
  if (nick.toLowerCase() === ADMIN_NICK) return json({ error: 'Ник зарезервирован' }, 409);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE nick = ?').bind(nick).first();
  if (existing) return json({ error: 'Ник уже занят' }, 409);

  const passwordHash = await sha256(password);
  await env.DB.prepare(
    "INSERT INTO users (nick, password_hash, avatar, balance, level, xp, role, inventory, boost_until) VALUES (?, ?, ?, 10.00, 1, 0, 'user', '[]', 0)"
  ).bind(nick, passwordHash, avatar || '😎').run();

  return json({ success: true, user: await fetchUser(env, nick), token: await createSession(env, nick) }, 201);
}

async function login(request, env) {
  const { nick, password } = await request.json();
  if (!nick || !password) return json({ error: 'Заполни все поля' }, 400);

  if (nick.toLowerCase() === ADMIN_NICK) {
    let row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(ADMIN_NICK).first();
    if (!row) {
      const hash = await sha256(ADMIN_PASS);
      await env.DB.prepare(
        "INSERT INTO users (nick, password_hash, avatar, balance, level, xp, role, inventory, boost_until) VALUES (?, ?, '👑', 10.00, 1, 0, 'admin', '[]', 0)"
      ).bind(ADMIN_NICK, hash).run();
      row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(ADMIN_NICK).first();
    }
    const hash = await sha256(password);
    if (hash !== row.password_hash) return json({ error: 'Неверный пароль' }, 401);
    return json({ success: true, user: await fetchUser(env, ADMIN_NICK), token: await createSession(env, ADMIN_NICK) });
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!user) return json({ error: 'Пользователь не найден' }, 404);
  const passwordHash = await sha256(password);
  if (user.password_hash !== passwordHash) return json({ error: 'Неверный пароль' }, 401);

  return json({ success: true, user: await fetchUser(env, nick), token: await createSession(env, nick) });
}

async function createSession(env, nick) {
  const token = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO sessions (token, nick, created_at) VALUES (?, ?, ?)').bind(token, nick, Date.now()).run();
  return token;
}

async function requireAdmin(env, request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return false;
  const sess = await env.DB.prepare('SELECT nick FROM sessions WHERE token = ?').bind(token).first();
  return sess && sess.nick === ADMIN_NICK;
}

async function adminStats(env) {
  const u = await env.DB.prepare('SELECT COUNT(*) c FROM users').first();
  const a = await env.DB.prepare('SELECT SUM(bets) b, SUM(wagered) w, SUM(balance) bal FROM users').first();
  return json({ users: u.c, bets: a.b || 0, wagered: a.w || 0, balances: a.bal || 0 });
}

async function adminUsers(env) {
  const rows = await env.DB.prepare('SELECT nick, avatar, balance, level, bets, role FROM users ORDER BY id DESC LIMIT 100').all();
  return json({ users: rows.results });
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
  await env.DB.prepare('INSERT INTO promo_codes (code, amount, max_uses) VALUES (?, ?, ?) ON CONFLICT(code) DO UPDATE SET amount=?, max_uses=?')
    .bind(c, amount, max_uses || 1, amount, max_uses || 1).run();
  return json({ success: true });
}

async function adminPromos(env) {
  const rows = await env.DB.prepare('SELECT * FROM promo_codes ORDER BY rowid DESC LIMIT 20').all();
  return json({ promos: rows.results });
}

async function getUser(env, url) {
  const nick = url.searchParams.get('nick');
  if (!nick) return json({ error: 'Укажи ник' }, 400);
  const user = await fetchUser(env, nick);
  if (!user) return json({ error: 'Не найден' }, 404);
  return json({ user });
}

async function fetchUser(env, nick) {
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return null;
  let achievements = [], inventory = [];
  try { achievements = JSON.parse(row.achievements || '[]'); } catch (e) {}
  try { inventory = JSON.parse(row.inventory || '[]'); } catch (e) {}
  return {
    nick: row.nick, avatar: row.avatar, balance: row.balance,
    level: row.level, xp: row.xp, role: row.role,
    bets: row.bets, wins: row.wins, losses: row.losses,
    wagered: row.wagered, profit: row.profit, biggestWin: row.biggest_win,
    achievements, inventory, boost_until: row.boost_until || 0, last_bonus: row.last_bonus || 0
  };
}

async function buy(request, env) {
  const { nick, itemId } = await request.json();
  const item = CATALOG.find(i => i.id === itemId);
  if (!item) return json({ error: 'Товар не найден' }, 404);

  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Юзер не найден' }, 404);
  if (row.balance < item.price) return json({ error: 'Недостаточно средств' }, 400);

  let inventory = [];
  try { inventory = JSON.parse(row.inventory || '[]'); } catch (e) {}
  if (item.type !== 'boost' && inventory.includes(item.id)) return json({ error: 'Уже куплено' }, 400);

  const newBalance = row.balance - item.price;
  let avatar = row.avatar;
  let boostUntil = row.boost_until || 0;

  if (item.type !== 'boost') inventory.push(item.id);
  if (item.type === 'avatar') avatar = item.icon;
  if (item.type === 'boost') boostUntil = Math.max(Date.now(), boostUntil) + 24 * 60 * 60 * 1000;

  await env.DB.prepare('UPDATE users SET balance=?, avatar=?, inventory=?, boost_until=? WHERE nick=?')
    .bind(newBalance, avatar, JSON.stringify(inventory), boostUntil, nick).run();

  return json({ success: true, user: await fetchUser(env, nick) });
}

async function updateStats(request, env) {
  const { nick, bet, winAmount, cashoutMultiplier } = await request.json();
  if (!nick) return json({ error: 'Нет ника' }, 400);

  const user = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!user) return json({ error: 'Юзер не найден' }, 404);

  const won = winAmount > 0;
  const now = Date.now();
  const boost = now < (user.boost_until || 0) ? 2 : 1;

  const newBets = user.bets + 1;
  const newWagered = user.wagered + bet;
  const newProfit = user.profit + (winAmount - bet);
  const newWins = won ? user.wins + 1 : user.wins;
  const newLosses = won ? user.losses : user.losses + 1;
  const newBiggest = Math.max(user.biggest_win, winAmount);
  const newBalance = user.balance + (winAmount - bet);
  const newXp = user.xp + (won ? 25 : 10) * boost;
  const newStreak = won ? (user.streak || 0) + 1 : 0;

  if (won && (cashoutMultiplier || 0) >= 2) {
    await env.DB.prepare('INSERT INTO feed (nick, mult, amount, created_at) VALUES (?,?,?,?)')
      .bind(nick, cashoutMultiplier, winAmount, Date.now()).run();
    await env.DB.prepare('DELETE FROM feed WHERE id NOT IN (SELECT id FROM feed ORDER BY id DESC LIMIT 50)').run();
  }

  let achievements = [];
  try { achievements = JSON.parse(user.achievements || '[]'); } catch (e) {}
  const newAch = checkAchievements(user, { bet, winAmount, cashoutMultiplier, won, newStreak, newBalance });
  const updatedAch = [...new Set([...achievements, ...newAch])];

  await env.DB.prepare(
    'UPDATE users SET bets=?, wagered=?, profit=?, wins=?, losses=?, biggest_win=?, balance=?, xp=?, streak=?, achievements=? WHERE nick=?'
  ).bind(newBets, newWagered, newProfit, newWins, newLosses, newBiggest, newBalance, newXp, newStreak, JSON.stringify(updatedAch), nick).run();

  return json({ success: true, user: await fetchUser(env, nick), newAchievements: newAch });
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
  const rows = await env.DB.prepare('SELECT nick, avatar, profit, wins, bets, level FROM users ORDER BY profit DESC LIMIT 20').all();
  return json({ top: rows.results });
}

async function getFeed(env) {
  const rows = await env.DB.prepare('SELECT * FROM feed ORDER BY id DESC LIMIT 10').all();
  return json({ feed: rows.results });
}

async function dailyBonus(request, env) {
  const { nick } = await request.json();
  const row = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!row) return json({ error: 'Не найден' }, 404);

  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now - (row.last_bonus || 0) < DAY) {
    const left = Math.ceil((DAY - (now - row.last_bonus)) / 60000);
    return json({ error: 'Уже получено! Через ' + left + ' мин.' }, 400);
  }

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
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
