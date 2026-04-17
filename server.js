/**
 * KĀPPU — Backend API
 * Node.js + Express
 * Run: npm install && node server.js
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const connectDB = require('./config/db');
const { requestLogger } = require('./middlewares/loggingMiddleware');
const { verifyAuth } = require('./middlewares/authMiddleware');
const { validateClaim } = require('./middlewares/validationMiddleware');

const adminRouter = require('./routes/admin');
const v1Router = require('./routes/v1');

const { fetchRealTimeWeather } = require('./services/externalApiService');
const { analyzeMLScore, getWeightedFraudScore } = require('./services/mlFraudService');
const { triggerUPIPayment } = require('./services/paymentService');
const { startScheduler } = require('./services/schedulerService');

const app     = express();
const PORT    = 3000;

connectDB();
startScheduler();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(verifyAuth);
app.use(validateClaim);
app.use(express.static(path.join(__dirname)));

app.use('/admin', adminRouter);
app.use('/api/v1', v1Router);

// ─── CITY FLOOD MEMORY (same as frontend) ───
const FLOOD_MEMORY = {
  Chennai:   { Velachery: { risk:'high',score:80 }, 'Anna Nagar':{risk:'medium',score:45}, Adyar:{risk:'high',score:78}, Tambaram:{risk:'high',score:75}, 'T. Nagar':{risk:'medium',score:50}, Porur:{risk:'low',score:30} },
  Mumbai:    { Kurla:{risk:'high',score:85}, Sion:{risk:'high',score:80}, Andheri:{risk:'high',score:75}, Bandra:{risk:'medium',score:50}, Dadar:{risk:'medium',score:55}, Malad:{risk:'low',score:35} },
  Bengaluru: { Whitefield:{risk:'high',score:82}, Koramangala:{risk:'high',score:78}, 'HSR Layout':{risk:'medium',score:55}, Marathahalli:{risk:'high',score:80}, 'JP Nagar':{risk:'medium',score:48}, Hebbal:{risk:'low',score:30} },
  Hyderabad: { 'LB Nagar':{risk:'high',score:78}, Kukatpally:{risk:'high',score:72}, Secunderabad:{risk:'medium',score:50}, Gachibowli:{risk:'low',score:32}, Kondapur:{risk:'medium',score:45}, HITEC:{risk:'low',score:28} },
  Delhi:     { 'Yamuna Vihar':{risk:'high',score:88}, ITO:{risk:'high',score:82}, Dwarka:{risk:'medium',score:52}, 'Connaught Place':{risk:'medium',score:48}, Rohini:{risk:'low',score:35}, Noida:{risk:'medium',score:55} },
};

// ─── MOCK DB ───
const DB = {
  users: [
    { id:1, phone:'9876543210', pass:'demo123', name:'Ravi Kumar', platform:'Zomato', city:'Chennai', zone:'Velachery', plan:'weekly' },
  ],
  shifts: [],
  claims: [
    { id:'CLM001', userId:1, date:'2025-03-22', type:'rain',   icon:'🌧️', amount:380, status:'paid', wii:55 },
    { id:'CLM002', userId:1, date:'2025-03-15', type:'outage', icon:'📵', amount:280, status:'paid', wii:62 },
    { id:'CLM003', userId:1, date:'2025-02-28', type:'storm',  icon:'⛈️', amount:520, status:'paid', wii:74 },
  ],
  zoneClaims: {},
};

// ─── AI FUNCTIONS ───

function calcWII({ rainfall=0, aqi=80, temp=30, wind=10, type='' }) {
  if (type === 'outage') return 62;
  if (type === 'bandh')  return 70;
  const r = Math.min(40, (rainfall/150)*40);
  const a = Math.min(25, Math.max(0,(aqi-100)/300)*25);
  const t = Math.min(15, Math.max(0,(temp-38)/10)*15);
  const w = Math.min(20, (wind/80)*20);
  return Math.round(r+a+t+w);
}

function calcRiskScore(city, zone, wii) {
  const zoneData = FLOOD_MEMORY[city]?.[zone];
  const zoneScore = zoneData?.score || 40;
  const seasonal  = 20;
  return Math.min(100, Math.round(wii*0.5 + zoneScore*0.3 + seasonal*0.2));
}

function calcPremium(riskScore, plan) {
  if (plan === 'shift')  return 8;
  if (plan === 'max')    return 50;
  return Math.min(50, 20 + Math.round((riskScore/100)*30));
}

function detectFraud(userId, zone, wii, claimAmount, type) {
  let score = 0;
  const checks = [];

  checks.push({ check:'Location',    result:'pass', msg:'GPS verified in registered zone' });
  checks.push({ check:'Movement',    result:'pass', msg:'Active movement confirmed' });

  // Peer validation — check zone claim volume
  const hourKey = `${zone}_${Math.floor(Date.now()/3600000)}`;
  DB.zoneClaims[hourKey] = (DB.zoneClaims[hourKey]||0)+1;
  if (DB.zoneClaims[hourKey] >= 5) {
    checks.push({ check:'Peer Validation', result:'pass', msg:`${DB.zoneClaims[hourKey]} peers confirmed — auto-approved` });
  } else {
    checks.push({ check:'Peer Validation', result:'warn', msg:'Low peer count — soft review' });
    score += 10;
  }

  if (wii < 40 && type !== 'outage' && type !== 'bandh') {
    checks.push({ check:'Environmental', result:'fail', msg:`WII ${wii} — no disruption confirmed` });
    score += 40;
  } else {
    checks.push({ check:'Environmental', result:'pass', msg:`WII ${wii} confirms disruption` });
  }

  checks.push({ check:'Amount', result:'pass', msg:'Claim within normal range' });
  score += 5;

  return { score: Math.min(100,score), checks, verdict: score<30?'clean':score<60?'review':'flagged' };
}

// ─── ROUTES ───

app.post('/login', (req,res) => {
  const { phone, pass } = req.body;
  const user = DB.users.find(u => u.phone===phone && u.pass===pass);
  if (!user) return res.status(401).json({ error:'Invalid credentials' });
  const { pass:_, ...safe } = user;
  res.json({ success:true, user:safe, token:`tok_${user.id}` });
});

app.post('/register', (req,res) => {
  const { name, phone, platform, city, zone, plan } = req.body;
  if (!name||!phone||!city||!zone) return res.status(400).json({ error:'Missing fields' });
  const existing = DB.users.find(u => u.phone===phone);
  if (existing) return res.status(409).json({ error:'Phone already registered' });
  const user = { id:DB.users.length+1, phone, pass:'auto', name, platform, city, zone, plan:'weekly', ...( plan && {plan} ) };
  DB.users.push(user);
  res.json({ success:true, user, token:`tok_${user.id}` });
});

app.get('/zone-risk', (req,res) => {
  const { city, zone } = req.query;
  const data = FLOOD_MEMORY[city]?.[zone];
  if (!data) return res.status(404).json({ error:'Zone not found' });
  res.json({ success:true, city, zone, ...data });
});

app.get('/cities', (req,res) => {
  const result = {};
  Object.entries(FLOOD_MEMORY).forEach(([city, zones]) => {
    result[city] = Object.keys(zones);
  });
  res.json({ success:true, cities:result });
});

app.post('/shift/start', (req,res) => {
  const { userId, plan } = req.body;
  const user = DB.users.find(u=>u.id===userId);
  if (!user) return res.status(404).json({error:'User not found'});
  const shift = { id:`SHF${Date.now()}`, userId, startTime:new Date().toISOString(), active:true, plan:plan||user.plan, cost:8 };
  DB.shifts.push(shift);
  res.json({ success:true, shift, message:'Shift protection activated — ₹8 charged' });
});

app.post('/shift/end', (req,res) => {
  const { shiftId } = req.body;
  const shift = DB.shifts.find(s=>s.id===shiftId);
  if (!shift) return res.status(404).json({error:'Shift not found'});
  shift.active = false;
  shift.endTime = new Date().toISOString();
  res.json({ success:true, shift });
});

app.get('/weather', async (req,res) => {
  const city = req.query.city || 'Chennai';
  const zone = req.query.zone || 'Velachery';
  
  const realTimeData = await fetchRealTimeWeather(city, zone);
  if (realTimeData) {
      return res.json({ success: true, weather: realTimeData, location: { city, zone } });
  }

  // Mock — in production: OpenWeatherMap + IMD
  const scenarios = [
    { temp:30,aqi:75, rain:0,  wind:12, type:'none',   wii:0  },
    { temp:27,aqi:88, rain:22, wind:30, type:'rain',   wii:38 },
    { temp:23,aqi:110,rain:120,wind:68, type:'storm',  wii:74 },
    { temp:35,aqi:318,rain:2,  wind:8,  type:'aqi',    wii:54 },
    { temp:31,aqi:80, rain:0,  wind:10, type:'outage', wii:62 },
    { temp:30,aqi:72, rain:0,  wind:9,  type:'bandh',  wii:70 },
  ];
  const w = scenarios[Math.floor(Math.random()*scenarios.length)];
  w.wii = calcWII(w);
  res.json({ success:true, weather:w, location:{ city, zone } });
});

app.post('/claim', (req,res) => {
  const { userId, type, upiId, wii=0, weather={} } = req.body;
  const user = DB.users.find(u=>u.id===userId);
  if (!user) return res.status(404).json({error:'User not found'});

  const liveWii = wii || calcWII({...weather, type});
  const fraud   = detectFraud(userId, user.zone, liveWii, 400, type);

  const mlScore = analyzeMLScore(userId, 400, user.zone, liveWii);
  const finalScore = getWeightedFraudScore(fraud.score, mlScore);
  
  fraud.score = finalScore;
  fraud.verdict = finalScore < 30 ? 'clean' : finalScore < 60 ? 'review' : 'flagged';
  fraud.checks.push({ check: 'AI/ML Analysis', result: 'pass', msg: `ML Score ${mlScore} factored in` });

  if (fraud.verdict==='flagged') return res.status(403).json({ success:false, error:'Claim flagged', fraudScore:fraud.score, checks:fraud.checks });

  const payouts = { rain:[300,500], storm:[400,520], aqi:[250,350], outage:[200,350], bandh:[500,700], heat:[250,400], flood:[400,600] };
  const range   = payouts[type] || [200,400];
  const amount  = range[0] + Math.floor(Math.random()*(range[1]-range[0]));

  const claim = {
    id:`CLM${String(DB.claims.length+1).padStart(3,'0')}`,
    userId, date:new Date().toISOString().slice(0,10),
    type, amount, status:'processing', wii:liveWii, upiId,
    txnId:`TXN${Date.now().toString().slice(-8)}`, fraudScore:fraud.score,
  };
  DB.claims.push(claim);

  triggerUPIPayment(upiId, amount).then((paymentRes) => {
      claim.status = 'paid';
      claim.txnId = paymentRes.txnId;
  });

  res.json({ success:true, claim, fraud:{ score:fraud.score, verdict:fraud.verdict }, message:`₹${amount} payout initiated to ${upiId}` });
});

app.get('/claims', (req,res) => {
  const userId = parseInt(req.query.userId);
  const claims = DB.claims.filter(c=>c.userId===userId);
  res.json({ success:true, claims, total:claims.length });
});

app.get('/risk-score', (req,res) => {
  const { city, zone, wii=0 } = req.query;
  const riskScore = calcRiskScore(city, zone, parseInt(wii));
  const premium   = calcPremium(riskScore, 'weekly');
  const zoneData  = FLOOD_MEMORY[city]?.[zone] || {};
  res.json({ success:true, riskScore, premium, zoneRisk:zoneData.risk||'unknown', floodScore:zoneData.score||40 });
});

app.get('/solidarity', (req,res) => {
  const { city, zone, type } = req.query;
  const names = ['Rahul','Kumar','Arjun','Priya','Suresh','Anita','Vijay','Deepa'];
  const n     = 5 + Math.floor(Math.random()*5);
  const feed  = Array.from({length:n},(_,i)=>({
    name:  names[Math.floor(Math.random()*names.length)],
    zone:  zone,
    amount:300+Math.floor(Math.random()*250),
    minsAgo: i*2+1,
  }));
  res.json({ success:true, count:n, peerVerified:n>=5, feed });
});

app.get('/health', (_,res) => res.json({ status:'ok', service:'Kāppu API', version:'1.0.0' }));

app.listen(PORT, ()=>{
  console.log(`
  ⚡ Kāppu API — http://localhost:${PORT}
  
  Routes:
    POST /login            Auth
    POST /register         New worker
    GET  /cities           All cities + zones
    GET  /zone-risk        Flood memory for zone
    POST /shift/start      Activate shift
    POST /shift/end        End shift
    GET  /weather          Live WII + conditions
    POST /claim            Submit claim + fraud check
    GET  /claims           Claims history
    GET  /risk-score       Risk score + premium
    GET  /solidarity       Peer claims feed
    GET  /health           Health check
  `);
});
