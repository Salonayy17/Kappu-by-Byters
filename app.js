/* ================================================
   KĀPPU — app.js
   All logic: Auth, Demo, Setup, Shift Toggle,
   WII, Fraud, Claims, Solidarity Feed, Payout
   ================================================ */

// ──── CITY FLOOD MEMORY ────
// Real historical data for Indian cities
const FLOOD_MEMORY = {
  Chennai: {
    Velachery:    { risk: 'high',   score: 80, history: 'Flooded: Oct 2023, Nov 2021, Dec 2015' },
    Tambaram:     { risk: 'high',   score: 75, history: 'Flooded: Nov 2021, Dec 2015, Oct 2018' },
    Adyar:        { risk: 'high',   score: 78, history: 'Flooded: Dec 2015, Oct 2023, Jan 2020' },
    'Anna Nagar': { risk: 'medium', score: 45, history: 'Waterlogging: Nov 2021, Oct 2023' },
    'T. Nagar':   { risk: 'medium', score: 50, history: 'Waterlogging: Dec 2015, Oct 2023' },
    Porur:        { risk: 'low',    score: 30, history: 'Minor flooding: Dec 2015' },
  },
  Mumbai: {
    Kurla:        { risk: 'high',   score: 85, history: 'Flooded: Jul 2021, Aug 2022, Jul 2023' },
    Sion:         { risk: 'high',   score: 80, history: 'Flooded: Jul 2021, Aug 2019, Jul 2023' },
    Andheri:      { risk: 'high',   score: 75, history: 'Flooded: Jul 2022, Aug 2020, Jul 2021' },
    Bandra:       { risk: 'medium', score: 50, history: 'Waterlogging: Jul 2021, Aug 2022' },
    'Dadar':      { risk: 'medium', score: 55, history: 'Waterlogging: Jul 2021, Aug 2019' },
    Malad:        { risk: 'low',    score: 35, history: 'Minor flooding: Jul 2022' },
  },
  Bengaluru: {
    Whitefield:   { risk: 'high',   score: 82, history: 'Flooded: Sep 2022, Oct 2022, Aug 2023' },
    Koramangala:  { risk: 'high',   score: 78, history: 'Flooded: Sep 2022, Jul 2023' },
    'HSR Layout': { risk: 'medium', score: 55, history: 'Waterlogging: Sep 2022, Oct 2023' },
    Marathahalli: { risk: 'high',   score: 80, history: 'Flooded: Sep 2022, Aug 2023' },
    'JP Nagar':   { risk: 'medium', score: 48, history: 'Waterlogging: Sep 2022' },
    Hebbal:       { risk: 'low',    score: 30, history: 'Minor flooding: Oct 2022' },
  },
  Hyderabad: {
    'LB Nagar':   { risk: 'high',   score: 78, history: 'Flooded: Oct 2020, Sep 2022' },
    Kukatpally:   { risk: 'high',   score: 72, history: 'Flooded: Oct 2020, Aug 2022' },
    Secunderabad: { risk: 'medium', score: 50, history: 'Waterlogging: Oct 2020' },
    Gachibowli:   { risk: 'low',    score: 32, history: 'Minor flooding: Oct 2020' },
    Kondapur:     { risk: 'medium', score: 45, history: 'Waterlogging: Oct 2020, Sep 2022' },
    HITEC:        { risk: 'low',    score: 28, history: 'No major flooding on record' },
  },
  Delhi: {
    'Yamuna Vihar':{ risk: 'high',  score: 88, history: 'Flooded: Jul 2023, Aug 2022, Jul 2021' },
    'ITO':        { risk: 'high',   score: 82, history: 'Flooded: Jul 2023, Aug 2022' },
    Dwarka:       { risk: 'medium', score: 52, history: 'Waterlogging: Jul 2023, Aug 2021' },
    'Connaught Place': { risk: 'medium', score: 48, history: 'Waterlogging: Jul 2023' },
    Rohini:       { risk: 'low',    score: 35, history: 'Minor flooding: Jul 2023' },
    Noida:        { risk: 'medium', score: 55, history: 'Waterlogging: Jul 2023, Aug 2022' },
  },
};

