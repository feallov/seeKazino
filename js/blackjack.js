const BlackjackGame = {
  deck: [],
  player: [],
  dealer: [],
  bet: 1.00,
  state: 'idle',

  init() {
    document.getElementById('dealBtn').addEventListener('click', () => this.deal());
    document.getElementById('hitBtn').addEventListener('click', () => this.hit());
    document.getElementById('standBtn').addEventListener('click', () => this.stand());
    document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
    document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));
    document.getElementById('betAmount').addEventListener('change', (e) => {
      this.bet = Math.max(0.10, parseFloat(e.target.value) || 0.10);
      e.target.value = this.bet.toFixed(2);
    });
  },

  adjustBet(amount) {
    this.bet = Math.max(0.10, Math.min(Store.getBalance(), this.bet + amount));
    document.getElementById('betAmount').value = this.bet.toFixed(2);
  },

  newDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    this.deck = [];
    suits.forEach(s => ranks.forEach(r => this.deck.push({ s, r })));
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  },

  drawCard() { return this.deck.pop(); },

  handValue(hand) {
    let total = 0, aces = 0;
    hand.forEach(c => {
      if (c.r === 'A') { aces++; total += 11; }
      else if (['K', 'Q', 'J'].includes(c.r)) total += 10;
      else total += parseInt(c.r);
    });
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  },

  renderCard(c, hidden) {
    if (hidden) return '<div class="bj-card back"></div>';
    const red = c.s === '♥' || c.s === '♦';
    return `<div class="bj-card ${red ? 'red' : ''}"><span class="bj-rank">${c.r}</span><span class="bj-suit">${c.s}</span></div>`;
  },

  render(hideDealer) {
    document.getElementById('playerCards').innerHTML = this.player.map(c => this.renderCard(c, false)).join('');
    document.getElementById('dealerCards').innerHTML = this.dealer.map((c, i) => this.renderCard(c, hideDealer && i === 1)).join('');
    document.getElementById('playerScore').textContent = '= ' + this.handValue(this.player);
    document.getElementById('dealerScore').textContent = hideDealer ? '' : '= ' + this.handValue(this.dealer);
  },

  setButtons(mode) {
    // mode: 'deal' | 'play' | 'none'
    document.getElementById('dealBtn').style.display = mode === 'deal' ? 'block' : 'none';
    document.getElementById('hitBtn').style.display = mode === 'play' ? 'block' : 'none';
    document.getElementById('standBtn').style.display = mode === 'play' ? 'block' : 'none';
  },

  async deal() {
    if (!Store.getUser()) { this.setStatus('Сначала войди в аккаунт!', 'var(--red)'); return; }
    if (this.bet > Store.getBalance()) { this.setStatus('Недостаточно средств!', 'var(--red)'); return; }

    this.newDeck();
    this.player = [this.drawCard(), this.drawCard()];
    this.dealer = [this.drawCard(), this.drawCard()];
    this.state = 'playing';
    this.render(true);
    this.setButtons('play');
    this.setStatus('Твой ход: ещё карту или хватит?', 'var(--text-muted)');

    // Блэкджек с раздачи!
    if (this.handValue(this.player) === 21) {
      await this.wait(600);
      this.finish('blackjack');
    }
  },

  hit() {
    if (this.state !== 'playing') return;
    this.player.push(this.drawCard());
    this.render(true);

    const v = this.handValue(this.player);
    if (v > 21) {
      this.setStatus('💥 Перебор (' + v + ')! -$' + this.bet.toFixed(2), 'var(--red)');
      this.finish('lose');
    } else if (v === 21) {
      this.stand();
    }
  },

  async stand() {
    if (this.state !== 'playing') return;
    this.state = 'dealer';
    this.setButtons('none');

    // Дилер добирает до 17
    while (this.handValue(this.dealer) < 17) {
      this.dealer.push(this.drawCard());
      this.render(false);
      await this.wait(700);
    }
    this.render(false);

    const p = this.handValue(this.player);
    const d = this.handValue(this.dealer);

    if (d > 21 || p > d) {
      this.setStatus('🎉 Дилер ' + d + ' — ты ' + p + '. Победа $' + (this.bet * 2).toFixed(2) + '!', 'var(--green-bright)');
      this.finish('win');
    } else if (p === d) {
      this.setStatus('🤝 Ничья: ' + p + ' на ' + d + '. Ставка возвращена.', 'var(--text-muted)');
      this.finish('push');
    } else {
      this.setStatus('Дилер ' + d + ' — ты ' + p + '. Поражение. -$' + this.bet.toFixed(2), 'var(--red)');
      this.finish('lose');
    }
  },

  async finish(result) {
    this.state = 'finished';
    this.render(false);
    this.setButtons('none');

    let winAmount = 0;
    let mult = 0;
    if (result === 'win') { winAmount = this.bet * 2; mult = 2; }
    if (result === 'blackjack') {
      winAmount = this.bet * 2.5; mult = 2.5;
      this.setStatus(' БЛЭКДЖЕК! +$' + (this.bet * 1.5).toFixed(2) + '!', 'var(--green-bright)');
    }
    if (result === 'push') { winAmount = this.bet; mult = 1; }

    const user = Store.getUser();
    const data = await API.updateStats(user.nick, this.bet, winAmount, mult);
    if (data.user) Store.setUser(data.user);
    updateBalanceDisplay();
    if (data.newAchievements && data.newAchievements.length) {
      data.newAchievements.forEach(id => showAchievementToast(id));
    }

    setTimeout(() => {
      this.setButtons('deal');
      this.setStatus('Сделай ставку и жми "Раздать"', 'var(--text-muted)');
    }, 3000);
  },

  setStatus(text, color) {
    const el = document.getElementById('bjStatus');
    el.textContent = text;
    el.style.color = color;
  },

  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

document.addEventListener('DOMContentLoaded', () => BlackjackGame.init());
