// ===== ГЕНЕРАТОР SVG-АРТОВ NFT (не эмодзи) =====
function nftArt(n) {
  const c1 = (n.colors && n.colors[0]) || '#22C55E';
  const rc = (Shop.rarity && Shop.rarity[n.rarity] && Shop.rarity[n.rarity].color) || '#8B9099';
  let h = 0; for (const ch of n.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  let shapes = '';
  for (let i = 0; i < 6; i++) {
    const x = 15 + ((h >> (i * 3)) % 70), y = 15 + ((h >> (i * 2 + 1)) % 70), r = 6 + ((h >> i) % 14);
    shapes += `<circle cx='${x}' cy='${y}' r='${r}' fill='${i % 2 ? c1 : '#0B0D10'}' opacity='0.4'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='#0B0D10'/></linearGradient></defs><rect width='120' height='120' fill='url(#g)'/>${shapes}<rect x='5' y='5' width='110' height='110' fill='none' stroke='${rc}' stroke-width='4'/><polygon points='60,32 80,55 60,78 40,55' fill='${rc}' opacity='0.95'/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const Shop = {
  items: [], cases: [], rarity: {},

  async init() {
    this.injectStyles();
    const res = await fetch('/api/shop');
    const data = await res.json();
    this.items = data.items || []; this.cases = data.cases || []; this.rarity = data.rarity || {};
    this.render();
    this.bindPromo();
  },

  injectStyles() {
    if (document.getElementById('shopExtraCss')) return;
    const s = document.createElement('style');
    s.id = 'shopExtraCss';
    s.textContent = `
      .case-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;text-align:center;display:flex;flex-direction:column;gap:8px;transition:all .2s}
      .case-card:hover{border-color:var(--green-bright);transform:translateY(-3px)}
      .case-icon{font-size:46px}
      .case-odds{font-size:10px;color:var(--text-muted)}
      .case-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:2000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:16px}
      .reel-wrap{width:100%;max-width:560px;overflow:hidden;position:relative;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
      .reel-marker{position:absolute;left:50%;top:0;bottom:0;width:3px;background:var(--green-bright);z-index:2;transform:translateX(-50%)}
      .reel-strip{display:flex;gap:8px;padding:12px 0;will-change:transform}
      .reel-item{flex:0 0 96px;display:flex;flex-direction:column;align-items:center;gap:4px}
      .reel-item img{width:76px;height:76px;border-radius:10px}
      .reel-item span{font-size:9px;color:var(--text-muted);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .nft-img{width:64px;height:64px;border-radius:10px}
      .drop-result{display:flex;flex-direction:column;align-items:center;gap:8px;animation:dropIn .4s ease}
      .drop-result img{width:120px;height:120px;border-radius:14px}
      @keyframes dropIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
    `;
    document.head.appendChild(s);
  },

  render() {
    const user = Store.getUser();
    const root = document.getElementById('shopGrid');
    if (!root) return;
    root.innerHTML = '';

    // ===== КЕЙСЫ =====
    if (this.cases.length) {
      const h = document.createElement('h2'); h.className = 'shop-section'; h.textContent = '🎁 Кейсы'; root.appendChild(h);
      const cw = document.createElement('div'); cw.className = 'shop-grid';
      this.cases.forEach(c => {
        const card = document.createElement('div');
        card.className = 'case-card';
        card.innerHTML = `
          <span class="case-icon">${c.icon}</span>
          <span class="shop-name">${c.name}</span>
          <span class="case-ods case-odds">🟢60% 🔵10% 🟣4% 🟡1%</span>
          <button class="btn btn-primary btn-full case-open" data-id="${c.id}">Открыть $${c.price}</button>`;
        cw.appendChild(card);
      });
      root.appendChild(cw);
      cw.querySelectorAll('.case-open').forEach(b => b.addEventListener('click', () => this.openCase(b.dataset.id, b)));
    }

    // ===== ОСТАЛЬНЫЕ ТОВАРЫ =====
    const sections = [
      { type: 'avatar', title: '😎 Аватары' },
      { type: 'theme', title: '🎨 Темы' },
      { type: 'boost', title: '⚡ Бусты' }
    ];
    sections.forEach(sec => {
      const items = this.items.filter(i => i.type === sec.type);
      if (!items.length) return;
      const h = document.createElement('h2'); h.className = 'shop-section'; h.textContent = sec.title; root.appendChild(h);
      const wrap = document.createElement('div'); wrap.className = 'shop-grid';
      items.forEach(i => wrap.appendChild(this.card(i, user)));
      root.appendChild(wrap);
    });

    root.querySelectorAll('.shop-buy').forEach(b => b.addEventListener('click', () => this.buy(b.dataset.id)));
    root.querySelectorAll('.shop-equip').forEach(b => b.addEventListener('click', () => this.equip(b.dataset.id)));
    root.querySelectorAll('.shop-unequip').forEach(b => b.addEventListener('click', () => this.unequip()));
  },

  card(item, user) {
    const owned = user && user.inventory && user.inventory.includes(item.id);
    const equipped = localStorage.getItem('seekazino_theme') === item.id;
    const card = document.createElement('div');
    card.className = 'shop-card' + (owned ? ' shop-owned' : '');
    let action = '';
    if (item.type === 'boost') {
      const active = user && user.boost_until > Date.now();
      action = active ? '<button class="btn btn-ghost btn-full" disabled>⚡ Активен</button>'
        : `<button class="btn btn-primary btn-full shop-buy" data-id="${item.id}">Купить $${item.price}</button>`;
    } else if (item.type === 'theme' && owned) {
      action = equipped ? '<button class="btn btn-ghost btn-full shop-unequip">✓ Надета — Снять</button>'
        : `<button class="btn btn-primary btn-full shop-equip" data-id="${item.id}">Надеть</button>`;
    } else if (owned) {
      action = '<button class="btn btn-ghost btn-full" disabled>✓ Куплено</button>';
    } else {
      action = `<button class="btn btn-primary btn-full shop-buy" data-id="${item.id}">Купить $${item.price}</button>`;
    }
    card.innerHTML = `<span class="shop-icon">${item.icon}</span><span class="shop-name">${item.name}</span><span class="shop-type">${item.type === 'avatar' ? 'Аватар' : item.type === 'theme' ? 'Тема' : 'Буст'}</span>${action}`;
    return card;
  },

  // ===== ОТКРЫТИЕ КЕЙСА С ПЛАВНОЙ ПРОКРУТКОЙ =====
  async openCase(caseId, btn) {
    const c = this.cases.find(x => x.id === caseId);
    if (!c) return;
    btn.disabled = true;

    // Сначала крутим рулетку (интрига), потом сервер говорит результат
    const modal = document.createElement('div');
    modal.className = 'case-modal';
    modal.innerHTML = `
      <div style="font-size:20px;font-weight:700;">${c.icon} ${c.name}</div>
      <div class="reel-wrap"><div class="reel-marker"></div><div class="reel-strip" id="reelStrip"></div></div>
      <div id="dropResult" style="min-height:40px;color:var(--text-muted);">Крутим...</div>`;
    document.body.appendChild(modal);

    const strip = modal.querySelector('#reelStrip');
    const CARD = 104; // 96 + gap 8
    const COUNT = 60, WIN = 52;
    // временная лента (результат подставим после ответа сервера)
    const pool = c.nfts;
    for (let i = 0; i < COUNT; i++) {
      const n = pool[Math.floor(Math.random() * pool.length)];
      strip.appendChild(this.reelItem(n));
    }

    // Запрашиваем результат
    const user = Store.getUser();
    const res = await fetch('/api/case/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick: user.nick, caseId }) });
    const data = await res.json();
    btn.disabled = false;

    if (!data.success) {
      modal.querySelector('#dropResult').textContent = data.error || 'Ошибка';
      setTimeout(() => modal.remove(), 1500);
      return;
    }

    Store.setUser(data.user); updateBalanceDisplay();

    // Подставляем выигрыш в нужную позицию
    const dropped = data.dropped;
    strip.children[WIN].replaceWith(this.reelItem(dropped));

    // Плавная прокрутка
    const wrap = modal.querySelector('.reel-wrap');
    const center = wrap.clientWidth / 2;
    const jitter = Math.floor(Math.random() * 60) - 30;
    const finalX = -(WIN * CARD + 48 - center + jitter);
    strip.style.transition = 'transform 4s cubic-bezier(.12,.8,.2,1)';
    requestAnimationFrame(() => { strip.style.transform = 'translateX(' + finalX + 'px)'; });

    setTimeout(() => {
      const rc = (this.rarity[dropped.rarity] || {}).color || '#8B9099';
      modal.querySelector('#dropResult').innerHTML = `
        <div class="drop-result">
          <img src="${nftArt(dropped)}">
          <div style="font-weight:700;">${dropped.name}</div>
          <div style="color:${rc};font-size:12px;">${dropped.label} · $${dropped.rate}/мин</div>
          ${data.duplicate ? `<div style="color:var(--text-muted);font-size:12px;">Дубликат → +$${data.duplicate}</div>` : ''}
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" id="againBtn">Открыть ещё</button>
            <button class="btn btn-ghost" id="closeBtn">Забрать</button>
          </div>
        </div>`;
      modal.querySelector('#againBtn').addEventListener('click', () => { modal.remove(); this.openCase(caseId, btn); });
      modal.querySelector('#closeBtn').addEventListener('click', () => { modal.remove(); this.render(); });
      if (window.Sounds) Sounds.win();
    }, 4200);
  },

  reelItem(n) {
    const d = document.createElement('div');
    d.className = 'reel-item';
    const rc = (this.rarity[n.rarity] || {}).color || '#8B9099';
    d.innerHTML = `<img src="${nftArt({ ...n, colors: n.colors })}" style="border:2px solid ${rc}"><span>${n.name}</span>`;
    return d;
  },

  bindPromo() {
    const promoBtn = document.getElementById('promoBtn');
    if (!promoBtn) return;
    promoBtn.addEventListener('click', async () => {
      const user = Store.getUser();
      const code = document.getElementById('promoInput').value;
      const r = await fetch('/api/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick: user.nick, code }) });
      const d = await r.json();
      if (d.success) { Store.setUser(d.user); updateBalanceDisplay(); alert('🎟️ +' + d.amount + '$ по промокоду!'); document.getElementById('promoInput').value = ''; }
      else alert(d.error);
    });
  },

  async buy(id) {
    const user = Store.getUser();
    if (!user) return;
    const res = await fetch('/api/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick: user.nick, itemId: id }) });
    const data = await res.json();
    if (!data.success) { alert(data.error || 'Ошибка'); return; }
    Store.setUser(data.user); updateBalanceDisplay();
    const item = this.items.find(i => i.id === id);
    if (item && item.type === 'theme') this.equip(id);
    this.render();
  },

  equip(id) { localStorage.setItem('seekazino_theme', id); applyTheme(); this.render(); },
  unequip() { localStorage.removeItem('seekazino_theme'); applyTheme(); this.render(); }
};

document.addEventListener('DOMContentLoaded', () => Shop.init());
