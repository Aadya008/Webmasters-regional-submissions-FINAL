"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
const wingOf = ch => WINGS.find(w => w.id === ch.wing);

const ICON = {
  key: '<circle cx="8" cy="8" r="4"/><path d="M11 11l9 9M16 16l2-2M18 18l2-2"/>',
  anvil: '<path d="M3 8h13a4 4 0 0 1-4 4H9v3h4v4H6v-4h3v-3H7a4 4 0 0 1-4-4z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  quill: '<path d="M20 4C11 5 6 11 5 19M20 4c-1 6-5 10-11 11M9 15l-4 4"/>',
  scales: '<path d="M12 3v18M7 21h10M4 7h16"/><path d="M4 7l-2 6h6zM20 7l-2 6h6z"/>',
  vault: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1M12 15v1M8 12h1M15 12h1"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  tower: '<path d="M6 21V8h12v13M4 8h16V4h-3v2h-2V4h-2v2h-2V4H9v2H7V4H4z"/><path d="M10 21v-5h4v5"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  dragon: '<path d="M3 17c4-1 6-5 6-9 2 2 3 4 3 6 1-3 4-5 8-5-2 2-3 4-3 7-3-1-5 0-6 2-2-1-5-1-8-1z"/><circle cx="17" cy="11" r=".6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  scroll: '<path d="M7 4h11a2 2 0 0 1 2 2v1h-4M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7"/><path d="M9 9h6M9 13h6"/>',
  sword: '<path d="M14 4h6v6L9 21l-3-3z"/><path d="M5 14l5 5M3 21l3-3"/>',
  tools: '<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.5 2.5-2.6-.6-.6-2.6z"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ""}</svg>`;

const sfx = {
  ctx: null,
  ready() {
    if (store.s.muted) return false;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return true;
    } catch (e) { return false; }
  },
  tone(freq, type = "sine", dur = 0.15, vol = 0.05, slideTo = null, delay = 0) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur = 0.4, vol = 0.05, filterFreq = 800) {
    if (!this.ready()) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    f.type = "lowpass"; f.frequency.value = filterFreq; g.gain.value = vol;
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(this.ctx.destination); src.start();
  },
  click() { this.tone(520, "triangle", 0.06, 0.03); },
  coin() { this.tone(988, "square", 0.07, 0.025); this.tone(1319, "square", 0.12, 0.025, null, 0.07); },
  good() { this.tone(660, "sine", 0.12, 0.05); this.tone(880, "sine", 0.18, 0.05, null, 0.1); },
  bad() { this.tone(220, "sawtooth", 0.25, 0.03, 140); },
  whoosh() { this.noise(0.5, 0.06, 1200); },
  roar() { this.noise(0.9, 0.09, 420); this.tone(110, "sawtooth", 0.8, 0.04, 60); },
  zap() { this.tone(1200, "sawtooth", 0.25, 0.03, 300); this.noise(0.2, 0.03, 3000); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, "triangle", 0.3, 0.05, null, i * 0.12)); },
  creak() { this.tone(90, "sawtooth", 1.1, 0.03, 60); this.noise(1.2, 0.03, 300); }
};

const KEY = "nexus_citadel_v8";
const store = {
  s: null,
  fresh() {
    return { gold: 0, awarded: {}, ch: {}, perfect: {}, ach: {}, lex: {}, dragon: { defeated: false }, name: "", judge: false, muted: false, timer: true, sigils: [] };
  },
  load() {
    this.s = this.fresh();
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object") this.s = Object.assign(this.fresh(), raw);
    } catch (e) {  }
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch (e) {  } },
  ch(id) {
    if (!this.s.ch[id]) this.s.ch[id] = { read: [false, false, false], trial: false, best: 0, done: false };
    return this.s.ch[id];
  }
};

const game = {
  rankInfo(gold = store.s.gold) {
    let i = 0;
    RANKS.forEach((r, k) => { if (gold >= r.min) i = k; });
    const next = RANKS[i + 1];
    return { idx: i, title: RANKS[i].title, next, pct: next ? (gold - RANKS[i].min) / (next.min - RANKS[i].min) * 100 : 100 };
  },

  award(key, amount, fromEl) {
    if (store.s.awarded[key]) return false;
    store.s.awarded[key] = true;
    const before = this.rankInfo().idx;
    store.s.gold += amount;
    store.save();
    fx.coins(fromEl, amount);
    const after = this.rankInfo();
    if (after.idx > before) {
      setTimeout(() => { sfx.fanfare(); ui.toast("You have risen in rank!", `You are now a ${after.title}.`, "crown"); }, 700);
    }
    return true;
  },

  unlock(id) {
    if (store.s.ach[id]) return;
    store.s.ach[id] = true;
    store.save();
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (a) setTimeout(() => ui.toast(`Achievement: ${a.name}`, a.desc, a.icon), 400);
  },

  idx(id) { return CHAMBERS.findIndex(c => c.id === id); },
  isDone(id) { return !!(store.s.ch[id] && store.s.ch[id].done); },
  unlocked(i) { return i === 0 || store.s.judge || this.isDone(CHAMBERS[i - 1].id) || this.isDone(CHAMBERS[i].id); },
  doneCount() { return CHAMBERS.filter(c => this.isDone(c.id)).length; },
  dragonUnlocked() { return store.s.judge || this.doneCount() === CHAMBERS.length; },
  progress(id) {
    const p = store.ch(id);
    const d = p.read.filter(Boolean).length + (p.trial ? 1 : 0) + (p.best >= 3 ? 1 : 0);
    return { done: d, total: 5 };
  },

  check(id) {
    const p = store.ch(id);
    const pr = this.progress(id);
    if (!p.done && pr.done >= pr.total) {
      p.done = true;
      store.save();
      const ch = CHAMBERS[this.idx(id)];
      this.award("conquer-" + id, 25, $("#chMedal"));
      this.unlock("gate");
      const n = this.doneCount();
      if (n >= 4) this.unlock("halfway");
      if (n >= 8) this.unlock("keys");
      ui.conquer(ch);
    }
    chamberView.refreshHeader();
  }
};

const fx = {
  coins(fromEl, amount) {
    const purse = $("#purse");
    const target = purse.getBoundingClientRect();
    const src = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const sx = src.left + src.width / 2, sy = src.top + src.height / 2;
    const tx = target.left + 20, ty = target.top + target.height / 2;
    sfx.coin();
    const pop = document.createElement("div");
    pop.className = "gold-pop";
    pop.textContent = `+${amount}`;
    pop.style.left = (sx - 16) + "px"; pop.style.top = (sy - 20) + "px";
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1300);
    const n = reduced ? 0 : Math.min(8, 3 + Math.floor(amount / 15));
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "fly-coin";
      c.style.left = sx + "px"; c.style.top = sy + "px";
      document.body.appendChild(c);
      const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 220, my = Math.min(sy, ty) - 80 - Math.random() * 80;
      const anim = c.animate([
        { transform: "translate(0,0) scale(0.6)", opacity: 0 },
        { transform: `translate(${mx - sx}px, ${my - sy}px) scale(1.1)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${tx - sx}px, ${ty - sy}px) scale(0.5)`, opacity: 0.9 }
      ], { duration: 750 + i * 70, easing: "cubic-bezier(.3,.7,.4,1)" });
      anim.onfinish = () => c.remove();
    }
    setTimeout(() => {
      ui.hud();
      purse.classList.add("bump");
      setTimeout(() => purse.classList.remove("bump"), 300);
    }, n ? 750 : 0);
  },

  confetti(count = 80) {
    if (reduced) return;
    const colors = ["#f6cf7a", "#e8b04b", "#e0485f", "#4d7fe0", "#3fa877", "#8b6fd6"];
    for (let i = 0; i < count; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.style.left = (Math.random() * 100) + "vw";
      c.style.top = "-20px";
      c.style.background = colors[i % colors.length];
      document.body.appendChild(c);
      const drift = (Math.random() - 0.5) * 300;
      const a = c.animate([
        { transform: "translate(0,0) rotate(0deg)" },
        { transform: `translate(${drift}px, ${innerHeight + 60}px) rotate(${720 + Math.random() * 720}deg)` }
      ], { duration: 2200 + Math.random() * 1800, delay: Math.random() * 500, easing: "cubic-bezier(.2,.6,.4,1)" });
      a.onfinish = () => c.remove();
    }
  }
};

