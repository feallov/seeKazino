// Cloudflare Pages Function: POST /api/register
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { nick, password, avatar } = await request.json();

        // Валидация
        if (!nick || nick.length < 3) {
            return jsonResponse({ error: 'Ник минимум 3 символа' }, 400);
        }
        if (!password || password.length < 6) {
            return jsonResponse({ error: 'Пароль минимум 6 символов' }, 400);
        }

        // Проверяем, существует ли пользователь
        const existing = await env.DB.prepare('SELECT id FROM users WHERE nick = ?').bind(nick).first();
        if (existing) {
            return jsonResponse({ error: 'Ник уже занят' }, 409);
        }

        // Хешируем пароль (SHA-256)
        const passwordHash = await sha256(password);

        // Создаём пользователя
        await env.DB.prepare(
            'INSERT INTO users (nick, password_hash, avatar, balance, level, xp) VALUES (?, ?, ?, 10.00, 1, 0)'
        ).bind(nick, passwordHash, avatar || '😎').run();

        return jsonResponse({ 
            success: true, 
            user: { nick, avatar: avatar || '😎', balance: 10.00 } 
        }, 201);

    } catch (err) {
        return jsonResponse({ error: 'Ошибка сервера' }, 500);
    }
}

async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}