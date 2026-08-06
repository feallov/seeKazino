const Shop = {
  items: [],

  async init() {
    const res = await fetch('/api/shop');
    const data = await res.json();
    this.items = data.items || [];
    this.render();

    const promoBtn = document.getElementById('promoBtn');
    if (promoBtn) promoBtn.addEventListener('click', async () => {
      const user = Store.getUser();
      const code = document.getElementById('promoInput').value;
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: user.nick, code })
      });
      const data2 = await res.json();
      if (data2.success) {
        Store.setUser(data2.user);
        updateBalanceDisplay();
        alert('🎟️ +' + data2.amount + '$ по промокоду!');
        document.getElementById('promoInput').value = '';
      } else {
        alert(data2.error);
      }
    });
  },

  render() {
    const user = Store.getUser();
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    grid.innerHTML = '';

    this.items.forEach(item => {
      const owned = user && user.inventory && user.inventory.includes(item.id);
      const equippedTheme = localStorage.getItem('seekazino_theme') === item.id;

      const card = document.createElement('div');
      card.className = 'shop-card' + (owned ? ' shop-owned' : '');

      let actionHtml = '';
      if (item.type === 'boost') {
        const active = user && user.boost_until > Date.now();
        actionHtml = active
          ? '<button class="btn btn-ghost btn-full" disabled>⚡ Активен</button>'
          : `<button class="btn btn-primary btn-full shop-buy" data-id="${item.id}">Купить $${item.price}</button>`;
      } else if (owned && item.type === 'theme') {
        actionHtml = equippedTheme
          ? '<button class="btn btn-ghost btn-full" disabled>✓ Надета</button>'
          : `<button class="btn btn-primary btn-full shop-equip" data-id="${item.id}">Надеть</button>`;
      } else if (owned) {
        actionHtml = '<button class="btn btn-ghost btn-full" disabled>✓ Куплено</button>';
      } else {
        actionHtml = `<button class="btn btn-primary btn-full shop-buy" data-id="${item.id}">Купить $${item.price}</button>`;
      }

      card.innerHTML = `
        <span class="shop-icon">${item.icon}</span>
        <span class="shop-name">${item.name}</span>
        <span class="shop-type">${item.type === 'avatar' ? 'Аватар' : item.type === 'theme' ? 'Тема' : 'Буст'}</span>
        ${actionHtml}
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.shop-buy').forEach(b => b.addEventListener('click', () => this.buy(b.dataset.id)));
    grid.querySelectorAll('.shop-equip').forEach(b => b.addEventListener('click', () => this.equip(b.dataset.id)));
  },

  async buy(id) {
    const user = Store.getUser();
    if (!user) return;
    const res = await fetch('/api/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick: user.nick, itemId: id })
    });
    const data = await res.json();
    if (!data.success) { alert(data.error || 'Ошибка'); return; }

    Store.setUser(data.user);
    updateBalanceDisplay();
    const item = this.items.find(i => i.id === id);
    if (item && item.type === 'theme') this.equip(id);
    this.render();
  },

  equip(id) {
    localStorage.setItem('seekazino_theme', id);
    applyTheme();
    this.render();
  }
};

document.addEventListener('DOMContentLoaded', () => Shop.init());
