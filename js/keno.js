const KenoGame = {
  bet: 1.00,
  picked: [],
  drawing: false,
  PAYOUT: {
    1: [0, 3.9],
    2: [0, 1.8, 5.5],
    3: [0, 1.5, 3.5, 25],
    4: [0, 1.2, 2.5, 8, 60],
    5: [0, 0, 2, 5, 15, 100],
    6: [0, 0, 1.8, 4, 12, 50, 200],
    7: [0, 0, 1.5, 3, 8, 25, 100, 500],
    8: [0, 0, 1.3, 2.5, 6, 15, 50, 250, 1000],
    9: [0, 0, 1.2, 2, 5, 10, 25, 100, 500, 2000],
    10: [0, 0, 1.1, 1.8, 4, 8, 20, 50, 200, 1000, 5000]
  },

  init() {
    this.buildGrid();
    document.getElementById('kenoPlay').addEventListener('click', () => this.play());
    document.getElementById('kenoClear').addEventListener('click', () => { this.picked = []; this.buildGrid(); this.updateInfo(); });
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));
    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
    });
  },

  buildGrid() {
    const grid = document.getElementById('kenoGrid');
    grid.innerHTML = '';
    for (let n = 1; n <= 40; n++) {
      const cell = document.createElement('button');
      cell.className = 'keno-cell' + (this.picked.includes(n) ? ' picked' : '');
      cell.textContent = n;
      cell.dataset.n = n;
      cell.addEventListener('click', () => this.toggle(n));
      grid.appendChild(cell);
    }
  },

  toggle(n) {
    if (this.drawing) return;
    if (this.picked.includes(n)) {
      this.picked = this.picked.filter(x => x !== n);
    } else {
      if (this.picked.length >= 10) return;
      this.picked.push(n);
    }
    this.buildGrid();
    this.updateInfo();
  },

  adjustBet(a) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + a));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
  },

  updateInfo(hits, mult) {
    document.getElementById('kenoPicked').textContent = this.picked.length + ' / 10';
    document.getElementById('kenoHits').textContent = hits !== undefined ? hits : 0;
    document.getElementById('kenoMult').textContent = (mult !== undefined ? mult : 0) + 'x';
  },

  async play() {
    if (this.drawing) return;
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.picked.length < 1) { this.setStatus('Выбери хотя бы одно число!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.drawing = true;
    this.buildGrid();
    this.updateInfo();
    this.setStatus('Розыгрыш... 🔢', 'var(--text-muted)');

    // 10 случайных уникальных чисел
    const pool = [];
    for (let n = 1; n <= 40; n++) pool.push(n);
    const drawn = [];
    for (let i = 0; i < 10; i++) {
      drawn.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }

    let hits = 0;
    for (const n of drawn) {
      const cell = document.querySelector(`.keno-cell[data-n="${n}"]`);
      if (this.picked.includes(n)) {
        hits++;
        cell.classList.add('hit');
      } else {
        cell.classList.add('drawn');
      }
      this.updateInfo(hits);
      await this.wait(180);
    }

    const mult = this.PAYOUT[this.picked.length][hits] || 0;
    const winnings = this.bet * mult;
    this.updateInfo(hits, mult);

    if (mult > 0) {
      this.setStatus('🎉 Совпало ' + hits + '! Выигрыш $' + winnings.toFixed(2) + ' (x' + mult + ')', 'var(--green-bright)');
    } else {
      this.setStatus('Совпало ' + hits + '. Мимо. -$' + this.bet.toFixed(2), 'var(--red)');
    }

    const user = Store.getUser();
    const data = await API.updateStats(user.nick, this.bet, winnings, mult);
    if (data.user) Store.setUser(data.user);
    updateBalanceDisplay();
    if (data.newAchievements && data.newAchievements.length) data.newAchievements.forEach(id => showAchievementToast(id));

    this.drawing = false;
  },

  setStatus(t, c) {
    const el = document.getElementById('kenoStatus');
    el.textContent = t; el.style.color = c;
  },
  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

document.addEventListener('DOMContentLoaded', () => KenoGame.init());
