// ===== CRASH GAME =====

const CrashGame = {
    state: 'idle', // idle, running, crashed, cashed
    multiplier: 1.00,
    crashPoint: 0,
    bet: 1.00,
    animationId: null,
    startTime: 0,
    canvas: null,
    ctx: null,
    points: [],

    init() {
        this.canvas = document.getElementById('crashCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Resize canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Controls
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('cashoutBtn').addEventListener('click', () => this.cashout());
        document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-0.5));
        document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(0.5));

        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.bet;
                if (val === 'max') {
                    this.bet = Store.getBalance();
                } else {
                    this.bet = parseFloat(val);
                }
                document.getElementById('betAmount').value = this.bet.toFixed(2);
            });
        });

        // Bet input
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
        // House edge ~3%
        const r = Math.random();
        if (r < 0.03) return 1.00; // 3% instant crash
        return Math.max(1.00, Math.floor((0.97 / (1 - Math.random())) * 100) / 100);
    },

    start() {
        const balance = Store.getBalance();
        if (this.bet > balance) {
            this.setStatus('Недостаточно средств!', 'var(--red)');
            return;
        }
        if (this.bet < 0.10) {
            this.setStatus('Минимальная ставка $0.10', 'var(--red)');
            return;
        }

        // Deduct bet
        Store.setBalance(balance - this.bet);

        this.state = 'running';
        this.multiplier = 1.00;
        this.crashPoint = this.generateCrashPoint();
        this.points = [];
        this.startTime = Date.now();

        // UI
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('cashoutBtn').style.display = 'block';
        document.getElementById('cashoutBtn').textContent = '💰 Забрать $' + this.bet.toFixed(2);
        this.setStatus('Летим! 🚀', 'var(--green-bright)');

        this.animate();
    },

    animate() {
        if (this.state !== 'running') return;

        const elapsed = (Date.now() - this.startTime) / 1000;
        // Multiplier grows exponentially
        this.multiplier = Math.pow(Math.E, elapsed * 0.3);
        this.multiplier = Math.round(this.multiplier * 100) / 100;

        // Update display
        document.getElementById('crashMultiplier').textContent = this.multiplier.toFixed(2) + 'x';
        document.getElementById('cashoutBtn').textContent = '💰 Забрать $' + (this.bet * this.multiplier).toFixed(2);

        // Store point for graph
        this.points.push(this.multiplier);

        // Draw
        this.drawGraph();

        // Check crash
        if (this.multiplier >= this.crashPoint) {
            this.crash();
            return;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    crash() {
        this.state = 'crashed';
        cancelAnimationFrame(this.animationId);

        document.getElementById('crashMultiplier').textContent = this.crashPoint.toFixed(2) + 'x';
        document.getElementById('crashMultiplier').style.color = 'var(--red)';
        this.setStatus('💥 Крах на ' + this.crashPoint.toFixed(2) + 'x', 'var(--red)');

        // Update stats
        this.updateStats(false, 0);
        this.addHistory(this.crashPoint, false);

        // Reset UI after delay
        setTimeout(() => this.reset(), 2500);
    },

    cashout() {
        if (this.state !== 'running') return;

        this.state = 'cashed';
        cancelAnimationFrame(this.animationId);

        const winnings = this.bet * this.multiplier;
        Store.setBalance(Store.getBalance() + winnings);

        document.getElementById('crashMultiplier').style.color = 'var(--green-bright)';
        this.setStatus('✅ Забрал $' + winnings.toFixed(2) + ' на ' + this.multiplier.toFixed(2) + 'x!', 'var(--green-bright)');

        // Update stats
        this.updateStats(true, winnings);
        this.addHistory(this.multiplier, true);

        setTimeout(() => this.reset(), 2500);
    },

    reset() {
        this.state = 'idle';
        this.multiplier = 1.00;
        this.points = [];

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

    updateStats(won, amount) {
        const user = Store.getUser();
        if (!user) return;

        user.stats.bets++;
        user.stats.wagered += this.bet;

        if (won) {
            user.stats.wins++;
            user.stats.profit += amount - this.bet;
            user.stats.biggestWin = Math.max(user.stats.biggestWin, amount);
        } else {
            user.stats.losses++;
            user.stats.profit -= this.bet;
        }

        // XP
        user.xp += won ? 25 : 10;

        Store.setUser(user);
    },

    addHistory(multiplier, won) {
        const container = document.getElementById('roundHistory');
        const item = document.createElement('span');
        item.className = 'history-item ' + (won ? 'history-green' : 'history-red');
        item.textContent = multiplier.toFixed(1) + 'x';
        container.insertBefore(item, container.firstChild);

        // Keep max 10
        while (container.children.length > 10) {
            container.removeChild(container.lastChild);
        }
    },

    drawIdle() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#2A2E35';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            const y = (h / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    },

    drawGraph() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (this.points.length < 2) return;

        const maxMult = Math.max(...this.points, 2);
        const step = w / Math.max(this.points.length - 1, 1);

        // Draw curve
        ctx.beginPath();
        ctx.strokeStyle = this.state === 'crashed' ? '#EF4444' : '#22C55E';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        this.points.forEach((mult, i) => {
            const x = i * step;
            const y = h - ((mult - 1) / (maxMult - 1)) * (h - 20);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();

        // Glow effect
        ctx.shadowColor = this.state === 'crashed' ? '#EF4444' : '#22C55E';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
};

// Init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    CrashGame.init();
});