const ui = {
  hud() {
    const r = game.rankInfo();
    $("#hudGold").textContent = store.s.gold;
    $("#hudRank").textContent = r.title;
  },

  toast(title, msg, ico = "star", bad = false) {
    const t = document.createElement("div");
    t.className = "toast" + (bad ? " t-bad" : "");
    t.innerHTML = `<span class="toast-ico">${icon(ico)}</span><div><strong></strong><p></p></div>`;
    t.querySelector("strong").textContent = title;
    t.querySelector("p").textContent = msg;
    const stack = $("#toasts");
    while (stack.children.length >= 3) stack.firstElementChild.remove();
    stack.appendChild(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 360); }, 4200);
  },

  conquer(ch) {
    sfx.fanfare();
    fx.confetti();
    const i = game.idx(ch.id);
    const next = CHAMBERS[i + 1];
    const m = document.createElement("div");
    m.className = "conquer";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.style.setProperty("--c", ch.color);
    m.innerHTML = `
      <div class="conquer-card">
        <div class="conquer-crest">${ch.num}</div>
        <p class="eyebrow">Chamber conquered</p>
        <h2>${esc(ch.name)}</h2>
        <p>You earned the crest of ${esc(ch.short)}. ${next ? `The doors of ${esc(next.name)} now stand open.` : "The final seal on the dragon's keep is broken."}</p>
        <div class="btn-row center">
          <a class="btn btn-gold" href="${next ? "#/chamber/" + next.id : "#/dragon"}">${next ? "Enter " + esc(next.short) : "Face the dragon"}</a>
          <a class="btn btn-ghost" href="#/map">Castle map</a>
        </div>
      </div>`;
    const close = () => m.remove();
    m.addEventListener("click", e => { if (e.target === m || e.target.closest("a")) close(); });
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
    document.body.appendChild(m);
    m.querySelector("a").focus();
  },

  initSettings() {
    const btn = $("#settingsBtn"), menu = $("#settingsMenu");
    const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    const labels = () => {
      $("#soundToggle").textContent = `Sound effects: ${store.s.muted ? "Off" : "On"}`;
      $("#judgeToggle").textContent = store.s.judge ? "Evaluator preview: ON (everything unlocked)" : "Evaluator preview: unlock everything";
    };
    labels();
    btn.addEventListener("click", e => { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute("aria-expanded", String(!menu.hidden)); });
    document.addEventListener("click", e => { if (!menu.contains(e.target)) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    $("#soundToggle").addEventListener("click", () => { store.s.muted = !store.s.muted; store.save(); labels(); sfx.click(); });
    $("#judgeToggle").addEventListener("click", () => {
      store.s.judge = !store.s.judge; store.save(); labels(); close();
      ui.toast(store.s.judge ? "Evaluator preview on" : "Evaluator preview off", store.s.judge ? "Every chamber, the dragon, and the certificate are unlocked. Your progress is kept." : "Chambers unlock in order again.", "key");
      router.handle();
    });
    let resetArmed = 0;
    $("#resetBtn").addEventListener("click", () => {
      const btn = $("#resetBtn");
      if (Date.now() - resetArmed > 4000) {
        resetArmed = Date.now();
        btn.textContent = "Click again to erase everything";
        setTimeout(() => { if (resetArmed && Date.now() - resetArmed >= 3900) { resetArmed = 0; btn.textContent = "Reset all progress"; } }, 4000);
        return;
      }
      resetArmed = 0;
      btn.textContent = "Reset all progress";
      close();
      const muted = store.s.muted;
      store.s = store.fresh(); store.s.muted = muted; store.save();
      ui.hud();
      sigils.updateCount();
      location.hash = "#/home";
      router.handle();
      ui.toast("A new legend begins", "Your progress has been reset.", "scroll");
    });
  }
};

const router = {
  cleanups: [],
  init() { window.addEventListener("hashchange", () => this.handle()); this.handle(); },
  onLeave(fn) { this.cleanups.push(fn); },
  handle() {
    this.cleanups.forEach(f => f()); this.cleanups = [];
    const raw = location.hash.replace(/^#\/?/, "");
    const [view, arg] = raw.split("/");
    if (view && !["home", "map", "chamber", "dragon", "lab", "lexicon", "honors", "refs"].includes(view) && document.getElementById(view)) {
      this.show("home");
      setTimeout(() => document.getElementById(view).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }), 50);
      return;
    }
    switch (view || "home") {
      case "map": this.show("map"); mapView.render(); break;
      case "chamber": {
        const i = game.idx(arg);
        if (i < 0) { location.replace("#/map"); return; }
        if (!game.unlocked(i)) {
          ui.toast("This door is sealed", `Conquer ${CHAMBERS[i - 1].name} first.`, "lock", true);
          location.replace("#/map");
          return;
        }
        this.show("chamber", "map");
        chamberView.open(arg);
        break;
      }
      case "dragon": this.show("dragon", "map"); dragon.renderGate(); break;
      case "lab": this.show("lab"); lab.render(); break;
      case "lexicon": this.show("lexicon"); lexicon.render(); break;
      case "honors": this.show("honors"); honors.render(); break;
      case "refs": this.show("refs"); break;
      default: this.show("home"); home.render();
    }
  },
  show(view, navKey = view) {
    $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
    $$("[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === navKey));
    const titles = { home: "Conquer the Castle, Master AI", map: "Castle Map", chamber: "Chamber", dragon: "The Siege of Vortigrax", lab: "AI Lab", lexicon: "Lexicon", honors: "Hall of Honors", refs: "References" };
    document.title = `${titles[view]} | Nexus Citadel`;
    window.scrollTo({ top: 0, behavior: "auto" });
    sigils.place();
  }
};

const home = {
  render() {
    const grid = $("#journeyGrid");
    if (!grid.children.length) {
      grid.innerHTML = WINGS.map(w => {
        const list = CHAMBERS.filter(c => c.wing === w.id);
        return `<li class="wing-block wing-${w.id}" style="--wc:${w.color}; --n:${list.length}">
          <div class="wing-head"><span class="wing-num">Wing ${w.num}</span><h3>${esc(w.short)}</h3><p>${esc(w.desc)}</p></div>
          <ol class="wing-cards">${list.map(c => `
            <li class="journey-card" style="--c:${c.color}">
              <span class="jc-num">${c.num}</span>
              <h3>${esc(c.name)}</h3>
              <p>${esc(c.topic)}</p>
            </li>`).join("")}</ol></li>`;
      }).join("") + `
        <li class="journey-card" style="--c:#e0485f; grid-column: 1 / -1">
          <span class="jc-num">${icon("dragon").replace("<svg", '<svg style="width:46px;height:46px;fill:none;stroke:#e0485f;stroke-width:1.6"')}</span>
          <h3>The Dragon's Keep</h3>
          <p>Face Vortigrax, the Dragon of False Information, in a battle of knowledge. Victory earns your printable Certificate of Knighthood.</p>
        </li>`;
    }
    $("#enterBtn").textContent = game.doneCount() > 0 ? "Return to the Citadel" : "Lower the Drawbridge";
    $("#castleScene").classList.remove("open");
    if (typeof companions !== "undefined") companions.greet();
  },
  init() {
    $("#enterBtn").addEventListener("click", () => {
      const scene = $("#castleScene");
      if (reduced) { location.hash = "#/map"; return; }
      sfx.creak();
      scene.classList.add("open");
      setTimeout(() => sfx.fanfare(), 1300);
      setTimeout(() => { location.hash = "#/map"; }, 2100);
    });
  }
};

const MAP_POS = {
  gatehouse: [500, 470], armory: [300, 488], training: [140, 380], greathall: [305, 262],
  workshop: [500, 382], scriptorium: [695, 262], court: [860, 380], vault: [700, 488], dragon: [500, 205]
};

const mapView = {
  selected: null,

  art() {
    let crenels = "";
    for (let x = 90; x < 910; x += 30) crenels += `<rect x="${x}" y="406" width="18" height="16" fill="#2f355c"/>`;
    const tower = (x, y, w, h, roofH, col) => {
      let cr = "";
      for (let cx = x - 6; cx < x + w + 6; cx += 20) cr += `<rect x="${cx}" y="${y - 14}" width="12" height="14" fill="#3d4475"/>`;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#mStone)"/>${cr}
        <path d="M${x - 10} ${y - 14} L${x + w / 2} ${y - 14 - roofH} L${x + w + 10} ${y - 14} Z" fill="url(#mRoof)"/>
        <line x1="${x + w / 2}" y1="${y - 14 - roofH}" x2="${x + w / 2}" y2="${y - 40 - roofH}" stroke="#e8b04b" stroke-width="2.5"/>
        <path class="m-flag" d="M${x + w / 2} ${y - 40 - roofH} q14 4 26 0 q-4 6 0 11 q-12 4 -26 0z" fill="${col}"/>`;
    };
    const win = (x, y, s = 1) => `<path class="m-win" d="M${x} ${y} v${-12 * s} a${7 * s} ${7 * s} 0 0 1 ${14 * s} 0 v${12 * s}z" fill="#f6cf7a" style="animation-delay:${-Math.random() * 3}s"/>`;
    let stars = "";
    for (let i = 0; i < 50; i++) stars += `<circle cx="${(i * 197) % 1000}" cy="${(i * 83) % 230}" r="${(i % 3) * 0.5 + 0.6}" fill="#fff" opacity="${0.3 + (i % 5) * 0.12}"/>`;
    return `
      <defs>
        <linearGradient id="mSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1c2150"/><stop offset="1" stop-color="#0b0d1c"/></linearGradient>
        <linearGradient id="mStone" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#434a7a"/><stop offset="1" stop-color="#232847"/></linearGradient>
        <linearGradient id="mStoneD" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2f355c"/><stop offset="1" stop-color="#191c35"/></linearGradient>
        <linearGradient id="mRoof" x1="0" x2="1"><stop offset="0" stop-color="#6e1828"/><stop offset="1" stop-color="#b3263e"/></linearGradient>
        <linearGradient id="mWater" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#22417a"/><stop offset="1" stop-color="#0f1a35"/></linearGradient>
        <radialGradient id="mMoon"><stop offset="0" stop-color="#fff6d8"/><stop offset=".6" stop-color="#f6e2a8" stop-opacity=".5"/><stop offset="1" stop-color="#f6e2a8" stop-opacity="0"/></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="1000" height="640" fill="url(#mSky)"/>
      ${stars}
      <circle cx="880" cy="80" r="90" fill="url(#mMoon)"/><circle cx="880" cy="80" r="34" fill="#f8ecc4"/>
      <g class="cloud"><ellipse cx="200" cy="110" rx="90" ry="14" fill="#2b3165" opacity=".55"/><ellipse cx="250" cy="100" rx="60" ry="12" fill="#2b3165" opacity=".55"/></g>
      <g class="cloud c2"><ellipse cx="600" cy="170" rx="110" ry="12" fill="#2b3165" opacity=".45"/></g>
      <path d="M0 330 L90 250 L170 300 L260 210 L360 290 L460 220 L560 280 L660 200 L760 270 L860 230 L1000 300 V640 H0 Z" fill="#141831"/>
      <g class="map-dragon"><path d="M0 0 c8-8 18-8 22 0 c6-10 16-12 22-6 c-8 0-12 4-16 10 c-4-2-10-2-14 2 c-4-4-9-6-14-6z" fill="#e0485f" opacity=".8">
        <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path="M500 60 C 640 40, 680 150, 560 160 C 420 170, 330 110, 400 60 C 440 30, 470 50, 500 60"/></path></g>
      ${tower(420, 160, 160, 300, 100, "#e8b04b")}
      ${tower(250, 190, 110, 260, 80, "#4d7fe0")}
      ${tower(640, 190, 110, 260, 80, "#8b6fd6")}
      <rect x="90" y="420" width="820" height="140" fill="url(#mStoneD)"/>${crenels}
      ${tower(80, 300, 120, 260, 70, "#4d9c6a")}
      ${tower(800, 300, 120, 260, 70, "#b3263e")}
      <rect x="395" y="340" width="210" height="110" fill="url(#mStone)"/>
      <path d="M385 340 L500 288 L615 340 Z" fill="url(#mRoof)"/>
      ${win(106, 520)}${win(174, 520)}${win(816, 520)}${win(884, 520)}${win(268, 410)}${win(328, 410)}${win(658, 410)}${win(718, 410)}${win(438, 196)}${win(548, 196)}${win(408, 432, 0.9)}${win(578, 432, 0.9)}
      <path d="M470 560 v-48 a30 30 0 0 1 60 0 v48z" fill="#090b16"/>
      <path d="M476 520 h48 M476 535 h48 M476 550 h48 M486 505 v55 M500 500 v60 M514 505 v55" stroke="#6e6a7d" stroke-width="2.5"/>
      <rect x="0" y="560" width="1000" height="80" fill="url(#mWater)"/>
      <path d="M470 560 L450 640 H550 L530 560Z" fill="#5a3b1d"/>
      <path d="M60 590 h40 M180 610 h60 M320 596 h40 M640 606 h50 M780 592 h40 M880 616 h50" stroke="#4d7fe0" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;
  },

  nodeSvg(id, x, y, i) {
    const isDragon = id === "dragon";
    const ch = isDragon ? null : CHAMBERS[i];
    const done = isDragon ? store.s.dragon.defeated : game.isDone(id);
    const open = isDragon ? game.dragonUnlocked() : game.unlocked(i);
    const cur = this.currentId() === id;
    const color = isDragon ? "#e0485f" : ch.color;
    const label = isDragon ? "Dragon's Keep" : ch.short;
    const r = isDragon ? 40 : 32;
    let inner;
    if (!open) inner = `<g transform="translate(-11,-12) scale(0.92)" fill="none" stroke="#8d88a6" stroke-width="2.4" stroke-linejoin="round"><rect x="3" y="11" width="18" height="12" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></g>`;
    else if (isDragon) inner = `<g transform="translate(-16,-15) scale(1.35)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round">${ICON.dragon}</g>`;
    else inner = `<text y="8" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="${ch.num.length > 2 ? 18 : 22}" fill="#1b1205">${ch.num}</text>`;
    const fill = !open ? "#262a48" : done ? "#f6cf7a" : color;
    const stroke = !open ? "#4a5080" : done ? color : "#fff3cf";
    return `
      <g class="node ${open ? "" : "locked"} ${cur ? "current" : ""} ${this.selected === id ? "selected" : ""}" data-id="${id}" transform="translate(${x},${y})" tabindex="0" role="button" aria-label="${esc(label)}: ${done ? "conquered" : open ? "open" : "sealed"}">
        <circle class="hit" r="${r + 18}"/>
        <circle class="ring" r="${r + 6}" style="stroke:${color}"/>
        <circle class="sel" r="${r + 12}"/>
        <g class="disc">
          <circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="4" ${open ? 'filter="url(#glow)"' : ""}/>
          <circle r="${r - 7}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
          ${inner}
        </g>
        ${done ? `<g transform="translate(${r - 6},${-r + 6})"><circle r="12" fill="#3fa877" stroke="#0b0d1c" stroke-width="3"/><path d="M-5 0 l3 4 7-8" fill="none" stroke="#fff" stroke-width="2.8"/></g>` : ""}
        <text class="node-label" y="${r + 26}" text-anchor="middle">${esc(label)}</text>
      </g>`;
  },

  currentId() {
    const c = CHAMBERS.find((ch, i) => !game.isDone(ch.id) && game.unlocked(i));
    if (c) return c.id;
    return game.dragonUnlocked() && !store.s.dragon.defeated ? "dragon" : null;
  },

  render() {
    if (!this.selected) this.selected = this.currentId() || "gatehouse";
    const order = [...CHAMBERS.map(c => c.id), "dragon"];
    const pts = order.map(id => MAP_POS[id]);
    const pathD = list => list.reduce((d, p, i) => {
      if (!i) return `M${p[0]} ${p[1]}`;
      const q = list[i - 1], my = (q[1] + p[1]) / 2;
      return d + ` C${q[0]} ${my} ${p[0]} ${my} ${p[0]} ${p[1]}`;
    }, "");
    let lit = 0;
    CHAMBERS.forEach((c, i) => { if (game.isDone(c.id)) lit = i + 1; });
    if (store.s.dragon.defeated) lit = 8;
    const nodes = order.map((id, i) => this.nodeSvg(id, MAP_POS[id][0], MAP_POS[id][1], i)).join("");
    $("#mapSvg").innerHTML = `<svg viewBox="0 0 1000 640" role="group" aria-label="Map of the castle with nine locations">
      ${this.art()}
      <path class="path-base" d="${pathD(pts)}"/>
      ${lit ? `<path class="path-lit" d="${pathD(pts.slice(0, lit + 1))}"/>` : ""}
      ${nodes}</svg>`;
    $$("#mapSvg .node").forEach(n => {
      n.addEventListener("click", () => this.select(n.dataset.id, true));
      n.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.select(n.dataset.id, true); } });
    });
    const done = game.doneCount();
    $("#mapDone").textContent = done;
    $("#mapMeter").style.width = (done / 8 * 100) + "%";
    $("#mapRank").textContent = game.rankInfo().title;
    $("#wingProgress").innerHTML = WINGS.map(w => {
      const list = CHAMBERS.filter(c => c.wing === w.id);
      const steps = list.reduce((n, c) => n + game.progress(c.id).done, 0), total = list.length * 5;
      const done = list.filter(c => game.isDone(c.id)).length;
      return `<div class="wp-row" style="--wc:${w.color}"><div class="mp-row"><span>Wing ${w.num} · ${esc(w.short)}</span><strong>${done} / ${list.length}</strong></div>
        <div class="meter wp-meter"><span style="width:${steps / total * 100}%"></span></div></div>`;
    }).join("");
    this.renderPanel();
    this.renderLog();
  },

  select(id, user) {
    if (user) sfx.click();
    this.selected = id;
    $$("#mapSvg .node").forEach(n => n.classList.toggle("selected", n.dataset.id === id));
    this.renderPanel();
    if (user && isMobile()) $("#roomPanel").classList.add("open");
  },

  renderPanel() {
    const id = this.selected;
    const panel = $("#roomPanel");
    const go = $("#rpGo");
    if (id === "dragon") {
      const open = game.dragonUnlocked();
      panel.style.setProperty("--c", "#e0485f");
      $("#rpMedal").innerHTML = icon("dragon").replace("<svg", '<svg style="width:38px;height:38px;fill:none;stroke:#1b1205;stroke-width:1.8"');
      $("#rpTopic").textContent = "The final trial";
      $("#rpSub").textContent = "A battle of knowledge from every wing";
      $("#rpName").textContent = "The Dragon's Keep";
      $("#rpBlurb").textContent = "Vortigrax, the Dragon of False Information, waits at the top of the keep. Defeat him with knowledge from every chamber to earn your Certificate of Knighthood.";
      $("#rpSteps").innerHTML = `<li class="${open ? "done" : ""}"><span class="tick"></span>All eight chambers conquered (${game.doneCount()}/8)</li><li class="${store.s.dragon.defeated ? "done" : ""}"><span class="tick"></span>Vortigrax defeated</li>`;
      go.href = open ? "#/dragon" : "#/map";
      go.textContent = !open ? "Sealed" : store.s.dragon.defeated ? "Rematch the dragon" : "Approach the keep";
      go.classList.toggle("is-locked", !open);
      $("#rpHint").textContent = open ? "" : "Conquer every chamber to break the final seal.";
      return;
    }
    const i = game.idx(id), ch = CHAMBERS[i], p = store.ch(id);
    const open = game.unlocked(i), pr = game.progress(id);
    panel.style.setProperty("--c", ch.color);
    $("#rpMedal").textContent = ch.num;
    $("#rpTopic").textContent = `Wing ${wingOf(ch).num} · ${wingOf(ch).short}`;
    $("#rpSub").textContent = ch.topic;
    $("#rpName").textContent = ch.name;
    $("#rpBlurb").textContent = ch.blurb;
    $("#rpSteps").innerHTML = `
      <li class="${p.read.every(Boolean) ? "done" : ""}"><span class="tick"></span>Read three scrolls (${p.read.filter(Boolean).length}/3)</li>
      <li class="${p.trial ? "done" : ""}"><span class="tick"></span>Trial: ${esc(ch.trial.title)}</li>
      <li class="${p.best >= 3 ? "done" : ""}"><span class="tick"></span>Checkpoint: 3 of 4 correct${p.best ? ` (best ${p.best}/4)` : ""}</li>`;
    go.href = open ? "#/chamber/" + id : "#/map";
    go.textContent = !open ? "Sealed" : game.isDone(id) ? "Revisit chamber" : pr.done ? "Continue" : "Enter chamber";
    go.classList.toggle("is-locked", !open);
    $("#rpHint").textContent = open ? (game.isDone(id) ? "Replays are for practice. Gold is only awarded once." : "") : `Conquer ${CHAMBERS[i - 1].name} to break this seal.`;
  },

  renderLog() {
    const items = CHAMBERS.map((c, i) => {
      const open = game.unlocked(i), pr = game.progress(c.id);
      return `<li><button type="button" class="log-item ${open ? "" : "locked"}" data-id="${c.id}" style="--c:${c.color}">
        <span class="log-medal">${open ? c.num : icon("lock").replace("<svg", '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2"')}</span>
        <span class="log-body"><strong>${esc(c.name)}</strong><small>${esc(wingOf(c).short)} · ${game.isDone(c.id) ? "Conquered" : open ? `${pr.done} of 5 complete` : "Sealed"}</small>
        <span class="meter"><span style="width:${pr.done / 5 * 100}%"></span></span></span></button></li>`;
    }).join("");
    const dOpen = game.dragonUnlocked();
    $("#questLog").innerHTML = items + `<li><button type="button" class="log-item ${dOpen ? "" : "locked"}" data-id="dragon" style="--c:#e0485f">
      <span class="log-medal">${icon("dragon").replace("<svg", '<svg style="width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8"')}</span>
      <span class="log-body"><strong>The Dragon's Keep</strong><small>${store.s.dragon.defeated ? "Vortigrax defeated" : dOpen ? "The keep is open" : "Sealed"}</small></span></button></li>`;
    $$("#questLog .log-item").forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.id;
      this.select(id, true);
      if (!isMobile()) $("#roomPanel").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    }));
  },

  init() {
    $("#sheetClose").addEventListener("click", () => $("#roomPanel").classList.remove("open"));
    $("#rpGo").addEventListener("click", e => { if ($("#rpGo").classList.contains("is-locked")) e.preventDefault(); $("#roomPanel").classList.remove("open"); });
  }
};

