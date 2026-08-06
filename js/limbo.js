const LimboGame = {
  bet: 1.00,
  target: 2.00,
  rolling: false,

  init() {
    document.getElementById('limboRollBtn').addEventListener('click', () => this.roll());
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));
    document.getElementById('tgtMinus').addEventListener('click', () => this.adjustTarget(-0.5));
    document.getElementById('tgtPlus').addEventListener('click', () => this.adjustTarget(0.5));
    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
      this.updateInfo();
    });
    document.getElementById('targetInput').addEventListener('change', (e) => {
      this.target = Math.max(1.01, parseFloat(e.target.value) || 2);
      e.target.value = this.target.toFixed(2);
      this.updateInfo();
    });
    this.updateInfo();
  },

  adjustBet(a) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + a));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
    this.updateInfo();
  },

  adjustTarget(a) {
    this.target = Math.max(1.01, Math.round((this.target + a) * 100) / 100);
    document.getElementById('targetInput').value = this.target.toFixed(2);
    this.updateInfo();
  },

  chance() { return Math.min(99 / this.target, 99); },

  updateInfo() {
    document.getElementById('limboChance').textContent = this.chance().toFixed(1) + '%';
    document.getElementById('limboWin').textContent = '$' + (this.bet * this.target).toFixed(2);
  },

  async roll() {
    if (this.rolling) return;
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.rolling = true;
    document.getElementById('limboRollBtn').disabled = true;

    const el = document.getElementById('limboResult');
    for (let i = 0; i < 12; i++) {
      el.textContent = (1 + Math.random() * 5).toFixed(2) + 'x';
      await this.wait(60);
    }

    const p = 0.99 / this.target;
    const won = Math.random() < p;
    let shown;
    if (won) shown = this.target * (1 + Math.random() * 0.5);
    else shown = 1 + Math.random() * Math.max(this.target - 1, 0.1) * 0.95;
    shown = Math.max(1.00, Math.round(shown * 100) / 100);

    el.textContent = shown.toFixed(2) + 'x';
    const winnings = won ? this.bet * this.target : 0;

    if (won) {
      el.style.color = 'var(--green-bright)';
      this.setStatus('🎉 ' + shown.toFixed(2) + 'x ≥ цели! +$' + winnings.toFixed(2), 'var(--green-bright)');
    } else {
      el.style.color = 'var(--red)';
      this.setStatus('💔 ' + shown.toFixed(2) + 'x < цели. -$' + this.bet.toFixed(2), 'var(--red)');
    }

    const user = Store.getUser();
    const data = await API.updateStats(user.nick, this.bet, winnings, this.target);
    if (data.user) Store.setUser(data.user);
    updateBalanceDisplay();
    if (data.newAchievements && data.newAchievements.length) data.newAchievements.forEach(id => showAchievementToast(id));

    setTimeout(() => { el.style.color = 'var(--text)'; }, 2000);
    document.getElementById('limboRollBtn').disabled = false;
    this.rolling = false;
  },

  setStatus(t, c) {
    const el = document.getElementById('limboStatus');
    el.textContent = t; el.style.color = c;
  },
  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

document.addEventListener('DOMContentLoaded', () => LimboGame.init());
