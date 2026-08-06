const API = {
  async register(nick, password, avatar) {
    const res = await fetch('/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password, avatar })
    });
    return res.json();
  },
  async login(nick, password) {
    const res = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password })
    });
    return res.json();
  },
  async getUser(nick) {
    const res = await fetch(`/api/user?nick=${encodeURIComponent(nick)}`);
    return res.json();
  },
  async updateStats(nick, bet, winAmount, cashoutMultiplier) {
    const res = await fetch('/api/update-stats', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, bet, winAmount, cashoutMultiplier })
    });
    const data = await res.json();
    if (window.Sounds) { (winAmount > 0) ? Sounds.win() : Sounds.lose(); }
    return data;
  }
};

const Store = {
  getNick() { return localStorage.getItem('seekazino_nick'); },
  setNick(nick) { localStorage.setItem('seekazino_nick', nick); },
  clearNick() {
    localStorage.removeItem('seekazino_nick');
    localStorage.removeItem('seekazino_user');
    localStorage.removeItem('seekazino_token');
  },
  getUser() {
    try {
      const data = localStorage.getItem('seekazino_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      localStorage.removeItem('seekazino_user');
      return null;
    }
  },
  setUser(user) { localStorage.setItem('seekazino_user', JSON.stringify(user)); },
  getBalance() {
    const user = this.getUser();
    return user ? user.balance : 10.00;
  },
  setBalance(amount) {
    const user = this.getUser();
    if (user) {
      user.balance = amount;
      this.setUser(user);
      updateBalanceDisplay();
    }
  },
  async refreshUser() {
    const nick = this.getNick();
    if (!nick) return null;
    const data = await API.getUser(nick);
    if (data.user) {
      this.setUser(data.user);
      updateBalanceDisplay();
      updateAuthDisplay();
    }
    return data.user;
  }
};

function requireAuth() {
  if (!Store.getNick()) { window.location.href = '/login.html'; return false; }
  return true;
}

function requireGuest() {
  if (Store.getNick()) window.location.href = '/index.html';
}

function updateBalanceDisplay() {
  const balance = Store.getBalance();
  document.querySelectorAll('#balanceAmount, #profileBalance').forEach(el => {
    if (el) el.textContent = '$' + Number(balance).toFixed(2);
  });
}

function updateAuthDisplay() {
  const user = Store.getUser();
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const avatarBtn = document.getElementById('avatarBtn');
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (avatarBtn) {
      avatarBtn.textContent = user.avatar || '😎';
      avatarBtn.href = '/profile.html';
    }
  }
}

const PROTECTED_PAGES = ['index.html', 'profile.html', 'game-crash.html', 'game-mines.html', 'game-slots.html', 'game-dice.html', 'game-roulette.html', 'game-plinko.html', 'game-blackjack.html', 'game-limbo.html', 'game-keno.html', 'game-wheel.html', 'shop.html', 'admin.html', 'leaderboard.html'];

document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (currentPage === 'login.html') {
    requireGuest();
  } else if (PROTECTED_PAGES.includes(currentPage)) {
    if (!requireAuth()) return;
    await Store.refreshUser();
  }

  updateBalanceDisplay();
  updateAuthDisplay();
  initAuth();
  initProfile();
  injectHeaderLinks();
  applyTheme();
  initLobbyExtras();
  pingOnline();
  setInterval(pingOnline, 30000);
});

function initAuth() {
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
      } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
      }
      hideError();
    });
  });

  document.querySelectorAll('.avatar-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nick = document.getElementById('loginNick').value.trim();
      const pass = document.getElementById('loginPass').value;
      disableForm(loginForm, true);
      const data = await API.login(nick, pass);
      disableForm(loginForm, false);
      if (!data.success) { showError(data.error || 'Ошибка входа'); return; }
      Store.set

// ===== NFT В ПРОФИЛЕ =====
async function renderNFTs(inv) {
  const grid = document.getElementById('nftGrid');
  if (!grid) return;
  const res = await fetch('/api/shop');
  const data = await res.json();
  const nfts = (data.items || []).filter(i => i.type === 'nft' && inv.includes(i.id));

  if (!nfts.length) {
    grid.innerHTML = '<p class="section-sub">Пока нет NFT — загляни в магазин! 🖼️</p>';
    return;
  }
  grid.innerHTML = '';
  nfts.forEach(n => {
    const d = document.createElement('div');
    d.className = 'nft-item rarity-' + n.rarity;
    d.innerHTML = `<span class="nft-icon">${n.icon}</span><span class="nft-name">${n.name}</span>`;
    grid.appendChild(d);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('nftGrid')) return;
  const draw = () => {
    const user = Store.getUser();
    if (user) renderNFTs(user.inventory || []);
  };
  draw();
  setTimeout(draw, 800);
});