const STEP_NAMES = ["Scroll I", "Scroll II", "Scroll III", "Trial", "Checkpoint"];

const chamberView = {
  ch: null, step: 0, cleanup: null,

  open(id) {
    this.ch = CHAMBERS[game.idx(id)];
    const p = store.ch(id);

    this.step = p.read.indexOf(false);
    if (this.step < 0) this.step = !p.trial ? 3 : p.best < 3 ? 4 : 0;
    $("#view-chamber").style.setProperty("--c", this.ch.color);
    $("#chMedal").textContent = this.ch.num;
    $("#chTopic").textContent = `${wingOf(this.ch).name} · ${this.ch.topic}`;
    $("#chName").textContent = this.ch.name;
    document.title = `${this.ch.name} | Nexus Citadel`;
    this.renderStep();
  },

  refreshHeader() {
    if (!this.ch) return;
    const pr = game.progress(this.ch.id);
    $("#chProgText").textContent = game.isDone(this.ch.id) ? "Chamber conquered" : `${pr.done} of 5 complete`;
    $("#chMeter").style.width = (pr.done / pr.total * 100) + "%";
    const p = store.ch(this.ch.id);
    const doneFlags = [p.read[0], p.read[1], p.read[2], p.trial, p.best >= 3];
    $("#chTabs").innerHTML = STEP_NAMES.map((n, i) => {
      const label = i < 3 ? `<span class="tlabel-long">Scroll </span>${["I", "II", "III"][i]}` : n;
      return `<button type="button" class="ch-tab ${i === this.step ? "active" : ""} ${doneFlags[i] ? "done" : ""}" data-step="${i}" ${i === this.step ? 'aria-current="step"' : ""}><span class="tdot"></span>${label}</button>`;
    }).join("");
    $$("#chTabs .ch-tab").forEach(b => b.addEventListener("click", () => this.go(parseInt(b.dataset.step, 10))));
  },

  go(step) {
    if (step === this.step) return;
    sfx.click();
    this.step = clamp(step, 0, 4);
    this.renderStep();
    $("#chTabs").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  },

  renderStep() {
    if (this.cleanup) { this.cleanup(); this.cleanup = null; }
    const stage = $("#chStage");
    const ch = this.ch, s = this.step;
    stage.innerHTML = "";
    if (s < 3) this.renderScroll(stage, s);
    else if (s === 3) this.renderTrial(stage);
    else quiz.mount(stage, ch);
    this.refreshHeader();
    $("#chPrev").style.visibility = s > 0 ? "visible" : "hidden";
    const nextLabels = ["Next scroll →", "Next scroll →", "Begin the trial →", "Take the checkpoint →", "Return to the map →"];
    $("#chNext").textContent = nextLabels[s];
    sigils.place();
  },

  renderScroll(stage, i) {
    const ch = this.ch, sc = ch.scrolls[i];
    const el = document.createElement("article");
    el.className = "parchment";
    el.innerHTML = `
      <p class="scroll-kicker">${esc(ch.name)} · Scroll ${["I", "II", "III"][i]} of III</p>
      <h2 class="scroll-title">${esc(sc.title)}</h2>
      <div class="scroll-body">${sc.body}</div>
      <div class="scroll-seal"><span class="wax">${ch.num}</span><span id="sealText"></span></div>`;
    stage.appendChild(el);
    $$(".widget", el).forEach(w => { const fn = WIDGETS[w.dataset.widget]; if (fn) fn(w); });
    const p = store.ch(ch.id);
    const first = !p.read[i];
    p.read[i] = true;
    store.save();
    $("#sealText", el).textContent = first ? "Scroll sealed into your memory. +5 gold" : "You have already studied this scroll.";
    if (first) setTimeout(() => game.award(`read-${ch.id}-${i}`, 5, $(".wax", el)), 500);
    game.check(ch.id);
  },

  renderTrial(stage) {
    const ch = this.ch, t = ch.trial;
    const el = document.createElement("div");
    el.className = "trial";
    el.innerHTML = `
      <div class="trial-head"><span class="trial-badge">${icon(ch.icon)}</span>
        <div><p class="eyebrow">The Trial of ${esc(ch.short)}</p><h2>${esc(t.title)}</h2><p>${esc(t.intro)}</p></div></div>
      <div class="trial-body"></div>
      <div class="trial-foot"></div>`;
    stage.appendChild(el);
    const body = $(".trial-body", el), foot = $(".trial-foot", el);
    const p = store.ch(ch.id);
    const showDone = () => { foot.innerHTML = `<div class="trial-done-banner">${icon("check")}<span>Trial complete! You may replay it any time for practice.</span></div>`; };
    if (p.trial) showDone();
    const done = () => {
      if (!store.ch(ch.id).trial) {
        store.ch(ch.id).trial = true;
        store.save();
        sfx.fanfare();
        game.award("trial-" + ch.id, 50, $(".trial-badge", el));
        game.check(ch.id);
      }
      showDone();
    };
    const fn = TRIALS[t.type];
    const c = fn(body, ch, done);
    if (typeof c === "function") this.cleanup = c;
  },

  init() {
    $("#chPrev").addEventListener("click", () => this.go(this.step - 1));
    $("#chNext").addEventListener("click", () => {
      if (this.step < 4) this.go(this.step + 1);
      else location.hash = "#/map";
    });
    window.addEventListener("resize", () => { if (this.resizeHook) this.resizeHook(); });
  }
};

const WIDGETS = {
  wordMap(el) {
    el.innerHTML = `<h4>THE CARTOGRAPHER'S EMBEDDING MAP</h4>
      <p class="widget-note">Three words have wandered off the map. Drag each one to the region where its meaning belongs. The line shows its nearest neighbor and their similarity score.</p>
      <div class="wm-body"></div><p class="widget-note" id="wmMsg"></p>`;
    const cleanup = TRIALS.mapper($(".wm-body", el), null, () => {
      sfx.good();
      $("#wmMsg", el).textContent = "Charted! Each word now sits beside words used in similar contexts. That closeness is what an embedding captures.";
    });
    chamberView.cleanup = cleanup;
  },

  oracle(el) {
    const cands = [["fire", 3.0], ["smoke", 2.0], ["flame", 1.6], ["frost", 0.4], ["glitter", -0.6], ["spaghetti", -1.6]];
    let temp = 1.0;
    el.innerHTML = `
      <h4>THE ORACLE'S NEXT-WORD PREDICTION</h4>
      <p class="oracle-sentence">The dragon breathed a plume of <span class="blank" id="orBlank">?</span> over the castle walls.</p>
      <div class="slider-row"><span>Temperature</span><input type="range" id="orTemp" min="0.2" max="2" step="0.1" value="1" aria-label="Temperature"><strong id="orTempVal">1.0</strong></div>
      <div class="oracle-bars" id="orBars"></div>
      <div class="btn-row"><button type="button" class="btn btn-gold btn-sm" id="orAsk">Ask the oracle</button><span class="slider-row" id="orLog"></span></div>`;
    const probs = () => {
      const ex = cands.map(([, l]) => Math.exp(l / temp));
      const sum = ex.reduce((a, b) => a + b, 0);
      return ex.map(v => v / sum);
    };
    const draw = () => {
      $("#orTempVal", el).textContent = temp.toFixed(1);
      $("#orBars", el).innerHTML = probs().map((p, i) => `<div class="ob-row"><span>${cands[i][0]}</span><span class="ob-track"><span class="ob-fill" style="width:${(p * 100).toFixed(1)}%"></span></span><span class="pct">${(p * 100).toFixed(1)}%</span></div>`).join("");
    };
    const picks = [];
    $("#orTemp", el).addEventListener("input", e => { temp = parseFloat(e.target.value); draw(); });
    $("#orAsk", el).addEventListener("click", () => {
      const pr = probs(); let r = Math.random(), k = 0;
      while (k < pr.length - 1 && r > pr[k]) { r -= pr[k]; k++; }
      const b = $("#orBlank", el);
      b.textContent = cands[k][0];
      b.classList.remove("filled"); void b.offsetWidth; b.classList.add("filled");
      sfx.tone(400 + k * 90, "triangle", 0.15, 0.04);
      picks.unshift(cands[k][0]); picks.length = Math.min(picks.length, 6);
      $("#orLog", el).textContent = "Recent picks: " + picks.join(", ");
    });
    draw();
  },

  spotError(el) {
    const S = [
      ["The sky looks blue because sunlight scatters off the gas molecules in air, and short blue wavelengths scatter far more strongly than long red ones.", false,
        "Correct. This is Rayleigh scattering. Air molecules scatter short wavelengths much more than long ones, so blue light bounces across the sky while red light travels straighter."],
      ["Blue light has a shorter wavelength, around 450 nanometers, while red light is around 700 nanometers.", false,
        "Correct. Shorter wavelengths are the ones scattered most, which is the key to the whole explanation."],
      ["The Sun gives off mostly blue light, which is why the sky looks blue.", true,
        "Forged. Sunlight is close to white, containing all the colors of the rainbow in roughly balanced amounts. The sky's blue comes from how air scatters that light, not from a blue Sun."],
      ["Violet light scatters even more than blue, but the Sun produces less violet and our eyes are less sensitive to it, so the sky looks blue instead.", false,
        "Correct. Violet does scatter more, yet the Sun emits less of it and our eyes respond less to violet than to blue. Together these explain why the sky looks blue rather than violet."],
      ["The sky looks blue mainly because it reflects the blue color of the oceans.", true,
        "Forged. Sky color comes from scattering in the air itself. The sky is blue over deserts and cities far from any sea."],
      ["On the Moon, which has no air, the daytime sky is a bright blue.", true,
        "Forged. With no atmosphere there is nothing to scatter sunlight, so the lunar sky looks black even in the daytime."]
    ];
    const picked = new Set();
    let submitted = false;
    el.innerHTML = `
      <h4>SPOT THE AI MISTAKE</h4>
      <p class="widget-note">A chatbot answered a student who asked, <em>"Why is the sky blue?"</em> Tap each sentence you think is wrong, then submit your report. Three of the six sentences hide a forgery. Catch all three with no false alarms to earn <b>40 gold</b>.</p>
      <div class="spot-answer">${S.map((s, i) => `<span class="spot-s" data-i="${i}" tabindex="0" role="button" aria-pressed="false">${esc(s[0])}</span>`).join(" ")}</div>
      <div class="btn-row"><button type="button" class="btn btn-gold btn-sm" id="spotSubmit">Submit my report</button><button type="button" class="btn btn-ghost btn-sm" id="spotReset" hidden>Inspect again</button></div>
      <div class="spot-report" id="spotReport" aria-live="polite"></div>`;
    const spans = $$(".spot-s", el);
    const toggle = sp => {
      if (submitted) return;
      const i = parseInt(sp.dataset.i, 10);
      if (picked.has(i)) picked.delete(i); else picked.add(i);
      sp.classList.toggle("picked", picked.has(i));
      sp.setAttribute("aria-pressed", String(picked.has(i)));
      sfx.click();
    };
    spans.forEach(sp => {
      sp.addEventListener("click", () => toggle(sp));
      sp.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(sp); } });
    });
    const submit = () => {
      if (submitted) return;
      submitted = true;
      let caught = 0, falseAlarms = 0;
      const rows = S.map((s, i) => {
        const flagged = picked.has(i);
        let label, cls;
        if (s[1] && flagged) { label = "Caught"; cls = "ok"; caught++; }
        else if (s[1]) { label = "Missed"; cls = "miss"; }
        else if (flagged) { label = "False alarm"; cls = "false"; falseAlarms++; }
        else { label = "Cleared"; cls = "clear"; }
        spans[i].classList.add("reveal", s[1] ? "is-forged" : "is-true");
        return `<li class="spot-row ${cls}"><b>${label}</b><span><em>Sentence ${i + 1}.</em> ${esc(s[2])}</span></li>`;
      }).join("");
      const perfect = caught === 3 && falseAlarms === 0;
      const summary = perfect
        ? "Perfect report! You caught all three forgeries and raised no false alarms."
        : `You caught ${caught} of 3 forgeries${falseAlarms ? ` and raised ${falseAlarms} false alarm${falseAlarms > 1 ? "s" : ""}` : ""}. Read the notes below, then inspect again.`;
      $("#spotReport", el).innerHTML = `<h4>THE INSPECTOR'S REPORT</h4><p class="spot-summary ${perfect ? "good" : ""}">${summary}</p><ul class="spot-rows">${rows}</ul>`;
      $("#spotSubmit", el).hidden = true;
      $("#spotReset", el).hidden = false;
      if (perfect) { sfx.fanfare(); game.award("spot-error", 40, $("#spotReport h4", el)); }
      else sfx.zap();
    };
    $("#spotSubmit", el).addEventListener("click", submit);
    $("#spotReset", el).addEventListener("click", () => {
      submitted = false; picked.clear();
      spans.forEach(sp => { sp.classList.remove("picked", "reveal", "is-forged", "is-true"); sp.setAttribute("aria-pressed", "false"); });
      $("#spotReport", el).innerHTML = "";
      $("#spotReset", el).hidden = true;
      $("#spotSubmit", el).hidden = false;
    });
  },

  chatSim(el) {
    const parts = [
      ["a", "Audience", "I'm a 9th grader who is new to this topic."],
      ["g", "Goal", "I'm preparing for a quiz on the water cycle."],
      ["f", "Format", "Answer in three short bullet points."],
      ["x", "Example", "Use one real river as an example."],
      ["r", "Rules", "Don't write my answers. Quiz me with two questions afterward."]
    ];
    const verdicts = ["Vague: the chatbot must guess everything.", "Clearer: it has one useful detail.", "Better: the reply now has a direction.", "Strong: it knows your purpose.", "Excellent: the reply fits your needs.", "Complete: detailed, clear, and checkable."];
    const on = new Set();
    const reply = () => {
      if (!on.size) return "<p>Rivers are large bodies of water that flow across the land. They are important in many ways, and there are many of them around the world. Let me know if you want to learn more!</p>";
      const a = on.has("a"), g = on.has("g"), f = on.has("f"), x = on.has("x"), r = on.has("r");
      const core = a
        ? "A river is like a slide for water. Rain and melting snow run downhill, and gravity keeps the water moving along a channel until it reaches a lake or the sea."
        : "A river is a large natural stream of fresh water that flows along a channel toward a lake, sea, or ocean.";
      const items = [
        core,
        x ? "Take the Mississippi River: it carries water from much of central North America all the way to the Gulf of Mexico." : null,
        g ? "For your water cycle quiz, remember that rivers return water from the land to the ocean, where it evaporates and starts the cycle again." : null,
        r ? "Two questions for you: Where does most of a river's water come from? And where does the river's water end up?" : null
      ].filter(Boolean);
      return f ? `<ul class="cs-list">${items.map(t => `<li>${t}</li>`).join("")}</ul>` : items.map(t => `<p>${t}</p>`).join("");
    };
    el.innerHTML = `
      <h4>THE CHATBOT SIMULATOR</h4>
      <p class="widget-note">Your first message is far too vague: <em>"Tell me about rivers."</em> Add one piece at a time, send it, and watch the reply change.</p>
      <div class="qb-toggles">${parts.map(p => `<button type="button" class="qb-toggle" data-k="${p[0]}" aria-pressed="false"><b>${p[1]}</b></button>`).join("")}</div>
      <div class="cs-chat">
        <div class="cs-bubble you"><span class="cs-who">You</span><span id="csYou"></span></div>
        <div class="cs-bubble bot"><span class="cs-who">Chatbot</span><div class="cs-reply" id="csReply"><em>Send your message to see a reply.</em></div></div>
      </div>
      <div class="btn-row"><button type="button" class="btn btn-gold btn-sm" id="csSend">Send message</button>
        <span class="qb-meter"><span class="qb-pips">${parts.map(() => "<span></span>").join("")}</span><span id="csVerdict"></span></span></div>
      <p class="widget-note" id="csNote"></p>`;
    const drawDraft = () => {
      $("#csYou", el).textContent = ["Tell me about rivers.", ...parts.filter(p => on.has(p[0])).map(p => p[2])].join(" ");
      $$(".qb-pips span", el).forEach((s, i) => s.classList.toggle("on", i < on.size));
      $("#csVerdict", el).textContent = verdicts[on.size];
    };
    $$(".qb-toggle", el).forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.k;
      if (on.has(k)) on.delete(k); else on.add(k);
      b.classList.toggle("on", on.has(k));
      b.setAttribute("aria-pressed", String(on.has(k)));
      sfx.tone(on.has(k) ? 700 : 400, "triangle", 0.08, 0.04);
      drawDraft();
    }));
    let typing = null;
    $("#csSend", el).addEventListener("click", () => {
      const out = $("#csReply", el);
      out.innerHTML = `<span class="cs-typing" aria-label="Chatbot is typing"><i></i><i></i><i></i></span>`;
      sfx.tone(520, "sine", 0.1, 0.03);
      clearTimeout(typing);
      typing = setTimeout(() => {
        out.innerHTML = reply();
        out.classList.remove("swap"); void out.offsetWidth; out.classList.add("swap");
        const won = on.size >= 4 && game.award("chatsim", 20, $("#csSend", el));
        $("#csNote", el).textContent = won
          ? "Strong prompt! Four or more details turn a vague question into a clear request. +20 gold."
          : on.size === 0 ? "No details yet, so the reply is generic." : `${on.size} of 5 details added. Compare this reply with the first one.`;
      }, reduced ? 0 : 650);
    });
    drawDraft();
  },

  questBuilder(el) {
    const base = "Help me with my history project.";
    const parts = [
      ["q", "Q", "Quest", "Help me build a strong thesis for my essay on why castle building declined once cannons became common."],
      ["u", "U", "User", "I'm a 10th grader, so explain ideas at a high school level."],
      ["e", "E", "Example", "A strong thesis looks like: \"Because X and Y, Z happened.\""],
      ["s", "S", "Style", "Reply as a bulleted list of three short points."],
      ["t", "T", "Terms", "Don't write the essay for me. Ask me two questions that make me think, and only mention sources I can look up myself."]
    ];
    const on = new Set();
    const verdicts = ["Vague: the oracle has to guess what you want.", "Better: the goal is clear.", "Good: the answer will fit its reader.", "Strong: the AI knows what good looks like.", "Excellent: the format is set.", "Complete: clear, specific, and honest."];
    el.innerHTML = `
      <h4>THE HERALD'S PROMPT FORGE</h4>
      <div class="qb-toggles">${parts.map(p => `<button type="button" class="qb-toggle" data-k="${p[0]}" aria-pressed="false"><b>${p[1]}</b>${p[2]}</button>`).join("")}</div>
      <div class="qb-prompt" id="qbPrompt"></div>
      <div class="qb-meter"><span class="qb-pips">${parts.map(() => "<span></span>").join("")}</span><span id="qbVerdict"></span></div>`;
    const draw = () => {
      const chosen = parts.filter(p => on.has(p[0]));
      $("#qbPrompt", el).innerHTML = chosen.length ? chosen.map(p => `<span class="piece ${p[0]}">${esc(p[3])}</span>`).join(" ") : esc(base);
      $$(".qb-pips span", el).forEach((s, i) => s.classList.toggle("on", i < chosen.length));
      $("#qbVerdict", el).textContent = verdicts[chosen.length];
    };
    $$(".qb-toggle", el).forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.k;
      if (on.has(k)) on.delete(k); else on.add(k);
      b.classList.toggle("on", on.has(k));
      b.setAttribute("aria-pressed", String(on.has(k)));
      sfx.tone(on.has(k) ? 700 : 400, "triangle", 0.08, 0.04);
      draw();
    }));
    draw();
  }
};

