const WheelGame = {
  segments: [0, 1.3, 0, 1.6, 0, 1.3, 0, 2, 0, 1.3, 0, 4.2],
  bet: 1.00,
  spinning: false,
  angle: 0,
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.getElementById('wheelCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.draw();
    document.getElementById('wheelSpin').addEventListener('click', () => this.spin());
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));
    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
    });
  },

  adjustBet(a) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + a));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    const cx = w / 2, cy = h / 2, R = w / 2 - 6;
    const sector = (Math.PI * 2) / this.segments.length;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);

    this.segments.forEach((mult, i) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, i * sector, (i + 1) * sector);
      ctx.closePath();
      ctx.fillStyle = mult === 0 ? '#14171C' : (mult >= 2 ? '#1A4D3A' : '#22303A');
      ctx.fill();
      ctx.strokeStyle = '#2A2E35';
      ctx.stroke();

      // Текст
      ctx.save();
      ctx.rotate(i * sector + sector / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = mult === 0 ? '#8B9099' : '#22C55E';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(mult + 'x', R - 14, 5);
      ctx.restore();
    });

    ctx.restore();

    // Центр
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#0B0D10';
    ctx.fill();
    ctx.strokeStyle = '#2A2E35';
    ctx.stroke();
  },

  async spin() {
    if (this.spinning) return;
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.spinning = true;
    document.getElementById('wheelSpin').disabled = true;
    this.setStatus('Колесо крутится... 🎡', 'var(--text-muted)');

    const idx = Math.floor(Math.random() * this.segments.length);
    const sector = (Math.PI * 2) / this.segments.length;
    // Целевой угол: центр сектора idx под указателем (верх = -PI/2)
    const targetCenter = idx * sector + sector / 2;
    const finalAngle = -Math.PI / 2 - targetCenter;
    const totalSpin = Math.PI * 2 * 6 + (finalAngle - (this.angle % (Math.PI * 2)));

    const startAngle = this.angle;
    const duration = 3500;
    const t0 = Date.now();

    await new Promise(resolve => {
      const animate = () => {
        const t = Math.min((Date.now() - t0) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        this.angle = startAngle + totalSpin * ease;
        this.draw();
        if (t < 1) requestAnimationFrame(animate);
        else resolve();
      };
      animate();
    });

    const mult = this.segments[idx];
    const winnings = this.bet * mult;

    if (mult > 0) {
      this.setStatus('🎉 Выпало ' + mult + 'x — выигрыш $' + winnings.toFixed(2) + '!', 'var(--green-bright)');
    } else {
      this.setStatus('💔 Пустой сектор. -$' + this.bet.toFixed(2), 'var(--red)');
    }

    const user = Store.getUser();
    const data = await API.updateStats(user.nick, this.bet, winnings, mult);
    if (data.user) Store.setUser(data.user);
    updateBalanceDisplay();
    if (data.newAchievements && data.newAchievements.length) data.newAchievements.forEach(id => showAchievementToast(id));

    document.getElementById('wheelSpin').disabled = false;
    this.spinning = false;
  },

  setStatus(t, c) {
    const el = document.getElementById('wheelStatus');
    el.textContent = t; el.style.color = c;
  }
};

document.addEventListener('DOMContentLoaded', () => WheelGame.init());
