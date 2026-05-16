/* ══════════════════════════════════════════════════════════════
   N.O.S — NITROGEN OXIDISER SYSTEM · SCRIPT
   ══════════════════════════════════════════════════════════════ */
'use strict';

// ─── STATE ───────────────────────────────────────────────────
const state = {
  muted: false,
  voiceActive: false,
  musicPlaying: false,
  currentView: 'dashboard',
  bootDone: false,
  loggedIn: false,
  aiSpeaking: false,
  radarAngle: 0,
  radarBlips: [],
};

// ─── SAFE SITE MAP ───────────────────────────────────────────
const SITES = {
  spotify:  'https://open.spotify.com',
  youtube:  'https://www.youtube.com',
  github:   'https://github.com',
  gmail:    'https://mail.google.com',
  chatgpt:  'https://chat.openai.com',
  netflix:  'https://www.netflix.com',
  discord:  'https://discord.com',
};

// ─── AUDIO CONTEXT (Web Audio API — safe, no files needed) ───
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
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

function playStartupSound() {
  if (state.muted || !audioCtx) return;
  const notes = [220, 330, 440, 550, 660, 880];
  notes.forEach((f, i) => setTimeout(() => playBeep(f, 0.2, 'sine', 0.12), i * 120));
  setTimeout(() => {
    playBeep(880, 0.4, 'sine', 0.18);
    setTimeout(() => playBeep(1320, 0.6, 'sine', 0.12), 200);
  }, notes.length * 120);
}

function playActivationSound() {
  if (state.muted || !audioCtx) return;
  [440, 660, 880, 1100].forEach((f, i) => setTimeout(() => playBeep(f, 0.15, 'sine', 0.1), i * 80));
}

function toggleMute() {
  state.muted = !state.muted;
  const icon = document.getElementById('muteIcon');
  if (icon) icon.className = state.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  showToast(state.muted ? '🔇 AUDIO MUTED' : '🔊 AUDIO ACTIVE');
  if (state.muted) stopAmbient(); else startAmbient();
}

function startAmbient() {
  if (!audioCtx || ambientNodes.osc) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    osc.start();
    ambientNodes = { osc, gain };
  } catch (e) {}
}

function stopAmbient() {
  try {
    if (ambientNodes.osc) { ambientNodes.osc.stop(); ambientNodes = { gain: null, osc: null }; }
  } catch (e) {}
}

function toggleAmbient() {
  const cb = document.getElementById('settAmbient');
  if (cb?.checked) startAmbient(); else stopAmbient();
}

// ─── BOOT SEQUENCE ───────────────────────────────────────────
const BOOT_LOGS = [
  '[BIOS] N.O.S FIRMWARE v2.9.1 LOADING...',
  '[CPU]  QUANTUM PROCESSOR CORES: ONLINE',
  '[MEM]  ALLOCATING NEURAL MEMORY BANKS...',
  '[NET]  INITIALIZING SECURE UPLINK...',
  '[AI]   LOADING NEURAL WEIGHTS: 47.3B PARAMS',
  '[VID]  HOLOGRAPHIC RENDERER: ACTIVE',
  '[VOX]  VOICE RECOGNITION ENGINE: READY',
  '[SEC]  THREAT SCAN: CLEAR',
  '[SYS]  SYSTEM INTEGRITY: 100%',
  '[NOS]  NITROGEN OXIDISER SYSTEM: ONLINE',
];

function runBootSequence() {
  initAudio();
  playStartupSound();
  const logsEl = document.getElementById('bootLogs');
  const progress = document.getElementById('bootProgress');
  const pct = document.getElementById('bootPct');
  const status = document.getElementById('bootStatus');
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
      progress.style.width = p + '%';
      pct.textContent = p + '%';
      status.textContent = BOOT_LOGS[step];
      playBeep(200 + step * 60, 0.05, 'square', 0.05);
      step++;
    } else {
      clearInterval(tick);
      status.textContent = 'SYSTEM ONLINE — LAUNCHING INTERFACE';
      setTimeout(() => transitionToLogin(), 800);
    }
  }, 280);

  // Boot canvas particles
  initBootCanvas();
}

