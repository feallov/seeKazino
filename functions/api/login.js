// Cloudflare Pages Function: POST /api/login
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { nick, password } = await request.json();

        if (!nick || !password) {
            return jsonResponse({ error: 'Заполни все поля' }, 400);
        }

        const user = await env.DB.prepare('SELECT * FROM users WHERE nick = ?').bind(nick).first();
        
        if (!user) {
            return jsonResponse({ error: 'Пользователь не найден' }, 404);
        }

        const passwordHash = await sha256(password);
        if (user.password_hash !== passwordHash) {
            return jsonResponse({ error: 'Неверный пароль' }, 401);
        }

        return jsonResponse({
            success: true,
            user: {
                nick: user.nick,
                avatar: user.avatar,
                balance: user.balance,
                level: user.level,
                xp: user.xp
            }
        });

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