const RouletteGame = {
  bet: 1.00,
  color: 'red',
  spinning: false,
  redNumbers: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],

  init() {
    document.getElementById('spinBtn').addEventListener('click', () => this.spin());
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));
    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
    });
    document.querySelectorAll('.roulette-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.roulette-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.color = btn.dataset.color;
      });
    });
  },

  adjustBet(amount) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + amount));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
  },

  colorOf(num) {
    if (num === 0) return 'green';
    return this.redNumbers.includes(num) ? 'red' : 'black';
  },

  async spin() {
    if (this.spinning) return;
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.spinning = true;
    document.getElementById('spinBtn').disabled = true;
    this.setStatus('Крутим колесо... 🎡', 'var(--text-muted)');

    const result = Math.floor(Math.random() * 37);
    const numEl = document.getElementById('rouletteNumber');

    // Анимация перебора чисел
    for (let i = 0; i < 25; i++) {
      const tmp = Math.floor(Math.random() * 37);
      numEl.textContent = tmp;
      numEl.className = 'roulette-number ' + this.colorOf(tmp);
      await this.wait(70 + i * 8);
    }

    numEl.textContent = result;
    const resColor = this.colorOf(result);
    numEl.className = 'roulette-number ' + resColor;

    const won = resColor === this.color;
    const mult = this.color === 'green' ? 14 : 2;
    const winnings = won ? this.bet * mult : 0;

    if (won) {
      this.setStatus('🎉 Выпало ' + result + ' (' + this.rusColor(resColor) + ') — выигрыш $' + winnings.toFixed(2) + '!', 'var(--green-bright)');
    } else {
      this.setStatus('Выпало ' + result + ' (' + this.rusColor(resColor) + ') — мимо. -$' + this.bet.toFixed(2), 'var(--red)');
    }

    this.addHistory(result, resColor);

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

  rusColor(c) {
    return c === 'red' ? 'красное' : c === 'black' ? 'чёрное' : 'зеро';
  },

  addHistory(num, color) {
    const container = document.getElementById('rouletteHistory');
    const item = document.createElement('span');
    item.className = 'roulette-hist-item ' + color;
    item.textContent = num;
    container.insertBefore(item, container.firstChild);
    while (container.children.length > 12) container.removeChild(container.lastChild);
  },

  setStatus(text, color) {
    const el = document.getElementById('rouletteStatus');
    el.textContent = text;
    el.style.color = color;
  },

  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

document.addEventListener('DOMContentLoaded', () => RouletteGame.init());