function transitionToLogin() {
  const boot = document.getElementById('bootScreen');
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

// ─── FACE SCAN ANIMATION ─────────────────────────────────────
const SCAN_LABELS = ['SCANNING IDENTITY...', 'READING BIOMETRICS...', 'PROCESSING...', 'IDENTITY VERIFIED ✓'];
function startFaceScan() {
  const label = document.getElementById('scanLabel');
  let i = 0;
  const interval = setInterval(() => {
    if (label) label.textContent = SCAN_LABELS[i];
    i++;
    if (i >= SCAN_LABELS.length) clearInterval(interval);
  }, 1800);
}

// ─── LOGIN ────────────────────────────────────────────────────
function attemptLogin() {
  initAudio();
  const val = document.getElementById('loginInput')?.value || '';
  if (!val || val.toLowerCase() === 'nos' || val.toLowerCase() === 'admin' || val === '1234' || val.length > 0) {
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
  const os = document.getElementById('mainOS');
  login.style.transition = 'opacity 0.8s';
  login.style.opacity = '0';
  setTimeout(() => {
    login.style.display = 'none';
    os.classList.add('active');
    initOS();
  }, 800);
}

// ─── OS INIT ─────────────────────────────────────────────────
function initOS() {
  state.loggedIn = true;
  initBgCanvas();
  startClock();
  startMetrics();
  startAIChart();
  initTerminal();
  initRadar();
  startAmbient();
  // Show greeting after a moment
  setTimeout(() => {
    showToast('🟢 SYSTEM ONLINE · WELCOME BACK');
  }, 600);
}

// ─── CLOCK ───────────────────────────────────────────────────
function startClock() {
  const update = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hh}:${mm}:${ss}`;
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

    const topTime = document.getElementById('topbarTime');
    const topDate = document.getElementById('topbarDate');
    const clkDisp = document.getElementById('clockDisplay');
    const clkDate = document.getElementById('clockDate');

    if (topTime) topTime.textContent = timeStr;
    if (topDate) topDate.textContent = dateStr.slice(0, 12);
    if (clkDisp) clkDisp.textContent = timeStr;
    if (clkDate) clkDate.textContent = dateStr;
  };
  update();
  setInterval(update, 1000);
}

// ─── SYSTEM METRICS (SIMULATED) ─────────────────────────────
function startMetrics() {
  const animate = () => {
    const metrics = {
      cpu: { el: 'cpuFill', val: 'cpuVal', base: 25, range: 40 },
      ram: { el: 'ramFill', val: 'ramVal', base: 55, range: 20 },
      net: { el: 'netFill', val: 'netVal', base: 30, range: 50 },
      gpu: { el: 'gpuFill', val: 'gpuVal', base: 15, range: 35 },
    };
    Object.values(metrics).forEach(m => {
      const pct = Math.min(99, Math.max(5, m.base + Math.sin(Date.now() / 2000) * m.range * 0.5 + Math.random() * m.range * 0.5));
      const fillEl = document.getElementById(m.el);
      const valEl = document.getElementById(m.val);
      if (fillEl) fillEl.style.width = pct + '%';
      if (valEl) valEl.textContent = Math.round(pct) + '%';
    });
  };
  setInterval(animate, 800);
}

// ─── AI ACTIVITY CHART ───────────────────────────────────────
let aiChartData = Array(40).fill(0).map(() => Math.random() * 60 + 10);
function startAIChart() {
  const canvas = document.getElementById('aiActivityChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const draw = () => {
    aiChartData.shift();
    aiChartData.push(Math.random() * 70 + 10 + (state.voiceActive ? 30 : 0));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    const step = canvas.width / (aiChartData.length - 1);
    aiChartData.forEach((v, i) => {
      const x = i * step;
      const y = canvas.height - (v / 100) * canvas.height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 6;
    ctx.stroke();

    // Fill
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,200,255,0.08)';
    ctx.fill();
  };
  setInterval(draw, 200);
}

// ─── RADAR ───────────────────────────────────────────────────
function initRadar() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, r = W / 2 - 10;

  // Random blips
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * r * 0.85;
    state.radarBlips.push({ angle, dist, life: 1, x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist });
  }

  let packets = 0;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    // Background circles
    ctx.strokeStyle = 'rgba(0,200,255,0.15)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(f => {
      ctx.beginPath(); ctx.arc(cx, cy, r * f, 0, Math.PI * 2); ctx.stroke();
    });
    // Crosshairs
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

    // Sweep
    state.radarAngle = (state.radarAngle + 0.025) % (Math.PI * 2);
    const grad = ctx.createConicalGradient ? null : null;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(state.radarAngle);
    const sweep = ctx.createLinearGradient(0, 0, r, 0);
    sweep.addColorStop(0, 'rgba(0,200,255,0.4)');
    sweep.addColorStop(1, 'rgba(0,200,255,0)');
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -0.3, 0); ctx.fillStyle = sweep; ctx.fill();
    ctx.restore();

    // Sweep line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(state.radarAngle) * r, cy + Math.sin(state.radarAngle) * r);
    ctx.strokeStyle = 'rgba(0,200,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 4;
    ctx.stroke(); ctx.shadowBlur = 0;

    // Blips
    state.radarBlips.forEach(b => {
      b.life -= 0.004;
      if (b.life <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * r * 0.85;
        b.angle = angle; b.dist = dist; b.life = 1;
        b.x = cx + Math.cos(angle) * dist; b.y = cy + Math.sin(angle) * dist;
      }
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(57,255,110,${b.life})`;
      ctx.shadowColor = '#39ff6e'; ctx.shadowBlur = 8;
      ctx.fill(); ctx.shadowBlur = 0;
    });

    // Outer ring
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,200,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();

    packets += Math.floor(Math.random() * 50);
    const pacEl = document.getElementById('radarPackets');
    const latEl = document.getElementById('radarLatency');
    if (pacEl) pacEl.textContent = packets.toLocaleString();
    if (latEl) latEl.textContent = (Math.random() * 8 + 2).toFixed(1) + 'ms';
  };
  setInterval(draw, 30);
}

