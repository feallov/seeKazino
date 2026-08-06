// ===== seeKazino App Logic =====

// Локальное хранилище (пока нет бэкенда)
const Store = {
    getUser() {
        const data = localStorage.getItem('seekazino_user');
        return data ? JSON.parse(data) : null;
    },
    setUser(user) {
        localStorage.setItem('seekazino_user', JSON.stringify(user));
    },
    clearUser() {
        localStorage.removeItem('seekazino_user');
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
        }
        updateBalanceDisplay();
    }
};

// Обновление отображения баланса
function updateBalanceDisplay() {
    const balance = Store.getBalance();
    const elements = document.querySelectorAll('#balanceAmount, #profileBalance');
    elements.forEach(el => {
        if (el) el.textContent = '$' + balance.toFixed(2);
    });
}

// Обновление отображения авторизации
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateBalanceDisplay();
    updateAuthDisplay();
    initAuth();
    initProfile();
});

// ===== АВТОРИЗАЦИЯ =====
function initAuth() {
    // Табы
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

    // Выбор аватара
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            avatarOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        });
    });

    // Вход
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nick = document.getElementById('loginNick').value.trim();
            const pass = document.getElementById('loginPass').value;

            // Проверяем сохранённых пользователей
            const users = JSON.parse(localStorage.getItem('seekazino_users') || '{}');
            
            if (!users[nick]) {
                showError('Пользователь не найден');
                return;
            }
            if (users[nick].password !== pass) {
                showError('Неверный пароль');
                return;
            }

            // Логин успешен
            Store.setUser(users[nick]);
            window.location.href = 'index.html';
        });
    }

    // Регистрация
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nick = document.getElementById('regNick').value.trim();
            const pass = document.getElementById('regPass').value;
            const avatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || '😎';

            if (nick.length < 3) {
                showError('Ник должен быть минимум 3 символа');
                return;
            }
            if (pass.length < 6) {
                showError('Пароль должен быть минимум 6 символов');
                return;
            }

            const users = JSON.parse(localStorage.getItem('seekazino_users') || '{}');
            
            if (users[nick]) {
                showError('Этот ник уже занят');
                return;
            }

            // Создаём пользователя
            const newUser = {
                nick,
                password: pass,
                avatar,
                balance: 10.00,
                level: 1,
                xp: 0,
                stats: {
                    bets: 0,
                    wins: 0,
                    losses: 0,
                    wagered: 0,
                    profit: 0,
                    biggestWin: 0
                },
                createdAt: Date.now()
            };

            users[nick] = newUser;
            localStorage.setItem('seekazino_users', JSON.stringify(users));
            Store.setUser(newUser);
            window.location.href = 'index.html';
        });
    }

    // Выход
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Store.clearUser();
            window.location.reload();
        });
    }
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

    const nameEl = document.getElementById('profileName');
    const avatarEl = document.getElementById('profileAvatar');
    const levelBadge = document.getElementById('levelBadge');
    const levelName = document.getElementById('levelName');
    const xpBar = document.getElementById('xpBar');
    const xpText = document.getElementById('xpText');

    if (nameEl) nameEl.textContent = user.nick;
    if (avatarEl) avatarEl.textContent = user.avatar || '😎';

    // Уровни
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

    if (levelBadge) levelBadge.textContent = 'Уровень ' + currentLevel.level;
    if (levelName) levelName.textContent = currentLevel.name;

    if (xpBar && nextLevel) {
        const progress = ((user.xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100;
        xpBar.style.width = Math.min(progress, 100) + '%';
    }
    if (xpText && nextLevel) {
        xpText.textContent = user.xp + ' / ' + nextLevel.xp + ' XP';
    }

    // Статистика
    if (user.stats) {
        setText('statBets', user.stats.bets);
        setText('statWins', user.stats.wins);
        setText('statLosses', user.stats.losses);
        setText('statWagered', '$' + user.stats.wagered.toFixed(2));
        setText('statProfit', (user.stats.profit >= 0 ? '+$' : '-$') + Math.abs(user.stats.profit).toFixed(2));
        setText('statBiggest', '$' + user.stats.biggestWin.toFixed(2));
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}