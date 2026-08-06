const MinesGame = {
  state: 'idle',
  bet: 1.00,
  minesCount: 3,
  mines: [],
  revealed: [],
  multiplier: 1.00,

  init() {
    this.buildGrid();
    document.getElementById('startBtn').addEventListener('click', () => this.start());
    document.getElementById('cashoutBtn').addEventListener('click', () => this.cashout());
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));
    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
    });
    document.querySelectorAll('.mines-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.state === 'playing') return;
        document.querySelectorAll('.mines-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.minesCount = parseInt(btn.dataset.mines);
      });
    });
  },

  buildGrid() {
    const grid = document.getElementById('minesGrid');
    grid.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('button');
      cell.className = 'mine-cell';
      cell.dataset.idx = i;
      cell.addEventListener('click', () => this.pick(i));
      grid.appendChild(cell);
    }
  },

  adjustBet(amount) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + amount));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
  },

  start() {
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.mines = [];
    while (this.mines.length < this.minesCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!this.mines.includes(idx)) this.mines.push(idx);
    }
    this.revealed = [];
    this.multiplier = 1.00;
    this.state = 'playing';

    this.buildGrid();
    this.updateInfo();
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('cashoutBtn').style.display = 'block';
    document.getElementById('cashoutBtn').disabled = true;
    document.getElementById('cashoutBtn').textContent = '💰 Забрать $0.00';
    this.setStatus('Открывай клетки — избегай мин! 💣', 'var(--green-bright)');
  },

  calcMultiplier(picks) {
    let mult = 1;
    for (let i = 0; i < picks; i++) {
      const remaining = 25 - i;
      mult *= remaining / (remaining - this.minesCount);
    }
    return Math.floor(mult * 0.97 * 100) / 100;
  },

  pick(idx) {
    if (this.state !== 'playing') return;
    if (this.revealed.includes(idx)) return;

    const cell = document.querySelector(`.mine-cell[data-idx="${idx}"]`);

    if (this.mines.includes(idx)) {
      cell.classList.add('revealed', 'boom');
      cell.textContent = '💥';
      this.state = 'finished';
      this.revealAll();
      this.setStatus('💥 БУМ! Ты попал на мину. -$' + this.bet.toFixed(2), 'var(--red)');
      this.sendResult(0, 0);
      setTimeout(() => this.resetUI(), 2500);
    } else {
      this.revealed.push(idx);
      cell.classList.add('revealed', 'safe');
      cell.textContent = '💎';
      this.multiplier = this.calcMultiplier(this.revealed.length);
      this.updateInfo();
      document.getElementById('cashoutBtn').disabled = false;
      document.getElementById('cashoutBtn').textContent = '💰 Забрать $' + (this.bet * this.multiplier).toFixed(2);

      if (this.revealed.length === 25 - this.minesCount) {
        this.cashout();
      }
    }
  },

  revealAll() {
    this.mines.forEach(idx => {
      const cell = document.querySelector(`.mine-cell[data-idx="${idx}"]`);
      if (!cell.classList.contains('revealed')) {
        cell.classList.add('revealed', 'boom');
        cell.textContent = '💣';
      }
    });
  },

  async cashout() {
    if (this.state !== 'playing' || this.revealed.length === 0) return;
    this.state = 'finished';
    const winnings = this.bet * this.multiplier;
    this.revealAll();
    this.setStatus('✅ Забрал $' + winnings.toFixed(2) + ' (x' + this.multiplier.toFixed(2) + ')', 'var(--green-bright)');
    this.sendResult(winnings, this.multiplier);
    setTimeout(() => this.resetUI(), 2500);
  },

  async sendResult(winAmount, mult) {
    const user = Store.getUser();
    if (!user) return;
    const data = await API.updateStats(user.nick, this.bet, winAmount, mult);
    if (data.user) Store.setUser(data.user);
    updateBalanceDisplay();
    if (data.newAchievements && data.newAchievements.length) {
      data.newAchievements.forEach(id => showAchievementToast(id));
    }
  },

  updateInfo() {
    document.getElementById('minesPicked').textContent = this.revealed.length;
    document.getElementById('minesMult').textContent = this.multiplier.toFixed(2) + 'x';
    document.getElementById('minesWin').textContent = '$' + (this.bet * this.multiplier).toFixed(2);
  },

  setStatus(text, color) {
    const el = document.getElementById('minesStatus');
    el.textContent = text;
    el.style.color = color;
  },

  resetUI() {
    this.state = 'idle';
    this.buildGrid();
    this.revealed = [];
    this.multiplier = 1.00;
    this.updateInfo();
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('cashoutBtn').style.display = 'none';
    this.setStatus('Выбери ставку и количество мин, нажми "Старт"', 'var(--text-muted)');
  }
};

document.addEventListener('DOMContentLoaded', () => MinesGame.init());