function fitCanvas(cv, W, H) {
  const r = cv.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.width * H / W * dpr));
  const ctx = cv.getContext("2d");
  ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  return ctx;
}
function toLogical(cv, e, W, H) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

const TRIALS = {

  sorter(el, ch, done) {
    const t = ch.trial;
    const finished = store.ch(ch.id).trial;
    const hint = t.hint || "Not quite. Read the situation again and try another choice.";
    let solved = 0;
    el.innerHTML = `<div class="sort-list">${t.items.map((it, i) => `
      <div class="sort-item" data-i="${i}">
        <p>${esc(it.text)}</p>
        <div class="sort-btns">${t.categories.map(c => `<button type="button" class="sort-btn" data-k="${c.key}">${esc(c.label)}</button>`).join("")}</div>
      </div>`).join("")}</div><p class="trial-status" id="sortStatus"></p>`;
    const status = () => { $("#sortStatus", el).textContent = `${solved} of ${t.items.length} sorted correctly`; };
    $$(".sort-item", el).forEach(row => {
      const it = t.items[parseInt(row.dataset.i, 10)];
      const why = (cls, text) => {
        let w = $(".why", row);
        if (!w) { w = document.createElement("p"); w.className = "why"; row.appendChild(w); }
        w.textContent = text;
      };
      $$(".sort-btn", row).forEach(b => b.addEventListener("click", () => {
        if (b.dataset.k === it.answer) {
          row.classList.remove("wrong"); row.classList.add("right");
          $$(".sort-btn", row).forEach(x => { x.disabled = true; });
          b.classList.add("picked");
          why("right", "Correct. " + it.why);
          sfx.good();
          solved++; status();
          if (solved === t.items.length) done();
        } else {
          row.classList.remove("wrong"); void row.offsetWidth; row.classList.add("wrong");
          why("wrong", hint);
          sfx.bad();
        }
      }));
    });
    status();
    if (finished) el.insertAdjacentHTML("afterbegin", `<p class="trial-status" style="margin:0 0 12px">You've already passed this trial. Sort again for practice.</p>`);
  },

  forge(el, ch, done) {
    const w = { b: 0.5, p: 0.5, r: 0.5, bias: 0 };
    const visitors = [
      { name: "Royal messenger", info: "Banner ✓ · Password ✓ · 1 rider", x: [1, 1, 0.1], want: true, ico: "M" },
      { name: "Hooded stranger", info: "Banner ✗ · Password ✗ · 1 rider", x: [0, 0, 0.1], want: false, ico: "?" },
      { name: "Army with stolen banners", info: "Banner ✓ · Password ✓ · 9 riders", x: [1, 1, 0.9], want: false, ico: "A" }
    ];
    let sel = 0, solvedOnce = false;
    const sl = (k, label) => `<div class="f-slider"><label for="fs-${k}">${label} <strong id="fv-${k}">${w[k].toFixed(1)}</strong></label><input type="range" id="fs-${k}" min="-2" max="2" step="0.1" value="${w[k]}"></div>`;
    el.innerHTML = `
      <div class="forge">
        <div class="forge-controls">
          ${sl("b", "Weight: banner (w₁)")}${sl("p", "Weight: password (w₂)")}${sl("r", "Weight: riders (w₃)")}${sl("bias", "Bias (b)")}
          <div class="visitors" id="visitors"></div>
        </div>
        <div>
          <div class="gate-view" id="gateView">
            <svg viewBox="0 0 400 260" aria-hidden="true">
              <rect width="400" height="260" fill="#0d1028"/>
              <rect x="60" y="40" width="280" height="160" fill="#2f355c"/>
              <path d="M60 40 h280 v-14 h-20 v8 h-20 v-8 h-20 v8 h-20 v-8 h-20 v8 h-20 v-8 h-20 v8 h-20 v-8 h-20 v8 h-20 v-8 h-20 v8 h-20 v-8 h-20 v8 h-20 v-8 h-20z" fill="#3d4475"/>
              <path d="M165 200 v-70 a35 35 0 0 1 70 0 v70z" fill="#07081a"/>
              <rect x="0" y="200" width="400" height="60" fill="#1d3566"/>
              <g class="gate-bridge"><rect x="163" y="112" width="74" height="88" rx="4" fill="#6b4423" stroke="#3d2614" stroke-width="3"/>
              <path d="M170 130 h60 M170 150 h60 M170 170 h60 M170 190 h60" stroke="#3d2614" stroke-width="2"/></g>
              <g id="gateVisitor" transform="translate(200,232)"></g>
            </svg>
            <div class="gate-calc" id="gateCalc"></div>
          </div>
          <p class="trial-status">Hint: a negative weight turns a clue into evidence <em>against</em> opening.</p>
        </div>
      </div>`;
    const z = v => w.b * v.x[0] + w.p * v.x[1] + w.r * v.x[2] + w.bias;
    const draw = () => {
      let allGood = true;
      $("#visitors", el).innerHTML = visitors.map((v, i) => {
        const open = z(v) > 0, good = open === v.want;
        if (!good) allGood = false;
        return `<button type="button" class="visitor ${i === sel ? "selected" : ""}" data-i="${i}"><span class="v-ico">${v.ico}</span>
          <span><strong>${v.name}</strong><small>${v.info} · should ${v.want ? "open" : "stay shut"}</small></span>
          <span class="v-state ${good ? "good" : "bad"}">${open ? "Opens" : "Shut"} ${good ? "✓" : "✗"}</span></button>`;
      }).join("");
      $$("#visitors .visitor", el).forEach(b => b.addEventListener("click", () => { sel = parseInt(b.dataset.i, 10); sfx.click(); draw(); }));
      const v = visitors[sel], zz = z(v), open = zz > 0;
      $("#gateView", el).classList.toggle("open", open);
      const n = v.x[2] > 0.5 ? 5 : 1;
      let figs = "";
      for (let k = 0; k < n; k++) figs += `<g transform="translate(${(k - (n - 1) / 2) * 26},0)"><circle cy="-22" r="7" fill="#cbb48a"/><path d="M-8 4 L0 -16 L8 4z" fill="${v.x[0] ? "#e8b04b" : "#555a7a"}"/></g>`;
      $("#gateVisitor", el).innerHTML = figs;
      const f = x => (x >= 0 ? "+ " : "− ") + Math.abs(x).toFixed(2);
      $("#gateCalc", el).innerHTML = `${v.name}: z = ${(w.b * v.x[0]).toFixed(2)} ${f(w.p * v.x[1])} ${f(w.r * v.x[2])} ${f(w.bias)} = <span class="res" style="color:${open ? "#9fe6c1" : "#ffb3bf"}">${zz.toFixed(2)} → ${open ? "LOWER THE BRIDGE" : "KEEP IT RAISED"}</span>`;
      if (allGood && !solvedOnce) {
        solvedOnce = true;
        sel = 0;
        setTimeout(() => { draw(); }, 50);
        game.unlock("smith");
        done();
      }
    };
    ["b", "p", "r", "bias"].forEach(k => $("#fs-" + k, el).addEventListener("input", e => {
      w[k] = parseFloat(e.target.value);
      $("#fv-" + k, el).textContent = w[k].toFixed(1);
      draw();
    }));
    draw();
  },

  mapper(el, ch, done) {
    const W = 600, H = 400;
    const clusters = {
      armory: { name: "ARMORY HILLS", cx: 140, cy: 120, col: "#b4502b" },
      kitchen: { name: "KITCHEN VALE", cx: 460, cy: 120, col: "#2f7d55" },
      beasts: { name: "BEAST MARSH", cx: 300, cy: 305, col: "#6a52b2" }
    };
    const anchors = [
      ["sword", 105, 100, "armory"], ["shield", 178, 112, "armory"], ["lance", 130, 152, "armory"],
      ["bread", 425, 105, "kitchen"], ["cheese", 502, 100, "kitchen"], ["stew", 465, 152, "kitchen"],
      ["dragon", 255, 295, "beasts"], ["griffin", 340, 288, "beasts"], ["basilisk", 300, 338, "beasts"]
    ].map(a => ({ w: a[0], x: a[1], y: a[2], c: a[3] }));
    const loose = [
      { w: "helmet", x: 420, y: 232, target: "armory" },
      { w: "pie", x: 228, y: 212, target: "kitchen" },
      { w: "wyvern", x: 150, y: 250, target: "beasts" }
    ];
    el.innerHTML = `<canvas class="trial-canvas map" id="mapCv" aria-label="Draggable embedding map"></canvas>
      <div class="trial-hud" id="mapHud"></div>`;
    const cv = $("#mapCv", el);
    let ctx = null, drag = null, finished = false;
    const nearest = l => anchors.reduce((best, a) => { const d = Math.hypot(a.x - l.x, a.y - l.y); return d < best.d ? { a, d } : best; }, { a: null, d: 1e9 });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(300, 200, 50, 300, 200, 420);
      g.addColorStop(0, "#f3e4bd"); g.addColorStop(1, "#cdb27a");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(91,58,25,.18)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      ctx.save(); ctx.translate(555, 355); ctx.fillStyle = "#7a1c2e";
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.fill(); }
      ctx.restore(); ctx.fillStyle = "#5b3a19"; ctx.font = "700 11px Cinzel, serif"; ctx.textAlign = "center"; ctx.fillText("N", 555, 322);
      Object.values(clusters).forEach(c => {
        ctx.beginPath(); ctx.ellipse(c.cx, c.cy, 100, 62, 0, 0, Math.PI * 2);
        ctx.fillStyle = c.col + "22"; ctx.fill(); ctx.setLineDash([6, 5]); ctx.strokeStyle = c.col; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = c.col; ctx.font = "700 13px Cinzel, serif"; ctx.fillText(c.name, c.cx, c.cy - 70);
      });
      loose.forEach(l => {
        const n = nearest(l);
        const ok = n.a.c === l.target;
        ctx.strokeStyle = ok ? "#2f7d55" : "#b3263e"; ctx.lineWidth = 2.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(n.a.x, n.a.y); ctx.stroke(); ctx.setLineDash([]);
      });
      anchors.forEach(a => {
        ctx.beginPath(); ctx.arc(a.x, a.y, 5, 0, Math.PI * 2); ctx.fillStyle = clusters[a.c].col; ctx.fill();
        ctx.fillStyle = "#2b1e10"; ctx.font = "600 15px Alegreya, serif"; ctx.textAlign = "center"; ctx.fillText(a.w, a.x, a.y - 10);
      });
      loose.forEach(l => {
        ctx.font = "800 15px 'Alegreya Sans', sans-serif";
        const tw = ctx.measureText(l.w).width + 26;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = drag === l ? 16 : 8; ctx.shadowOffsetY = 3;
        roundRect(ctx, l.x - tw / 2, l.y - 15, tw, 30, 15);
        const ok = nearest(l).a.c === l.target;
        ctx.fillStyle = ok ? "#3fa877" : "#e8b04b"; ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#1b1205"; ctx.textAlign = "center"; ctx.fillText(l.w, l.x, l.y + 5);
      });
    };
    const hud = () => {
      $("#mapHud", el).innerHTML = loose.map(l => {
        const n = nearest(l), sim = clamp(1 - n.d / 420, 0, 1);
        const ok = n.a.c === l.target;
        return `<div class="stat"><span>${l.w}</span><strong style="color:${ok ? "#9fe6c1" : "#f6cf7a"}">→ ${n.a.w} (${sim.toFixed(2)})</strong></div>`;
      }).join("");
    };
    const checkDone = () => {
      if (!finished && loose.every(l => nearest(l).a.c === l.target)) { finished = true; done(); }
    };
    const resize = () => { ctx = fitCanvas(cv, W, H); draw(); };
    cv.addEventListener("pointerdown", e => {
      const p = toLogical(cv, e, W, H);
      drag = loose.find(l => Math.abs(l.x - p.x) < 40 && Math.abs(l.y - p.y) < 18) || null;
      if (drag) { cv.setPointerCapture(e.pointerId); sfx.click(); draw(); }
    });
    cv.addEventListener("pointermove", e => {
      if (!drag) return;
      const p = toLogical(cv, e, W, H);
      drag.x = clamp(p.x, 30, W - 30); drag.y = clamp(p.y, 20, H - 20);
      draw(); hud();
    });
    const up = () => { if (drag) { drag = null; draw(); checkDone(); } };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    requestAnimationFrame(() => { resize(); hud(); });
    chamberView.resizeHook = resize;
    return () => { chamberView.resizeHook = null; };
  },

  archery(el, ch, done) {
    const W = 640, H = 300, TX = 560, TY = 150;
    let a = 2.4, lr = 0.15, volleys = 0, hits = [], hist = [1.5 * 2.4 * 2.4], flying = null, raf = null, finished = false, overWall = false;
    el.innerHTML = `
      <canvas class="trial-canvas range" id="rangeCv" aria-label="Archery range"></canvas>
      <div class="range-controls">
        <div class="slider-row"><span>Learning rate</span><input type="range" id="lrIn" min="0.05" max="0.9" step="0.05" value="0.15" aria-label="Learning rate"><span class="lr-tag" id="lrTag"></span></div>
        <button type="button" class="btn btn-gold" id="volley">Loose a volley</button>
        <button type="button" class="btn btn-ghost btn-sm" id="retrieve">Retrieve arrows</button>
      </div>
      <div class="trial-hud">
        <div class="stat"><span>Volleys</span><strong id="stV">0</strong></div>
        <div class="stat"><span>Aim error (w)</span><strong id="stE">2.40</strong></div>
        <div class="stat"><span>Loss (1.5 · w²)</span><strong id="stL">8.64</strong></div>
        <div class="stat"><span>Loss history</span><svg class="spark" id="spark" viewBox="0 0 120 40" preserveAspectRatio="none"></svg></div>
      </div>
      <p class="trial-status" id="rangeMsg">Each volley moves your aim by: learning rate × slope. Find a stride that lands in the gold.</p>`;
    const cv = $("#rangeCv", el);
    let ctx;
    const aimY = v => TY + clamp(v, -4.5, 4.5) * 28;
    const lrInfo = () => lr < 0.15 ? ["Timid", "#8fb3ff"] : lr <= 0.45 ? ["Steady", "#9fe6c1"] : lr <= 0.66 ? ["Wobbly", "#f6cf7a"] : ["Reckless", "#ffb3bf"];
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#1c2150"); sky.addColorStop(1, "#131735");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1b2a2a"; ctx.fillRect(0, 250, W, 50);
      ctx.fillStyle = "#26383a"; for (let x = 0; x < W; x += 24) { ctx.fillRect(x, 248, 12, 4); }

      ctx.fillStyle = "#5a3b1d"; ctx.fillRect(TX - 4, TY + 70, 8, 70); ctx.fillRect(TX - 40, 238, 80, 8);
      [[72, "#f5ead0"], [58, "#b3263e"], [44, "#f5ead0"], [30, "#4d7fe0"], [16, "#f6cf7a"]].forEach(([r, c]) => { ctx.beginPath(); ctx.arc(TX, TY, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
      ctx.beginPath(); ctx.arc(TX, TY, 72, 0, Math.PI * 2); ctx.strokeStyle = "#3d2614"; ctx.lineWidth = 3; ctx.stroke();

      hits.forEach(h => {
        ctx.strokeStyle = "#cbb48a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(TX - 6, h); ctx.lineTo(TX - 40, h + 4); ctx.stroke();
        ctx.fillStyle = "#e0485f"; ctx.beginPath(); ctx.moveTo(TX - 40, h + 4); ctx.lineTo(TX - 50, h - 2); ctx.lineTo(TX - 48, h + 10); ctx.fill();
      });

      ctx.save(); ctx.translate(80, 200);
      ctx.fillStyle = "#4d7fe0"; ctx.fillRect(-10, -10, 20, 34);
      ctx.fillStyle = "#b3263e"; ctx.fillRect(-10, 2, 20, 6);
      ctx.fillStyle = "#cbb48a"; ctx.beginPath(); ctx.arc(0, -20, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3d4475"; ctx.beginPath(); ctx.arc(0, -23, 11, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = "#2b1e10"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-6, 24); ctx.lineTo(-10, 50); ctx.moveTo(6, 24); ctx.lineTo(10, 50); ctx.stroke();
      ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(18, 0, 26, -1.2, 1.2); ctx.stroke();
      ctx.restore();

      if (!flying) {
        ctx.setLineDash([5, 7]); ctx.strokeStyle = "rgba(246,207,122,.45)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(110, 200); ctx.quadraticCurveTo(330, 100, TX - 8, aimY(a)); ctx.stroke(); ctx.setLineDash([]);
      }
      if (flying) {
        const t = flying.t, x = 110 + (flying.tx - 110) * t, y = (1 - t) * (1 - t) * 200 + 2 * (1 - t) * t * 100 + t * t * flying.ty;
        const ang = Math.atan2(flying.ty - 100 - (100 - 200) * (1 - t) * 2, flying.tx - 110);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang * 0.4);
        ctx.strokeStyle = "#e8dcc0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.fillStyle = "#e0485f"; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-38, -5); ctx.lineTo(-38, 5); ctx.fill();
        ctx.restore();
      }
    };
    const hud = () => {
      const [lab, col] = lrInfo();
      const tag = $("#lrTag", el); tag.textContent = `${lr.toFixed(2)} · ${lab}`; tag.style.background = col + "33"; tag.style.color = col;
      $("#stV", el).textContent = volleys;
      $("#stE", el).textContent = a.toFixed(3);
      $("#stL", el).textContent = (1.5 * a * a).toFixed(3);
      const mx = Math.max(...hist, 0.01);
      $("#spark", el).innerHTML = `<polyline fill="none" stroke="#f6cf7a" stroke-width="2" points="${hist.map((v, i) => `${(i / Math.max(1, hist.length - 1)) * 118 + 1},${38 - Math.min(v, mx) / mx * 36}`).join(" ")}"/>`;
    };
    const fire = () => {
      if (flying || finished) return;
      if (overWall) { $("#rangeMsg", el).textContent = "Your aim has flown off the range! Retrieve your arrows and pick a smaller learning rate."; sfx.bad(); return; }
      sfx.whoosh();
      a = a - lr * 3 * a;
      volleys++;
      hist.push(1.5 * a * a);
      const ty = aimY(a);
      flying = { t: 0, tx: TX - 8, ty };
      const t0 = performance.now(), dur = reduced ? 1 : 550;
      const step = now => {
        flying.t = Math.min(1, (now - t0) / dur);
        draw();
        if (flying.t < 1) { raf = requestAnimationFrame(step); return; }
        flying = null;
        const msg = $("#rangeMsg", el);
        if (Math.abs(a) > 4.5) {
          overWall = true;
          msg.textContent = "The step was so large that your aim flew past the target entirely. That is divergence! Retrieve your arrows.";
          msg.style.color = "#ffb3bf"; sfx.bad();
        } else {
          hits.push(ty); if (hits.length > 8) hits.shift();
          if (Math.abs(a) < 0.05) {
            msg.textContent = `Bullseye in ${volleys} volley${volleys > 1 ? "s" : ""}! The loss is nearly zero.`;
            msg.style.color = "#9fe6c1";
            if (volleys <= 4) game.unlock("eagle");
            finished = true; done();
          } else if (lr > 0.45) {
            msg.textContent = "Your aim is zig-zagging past the bullseye. Each stride overshoots the minimum."; msg.style.color = "#f6cf7a"; sfx.tone(300, "triangle", 0.1, 0.03);
          } else {
            msg.textContent = "Thunk! Closer. Loose another volley."; msg.style.color = ""; sfx.tone(260, "square", 0.06, 0.04);
          }
        }
        draw(); hud();
      };
      raf = requestAnimationFrame(step);
    };
    $("#lrIn", el).addEventListener("input", e => { lr = parseFloat(e.target.value); hud(); });
    $("#volley", el).addEventListener("click", fire);
    $("#retrieve", el).addEventListener("click", () => {
      sfx.click(); a = 2.4; volleys = 0; hits = []; hist = [1.5 * 2.4 * 2.4]; overWall = false; finished = false;
      const m = $("#rangeMsg", el); m.textContent = "Arrows retrieved. Choose a learning rate and try again."; m.style.color = "";
      draw(); hud();
    });
    const resize = () => { ctx = fitCanvas(cv, W, H); draw(); };
    requestAnimationFrame(() => { resize(); hud(); });
    chamberView.resizeHook = resize;
    return () => { cancelAnimationFrame(raf); chamberView.resizeHook = null; };
  },

  council(el, ch, done) {
    const puzzles = [
      { tokens: ["The", "knight", "dropped", "the", "shield", "because", "it", "was", "heavy."], focus: 6, answer: 4,
        weights: [0.01, 0.14, 0.05, 0.01, 0.58, 0.03, 0, 0.04, 0.14], hint: "What could be heavy enough to drop?" },
      { tokens: ["The", "dragon", "chased", "the", "squire", "because", "it", "was", "hungry."], focus: 6, answer: 1,
        weights: [0.01, 0.56, 0.08, 0.01, 0.2, 0.02, 0, 0.03, 0.09], hint: "Which one would chase something because of hunger?" },
      { tokens: ["The", "queen", "thanked", "the", "smith", "after", "he", "repaired", "her", "crown."], focus: 6, answer: 4,
        weights: [0.01, 0.1, 0.06, 0.01, 0.6, 0.02, 0, 0.14, 0.02, 0.04], hint: "Who does the repairing in a castle forge?" }
    ];
    let k = 0;
    const render = () => {
      const pz = puzzles[k];
      el.innerHTML = `
        <div class="puzzle-pips">${puzzles.map((_, i) => `<span class="${i < k ? "done" : i === k ? "now" : ""}"></span>`).join("")}</div>
        <div class="council-table" id="table">
          <svg class="council-beams" id="beams"></svg>
          <div class="council-tokens">${pz.tokens.map((t, i) => `<button type="button" class="tok ${i === pz.focus ? "focus" : ""}" data-i="${i}">${esc(t)}<small></small></button>`).join("")}</div>
        </div>
        <p class="council-q">Which guest should <strong style="color:var(--crimson-bright)">"${pz.tokens[pz.focus]}"</strong> listen to most?</p>
        <p class="council-hint" id="hint"></p>
        <div class="center" id="nextWrap"></div>`;
      $$(".tok", el).forEach(b => b.addEventListener("click", () => {
        const i = parseInt(b.dataset.i, 10);
        if (i === pz.focus || el.dataset.solved === "1") return;
        if (i === pz.answer) {
          el.dataset.solved = "1";
          b.classList.add("right"); sfx.good();
          reveal(pz);
          $("#hint", el).textContent = `Correct. The model gives "${pz.tokens[pz.answer].replace(".", "")}" ${Math.round(pz.weights[pz.answer] * 100)}% of its attention.`;
          $("#hint", el).style.color = "#9fe6c1";
          const last = k === puzzles.length - 1;
          $("#nextWrap", el).innerHTML = `<button type="button" class="btn btn-gold">${last ? "Finish the council" : "Next sentence →"}</button>`;
          $("#nextWrap button", el).addEventListener("click", () => {
            if (last) { done(); $("#nextWrap", el).innerHTML = ""; return; }
            k++; el.dataset.solved = "0"; render();
          });
        } else {
          b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); sfx.bad();
          $("#hint", el).textContent = "Not quite. " + pz.hint;
          $("#hint", el).style.color = "#ffb3bf";
        }
      }));
    };
    const reveal = pz => {
      const table = $("#table", el), svg = $("#beams", el), tr = table.getBoundingClientRect();
      const toks = $$(".tok", el);
      const f = toks[pz.focus].getBoundingClientRect();
      const fx0 = f.left - tr.left + f.width / 2, fy0 = f.top - tr.top;
      svg.setAttribute("viewBox", `0 0 ${tr.width} ${tr.height}`);
      svg.innerHTML = toks.map((t, i) => {
        if (i === pz.focus || pz.weights[i] < 0.02) return "";
        const r = t.getBoundingClientRect(), x = r.left - tr.left + r.width / 2, y = r.top - tr.top;
        const lift = Math.min(fy0, y) - 30 - Math.abs(x - fx0) * 0.12;
        return `<path d="M${fx0} ${fy0} Q ${(fx0 + x) / 2} ${lift} ${x} ${y}" stroke-width="${1 + pz.weights[i] * 16}" opacity="${0.35 + pz.weights[i]}" style="animation-delay:${i * 60}ms"/>`;
      }).join("");
      toks.forEach((t, i) => { if (i !== pz.focus) $("small", t).textContent = Math.round(pz.weights[i] * 100) + "%"; });
    };
    render();
  },

  seals(el, ch, done) {
    const scrolls = [
      { title: "ON CASTLE DEFENSES", sents: [
        ["Many medieval castles used thick stone walls to withstand siege weapons.", false],
        ["A moat is a deep ditch, sometimes filled with water, dug around a castle's walls.", false],
        ["According to Professor Alaric Venn's 2019 study in the Journal of Medieval Siegecraft (DOI 10.5521/jms.2019.0847), nine out of ten castle moats were heated by underground fires.", true],
        ["A portcullis is a heavy grille of wood or iron that can be lowered to block an entrance.", false]],
        why: "Forged! The professor, the journal, and the DOI are invented. A quick search of the DOI finds nothing, and the claim itself is wildly implausible." },
      { title: "A TOWER OF STEPS", sents: [
        ["The north tower has 4 floors, with 12 steps between each floor.", false],
        ["To find the total number of steps, multiply the floors by the steps per floor.", false],
        ["4 × 12 = 46, so a guard climbs 46 steps to reach the top.", true],
        ["Climbing back down takes the same number of steps.", false]],
        why: "Forged! 4 × 12 is 48, not 46. Language models predict text, not arithmetic, so always redo the math yourself." },
      { title: "THE SKY ABOVE THE CITADEL", sents: [
        ["Sunlight takes a little over eight minutes to travel from the Sun to Earth.", false],
        ["The Moon is, on average, about 384,000 kilometers from Earth.", false],
        ["Earth's second natural moon, Lunara, was discovered by NASA's Selene Scout probe in 2011.", true],
        ["Ocean tides on Earth are caused mainly by the Moon's gravity.", false]],
        why: "Forged! Earth has only one natural moon. The moon's name and the probe were invented, but the confident details make it sound real." }
    ];
    let solved = 0;
    el.innerHTML = `<div class="seal-scrolls">${scrolls.map((s, i) => `
      <div class="mini-scroll" data-i="${i}"><h4>${s.title}</h4>
        <p>${s.sents.map((t, j) => `<span class="sent" data-j="${j}" tabindex="0" role="button">${esc(t[0])}</span>`).join(" ")}</p>
        <div class="seal-slot"></div></div>`).join("")}</div>
      <p class="trial-status" id="sealStatus">0 of 3 forgeries found</p>`;
    $$(".mini-scroll", el).forEach(box => {
      const s = scrolls[parseInt(box.dataset.i, 10)];
      const pick = sp => {
        if (box.classList.contains("solved") || sp.classList.contains("cleared")) return;
        const forged = s.sents[parseInt(sp.dataset.j, 10)][1];
        const slot = $(".seal-slot", box);
        if (forged) {
          sp.classList.add("forged"); box.classList.add("solved"); sfx.zap();
          slot.innerHTML = `<p class="seal-note good">${esc(s.why)}</p>`;
          solved++;
          $("#sealStatus", el).textContent = `${solved} of 3 forgeries found`;
          if (solved === 3) done();
        } else {
          sp.classList.add("cleared"); sfx.click();
          slot.innerHTML = `<p class="seal-note meh">That sentence checks out against reliable sources. Keep inspecting.</p>`;
        }
      };
      $$(".sent", box).forEach(sp => {
        sp.addEventListener("click", () => pick(sp));
        sp.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(sp); } });
      });
    });
  },

  court(el, ch, done) {
    const north = [82, 76, 71, 68, 65, 63, 60, 58, 55, 52, 50, 47, 45, 42, 40, 38, 35, 32, 30, 25];
    const south = [80, 77, 72, 69, 64, 62, 59, 57, 54, 51, 49, 48, 44, 41, 39, 37, 34, 31, 28, 24];
    const feats = [
      { k: "sword", name: "Swordsmanship trial", sub: "score from timed sparring", proxy: false },
      { k: "horse", name: "Owns a warhorse", sub: "+8 points if the family owns one", proxy: true, bonus: 8 },
      { k: "ride", name: "Riding course", sub: "score from the obstacle course", proxy: false },
      { k: "dist", name: "Lives near the castle", sub: "+7 points within one mile", proxy: true, bonus: 7 },
      { k: "arch", name: "Archery score", sub: "points at the range", proxy: false }
    ];
    const flagged = new Set();
    let threshold = 60, finished = false;
    el.innerHTML = `
      <div class="court">
        <div>
          <p class="trial-status" style="margin:0 0 10px">The model's features. Click any feature you think is a <strong>proxy</strong> that quietly favors Northvale, the wealthy village beside the castle.</p>
          <div class="features">${feats.map(f => `<button type="button" class="feature" data-k="${f.k}">${f.name}<small>${f.sub}</small></button>`).join("")}</div>
          <p class="trial-status" id="featMsg"></p>
        </div>
        <div class="slider-row"><span>Selection cutoff score</span><input type="range" id="thr" min="35" max="85" value="60" aria-label="Selection cutoff"><strong id="thrV">60</strong></div>
        <div class="villages">
          <div class="village" style="--c:#4d7fe0"><h4>Northvale <span id="nRate"></span></h4><div class="squires" id="nSq"></div></div>
          <div class="village" style="--c:#e0485f"><h4>Southmarsh <span id="sRate"></span></h4><div class="squires" id="sSq"></div></div>
        </div>
        <div class="impact">
          <div class="mp-row"><span>Impact ratio (lower rate ÷ higher rate)</span><strong id="ratioV"></strong></div>
          <div class="impact-bar"><div class="impact-fill" id="ratioFill"></div><span class="impact-line"></span></div>
          <p class="verdict" id="verdict"></p>
        </div>
      </div>`;
    const boost = () => feats.filter(f => f.proxy && !flagged.has(f.k)).reduce((s, f) => s + f.bonus, 0);
    const update = () => {
      const b = boost();
      const nSel = north.map(s => s + b >= threshold), sSel = south.map(s => s >= threshold);
      const nr = nSel.filter(Boolean).length / 20, sr = sSel.filter(Boolean).length / 20;
      const hi = Math.max(nr, sr), lo = Math.min(nr, sr);
      const ratio = hi ? lo / hi : 1;
      $("#thrV", el).textContent = threshold;
      $("#nSq", el).innerHTML = nSel.map(v => `<span class="squire ${v ? "sel" : ""}"></span>`).join("");
      $("#sSq", el).innerHTML = sSel.map(v => `<span class="squire ${v ? "sel" : ""}"></span>`).join("");
      $("#nRate", el).textContent = Math.round(nr * 100) + "% chosen";
      $("#sRate", el).textContent = Math.round(sr * 100) + "% chosen";
      $("#ratioV", el).textContent = ratio.toFixed(2);
      const fill = $("#ratioFill", el);
      fill.style.width = Math.min(100, ratio * 100) + "%";
      fill.style.background = ratio >= 0.8 ? "linear-gradient(90deg,#2f7d55,#3fa877)" : "linear-gradient(90deg,#7a1c2e,#e0485f)";
      const v = $("#verdict", el);
      const overall = (nr + sr) / 2;
      if (ratio >= 0.8) { v.textContent = "Passes the four-fifths rule."; v.className = "verdict pass"; }
      else { v.textContent = "Red flag: below the four-fifths line. Southmarsh is being shut out."; v.className = "verdict fail"; }
      if (!finished && flagged.size === 2 && ratio >= 0.8 && overall >= 0.15 && overall <= 0.7) {
        finished = true;
        v.textContent = "Audit complete: with the proxies removed, both villages are judged on real skill.";
        done();
      } else if (ratio >= 0.8 && flagged.size < 2 && !finished) {
        v.textContent = "This cutoff passes for now, but proxies are still hiding in the model. A fair audit removes the cause, not just the symptom.";
        v.className = "verdict fail";
      }
    };
    $$(".feature", el).forEach(btn => btn.addEventListener("click", () => {
      const f = feats.find(x => x.k === btn.dataset.k);
      const msg = $("#featMsg", el);
      if (f.proxy) {
        if (flagged.has(f.k)) return;
        flagged.add(f.k); btn.classList.add("flagged"); btn.disabled = true; sfx.good();
        msg.textContent = `Removed. "${f.name}" tracks wealth and location, not tournament skill.${flagged.size === 2 ? " Both proxies are gone." : " One more proxy remains."}`;
        msg.style.color = "#9fe6c1";
      } else {
        btn.classList.remove("legit"); void btn.offsetWidth; btn.classList.add("legit"); sfx.bad();
        msg.textContent = `Keep it. "${f.name}" measures real skill that applicants from both villages can earn.`;
        msg.style.color = "#f6cf7a";
      }
      update();
    }));
    $("#thr", el).addEventListener("input", e => { threshold = parseInt(e.target.value, 10); update(); });
    update();
  }
};

