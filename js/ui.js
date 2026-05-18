// === UI: SELECTION SCREEN ===================================================
// Pick state, roster card rendering, turn indicator, FIGHT button enabling.
// ============================================================================

let pickRed = null, pickBlue = null, turn = 'red';
const rosterEl = document.getElementById('roster');
const slotRedName = document.getElementById('slot-red-name');
const slotBlueName = document.getElementById('slot-blue-name');
const turnInd = document.getElementById('turn-indicator');
const fightBtn = document.getElementById('fight-btn');

function renderRoster() {
  rosterEl.innerHTML = '';
  FIGHTERS.forEach(g => {
    const card = document.createElement('div');
    card.className = 'fighter-card';
    let tag = '';
    if (pickRed === g.id) { card.classList.add('red-pick'); tag = '<div class="pick-tag" style="color:var(--red)">RED</div>'; }
    if (pickBlue === g.id) { card.classList.add('blue-pick'); tag = '<div class="pick-tag" style="color:var(--blue)">BLUE</div>'; }
    card.innerHTML = tag + `<h3>${g.name}</h3>` +
      `<div class="stats">` +
        `<div class="stat"><div class="k">HP</div><div class="v">${g.hp}</div></div>` +
        `<div class="stat"><div class="k">DMG</div><div class="v">${g.dmg}</div></div>` +
        `<div class="stat"><div class="k">CD</div><div class="v">${g.cd}s</div></div>` +
        `<div class="stat"><div class="k">SPD</div><div class="v">${g.speed}</div></div>` +
      `</div>` +
      `<div class="ability"><div class="row"><span class="tag act">ACT</span><span class="text">${g.active}</span></div><div class="row"><span class="tag pas">PAS</span><span class="text">${g.passive}</span></div></div>`;
    card.addEventListener('click', () => onPick(g.id));
    rosterEl.appendChild(card);
  });
}
function onPick(id) {
  // Tapping any selected fighter deselects it, regardless of whose turn it is
  if (pickRed === id) { pickRed = null; updateUI(); sfx('select'); return; }
  if (pickBlue === id) { pickBlue = null; updateUI(); sfx('select'); return; }
  if (turn === 'red') { pickRed = id; turn = 'blue'; }
  else { pickBlue = id; turn = 'red'; }
  sfx('select');
  updateUI();
}
function updateUI() {
  const r = FIGHTERS.find(g => g.id === pickRed);
  const b = FIGHTERS.find(g => g.id === pickBlue);
  slotRedName.textContent = r ? r.name : '— EMPTY —';
  slotBlueName.textContent = b ? b.name : '— EMPTY —';
  if (!pickRed) { turn='red'; turnInd.textContent='PICKING: RED'; turnInd.className='turn-indicator red'; }
  else if (!pickBlue) { turn='blue'; turnInd.textContent='PICKING: BLUE'; turnInd.className='turn-indicator blue'; }
  else {
    // Both picked — show the sim's odds for this matchup (select screen only;
    // never appears in a recording, which starts at the VS intro).
    const ro = matchupOdds(pickRed, pickBlue);
    turnInd.textContent = 'ODDS  ' + r.name + ' ' + ro + '%  ·  ' + b.name + ' ' + (100 - ro) + '%';
    turnInd.className = 'turn-indicator odds';
  }
  fightBtn.disabled = !(pickRed && pickBlue);
  // Hunt button: only meaningful when both picked and the matchup is lopsided
  // enough to have a real underdog (spread >= 15). Labels with the underdog.
  // Skipped entirely while a hunt is running so its progress label survives.
  const huntBtn = document.getElementById('hunt-btn');
  const huntTightBtn = document.getElementById('hunt-tight-btn');
  if (huntActive) { renderRoster(); return; }
  if (pickRed && pickBlue) {
    const ro = matchupOdds(pickRed, pickBlue);
    if (Math.abs(ro - 50) >= 15) {
      const under = ro < 50 ? r : b;
      const underPct = ro < 50 ? ro : 100 - ro;
      huntBtn.textContent = 'HUNT THE UPSET — ' + under.name + ' ' + underPct + '%';
      huntBtn.dataset.underdog = under.id;
      huntBtn.style.display = '';
    } else {
      huntBtn.style.display = 'none';
    }
    // Tight-fight hunt is meaningful for any matchup — always offered.
    huntTightBtn.textContent = 'HUNT A TIGHT FIGHT';
    huntTightBtn.style.display = '';
  } else {
    huntBtn.style.display = 'none';
    huntTightBtn.style.display = 'none';
  }
  renderRoster();
}
renderRoster(); updateUI();

