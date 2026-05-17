/* ══════════════════════════════════════════════════════════════════
   N.O.S — NITROGEN OXIDISER SYSTEM · SCRIPT v3.0
   JARVIS-GRADE AI ASSISTANT — FULL FEATURED
   ══════════════════════════════════════════════════════════════════ */
'use strict';

/* ─────────────────────────────────────────────────────────────────
   SECTION 1 · GLOBAL STATE
───────────────────────────────────────────────────────────────── */
const state = {
  muted:          false,
  voiceActive:    false,
  musicPlaying:   false,
  currentView:    'dashboard',
  bootDone:       false,
  loggedIn:       false,
  aiSpeaking:     false,
  radarAngle:     0,
  radarBlips:     [],
  radarRunning:   false,

  // JARVIS modules
  suitPower:      87,          // % power level
  suitOnline:     false,
  bloodToxicity:  0.4,         // % toxicity
  flightAlt:      0,           // metres
  flightSpeed:    0,           // km/h
  icing:          false,
  vitals: {
    heartRate:    72,
    bloodO2:      98,
    temp:         36.6,
  },
  armorMk:        'MARK II',
  armorCompletion: 100,
  trackedTarget:  null,
  energySources:  [],
  ironLegionCount: 7,
  threatLevel:    'NONE',
};

/* ─────────────────────────────────────────────────────────────────
   SECTION 2 · SITE / APP MAP
───────────────────────────────────────────────────────────────── */
const SITES = {
  spotify:   'https://open.spotify.com',
  youtube:   'https://www.youtube.com',
  github:    'https://github.com',
  gmail:     'https://mail.google.com',
  chatgpt:   'https://chat.openai.com',
  netflix:   'https://www.netflix.com',
  discord:   'https://discord.com',
  twitter:   'https://twitter.com',
  reddit:    'https://www.reddit.com',
  wikipedia: 'https://www.wikipedia.org',
};

/* ─────────────────────────────────────────────────────────────────
   SECTION 3 · AUDIO ENGINE (Web Audio API — no files needed)
───────────────────────────────────────────────────────────────── */
let audioCtx = null;
let ambientNodes = { gain: null, osc: null };

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { console.warn('Web Audio not supported'); }
}

