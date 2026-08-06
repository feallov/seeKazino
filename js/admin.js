const Admin = {
  token: localStorage.getItem('seekazino_token'),

  async api(path, opts = {}) {
    const res = await fetch('/api/admin/' + path, {
      ...opts,
      headers: {
        'Authorization': 'Bearer ' + this.token,
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  },

  async init() {
    const user = Store.getUser();
    if (!user || user.role !== 'admin') {
      window.location.href = '/index.html';
      return;
    }
    this.load();
  },

  async load() {
    const stats = await this.api('stats');
    document.getElementById('admUsers').textContent = stats.users;
    document.getElementById('admBets').textContent = stats.bets;
    document.getElementById('admWagered').textContent = '$' + (stats.wagered || 0).toFixed(0);
    document.getElementById('admBalances').textContent = '$' + (stats.balances || 0).toFixed(0);

    const data = await this.api('users');
    const tbody = document.getElementById('admTable');
    tbody.innerHTML = '';
    (data.users || []).forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.avatar || ''} ${u.nick}</td>
        <td>$${Number(u.balance).toFixed(2)}</td>
        <td>${u.level}</td>
        <td>${u.bets}</td>
        <td>
          <button class="btn btn-ghost adm-add" data-nick="${u.nick}">+$100</button>
          <button class="btn btn-ghost adm-zero" data-nick="${u.nick}">$0</button>
          <button class="btn btn-ghost adm-del" data-nick="${u.nick}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.adm-add').forEach(b => b.addEventListener('click', async () => {
      const nick = b.dataset.nick;
      const cur = await this.api('users');
      const u = cur.users.find(x => x.nick === nick);
      await this.api('balance', { method: 'POST', body: JSON.stringify({ nick, balance: u.balance + 100 }) });
      this.load();
    }));
    tbody.querySelectorAll('.adm-zero').forEach(b => b.addEventListener('click', async () => {
      await this.api('balance', { method: 'POST', body: JSON.stringify({ nick: b.dataset.nick, balance: 0 }) });
      this.load();
    }));
    tbody.querySelectorAll('.adm-del').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Удалить игрока ' + b.dataset.nick + '?')) return;
      await this.api('delete', { method: 'POST', body: JSON.stringify({ nick: b.dataset.nick }) });
      this.load();
    }));
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
