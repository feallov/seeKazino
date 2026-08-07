const Shop = {
  items: [], cases: [], rarity: {},
  currentCat: 'cases',

  async init() {
    const res = await fetch('/api/shop');
    const data = await res.json();
    this.items = data.items || [];
    this.cases = data.cases || [];
    this.rarity = data.rarity || {};

    document.querySelectorAll('.shop-tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.shop-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.currentCat = t.dataset.cat;
        this.render();
      });
    });

    this.render();
    this.bindPromo();
  },
    render() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (this.currentCat === 'cases') {
      this.cases.forEach(c => grid.appendChild(this.caseCard(c)));
    } else {
      const type = this.currentCat === 'avatars' ? 'avatar' : this.currentCat === 'themes' ? 'theme' : 'boost';
      this.items.filter(i => i.type === type).forEach(i => grid.appendChild(this.itemCard(i)));
    }
  },

  caseCard(c) {
    const d = document.createElement('div');
    d.className = 'case-banner';
    d.innerHTML = `<span class="case-icon">${c.icon}</span><span class="name">${c.name}</span><span class="price">$${c.price}</span><button class="btn btn-primary btn-full" style="margin-top:10px;">Открыть</button>`;
    d.querySelector('button').addEventListener('click', () => this.openCase(c.id));
    return d;
  },

  itemCard(item) {
    const user = Store.getUser();
    const owned = user && user.inventory && user.inventory.includes(item.id);
    const d = document.createElement('div');
    d.className = 'shop-card-new';
    let btn = '';
    if (item.type === 'theme' && owned) {
      const equipped = localStorage.getItem('seekazino_theme') === item.id;
      btn = equipped ? '<button class="btn btn-ghost btn-full unequip">Снять</button>' : `<button class="btn btn-primary btn-full equip" data-id="${item.id}">Надеть</button>`;
    } else if (owned) {
      btn = '<button class="btn btn-ghost btn-full" disabled>Куплено</button>';
    } else {
      btn = `<button class="btn btn-primary btn-full buy" data-id="${item.id}">Купить $${item.price}</button>`;
    }
    d.innerHTML = `${owned ? '<span class="owned-badge">✓</span>' : ''}<span class="icon">${item.icon}</span><span class="name">${item.name}</span>${btn}`;
    const b = d.querySelector('.buy'); if (b) b.addEventListener('click', () => this.buy(b.dataset.id));
    const e = d.querySelector('.equip'); if (e) e.addEventListener('click', () => this.equip(e.dataset.id));
    const u = d.querySelector('.unequip'); if (u) u.addEventListener('click', () => this.unequip());
    return d;
  },
    async buy(id) {
    const user = Store.getUser();
    if (!user) return;
    const res = await fetch('/api/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick: user.nick, itemId: id }) });
    const data = await res.json();
    if (!data.success) return alert(data.error || 'Ошибка');
    Store.setUser(data.user);
    updateBalanceDisplay();
    const item = this.items.find(i => i.id === id);
    if (item && item.type === 'theme') this.equip(id);
    this.render();
  },

  equip(id) { localStorage.setItem('seekazino_theme', id); applyTheme(); this.render(); },
  unequip() { localStorage.removeItem('seekazino_theme'); applyTheme(); this.render(); },

  bindPromo() {
    const btn = document.getElementById('promoBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const user = Store.getUser();
      const code = document.getElementById('promoInput').value;
      const res = await fetch('/api/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick: user.nick, code }) });
      const d = await res.json();
      if (d.success) {
        Store.setUser(d.user); updateBalanceDisplay();
        alert('🎟️ +' + d.amount + '$ по промокоду!');
        document.getElementById('promoInput').value = '';
      } else alert(d.error);
    });
  },
    injectReelCss() {
    if (document.getElementById('reelCss')) return;
    const s = document.createElement('style');
    s.id = 'reelCss';
    s.textContent = `.case-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:16px}
.reel-wrap{width:100%;max-width:560px;overflow:hidden;position:relative;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
.reel-marker{position:absolute;left:50%;top:0;bottom:0;width:3px;background:var(--green-bright);z-index:2;transform:translateX(-50%)}
.reel-strip{display:flex;gap:8px;padding:14px 0;will-change:transform}
.reel-item{flex:0 0 96px;text-align:center}
.reel-item img{width:80px;height:80px;border-radius:10px}
.reel-item span{font-size:9px;display:block;color:var(--text-muted);max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.drop-result{text-align:center;animation:dropIn .4s ease}
.drop-result img{width:130px;height:130px;border-radius:14px}
@keyframes dropIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}`;
    document.head.appendChild(s);
  },

  reelArt(n) {
    const c1 = (n.colors && n.colors[0]) || '#22C55E';
    const rc = (this.rarity[n.rarity] || {}).color || '#8B9099';
    let h = 0; for (const ch of n.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    let sh = '';
    for (let i = 0; i < 6; i++) sh += `<circle cx='${15 + ((h >> (i * 3)) % 70)}' cy='${15 + ((h >> (i * 2 + 1)) % 70)}' r='${6 + ((h >> i) % 14)}' fill='${i % 2 ? c1 : '#0B0D10'}' opacity='0.4'/>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='#0B0D10'/></linearGradient></defs><rect width='120' height='120' fill='url(#g)'/>${sh}<rect x='5' y='5' width='110' height='110' fill='none' stroke='${rc}' stroke-width='4'/><polygon points='60,32 80,55 60,78 40,55' fill='${rc}' opacity='0.95'/></svg>`);
  },

  reelItem(n) {
    const d = document.createElement('div');
    d.className = 'reel-item';
    const rc = (this.rarity[n.rarity] || {}).color || '#8B9099';
    d.innerHTML = `<img src="${this.reelArt(n)}" style="border:2px solid ${rc}"><span>${n.name}</span>`;
    return d;
  },

  async openCase(caseId) {
    this.injectReelCss();
    const c = this.cases.find(x => x.id === caseId);
    if (!c) return;
    const user = Store.getUser();

    const modal = document.createElement('div');
    modal.className = 'case-modal';
    modal.innerHTML = `<div style="font-size:20px;font-weight:700;">${c.icon} ${c.name}</div><div class="reel-wrap"><div class="reel-marker"></div><div class="reel-strip"></div></div><div id="dropResult" style="min-height:40px;color:var(--text-muted);">Крутим...</div>`;
    document.body.appendChild(modal);

    const strip = modal.querySelector('.reel-strip');
    const CARD = 104, COUNT = 60, WIN = 52;
    for (let i = 0; i < COUNT; i++) strip.appendChild(this.reelItem(c.nfts[Math.floor(Math.random() * c.nfts.length)]));

    const res = await fetch('/api/case/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick: user.nick, caseId }) });
    const data = await res.json();
    if (!data.success) { modal.querySelector('#dropResult').textContent = data.error || 'Ошибка'; setTimeout(() => modal.remove(), 1500); return; }
    Store.setUser(data.user); updateBalanceDisplay();

    strip.children[WIN].replaceWith(this.reelItem(data.dropped));
    const center = modal.querySelector('.reel-wrap').clientWidth / 2;
    const jitter = Math.floor(Math.random() * 60) - 30;
    const finalX = -(WIN * CARD + 48 - center + jitter);
    strip.style.transition = 'transform 4s cubic-bezier(.12,.8,.2,1)';
    requestAnimationFrame(() => { strip.style.transform = 'translateX(' + finalX + 'px)'; });

    setTimeout(() => {
      const rc = (this.rarity[data.dropped.rarity] || {}).color || '#8B9099';
      modal.querySelector('#dropResult').innerHTML = `<div class="drop-result"><img src="${this.reelArt(data.dropped)}"><div style="font-weight:700;margin-top:8px;">${data.dropped.name}</div><div style="color:${rc};font-size:13px;">${data.dropped.label} · $${data.dropped.rate}/мин</div>${data.duplicate ? `<div style="font-size:12px;color:var(--text-muted);">Дубликат → +$${data.duplicate}</div>` : ''}<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;"><button class="btn btn-primary" id="againBtn">Ещё раз</button><button class="btn btn-ghost" id="closeBtn">Забрать</button></div></div>`;
      modal.querySelector('#againBtn').addEventListener('click', () => { modal.remove(); this.openCase(caseId); });
      modal.querySelector('#closeBtn').addEventListener('click', () => { modal.remove(); });
      if (window.Sounds) Sounds.win();
    }, 4200);
  }
};

document.addEventListener('DOMContentLoaded', () => Shop.init());