function playBeep(freq = 440, dur = 0.1, type = 'sine', vol = 0.15) {
  if (state.muted || !audioCtx) return;
  try {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

function playStartupSound() {
  if (!audioCtx) return;
  const notes = [220, 330, 440, 550, 660, 880];
  notes.forEach((f, i) => setTimeout(() => playBeep(f, 0.2, 'sine', 0.12), i * 120));
  setTimeout(() => {
    playBeep(880, 0.4, 'sine', 0.18);
    setTimeout(() => playBeep(1320, 0.6, 'sine', 0.12), 200);
  }, notes.length * 120);
}

function playActivationSound() {
  [440, 660, 880, 1100].forEach((f, i) =>
    setTimeout(() => playBeep(f, 0.15, 'sine', 0.1), i * 80)
  );
}

function playAlertSound() {
  [880, 660, 440].forEach((f, i) =>
    setTimeout(() => playBeep(f, 0.12, 'sawtooth', 0.12), i * 90)
  );
}

function toggleMute() {
  state.muted = !state.muted;
  const icon = document.getElementById('muteIcon');
  if (icon) icon.className = state.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  showToast(state.muted ? '🔇 AUDIO MUTED' : '🔊 AUDIO ACTIVE');
  if (state.muted) stopAmbient(); else startAmbient();
}

function startAmbient() {
  if (!audioCtx || ambientNodes.osc || state.muted) return;
  try {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    osc.start();
    ambientNodes = { osc, gain };
  } catch (e) {}
}

function stopAmbient() {
  try {
    if (ambientNodes.osc) {
      ambientNodes.osc.stop();
      ambientNodes = { gain: null, osc: null };
    }
  } catch (e) {}
}

function toggleAmbient() {
  const cb = document.getElementById('settAmbient');
  if (cb?.checked) startAmbient(); else stopAmbient();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 4 · BOOT SEQUENCE
───────────────────────────────────────────────────────────────── */
const BOOT_LOGS = [
  '[BIOS]  N.O.S FIRMWARE v3.0 — LOADING...',
  '[CPU]   QUANTUM PROCESSOR CORES: ONLINE',
  '[MEM]   ALLOCATING NEURAL MEMORY BANKS...',
  '[NET]   INITIALIZING SECURE UPLINK...',
  '[AI]    LOADING JARVIS MODULE: 47.3B PARAMS',
  '[ARMOR] SUIT MANAGEMENT SYSTEM: STANDBY',
  '[BIO]   VITAL SIGNS MONITOR: ACTIVE',
  '[VID]   HOLOGRAPHIC RENDERER: ACTIVE',
  '[VOX]   VOICE RECOGNITION ENGINE: READY',
  '[SEC]   DEEP THREAT SCAN: CLEAR',
  '[SYS]   SYSTEM INTEGRITY: 100%',
  '[NOS]   NITROGEN OXIDISER SYSTEM: ONLINE ✓',
];

function runBootSequence() {
  initAudio();
  playStartupSound();
  initBootCanvas();

  const logsEl   = document.getElementById('bootLogs');
  const progress = document.getElementById('bootProgress');
  const pct      = document.getElementById('bootPct');
  const status   = document.getElementById('bootStatus');

  logsEl.innerHTML = '';
  let step = 0;
  const total = BOOT_LOGS.length;

  const tick = setInterval(() => {
    if (step < total) {
      const line = document.createElement('div');
      line.className = 'boot-log-line';
      line.textContent = BOOT_LOGS[step];
      logsEl.appendChild(line);
      logsEl.scrollTop = logsEl.scrollHeight;

      const p = Math.round(((step + 1) / total) * 100);
      if (progress) progress.style.width = p + '%';
      if (pct)      pct.textContent = p + '%';
      if (status)   status.textContent = BOOT_LOGS[step];

      playBeep(200 + step * 55, 0.05, 'square', 0.05);
      step++;
    } else {
      clearInterval(tick);
      if (status) status.textContent = 'SYSTEM ONLINE — LAUNCHING INTERFACE';
      setTimeout(transitionToLogin, 800);
    }
  }, 260);
}

function transitionToLogin() {
  const boot  = document.getElementById('bootScreen');
  const login = document.getElementById('loginScreen');
  boot.style.transition = 'opacity 0.8s';
  boot.style.opacity = '0';
  setTimeout(() => {
    boot.style.display = 'none';
    login.classList.add('active');
    initLoginCanvas();
    startFaceScan();
  }, 800);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 5 · FACE SCAN & LOGIN
───────────────────────────────────────────────────────────────── */
const SCAN_LABELS = [
  'SCANNING IDENTITY...',
  'READING BIOMETRICS...',
  'CROSS-REFERENCING DATABASE...',
  'IDENTITY VERIFIED ✓',
];

function startFaceScan() {
  const label = document.getElementById('scanLabel');
  let i = 0;
  const iv = setInterval(() => {
    if (label) label.textContent = SCAN_LABELS[i];
    i++;
    if (i >= SCAN_LABELS.length) clearInterval(iv);
  }, 1800);
}

function attemptLogin() {
  initAudio();
  // Any input (or blank) grants access — same logic as original
  const val = document.getElementById('loginInput')?.value || '';
  if (val.length >= 0) {
    doLogin();
  } else {
    showToast('⚠ ACCESS DENIED');
    playBeep(180, 0.3, 'sawtooth', 0.15);
  }
}

function guestLogin() {
  initAudio();
  doLogin();
}

function doLogin() {
  playActivationSound();
  const login = document.getElementById('loginScreen');
  const os    = document.getElementById('mainOS');
  login.style.transition = 'opacity 0.8s';
  login.style.opacity = '0';
  setTimeout(() => {
    login.style.display = 'none';
    os.classList.add('active');
    initOS();
  }, 800);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 6 · OS INITIALIZATION
───────────────────────────────────────────────────────────────── */
function initOS() {
  state.loggedIn = true;
  initBgCanvas();
  startClock();
  startMetrics();
  startAIChart();
  initTerminal();
  initRadar();
  startAmbient();
  startJarvisSimulation();  // JARVIS live data loop

  setTimeout(() => {
    showToast('🟢 N.O.S ONLINE · WELCOME BACK, OPERATOR');
    speakText('Good day. N.O.S systems are fully operational. How may I assist you?');
  }, 700);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 7 · CLOCK
───────────────────────────────────────────────────────────────── */
function startClock() {
  const update = () => {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    const ss  = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hh}:${mm}:${ss}`;
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).toUpperCase();

    const els = {
      topbarTime:   timeStr,
      topbarDate:   dateStr.slice(0, 12),
      clockDisplay: timeStr,
      clockDate:    dateStr,
    };
    for (const [id, val] of Object.entries(els)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }
  };
  update();
  setInterval(update, 1000);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 8 · SYSTEM METRICS (simulated live)
───────────────────────────────────────────────────────────────── */
function startMetrics() {
  const cfg = [
    { fill: 'cpuFill', val: 'cpuVal', base: 28, range: 42 },
    { fill: 'ramFill', val: 'ramVal', base: 54, range: 22 },
    { fill: 'netFill', val: 'netVal', base: 32, range: 48 },
    { fill: 'gpuFill', val: 'gpuVal', base: 18, range: 36 },
  ];
  setInterval(() => {
    cfg.forEach(m => {
      const pct = Math.min(99, Math.max(5,
        m.base + Math.sin(Date.now() / 2100) * m.range * 0.5 + Math.random() * m.range * 0.5
      ));
      const fe = document.getElementById(m.fill);
      const ve = document.getElementById(m.val);
      if (fe) fe.style.width = pct + '%';
      if (ve) ve.textContent = Math.round(pct) + '%';
    });
  }, 850);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 9 · AI ACTIVITY CHART
───────────────────────────────────────────────────────────────── */
let aiChartData = Array(40).fill(0).map(() => Math.random() * 60 + 10);

function startAIChart() {
  const canvas = document.getElementById('aiActivityChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  setInterval(() => {
    aiChartData.shift();
    aiChartData.push(
      Math.random() * 70 + 10 +
      (state.voiceActive ? 30 : 0) +
      (state.aiSpeaking  ? 20 : 0)
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    const step = canvas.width / (aiChartData.length - 1);
    aiChartData.forEach((v, i) => {
      const x = i * step;
      const y = canvas.height - (v / 100) * canvas.height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur  = 6;
    ctx.stroke();

    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,200,255,0.08)';
    ctx.shadowBlur = 0;
    ctx.fill();
  }, 200);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 10 · RADAR
───────────────────────────────────────────────────────────────── */
function initRadar() {
  if (state.radarRunning) return;
  state.radarRunning = true;

  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, r = W / 2 - 10;

  // Seed blips
  state.radarBlips = [];
  for (let i = 0; i < 7; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.random() * r * 0.85;
    state.radarBlips.push({
      angle, dist, life: Math.random() * 0.5 + 0.5,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
    });
  }

  let packets = 0;

  const draw = () => {
    ctx.clearRect(0, 0, W, H);

    // Rings
    ctx.strokeStyle = 'rgba(0,200,255,0.14)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(f => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * f, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();

    // Sweep fill
    state.radarAngle = (state.radarAngle + 0.024) % (Math.PI * 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(state.radarAngle);
    const sweep = ctx.createLinearGradient(0, 0, r, 0);
    sweep.addColorStop(0, 'rgba(0,200,255,0.38)');
    sweep.addColorStop(1, 'rgba(0,200,255,0)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -0.32, 0.02);
    ctx.fillStyle = sweep;
    ctx.fill();
    ctx.restore();

    // Sweep line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(state.radarAngle) * r,
      cy + Math.sin(state.radarAngle) * r
    );
    ctx.strokeStyle = 'rgba(0,200,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur  = 5;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // Blips
    state.radarBlips.forEach(b => {
      b.life -= 0.0035;
      if (b.life <= 0) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * r * 0.85;
        b.angle = a; b.dist = d; b.life = 1;
        b.x = cx + Math.cos(a) * d;
        b.y = cy + Math.sin(a) * d;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fillStyle  = `rgba(57,255,110,${b.life})`;
      ctx.shadowColor = '#39ff6e';
      ctx.shadowBlur  = 8;
      ctx.fill();
      ctx.shadowBlur  = 0;
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,200,255,0.42)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    packets += Math.floor(Math.random() * 50);
    const pacEl = document.getElementById('radarPackets');
    const latEl = document.getElementById('radarLatency');
    if (pacEl) pacEl.textContent = packets.toLocaleString();
    if (latEl) latEl.textContent = (Math.random() * 8 + 2).toFixed(1) + 'ms';
  };

  setInterval(draw, 30);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 11 · VIEW SWITCHING
───────────────────────────────────────────────────────────────── */
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));

  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');

  const order = ['dashboard', 'terminal', 'launcher', 'ai', 'radar'];
  const idx   = order.indexOf(name);
  const items = document.querySelectorAll('.sidebar-item');
  if (idx >= 0 && items[idx]) items[idx].classList.add('active');

  state.currentView = name;
  playBeep(440, 0.05, 'sine', 0.07);
  if (name === 'radar') initRadar();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 12 · PANELS
───────────────────────────────────────────────────────────────── */
function showPanel(id) {
  ['aiAssistPanel', 'notifPanel', 'settingsPanel'].forEach(p => {
    const el = document.getElementById(p);
    if (el && p !== id) el.style.display = 'none';
  });
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.style.display =
    (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
}

function hidePanel(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 13 · TERMINAL SYSTEM
───────────────────────────────────────────────────────────────── */
const TERM_HISTORY = [];
let termHistIdx = -1;

function initTerminal() {
  const input = document.getElementById('termInput');
  if (!input) return;

  termPrint('system', 'N.O.S CYBER TERMINAL v3.0 — INITIALIZED');
  termPrint('info',   'Type "help" for available commands.');
  termPrint('info',   'Unknown commands are auto-searched on Google.');
  termPrint('info',   '─'.repeat(46));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const raw = input.value.trim();
      if (!raw) return;
      TERM_HISTORY.unshift(raw);
      termHistIdx = -1;
      termPrint('cmd', 'nos@system:~$ ' + raw);
      processTermCmd(raw.toLowerCase(), raw);
      input.value = '';
      playBeep(600, 0.04, 'sine', 0.06);
    } else if (e.key === 'ArrowUp') {
      termHistIdx = Math.min(termHistIdx + 1, TERM_HISTORY.length - 1);
      input.value = TERM_HISTORY[termHistIdx] || '';
    } else if (e.key === 'ArrowDown') {
      termHistIdx = Math.max(termHistIdx - 1, -1);
      input.value = termHistIdx >= 0 ? TERM_HISTORY[termHistIdx] : '';
    }
  });
}

function termPrint(type, text) {
  const out = document.getElementById('termOutput');
  if (!out) return;
  const line = document.createElement('div');
  line.className = `term-line term-${type}`;
  line.textContent = text;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

function terminalClear() {
  const out = document.getElementById('termOutput');
  if (out) out.innerHTML = '';
  termPrint('system', 'Terminal cleared. Ready.');
}

/* ── Terminal command router ── */
function processTermCmd(c, raw) {

  // ── help ────────────────────────────────────
  if (c === 'help') {
    termPrint('out', '');
    termPrint('success', '  ╔══ N.O.S COMMAND REFERENCE ═══════════════════╗');
    const cmds = [
      ['help',               'Show this help menu'],
      ['status',             'Full system status report'],
      ['clear',              'Clear terminal output'],
      ['diagnostics',        'Run system diagnostics'],
      ['scan system',        'Deep threat scan'],
      ['vitals',             'Display operator vitals'],
      ['suit status',        'Armor power & integrity'],
      ['flight data',        'Current flight telemetry'],
      ['toxicity',           'Blood toxicity report'],
      ['track [target]',     'Track a target location'],
      ['energy scan',        'Scan for energy sources'],
      ['iron legion',        'Iron Legion status'],
      ['analyze [object]',   'Structural analysis'],
      ['reconstruct scene',  'Holographic scene reconstruction'],
      ['launch ai',          'Switch to AI Core view'],
      ['open [app]',         'Launch an app (spotify/youtube/etc)'],
      ['search [query]',     'Google search a query'],
      ['whoami',             'Operator identity'],
      ['date',               'Current timestamp'],
      ['sysinfo',            'Hardware information'],
      ['matrix',             'Matrix visual effect'],
      ['shutdown',           'Shutdown the OS'],
    ];
    cmds.forEach(([k, v]) => termPrint('out', `  │  ${k.padEnd(22)} ${v}`));
    termPrint('success', '  ╚════════════════════════════════════════════╝');
    termPrint('info', '  TIP: Unknown inputs are auto-routed to Google.');
    termPrint('out', '');
    return;
  }

  // ── status ──────────────────────────────────
  if (c === 'status') {
    termPrint('out', '');
    termPrint('success', '  N.O.S FULL SYSTEM STATUS');
    termPrint('success', '  ─────────────────────────────────────────');
    const rows = [
      ['CORE SYSTEM',    'ONLINE'],
      ['AI MODULE',      'JARVIS v3.0 — ACTIVE'],
      ['UPTIME',         `${rnd(98)+1}h ${rnd(58)+1}m`],
      ['CPU LOAD',       `${rnd(50)+18}%`],
      ['MEMORY',         `${rnd(30)+50}% utilized`],
      ['NETWORK',        'UPLINK STABLE'],
      ['THREATS',        state.threatLevel === 'NONE' ? 'NONE DETECTED' : `⚠ ${state.threatLevel}`],
      ['SUIT STATUS',    state.suitOnline ? `${state.armorMk} — ONLINE` : 'OFFLINE'],
      ['SUIT POWER',     state.suitPower + '%'],
      ['BLOOD TOXICITY', state.bloodToxicity.toFixed(1) + '% — ' + (state.bloodToxicity < 5 ? 'SAFE' : '⚠ ELEVATED')],
      ['IRON LEGION',    `${state.ironLegionCount} UNITS ACTIVE`],
    ];
    rows.forEach(([k, v]) => termPrint('out', `  ${k.padEnd(18)}: ${v}`));
    termPrint('out', '');
    return;
  }

  // ── clear ────────────────────────────────────
  if (c === 'clear') { terminalClear(); return; }

  // ── diagnostics ──────────────────────────────
  if (c === 'diagnostics') { runDiagnostics(); return; }

  // ── scan system ──────────────────────────────
  if (c === 'scan system') { runScan(); return; }

  // ── vitals ───────────────────────────────────
  if (c === 'vitals') {
    termPrint('out', '');
    termPrint('success', '  OPERATOR VITAL SIGNS MONITOR');
    termPrint('success', '  ─────────────────────────────');
    termPrint('out', `  HEART RATE   : ${state.vitals.heartRate} BPM`);
    termPrint('out', `  BLOOD O₂     : ${state.vitals.bloodO2}%`);
    termPrint('out', `  BODY TEMP    : ${state.vitals.temp}°C`);
    termPrint('out', `  TOXICITY     : ${state.bloodToxicity.toFixed(2)}%  ${state.bloodToxicity < 5 ? '✓ SAFE' : '⚠ ELEVATED'}`);
    termPrint('out', '');
    return;
  }

  // ── suit status ──────────────────────────────
  if (c === 'suit status') {
    termPrint('out', '');
    termPrint('success', `  ARMOR — ${state.armorMk}`);
    termPrint('success', '  ─────────────────────────────');
    termPrint('out', `  STATUS       : ${state.suitOnline ? '✓ ONLINE' : '○ STANDBY'}`);
    termPrint('out', `  POWER LEVEL  : ${state.suitPower}%`);
    termPrint('out', `  INTEGRITY    : ${rnd(10)+90}%`);
    termPrint('out', `  ICING RISK   : ${state.icing ? '⚠ HIGH — ALTITUDE LIMIT ACTIVE' : 'NONE'}`);
    termPrint('out', `  COMPLETION   : ${state.armorCompletion}%`);
    termPrint('out', '');
    return;
  }

  // ── flight data ──────────────────────────────
  if (c === 'flight data') {
    termPrint('out', '');
    termPrint('success', '  FLIGHT TELEMETRY — REAL-TIME');
    termPrint('success', '  ─────────────────────────────');
    termPrint('out', `  ALTITUDE     : ${state.flightAlt.toLocaleString()} m`);
    termPrint('out', `  SPEED        : ${state.flightSpeed} km/h`);
    termPrint('out', `  ICING LEVEL  : ${state.icing ? '⚠ CRITICAL — REDUCE ALTITUDE' : 'CLEAR'}`);
    termPrint('out', `  AIR DENSITY  : ${(1.225 - state.flightAlt * 0.00011).toFixed(3)} kg/m³`);
    termPrint('out', `  MAX CEILING  : 15,240 m`);
    termPrint('out', '');
    return;
  }

  // ── toxicity ─────────────────────────────────
  if (c === 'toxicity') {
    const level = state.bloodToxicity;
    const status = level < 2 ? 'NOMINAL' : level < 5 ? 'ELEVATED — MONITOR' : 'CRITICAL — TREATMENT REQUIRED';
    termPrint('out', '');
    termPrint(level < 5 ? 'success' : 'err', `  BLOOD TOXICITY: ${level.toFixed(2)}% — ${status}`);
    termPrint('out', '');
    return;
  }

  // ── track [target] ───────────────────────────
  if (c.startsWith('track ')) {
    const target = raw.slice(6).trim() || 'Unknown Target';
    state.trackedTarget = target;
    termPrint('out', '');
    termPrint('success', `  TRACKING: ${target.toUpperCase()}`);
    termPrint('out', '  Accessing satellite network...');
    setTimeout(() => {
      const lat = (Math.random() * 180 - 90).toFixed(4);
      const lon = (Math.random() * 360 - 180).toFixed(4);
      termPrint('out', `  LOCATION ACQUIRED: ${lat}°N, ${lon}°E`);
      termPrint('out', `  SIGNAL STRENGTH  : ${rnd(40)+60}%`);
      termPrint('success', '  TARGET LOCKED.');
    }, 1200);
    return;
  }

  // ── energy scan ──────────────────────────────
  if (c === 'energy scan') {
    termPrint('out', '');
    termPrint('success', '  ENERGY SOURCE DETECTION — SATELLITE UPLINK');
    termPrint('out', '  Scanning via satellite array...');
    setTimeout(() => {
      const sources = [
        { type: 'ARC REACTOR',    level: `${rnd(30)+70}%`, dist: `${rnd(50)+2}m` },
        { type: 'POWER GRID NODE', level: `${rnd(40)+50}%`, dist: `${rnd(200)+100}m` },
        { type: 'THERMAL ANOMALY', level: `${rnd(20)+10}%`, dist: `${rnd(500)+300}m` },
      ];
      sources.forEach(s => termPrint('out', `  ⚡ ${s.type.padEnd(20)} POWER: ${s.level.padEnd(6)} DIST: ${s.dist}`));
      termPrint('success', '  SCAN COMPLETE.');
      termPrint('out', '');
    }, 1400);
    return;
  }

  // ── iron legion ──────────────────────────────
  if (c === 'iron legion') {
    termPrint('out', '');
    termPrint('success', `  IRON LEGION STATUS — ${state.ironLegionCount} UNITS`);
    termPrint('success', '  ───────────────────────────────────────');
    for (let i = 1; i <= state.ironLegionCount; i++) {
      const power = rnd(30) + 65;
      const status = power > 70 ? 'OPERATIONAL' : 'LOW POWER';
      termPrint('out', `  UNIT-${String(i).padStart(2,'0')}  POWER: ${Math.round(power)}%  STATUS: ${status}`);
    }
    termPrint('out', '');
    return;
  }

  // ── analyze [object] ─────────────────────────
  if (c.startsWith('analyze ')) {
    const obj = raw.slice(8).trim() || 'Unknown Object';
    termPrint('out', '');
    termPrint('success', `  STRUCTURAL ANALYSIS — ${obj.toUpperCase()}`);
    termPrint('out', '  Scanning composition...');
    setTimeout(() => {
      termPrint('out', `  MATERIAL     : ${['VIBRANIUM ALLOY','TITANIUM','CARBON COMPOSITE','UNKNOWN ALLOY'][rnd(4)|0]}`);
      termPrint('out', `  DENSITY      : ${(Math.random()*5+2).toFixed(2)} g/cm³`);
      termPrint('out', `  ENERGY FIELD : ${rnd(2)>1 ? 'DETECTED — EXOTIC ORIGIN' : 'NONE'}`);
      termPrint('out', `  INTEGRITY    : ${rnd(30)+70}%`);
      termPrint('success', '  ANALYSIS COMPLETE.');
      termPrint('out', '');
    }, 1600);
    return;
  }

  // ── reconstruct scene ────────────────────────
  if (c === 'reconstruct scene') {
    termPrint('out', '');
    termPrint('success', '  HOLOGRAPHIC SCENE RECONSTRUCTION');
    termPrint('out', '  Accessing environmental data...');
    const steps = [
      '  [■■□□□□□□□□] Parsing thermal imagery...',
      '  [■■■■■□□□□□] Reconstructing spatial data...',
      '  [■■■■■■■□□□] Mapping debris field...',
      '  [■■■■■■■■■■] RECONSTRUCTION COMPLETE',
    ];
    steps.forEach((s, i) => setTimeout(() => {
      termPrint(i === steps.length - 1 ? 'success' : 'out', s);
      if (i === steps.length - 1) {
        termPrint('out', '  SCENE: 3 CASUALTIES · 12 STRUCTURAL ANOMALIES · 1 ENERGY SOURCE');
        termPrint('out', '');
      }
    }, i * 500));
    return;
  }

  // ── launch ai ────────────────────────────────
  if (c === 'launch ai') {
    switchView('ai');
    termPrint('success', '  → AI Core activated.');
    return;
  }

  // ── open [app] ───────────────────────────────
  if (c.startsWith('open ')) {
    const site = c.replace('open ', '').trim();
    if (SITES[site]) {
      openSite(site);
      termPrint('success', `  → Launching ${site.toUpperCase()}...`);
    } else {
      termPrint('err', `  ✗ Unknown app: "${site}". Available: ${Object.keys(SITES).join(', ')}`);
    }
    return;
  }

  // ── search [query] — explicit ─────────────────
  if (c.startsWith('search ')) {
    const query = raw.slice(7).trim();
    googleSearch(query);
    termPrint('success', `  → Searching Google for: "${query}"`);
    return;
  }

  // ── whoami ───────────────────────────────────
  if (c === 'whoami') {
    termPrint('out', '  OPERATOR : N.O.S CLASSIFIED USER [GUEST]');
    termPrint('out', '  CLEARANCE: LEVEL 3 — RESTRICTED');
    return;
  }

  // ── date ─────────────────────────────────────
  if (c === 'date') {
    termPrint('out', '  ' + new Date().toString());
    return;
  }

  // ── sysinfo ──────────────────────────────────
  if (c === 'sysinfo') {
    termPrint('out', '');
    termPrint('success', '  HARDWARE INFORMATION');
    termPrint('out', '  CPU   : QUANTUM CORE X128 — 4.8 THz');
    termPrint('out', '  RAM   : 4096 TB HOLOGRAPHIC MEMORY');
    termPrint('out', '  GPU   : NEURAL RENDERER X1 — 2.4 PFLOPS');
    termPrint('out', '  NET   : 10 TBPS ENCRYPTED UPLINK');
    termPrint('out', '  STORE : 1 YB QUANTUM DRIVE');
    termPrint('out', '');
    return;
  }

  // ── matrix ───────────────────────────────────
  if (c === 'matrix') { runMatrix(); return; }

  // ── shutdown ─────────────────────────────────
  if (c === 'shutdown') { shutdownOS(); return; }

  // ── SMART FALLBACK: Google Search ────────────
  termPrint('info', `  ℹ Unknown command — routing to Google Search...`);
  googleSearch(raw);
  termPrint('success', `  → Searching: "${raw}"`);
}

function runDiagnostics() {
  const steps = [
    '  [■□□□□□□□□□] Checking CPU registers...',
    '  [■■■□□□□□□□] Testing neural memory banks...',
    '  [■■■■■□□□□□] Verifying AI module weights...',
    '  [■■■■■■■□□□] Scanning network stack...',
    '  [■■■■■■■■■□] Analyzing suit interface...',
    '  [■■■■■■■■■■] DIAGNOSTICS COMPLETE',
    '  → All systems nominal. Zero errors detected.',
  ];
  steps.forEach((s, i) => {
    setTimeout(() => {
      const t = document.getElementById('termOutput');
      if (t && i > 0) {
        const last = t.querySelector('.diag-line');
        if (last) last.remove();
      }
      const line = document.createElement('div');
      line.className = 'term-line term-out diag-line';
      line.textContent = s;
      const out = document.getElementById('termOutput');
      if (out) { out.appendChild(line); out.scrollTop = out.scrollHeight; }
      if (i === steps.length - 1) termPrint('success', '  STATUS: ✓ FULLY OPERATIONAL');
    }, i * 380);
  });
}

function runScan() {
  const steps = [
    '  INITIATING DEEP THREAT SCAN...',
    '  Scanning network packets...',
    '  Analyzing process signatures...',
    '  Checking firewall integrity...',
    '  Deep scanning memory regions...',
    '  Auditing encryption certificates...',
    '  ──────────────────────────────────────',
    '  SCAN COMPLETE — 0 THREATS DETECTED',
    '  SYSTEM STATUS: ✓ SECURE',
  ];
  steps.forEach((s, i) => setTimeout(() => {
    termPrint(i >= steps.length - 2 ? 'success' : 'out', s);
    playBeep(280 + i * 45, 0.04, 'sine', 0.05);
  }, i * 330));
}

function runMatrix() {
  const chars = '01アイウエオカキクケコNOSニトロゲン量子01010101JARVIS';
  let count = 0;
  const id = setInterval(() => {
    const row = Array.from({ length: 42 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    termPrint('out', '  ' + row);
    count++;
    if (count > 14) clearInterval(id);
  }, 90);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 14 · SITE LAUNCHER + GOOGLE FALLBACK
───────────────────────────────────────────────────────────────── */
function openSite(key) {
  const url = SITES[key];
  if (!url) { showToast('⚠ Unknown target'); return; }
  window.open(url, '_blank', 'noopener,noreferrer');
  showToast(`🚀 LAUNCHING ${key.toUpperCase()}`);
  playActivationSound();
}

/* Google search — used as universal fallback */
function googleSearch(query) {
  if (!query || !query.trim()) return;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  showToast(`🔍 SEARCHING: ${query.slice(0, 40)}`);
  playBeep(500, 0.08, 'sine', 0.08);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 15 · AI ASSISTANT — JARVIS RESPONSES
───────────────────────────────────────────────────────────────── */

/* Static keyword → response map */
const AI_RESPONSES = {
  // Greetings
  'hello':              'Good day, sir. All N.O.S systems are fully operational. How may I assist?',
  'hi':                 'Hello. N.O.S AI Core is online and ready for your commands.',
  'hey':                'Yes, sir? Standing by for your orders.',
  'good morning':       'Good morning. Current systems: nominal. No threats detected overnight.',
  'good evening':       'Good evening, sir. All systems remain secure.',

  // Identity
  'who are you':        'I am N.O.S — the Nitrogen Oxidiser System AI Core, modelled after J.A.R.V.I.S. — Just A Rather Very Intelligent System. At your service.',
  'what are you':       'I am an artificial intelligence designed to manage your systems, monitor your health, control your armor, and assist with all operations.',
  'what can you do':    'I can manage the OS, launch applications, monitor your vitals, track the suit power, run diagnostics, track targets via satellite, control the Iron Legion, scan for energy sources, perform structural analysis, and execute voice commands.',
  'jarvis':             'That\'s my inspiration, sir. N.O.S operates on the same principles — at your complete service.',

  // System status
  'status':             () => `All systems nominal. Suit power at ${state.suitPower}%. Blood toxicity at ${state.bloodToxicity.toFixed(1)}%. No threats detected.`,
  'system status':      () => `SYSTEM: ONLINE · AI: ACTIVE · SUIT: ${state.suitOnline?'ONLINE':'STANDBY'} · THREATS: ${state.threatLevel}`,
  'diagnostics':        'Running full system diagnostics. All cores responding. Neural network integrity: 100%. No anomalies found.',
  'scan system':        'Threat scan initiated... Complete. Zero intrusions detected. All firewalls intact. System secure.',
  'scan':               'Scanning all network nodes... No unauthorized access detected. Encryption layers intact.',

  // Suit & flight
  'suit status':        () => `${state.armorMk} — Power: ${state.suitPower}%. Structural integrity: ${rnd(10)+90}%. ${state.icing?'⚠ Icing conditions active — flight ceiling reduced.':'All flight systems nominal.'}`,
  'suit power':         () => `Current power level: ${state.suitPower}%. ${state.suitPower < 20 ? 'Warning: critical power levels. Recommend immediate recharge.' : 'Power nominal.'}`,
  'power':              () => `Arc reactor output stable at ${rnd(20)+80}%. Suit draw: ${state.suitPower}%.`,
  'icing':              () => state.icing ? 'Icing conditions detected at current altitude. Recommend descending to below 8,000 metres immediately.' : 'No icing conditions detected at current altitude. Flight envelope is clear.',
  'flight':             () => `Current altitude: ${state.flightAlt.toLocaleString()} m. Speed: ${state.flightSpeed} km/h. Conditions: ${state.icing?'⚠ ICING RISK':'CLEAR'}.`,
  'altitude':           () => `Flight altitude: ${state.flightAlt.toLocaleString()} metres. Maximum safe ceiling: 15,240 m.`,
  'armor':              () => `${state.armorMk} — Status: ${state.suitOnline?'Online':'Standby'}. Power: ${state.suitPower}%. Completion: ${state.armorCompletion}%.`,
  'mark ii':            'Mark II flight systems were used to test the repulsor-powered exoskeleton. Icing levels were recorded at altitude — data logged.',
  'manufacture':        () => `Armor manufacturing progress: ${state.armorCompletion}%. Estimated completion: ${state.armorCompletion < 100 ? Math.round((100-state.armorCompletion)*0.3) + ' hours' : 'Complete'}.`,

  // Vitals & toxicity
  'vitals':             () => `Heart rate: ${state.vitals.heartRate} BPM. Blood oxygen: ${state.vitals.bloodO2}%. Body temperature: ${state.vitals.temp}°C. Toxicity: ${state.bloodToxicity.toFixed(2)}%.`,
  'blood toxicity':     () => `Blood toxicity reading: ${state.bloodToxicity.toFixed(2)}%. ${state.bloodToxicity < 2 ? 'Well within safe parameters.' : state.bloodToxicity < 5 ? 'Mildly elevated — monitor closely.' : '⚠ Critical level — immediate treatment recommended.'}`,
  'health':             () => `Vitals are ${state.vitals.heartRate < 100 ? 'normal' : 'slightly elevated'}. Blood O₂: ${state.vitals.bloodO2}%. Temperature: ${state.vitals.temp}°C.`,
  'heart rate':         () => `Current heart rate: ${state.vitals.heartRate} BPM. ${state.vitals.heartRate > 100 ? 'Slightly elevated — possibly stress-related.' : 'Normal range.'}`,

  // Intelligence gathering
  'track':              'Specify target for tracking. Accessing satellite network...',
  'locate':             'Accessing satellite array. Please specify target coordinates or name.',
  'satellite':          'Satellite uplink active. Thermogenic data accessible. Coverage: global.',
  'energy scan':        'Scanning for energy sources via satellite array. Checking for arc reactor signatures and exotic readings...',
  'energy source':      'Energy source detection active. Arc reactor signatures identifiable within a 500km radius via satellite.',
  'iron legion':        () => `Iron Legion status: ${state.ironLegionCount} units operational. All responding to command signals. Ready for deployment.`,
  'legion':             () => `Iron Legion: ${state.ironLegionCount} units standing by. Last deployment: Battle on the Norco.`,
  'scepter':            'Loki\'s scepter analysis complete. Exotic material detected — possible Mind Stone origin. Cognitive manipulation field confirmed.',
  'mind stone':         'The Mind Stone\'s code has been partially decrypted. Neural pattern architecture suggests an emergent AI consciousness is possible.',
  'analyze':            'Initiating structural and compositional analysis. Please specify the target object.',
  'scene':              'Holographic scene reconstruction initiated. Accessing available environmental and thermal data...',
  'hologram':           'Holographic rendering system active. Ready to reconstruct any logged scene on your command.',

  // Actions
  'launch dashboard':   'Switching to main dashboard view.',
  'launch terminal':    'Opening cyber terminal interface.',
  'launch radar':       'Activating network radar sweep.',
  'launch launcher':    'Opening mission control launcher.',
  'open spotify':       'Deploying Spotify music interface...',
  'open youtube':       'Launching YouTube video stream...',
  'open github':        'Accessing GitHub code repository...',
  'open gmail':         'Opening Gmail communications hub...',
  'open chatgpt':       'Routing to ChatGPT AI interface...',
  'open netflix':       'Initializing Netflix entertainment stream...',
  'open discord':       'Connecting to Discord communications network...',
  'play music':         'Activating audio matrix. Enjoy, sir.',
  'mute':               'Toggling audio mute.',
  'shutdown':           'Initiating shutdown sequence. Saving all state data. Goodbye, sir.',
  'self destruct':      'I\'m afraid I can\'t initiate self-destruct without a confirmed authorization code, sir.',

  // Misc
  'help':               'Available commands: status, vitals, suit status, flight data, blood toxicity, track [target], energy scan, iron legion, analyze [object], open [app], search [query], shutdown. Or ask me anything.',
  'time':               () => `Current system time: ${new Date().toLocaleTimeString()}`,
  'date':               () => `System date: ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`,
  'weather':            'Environmental scan: temperature 28°C, humidity 65%, wind 12 km/h. No atmospheric hazards detected in local area.',
  'ultron':             'Ultron protocol detected in historical logs. The rogue AI was neutralized. Recommend maintaining all firewalls at maximum.',
  'vision':             'Synthetic android — designation Vision. J.A.R.V.I.S. base code confirmed as foundation. Status: allied.',
  'stark expo':         'Stark Expo systems interface available. Arc reactor demonstration modules are ready for presentation.',
  'thank you':          'Always a pleasure, sir.',
  'thanks':             'Of course. That\'s what I\'m here for.',
  'good job':           'Thank you, sir. I do try.',
};

/* Resolve a response value (may be a function) */
function resolveResponse(val) {
  return typeof val === 'function' ? val() : val;
}

function getAIResponse(input) {
  const lower = input.toLowerCase().trim();

  // Longest-match first — iterate all keys and pick the best match
  let bestKey = null, bestLen = 0;
  for (const key of Object.keys(AI_RESPONSES)) {
    if (lower.includes(key) && key.length > bestLen) {
      bestKey = key;
      bestLen = key.length;
    }
  }
  if (bestKey) return resolveResponse(AI_RESPONSES[bestKey]);

  // Fallback pool — Jarvis-style
  const fallbacks = [
    `Processing: "${input.slice(0,40)}". Shall I run a Google search for more information?`,
    'Neural analysis complete. I\'d recommend a web search for that. Shall I proceed?',
    'Command acknowledged. I\'m routing that to Google search for the most current data.',
    'Interesting query, sir. My internal knowledge base suggests a web search would give the best result.',
    'I don\'t have a local answer for that. Accessing web intelligence now...',
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/* Detect if the response is a fallback (triggers Google search) */
function isFallbackResponse(resp) {
  return resp.includes('Google search') || resp.includes('web search') || resp.includes('web intelligence');
}

function sendAICommand(inputOverride) {
  const input = document.getElementById('aiInput');
  const text  = inputOverride || (input ? input.value.trim() : '');
  if (!text) return;
  if (input) input.value = '';

  appendAIMessage('user', text);
  playBeep(440, 0.05, 'sine', 0.08);

  const lower = text.toLowerCase();

  // ── App / site opens ──────────────────────
  if (lower.includes('open ') || lower.includes('launch ')) {
    for (const site of Object.keys(SITES)) {
      if (lower.includes(site)) {
        setTimeout(() => {
          const resp = getAIResponse(text);
          appendAIMessage('system', resp);
          speakText(resp);
          openSite(site);
        }, 450);
        return;
      }
    }
  }

  // ── View navigation ───────────────────────
  if (lower.includes('launch dashboard') || lower.includes('open dashboard')) setTimeout(() => switchView('dashboard'), 600);
  if (lower.includes('launch terminal')  || lower.includes('open terminal'))  setTimeout(() => switchView('terminal'), 600);
  if (lower.includes('launch radar')     || lower.includes('open radar'))     setTimeout(() => switchView('radar'), 600);
  if (lower.includes('launch launcher'))                                       setTimeout(() => switchView('launcher'), 600);

  // ── Explicit web search ────────────────────
  if (lower.startsWith('search ')) {
    const query = text.slice(7).trim();
    googleSearch(query);
    setTimeout(() => appendAIMessage('system', `Searching Google for: "${query}"`), 300);
    return;
  }

  // ── Shutdown ──────────────────────────────
  if (lower.includes('shutdown')) setTimeout(() => shutdownOS(), 1600);

  // ── Typing indicator → delayed response ───
  const typingEl = appendAIMessage('system', '...');
  setTimeout(() => {
    const resp = getAIResponse(text);
    if (typingEl) typingEl.textContent = resp;
    speakText(resp);
    playBeep(660, 0.06, 'sine', 0.06);

    // Auto Google search on fallback responses
    if (isFallbackResponse(resp)) {
      setTimeout(() => googleSearch(text), 500);
    }
  }, 600 + Math.random() * 400);
}

function appendAIMessage(role, text) {
  const chat = document.getElementById('aiChat');
  if (!chat) return null;

  const msg    = document.createElement('div');
  msg.className = `ai-msg ai-msg-${role === 'user' ? 'user' : 'system'}`;

  const avatar = document.createElement('div');
  avatar.className = 'ai-msg-avatar';
  avatar.innerHTML = role === 'user'
    ? '<i class="fas fa-user"></i>'
    : '<i class="fas fa-brain"></i>';

  const textEl = document.createElement('div');
  textEl.className = 'ai-msg-text';
  textEl.textContent = text;

  msg.appendChild(avatar);
  msg.appendChild(textEl);
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
  return textEl;
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 16 · VOICE RECOGNITION
───────────────────────────────────────────────────────────────── */
let recognition     = null;
let voiceRestartTimer = null;

function initVoiceRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast('⚠ Voice not supported in this browser');
    return null;
  }
  const r = new SR();
  r.continuous      = true;
  r.interimResults  = false;
  r.lang            = 'en-US';
  r.maxAlternatives = 1;

  r.onresult = e => {
    const transcript = e.results[e.results.length - 1][0].transcript.trim();
    handleVoiceInput(transcript);
  };
  r.onerror = e => {
    if (e.error === 'no-speech') return;
    console.warn('Voice error:', e.error);
  };
  r.onend = () => {
    if (state.voiceActive) {
      voiceRestartTimer = setTimeout(() => {
        try { r.start(); } catch (ex) {}
      }, 300);
    }
  };
  return r;
}

function handleVoiceInput(text) {
  const lower = text.toLowerCase();
  showToast(`🎙 "${text.slice(0, 55)}"`);

  // Wake word
  if (lower.includes('nitrogen oxidiser') || lower.includes('nitrogen oxidizer') || lower.includes('nos activate')) {
    activateNOS();
    return;
  }

  if (!state.loggedIn) return;

  if (state.currentView === 'ai') {
    sendAICommand(text);
  } else {
    processVoiceCommand(lower, text);
  }
}

function activateNOS() {
  playActivationSound();
  speakText('Online. All systems functional. Awaiting your orders, sir.');
  showToast('🟢 N.O.S ACTIVATED');

  const orb = document.getElementById('aiOrb');
  if (orb) {
    orb.classList.add('speaking');
    setTimeout(() => orb.classList.remove('speaking'), 3000);
  }

  const panel = document.getElementById('aiAssistPanel');
  const body  = document.getElementById('aiAssistBody');
  if (panel) {
    panel.style.display = 'block';
    if (body) body.innerHTML = '<div class="float-msg">Online. All systems functional. Awaiting your orders.</div>';
  }
  appendAIMessage('system', 'Online. All systems functional. Awaiting your orders, sir.');

  if (!state.loggedIn) doLogin();
  switchView('ai');
}

function processVoiceCommand(lower, original) {
  // Site launches
  for (const site of Object.keys(SITES)) {
    if (lower.includes('open ' + site) || lower.includes('launch ' + site)) {
      openSite(site); return;
    }
  }

  // View navigation
  if (lower.includes('dashboard'))                              { switchView('dashboard'); return; }
  if (lower.includes('terminal'))                               { switchView('terminal');  return; }
  if (lower.includes('launcher') || lower.includes('launch pad')) { switchView('launcher'); return; }
  if (lower.includes('radar'))                                  { switchView('radar');     return; }
  if (lower.includes(' ai') || lower.includes('ai core') || lower.includes('assistant')) { switchView('ai'); return; }

  // System commands
  if (lower.includes('shutdown') || lower.includes('turn off'))  { shutdownOS(); return; }
  if (lower.includes('mute'))                                     { toggleMute(); return; }
  if (lower.includes('status')) {
    const msg = `All systems nominal. Suit power at ${state.suitPower}%. No threats detected.`;
    speakText(msg); showToast('📊 STATUS: NOMINAL'); return;
  }
  if (lower.includes('vitals')) {
    const msg = `Heart rate ${state.vitals.heartRate} BPM. Blood oxygen ${state.vitals.bloodO2}%. Toxicity ${state.bloodToxicity.toFixed(1)}%.`;
    speakText(msg); showToast('💓 VITALS READ'); return;
  }
  if (lower.includes('suit') || lower.includes('armor') || lower.includes('mark')) {
    const msg = `${state.armorMk} power at ${state.suitPower}%. ${state.icing ? 'Icing conditions active.' : 'Flight conditions clear.'}`;
    speakText(msg); showToast('🦾 SUIT STATUS'); return;
  }

  // Search intent detection
  const searchTriggers = ['search for', 'search', 'find', 'look up', 'google', 'what is', 'who is', 'how to'];
  for (const trigger of searchTriggers) {
    if (lower.includes(trigger)) {
      const q = original.replace(new RegExp(trigger, 'i'), '').trim();
      if (q) { googleSearch(q); return; }
    }
  }

  // Default: route to AI chat
  sendAICommand(original);
}

function toggleVoiceRecognition() {
  initAudio();

  if (!state.voiceActive) {
    if (!recognition) recognition = initVoiceRecognition();
    if (!recognition) return;
    try {
      recognition.start();
      state.voiceActive = true;
      document.getElementById('voiceIndicator')?.classList.add('active');
      document.getElementById('voiceBtn')?.classList.add('topbar-icon-active');
      document.getElementById('aiVoiceBtn')?.classList.add('active');
      const vs = document.getElementById('aiVoiceStatus');
      if (vs) vs.textContent = '🎙 VOICE RECOGNITION: ACTIVE — Say "Nitrogen Oxidiser" to wake';
      showToast('🎙 VOICE ACTIVE — Say "Nitrogen Oxidiser"');
      playBeep(660, 0.1, 'sine', 0.1);
    } catch (e) { console.warn(e); }
  } else {
    state.voiceActive = false;
    if (voiceRestartTimer) clearTimeout(voiceRestartTimer);
    try { recognition.stop(); } catch (e) {}
    document.getElementById('voiceIndicator')?.classList.remove('active');
    document.getElementById('voiceBtn')?.classList.remove('topbar-icon-active');
    document.getElementById('aiVoiceBtn')?.classList.remove('active');
    const vs = document.getElementById('aiVoiceStatus');
    if (vs) vs.textContent = '🎙 VOICE RECOGNITION: INACTIVE';
    showToast('🔇 VOICE DEACTIVATED');
  }
}

function toggleVoiceFromSettings() {
  toggleVoiceRecognition();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 17 · SPEECH SYNTHESIS
───────────────────────────────────────────────────────────────── */
function speakText(text) {
  if (state.muted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate   = 0.94;
  utt.pitch  = 0.82;
  utt.volume = 0.9;
  const voices   = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US')
    || voices.find(v => v.lang === 'en-US')
    || voices[0];
  if (preferred) utt.voice = preferred;
  const orb = document.getElementById('aiOrb');
  utt.onstart = () => { state.aiSpeaking = true;  if (orb) orb.classList.add('speaking');    };
  utt.onend   = () => { state.aiSpeaking = false; if (orb) orb.classList.remove('speaking'); };
  window.speechSynthesis.speak(utt);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 18 · MUSIC CONTROL
───────────────────────────────────────────────────────────────── */
function musicControl(action) {
  const icon = document.getElementById('musicPlayIcon');
  if (action === 'play') {
    state.musicPlaying = !state.musicPlaying;
    if (icon) icon.className = state.musicPlaying ? 'fas fa-pause' : 'fas fa-play';
    showToast(state.musicPlaying ? '▶ AUDIO MATRIX PLAYING' : '⏸ AUDIO MATRIX PAUSED');
    playBeep(state.musicPlaying ? 440 : 330, 0.1, 'sine', 0.08);
  } else if (action === 'next') {
    showToast('⏭ NEXT TRACK'); playBeep(550, 0.08, 'sine', 0.08);
  } else if (action === 'prev') {
    showToast('⏮ PREVIOUS TRACK'); playBeep(380, 0.08, 'sine', 0.08);
  }
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 19 · SETTINGS
───────────────────────────────────────────────────────────────── */
function toggleScanlines() {
  const cb = document.getElementById('settScanlines');
  const el = document.getElementById('scanlinesOverlay');
  if (el) el.style.opacity = cb?.checked ? '1' : '0';
}

function changeHue(val) {
  document.documentElement.style.setProperty('--hue', val);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 20 · JARVIS LIVE SIMULATION
   Continuously updates suit power, vitals, flight data, toxicity
───────────────────────────────────────────────────────────────── */
function startJarvisSimulation() {
  // Suit power slowly drains when online, recharges when off
  setInterval(() => {
    if (state.suitOnline) {
      state.suitPower = Math.max(1, state.suitPower - (Math.random() * 0.3));
    } else {
      state.suitPower = Math.min(100, state.suitPower + (Math.random() * 0.5));
    }

    // Vitals drift naturally
    state.vitals.heartRate = Math.round(clamp(
      state.vitals.heartRate + (Math.random() - 0.5) * 2, 58, 105
    ));
    state.vitals.bloodO2 = Math.round(clamp(
      state.vitals.bloodO2 + (Math.random() - 0.5) * 0.5, 94, 100
    ));
    state.vitals.temp = +( clamp(
      state.vitals.temp + (Math.random() - 0.5) * 0.05, 36.0, 37.5
    )).toFixed(1);

    // Blood toxicity fluctuates slightly
    state.bloodToxicity = +( clamp(
      state.bloodToxicity + (Math.random() - 0.48) * 0.08, 0.1, 12.0
    )).toFixed(2);

    // Toxicity alert
    if (state.bloodToxicity > 8 && !state._toxWarn) {
      state._toxWarn = true;
      showToast('⚠ BLOOD TOXICITY CRITICAL — TREATMENT REQUIRED');
      speakText('Warning. Blood toxicity has reached critical levels. Immediate treatment recommended.');
      playAlertSound();
    } else if (state.bloodToxicity < 6) {
      state._toxWarn = false;
    }

    // Icing check when suit is online
    if (state.suitOnline) {
      state.icing = state.flightAlt > 8000 && Math.random() > 0.4;
      if (state.icing && !state._icingWarn) {
        state._icingWarn = true;
        showToast('⚠ ICING CONDITIONS — REDUCE ALTITUDE');
        speakText('Icing levels critical. Recommend reducing altitude immediately.');
      }
    } else {
      state.icing = false;
      state._icingWarn = false;
    }

    // Update dashboard badge if it exists
    _updateJarvisWidgets();

  }, 3000);

  // Flight data animation (only active when suit is online)
  setInterval(() => {
    if (state.suitOnline) {
      state.flightAlt   = clamp(state.flightAlt + (Math.random() - 0.45) * 120, 0, 15000);
      state.flightSpeed = Math.round(clamp(state.flightSpeed + (Math.random() - 0.45) * 30, 0, 1200));
    } else {
      state.flightAlt   = 0;
      state.flightSpeed = 0;
    }
  }, 2000);
}

function _updateJarvisWidgets() {
  // Update suit power display if element exists
  const spEl = document.getElementById('suitPowerVal');
  if (spEl) spEl.textContent = Math.round(state.suitPower) + '%';
  const spFill = document.getElementById('suitPowerFill');
  if (spFill) spFill.style.width = state.suitPower + '%';

  // Update blood toxicity
  const btEl = document.getElementById('toxicityVal');
  if (btEl) btEl.textContent = state.bloodToxicity.toFixed(2) + '%';

  // Update heart rate
  const hrEl = document.getElementById('heartRateVal');
  if (hrEl) hrEl.textContent = state.vitals.heartRate + ' BPM';

  // Update topbar status
  const ts = document.getElementById('topbarStatus');
  if (ts) {
    ts.textContent = state.bloodToxicity > 8
      ? '⚠ TOXICITY ALERT'
      : state.icing
      ? '⚠ ICING WARNING'
      : 'SYSTEM NOMINAL';
  }
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 21 · SHUTDOWN
───────────────────────────────────────────────────────────────── */
function shutdownOS() {
  speakText('Initiating shutdown sequence. Goodbye, sir.');
  showToast('⚡ SHUTDOWN INITIATED');
  const os = document.getElementById('mainOS');
  setTimeout(() => {
    os.style.transition = 'opacity 2s';
    os.style.opacity = '0';
    playBeep(220, 1.5, 'sine', 0.15);
    setTimeout(() => {
      os.style.display = 'none';
      os.classList.remove('active');
      os.style.opacity = '1';
      os.style.transition = '';

      // Reset state
      state.loggedIn    = false;
      state.voiceActive = false;
      state.radarRunning = false;
      state.radarBlips  = [];
      state.suitOnline  = false;
      stopAmbient();
      if (recognition) { try { recognition.stop(); } catch(e) {} }

      // Reboot
      const boot = document.getElementById('bootScreen');
      if (boot) {
        boot.style.display = 'flex';
        boot.style.opacity = '0';
        boot.classList.add('active');
      }
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) {
        loginScreen.style.display = 'none';
        loginScreen.classList.remove('active');
        loginScreen.style.opacity = '1';
      }
      const bl = document.getElementById('bootLogs');
      if (bl) bl.innerHTML = '';
      const bp = document.getElementById('bootProgress');
      if (bp) bp.style.width = '0%';
      const bpct = document.getElementById('bootPct');
      if (bpct) bpct.textContent = '0%';

      setTimeout(() => {
        if (boot) {
          boot.style.transition = 'opacity 0.5s';
          boot.style.opacity = '1';
          setTimeout(() => {
            boot.style.transition = '';
            runBootSequence();
          }, 500);
        }
      }, 100);
    }, 2100);
  }, 800);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 22 · TOAST
───────────────────────────────────────────────────────────────── */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 23 · CANVAS: BOOT SCREEN
───────────────────────────────────────────────────────────────── */
function initBootCanvas() {
  const canvas = document.getElementById('bootCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 90 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    vx:      (Math.random() - 0.5) * 0.55,
    vy:      (Math.random() - 0.5) * 0.55,
    size:    Math.random() * 2 + 0.4,
    opacity: Math.random() * 0.55 + 0.15,
  }));

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(0,200,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width;  x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

    // Particles
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;  if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,255,${p.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  };
  draw();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 24 · CANVAS: LOGIN SCREEN (matrix rain)
───────────────────────────────────────────────────────────────── */
function initLoginCanvas() {
  const canvas = document.getElementById('loginCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const cols = Array.from({ length: Math.floor(canvas.width / 18) }, (_, i) => ({
    x: i * 18, y: Math.random() * canvas.height, speed: Math.random() * 2.2 + 0.8,
  }));

  const draw = () => {
    ctx.fillStyle = 'rgba(2,8,16,0.055)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Share Tech Mono';
    cols.forEach(c => {
      ctx.fillStyle = `rgba(0,200,255,${Math.random() * 0.38 + 0.08})`;
      ctx.fillText(Math.random() > 0.5 ? '1' : '0', c.x, c.y);
      c.y += c.speed;
      if (c.y > canvas.height) c.y = 0;
    });
    requestAnimationFrame(draw);
  };
  draw();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 25 · CANVAS: OS BACKGROUND (particles + grid)
───────────────────────────────────────────────────────────────── */
function initBgCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const particles = Array.from({ length: 65 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    vx:      (Math.random() - 0.5) * 0.3,
    vy:      (Math.random() - 0.5) * 0.3,
    size:    Math.random() * 1.5 + 0.3,
    opacity: Math.random() * 0.28 + 0.08,
  }));

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const showParticles = document.getElementById('settParticles')?.checked !== false;
    if (showParticles) {
      ctx.strokeStyle = 'rgba(0,200,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width;  x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;  if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,200,255,${p.opacity})`;
        ctx.fill();
      });
    }

    requestAnimationFrame(draw);
  };
  draw();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 26 · UTILITY HELPERS
───────────────────────────────────────────────────────────────── */
/** Random integer 0..max */
function rnd(max) { return Math.floor(Math.random() * max); }

/** Clamp value between lo and hi */
function clamp(val, lo, hi) { return Math.min(hi, Math.max(lo, val)); }

/* ─────────────────────────────────────────────────────────────────
   SECTION 27 · DOM READY — WIRE EVERYTHING UP
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* AI input — Enter to send */
  const aiInput = document.getElementById('aiInput');
  if (aiInput) {
    aiInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendAICommand();
    });
  }

  /* Launcher search — if it exists */
  const launcherInput = document.getElementById('launcherSearch');
  if (launcherInput) {
    launcherInput.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const val = launcherInput.value.trim();
      if (!val) return;
      // Check if it's an app name first
      const appKey = Object.keys(SITES).find(k =>
        k === val.toLowerCase() || val.toLowerCase().includes(k)
      );
      if (appKey) { openSite(appKey); return; }
      // Google fallback
      googleSearch(val);
    });
  }

  /* Login input — Enter to login */
  const loginInput = document.getElementById('loginInput');
  if (loginInput) {
    loginInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptLogin();
    });
  }

  /* AI orb click — toggles voice */
  const orb = document.getElementById('aiOrb');
  if (orb) {
    orb.addEventListener('click', () => {
      initAudio();
      toggleVoiceRecognition();
    });
  }

  /* Preload speech synthesis voices */
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  /* Kick off boot sequence */
  runBootSequence();
});