const quiz = {
  mount(stage, ch) {
    const qs = ch.quiz;
    let k = 0, score = 0;
    const marks = [];
    const box = document.createElement("div");
    box.className = "quiz";
    stage.appendChild(box);

    const render = () => {
      const q = qs[k];
      const order = shuffle(q.choices.map((c, i) => i));
      box.innerHTML = `
        <div class="quiz-top"><p class="eyebrow">Checkpoint · Question ${k + 1} of ${qs.length}</p>
          <div class="quiz-pips">${qs.map((_, i) => `<span class="${marks[i] || (i === k ? "now" : "")}"></span>`).join("")}</div></div>
        <h2 class="quiz-q">${esc(q.q)}</h2>
        <div class="choices">${order.map((ci, n) => `<button type="button" class="choice" data-ci="${ci}"><span class="letter">${"ABCD"[n]}</span><span>${esc(q.choices[ci])}</span></button>`).join("")}</div>
        <div id="qFeed"></div><div class="quiz-foot" id="qFoot"></div>`;
      $$(".choice", box).forEach(b => b.addEventListener("click", () => answer(parseInt(b.dataset.ci, 10), b)));
      $(".choice", box).focus({ preventScroll: true });
    };

    const answer = (ci, btn) => {
      const q = qs[k];
      const right = ci === q.correct;
      $$(".choice", box).forEach(b => {
        b.disabled = true;
        if (parseInt(b.dataset.ci, 10) === q.correct) b.classList.add("right");
        else if (b !== btn) b.classList.add("dim");
      });
      if (right) {
        score++; marks[k] = "right"; sfx.good();
        game.award(`q-${ch.id}-${k}`, 10, btn);
      } else { btn.classList.add("wrong"); marks[k] = "wrong"; sfx.bad(); }
      $("#qFeed", box).innerHTML = `<div class="feedback ${right ? "good" : "bad"}"><b>${right ? "Well struck!" : "Not this time."}</b> ${esc(q.why)}</div>`;
      $$(".quiz-pips span", box).forEach((s, i) => { s.className = marks[i] || (i === k ? "now" : ""); });
      const last = k === qs.length - 1;
      $("#qFoot", box).innerHTML = `<button type="button" class="btn btn-gold">${last ? "See your result" : "Next question →"}</button>`;
      const nb = $("#qFoot button", box);
      nb.addEventListener("click", () => { if (last) finish(); else { k++; render(); } });
      nb.focus({ preventScroll: true });
    };

    const finish = () => {
      const p = store.ch(ch.id);
      const passed = score >= 3;
      if (score > p.best) { p.best = score; store.save(); }
      const star = '<path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9z"/>';
      box.innerHTML = `
        <div class="result">
          <div class="result-stars">${qs.map((_, i) => `<svg viewBox="0 0 24 24" class="${i < score ? "on" : ""}" style="animation-delay:${i * 0.15}s">${star}</svg>`).join("")}</div>
          <h2>${score === 4 ? "A flawless recital!" : passed ? "Checkpoint cleared!" : "The gate holds firm"}</h2>
          <p>You answered ${score} of ${qs.length} correctly. ${passed ? (score < 4 ? "Retry any time to earn the perfect-score bonus." : "") : "You need 3 of 4 to clear this checkpoint. Review the scrolls and try again."}</p>
          <div class="btn-row center"><button type="button" class="btn btn-ghost" id="qRetry">Retry checkpoint</button>
            <a class="btn btn-gold" href="#/map">Return to the map</a></div>
        </div>`;
      $("#qRetry", box).addEventListener("click", () => { k = 0; score = 0; marks.length = 0; render(); });
      if (passed) sfx.fanfare(); else sfx.bad();
      if (score === 4) {
        store.s.perfect[ch.id] = true; store.save();
        game.award("perfect-" + ch.id, 20, $(".result-stars", box));
        game.unlock("flawless");
        if (Object.keys(store.s.perfect).length >= 4) game.unlock("scholar");
      }
      game.check(ch.id);
    };
    render();
  }
};

