const CrashGame = {
  state: 'idle',
  multiplier: 1.00,
  crashPoint: 0,
  bet: 1.00,
  cashoutMultiplier: 0,
  animationId: null,
  startTime: 0,
  canvas: null,
  ctx: null,
  points: [],

  init() {
    this.canvas = document.getElementById('crashCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    document.getElementById('startBtn').addEventListener('click', () => this.start());
    document.getElementById('cashoutBtn').addEventListener('click', () => this.cashout());
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.bet;
        this.bet = val === 'max' ? Store.getBalance() : parseFloat(val);
        document.getElementById('betAmount').value = this.bet.toFixed(2);
      });
    });

    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
    });

    this.drawIdle();
  },

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width - 48;
    this.canvas.height = 250;
  },

  adjustBet(amount) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + amount));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
  },

  generateCrashPoint() {
    const r = Math.random();
    if (r < 0.03) return 1.00;
    return Math.max(1.00, Math.floor((0.97 / (1 - Math.random())) * 100) / 100);
  },

  start() {
    if (!Store.getUser()) {
      this.setStatus('Сначала войди в аккаунт!', 'var(--red)');
      return;
    }
    const balance = Store.getBalance();
    if (this.bet > balance) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }
    if (this.bet < 0.10) { this.setStatus('Минимальная ставка $0.10', 'var(--red)'); return; }

    this.state = 'running';
    this.multiplier = 1.00;
    this.cashoutMultiplier = 0;
    this.crashPoint = this.generateCrashPoint();
    this.points = [];
    this.startTime = Date.now();

    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('cashoutBtn').style.display = 'block';
    document.getElementById('cashoutBtn').textContent = '💰 Забрать $' + this.bet.toFixed(2);
    this.setStatus('Летим! 🚀', 'var(--green-bright)');

    this.animate();
  },

  animate() {
    if (this.state !== 'running') return;
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.multiplier = Math.pow(Math.E, elapsed * 0.3);
    this.multiplier = Math.round(this.multiplier * 100) / 100;

    document.getElementById('crashMultiplier').textContent = this.multiplier.toFixed(2) + 'x';
    document.getElementById('cashoutBtn').textContent = '💰 Забрать $' + (this.bet * this.multiplier).toFixed(2);

    this.points.push(this.multiplier);
    this.drawGraph();

    if (this.multiplier >= this.crashPoint) { this.crash(); return; }
    this.animationId = requestAnimationFrame(() => this.animate());
  },

  async crash() {
    this.state = 'crashed';
    cancelAnimationFrame(this.animationId);

    document.getElementById('crashMultiplier').textContent = this.crashPoint.toFixed(2) + 'x';
    document.getElementById('crashMultiplier').style.color = 'var(--red)';
    this.setStatus('💥 Крах на ' + this.crashPoint.toFixed(2) + 'x', 'var(--red)');

    const user = Store.getUser();
    if (user) {
      const data = await API.updateStats(user.nick, this.bet, 0, 0);
      if (data.user) Store.setUser(data.user);
      updateBalanceDisplay();
    }

    this.addHistory(this.crashPoint, false);
    setTimeout(() => this.reset(), 2500);
  },

  async cashout() {
    if (this.state !== 'running') return;
    this.state = 'cashed';
    cancelAnimationFrame(this.animationId);

    this.cashoutMultiplier = this.multiplier;
    const winnings = this.bet * this.cashoutMultiplier;

    document.getElementById('crashMultiplier').style.color = 'var(--green-bright)';
    this.setStatus('✅ Забрал $' + winnings.toFixed(2) + ' на ' + this.cashoutMultiplier.toFixed(2) + 'x!', 'var(--green-bright)');

    const user = Store.getUser();
    if (user) {
      const data = await API.updateStats(user.nick, this.bet, winnings, this.cashoutMultiplier);
      if (data.user) Store.setUser(data.user);
      updateBalanceDisplay();
      
      // Показываем ачивки
      if (data.newAchievements && data.newAchievements.length > 0) {
        data.newAchievements.forEach(achId => showAchievementToast(achId));
      }
    }

    this.addHistory(this.cashoutMultiplier, true);
    setTimeout(() => this.reset(), 2500);
  },

  reset() {
    this.state = 'idle';
    this.multiplier = 1.00;
    this.points = [];
    this.cashoutMultiplier = 0;

    document.getElementById('crashMultiplier').textContent = '1.00x';
    document.getElementById('crashMultiplier').style.color = 'var(--text)';
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('cashoutBtn').style.display = 'none';
    this.setStatus('Сделай ставку и нажми "Старт"', 'var(--text-muted)');
    this.drawIdle();
  },

  setStatus(text, color) {
    const el = document.getElementById('crashStatus');
    el.textContent = text;
    el.style.color = color;
  },

  addHistory(multiplier, won) {
    const container = document.getElementById('roundHistory');
    const item = document.createElement('span');
    item.className = 'history-item ' + (won ? 'history-green' : 'history-red');
    item.textContent = multiplier.toFixed(1) + 'x';
    container.insertBefore(item, container.firstChild);
    while (container.children.length > 10) container.removeChild(container.lastChild);
  },

  drawIdle() {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#2A2E35';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  },

  drawGraph() {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (this.points.length < 2) return;

    const maxMult = Math.max(...this.points, 2);
    const step = w / Math.max(this.points.length - 1, 1);

    ctx.beginPath();
    ctx.strokeStyle = this.state === 'crashed' ? '#EF4444' : '#22C55E';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    this.points.forEach((mult, i) => {
      const x = i * step;
      const y = h - ((mult - 1) / (maxMult - 1)) * (h - 20);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowColor = this.state === 'crashed' ? '#EF4444' : '#22C55E';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
};

document.addEventListener('DOMContentLoaded', () => CrashGame.init());