// ─── VIEW SWITCHING ──────────────────────────────────────────
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');
  const items = document.querySelectorAll('.sidebar-item');
  const idx = ['dashboard', 'terminal', 'launcher', 'ai', 'radar'].indexOf(name);
  if (idx >= 0 && items[idx]) items[idx].classList.add('active');
  state.currentView = name;
  playBeep(440, 0.05, 'sine', 0.08);
  if (name === 'radar') initRadar();
}

// ─── PANELS ──────────────────────────────────────────────────
function showPanel(id) {
  // Hide others first
  ['aiAssistPanel', 'notifPanel', 'settingsPanel'].forEach(p => {
    const el = document.getElementById(p);
    if (el && p !== id) el.style.display = 'none';
  });
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' || panel.style.display === '' ? 'block' : 'none';
}
function hidePanel(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ─── TERMINAL ────────────────────────────────────────────────
const TERM_HISTORY = [];
let termHistIdx = -1;

function initTerminal() {
  const input = document.getElementById('termInput');
  if (!input) return;
  termPrint('system', 'N.O.S CYBER TERMINAL v2.9.1 — INITIALIZED');
  termPrint('info', 'Type "help" for available commands.');
  termPrint('info', '─'.repeat(40));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      if (!cmd) return;
      TERM_HISTORY.unshift(cmd);
      termHistIdx = -1;
      termPrint('cmd', 'nos@system:~$ ' + cmd);
      processTermCmd(cmd.toLowerCase());
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
  termPrint('system', 'Terminal cleared.');
}

function processTermCmd(cmd) {
  const c = cmd.trim();
  if (c === 'help') {
    termPrint('out', '');
    termPrint('out', '  AVAILABLE COMMANDS:');
    termPrint('out', '  ─────────────────────────────────────');
    termPrint('out', '  help          — Show this help menu');
    termPrint('out', '  status        — System status report');
    termPrint('out', '  clear         — Clear terminal');
    termPrint('out', '  diagnostics   — Run system diagnostics');
    termPrint('out', '  scan system   — Threat scan');
    termPrint('out', '  launch ai     — Open AI Core view');
    termPrint('out', '  open spotify  — Launch Spotify');
    termPrint('out', '  open youtube  — Launch YouTube');
    termPrint('out', '  open github   — Launch GitHub');
    termPrint('out', '  open gmail    — Launch Gmail');
    termPrint('out', '  open chatgpt  — Launch ChatGPT');
    termPrint('out', '  open netflix  — Launch Netflix');
    termPrint('out', '  open discord  — Launch Discord');
    termPrint('out', '  whoami        — Operator identity');
    termPrint('out', '  date          — Current timestamp');
    termPrint('out', '  matrix        — Visual effect');
    termPrint('out', '  shutdown      — Shutdown interface');
    termPrint('out', '');
  } else if (c === 'status') {
    termPrint('success', '');
    termPrint('success', '  N.O.S SYSTEM STATUS REPORT');
    termPrint('success', '  ─────────────────────────────');
    termPrint('out', `  SYSTEM      : ONLINE`);
    termPrint('out', `  AI CORE     : ACTIVE`);
    termPrint('out', `  UPTIME      : ${Math.floor(Math.random()*99)+1}h ${Math.floor(Math.random()*59)+1}m`);
    termPrint('out', `  CPU LOAD    : ${Math.floor(Math.random()*50)+20}%`);
    termPrint('out', `  MEMORY      : ${Math.floor(Math.random()*30)+50}% utilized`);
    termPrint('out', `  NETWORK     : UPLINK ACTIVE`);
    termPrint('out', `  THREATS     : NONE DETECTED`);
    termPrint('success', '');
  } else if (c === 'clear') {
    terminalClear();
  } else if (c === 'diagnostics') {
    runDiagnostics();
  } else if (c === 'scan system') {
    runScan();
  } else if (c === 'launch ai') {
    switchView('ai');
    termPrint('success', '  → AI Core activated.');
  } else if (c.startsWith('open ')) {
    const site = c.replace('open ', '').trim();
    if (SITES[site]) {
      openSite(site);
      termPrint('success', `  → Launching ${site.toUpperCase()}...`);
    } else {
      termPrint('err', `  ✗ Unknown target: "${site}". Try "help" for options.`);
    }
  } else if (c === 'whoami') {
    termPrint('out', '  OPERATOR: N.O.S CLASSIFIED USER [GUEST]');
    termPrint('out', '  CLEARANCE: LEVEL 3 — RESTRICTED');
  } else if (c === 'date') {
    termPrint('out', '  ' + new Date().toString());
  } else if (c === 'matrix') {
    runMatrix();
  } else if (c === 'shutdown') {
    shutdownOS();
  } else {
    termPrint('err', `  ✗ Unknown command: "${c}". Type "help" for options.`);
  }
}

function runDiagnostics() {
  const steps = [
    '  [■□□□□□□□□□] Checking CPU registers...',
    '  [■■■□□□□□□□] Testing memory banks...',
    '  [■■■■■□□□□□] Verifying neural cores...',
    '  [■■■■■■■□□□] Scanning network stack...',
    '  [■■■■■■■■■□] Analyzing system integrity...',
    '  [■■■■■■■■■■] DIAGNOSTICS COMPLETE',
    '  → All systems nominal. No errors detected.',
  ];
  steps.forEach((s, i) => {
    setTimeout(() => {
      const t = document.getElementById('termOutput');
      if (t) {
        const last = t.querySelector('.diag-line');
        if (last && i > 0) last.remove();
      }
      const line = document.createElement('div');
      line.className = 'term-line term-out diag-line';
      line.textContent = s;
      const out = document.getElementById('termOutput');
      if (out) { out.appendChild(line); out.scrollTop = out.scrollHeight; }
      if (i === steps.length - 1) {
        termPrint('success', '  STATUS: ✓ OPERATIONAL');
      }
    }, i * 400);
  });
}

function runScan() {
  const steps = [
    '  INITIATING THREAT SCAN...',
    '  Scanning network packets...',
    '  Analyzing process signatures...',
    '  Checking firewall integrity...',
    '  Deep scanning memory...',
    '  ─────────────────────────────',
    '  SCAN COMPLETE — 0 THREATS DETECTED',
    '  SYSTEM STATUS: ✓ SECURE',
  ];
  steps.forEach((s, i) => setTimeout(() => {
    termPrint(i === steps.length - 1 ? 'success' : 'out', s);
    playBeep(300 + i * 50, 0.04, 'sine', 0.05);
  }, i * 350));
}

function runMatrix() {
  const chars = '01アイウエオカキクケコサシスセソNOSニトロゲン01010101';
  let count = 0;
  const id = setInterval(() => {
    const row = Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    termPrint('out', '  ' + row);
    count++;
    if (count > 12) clearInterval(id);
  }, 100);
}

// ─── SITE LAUNCHER ───────────────────────────────────────────
function openSite(key) {
  const url = SITES[key];
  if (!url) { showToast('⚠ Unknown target'); return; }
  window.open(url, '_blank', 'noopener,noreferrer');
  showToast(`🚀 LAUNCHING ${key.toUpperCase()}`);
  playActivationSound();
}

// ─── AI ASSISTANT ────────────────────────────────────────────
const AI_RESPONSES = {
  'hello': 'Greetings, operator. All systems functional. How may I assist you?',
  'hi': 'Salutations. N.O.S neural core is fully online.',
  'status': 'All systems nominal. CPU stable. Neural networks active. No threats detected.',
  'system status': 'SYSTEM STATUS: ONLINE · AI CORE: ACTIVE · THREATS: NONE · UPLINK: STABLE',
  'open spotify': 'Deploying Spotify music interface...',
  'open youtube': 'Launching YouTube video stream...',
  'open github': 'Accessing GitHub code repository...',
  'open gmail': 'Opening Gmail communications hub...',
  'open chatgpt': 'Routing to ChatGPT AI interface...',
  'open netflix': 'Initializing Netflix entertainment stream...',
  'open discord': 'Connecting to Discord communications...',
  'launch dashboard': 'Switching to main dashboard view.',
  'launch terminal': 'Opening cyber terminal.',
  'play music': 'Activating audio matrix...',
  'activate terminal': 'Terminal standing by. Switch to Terminal view.',
  'diagnostics': 'Running full system diagnostics. All cores responding. No anomalies found.',
  'scan system': 'Threat scan initiated... Complete. Zero threats detected. System secure.',
  'shutdown': 'Initiating shutdown sequence.',
  'shutdown interface': 'Shutting down N.O.S interface...',
  'help': 'Available commands: status, open [site], launch dashboard, play music, diagnostics, scan system, shutdown.',
  'who are you': 'I am N.O.S — the Nitrogen Oxidiser System AI Core. Your advanced cyber intelligence interface.',
  'what can you do': 'I can control the OS, launch websites, monitor systems, run diagnostics, and execute voice commands.',
  'time': `Current system time: ${new Date().toLocaleTimeString()}`,
  'date': `Current date: ${new Date().toLocaleDateString()}`,
};

function getAIResponse(input) {
  const lower = input.toLowerCase().trim();
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  const fallbacks = [
    'Processing your command. Please specify further parameters.',
    'Neural analysis complete. I require more context to proceed.',
    'Command registered. Running analysis...',
    'Acknowledged. N.O.S core is processing your request.',
    'Interesting query. My neural pathways suggest further elaboration is needed.',
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function sendAICommand(inputOverride) {
  const input = document.getElementById('aiInput');
  const text = inputOverride || (input ? input.value.trim() : '');
  if (!text) return;
  if (input) input.value = '';

  appendAIMessage('user', text);
  playBeep(440, 0.05, 'sine', 0.08);

  // Handle site opens
  const lower = text.toLowerCase();
  if (lower.includes('open ') || lower.includes('launch ')) {
    for (const site of Object.keys(SITES)) {
      if (lower.includes(site)) {
        setTimeout(() => {
          const resp = getAIResponse(text);
          appendAIMessage('system', resp);
          speakText(resp);
          openSite(site);
        }, 500);
        return;
      }
    }
  }
  if (lower.includes('dashboard')) { setTimeout(() => switchView('dashboard'), 600); }
  if (lower.includes('terminal')) { setTimeout(() => switchView('terminal'), 600); }
  if (lower.includes('shutdown')) { setTimeout(() => shutdownOS(), 1500); }

  // Typing indicator
  const typing = appendAIMessage('system', '...');
  setTimeout(() => {
    const resp = getAIResponse(text);
    if (typing) typing.textContent = resp;
    speakText(resp);
    playBeep(660, 0.06, 'sine', 0.06);
  }, 600 + Math.random() * 400);
}

function appendAIMessage(role, text) {
  const chat = document.getElementById('aiChat');
  if (!chat) return null;
  const msg = document.createElement('div');
  msg.className = `ai-msg ai-msg-${role === 'user' ? 'user' : 'system'}`;
  const avatar = document.createElement('div');
  avatar.className = 'ai-msg-avatar';
  avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>';
  const textEl = document.createElement('div');
  textEl.className = 'ai-msg-text';
  textEl.textContent = text;
  msg.appendChild(avatar); msg.appendChild(textEl);
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
  return textEl;
}

// ─── VOICE RECOGNITION ───────────────────────────────────────
let recognition = null;
let voiceRestartTimer = null;

function initVoiceRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('⚠ Voice not supported in this browser'); return null; }
  const r = new SR();
  r.continuous = true;
  r.interimResults = false;
  r.lang = 'en-US';
  r.maxAlternatives = 1;

  r.onresult = (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.trim();
    handleVoiceInput(transcript);
  };
  r.onerror = (e) => {
    if (e.error === 'no-speech') return;
    console.warn('Voice error:', e.error);
  };
  r.onend = () => {
    if (state.voiceActive) {
      voiceRestartTimer = setTimeout(() => { try { r.start(); } catch(ex) {} }, 300);
    }
  };
  return r;
}

function handleVoiceInput(text) {
  const lower = text.toLowerCase();
  showToast(`🎙 "${text}"`);

  // Wake word
  if (lower.includes('nitrogen oxidiser') || lower.includes('nitrogen oxidizer')) {
    activateNOS();
    return;
  }

  // OS is logged in
  if (!state.loggedIn) return;

  // Route command to AI
  if (state.currentView === 'ai') {
    sendAICommand(text);
  } else {
    processVoiceCommand(lower, text);
  }
}

function activateNOS() {
  playActivationSound();
  speakText('System online. Awaiting commands.');
  showToast('🟢 N.O.S ACTIVATED');
  const orb = document.getElementById('aiOrb');
  if (orb) { orb.classList.add('speaking'); setTimeout(() => orb.classList.remove('speaking'), 3000); }

  // Show AI assistant panel
  const panel = document.getElementById('aiAssistPanel');
  const body = document.getElementById('aiAssistBody');
  if (panel) {
    panel.style.display = 'block';
    if (body) body.innerHTML = '<div class="float-msg">System online. Awaiting commands.</div>';
  }
  appendAIMessage('system', 'System online. Awaiting commands.');

  // If not logged in, log in
  if (!state.loggedIn) doLogin();
  switchView('ai');
}

function processVoiceCommand(lower, original) {
  for (const site of Object.keys(SITES)) {
    if (lower.includes('open ' + site) || lower.includes('launch ' + site)) {
      openSite(site); return;
    }
  }
  if (lower.includes('dashboard')) { switchView('dashboard'); return; }
  if (lower.includes('terminal')) { switchView('terminal'); return; }
  if (lower.includes('launcher') || lower.includes('launch pad')) { switchView('launcher'); return; }
  if (lower.includes('radar')) { switchView('radar'); return; }
  if (lower.includes('ai') || lower.includes('assistant')) { switchView('ai'); return; }
  if (lower.includes('shutdown') || lower.includes('turn off')) { shutdownOS(); return; }
  if (lower.includes('status')) {
    speakText('All systems nominal. No threats detected.');
    showToast('📊 STATUS: NOMINAL'); return;
  }
  if (lower.includes('play music') || lower.includes('music')) {
    musicControl('play'); return;
  }
  if (lower.includes('mute')) { toggleMute(); return; }
  // Default: send to AI
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
      document.getElementById('micIcon')?.parentElement.classList.add('topbar-icon-active');
      document.getElementById('aiVoiceBtn')?.classList.add('active');
      document.getElementById('aiVoiceStatus').textContent = '🎙 VOICE RECOGNITION: ACTIVE — Say "Nitrogen Oxidiser" to wake';
      showToast('🎙 VOICE ACTIVE — Say "Nitrogen Oxidiser"');
      playBeep(660, 0.1, 'sine', 0.1);
    } catch (e) { console.warn(e); }
  } else {
    state.voiceActive = false;
    if (voiceRestartTimer) clearTimeout(voiceRestartTimer);
    try { recognition.stop(); } catch(e) {}
    document.getElementById('voiceIndicator')?.classList.remove('active');
    document.getElementById('aiVoiceBtn')?.classList.remove('active');
    document.getElementById('aiVoiceStatus').textContent = '🎙 VOICE RECOGNITION: INACTIVE';
    showToast('🔇 VOICE DEACTIVATED');
  }
}

