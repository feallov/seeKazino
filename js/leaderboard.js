async function loadLeaderboard() {
  const res = await fetch('/api/leaderboard');
  const data = await res.json();
  const list = document.getElementById('lbList');
  if (!list) return;
  list.innerHTML = '';

  const medals = ['🥇', '', ''];
  (data.top || []).forEach((u, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row' + (i < 3 ? ' lb-top' : '');
    const profit = Number(u.profit || 0);
    row.innerHTML = `
      <span class="lb-pos">${medals[i] || (i + 1)}</span>
      <span class="lb-avatar">${u.avatar || '😎'}</span>
      <span class="lb-nick">${u.nick}</span>
      <span class="lb-level">lvl ${u.level}</span>
      <span class="lb-profit ${profit >= 0 ? 'text-green' : 'text-red'}">${profit >= 0 ? '+' : '-'}$${Math.abs(profit).toFixed(2)}</span>
    `;
    list.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', loadLeaderboard);
