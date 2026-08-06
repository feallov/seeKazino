// ===== seeKazino Worker: сайт + API + база D1 =====

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Всё, что начинается с /api/ — идёт в логику API
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    // Всё остальное — статика (HTML/CSS/JS)
    return env.ASSETS.fetch(request);
  }
};

async function handleApi(request, env, url) {
  const path = url.pathname;

  try {
    if (request.method === 'POST' && path === '/api/register') {
      return await register(request, env);
    }
    if (request.method === 'POST' && path === '/api/login') {
      return await login(request, env);
    }
    if (request.method === 'GET' && path === '/api/balance') {
      return await balance(env, url);
    }
    return json({ error: 'Не найдено' }, 404);
  } catch (e) {
    return json({ error: 'Ошибка сервера' }, 500);
  }
}

// ===== РЕГИСТРАЦИЯ =====
async function register(request, env) {
  const { nick, password, avatar } = await request.json();

  if (!nick || nick.length < 3) return json({ error: 'Ник минимум 3 символа' }, 400);
  if (!password || password.length < 6) return json({ error: 'Пароль минимум 6 символов' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE nick = ?').bind(nick).first();
  if (existing) return json({ error: 'Ник уже занят' }, 409);

  const passwordHash = await sha256(password);

  await env.DB.prepare(
    "INSERT INTO users (nick, password_hash, avatar, balance, level, xp, role) VALUES (?, ?, ?, 10.00, 1, 0, 'user')"
  ).bind(nick, passwordHash, avatar || '😎').run();

  return json({ success: true, user: { nick, avatar: avatar || '😎', balance: 10.00 } }, 201);
}

// ===== ВХОД =====
async function login(request, env) {
  const { nick, password } = await request.json();
  if (!nick || !password) return json({ error: 'Заполни все поля' }, 400);

  const user = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
  if (!user) return json({ error: 'Пользователь не найден' }, 404);

  const passwordHash = await sha256(password);
  if (user.password_hash !== passwordHash) return json({ error: 'Неверный пароль' }, 401);

  return json({
    success: true,
    user: {
      nick: user.nick,
      avatar: user.avatar,
      balance: user.balance,
      level: user.level,
      xp: user.xp,
      role: user.role
    }
  });
}

// ===== БАЛАНС =====
async function balance(env, url) {
  const nick = url.searchParams.get('nick');
  if (!nick) return json({ error: 'Укажи ник' }, 400);

  const user = await env.DB.prepare('SELECT balance FROM users WHERE nick = ?').bind(nick).first();
  if (!user) return json({ error: 'Не найден' }, 404);

  return json({ balance: user.balance });
}

// ===== ПОМОЩНИКИ =====
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
