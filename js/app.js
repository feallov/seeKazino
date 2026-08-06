// ===== seeKazino App Logic (Server-side) =====

const API = {
  async register(nick, password, avatar) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password, avatar })
    });
    return res.json();
  },

  async login(nick, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password })
    });
    return res.json();
  },

  async getUser(nick) {
    const res = await fetch(`/api/user?nick=${encodeURIComponent(nick)}`);
    return res.json();
  },

  async updateStats(nick, bet, winAmount) {
    const res = await fetch('/api/update-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, bet, winAmount })
    });
    return res.json();
  },

  async updateBalance(nick, newBalance) {
    const res = await fetch('/api/update-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, newBalance })
    });
    return res.json();
  }
};

const Store = {
  getNick() {
    return localStorage.getItem('seekazino_nick');
  },
  setNick(nick) {
    localStorage.setItem('seekazino_nick', nick);
  },
  clearNick() {
    localStorage.removeItem('seekazino_nick');
    localStorage.removeItem('seekazino_user');
  },
  getUser() {
    const data = localStorage.getItem('seekazino_user');
    return data ? JSON.parse(data) : null;
  },
  setUser(user) {
    localStorage.setItem('seekazino_user', JSON.stringify(user));
  },
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
      initProfile();
    }
    return data.user;
  }
};

function updateBalanceDisplay() {
  const balance = Store.getBalance();
  const elements = document.querySelectorAll('#balanceAmount, #profileBalance');
  elements.forEach(el => {
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
      avatarBtn.href = 'profile.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Если залогинен — подтягиваем свежие данные с сервера
  if (Store.getNick()) {
    await Store.refreshUser();
  }
  
  updateBalanceDisplay();
  updateAuthDisplay();
  initAuth();
  initProfile();
});

// ===== АВТОРИЗАЦИЯ =====
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

  const avatarOptions = document.querySelectorAll('.avatar-option');
  avatarOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      avatarOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // ВХОД
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nick = document.getElementById('loginNick').value.trim();
      const pass = document.getElementById('loginPass').value;

      disableForm(loginForm, true);
      const data = await API.login(nick, pass);
      disableForm(loginForm, false);

      if (!data.success) {
        showError(data.error || 'Ошибка входа');
        return;
      }

      Store.setNick(nick);
      Store.setUser(data.user);
      window.location.href = 'index.html';
    });
  }

  // РЕГИСТРАЦИЯ
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nick = document.getElementById('regNick').value.trim();
      const pass = document.getElementById('regPass').value;
      const avatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || '😎';

      disableForm(registerForm, true);
      const data = await API.register(nick, pass, avatar);
      disableForm(registerForm, false);

      if (!data.success) {
        showError(data.error || 'Ошибка регистрации');
        return;
      }

      Store.setNick(nick);
      Store.setUser(data.user);
      window.location.href = 'index.html';
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Store.clearNick();
      window.location.href = 'index.html';
    });
  }
}

function disableForm(form, disabled) {
  form.querySelectorAll('button, input').forEach(el => {
    el.disabled = disabled;
  });
}

function showError(msg) {
  const el = document.getElementById('authError');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function hideError() {
  const el = document.getElementById('authError');
  if (el) el.style.display = 'none';
}

// ===== ПРОФИЛЬ =====
function initProfile() {
  const user = Store.getUser();
  if (!user) return;

  setText('profileName', user.nick);
  const avatarEl = document.getElementById('profileAvatar');
  if (avatarEl) avatarEl.textContent = user.avatar || '😎';

  const levels = [
    { level: 1, name: 'Newbie', xp: 0 },
    { level: 2, name: 'Regular', xp: 500 },
    { level: 3, name: 'Grinder', xp: 2000 },
    { level: 4, name: 'High Roller', xp: 5000 },
    { level: 5, name: 'Shark', xp: 15000 },
    { level: 6, name: 'Whale', xp: 50000 }
  ];

  const currentLevel = levels.filter(l => user.xp >= l.xp).pop() || levels[0];
  const nextLevel = levels.find(l => l.xp > user.xp);

  const levelBadge = document.getElementById('levelBadge');
  const levelName = document.getElementById('levelName');
  if (levelBadge) levelBadge.textContent = 'Уровень ' + currentLevel.level;
  if (levelName) levelName.textContent = currentLevel.name;

  const xpBar = document.getElementById('xpBar');
  if (xpBar && nextLevel) {
    const progress = ((user.xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100;
    xpBar.style.width = Math.min(progress, 100) + '%';
  }
  const xpText = document.getElementById('xpText');
  if (xpText && nextLevel) {
    xpText.textContent = user.xp + ' / ' + nextLevel.xp + ' XP';
  }

  if (user.bets !== undefined) {
    setText('statBets', user.bets);
    setText('statWins', user.wins);
    setText('statLosses', user.losses);
    setText('statWagered', '$' + (user.wagered || 0).toFixed(2));
    const profit = user.profit || 0;
    setText('statProfit', (profit >= 0 ? '+$' : '-$') + Math.abs(profit).toFixed(2));
    setText('statBiggest', '$' + (user.biggestWin || 0).toFixed(2));
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
