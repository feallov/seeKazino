const PlinkoGame = {
  rows: 8,
  mults: [6, 2, 1.2, 0.9, 0.5, 0.9, 1.2, 2, 6],
  bet: 1.00,
  dropping: false,
  highlight: -1,
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.getElementById('plinkoCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.draw();

    document.getElementById('dropBtn').addEventListener('click', () => this.drop());
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));
    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
    });
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.bet;
        this.bet = val === 'max' ? Store.getBalance() : parseFloat(val);
        document.getElementById('betAmount').value = this.bet.toFixed(2);
      });
    });
  },

  adjustBet(amount) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + amount));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
  },

  geom() {
    const w = this.canvas.width, h = this.canvas.height;
    const spacing = w / (this.rows + 2.5);
    const topY = 30;
    const rowH = (h - 120) / this.rows;
    return { w, h, spacing, topY, rowH };
  },

  pointAt(step, col) {
    const g = this.geom();
    return {
      x: g.w / 2 + (col - step / 2) * g.spacing,
      y: step === 0 ? 10 : g.topY + (step - 1) * g.rowH + g.rowH / 2
    };
  },

  draw(ball) {
    const ctx = this.ctx, g = this.geom();
    ctx.clearRect(0, 0, g.w, g.h);

    // Пины
    ctx.fillStyle = '#2A2E35';
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= r; c++) {
        const x = g.w / 2 + (c - r / 2) * g.spacing;
        const y = g.topY + r * g.rowH;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Карманы
    for (let i = 0; i <= this.rows; i++) {
      const x = g.w / 2 + (i - this.rows / 2) * g.spacing;
      const y = g.h - 56;
      const isHit = i === this.highlight;
      const high = this.mults[i] >= 2;

      ctx.fillStyle = isHit ? '#22C55E' : (high ? '#1A4D3A' : '#14171C');
      ctx.strokeStyle = '#2A2E35';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - g.spacing / 2 + 4, y, g.spacing - 8, 44, 6);
      else ctx.rect(x - g.spacing / 2 + 4, y, g.spacing - 8, 44);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isHit ? '#000' : (high ? '#22C55E' : '#8B9099');
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.mults[i] + 'x', x, y + 27);
    }

    // Шарик
    if (ball) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#22C55E';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  async drop() {
    if (this.dropping) return;
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.dropping = true;
    this.highlight = -1;
    document.getElementById('dropBtn').disabled = true;
    this.setStatus('Шарик катится... ⚪', 'var(--text-muted)');

    // Строим путь
    let col = 0;
    const path = [{ step: 0, col: 0 }];
    for (let r = 0; r < this.rows; r++) {
      col += Math.random() < 0.5 ? 0 : 1;
      path.push({ step: r + 1, col });
    }

    // Анимируем
    for (const p of path) {
      this.draw(this.pointAt(p.step, p.col));
      await this.wait(170);
    }

    // Финал
    const bucket = col;
    const mult = this.mults[bucket];
    const winnings = this.bet * mult;
    this.highlight = bucket;
    this.draw(this.pointAt(this.rows, bucket));

    if (mult >= 1) {
      this.setStatus('🎉 Шарик в кармане ' + mult + 'x — выигрыш $' + winnings.toFixed(2) + '!', 'var(--green-bright)');
    } else {
      this.setStatus('Шарик в кармане ' + mult + 'x. Возврат $' + winnings.toFixed(2), 'var(--red)');
    }

    const user = Store.getUser();
    const data = await API.updateStats(user.nick, this.bet, winnings, mult);
    if (data.user) Store.setUser(data.user);
    updateBalanceDisplay();
    if (data.newAchievements && data.newAchievements.length) {
      data.newAchievements.forEach(id => showAchievementToast(id));
    }

    await this.wait(1500);
    this.highlight = -1;
    this.draw();
    document.getElementById('dropBtn').disabled = false;
    this.dropping = false;
  },

  setStatus(text, color) {
    const el = document.getElementById('plinkoStatus');
    el.textContent = text;
    el.style.color = color;
  },

  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

document.addEventListener('DOMContentLoaded', () => PlinkoGame.init());
