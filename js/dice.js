const DiceGame = {
  bet: 1.00,
  target: 50,
  mode: 'over',
  rolling: false,

  init() {
    document.getElementById('rollBtn').addEventListener('click', () => this.roll());
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));
    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
      this.updateInfo();
    });
    document.getElementById('targetSlider').addEventListener('input', (e) => {
      this.target = parseInt(e.target.value);
      this.updateInfo();
    });
    document.querySelectorAll('.dice-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dice-mode').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.mode = btn.dataset.mode;
        this.updateInfo();
      });
    });
    this.updateInfo();
  },

  adjustBet(amount) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + amount));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
    this.updateInfo();
  },

  chance() {
    return this.mode === 'over' ? (100 - this.target) : this.target;
  },

  multiplier() {
    return Math.floor((99 / this.chance()) * 100) / 100;
  },

  updateInfo() {
    document.getElementById('targetVal').textContent = this.target.toFixed(2);
    document.getElementById('diceChance').textContent = this.chance() + '%';
    document.getElementById('diceMult').textContent = this.multiplier().toFixed(2) + 'x';
    document.getElementById('diceWin').textContent = '$' + (this.bet * this.multiplier()).toFixed(2);

    // Рисуем зону победы на шкале
    const zone = document.getElementById('diceWinzone');
    if (this.mode === 'over') {
      zone.style.left = this.target + '%';
      zone.style.width = (100 - this.target) + '%';
    } else {
      zone.style.left = '0%';
      zone.style.width = this.target + '%';
    }
    document.getElementById('diceMarker').style.left = this.target + '%';
  },

  async roll() {
    if (this.rolling) return;
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.rolling = true;
    document.getElementById('rollBtn').disabled = true;

    // Анимация "прокрутки" чисел
    const resultEl = document.getElementById('diceResult');
    for (let i = 0; i < 15; i++) {
      resultEl.textContent = (Math.random() * 100).toFixed(2);
      await this.wait(60);
    }

    const roll = Math.round(Math.random() * 10000) / 100;
    resultEl.textContent = roll.toFixed(2);

    const won = this.mode === 'over' ? roll > this.target : roll < this.target;
    const mult = this.multiplier();
    const winnings = won ? this.bet * mult : 0;

    if (won) {
      resultEl.style.color = 'var(--green-bright)';
      this.setStatus('✅ Выпало ' + roll.toFixed(2) + ' — выигрыш $' + winnings.toFixed(2) + '!', 'var(--green-bright)');
    } else {
      resultEl.style.color = 'var(--red)';
      this.setStatus('💔 Выпало ' + roll.toFixed(2) + ' — мимо. -$' + this.bet.toFixed(2), 'var(--red)');
    }

    const user = Store.getUser();
    const data = await API.updateStats(user.nick, this.bet, winnings, mult);
    if (data.user) Store.setUser(data.user);
    updateBalanceDisplay();
    if (data.newAchievements && data.newAchievements.length) {
      data.newAchievements.forEach(id => showAchievementToast(id));
    }

    setTimeout(() => { resultEl.style.color = 'var(--text)'; }, 2000);
    document.getElementById('rollBtn').disabled = false;
    this.rolling = false;
  },

  setStatus(text, color) {
    const el = document.getElementById('diceStatus');
    el.textContent = text;
    el.style.color = color;
  },

  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

document.addEventListener('DOMContentLoaded', () => DiceGame.init());