function toggleVoiceFromSettings() {
  toggleVoiceRecognition();
}

// ─── SPEECH SYNTHESIS ────────────────────────────────────────
function speakText(text) {
  if (state.muted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95; utt.pitch = 0.85; utt.volume = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US') || voices[0];
  if (preferred) utt.voice = preferred;
  const orb = document.getElementById('aiOrb');
  utt.onstart = () => { state.aiSpeaking = true; if (orb) orb.classList.add('speaking'); };
  utt.onend = () => { state.aiSpeaking = false; if (orb) orb.classList.remove('speaking'); };
  window.speechSynthesis.speak(utt);
}

// ─── MUSIC CONTROL ───────────────────────────────────────────
function musicControl(action) {
  const icon = document.getElementById('musicPlayIcon');
  if (action === 'play') {
    state.musicPlaying = !state.musicPlaying;
    if (icon) icon.className = state.musicPlaying ? 'fas fa-pause' : 'fas fa-play';
    showToast(state.musicPlaying ? '▶ AUDIO MATRIX PLAYING' : '⏸ AUDIO MATRIX PAUSED');
    playBeep(state.musicPlaying ? 440 : 330, 0.1, 'sine', 0.08);
  } else if (action === 'next') {
    showToast('⏭ NEXT TRACK');
    playBeep(550, 0.08, 'sine', 0.08);
  } else if (action === 'prev') {
    showToast('⏮ PREVIOUS TRACK');
    playBeep(380, 0.08, 'sine', 0.08);
  }
}

// ─── SETTINGS ────────────────────────────────────────────────
function toggleScanlines() {
  const cb = document.getElementById('settScanlines');
  const el = document.getElementById('scanlinesOverlay');
  if (el) el.style.display = cb?.checked ? 'block' : 'none';
}

function changeHue(val) {
  document.documentElement.style.setProperty('--hue', val);
}

// ─── SHUTDOWN ────────────────────────────────────────────────
function shutdownOS() {
  speakText('Initiating shutdown sequence. Goodbye.');
  showToast('⚡ SHUTDOWN INITIATED');
  const os = document.getElementById('mainOS');
  setTimeout(() => {
    os.style.transition = 'opacity 2s';
    os.style.opacity = '0';
    playBeep(220, 1.5, 'sine', 0.15);
    setTimeout(() => {
      os.style.display = 'none';
      // Show boot screen again
      const boot = document.getElementById('bootScreen');
      if (boot) { boot.style.display = 'flex'; boot.style.opacity = '0'; boot.classList.add('active'); }
      document.getElementById('bootLogs').innerHTML = '';
      document.getElementById('bootProgress').style.width = '0%';
      document.getElementById('bootPct').textContent = '0%';
      state.loggedIn = false;
      setTimeout(() => runBootSequence(), 200);
    }, 2000);
  }, 800);
}

// ─── TOAST ───────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─── CANVAS: BOOT ────────────────────────────────────────────
function initBootCanvas() {
  const canvas = document.getElementById('bootCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.6 + 0.2,
  }));
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,255,${p.opacity})`;
      ctx.fill();
    });
    // Grid lines
    ctx.strokeStyle = 'rgba(0,200,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    requestAnimationFrame(draw);
  };
  draw();
}

function initLoginCanvas() {
  const canvas = document.getElementById('loginCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const cols = Array.from({ length: Math.floor(canvas.width / 18) }, (_, i) => ({
    x: i * 18, y: Math.random() * canvas.height, speed: Math.random() * 2 + 1,
  }));
  const draw = () => {
    ctx.fillStyle = 'rgba(2,8,16,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Share Tech Mono';
    cols.forEach(c => {
      ctx.fillStyle = `rgba(0,200,255,${Math.random() * 0.4 + 0.1})`;
      const char = Math.random() > 0.5 ? '1' : '0';
      ctx.fillText(char, c.x, c.y);
      c.y += c.speed;
      if (c.y > canvas.height) c.y = 0;
    });
    requestAnimationFrame(draw);
  };
  draw();
}

// ─── BG CANVAS (OS) ──────────────────────────────────────────
function initBgCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 1.5 + 0.3, opacity: Math.random() * 0.3 + 0.1,
  }));

  let frameCount = 0;
  const draw = () => {
    frameCount++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    if (document.getElementById('settParticles')?.checked !== false) {
      ctx.strokeStyle = 'rgba(0,200,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,200,255,${p.opacity})`;
        ctx.fill();
      });
    }
    requestAnimationFrame(draw);
  };
  draw();
}

// ─── AI INPUT ENTER KEY ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const aiInput = document.getElementById('aiInput');
  if (aiInput) aiInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendAICommand(); });

  // Login input enter
  const loginInput = document.getElementById('loginInput');
  if (loginInput) loginInput.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

  // Click on AI orb toggles voice
  const orb = document.getElementById('aiOrb');
  if (orb) orb.addEventListener('click', () => { initAudio(); toggleVoiceRecognition(); });

  // Preload voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  // Start boot
  runBootSequence();
});