// ──── WEATHER SCENARIOS ────
const SCENARIOS = {
  normal: { temp: 30, aqi: 75,  rain: 0,   wind: 12, type: 'none' },
  rain:   { temp: 27, aqi: 88,  rain: 22,  wind: 30, type: 'rain' },
  storm:  { temp: 23, aqi: 110, rain: 120, wind: 68, type: 'storm' },
  aqi:    { temp: 35, aqi: 318, rain: 2,   wind: 8,  type: 'aqi' },
  outage: { temp: 31, aqi: 80,  rain: 0,   wind: 10, type: 'outage' },
  bandh:  { temp: 30, aqi: 72,  rain: 0,   wind: 9,  type: 'bandh' },
};

const DISRUPTION_META = {
  rain:   { icon: '🌧️', title: 'Rain Alert',          desc: 'IMD: 22mm/hr — payout eligible',       payout: [300, 420] },
  storm:  { icon: '⛈️', title: 'Severe Storm',         desc: 'Storm activity — coverage triggered',  payout: [400, 520] },
  aqi:    { icon: '😷', title: 'Hazardous AQI: 318',   desc: 'Air quality disruption active',         payout: [250, 350] },
  outage: { icon: '📵', title: 'Platform Outage',       desc: 'App unavailable >90 min in your zone', payout: [200, 350] },
  bandh:  { icon: '🚧', title: 'Bandh / Curfew',        desc: 'Government-declared restriction',       payout: [500, 700] },
  none:   null,
};

// ──── STATE ────
const S = {
  user:         null,
  shiftActive:  false,
  shiftStart:   null,
  shiftTimer:   null,
  weather:      { ...SCENARIOS.normal },
  wii:          0,
  currentDisruption: 'none',
  fraudScore:   0,
  selectedPlan: 'weekly',
  selectedPlatform: '',
  claims: [
    { icon: '🌧️', title: 'Heavy Rain — Velachery',    date: 'Mar 22', amount: 380, status: 'Paid' },
    { icon: '📵', title: 'Platform Outage — Zomato',  date: 'Mar 15', amount: 280, status: 'Paid' },
    { icon: '⛈️', title: 'Storm — Zone Closure',      date: 'Feb 28', amount: 520, status: 'Paid' },
  ],
  shiftsThisWeek: 5,
  totalClaimed: 1180,
  premiumPaid: 35,
};

// ──── DEMO SLIDESHOW ────
const DEMO_TOTAL = 7;
let demoIdx = 0;
let demoTimer = null;

function startDemo() {
  demoIdx = 0;
  document.getElementById('demoModal').style.display = 'flex';
  buildDots();
  goSlide(0);
  startAutoplay();
}
function closeDemoModal() {
  clearInterval(demoTimer);
  document.getElementById('demoModal').style.display = 'none';
}
function buildDots() {
  const c = document.getElementById('demoDots');
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < DEMO_TOTAL; i++) {
    const d = document.createElement('div');
    d.className = 'dd-dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goSlide(i);
    c.appendChild(d);
  }
}
function goSlide(i) {
  demoIdx = i;
  document.querySelectorAll('.demo-slide').forEach((s, idx) => s.classList.toggle('active', idx === i));
  document.querySelectorAll('.dd-dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
  const bar = document.getElementById('demoBar');
  if (bar) bar.style.width = ((i + 1) / DEMO_TOTAL * 100) + '%';
  const prev = document.getElementById('dnavPrev');
  const next = document.getElementById('dnavNext');
  if (prev) prev.disabled = i === 0;
  if (next) {
    next.textContent = i === DEMO_TOTAL - 1 ? '✓' : '→';
    next.onclick = i === DEMO_TOTAL - 1 ? enterApp : () => demoNav(1);
  }
}
function demoNav(dir) {
  const n = demoIdx + dir;
  if (n < 0 || n >= DEMO_TOTAL) return;
  goSlide(n);
  clearInterval(demoTimer); startAutoplay();
}
function startAutoplay() {
  clearInterval(demoTimer);
  demoTimer = setInterval(() => {
    if (demoIdx < DEMO_TOTAL - 1) goSlide(demoIdx + 1);
    else clearInterval(demoTimer);
  }, 4500);
}

// ──── ROUTING ────
function goToOnboard() { window.location.href = 'setup.html'; }
function goToLogin() { openModal('loginModal'); }
function enterApp() {
  closeDemoModal();
  // Set demo user if not logged in
  if (!sessionStorage.getItem('kaappu_user')) {
    const demoUser = { name: 'Ravi Kumar', phone: '9876543210', platform: 'Zomato', city: 'Chennai', zone: 'Velachery', plan: 'weekly', isDemo: true };
    sessionStorage.setItem('kaappu_user', JSON.stringify(demoUser));
  }
  window.location.href = 'app.html';
}
function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}