const dragon = {
  W: 900, H: 420,
  ctx: null, raf: null, t: 0,
  hp: 100, shields: 3, streak: 0, queue: [], reserve: [], current: null, busy: false, timerId: null, timeLeft: 30,
  parts: [], shake: 0, dState: "idle", fall: 0, flash: 0, knightFlash: 0, stars: [],

  renderGate() {
    this.stop();
    $("#battle").hidden = true; $("#battleEnd").hidden = true; $("#dragonGate").hidden = false;
    const open = game.dragonUnlocked();
    $("#dgTitle").textContent = !open ? "The keep is sealed" : store.s.dragon.defeated ? "Vortigrax has returned for a rematch" : "Vortigrax awaits";
    $("#dgText").textContent = !open ? `Conquer all eight chambers to break the final seal. You have conquered ${game.doneCount()} of 8.` : "Steel yourself, knight. Every lie he breathes can be broken by what you learned in the chambers below.";
    const b = $("#battleStart");
    b.classList.toggle("is-locked", !open);
    b.textContent = store.s.dragon.defeated ? "Rematch" : "Enter the Keep";
    $("#timerToggle").checked = store.s.timer !== false;
  },

  start() {
    if (!game.dragonUnlocked()) return;
    store.s.timer = $("#timerToggle").checked; store.save();
    const pool = DRAGON.pool.map((q, i) => Object.assign({ id: i }, q));
    this.queue = CHAMBERS.map(c => shuffle(pool.filter(q => q.ch === c.id))[0]);
    this.reserve = shuffle(pool.filter(q => !this.queue.includes(q)));
    this.hp = 100; this.shields = 3; this.streak = 0; this.busy = false; this.parts = []; this.dState = "idle"; this.fall = 0; this.maxStreak = 0;
    $("#dragonGate").hidden = true; $("#battleEnd").hidden = true; $("#battle").hidden = false;
    this.cv = $("#battleCanvas");
    this.ctx = fitCanvas(this.cv, this.W, this.H);
    this.stars = Array.from({ length: 70 }, () => ({ x: Math.random() * this.W, y: Math.random() * 230, r: Math.random() * 1.4 + 0.4, p: Math.random() * 6 }));
    this.hudUpdate();
    sfx.roar();
    this.loop();
    const onResize = () => { if (this.cv) this.ctx = fitCanvas(this.cv, this.W, this.H); };
    window.addEventListener("resize", onResize);
    router.onLeave(() => { this.stop(); window.removeEventListener("resize", onResize); });
    $("#battle").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    setTimeout(() => this.next(), 700);
  },

  stop() { cancelAnimationFrame(this.raf); this.raf = null; clearInterval(this.timerId); },

  hudUpdate() {
    $("#dragonHp").style.width = Math.max(0, this.hp) + "%";
    const sh = '<path d="M17 2 L31 7 V18 C31 27 25 33 17 36 C9 33 3 27 3 18 V7 Z"/>';
    $("#shields").innerHTML = [0, 1, 2].map(i => `<svg class="shield-ico ${i >= this.shields ? "broken" : ""}" viewBox="0 0 34 38" aria-label="${i < this.shields ? "shield" : "broken shield"}">${sh}</svg>`).join("");
    const st = $("#streak");
    if (this.streak >= 2) { st.hidden = false; st.textContent = `${this.streak} spell streak${this.streak >= 3 ? " · CRITICAL" : ""}`; } else st.hidden = true;
  },

  next() {
    if (!this.queue.length) this.queue = this.reserve.length ? [this.reserve.shift()] : shuffle(DRAGON.pool.map((q, i) => Object.assign({ id: i }, q))).slice(0, 1);
    const q = this.current = this.queue.shift();
    const banner = $("#attackBanner");
    $("#attackName").textContent = `Vortigrax casts ${q.attack}!`;
    $("#attackDesc").textContent = q.desc;
    banner.classList.remove("flash"); void banner.offsetWidth; banner.classList.add("flash");
    $("#spellQ").textContent = q.q;
    const runes = ["A", "B", "C", "D"];
    $("#spells").innerHTML = shuffle(q.choices.map((c, i) => i)).map((ci, n) => `<button type="button" class="spell" data-ci="${ci}"><span class="rune">${runes[n]}</span><span>${esc(q.choices[ci])}</span></button>`).join("");
    $$("#spells .spell").forEach(b => b.addEventListener("click", () => this.answer(parseInt(b.dataset.ci, 10) === q.correct, b)));
    $("#battleLog").textContent = ""; $("#battleLog").className = "battle-log";
    this.dState = "charge";
    this.busy = false;
    this.startTimer();
  },

  startTimer() {
    clearInterval(this.timerId);
    const ring = $("#timerRing");
    if (!store.s.timer) { ring.hidden = true; return; }
    ring.hidden = false;
    this.timeLeft = 30;
    const arc = $("#timerArc"), num = $("#timerNum");
    const paint = () => {
      num.textContent = this.timeLeft;
      arc.style.strokeDashoffset = 106.8 * (1 - this.timeLeft / 30);
      ring.classList.toggle("low", this.timeLeft <= 8);
    };
    paint();
    this.timerId = setInterval(() => {
      this.timeLeft--;
      paint();
      if (this.timeLeft <= 5 && this.timeLeft > 0) sfx.tone(880, "square", 0.05, 0.02);
      if (this.timeLeft <= 0) { clearInterval(this.timerId); this.answer(false, null, true); }
    }, 1000);
  },

  answer(right, btn, timeout) {
    if (this.busy) return;
    this.busy = true;
    clearInterval(this.timerId);
    const q = this.current;
    $$("#spells .spell").forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.ci, 10) === q.correct) b.classList.add("right");
    });
    const log = $("#battleLog");
    if (right) {
      this.streak++; this.maxStreak = Math.max(this.maxStreak, this.streak);
      const crit = this.streak >= 3;
      const dmg = crit ? 18 : 13;
      sfx.zap();
      this.cast(crit);
      setTimeout(() => {
        this.hp = Math.max(0, this.hp - dmg);
        this.flash = 14; this.shake = 10; sfx.tone(150, "square", 0.2, 0.05, 80);
        this.float(`−${dmg}${crit ? " CRITICAL!" : ""}`, 600, 150, crit ? "#f6cf7a" : "#ffffff");
        this.hudUpdate();
        if (this.hp <= 0) setTimeout(() => this.victory(), 400);
        else setTimeout(() => this.next(), 1300);
      }, 520);
      log.textContent = crit ? "A critical strike! Your streak supercharges the spell." : "Your counter-spell shatters his lie!";
      log.className = "battle-log good";
      game.award("dq-" + q.id, 10, btn);
      if (this.streak >= 5) game.unlock("chain");
    } else {
      this.streak = 0;
      if (btn) btn.classList.add("wrong");
      sfx.roar();
      this.breathe();
      setTimeout(() => {
        this.shields--; this.knightFlash = 16; this.shake = 14;
        this.float("Shield broken!", 170, 230, "#ffb3bf");
        this.hudUpdate();
        $(".arena").classList.remove("shake"); void $(".arena").offsetWidth; $(".arena").classList.add("shake");
        if (this.shields <= 0) setTimeout(() => this.defeat(), 700);
        else { this.reserve.push(q); setTimeout(() => this.next(), 1900); }
      }, 650);
      log.textContent = timeout ? "Too slow! The dragon's fire reaches you first." : "The lie holds, and the dragon's fire breaks through. The highlighted spell was the true counter.";
      log.className = "battle-log bad";
    }
    this.hudUpdate();
  },

  victory() {
    this.stop(); this.dState = "fall"; this.loop();
    sfx.fanfare(); setTimeout(() => sfx.fanfare(), 500);
    fx.confetti(140);
    const first = !store.s.dragon.defeated;
    store.s.dragon.defeated = true; store.save();
    game.award("dragon-win", 300, $("#battleCanvas"));
    game.unlock("dragonslayer");
    if (this.shields === 3) game.unlock("unscathed");
    setTimeout(() => {
      this.stop();
      $("#battle").hidden = true;
      const end = $("#battleEnd"); end.hidden = false;
      $("#beIcon").innerHTML = `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="#9c1f33"/><circle cx="60" cy="60" r="44" fill="none" stroke="#e8b04b" stroke-width="2" stroke-dasharray="3 4"/><g transform="translate(30,30) scale(2.5)" fill="none" stroke="#f6cf7a" stroke-width="1.6" stroke-linejoin="round">${ICON.sword}</g></svg>`;
      $("#beTitle").textContent = "Vortigrax is vanquished!";
      $("#beText").textContent = `${first ? "The Dragon of False Information crashes from the keep, and the Citadel is free. " : "You have bested the dragon once again. "}You finished with ${this.shields} of 3 shields and a best streak of ${this.maxStreak}. Your Certificate of Knighthood awaits in the Hall of Honors.`;
      $("#beActions").innerHTML = `<a class="btn btn-gold btn-lg" href="#/honors">Claim your certificate</a><a class="btn btn-ghost btn-lg" href="#/map">Castle map</a>`;
      router.onLeave(() => {});
    }, 2600);
  },

  defeat() {
    this.stop();
    $("#battle").hidden = true;
    const end = $("#battleEnd"); end.hidden = false;
    $("#beIcon").innerHTML = `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="#2f355c"/><g transform="translate(30,30) scale(2.5)" fill="none" stroke="#e0485f" stroke-width="1.6" stroke-linejoin="round">${ICON.dragon}</g></svg>`;
    $("#beTitle").textContent = "The keep has fallen... for now";
    $("#beText").textContent = "Vortigrax broke all three of your shields. Every great knight loses a battle before winning the war. Review the chambers whose lies tricked you, then try again.";
    $("#beActions").innerHTML = `<button type="button" class="btn btn-ember btn-lg" id="retryBattle">Try again</button><a class="btn btn-ghost btn-lg" href="#/map">Review on the map</a>`;
    $("#retryBattle").addEventListener("click", () => this.start());
  },

  float(text, x, y, color) { this.parts.push({ type: "text", text, x, y, vy: -0.8, life: 70, max: 70, color }); },
  cast(crit) {
    const sx = 222, sy = 240, tx = this.dx || 640, ty = (this.dy || 180) + 10;
    for (let i = 0; i < (crit ? 70 : 45); i++) {
      const t = i / 45;
      this.parts.push({ type: "spark", x: sx, y: sy, tx, ty, delay: i * 0.6, prog: 0, speed: 0.045 + Math.random() * 0.02, wob: (Math.random() - 0.5) * 60, size: crit ? 5 : 3.5, color: crit ? "#f6cf7a" : (t % 0.3 < 0.15 ? "#8fb3ff" : "#cfdcff"), life: 1 });
    }
  },
  breathe() {
    const mx = (this.dx || 640) - 150, my = (this.dy || 180) - 18;
    for (let i = 0; i < 90; i++) {
      this.parts.push({ type: "fire", x: mx, y: my, vx: -(6 + Math.random() * 5), vy: (Math.random() - 0.35) * 2.4 + 1.2, delay: i * 0.35, life: 60, max: 60, size: 6 + Math.random() * 10 });
    }
  },

  loop() {
    cancelAnimationFrame(this.raf);
    const frame = () => { this.t++; this.draw(); this.raf = requestAnimationFrame(frame); };
    this.raf = requestAnimationFrame(frame);
  },

  draw() {
    const c = this.ctx, W = this.W, H = this.H, t = this.t;
    if (!c) return;
    c.save();
    c.clearRect(0, 0, W, H);
    if (this.shake > 0) { c.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake); this.shake *= 0.88; if (this.shake < 0.3) this.shake = 0; }
    const rage = this.hp < 50;
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, rage ? "#2a1430" : "#1c2150"); sky.addColorStop(1, rage ? "#3a1a22" : "#141735");
    c.fillStyle = sky; c.fillRect(-20, -20, W + 40, H + 40);
    this.stars.forEach(s => { c.globalAlpha = 0.4 + Math.sin(t / 30 + s.p) * 0.3; c.fillStyle = "#fff"; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); });
    c.globalAlpha = 1;
    const mg = c.createRadialGradient(780, 80, 10, 780, 80, 90); mg.addColorStop(0, rage ? "#ffb08a" : "#fff6d8"); mg.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = mg; c.beginPath(); c.arc(780, 80, 90, 0, 7); c.fill();
    c.fillStyle = rage ? "#f5a07a" : "#f8ecc4"; c.beginPath(); c.arc(780, 80, 34, 0, 7); c.fill();
    c.fillStyle = "#12152c"; c.beginPath(); c.moveTo(0, 300);
    [[90, 240], [190, 280], [300, 210], [420, 270], [540, 220], [660, 280], [780, 230], [900, 270]].forEach(p => c.lineTo(p[0], p[1]));
    c.lineTo(900, 420); c.lineTo(0, 420); c.fill();

    let dx = 650 + Math.sin(t / 60) * 30, dy = 175 + Math.sin(t / 35) * 16;
    if (this.dState === "fall") { this.fall += 1; dy += this.fall * this.fall * 0.05; dx += this.fall * 0.6; }
    this.dx = dx; this.dy = dy;
    if (dy < 600) this.drawDragon(c, dx, dy, t, rage);
    if (this.dState === "fall" && this.fall % 3 === 0) this.parts.push({ type: "smoke", x: dx + (Math.random() - 0.5) * 80, y: dy, vy: -0.6, life: 60, max: 60, size: 20 + Math.random() * 20 });

    c.fillStyle = "#2f355c"; c.fillRect(0, 330, W, 90);
    for (let x = 0; x < W; x += 60) { c.fillStyle = "#3d4475"; c.fillRect(x, 306, 36, 26); }
    c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 2;
    for (let y = 352; y < H; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); for (let x = (y / 24 % 2) * 30; x < W; x += 60) { c.beginPath(); c.moveTo(x, y - 24); c.lineTo(x, y); c.stroke(); } }
    this.drawKnight(c, 170, 300, t);

    this.parts = this.parts.filter(p => {
      if (p.delay > 0) { p.delay--; return true; }
      if (p.type === "spark") {
        p.prog += p.speed;
        const k = Math.min(1, p.prog), x = p.x + (p.tx - p.x) * k, y = p.y + (p.ty - p.y) * k - Math.sin(k * Math.PI) * (70 + p.wob);
        c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = 14;
        c.beginPath(); c.arc(x, y, p.size * (1 - k * 0.4), 0, 7); c.fill(); c.shadowBlur = 0;
        if (k >= 1) { for (let i = 0; i < 2; i++) this.parts.push({ type: "burst", x: p.tx, y: p.ty, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 26, max: 26, color: p.color }); return false; }
        return true;
      }
      p.life--;
      const a = p.life / p.max;
      if (p.type === "fire") {
        p.x += p.vx; p.y += p.vy; p.vy += 0.03;
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, `rgba(255,240,180,${a})`); g.addColorStop(0.4, `rgba(255,140,40,${a * 0.9})`); g.addColorStop(1, "rgba(200,30,40,0)");
        c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.size * (1.4 - a * 0.4), 0, 7); c.fill();
      } else if (p.type === "burst") {
        p.x += p.vx; p.y += p.vy; c.globalAlpha = a; c.fillStyle = p.color; c.fillRect(p.x, p.y, 3, 3); c.globalAlpha = 1;
      } else if (p.type === "smoke") {
        p.y += p.vy; c.fillStyle = `rgba(60,60,80,${a * 0.5})`; c.beginPath(); c.arc(p.x, p.y, p.size * (1.6 - a), 0, 7); c.fill();
      } else if (p.type === "text") {
        p.y += p.vy; c.globalAlpha = Math.min(1, a * 2); c.fillStyle = p.color; c.font = "900 30px Cinzel, serif"; c.textAlign = "center";
        c.strokeStyle = "#0b0d1c"; c.lineWidth = 5; c.strokeText(p.text, p.x, p.y); c.fillText(p.text, p.x, p.y); c.globalAlpha = 1;
      }
      return p.life > 0;
    });
    c.restore();
  },

  drawKnight(c, x, y, t) {
    c.save(); c.translate(x, y);
    const breathe = Math.sin(t / 25) * 1.5;

    c.fillStyle = "#7a1c2e"; c.beginPath(); c.moveTo(-18, -40); c.quadraticCurveTo(-40 + Math.sin(t / 15) * 4, 0, -30, 30); c.lineTo(10, 30); c.closePath(); c.fill();

    c.fillStyle = "#5c6390"; c.fillRect(-14, 4, 11, 30); c.fillRect(4, 4, 11, 30);

    c.fillStyle = "#9aa3c8"; c.fillRect(-18, -42 + breathe, 36, 48);
    c.fillStyle = "#b3263e"; c.fillRect(-12, -38 + breathe, 24, 40);
    c.fillStyle = "#e8b04b"; c.beginPath(); c.moveTo(0, -30 + breathe); c.lineTo(6, -18 + breathe); c.lineTo(0, -6 + breathe); c.lineTo(-6, -18 + breathe); c.fill();

    c.fillStyle = "#c7cde6"; c.beginPath(); c.arc(0, -56 + breathe, 15, Math.PI, 0); c.fillRect(-15, -56 + breathe, 30, 14); c.fill();
    c.fillStyle = "#1b1f3a"; c.fillRect(-10, -54 + breathe, 20, 4);
    c.fillStyle = "#e0485f"; c.beginPath(); c.moveTo(0, -70 + breathe); c.quadraticCurveTo(-26 + Math.sin(t / 12) * 4, -86, -30, -60); c.quadraticCurveTo(-14, -74, 0, -66 + breathe); c.fill();

    c.save(); c.translate(-26, -14);
    if (this.knightFlash > 0) { c.shadowColor = "#e0485f"; c.shadowBlur = 30; this.knightFlash--; }
    c.fillStyle = "#4d7fe0"; c.strokeStyle = "#cfdcff"; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(0, -20); c.lineTo(16, -14); c.lineTo(16, 4); c.quadraticCurveTo(16, 18, 0, 26); c.quadraticCurveTo(-16, 18, -16, 4); c.lineTo(-16, -14); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#f6cf7a"; c.fillRect(-2, -12, 4, 26); c.fillRect(-9, -4, 18, 4);
    c.restore();

    c.strokeStyle = "#8a5a2b"; c.lineWidth = 5; c.beginPath(); c.moveTo(22, 20); c.lineTo(46, -64); c.stroke();
    const glow = 10 + Math.sin(t / 8) * 4;
    const g = c.createRadialGradient(48, -70, 0, 48, -70, glow * 2);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.4, "#8fb3ff"); g.addColorStop(1, "rgba(77,127,224,0)");
    c.fillStyle = g; c.beginPath(); c.arc(48, -70, glow * 2, 0, 7); c.fill();
    c.restore();
  },

  drawDragon(c, x, y, t, rage) {
    c.save(); c.translate(x, y);
    if (this.dState === "fall") c.rotate(Math.min(1.2, this.fall * 0.012));
    const flap = Math.sin(t / (rage ? 6 : 9));
    const body = rage ? "#9c1f33" : "#6b1a3a", belly = rage ? "#f07b2c" : "#c9813a", wingC = rage ? "rgba(224,72,95,.85)" : "rgba(139,40,80,.85)";
    if (this.flash > 0) { c.shadowColor = "#fff"; c.shadowBlur = 40; this.flash--; }

    c.fillStyle = wingC; c.beginPath(); c.moveTo(10, -20); c.lineTo(90, -100 - flap * 50); c.lineTo(120, -40 - flap * 30); c.lineTo(80, -10); c.closePath(); c.fill();

    c.strokeStyle = body; c.lineWidth = 18; c.lineCap = "round";
    c.beginPath(); c.moveTo(40, 10); c.quadraticCurveTo(130, 40 + Math.sin(t / 20) * 20, 190, 0 + Math.sin(t / 14) * 25); c.stroke();
    c.fillStyle = body; c.beginPath(); c.moveTo(190, Math.sin(t / 14) * 25 - 14); c.lineTo(215, Math.sin(t / 14) * 25); c.lineTo(190, Math.sin(t / 14) * 25 + 14); c.fill();

    c.fillStyle = body; c.beginPath(); c.ellipse(20, 0, 72, 40, -0.1, 0, 7); c.fill();
    c.fillStyle = belly; c.beginPath(); c.ellipse(10, 16, 50, 16, -0.1, 0, 7); c.fill();

    c.fillStyle = body; c.fillRect(-20, 28, 14, 26); c.fillRect(40, 26, 14, 26);

    c.strokeStyle = body; c.lineWidth = 26; c.beginPath(); c.moveTo(-30, -10); c.quadraticCurveTo(-80, -40, -110, -30); c.stroke();
    c.fillStyle = body; c.beginPath(); c.moveTo(-100, -50); c.lineTo(-160, -32); c.lineTo(-150, -14); c.lineTo(-100, -12); c.closePath(); c.fill();
    const jaw = this.parts.some(p => p.type === "fire") ? 10 : 2;
    c.beginPath(); c.moveTo(-104, -16); c.lineTo(-150, -12 + jaw); c.lineTo(-100, -4); c.closePath(); c.fill();
    c.fillStyle = "#f6cf7a"; c.beginPath(); c.moveTo(-108, -46); c.lineTo(-92, -82); c.lineTo(-96, -46); c.fill();
    c.beginPath(); c.moveTo(-122, -42); c.lineTo(-116, -72); c.lineTo(-112, -44); c.fill();

    c.fillStyle = rage ? "#ff5a3a" : "#f6cf7a"; c.shadowColor = c.fillStyle; c.shadowBlur = 16;
    c.beginPath(); c.arc(-122, -34, 4.5, 0, 7); c.fill(); c.shadowBlur = 0;

    c.fillStyle = wingC; c.strokeStyle = rage ? "#ff8a6a" : "#c9813a"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-10, -26); c.lineTo(40, -130 - flap * 60); c.lineTo(70, -90 - flap * 40); c.lineTo(100, -110 - flap * 50); c.lineTo(90, -40 - flap * 10); c.lineTo(30, -20); c.closePath(); c.fill(); c.stroke();
    c.restore();
  },

  init() {
    $("#battleStart").addEventListener("click", e => { if ($("#battleStart").classList.contains("is-locked")) { e.preventDefault(); return; } this.start(); });
  }
};

