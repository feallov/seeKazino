// Cloudflare Pages Function: GET /api/balance?nick=xxx
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        const url = new URL(request.url);
        const nick = url.searchParams.get('nick');

        if (!nick) {
            return jsonResponse({ error: 'Укажи ник' }, 400);
        }

        const user = await env.DB.prepare('SELECT balance FROM users WHERE nick = ?').bind(nick).first();
        
        if (!user) {
            return jsonResponse({ error: 'Не найден' }, 404);
        }

        return jsonResponse({ balance: user.balance });

    } catch (err) {
        return jsonResponse({ error: 'Ошибка сервера' }, 500);
    }
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}