// ──── AUTH ────
function handleLogin() {
  const phone = (document.getElementById('loginPhone')?.value || '').trim();
  const pass  = (document.getElementById('loginPass')?.value || '').trim();
  if (!phone || !pass) return showLoginErr('Please fill in all fields');
  if (phone === '9876543210' && pass === 'demo123') {
    const user = { name: 'Ravi Kumar', phone, platform: 'Zomato', city: 'Chennai', zone: 'Velachery', plan: 'weekly', isDemo: false };
    sessionStorage.setItem('kaappu_user', JSON.stringify(user));
    window.location.href = 'app.html';
  } else {
    showLoginErr('Invalid credentials. Try 9876543210 / demo123');
  }
}
function showLoginErr(msg) {
  const el = document.getElementById('loginErr');
  if (!el) return;
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ──── SETUP FLOW ────
let currentStep = 1;

function nextStep(n) {
  // Validate
  if (n === 2) {
    const name = document.getElementById('workerName')?.value.trim();
    const phone = document.getElementById('workerPhone')?.value.trim();
    if (!name || !phone) { showToast('Please fill in name and mobile'); return; }
    if (!S.selectedPlatform) { showToast('Please select your platform'); return; }
  }
  if (n === 3) {
    const city = document.getElementById('workerCity')?.value;
    const zone = document.getElementById('workerZone')?.value;
    if (!city || !zone) { showToast('Please select city and zone'); return; }
    computeRiskBanner(city, zone);
  }

  document.getElementById(`step${currentStep}`)?.classList.remove('active');
  document.getElementById(`step${n}`)?.classList.add('active');
  currentStep = n;

  const fills = { 1: '33%', 2: '66%', 3: '100%' };
  const fill = document.getElementById('stepFill');
  if (fill) fill.style.width = fills[n];
  const label = document.getElementById('stepLabel');
  if (label) label.textContent = `Step ${n} of 3`;
}

function computeRiskBanner(city, zone) {
  const zoneData = FLOOD_MEMORY[city]?.[zone];
  const score = zoneData ? zoneData.score : 45;
  const desc  = zoneData?.risk === 'high' ? 'High-risk zone — stronger coverage recommended' :
                zoneData?.risk === 'medium' ? 'Moderate risk zone' : 'Low risk zone';
  setText('rbScore', score);
  setText('rbCity',  `${city} · ${zone}`);
  setText('rbDesc',  desc);
}

function updateZones() {
  const city = document.getElementById('workerCity')?.value;
  const zoneSelect = document.getElementById('workerZone');
  const floodCard  = document.getElementById('floodCard');
  if (!zoneSelect || !city) return;

  const zones = Object.keys(FLOOD_MEMORY[city] || {});
  zoneSelect.innerHTML = zones.map(z => `<option value="${z}">${z}</option>`).join('');
  zoneSelect.onchange = () => updateFloodCard(city, zoneSelect.value);
  updateFloodCard(city, zones[0]);
}

function updateFloodCard(city, zone) {
  const data = FLOOD_MEMORY[city]?.[zone];
  const card = document.getElementById('floodCard');
  const body = document.getElementById('floodBody');
  if (!card || !body || !data) return;
  card.style.display = 'block';
  const riskColor = data.risk === 'high' ? '#ff4d4d' : data.risk === 'medium' ? '#fbbf24' : '#00e5a0';
  body.innerHTML = `<span style="color:${riskColor};font-weight:700;text-transform:uppercase;font-size:0.78rem">${data.risk} flood risk</span><br/>${data.history}`;
}

function selectPlatform(val) {
  S.selectedPlatform = val;
  document.querySelectorAll('.pp-opt').forEach(el => el.classList.toggle('selected', el.dataset.val === val));
}

function selectPlan(plan) {
  S.selectedPlan = plan;
  document.querySelectorAll('.plan-card').forEach(el => el.classList.toggle('selected', el.dataset.plan === plan));
}

function activateAndGo() {
  const name     = document.getElementById('workerName')?.value.trim() || 'Worker';
  const phone    = document.getElementById('workerPhone')?.value.trim() || '9876543210';
  const platform = S.selectedPlatform || 'Zomato';
  const city     = document.getElementById('workerCity')?.value || 'Chennai';
  const zone     = document.getElementById('workerZone')?.value || 'Velachery';
  const plan     = S.selectedPlan;

  const user = { name, phone, platform, city, zone, plan, isDemo: false };
  sessionStorage.setItem('kaappu_user', JSON.stringify(user));
  window.location.href = 'app.html';
}

// ──── APP INIT ────
function initApp() {
  const raw = sessionStorage.getItem('kaappu_user');
  if (!raw) { window.location.href = 'index.html'; return; }
  S.user = JSON.parse(raw);

  setText('sbWorker',  S.user.name.split(' ')[0]);
  setText('sbCity',    S.user.city);
  setText('profName',  S.user.name);
  setText('profSub',   `${S.user.platform} · ${S.user.city} · ${S.user.zone}`);
  setText('profAvatar', S.user.name.charAt(0).toUpperCase());

  // Plan display
  const planMeta = {
    shift:  { name: 'Shift Shield',  price: '₹8/shift',  cover: 'Up to ₹400/shift' },
    weekly: { name: 'Weekly Shield', price: '₹35/week',  cover: 'Up to ₹1,500/week' },
    max:    { name: 'Max Shield',    price: '₹50/week',  cover: 'Up to ₹2,500/week' },
  };
  const pm = planMeta[S.user.plan] || planMeta.weekly;
  setText('scPlan',    pm.name);
  setText('pdcName',   pm.name);
  setText('pdcPrice',  pm.price);
  setText('pdcCover',  pm.cover);

  // Zone risk
  const zd = FLOOD_MEMORY[S.user.city]?.[S.user.zone];
  setText('zrcCity',    `${S.user.city} · ${S.user.zone}`);
  setText('zrcRisk',    zd ? `${zd.risk.charAt(0).toUpperCase() + zd.risk.slice(1)} Flood Risk Zone` : 'Zone data unavailable');
  setText('zrcHistory', zd?.history || '');

  // Week stats
  setText('wsShifts',  S.shiftsThisWeek);
  setText('wsClaimed', `₹${S.totalClaimed}`);
  setText('wsPremium', `₹${S.premiumPaid}`);

  renderClaimHistory();
  updateWeatherUI();
  sim('normal');

  // Demo mode: auto-run storm after 3s
  if (S.user.isDemo) {
    showToast('🎯 Demo Mode — try simulating weather and triggering a claim!');
    setTimeout(() => sim('storm'), 3000);
  }
}

// ──── NAVIGATION ────
function goToTab(tab) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${tab}`)?.classList.add('active');
  document.getElementById(`bnav-${tab}`)?.classList.add('active');

  if (tab === 'claims') renderClaimHistory();
}

// ──── SHIFT TOGGLE ────
let shiftSeconds = 0;

function toggleShift() {
  S.shiftActive = !S.shiftActive;
  const card    = document.getElementById('shiftCard');
  const toggle  = document.getElementById('scToggle');
  const label   = document.getElementById('scLabel');
  const status  = document.getElementById('scStatus');
  const tlabel  = document.getElementById('scToggleLabel');
  const meta    = document.getElementById('scMeta');

  if (S.shiftActive) {
    card?.classList.add('active-shift');
    toggle?.classList.add('on');
    if (label)  label.textContent  = 'Shift Protected';
    if (status) { status.textContent = 'ACTIVE'; status.className = 'sc-status active'; }
    if (tlabel) tlabel.textContent = 'Tap to end shift';
    if (meta)   meta.style.display = 'grid';
    S.shiftStart = Date.now();
    S.shiftsThisWeek++;
    S.premiumPaid += 8;
    setText('wsShifts',  S.shiftsThisWeek);
    setText('wsPremium', `₹${S.premiumPaid}`);
    startShiftTimer();
    showToast('⚡ Shift protection activated — ₹8 charged');
    // Trigger disruption check after 1.5s if weather is already bad
    if (S.wii >= 40) setTimeout(() => triggerDisruptionAlert(S.currentDisruption), 1500);
  } else {
    card?.classList.remove('active-shift');
    toggle?.classList.remove('on');
    if (label)  label.textContent  = 'Protection OFF';
    if (status) { status.textContent = 'INACTIVE'; status.className = 'sc-status inactive'; }
    if (tlabel) tlabel.textContent = 'Tap to activate shift';
    if (meta)   meta.style.display = 'none';
    clearInterval(S.shiftTimer);
    shiftSeconds = 0;
    showToast('Shift ended');
  }
}

function startShiftTimer() {
  clearInterval(S.shiftTimer);
  shiftSeconds = 0;
  S.shiftTimer = setInterval(() => {
    shiftSeconds++;
    const h = String(Math.floor(shiftSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((shiftSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(shiftSeconds % 60).padStart(2, '0');
    setText('shiftTimer', `${h}:${m}:${s}`);
  }, 1000);
}

// ──── WEATHER / WII ────
function sim(type) {
  S.weather = { ...SCENARIOS[type] };
  S.currentDisruption = S.weather.type;

  // Update active sim button
  document.querySelectorAll('.sim-btn').forEach(b => b.classList.remove('active-sim'));
  const btns = document.querySelectorAll('.sim-btn');
  const typeMap = { normal: 0, rain: 1, storm: 2, aqi: 3, outage: 4, bandh: 5 };
  const idx = typeMap[type];
  if (btns[idx]) btns[idx].classList.add('active-sim');

  updateWeatherUI();
}

function calcWII(w) {
  const rain = Math.min(40, (w.rain / 150) * 40);
  const aqi  = Math.min(25, Math.max(0, (w.aqi - 100) / 300) * 25);
  const temp = Math.min(15, Math.max(0, (w.temp - 38) / 10) * 15);
  const wind = Math.min(20, (w.wind / 80) * 20);
  // Outage and bandh always hit 60
  if (w.type === 'outage') return 62;
  if (w.type === 'bandh')  return 70;
  return Math.round(rain + aqi + temp + wind);
}

function updateWeatherUI() {
  const w = S.weather;
  S.wii = calcWII(w);

  setText('condTemp', `${w.temp}°`);
  setText('condAqi',  w.aqi);
  setText('condRain', `${w.rain}mm`);
  setText('condWind', w.wind);
  setText('wiiNum',   S.wii);

  const fill = document.getElementById('wiiFill');
  if (fill) fill.style.width = S.wii + '%';

  const desc = S.wii >= 70 ? '🔴 Severe disruption — payout triggered' :
               S.wii >= 40 ? '🟡 Disruption active — eligible for payout' :
               S.wii >= 20 ? '🟢 Mild conditions — monitoring' : '⚪ Normal conditions';
  setText('wiiDesc', desc);

  // Disruption alert
  const meta = DISRUPTION_META[S.currentDisruption];
  const alertEl = document.getElementById('disruptionAlert');
  if (alertEl) {
    if (meta && S.wii >= 40) {
      alertEl.style.display = 'flex';
      setText('daIcon',  meta.icon);
      setText('daTitle', meta.title);
      setText('daDesc',  meta.desc);
      if (S.shiftActive) triggerDisruptionAlert(S.currentDisruption);
    } else {
      alertEl.style.display = 'none';
    }
  }

  updateSolidarityFeed();
}

function triggerDisruptionAlert(type) {
  const meta = DISRUPTION_META[type];
  if (!meta || S.wii < 40) return;
  showToast(`${meta.icon} ${meta.title} — coverage active. Go to Claims to report.`);
}

// ──── SOLIDARITY FEED ────
const SOLIDARITY_NAMES = ['Rahul', 'Kumar', 'Arjun', 'Priya', 'Suresh', 'Anita', 'Vijay', 'Deepa', 'Rajan', 'Meena'];
const SOLIDARITY_ZONES = {
  Chennai: ['Velachery', 'Anna Nagar', 'Adyar', 'Tambaram'],
  Mumbai:  ['Kurla', 'Andheri', 'Bandra', 'Sion'],
  Bengaluru: ['Whitefield', 'Koramangala', 'Marathahalli', 'HSR Layout'],
  Hyderabad: ['Kukatpally', 'LB Nagar', 'Secunderabad', 'Kondapur'],
  Delhi:   ['ITO', 'Dwarka', 'Rohini', 'Yamuna Vihar'],
};

function updateSolidarityFeed() {
  const feed    = document.getElementById('solidarityFeed');
  const count   = document.getElementById('feedCount');
  const banner  = document.getElementById('peerBanner');
  if (!feed) return;

  if (S.wii < 40) {
    feed.innerHTML = '<div class="feed-empty">Activate a disruption to see live claims</div>';
    if (count)  count.textContent = '0 near you';
    if (banner) banner.style.display = 'none';
    return;
  }

  const city  = S.user?.city || 'Chennai';
  const zones = SOLIDARITY_ZONES[city] || SOLIDARITY_ZONES.Chennai;
  const meta  = DISRUPTION_META[S.currentDisruption] || DISRUPTION_META.rain;

  // Generate 5–8 feed items
  const n = 5 + Math.floor(Math.random() * 4);
  const items = [];
  for (let i = 0; i < n; i++) {
    const name   = SOLIDARITY_NAMES[Math.floor(Math.random() * SOLIDARITY_NAMES.length)];
    const zone   = zones[Math.floor(Math.random() * zones.length)];
    const amount = meta.payout[0] + Math.floor(Math.random() * (meta.payout[1] - meta.payout[0]));
    const mins   = i * 2 + 1;
    items.push({ name, zone, amount, mins });
  }

  feed.innerHTML = items.map(it => `
    <div class="feed-item">
      <div class="fi-dot"></div>
      <span>${it.name} · ${it.zone} · ₹${it.amount} claimed</span>
      <span class="fi-time">${it.mins}m ago</span>
    </div>`).join('');

  if (count)  count.textContent = `${n} near you`;
  if (banner) banner.style.display = n >= 5 ? 'block' : 'none';
  setText('wsFraud', 'Auto-verified');
  setText('feedCount', `${n} near you`);
}

// ──── CLAIMS ────
function startClaim() {
  if (!S.shiftActive) {
    showToast('⚠️ Activate your shift first before claiming');
    return;
  }
  if (S.wii < 40) {
    showToast('⚠️ No active disruption detected. Simulate weather first.');
    return;
  }
  openModal('claimModal');
}

function selectDisruption(type) {
  document.querySelectorAll('.dp-opt').forEach(el => el.classList.toggle('selected', el.dataset.type === type));
  S.selectedClaimType = type;
}

function submitClaim() {
  const type = S.selectedClaimType;
  if (!type) { showToast('Select a disruption type'); return; }
  const upi  = document.getElementById('claimUpi')?.value.trim() || 'ravi@oksbi';
  closeModal('claimModal');
  runClaimFlow(type, upi);
}

function runClaimFlow(type, upi) {
  goToTab('claims');
  const card = document.getElementById('claimStatusCard');
  if (card) card.style.display = 'block';

  // Reset steps
  ['cstep1','cstep2','cstep3','cstep4','cstep5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'cstep'; }
  });

  const meta = DISRUPTION_META[type] || DISRUPTION_META.rain;

  // Step 1 — immediate
  setStepDone('cstep1');

  setTimeout(() => setStepDone('cstep2'), 800);
  setTimeout(() => {
    const s3 = document.getElementById('cstep3');
    if (s3) s3.classList.add('processing');
    runFraudChecks();
  }, 1600);
  setTimeout(() => {
    setStepDone('cstep3');
    setText('cstep3desc', 'All 5 checks passed — clean');
  }, 4000);
  setTimeout(() => setStepDone('cstep4'), 5000);
  setTimeout(() => {
    setStepDone('cstep5');
    const amount = meta.payout[0] + Math.floor(Math.random() * (meta.payout[1] - meta.payout[0]));
    setText('cstep5desc', `₹${amount} credited to ${upi}`);
    showToast(`✅ ₹${amount} payout sent to ${upi}`);

    // Add to history
    S.claims.unshift({
      icon: meta.icon, title: `${meta.title} — ${S.user?.zone || 'Your Zone'}`,
      date: 'Today', amount, status: 'Paid',
    });
    S.totalClaimed += amount;
    setText('wsClaimed', `₹${S.totalClaimed}`);
    renderClaimHistory();
  }, 6500);
}

function setStepDone(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('processing'); el.classList.add('done'); }
}

function renderClaimHistory() {
  const el = document.getElementById('claimHistory');
  if (!el) return;
  if (!S.claims.length) {
    el.innerHTML = '<div class="ch-empty">No claims yet</div>'; return;
  }
  el.innerHTML = S.claims.map(c => `
    <div class="ch-item">
      <span class="chi-icon">${c.icon}</span>
      <div class="chi-body">
        <div class="chi-title">${c.title}</div>
        <div class="chi-meta">${c.date}</div>
      </div>
      <div style="text-align:right">
        <div class="chi-amount">₹${c.amount}</div>
        <div class="chi-status" style="color:${c.status === 'Paid' ? 'var(--green)' : 'var(--yellow)'}">
          ${c.status === 'Paid' ? '✓' : '⏳'} ${c.status}
        </div>
      </div>
    </div>`).join('');
}

// ──── FRAUD DETECTION ────
const FRAUD_RULES = [
  { icon: '📍', title: 'Location Verification',    desc: 'GPS matches registered zone',       run: () => ({ level: 'pass', label: `✅ Verified — ${S.user?.zone || 'Zone'}`, score: 5 }) },
  { icon: '🚶', title: 'Movement Analysis',         desc: 'Motion detected during shift',      run: () => ({ level: 'pass', label: '✅ Active movement confirmed', score: 0 }) },
  { icon: '👥', title: 'Peer Validation',           desc: 'Workers in zone confirm event',     run: () => {
    const peers = S.wii >= 40 ? 8 : 0;
    return peers >= 5
      ? { level: 'pass', label: `✅ ${peers} peers confirmed — auto-approved`, score: 0 }
      : { level: 'warn', label: '⚠️ Low peer count — manual review', score: 15 };
  }},
  { icon: '🌧️', title: 'Environmental Consistency', desc: 'WII confirms live disruption',     run: () => {
    if (S.wii >= 40) return { level: 'pass', label: `✅ WII ${S.wii} confirms disruption`, score: 0 };
    return { level: 'fail', label: `❌ WII ${S.wii} — no disruption detected`, score: 40 };
  }},
  { icon: '📊', title: 'Earnings Pattern',          desc: 'Claim vs historical ratio',         run: () => ({ level: 'pass', label: '✅ Claim within normal range', score: 5 }) },
];

function runFraudChecks() {
  const container = document.getElementById('fraudChecksUI');
  if (!container) return;
  let total = 0;
  const html = FRAUD_RULES.map(r => {
    const res = r.run();
    total += res.score;
    return `<div class="fcl-item">
      <span class="fcl-icon">${r.icon}</span>
      <div class="fcl-body">
        <div class="fcl-title">${r.title}</div>
        <div class="fcl-desc">${r.desc}</div>
      </div>
      <span class="fcl-result ${res.level}">${res.label}</span>
    </div>`;
  });
  container.innerHTML = html.join('');
  S.fraudScore = Math.min(100, total);
  setText('fraudScoreBig', S.fraudScore);
  const fill = document.getElementById('fraudFill');
  if (fill) fill.style.width = S.fraudScore + '%';
  const verdict = S.fraudScore < 20 ? '✅ Clean — instant payout approved' :
                  S.fraudScore < 60 ? '⚠️ Under review — pending approval' : '🚨 Flagged — manual verification required';
  setText('fraudVerdict', verdict);
  setText('wsFraud', S.fraudScore < 20 ? 'Clean ✅' : `${S.fraudScore}/100`);
}

// ──── MODALS ────
function openModal(id)  { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

// close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
});

// ──── TOAST ────
let toastTimer = null;
function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ──── SETUP PAGE PLATFORM PICKER ────
document.addEventListener('DOMContentLoaded', () => {
  // Platform picker
  document.querySelectorAll('.pp-opt').forEach(el => {
    el.addEventListener('click', () => selectPlatform(el.dataset.val));
  });

  // Disruption picker (in claim modal)
  document.querySelectorAll('.dp-opt').forEach(el => {
    el.addEventListener('click', () => {
      selectDisruption(el.dataset.type);
      setTimeout(() => submitClaim(), 300); // auto-submit after selection
    });
  });

  // Page detection
  const path = window.location.pathname;
  if (path.includes('app.html'))   initApp();
  if (path.includes('setup.html')) { /* setup is driven by button clicks */ }
  if (path.includes('index.html') || path.endsWith('/')) { /* landing */ }
});

// ──── HELPERS ────
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