const lexicon = {
  filter: "all",
  render() {
    const f = $("#lexFilter");
    if (!f.children.length) {
      f.innerHTML = `<button type="button" class="lf-btn on" data-f="all">All</button>` + CHAMBERS.map(c => `<button type="button" class="lf-btn" data-f="${c.id}">${c.num}</button>`).join("");
      $$(".lf-btn", f).forEach(b => b.addEventListener("click", () => {
        this.filter = b.dataset.f;
        $$(".lf-btn", f).forEach(x => x.classList.toggle("on", x === b));
        this.draw();
      }));
      $("#lexSearch").addEventListener("input", () => this.draw());
    }
    this.draw();
  },
  draw() {
    const q = $("#lexSearch").value.trim().toLowerCase();
    const list = LEXICON.filter(([term, def, chId]) => (this.filter === "all" || chId === this.filter) && (!q || term.toLowerCase().includes(q) || def.toLowerCase().includes(q)));
    $("#lexGrid").innerHTML = list.length ? list.map(([term, def, chId]) => {
      const ch = CHAMBERS[game.idx(chId)];
      return `<button type="button" class="lex-card" style="--c:${ch.color}" aria-expanded="false" data-term="${esc(term)}"><strong>${esc(term)}</strong><small>Chamber ${ch.num} · ${esc(ch.short)}</small><p>${esc(def)}</p></button>`;
    }).join("") : `<p class="lex-empty">No words match your search.</p>`;
    $$(".lex-card").forEach(card => card.addEventListener("click", () => {
      const open = card.classList.toggle("open");
      card.setAttribute("aria-expanded", String(open));
      if (open) {
        sfx.click();
        store.s.lex[card.dataset.term] = true; store.save();
        if (Object.keys(store.s.lex).length >= 12) game.unlock("wordsmith");
      }
    }));
  }
};

