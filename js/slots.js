const SlotsGame = {
  spinning: false,
  bet: 1.00,
  symbols: ['🍒', '', '🔔', '⭐', '💎', '7️⃣'],
  weights: [28, 24, 18, 14, 10, 6],

  init() {
    document.getElementById('spinBtn').addEventListener('click', () => this.spin());
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

  randomSymbol() {
    const total = this.weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < this.symbols.length; i++) {
      r -= this.weights[i];
      if (r <= 0) return this.symbols[i];
    }
    return this.symbols[0];
  },

  payout(a, b, c) {
    if (a === b && b === c) {
      const table = { '7️⃣': 50, '💎': 20, '⭐': 10, '🔔': 8, '🍋': 5, '🍒': 3 };
      return table[a] || 0;
    }
    if (a === b || b === c || a === c) {
      const pair = a === b ? a : (b === c ? b : a);
      if (pair === '7️⃣') return 5;
      if (pair === '💎') return 3;
      if (pair === '🍒') return 1.5;
    }
    return 0;
  },

  async spin() {
    if (this.spinning) return;
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.spinning = true;
    document.getElementById('spinBtn').disabled = true;
    this.setStatus('Крутим... 🎰', 'var(--text-muted)');

    const result = [this.randomSymbol(), this.randomSymbol(), this.randomSymbol()];
    const reels = [1, 2, 3].map(i => document.getElementById('reel' + i));

    reels.forEach(r => r.classList.add('spinning'));
    const intervals = reels.map(r => setInterval(() => {
      r.textContent = this.symbols[Math.floor(Math.random() * this.symbols.length)];
    }, 80));

    await this.wait(800);
    clearInterval(intervals[0]); reels[0].textContent = result[0]; reels[0].classList.remove('spinning');
    await this.wait(500);
    clearInterval(intervals[1]); reels[1].textContent = result[1]; reels[1].classList.remove('spinning');
    await this.wait(500);
    clearInterval(intervals[2]); reels[2].textContent = result[2]; reels[2].classList.remove('spinning');

    const mult = this.payout(result[0], result[1], result[2]);
    const winnings = this.bet * mult;

    if (mult > 0) {
      this.setStatus('🎉 ВЫИГРЫШ $' + winnings.toFixed(2) + ' (x' + mult + ')!', 'var(--green-bright)');
    } else {
      this.setStatus('Мимо! Попробуй ещё 🍀', 'var(--red)');
    }

    const user = Store.getUser();
    const data = await API.updateStats(user.nick, this.bet, winnings, mult);
    if (data.user) Store.setUser(data.user);
    updateBalanceDisplay();
    if (data.newAchievements && data.newAchievements.length) {
      data.newAchievements.forEach(id => showAchievementToast(id));
    }

    document.getElementById('spinBtn').disabled = false;
    this.spinning = false;
  },

  setStatus(text, color) {
    const el = document.getElementById('slotsStatus');
    el.textContent = text;
    el.style.color = color;
  },

  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

document.addEventListener('DOMContentLoaded', () => SlotsGame.init());
