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

  const existing = await env.DB.prepare('SELECT id FROM users WHERE nick = ?').bind(nick).first();
  if (existing) return json({ error: 'Ник уже занят' }, 409);

  const passwordHash = await sha256(password);
  await env.DB.prepare(
    "INSERT INTO users (nick, password_hash, avatar, balance, level, xp, role, achievements, streak) VALUES (?, ?, ?, 10.00, 1, 0, 'user', '[]', 0)"
  ).bind(nick, passwordHash, avatar || '😎').run();

  return json({ success: true, user: await fetchUser(env, nick) }, 201);
}

async function login(request, env) {
  const { nick, password } = await request.json();
  if (!nick || !password) return json({ error: 'Заполни все поля' }, 400);

  const user = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!user) return json({ error: 'Пользователь не найден' }, 404);

  const passwordHash = await sha256(password);
  if (user.password_hash !== passwordHash) return json({ error: 'Неверный пароль' }, 401);

  return json({ success: true, user: await fetchUser(env, nick) });
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
  let achievements = [];
  try { achievements = JSON.parse(row.achievements || '[]'); } catch (e) {}
  return {
    nick: row.nick, avatar: row.avatar, balance: row.balance,
    level: row.level, xp: row.xp, role: row.role,
    bets: row.bets, wins: row.wins, losses: row.losses,
    wagered: row.wagered, profit: row.profit, biggestWin: row.biggest_win,
    achievements, streak: row.streak || 0
  };
}

async function updateStats(request, env) {
  const { nick, bet, winAmount, cashoutMultiplier } = await request.json();
  if (!nick) return json({ error: 'Нет ника' }, 400);

  const user = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!user) return json({ error: 'Юзер не найден' }, 404);

  const won = winAmount > 0;
  const newBets = user.bets + 1;
  const newWagered = user.wagered + bet;
  const newProfit = user.profit + (winAmount - bet);
  const newWins = won ? user.wins + 1 : user.wins;
  const newLosses = won ? user.losses : user.losses + 1;
  const newBiggest = Math.max(user.biggest_win, winAmount);
  const newBalance = user.balance + (winAmount - bet);
  const newXp = user.xp + (won ? 25 : 10);
  const newStreak = won ? (user.streak || 0) + 1 : 0;

  let achievements = [];
  try { achievements = JSON.parse(user.achievements || '[]'); } catch (e) {}
  const newAch = checkAchievements(user, { bet, winAmount, cashoutMultiplier, won, newStreak, newBalance });
  const updatedAch = [...new Set([...achievements, ...newAch])];

  await env.DB.prepare(
    'UPDATE users SET bets=?, wagered=?, profit=?, wins=?, losses=?, biggest_win=?, balance=?, xp=?, streak=?, achievements=? WHERE nick=?'
  ).bind(newBets, newWagered, newProfit, newWins, newLosses, newBiggest, newBalance, newXp, newStreak, JSON.stringify(updatedAch), nick).run();

  return json({ 
    success: true, 
    user: await fetchUser(env, nick),
    newAchievements: newAch
  });
}

function checkAchievements(user, s) {
  const newOnes = [];
  const has = (id) => (user.achievements || []).includes(id);
  
  if (s.won && !has('first_win')) newOnes.push('first_win');
  if (s.newStreak >= 5 && !has('streak_5')) newOnes.push('streak_5');
  if (s.bet >= 50 && s.won && !has('high_roller')) newOnes.push('high_roller');
  if ((s.cashoutMultiplier || 0) >= 5 && !has('sharp_eye')) newOnes.push('sharp_eye');
  if (s.newBalance >= 1000 && !has('whale')) newOnes.push('whale');
  if (s.won && s.cashoutMultiplier <= 1.82 && s.cashoutMultiplier > 1 && !has('speedrun')) newOnes.push('speedrun');
  
  return newOnes;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