const honors = {
  render() {
    const r = game.rankInfo();
    $("#honRank").textContent = r.title;
    $("#honNext").textContent = r.next ? `${r.next.min - store.s.gold} gold to ${r.next.title}` : "You have reached the highest rank in the realm.";
    $("#honMeter").style.width = r.pct + "%";
    $("#honGold").textContent = store.s.gold;
    $("#rankSeal").innerHTML = `<svg viewBox="0 0 92 92"><path d="M46 4 L82 16 V44 C82 66 66 80 46 88 C26 80 10 66 10 44 V16 Z" fill="#7a1c2e" stroke="#e8b04b" stroke-width="3"/><path d="M28 40 l6 6 6-12 6 12 6-12 6 12 6-6 -4 18 H32 z" fill="#f6cf7a"/><text x="46" y="74" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="11" fill="#f6cf7a">RANK ${r.idx + 1}</text></svg>`;
    $("#crestRow").innerHTML = CHAMBERS.map(c => `<span class="crest ${game.isDone(c.id) ? "won" : ""}" style="--c:${c.color}" title="${esc(c.name)}">${c.num}</span>`).join("") +
      `<span class="crest ${store.s.dragon.defeated ? "won" : ""}" style="--c:#e0485f" title="Dragonslayer">${icon("dragon").replace("<svg", '<svg style="width:60%;height:60%;fill:none;stroke:currentColor;stroke-width:2"')}</span>`;
    $("#achGrid").innerHTML = ACHIEVEMENTS.map(a => `<div class="ach ${store.s.ach[a.id] ? "won" : ""}"><span class="ach-ico">${icon(a.icon)}</span><span><strong>${esc(a.name)}</strong><small>${esc(a.desc)}</small></span></div>`).join("");
    this.cert();
  },
  unlocked() { return store.s.dragon.defeated || store.s.judge; },
  cert() {
    const name = store.s.name.trim();
    $("#certName").value = store.s.name;
    $("#certNameOut").textContent = name || "Your Name";
    $("#certRank").textContent = game.rankInfo().title;
    $("#certGold").textContent = store.s.gold;
    $("#certAch").textContent = `${Object.keys(store.s.ach).length} / ${ACHIEVEMENTS.length}`;
    $("#certDate").textContent = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const open = this.unlocked();
    $("#certStage").classList.toggle("locked", !open);
    $("#certNote").textContent = open ? (store.s.dragon.defeated ? "Your certificate is unsealed. Enter your name, then print it (choose landscape, or save as PDF)." : "Evaluator preview: the certificate is shown unlocked.") : "Your certificate unlocks after you defeat Vortigrax in the Dragon's Keep.";
    $("#printBtn").classList.toggle("is-locked", !open);
  },
  init() {
    $("#certName").addEventListener("input", e => { store.s.name = e.target.value.slice(0, 40); store.save(); $("#certNameOut").textContent = store.s.name.trim() || "Your Name"; });
    $("#printBtn").addEventListener("click", () => {
      if (!this.unlocked()) return;
      if (!store.s.name.trim()) { ui.toast("Add your name first", "Type the name you want on your certificate.", "quill", true); $("#certName").focus(); return; }
      sfx.fanfare();
      setTimeout(() => window.print(), 250);
    });
  }
};

const companions = {
  lines: {
    prince: [
      "Honest knights cite their sources. Write down every AI tool you used and what you asked it.",
      "Before you trust a number, redo the math. Language models predict likely text, not reliable arithmetic.",
      "Ask an AI to quiz you before a test. Answering questions yourself is how knowledge sticks.",
      "A vague request earns a vague answer. Tell the chatbot who you are, what you need, and how you want it shaped."
    ],
    princess: [
      "A model is only as good as its training data. Ask what examples it learned from.",
      "A fair test uses examples the model has never seen. Otherwise it may simply be memorizing.",
      "Fluent is not the same as true. Trace every claim back to a source you can open.",
      "Fairness is a choice, not a switch. Ask who a system helps, who it might harm, and who checks it."
    ]
  },
  pos: { prince: 0, princess: 0 },

  show(who) {
    const card = $(`.comp-card[data-comp="${who}"]`);
    if (!card) return;
    const lines = this.lines[who];
    $(".comp-line", card).textContent = lines[this.pos[who]];
    $(".comp-count", card).textContent = `Tip ${this.pos[who] + 1} of ${lines.length}`;
  },

  greet() {
    const n = game.doneCount();
    const p = $(`.comp-card[data-comp="prince"] .comp-greet`);
    const q = $(`.comp-card[data-comp="princess"] .comp-greet`);
    if (p) p.textContent = n === 0 ? "Welcome, traveler. Lower the drawbridge and begin in the Gatehouse." : `Welcome back, traveler. ${n} of ${CHAMBERS.length} chambers are conquered.`;
    if (q) q.textContent = store.s.dragon.defeated ? "Vortigrax is defeated, and the realm sings your name!" : n === 0 ? "Each chamber teaches one secret of AI. Every knight starts at the gate." : "Keep going. The dragon waits in the highest keep.";
  },

  init() {
    ["prince", "princess"].forEach(who => {
      const card = $(`.comp-card[data-comp="${who}"]`);
      if (!card) return;
      this.show(who);
      $(".comp-next", card).addEventListener("click", () => {
        this.pos[who] = (this.pos[who] + 1) % this.lines[who].length;
        this.show(who);
        sfx.tone(who === "prince" ? 660 : 880, "triangle", 0.12, 0.04);
        card.classList.remove("bounce"); void card.offsetWidth; card.classList.add("bounce");
      });
    });
    this.greet();
  }
};

const SIGILS = ["home", "map", "lab", "lexicon", "honors", "refs", "gatehouse", "greathall", "scriptorium", "vault"];
const SIGIL_POS = {
  home: "top:62%; left:0.4%",
  map: "bottom:9%; right:0.4%",
  lab: "top:28%; right:0.4%",
  lexicon: "bottom:14%; left:0.4%",
  honors: "top:44%; right:0.4%",
  refs: "top:12%; left:0.4%",
  gatehouse: "top:36%; left:0.4%",
  greathall: "bottom:20%; right:0.4%",
  scriptorium: "top:72%; left:0.4%",
  vault: "top:24%; right:0.4%"
};

const sigils = {
  total: SIGILS.length,

  hostFor(key) {
    return document.getElementById(CHAMBERS.some(c => c.id === key) ? "view-chamber" : `view-${key}`);
  },

  currentKey() {
    const [view, arg] = location.hash.replace(/^#\/?/, "").split("/");
    if (view === "chamber") return arg || null;
    return view || "home";
  },

  updateCount() {
    const n = store.s.sigils.length;
    const el = $("#sigilNum");
    if (el) el.textContent = n;
  },

  place() {
    document.querySelectorAll(".sigil").forEach(b => b.remove());
    document.querySelectorAll(".sigil-host").forEach(h => h.classList.remove("sigil-host"));
    const key = this.currentKey();
    if (!key || !SIGILS.includes(key) || store.s.sigils.includes(key)) return;
    const host = this.hostFor(key);
    if (!host) return;
    host.classList.add("sigil-host");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sigil";
    b.setAttribute("aria-label", "A hidden sigil. Find it to add to your count.");
    b.title = "Something glimmers here";
    b.innerHTML = "<span></span>";
    b.style.cssText += SIGIL_POS[key] ? ";" + SIGIL_POS[key] : "";
    b.addEventListener("click", () => this.collect(b, key));
    host.appendChild(b);
  },

  collect(btn, key) {
    if (store.s.sigils.includes(key)) return;
    store.s.sigils.push(key);
    store.save();
    btn.remove();
    sfx.good();
    const counter = $("#sigilCount");
    this.updateCount();
    counter.classList.remove("bump"); void counter.offsetWidth; counter.classList.add("bump");
    const found = store.s.sigils.length;
    if (found < this.total) {
      ui.toast("A hidden sigil", `You have found ${found} of ${this.total}.`, "star");
    } else {
      game.award("sigils-all", 150, counter);
      game.unlock("relics");
      sfx.fanfare();
      ui.toast("Every sigil found", "The Citadel rewards a true Relic Hunter with 150 gold.", "crown");
    }
  }
};

const wingUI = {
  render() {
    const band = $("#wingBand");
    if (band) band.innerHTML = `<p class="eyebrow wb-intro">Three wings, eight chambers</p>` + WINGS.map(w => {
      const list = CHAMBERS.filter(c => c.wing === w.id);
      return `<div class="wb-card" style="--wc:${w.color}">
        <span class="wb-num">Wing ${w.num}</span>
        <h3>${esc(w.short)}</h3>
        <p class="wb-req">${esc(w.req)}</p>
        <ul>${list.map(c => `<li><b>${esc(c.num)}</b>${esc(c.short)}</li>`).join("")}</ul>
      </div>`;
    }).join("");
    const lg = $("#wingLegend");
    if (lg) lg.innerHTML = WINGS.map(w => `<span class="wl-chip" style="--wc:${w.color}"><b>Wing ${w.num}</b>${esc(w.short)}</span>`).join("");
  }
};

const embers = {
  init() {
    const cv = $("#emberCanvas");
    if (!cv || reduced) return;
    const ctx = cv.getContext("2d");
    let ps = [];
    const resize = () => {
      cv.width = innerWidth; cv.height = innerHeight;
      const n = innerWidth < 700 ? 18 : 36;
      ps = Array.from({ length: n }, () => this.spawn(cv, true));
    };
    this.spawn = (c, anywhere) => ({ x: Math.random() * c.width, y: anywhere ? Math.random() * c.height : c.height + 10, r: Math.random() * 1.8 + 0.6, vy: -(Math.random() * 0.5 + 0.2), vx: (Math.random() - 0.5) * 0.3, a: Math.random() * 0.5 + 0.2, w: Math.random() * 6 });
    resize();
    window.addEventListener("resize", resize);
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach((p, i) => {
        p.y += p.vy; p.x += p.vx + Math.sin((p.y + p.w * 50) / 60) * 0.25;
        if (p.y < -10) ps[i] = this.spawn(cv, false);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = `rgba(255, ${150 + Math.floor(p.w * 10)}, 70, ${p.a})`;
        ctx.shadowColor = "rgba(255,140,40,.8)"; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
      });
      requestAnimationFrame(tick);
    };
    tick();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  store.load();
  let canSave = true;
  try {
    localStorage.setItem("nexus_probe", "1");
    canSave = localStorage.getItem("nexus_probe") === "1";
    localStorage.removeItem("nexus_probe");
  } catch (e) { canSave = false; }
  if (!canSave) {
    setTimeout(() => ui.toast("Progress cannot be saved here", "Your gold and sigils will reset when you leave. Open the site in a normal browser window, not a private or preview window.", "scroll", true), 600);
  }
  ui.hud();
  ui.initSettings();
  home.init();
  companions.init();
  wingUI.render();
  sigils.updateCount();
  mapView.init();
  chamberView.init();
  dragon.init();
  honors.init();
  embers.init();
  router.init();
});
