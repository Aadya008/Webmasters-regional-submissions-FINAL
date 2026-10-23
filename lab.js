"use strict";

const sigm = z => 1 / (1 + Math.exp(-z));
const lerp = (a, b, t) => a + (b - a) * t;
const LC = {
  gold: "#f6cf7a", crimson: "#e0485f", blue: "#8fb3ff", green: "#3fa877", violet: "#b9a6ff", teal: "#5fd3c1",
  text: "#c9c2dc", dim: "#6f6988", grid: "rgba(255,255,255,.06)", axis: "rgba(255,255,255,.3)", bg: "#0d1028"
};
function seeded(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
const normCdf = (x, m, s) => 0.5 * (1 + erf((x - m) / (s * Math.SQRT2)));

function plotFrame(ctx, W, H, P, xLabel, yLabel) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = LC.bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = LC.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = P.l + (W - P.l - P.r) * i / 10, y = P.t + (H - P.t - P.b) * i / 10;
    ctx.beginPath(); ctx.moveTo(x, P.t); ctx.lineTo(x, H - P.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(W - P.r, y); ctx.stroke();
  }
  ctx.strokeStyle = LC.axis; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(P.l, P.t); ctx.lineTo(P.l, H - P.b); ctx.lineTo(W - P.r, H - P.b); ctx.stroke();
  ctx.fillStyle = LC.text; ctx.font = "700 14px 'Alegreya Sans', sans-serif"; ctx.textAlign = "center";
  if (xLabel) ctx.fillText(xLabel, (P.l + W - P.r) / 2, H - 12);
  if (yLabel) { ctx.save(); ctx.translate(18, (P.t + H - P.b) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore(); }
}

function miniChart(cv, series, opts = {}) {
  const W = 300, H = 100;
  const ctx = fitCanvas(cv, W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = LC.grid; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, H * i / 4); ctx.lineTo(W, H * i / 4); ctx.stroke(); }
  const all = series.flatMap(s => s.data);
  if (!all.length) return;
  const max = opts.max ?? Math.max(...all, 0.0001), min = opts.min ?? 0;
  series.forEach(s => {
    if (s.data.length < 2 && !opts.xCount) return;
    const n = opts.xCount || s.data.length;
    ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.beginPath();
    s.data.forEach((v, i) => {
      const x = 6 + (i / Math.max(1, n - 1)) * (W - 12);
      const y = H - 6 - (clamp(v, min, max) - min) / (max - min || 1) * (H - 12);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  });
  if (opts.marker != null && opts.xCount) {
    const x = 6 + (opts.marker / Math.max(1, opts.xCount - 1)) * (W - 12);
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, H - 4); ctx.stroke(); ctx.setLineDash([]);
  }
}

const segHTML = (name, opts, on) => `<div class="seg" role="group" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" class="seg-b ${v === on ? "on" : ""}" data-v="${v}" aria-pressed="${v === on}">${l}</button>`).join("")}</div>`;
function bindSeg(root, name, fn) {
  const g = $(`[data-seg="${name}"]`, root);
  $$(".seg-b", g).forEach(b => b.addEventListener("click", () => {
    $$(".seg-b", g).forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    sfx.click(); fn(b.dataset.v);
  }));
}

const LAB_MODELS = [

  {
    id: "neuron", name: "Teach a Neuron", icon: "bolt", wing: "foundations", chamber: "armory",
    what: "Watch a single artificial neuron learn to tell knights from bandits, one training step at a time.",
    goal: "Train the neuron until it sorts every rider correctly (100% accuracy with at least 8 riders).",
    tryList: [
      "Press <b>Train</b> and watch the dividing line swing into place as the loss falls.",
      "Click the field to add a knight on the bandits' side. Watch the line struggle to adjust.",
      "Switch to <b>Tangled</b>. Can one straight line ever separate them?",
      "Press <b>New random weights</b> and train again. Does it always find a good line?"
    ],
    explain: `<p>Each dot is a rider described by two numbers: <strong>speed</strong> and <strong>armor shine</strong>. The neuron computes <em>z = w₁·speed + w₂·shine + b</em> and turns it into a probability between 0 and 1 (gold means "knight," red means "bandit").</p>
      <p>Every training step uses <strong>gradient descent</strong>: it measures how wrong each guess is (the <strong>loss</strong>) and nudges the weights to reduce it. The bright line is where the neuron is exactly 50/50.</p>
      <p>On the <strong>Tangled</strong> field, no single straight line works. That limit is exactly why real AI stacks many neurons into <strong>layers</strong>.</p>`,
    mount(st, done) {
      const W = 600, H = 420, P = { l: 50, r: 16, t: 16, b: 44 };
      st.innerHTML = `
        <div class="lab-grid">
          <div class="lab-vis"><canvas class="lab-cv" aria-label="Field of knights and bandits with the neuron's dividing line"></canvas>
            <p class="lab-cap" id="nCap">Click the field to add riders.</p></div>
          <div class="lab-side">
            <div class="lab-ctl"><span class="lab-lbl">Clicking adds a</span>${segHTML("cls", [["1", "Knight"], ["0", "Bandit"]], "1")}</div>
            <div class="lab-ctl"><span class="lab-lbl">Field</span>${segHTML("preset", [["easy", "Easy to split"], ["tangled", "Tangled"], ["clear", "Empty"]], "easy")}</div>
            <div class="btn-row"><button type="button" class="btn btn-gold btn-sm" id="nTrain">▶ Train</button><button type="button" class="btn btn-ghost btn-sm" id="nStep">One step</button><button type="button" class="btn btn-ghost btn-sm" id="nReset">New random weights</button></div>
            <div class="stats3"><div class="stat"><span>Steps</span><strong id="nEp">0</strong></div><div class="stat"><span>Accuracy</span><strong id="nAcc">–</strong></div><div class="stat"><span>Loss</span><strong id="nLoss">–</strong></div></div>
            <div class="eq" id="nEq"></div>
            <div class="lab-chart"><span class="lab-lbl">Loss over time (lower is better)</span><canvas class="lab-mini" id="nChart"></canvas></div>
          </div>
        </div>`;
      const cv = $(".lab-cv", st); let ctx;
      let pts = [], w = [0, 0, 0], ep = 0, hist = [], playing = false, raf = null, cls = 1, preset = "easy";
      const lr = 1.2;
      const px = x => P.l + x * (W - P.l - P.r), py = y => H - P.b - y * (H - P.t - P.b);
      const randW = () => { const r = Math.random; w = [(r() - 0.5) * 4, (r() - 0.5) * 4, (r() - 0.5) * 2]; ep = 0; hist = []; };
      const load = name => {
        preset = name; pts = [];
        const r = seeded(name === "easy" ? 11 : 23);
        const blob = (cx, cy, c, n, sd) => { for (let i = 0; i < n; i++) pts.push({ x: clamp(cx + gauss(r) * sd, 0.04, 0.96), y: clamp(cy + gauss(r) * sd, 0.04, 0.96), c }); };
        if (name === "easy") { blob(0.3, 0.7, 1, 10, 0.1); blob(0.7, 0.3, 0, 10, 0.1); }
        if (name === "tangled") { blob(0.22, 0.22, 1, 5, 0.06); blob(0.78, 0.78, 1, 5, 0.06); blob(0.22, 0.78, 0, 5, 0.06); blob(0.78, 0.22, 0, 5, 0.06); }
        randW();
      };
      const evalAll = () => {
        let L = 0, ok = 0;
        pts.forEach(p => { const pr = sigm(w[0] * (2 * p.x - 1) + w[1] * (2 * p.y - 1) + w[2]); L -= p.c ? Math.log(pr + 1e-9) : Math.log(1 - pr + 1e-9); if ((pr > 0.5) === (p.c === 1)) ok++; });
        return { loss: pts.length ? L / pts.length : 0, acc: pts.length ? ok / pts.length : 0 };
      };
      const step = () => {
        if (!pts.length) return;
        let g = [0, 0, 0];
        pts.forEach(p => { const u = 2 * p.x - 1, v = 2 * p.y - 1, e = sigm(w[0] * u + w[1] * v + w[2]) - p.c; g[0] += e * u; g[1] += e * v; g[2] += e; });
        for (let k = 0; k < 3; k++) w[k] -= lr * g[k] / pts.length;
        ep++; const s = evalAll(); hist.push(s.loss); if (hist.length > 400) hist.shift();
      };
      const draw = () => {
        plotFrame(ctx, W, H, P, "Speed →", "Armor shine →");
        const cols = 30, rows = 20, cw = (W - P.l - P.r) / cols, ch = (H - P.t - P.b) / rows;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const x = (i + 0.5) / cols, y = 1 - (j + 0.5) / rows;
          const pr = sigm(w[0] * (2 * x - 1) + w[1] * (2 * y - 1) + w[2]);
          ctx.fillStyle = pr > 0.5 ? `rgba(246,207,122,${(pr - 0.5) * 0.5})` : `rgba(224,72,95,${(0.5 - pr) * 0.5})`;
          ctx.fillRect(P.l + i * cw, P.t + j * ch, cw + 0.5, ch + 0.5);
        }
        ctx.save(); ctx.beginPath(); ctx.rect(P.l, P.t, W - P.l - P.r, H - P.t - P.b); ctx.clip();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.shadowColor = LC.gold; ctx.shadowBlur = 12; ctx.beginPath();
        if (Math.abs(w[1]) > 1e-4) { const v = u => -(w[0] * u + w[2]) / w[1]; ctx.moveTo(px(0), py((v(-1) + 1) / 2)); ctx.lineTo(px(1), py((v(1) + 1) / 2)); }
        else if (Math.abs(w[0]) > 1e-4) { const u = -w[2] / w[0]; ctx.moveTo(px((u + 1) / 2), py(0)); ctx.lineTo(px((u + 1) / 2), py(1)); }
        ctx.stroke(); ctx.restore();
        pts.forEach(p => {
          const pr = sigm(w[0] * (2 * p.x - 1) + w[1] * (2 * p.y - 1) + w[2]), wrong = (pr > 0.5) !== (p.c === 1);
          ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 8, 0, 7); ctx.fillStyle = p.c ? LC.gold : LC.crimson; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = "#0b0d1c"; ctx.stroke();
          if (wrong && ep) { ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 13, 0, 7); ctx.strokeStyle = "#fff"; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]); }
        });
        const s = evalAll();
        $("#nEp", st).textContent = ep;
        $("#nAcc", st).textContent = pts.length ? Math.round(s.acc * 100) + "%" : "–";
        $("#nLoss", st).textContent = pts.length ? s.loss.toFixed(3) : "–";
        $("#nEq", st).innerHTML = `z = <b>${w[0].toFixed(2)}</b>·speed ${w[1] < 0 ? "−" : "+"} <b>${Math.abs(w[1]).toFixed(2)}</b>·shine ${w[2] < 0 ? "−" : "+"} <b>${Math.abs(w[2]).toFixed(2)}</b>`;
        miniChart($("#nChart", st), [{ data: hist, color: LC.gold }]);
        $("#nCap", st).textContent = preset === "tangled" && ep > 150 && s.acc < 1
          ? "Stuck! No straight line can separate a tangled field. That's why real networks stack neurons in layers."
          : "Click the field to add riders. Dotted rings mark riders the neuron currently gets wrong.";
        if (pts.length >= 8 && s.acc === 1 && ep > 0) done("Every rider sorted correctly. You just watched a neuron learn!");
      };
      const loop = () => { for (let i = 0; i < 3; i++) step(); draw(); if (playing) raf = requestAnimationFrame(loop); };
      const setPlay = on => { playing = on; $("#nTrain", st).textContent = on ? "❚❚ Pause" : "▶ Train"; cancelAnimationFrame(raf); if (on) loop(); };
      bindSeg(st, "cls", v => { cls = +v; });
      bindSeg(st, "preset", v => { setPlay(false); load(v); draw(); });
      $("#nTrain", st).addEventListener("click", () => { sfx.click(); setPlay(!playing); });
      $("#nStep", st).addEventListener("click", () => { sfx.click(); setPlay(false); step(); draw(); });
      $("#nReset", st).addEventListener("click", () => { sfx.click(); setPlay(false); randW(); draw(); });
      cv.addEventListener("pointerdown", e => {
        const p = toLogical(cv, e, W, H);
        if (p.x < P.l || p.x > W - P.r || p.y < P.t || p.y > H - P.b) return;
        pts.push({ x: (p.x - P.l) / (W - P.l - P.r), y: (H - P.b - p.y) / (H - P.t - P.b), c: cls });
        sfx.tone(cls ? 700 : 400, "triangle", 0.08, 0.04); draw();
      });
      const resize = () => { ctx = fitCanvas(cv, W, H); draw(); };
      load("easy");
      requestAnimationFrame(resize);
      window.addEventListener("resize", resize);
      return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }
  },

  {
    id: "fit", name: "Line of Best Fit", icon: "target", wing: "foundations", chamber: "training",
    what: "See error as real squares. Fit a prediction line by hand, then watch gradient descent do it automatically.",
    goal: "Use the sliders to fit the line by hand until your error is within 5% of the best possible.",
    tryList: [
      "Move the <b>slope</b> and <b>starting point</b> sliders. Watch the red squares grow and shrink.",
      "Get your error close to the best possible score by hand.",
      "Press <b>Let gradient descent fit it</b> and watch the line glide into place.",
      "Drag one student far away from the others (an outlier). See how much one big square pulls the line."
    ],
    explain: `<p>Each dot is a student: how many hours they studied, and their test score. The gold line is a <strong>model</strong> that predicts a score from study hours.</p>
      <p>The red squares are the model's <strong>squared errors</strong>. Each square's side is the distance from a dot to the line, so its area is that error squared. The <strong>mean squared error (MSE)</strong> is the average area of all the squares.</p>
      <p>Training means finding the line with the smallest total square area. <strong>Gradient descent</strong> does it by repeatedly nudging the slope and starting point in whichever direction shrinks the squares. Notice how one far-off dot creates a giant square: squaring makes big misses count a lot.</p>`,
    mount(st, done) {
      const W = 600, H = 420, P = { l: 54, r: 16, t: 16, b: 46 };
      st.innerHTML = `
        <div class="lab-grid">
          <div class="lab-vis"><canvas class="lab-cv" aria-label="Scatter plot of study hours and test scores with a prediction line"></canvas>
            <p class="lab-cap">Drag any dot to move a student.</p></div>
          <div class="lab-side">
            <div class="lab-ctl"><label class="lab-lbl" for="fSlope">Slope (points per hour) <b id="fSlopeV"></b></label><input type="range" id="fSlope" min="-4" max="10" step="0.1" value="0"></div>
            <div class="lab-ctl"><label class="lab-lbl" for="fInt">Starting point (score at 0 hours) <b id="fIntV"></b></label><input type="range" id="fInt" min="20" max="100" step="0.5" value="62"></div>
            <div class="btn-row"><button type="button" class="btn btn-gold btn-sm" id="fAuto">Let gradient descent fit it</button><button type="button" class="btn btn-ghost btn-sm" id="fReset">Reset</button></div>
            <div class="stats3"><div class="stat"><span>Your error (MSE)</span><strong id="fMse"></strong></div><div class="stat"><span>Best possible</span><strong id="fBest"></strong></div><div class="stat"><span>Prediction for 6 hours</span><strong id="fPred"></strong></div></div>
            <div class="lab-meter"><span class="lab-lbl">How close are you to the best line?</span><div class="meter big"><span id="fMeter"></span></div><p class="lab-verdict" id="fVerdict"></p></div>
          </div>
        </div>`;
      const cv = $(".lab-cv", st); let ctx;
      const start = [[1, 50], [2, 57], [3, 58], [4, 64], [5, 69], [6, 70], [7, 79], [8, 80], [9, 88]];
      let pts = start.map(([x, y]) => ({ x, y })), m = 0, c = 62, manual = false, raf = null, drag = null;
      const px = x => P.l + x / 10 * (W - P.l - P.r), py = y => H - P.b - (y - 30) / 70 * (H - P.t - P.b);
      const mse = (mm, cc) => pts.reduce((s, p) => s + (p.y - (mm * p.x + cc)) ** 2, 0) / pts.length;
      const best = () => {
        const n = pts.length, mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
        const sxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0), sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
        const bm = sxx ? sxy / sxx : 0; return { m: bm, c: my - bm * mx };
      };
      const sync = () => { $("#fSlope", st).value = m; $("#fInt", st).value = c; };
      const draw = () => {
        plotFrame(ctx, W, H, P, "Hours studied →", "Test score →");
        ctx.fillStyle = LC.dim; ctx.font = "600 12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
        for (let x = 0; x <= 10; x += 2) ctx.fillText(x, px(x), H - P.b + 16);
        ctx.textAlign = "right"; for (let y = 30; y <= 100; y += 10) ctx.fillText(y, P.l - 6, py(y) + 4);
        ctx.save(); ctx.beginPath(); ctx.rect(P.l, P.t, W - P.l - P.r, H - P.t - P.b); ctx.clip();
        pts.forEach(p => {
          const yh = m * p.x + c, side = Math.abs(py(p.y) - py(yh));
          ctx.fillStyle = "rgba(224,72,95,.16)"; ctx.strokeStyle = "rgba(224,72,95,.7)"; ctx.lineWidth = 1.5;
          ctx.fillRect(px(p.x), Math.min(py(p.y), py(yh)), side, side); ctx.strokeRect(px(p.x), Math.min(py(p.y), py(yh)), side, side);
        });
        ctx.strokeStyle = LC.gold; ctx.lineWidth = 3.5; ctx.shadowColor = LC.gold; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(px(0), py(c)); ctx.lineTo(px(10), py(m * 10 + c)); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.restore();
        pts.forEach(p => { ctx.beginPath(); ctx.arc(px(p.x), py(p.y), drag === p ? 10 : 8, 0, 7); ctx.fillStyle = LC.teal; ctx.fill(); ctx.strokeStyle = "#0b0d1c"; ctx.lineWidth = 2; ctx.stroke(); });
        const e = mse(m, c), b = best(), eb = mse(b.m, b.c);
        $("#fSlopeV", st).textContent = m.toFixed(1); $("#fIntV", st).textContent = c.toFixed(1);
        $("#fMse", st).textContent = e.toFixed(1); $("#fBest", st).textContent = eb.toFixed(1);
        $("#fPred", st).textContent = (m * 6 + c).toFixed(0) + " pts";
        const closeness = clamp((eb + 1) / (e + 1), 0, 1);
        $("#fMeter", st).style.width = (closeness * 100) + "%";
        $("#fVerdict", st).textContent = closeness > 0.95 ? "Excellent! That's essentially the best possible line." : closeness > 0.7 ? "Close. Keep adjusting to shrink the squares." : "The squares are big. Tilt and shift the line toward the dots.";
        if (manual && e <= eb * 1.05 + 0.5) done("You fit the line by hand as well as gradient descent would!");
      };
      $("#fSlope", st).addEventListener("input", e => { cancelAnimationFrame(raf); m = +e.target.value; manual = true; draw(); });
      $("#fInt", st).addEventListener("input", e => { cancelAnimationFrame(raf); c = +e.target.value; manual = true; draw(); });
      $("#fAuto", st).addEventListener("click", () => {
        sfx.click(); manual = false; cancelAnimationFrame(raf);
        let a = m / 10, bb = c / 100, k = 0;
        const run = () => {
          for (let s = 0; s < 3; s++) {
            let ga = 0, gb = 0;
            pts.forEach(p => { const X = p.x / 10, e = a * X + bb - p.y / 100; ga += 2 * e * X; gb += 2 * e; });
            a -= 0.9 * ga / pts.length; bb -= 0.9 * gb / pts.length;
          }
          m = a * 10; c = bb * 100; sync(); draw(); k++;
          if (k < 260) raf = requestAnimationFrame(run); else sfx.good();
        };
        run();
      });
      $("#fReset", st).addEventListener("click", () => { sfx.click(); cancelAnimationFrame(raf); pts = start.map(([x, y]) => ({ x, y })); m = 0; c = 62; manual = false; sync(); draw(); });
      cv.addEventListener("pointerdown", e => {
        const p = toLogical(cv, e, W, H);
        drag = pts.find(q => Math.hypot(px(q.x) - p.x, py(q.y) - p.y) < 16) || null;
        if (drag) { cv.setPointerCapture(e.pointerId); draw(); }
      });
      cv.addEventListener("pointermove", e => {
        if (!drag) return;
        const p = toLogical(cv, e, W, H);
        drag.x = clamp((p.x - P.l) / (W - P.l - P.r) * 10, 0.2, 9.8);
        drag.y = clamp(30 + (H - P.b - p.y) / (H - P.t - P.b) * 70, 31, 99);
        draw();
      });
      const up = () => { if (drag) { drag = null; draw(); } };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      const resize = () => { ctx = fitCanvas(cv, W, H); draw(); };
      sync(); requestAnimationFrame(resize);
      window.addEventListener("resize", resize);
      return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }
  },

  {
    id: "network", name: "Inside a Neural Network", icon: "dragon", wing: "foundations", chamber: "armory",
    what: "Flip a creature's features on and off and watch signals flow through a small network that decides: dragon or not?",
    goal: "Test at least three different creatures and watch how the network's decision changes.",
    tryList: [
      "Click <b>Dragon</b>, then <b>Bird</b>. Which hidden neurons light up for each?",
      "Try the <b>Fire lizard</b>. Why is the network unsure?",
      "Turn <b>Breathes fire</b> on and off for any creature. How much does the output change?",
      "Click any circle in the diagram to see the math inside it."
    ],
    explain: `<p>This network has three <strong>layers</strong>. The <strong>inputs</strong> are features of a creature. The three <strong>hidden neurons</strong> each detect a bigger idea: "Is it a flier?", "Is it a reptile?", and "Is it dangerous?" The <strong>output</strong> combines those ideas into one answer.</p>
      <p>Each line is a <strong>weight</strong>. <span class="key-gold">Gold lines</span> push the next neuron up, and <span class="key-blue">blue lines</span> push it down. Thicker lines are stronger weights, and the moving dashes show how much signal is flowing right now.</p>
      <p>In real networks nobody names the hidden neurons. Training discovers useful in-between ideas on its own. We labeled these so you can see the kind of thing hidden layers learn.</p>`,
    mount(st, done) {
      const IN = [{ k: "wings", label: "Has wings" }, { k: "scales", label: "Has scales" }, { k: "fire", label: "Breathes fire" }, { k: "size", label: "Size", slider: true }, { k: "water", label: "Lives in water" }];
      const HID = [{ label: "Flier?", w: { wings: 3, size: 0.5, water: -1 }, b: -1.5 }, { label: "Reptile?", w: { scales: 3, water: 0.5, wings: -0.5 }, b: -1.5 }, { label: "Dangerous?", w: { fire: 4, size: 2 }, b: -2.5 }];
      const OUT = { label: "Dragon?", w: [2.5, 2.5, 3], b: -5 };
      const PRE = {
        "Dragon": { wings: 1, scales: 1, fire: 1, size: 0.9, water: 0 }, "Bird": { wings: 1, scales: 0, fire: 0, size: 0.2, water: 0 },
        "Crocodile": { wings: 0, scales: 1, fire: 0, size: 0.6, water: 1 }, "Griffin": { wings: 1, scales: 0, fire: 0, size: 0.7, water: 0 },
        "Fire lizard": { wings: 0, scales: 1, fire: 1, size: 0.1, water: 0 }, "Sea serpent": { wings: 0, scales: 1, fire: 0, size: 0.9, water: 1 }
      };
      let x = Object.assign({}, PRE.Dragon); const tried = new Set();
      const inY = [60, 130, 200, 270, 340], hidY = [100, 200, 300], X0 = 168, X1 = 368, X2 = 548, OY = 200;
      let edges = "";
      HID.forEach((h, j) => IN.forEach((inp, i) => { if (h.w[inp.k] != null) edges += `<path class="net-edge" data-e="i${i}h${j}" d="M${X0} ${inY[i]} C ${X0 + 90} ${inY[i]}, ${X1 - 90} ${hidY[j]}, ${X1} ${hidY[j]}"/>`; }));
      HID.forEach((h, j) => { edges += `<path class="net-edge" data-e="h${j}o" d="M${X1} ${hidY[j]} C ${X1 + 80} ${hidY[j]}, ${X2 - 80} ${OY}, ${X2} ${OY}"/>`; });
      const node = (id, cx, cy, r) => `<g class="net-node" data-n="${id}" tabindex="0" role="button"><circle cx="${cx}" cy="${cy}" r="${r}" class="nn-bg"/><circle cx="${cx}" cy="${cy}" r="${r}" class="nn-fill"/><text x="${cx}" y="${cy + 5}" class="nn-val"></text></g>`;
      st.innerHTML = `
        <div class="lab-grid">
          <div class="lab-vis">
            <svg class="net-svg" viewBox="0 0 640 400" role="img" aria-label="Neural network diagram">
              <rect width="640" height="400" rx="14" fill="#0d1028"/>
              <text x="${X0}" y="26" class="nn-col">INPUTS</text><text x="${X1}" y="26" class="nn-col">HIDDEN LAYER</text><text x="${X2}" y="26" class="nn-col">OUTPUT</text>
              ${edges}
              ${IN.map((inp, i) => node("i" + i, X0, inY[i], 22) + `<text x="${X0 - 32}" y="${inY[i] + 5}" class="nn-lbl" text-anchor="end">${inp.label}</text>`).join("")}
              ${HID.map((h, j) => node("h" + j, X1, hidY[j], 28) + `<text x="${X1}" y="${hidY[j] + 46}" class="nn-lbl">${h.label}</text>`).join("")}
              ${node("o", X2, OY, 36)}<text x="${X2}" y="${OY + 56}" class="nn-lbl">${OUT.label}</text>
            </svg>
            <p class="lab-cap" id="netInfo">Click any circle to see the math inside it.</p>
          </div>
          <div class="lab-side">
            <div class="lab-ctl"><span class="lab-lbl">Choose a creature</span><div class="chip-row" id="netPre">${Object.keys(PRE).map(k => `<button type="button" class="chip" data-p="${k}">${k}</button>`).join("")}</div></div>
            <div class="lab-ctl"><span class="lab-lbl">Or set the features yourself</span>
              <div class="toggles" id="netTog">${IN.filter(i => !i.slider).map(i => `<button type="button" class="tog" data-k="${i.k}" aria-pressed="false">${i.label}</button>`).join("")}</div>
              <label class="lab-lbl" for="netSize">Size <b id="netSizeV"></b></label><input type="range" id="netSize" min="0" max="1" step="0.05" value="0.9">
            </div>
            <div class="net-out"><span class="lab-lbl">Network's answer</span><strong id="netPct">0%</strong><div class="meter big"><span id="netMeter"></span></div><p class="lab-verdict" id="netVerdict"></p></div>
          </div>
        </div>`;
      const svg = $(".net-svg", st);
      const forward = () => {
        const xs = IN.map(i => x[i.k]);
        const hz = HID.map(h => IN.reduce((s, inp) => s + (h.w[inp.k] || 0) * x[inp.k], h.b)), ha = hz.map(sigm);
        const oz = ha.reduce((s, a, j) => s + OUT.w[j] * a, OUT.b);
        return { xs, hz, ha, oz, oa: sigm(oz) };
      };
      const styleEdge = (id, wgt, act) => {
        const el = $(`[data-e="${id}"]`, svg); if (!el) return;
        const flow = act * Math.abs(wgt);
        el.style.stroke = wgt > 0 ? LC.gold : LC.blue;
        el.style.strokeWidth = 1 + Math.abs(wgt) * 1.1;
        el.style.opacity = 0.15 + Math.min(0.85, flow / 3);
        el.style.animationDuration = (2.6 - Math.min(2.2, flow * 0.6)) + "s";
        el.style.animationPlayState = flow > 0.05 && !reduced ? "running" : "paused";
      };
      const setNode = (id, a, txt) => { const g = $(`[data-n="${id}"]`, svg); $(".nn-fill", g).style.opacity = 0.12 + a * 0.88; $(".nn-val", g).textContent = txt; };
      const update = () => {
        const f = forward();
        IN.forEach((inp, i) => setNode("i" + i, f.xs[i], inp.slider ? f.xs[i].toFixed(2) : (f.xs[i] ? "yes" : "no")));
        HID.forEach((h, j) => { setNode("h" + j, f.ha[j], f.ha[j].toFixed(2)); IN.forEach((inp, i) => { if (h.w[inp.k] != null) styleEdge(`i${i}h${j}`, h.w[inp.k], f.xs[i]); }); styleEdge(`h${j}o`, OUT.w[j], f.ha[j]); });
        setNode("o", f.oa, Math.round(f.oa * 100) + "%");
        $$(".tog", st).forEach(b => { const on = !!x[b.dataset.k]; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
        $("#netSize", st).value = x.size; $("#netSizeV", st).textContent = x.size < 0.34 ? "small" : x.size < 0.67 ? "medium" : "huge";
        $("#netPct", st).textContent = Math.round(f.oa * 100) + "% dragon";
        const meter = $("#netMeter", st); meter.style.width = (f.oa * 100) + "%"; meter.style.background = f.oa > 0.7 ? "linear-gradient(90deg,#a8731f,#f6cf7a)" : f.oa < 0.3 ? "linear-gradient(90deg,#2b4f9e,#8fb3ff)" : "linear-gradient(90deg,#8b6fd6,#b9a6ff)";
        $("#netVerdict", st).textContent = f.oa > 0.7 ? "🐉 Definitely a dragon!" : f.oa < 0.3 ? "Not a dragon." : "Unsure: the evidence is mixed.";
        return f;
      };
      const explainNode = id => {
        const f = forward(); let t;
        if (id[0] === "i") { const i = +id.slice(1); t = `Input "${IN[i].label}" = ${f.xs[i].toFixed(2)}. Inputs are just numbers describing the creature.`; }
        else if (id[0] === "h") { const j = +id.slice(1), h = HID[j]; t = `${h.label} = sigmoid(` + Object.entries(h.w).map(([k, wv]) => `${wv}×${x[k].toFixed(1)}`).join(" + ") + ` ${h.b < 0 ? "−" : "+"} ${Math.abs(h.b)}) = sigmoid(${f.hz[j].toFixed(2)}) = ${f.ha[j].toFixed(2)}`; }
        else t = `Dragon? = sigmoid(` + OUT.w.map((wv, j) => `${wv}×${f.ha[j].toFixed(2)}`).join(" + ") + ` − 5) = sigmoid(${f.oz.toFixed(2)}) = ${f.oa.toFixed(2)}`;
        $("#netInfo", st).textContent = t;
      };
      $$(".chip", st).forEach(b => b.addEventListener("click", () => {
        x = Object.assign({}, PRE[b.dataset.p]); tried.add(b.dataset.p);
        $$(".chip", st).forEach(c => c.classList.toggle("on", c === b));
        const f = update(); sfx.tone(300 + f.oa * 600, "triangle", 0.15, 0.05);
        if (tried.size >= 3) done("You've watched the network judge three creatures. Notice how the hidden layer builds bigger ideas from simple features.");
      }));
      $$(".tog", st).forEach(b => b.addEventListener("click", () => { x[b.dataset.k] = x[b.dataset.k] ? 0 : 1; $$(".chip", st).forEach(c => c.classList.remove("on")); sfx.click(); update(); tried.add("custom-" + b.dataset.k + x[b.dataset.k]); if (tried.size >= 3) done("You've tested three different creatures. Notice how one feature can flip the network's decision."); }));
      $("#netSize", st).addEventListener("input", e => { x.size = +e.target.value; $$(".chip", st).forEach(c => c.classList.remove("on")); update(); });
      $$(".net-node", svg).forEach(g => { g.addEventListener("click", () => explainNode(g.dataset.n)); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); explainNode(g.dataset.n); } }); });
      $(".chip", st).classList.add("on");
      update();
      return () => {};
    }
  },

  {
    id: "cluster", name: "Finding Groups Without Labels", icon: "compass", wing: "foundations", chamber: "gatehouse",
    what: "Watch unsupervised learning discover hidden villages on a map, with nobody telling it the answers.",
    goal: "Run the algorithm until the banners stop moving.",
    tryList: [
      "Press <b>One step</b> a few times and watch each banner march to the center of its group.",
      "Set the number of banners to <b>2</b> or <b>5</b>. What happens when it doesn't match the real number of villages?",
      "Press <b>Drop new banners</b> and run again. Do you always get the same groups?",
      "Press <b>New villages</b> for a fresh map."
    ],
    explain: `<p>The cottages on this map have <strong>no labels</strong>. Nobody tells the computer which village each one belongs to. This is <strong>unsupervised learning</strong>: the machine has to find the groups itself.</p>
      <p>The method shown is called <strong>k-means clustering</strong>. It repeats two simple moves: (1) every cottage joins its nearest banner, then (2) every banner moves to the center of the cottages that joined it. When the banners stop moving, the groups are found.</p>
      <p>Notice that <em>you</em> choose how many groups (k) to look for. Pick the wrong number and the algorithm still gives an answer, just not a sensible one. Real data scientists test several values.</p>`,
    mount(st, done) {
      const W = 600, H = 420, COL = [LC.gold, LC.crimson, LC.blue, LC.green, LC.violet];
      st.innerHTML = `
        <div class="lab-grid">
          <div class="lab-vis"><canvas class="lab-cv" aria-label="Map of unlabeled cottages and moving group banners"></canvas><p class="lab-cap" id="kCap">Each dot is a cottage. The big circles are banners.</p></div>
          <div class="lab-side">
            <div class="lab-ctl"><label class="lab-lbl" for="kK">Number of banners (k) <b id="kKV">3</b></label><input type="range" id="kK" min="2" max="5" step="1" value="3"></div>
            <div class="btn-row"><button type="button" class="btn btn-gold btn-sm" id="kStep">One step</button><button type="button" class="btn btn-gold btn-sm" id="kRun">▶ Run</button></div>
            <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" id="kDrop">Drop new banners</button><button type="button" class="btn btn-ghost btn-sm" id="kNew">New villages</button></div>
            <div class="stats3"><div class="stat"><span>Steps</span><strong id="kSteps">0</strong></div><div class="stat"><span>Avg. distance to banner</span><strong id="kSpread">–</strong></div><div class="stat"><span>Status</span><strong id="kStatus">Ready</strong></div></div>
            <div class="lab-chart"><span class="lab-lbl">Average distance over steps (lower = tighter groups)</span><canvas class="lab-mini" id="kChart"></canvas></div>
          </div>
        </div>`;
      const cv = $(".lab-cv", st); let ctx;
      let pts = [], cents = [], k = 3, steps = 0, hist = [], anim = null, running = false, timer = null, converged = false;
      const village = () => {
        pts = []; const r = Math.random; const centers = [];
        while (centers.length < 3) { const c = { x: 90 + r() * 420, y: 80 + r() * 260 }; if (centers.every(o => Math.hypot(o.x - c.x, o.y - c.y) > 170)) centers.push(c); }
        centers.forEach(c => { for (let i = 0; i < 22; i++) pts.push({ x: clamp(c.x + gauss(r) * 38, 14, W - 14), y: clamp(c.y + gauss(r) * 38, 14, H - 14), g: -1 }); });
      };
      const drop = () => { cents = Array.from({ length: k }, () => ({ x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 80), trail: [] })); pts.forEach(p => { p.g = -1; }); steps = 0; hist = []; converged = false; stopRun(); };
      const spread = () => { const a = pts.filter(p => p.g >= 0); return a.length ? a.reduce((s, p) => s + Math.hypot(p.x - cents[p.g].x, p.y - cents[p.g].y), 0) / a.length : null; };
      const draw = () => {
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = LC.bg; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = LC.grid; for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        pts.forEach(p => { if (p.g < 0) return; ctx.strokeStyle = COL[p.g] + "33"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(cents[p.g].x, cents[p.g].y); ctx.stroke(); });
        cents.forEach((c, i) => { if (c.trail.length) { ctx.strokeStyle = COL[i]; ctx.setLineDash([4, 5]); ctx.lineWidth = 2; ctx.beginPath(); c.trail.forEach((t, j) => j ? ctx.lineTo(t.x, t.y) : ctx.moveTo(t.x, t.y)); ctx.lineTo(c.x, c.y); ctx.stroke(); ctx.setLineDash([]); } });
        pts.forEach(p => {
          ctx.fillStyle = p.g < 0 ? "#8d88a6" : COL[p.g];
          ctx.beginPath(); ctx.moveTo(p.x, p.y - 7); ctx.lineTo(p.x + 6, p.y - 1); ctx.lineTo(p.x + 6, p.y + 6); ctx.lineTo(p.x - 6, p.y + 6); ctx.lineTo(p.x - 6, p.y - 1); ctx.closePath(); ctx.fill();
        });
        cents.forEach((c, i) => {
          ctx.save(); ctx.translate(c.x, c.y);
          ctx.shadowColor = COL[i]; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fillStyle = "#0b0d1c"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = COL[i]; ctx.stroke(); ctx.shadowBlur = 0;
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(-3, -8); ctx.stroke();
          ctx.fillStyle = COL[i]; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(8, -4); ctx.lineTo(-3, 0); ctx.fill();
          ctx.restore();
        });
        const s = spread();
        $("#kSteps", st).textContent = steps; $("#kSpread", st).textContent = s == null ? "–" : s.toFixed(1) + " px";
        $("#kStatus", st).textContent = converged ? "Settled ✓" : steps ? "Moving…" : "Ready";
        miniChart($("#kChart", st), [{ data: hist, color: LC.teal }]);
      };
      const step = () => {
        if (anim || converged) return;
        pts.forEach(p => { let bi = 0, bd = 1e9; cents.forEach((c, i) => { const d = Math.hypot(p.x - c.x, p.y - c.y); if (d < bd) { bd = d; bi = i; } }); p.g = bi; });
        const targets = cents.map((c, i) => { const mem = pts.filter(p => p.g === i); return mem.length ? { x: mem.reduce((s, p) => s + p.x, 0) / mem.length, y: mem.reduce((s, p) => s + p.y, 0) / mem.length } : { x: c.x, y: c.y }; });
        const move = Math.max(...cents.map((c, i) => Math.hypot(targets[i].x - c.x, targets[i].y - c.y)));
        steps++; sfx.tone(500 + steps * 20, "triangle", 0.08, 0.03);
        if (move < 0.5) {
          converged = true; hist.push(spread()); draw(); stopRun(); sfx.good();
          $("#kCap", st).textContent = k === 3 ? "The banners stopped moving. The algorithm found the three villages without ever seeing a label!" : `The banners settled, but with k = ${k} the groups don't match the real villages. Choosing k matters!`;
          done("The banners settled. You just watched unsupervised learning find groups on its own.");
          return;
        }
        const from = cents.map(c => ({ x: c.x, y: c.y })), t0 = performance.now(), dur = reduced ? 1 : 550;
        cents.forEach((c, i) => c.trail.push({ x: from[i].x, y: from[i].y }));
        const tick = now => {
          const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
          cents.forEach((c, i) => { c.x = lerp(from[i].x, targets[i].x, e); c.y = lerp(from[i].y, targets[i].y, e); });
          draw();
          if (t < 1) anim = requestAnimationFrame(tick); else { anim = null; hist.push(spread()); draw(); }
        };
        anim = requestAnimationFrame(tick);
      };
      function stopRun() { running = false; clearInterval(timer); const b = $("#kRun", st); if (b) b.textContent = "▶ Run"; }
      $("#kStep", st).addEventListener("click", () => { stopRun(); step(); });
      $("#kRun", st).addEventListener("click", () => {
        if (running) { stopRun(); return; }
        if (converged) drop();
        running = true; $("#kRun", st).textContent = "❚❚ Pause"; step(); timer = setInterval(() => { if (converged) stopRun(); else step(); }, 750);
      });
      $("#kDrop", st).addEventListener("click", () => { sfx.click(); drop(); $("#kCap", st).textContent = "New banners dropped at random spots. Press One step or Run."; draw(); });
      $("#kNew", st).addEventListener("click", () => { sfx.click(); village(); drop(); $("#kCap", st).textContent = "A fresh map of unlabeled cottages."; draw(); });
      $("#kK", st).addEventListener("input", e => { k = +e.target.value; $("#kKV", st).textContent = k; drop(); draw(); });
      const resize = () => { ctx = fitCanvas(cv, W, H); draw(); };
      village(); drop(); requestAnimationFrame(resize);
      window.addEventListener("resize", resize);
      return () => { stopRun(); cancelAnimationFrame(anim); window.removeEventListener("resize", resize); };
    }
  },

  {
    id: "overfit", name: "The Overfitting Trap", icon: "scroll", wing: "foundations", chamber: "gatehouse",
    what: "Turn the complexity dial and watch a model go from too simple, to just right, to memorizing noise.",
    goal: "Find the complexity setting with the lowest test error.",
    tryList: [
      "Slide complexity all the way to <b>1</b>. The straight line can't follow the curve (underfitting).",
      "Slide it to the maximum. The curve hits every gold dot but swings wildly between them (overfitting).",
      "Find the setting where the <b>test error</b> (red) is lowest. That's the model you would actually use.",
      "Press <b>New data</b>. Is the best setting always the same?"
    ],
    explain: `<p>The <strong>gold dots</strong> are training data the model learns from. The <strong>hollow red dots</strong> are test data it never sees during training, like the surprise opponent at a tournament.</p>
      <p>The complexity dial controls how bendy the model's curve can be. A very simple model <strong>underfits</strong>: it misses the real pattern. A very complex model <strong>overfits</strong>: it bends to pass through every training dot, including the random noise, and then does badly on new data.</p>
      <p>Watch the chart: <strong>training error</strong> keeps falling as complexity rises, but <strong>test error</strong> falls and then climbs. The best model sits at the bottom of the red curve. That is why engineers always keep a test set.</p>`,
    mount(st, done) {
      const W = 600, H = 400, P = { l: 30, r: 16, t: 16, b: 34 }, MAXD = 11;
      st.innerHTML = `
        <div class="lab-grid">
          <div class="lab-vis"><canvas class="lab-cv" aria-label="Curve fitting plot showing training and test points"></canvas><p class="lab-cap" id="oCap"></p></div>
          <div class="lab-side">
            <div class="lab-ctl"><label class="lab-lbl" for="oDeg">Model complexity <b id="oDegV">1</b></label><input type="range" id="oDeg" min="1" max="${MAXD}" step="1" value="1"></div>
            <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" id="oNew">New data</button><button type="button" class="btn btn-ghost btn-sm" id="oTrue" aria-pressed="false">Show the true pattern</button></div>
            <div class="stats3"><div class="stat"><span>Training error</span><strong id="oTr" style="color:${LC.gold}"></strong></div><div class="stat"><span>Test error</span><strong id="oTe" style="color:${LC.crimson}"></strong></div><div class="stat"><span>Diagnosis</span><strong id="oDx"></strong></div></div>
            <div class="lab-chart"><span class="lab-lbl">Error vs. complexity: <span style="color:${LC.gold}">training</span> and <span style="color:${LC.crimson}">test</span></span><canvas class="lab-mini" id="oChart"></canvas></div>
          </div>
        </div>`;
      const cv = $(".lab-cv", st); let ctx;
      let deg = 1, seed = 5, train = [], test = [], fits = [], showTrue = false;
      const f = x => Math.sin(2.6 * x) * 1.1 + 0.25 * x;
      const px = x => P.l + (x + 1) / 2 * (W - P.l - P.r), py = y => H - P.b - (y + 2.2) / 4.4 * (H - P.t - P.b);
      const solve = (A, b) => {
        const n = b.length; A = A.map((r, i) => [...r, b[i]]);
        for (let c = 0; c < n; c++) {
          let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
          [A[c], A[piv]] = [A[piv], A[c]];
          if (Math.abs(A[c][c]) < 1e-12) continue;
          for (let r = 0; r < n; r++) if (r !== c) { const k = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j]; }
        }
        return A.map((r, i) => r[n] / (r[i] || 1));
      };
      const fit = d => {
        const n = d + 1, A = Array.from({ length: n }, () => Array(n).fill(0)), b = Array(n).fill(0);
        train.forEach(p => { const pw = Array.from({ length: n }, (_, k) => p.x ** k); for (let i = 0; i < n; i++) { b[i] += pw[i] * p.y; for (let j = 0; j < n; j++) A[i][j] += pw[i] * pw[j]; } });
        for (let i = 1; i < n; i++) A[i][i] += 1e-7;
        const co = solve(A, b), pred = x => co.reduce((s, c, k) => s + c * x ** k, 0);
        const err = set => set.reduce((s, p) => s + (pred(p.x) - p.y) ** 2, 0) / set.length;
        return { pred, tr: err(train), te: err(test) };
      };
      const gen = () => {
        const r = seeded(seed * 97 + 13);
        train = Array.from({ length: 12 }, (_, i) => { const x = -0.95 + 1.9 * (i + 0.2 + r() * 0.6) / 12; return { x, y: f(x) + gauss(r) * 0.28 }; });
        test = Array.from({ length: 30 }, () => { const x = -0.95 + 1.9 * r(); return { x, y: f(x) + gauss(r) * 0.28 }; });
        fits = Array.from({ length: MAXD }, (_, i) => fit(i + 1));
      };
      const bestDeg = () => fits.reduce((bi, ft, i) => ft.te < fits[bi].te ? i : bi, 0) + 1;
      const draw = () => {
        plotFrame(ctx, W, H, P, "input →", "");
        if (showTrue) { ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = -1 + 2 * i / 200; i ? ctx.lineTo(px(x), py(f(x))) : ctx.moveTo(px(x), py(f(x))); } ctx.stroke(); ctx.setLineDash([]); }
        const ft = fits[deg - 1];
        ctx.save(); ctx.beginPath(); ctx.rect(P.l, P.t, W - P.l - P.r, H - P.t - P.b); ctx.clip();
        ctx.strokeStyle = LC.teal; ctx.lineWidth = 3.5; ctx.shadowColor = LC.teal; ctx.shadowBlur = 10; ctx.beginPath();
        for (let i = 0; i <= 300; i++) { const x = -1 + 2 * i / 300, y = clamp(ft.pred(x), -3, 3); i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y)); }
        ctx.stroke(); ctx.restore(); ctx.shadowBlur = 0;
        test.forEach(p => { ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 5, 0, 7); ctx.strokeStyle = LC.crimson; ctx.lineWidth = 2; ctx.stroke(); });
        train.forEach(p => { ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 7, 0, 7); ctx.fillStyle = LC.gold; ctx.fill(); ctx.strokeStyle = "#0b0d1c"; ctx.lineWidth = 2; ctx.stroke(); });
        const bd = bestDeg();
        $("#oDegV", st).textContent = deg;
        $("#oTr", st).textContent = ft.tr.toFixed(3); $("#oTe", st).textContent = ft.te > 99 ? "99+" : ft.te.toFixed(3);
        const dx = deg < bd - 1 ? "Underfitting" : deg > bd + 2 ? "Overfitting" : "Just right";
        const dxEl = $("#oDx", st); dxEl.textContent = dx; dxEl.style.color = dx === "Just right" ? "#9fe6c1" : "#ffb3bf";
        $("#oCap", st).textContent = dx === "Underfitting" ? "Too simple: the curve can't bend enough to follow the pattern." : dx === "Overfitting" ? "Too complex: the curve chases the noise in the gold dots and misses the red test dots." : "Balanced: the curve follows the real pattern without chasing every bump.";
        const lg = v => Math.log10(clamp(v, 0.01, 10));
        miniChart($("#oChart", st), [{ data: fits.map(x => lg(x.tr)), color: LC.gold }, { data: fits.map(x => lg(x.te)), color: LC.crimson }], { min: -2, max: 1, xCount: MAXD, marker: deg - 1 });
        if (deg === bd) done(`Complexity ${bd} gives the lowest test error. That's the model that works best on new data.`);
      };
      $("#oDeg", st).addEventListener("input", e => { deg = +e.target.value; sfx.tone(300 + deg * 40, "triangle", 0.05, 0.03); draw(); });
      $("#oNew", st).addEventListener("click", () => { sfx.click(); seed++; gen(); draw(); });
      $("#oTrue", st).addEventListener("click", e => { showTrue = !showTrue; e.currentTarget.setAttribute("aria-pressed", String(showTrue)); e.currentTarget.textContent = showTrue ? "Hide the true pattern" : "Show the true pattern"; sfx.click(); draw(); });
      const resize = () => { ctx = fitCanvas(cv, W, H); draw(); };
      gen(); requestAnimationFrame(resize);
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }
  },

  {
    id: "fair", name: "The Fairness Dial", icon: "scales", wing: "ethics", chamber: "court",
    what: "Move the cutoff score and watch how a hidden proxy variable makes a selection system unfair to one village.",
    goal: "Remove the hidden proxy and see both villages judged fairly.",
    tryList: [
      "Drag the gold <b>cutoff line</b> left and right. Watch each village's selection rate change.",
      "With the proxy on, try to pass the four-fifths rule. How low must the cutoff go?",
      "Press <b>Remove the warhorse proxy</b> and watch Northvale's curve slide back.",
      "Compare: did changing the cutoff or removing the proxy fix the problem?"
    ],
    explain: `<p>Each curve shows how applicants' scores are spread out. Most applicants are near the peak, and fewer have very high or very low scores. Everyone to the right of the <strong>cutoff line</strong> is selected (the shaded area).</p>
      <p>In this kingdom, both villages have the <strong>same real skill</strong>. But the scoring model gives bonus points for owning a warhorse, a <strong>proxy</strong> for wealth, and most warhorse owners live in Northvale. That shifts Northvale's whole curve to the right.</p>
      <p>The <strong>impact ratio</strong> divides the lower selection rate by the higher one. Below <strong>0.80</strong> (the four-fifths rule) is a red flag. Moving the cutoff only hides the problem. Removing the proxy fixes its cause.</p>`,
    mount(st, done) {
      const W = 600, H = 400, P = { l: 30, r: 20, t: 16, b: 40 }, SD = 12, SKILL = 52, BONUS = 10;
      st.innerHTML = `
        <div class="lab-grid">
          <div class="lab-vis"><canvas class="lab-cv" aria-label="Score distributions for two villages with a movable cutoff line"></canvas><p class="lab-cap">Drag the gold cutoff line, or use the slider.</p></div>
          <div class="lab-side">
            <div class="lab-ctl"><label class="lab-lbl" for="fCut">Cutoff score <b id="fCutV">60</b></label><input type="range" id="fCut" min="25" max="90" step="1" value="60"></div>
            <button type="button" class="btn btn-ember btn-sm btn-block" id="fProxy">Remove the warhorse proxy</button>
            <div class="stats3"><div class="stat"><span>Northvale selected</span><strong id="fN" style="color:${LC.blue}"></strong></div><div class="stat"><span>Southmarsh selected</span><strong id="fS" style="color:${LC.crimson}"></strong></div><div class="stat"><span>Impact ratio</span><strong id="fR"></strong></div></div>
            <div class="lab-meter"><span class="lab-lbl">Four-fifths check</span><div class="ratio-bar"><div class="ratio-fill" id="fRFill"></div><span class="ratio-line"></span></div><p class="lab-verdict" id="fVerdict"></p></div>
          </div>
        </div>`;
      const cv = $(".lab-cv", st); let ctx;
      let cut = 60, proxyOn = true, nMean = SKILL + BONUS, raf = null, drag = false;
      const sx = s => P.l + s / 100 * (W - P.l - P.r);
      const rows = [{ name: "Northvale", col: LC.blue, top: P.t, h: (H - P.t - P.b) / 2 - 8 }, { name: "Southmarsh", col: LC.crimson, top: P.t + (H - P.t - P.b) / 2 + 8, h: (H - P.t - P.b) / 2 - 8 }];
      const pdf = (x, m) => Math.exp(-0.5 * ((x - m) / SD) ** 2);
      const draw = () => {
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = LC.bg; ctx.fillRect(0, 0, W, H);
        rows.forEach((r, i) => {
          const m = i === 0 ? nMean : SKILL, base = r.top + r.h, yv = v => base - v * (r.h - 22);
          ctx.strokeStyle = LC.axis; ctx.beginPath(); ctx.moveTo(P.l, base); ctx.lineTo(W - P.r, base); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx(0), base);
          for (let s = 0; s <= 100; s += 0.5) ctx.lineTo(sx(s), yv(pdf(s, m)));
          ctx.lineTo(sx(100), base); ctx.closePath(); ctx.fillStyle = r.col + "22"; ctx.fill();
          ctx.save(); ctx.beginPath(); ctx.rect(sx(cut), r.top, W, r.h + 2); ctx.clip();
          ctx.beginPath(); ctx.moveTo(sx(cut), base); for (let s = cut; s <= 100; s += 0.5) ctx.lineTo(sx(s), yv(pdf(s, m))); ctx.lineTo(sx(100), base); ctx.closePath(); ctx.fillStyle = r.col + "88"; ctx.fill(); ctx.restore();
          ctx.strokeStyle = r.col; ctx.lineWidth = 2.5; ctx.beginPath(); for (let s = 0; s <= 100; s += 0.5) s ? ctx.lineTo(sx(s), yv(pdf(s, m))) : ctx.moveTo(sx(s), yv(pdf(s, m))); ctx.stroke();
          ctx.fillStyle = r.col; ctx.font = "800 15px 'Alegreya Sans', sans-serif"; ctx.textAlign = "left"; ctx.fillText(r.name, P.l + 6, r.top + 16);
          if (i === 0 && Math.abs(nMean - SKILL) > 0.5) { ctx.fillStyle = LC.gold; ctx.font = "700 12px 'Alegreya Sans', sans-serif"; ctx.textAlign = "right"; ctx.fillText("+" + (nMean - SKILL).toFixed(0) + " warhorse bonus →", sx(SKILL) - 10, r.top + 40); }
        });
        ctx.fillStyle = LC.dim; ctx.font = "600 12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
        for (let s = 0; s <= 100; s += 20) ctx.fillText(s, sx(s), H - P.b + 16);
        ctx.fillStyle = LC.text; ctx.font = "700 14px 'Alegreya Sans', sans-serif"; ctx.fillText("Score given by the model →", W / 2, H - 6);
        ctx.strokeStyle = LC.gold; ctx.lineWidth = 3; ctx.shadowColor = LC.gold; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(sx(cut), P.t - 4); ctx.lineTo(sx(cut), H - P.b); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = LC.gold; ctx.beginPath(); ctx.arc(sx(cut), P.t + 4, 8, 0, 7); ctx.fill();
        const nr = 1 - normCdf(cut, nMean, SD), sr = 1 - normCdf(cut, SKILL, SD), hi = Math.max(nr, sr), ratio = hi ? Math.min(nr, sr) / hi : 1;
        $("#fCutV", st).textContent = cut; $("#fCut", st).value = cut;
        $("#fN", st).textContent = Math.round(nr * 100) + "%"; $("#fS", st).textContent = Math.round(sr * 100) + "%";
        const rEl = $("#fR", st); rEl.textContent = ratio.toFixed(2); rEl.style.color = ratio >= 0.8 ? "#9fe6c1" : "#ffb3bf";
        const fill = $("#fRFill", st); fill.style.width = Math.min(100, ratio * 100) + "%"; fill.style.background = ratio >= 0.8 ? "linear-gradient(90deg,#2f7d55,#3fa877)" : "linear-gradient(90deg,#7a1c2e,#e0485f)";
        $("#fVerdict", st).textContent = !proxyOn ? "Fair: with the proxy gone, both villages are judged on the same real skill." : ratio >= 0.8 ? "Passes, but only by selecting nearly everyone. The proxy is still hiding in the model." : "Red flag: Southmarsh is selected far less often, even though its real skill is the same.";
      };
      const animateTo = target => {
        cancelAnimationFrame(raf); const from = nMean, t0 = performance.now(), dur = reduced ? 1 : 900;
        const tick = now => { const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3); nMean = lerp(from, target, e); draw(); if (t < 1) raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
      };
      $("#fCut", st).addEventListener("input", e => { cut = +e.target.value; draw(); });
      $("#fProxy", st).addEventListener("click", e => {
        proxyOn = !proxyOn; sfx.whoosh();
        e.currentTarget.textContent = proxyOn ? "Remove the warhorse proxy" : "Put the warhorse proxy back";
        animateTo(proxyOn ? SKILL + BONUS : SKILL);
        if (!proxyOn) setTimeout(() => done("You removed the proxy. Fixing the cause, not just moving the cutoff, is what makes a system fair."), 950);
      });
      const setFromPointer = e => { const p = toLogical(cv, e, W, H); cut = Math.round(clamp((p.x - P.l) / (W - P.l - P.r) * 100, 25, 90)); draw(); };
      cv.addEventListener("pointerdown", e => { const p = toLogical(cv, e, W, H); if (Math.abs(p.x - sx(cut)) < 30) { drag = true; cv.setPointerCapture(e.pointerId); setFromPointer(e); } });
      cv.addEventListener("pointermove", e => { if (drag) setFromPointer(e); });
      const up = () => { drag = false; };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      const resize = () => { ctx = fitCanvas(cv, W, H); draw(); };
      requestAnimationFrame(resize);
      window.addEventListener("resize", resize);
      return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }
  },

  {
    id: "chatbot", name: "Talk to a Chatbot", icon: "quill", wing: "tools", chamber: "workshop",
    what: "Send requests to a practice chatbot and see how the details you include change its reply.",
    goal: "Send one request with at least 4 of these 5 details: a goal, an audience, a format, an example, and a rule.",
    tryList: [
      "Type a vague request, such as <b>Tell me about machine learning</b>. Read the reply.",
      "Add a <b>goal</b>, which is what you want to learn or make.",
      "Add an <b>audience</b>, such as a 10th grader, and a <b>format</b>, such as three bullet points.",
      "Add an <b>example</b> and a <b>rule</b>, such as <i>no jargon</i>. Send it again and compare the replies."
    ],
    explain: `<p>This is a <strong>practice simulator</strong>, not a live AI. Its replies are written in advance, so you can see how the details in a request change the kind of answer you get.</p>
      <p>A real chatbot predicts likely next words from the text you send. More specific details give it more to work with, so a clear request usually gets a more useful answer than a vague one.</p>`,
    mount(st, done) {
      const CATS = {
        goal: /\b(goal|so that|so i can|i want to|i need|help me|to learn|to understand|to make|to prepare|to study)\b/i,
        audience: /\b(for a|for my|for an|audience|grade|class|students?|beginner|kid|friend|teacher|reader|10th)\b/i,
        format: /\b(bullet|bullets|list|steps|table|paragraph|sentences|short|quiz|outline|numbered)\b/i,
        example: /\b(example|for instance|such as|like this|e\.g\.)\b/i,
        rule: /(don'?t|do not|avoid|only|without|must|no jargon|keep it)/i
      };
      const NAMES = { goal: "goal", audience: "audience", format: "format", example: "example", rule: "rule" };
      const details = t => Object.keys(CATS).filter(k => CATS[k].test(t));
      const TOPICS = [
        { re: /overfit/i, ans: "Overfitting happens when a model memorizes its training examples and then does poorly on new data. It often shows up as high accuracy on training data and low accuracy on test data. Holding back a test set is how engineers catch it." },
        { re: /gradient descent|learning rate/i, ans: "Gradient descent improves a model by taking small steps that lower its loss. The learning rate sets how big each step is. If it is too big, the model overshoots. If it is too small, learning is very slow." },
        { re: /neuron|perceptron/i, ans: "An artificial neuron multiplies each input by a weight, adds a bias, and passes the total through an activation rule. The result is a simple decision, such as fire or do not fire." },
        { re: /machine learning|learns? from/i, ans: "Machine learning is a type of AI. Instead of following rules that a person wrote, the computer learns patterns from examples that come with right answers. It adjusts its settings to make fewer mistakes." },
        { re: /hallucinat|made[- ]up (fact|source|quote)|fake (source|citation|quote)/i, ans: "A hallucination is when an AI states something false with confidence. AI can invent facts, quotes, and citations that look real. Check every claim in the original source before you use it." },
        { re: /\bbias|unfair|fairness/i, ans: "AI bias happens when a system treats some groups worse than others. It can come from unrepresentative data, past unfair decisions, or proxy variables, such as a ZIP code. Check results separately for each group." },
        { re: /temperature/i, ans: "Temperature controls how random a language model's word choices are. A low temperature gives predictable answers. A high temperature gives more varied answers, but they are more likely to be wrong." },
        { re: /transformer|attention/i, ans: "A Transformer is the design behind modern chatbots. Its attention mechanism lets each word weigh how much the other words matter for understanding it." },
        { re: /governance|risk tier|eu ai act|nist/i, ans: "AI governance is the set of rules, roles, and checks that guide how AI is built and used. The EU AI Act sorts AI systems into risk tiers. The NIST AI Risk Management Framework uses four functions: Govern, Map, Measure, and Manage." },
        { re: /\btokens?\b/i, ans: "A token is one unit of text that a language model reads. A token can be a whole word, part of a longer word, or a punctuation mark." }
      ];
      const PRIVATE = /[\w.+-]+@[\w-]+\.[\w.]+|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b(password|student id|social security|home address)\b|\b\d{1,5}\s+\w+\s+(street|st|road|rd|avenue|ave|lane|drive|dr)\b/i;
      const TUTOR_ONLY = /\b(write (my|the|a) (essay|paper|report|homework|assignment|story)|do (my|the) (homework|assignment|test|quiz)|answer (these|my|the) (questions|homework)|finish (my|the) (homework|assignment))\b/i;
      const CITE = /\b(cite|citation|quote|source|reference|bibliography)\b/i;
      const answer = t => {
        if (PRIVATE.test(t)) return { status: "blocked", text: "Please do not share personal information, such as an email, phone number, home address, password, or student ID. Remove those details and send the request again. I did not process this one." };
        if (TUTOR_ONLY.test(t)) return { status: "tutor", text: "I cannot write or complete graded work for you. That would break the Knight's Code. I can explain the idea or give you a hint. Try asking: Explain overfitting in three short steps so I can check my understanding." };
        const topic = TOPICS.find(x => x.re.test(t));
        if (!topic) return { status: "off", text: "I only have accurate answers for the course topics in this tool: machine learning, neurons, gradient descent, overfitting, hallucinations, bias, temperature, Transformers, tokens, and AI governance. Ask about one of those topics." };
        let text = topic.ans;
        if (CITE.test(t)) text += " Before you cite anything, find the original source and confirm the claim is in it.";
        return { status: "ok", text };
      };
      st.innerHTML = `
        <div class="lab-grid">
          <div class="lab-vis">
            <div id="cbLog" aria-live="polite" style="display:flex;flex-direction:column;gap:10px;min-height:280px;max-height:420px;overflow:auto;padding:12px;border-radius:12px;background:rgba(0,0,0,.25)"></div>
            <p class="lab-cap">Practice chatbot with written replies. It is not a live AI.</p>
          </div>
          <div class="lab-side">
            <form id="cbForm">
              <label class="lab-lbl" for="cbIn">Your request</label>
              <textarea id="cbIn" rows="4" style="width:100%;margin:6px 0 10px;padding:10px;border-radius:10px;font:inherit;background:#171b33;color:inherit;border:1px solid rgba(255,255,255,.15)" placeholder="Type a request for the chatbot"></textarea>
              <div class="btn-row"><button type="submit" class="btn btn-gold btn-sm">Send</button><button type="button" class="btn btn-ghost btn-sm" id="cbClear">Clear chat</button></div>
            </form>
            <div class="stat" style="margin-top:12px"><span>Details in your last request</span><strong id="cbScore">0 of 5</strong></div>
            <p class="lab-cap" style="margin-top:8px">Found: <span id="cbFound">none yet</span></p>
            <div style="margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.2)">
              <h4 style="margin:0 0 6px">Chatbot rules</h4>
              <ol style="margin:0;padding-left:20px;line-height:1.5">
                <li><b>Keep personal information private.</b> No emails, phone numbers, addresses, passwords, or student IDs.</li>
                <li><b>Be a tutor, not a ghostwriter.</b> The bot will not write graded work.</li>
                <li><b>Check every fact.</b> Verify claims and citations in the original source.</li>
                <li><b>Disclose AI use.</b> Tell your teacher when AI helped your work.</li>
              </ol>
            </div>
          </div>
        </div>`;
      const log = $("#cbLog", st), input = $("#cbIn", st), score = $("#cbScore", st);
      const add = (who, text) => {
        const d = document.createElement("div");
        d.style.cssText = `max-width:88%;padding:10px 14px;border-radius:12px;white-space:pre-line;align-self:${who === "you" ? "flex-end" : "flex-start"};background:${who === "you" ? "rgba(77,127,224,.25)" : "rgba(232,176,75,.14)"}`;
        d.textContent = text;
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
      };
      add("bot", "Ask me something about AI. I am a practice chatbot with prepared replies.");
      let finished = false;
      $("#cbForm", st).addEventListener("submit", e => {
        e.preventDefault();
        const t = input.value.trim();
        if (!t) return;
        const res = answer(t);
        const found = details(t);
        add("you", t);
        add("bot", res.text);
        score.textContent = `${found.length} of 5`;
        $("#cbFound", st).textContent = found.length ? found.map(k => NAMES[k]).join(", ") : "none yet";
        input.value = "";
        if (res.status === "ok" && found.length >= 4 && !finished) {
          finished = true;
          done("Clear goal, audience, format, example, and rule details get more useful answers from a chatbot.");
        }
      });
      $("#cbClear", st).addEventListener("click", () => { log.innerHTML = ""; add("bot", "Chat cleared. Send a new request."); });
      add("bot", "Try a vague request first, then add details and compare.");
    }
  },

  {
    id: "governance", name: "AI Governance Board", icon: "scales", wing: "ethics", chamber: "court",
    what: "Sit on the governance board. Sort real AI systems into EU AI Act risk tiers and learn why each one belongs there.",
    goal: "Sort at least 6 of the 8 AI systems into the correct risk tier.",
    tryList: [
      "Read the AI system on the card. Ask what could go wrong for a real person.",
      "Choose a tier: <b>Banned</b>, <b>High risk</b>, <b>Limited risk</b>, or <b>Minimal risk</b>.",
      "Read the reason after each choice, even when you are right.",
      "Aim for 6 of 8. Then compare your reasoning with the EU AI Act table in the Royal Court."
    ],
    explain: `<p>Governance is the set of rules and checks that decide how AI can be built and used. The EU AI Act sorts AI systems into <strong>four risk tiers</strong>. The greater the risk to people, the stricter the rules.</p>
      <ul>
        <li><strong>Banned:</strong> uses that cross a clear line, such as government social scoring.</li>
        <li><strong>High risk:</strong> systems that affect opportunities, such as grading or hiring. They need testing, documentation, and human oversight.</li>
        <li><strong>Limited risk:</strong> systems people must be told about, such as chatbots and deepfakes.</li>
        <li><strong>Minimal risk:</strong> most everyday tools, such as spam filters.</li>
      </ul>
      <p>This is a simplified practice model. It is not legal advice.</p>`,
    mount(st, done) {
      const TIERS = [["ban", "Banned"], ["high", "High risk"], ["limited", "Limited risk"], ["min", "Minimal risk"]];
      const CASES = [
        { text: "A spam filter that moves junk email into a separate folder.", tier: "min", why: "Spam filters are everyday tools with low risk to people's rights. They have few extra rules." },
        { text: "A government system that gives every citizen a score and limits their rights based on that score.", tier: "ban", why: "Social scoring by public authorities is banned under the EU AI Act." },
        { text: "An AI tool that grades final exams for a high school.", tier: "high", why: "Systems that evaluate learning affect a student's future, so they are high risk." },
        { text: "A chatbot on a shopping website that answers customer questions.", tier: "limited", why: "People must be told they are talking to an AI, so this is limited risk." },
        { text: "An AI system that screens job applicants' résumés and ranks them for interviews.", tier: "high", why: "Hiring decisions affect people's livelihoods, so this system is high risk." },
        { text: "Enemy characters in a video game that move around a map.", tier: "min", why: "Game characters carry little risk, so they have few extra rules." },
        { text: "A realistic AI-made video of a real person saying something they never said, shared online.", tier: "limited", why: "Deepfakes must be clearly labeled so people know the content is AI-made. That makes this limited risk." },
        { text: "An app that uses hidden techniques to manipulate people into harming themselves.", tier: "ban", why: "Manipulative systems that cause harm are banned." }
      ];
      st.innerHTML = `
        <div class="lab-grid">
          <div class="lab-vis">
            <p class="lab-lbl" id="gvCount">Case 1 of ${CASES.length}</p>
            <div id="gvCard" style="padding:18px;border-radius:12px;background:rgba(0,0,0,.25);min-height:120px;line-height:1.5"></div>
            <div id="gvTiers" class="btn-row" style="margin-top:12px;flex-wrap:wrap"></div>
            <div id="gvWhy" aria-live="polite" style="margin-top:12px;min-height:60px;line-height:1.5"></div>
          </div>
          <div class="lab-side">
            <div class="stat"><span>Correct so far</span><strong id="gvScore">0 of ${CASES.length}</strong></div>
            <p class="lab-cap" style="margin-top:10px">Choose a tier for each system. The answer and reason appear right after you choose.</p>
          </div>
        </div>`;
      const $g = s => $(s, st);
      let i = 0, right = 0, finished = false;
      const addNext = label => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "btn btn-gold btn-sm"; b.textContent = label;
        b.addEventListener("click", () => {
          if (label.startsWith("See")) finish(); else if (label === "Restart") restart(); else { i++; draw(); }
        });
        $g("#gvWhy").appendChild(b);
      };
      const draw = () => {
        const c = CASES[i];
        $g("#gvCount").textContent = `Case ${i + 1} of ${CASES.length}`;
        $g("#gvCard").textContent = c.text;
        $g("#gvWhy").innerHTML = "";
        $g("#gvTiers").innerHTML = TIERS.map(([k, l]) => `<button type="button" class="btn btn-ghost btn-sm" data-t="${k}">${l}</button>`).join("");
        $(`#gvTiers`, st).querySelectorAll("[data-t]").forEach(b => b.addEventListener("click", () => pick(b.dataset.t)));
      };
      const pick = k => {
        const c = CASES[i];
        const ok = k === c.tier;
        if (ok) right++;
        const label = TIERS.find(t => t[0] === c.tier)[1];
        $g("#gvWhy").innerHTML = `<p><b>${ok ? "Correct." : "Not quite."}</b> The tier is <b>${label}</b>. ${esc(c.why)}</p>`;
        $g("#gvScore").textContent = `${right} of ${CASES.length}`;
        $g("#gvTiers").querySelectorAll("[data-t]").forEach(b => { b.disabled = true; b.style.opacity = b.dataset.t === c.tier ? "1" : ".5"; });
        addNext(i < CASES.length - 1 ? "Next case" : "See results");
      };
      const finish = () => {
        const passed = right >= 6;
        $g("#gvCard").textContent = `You placed ${right} of ${CASES.length} systems in the correct tier.`;
        $g("#gvTiers").innerHTML = "";
        $g("#gvWhy").innerHTML = passed
          ? "<p>Good work. Governance sorts systems by how much they can harm people, then sets rules to match.</p>"
          : "<p>Not yet. Reread the four tiers in the explanation, then try again.</p>";
        if (passed) {
          if (!finished) { finished = true; done("You sorted AI systems by risk to people, the way the EU AI Act does."); }
        } else addNext("Restart");
      };
      const restart = () => { i = 0; right = 0; $g("#gvScore").textContent = `0 of ${CASES.length}`; draw(); };
      draw();
    }
  }
];

const lab = {
  cur: null, cleanup: null,
  explored(id) { return !!store.s.awarded["lab-" + id]; },

  render() {
    if (!this.cur) {
      try { this.cur = localStorage.getItem("nexus_lab_last") || LAB_MODELS[0].id; } catch (e) { this.cur = LAB_MODELS[0].id; }
      if (!LAB_MODELS.some(m => m.id === this.cur)) this.cur = LAB_MODELS[0].id;
    }
    this.renderPicker();
    this.open(this.cur, false);
    router.onLeave(() => this.unmount());
  },

  renderPicker() {
    const n = LAB_MODELS.filter(m => this.explored(m.id)).length;
    $("#labCount").textContent = `${n} of ${LAB_MODELS.length} models explored`;
    $("#labMeter").style.width = (n / LAB_MODELS.length * 100) + "%";
    $("#labPicker").innerHTML = LAB_MODELS.map((m, i) => {
      const w = WINGS.find(x => x.id === m.wing);
      return `<button type="button" class="lab-card ${m.id === this.cur ? "on" : ""} ${this.explored(m.id) ? "done" : ""}" data-id="${m.id}" style="--wc:${w.color}" aria-pressed="${m.id === this.cur}">
        <span class="lab-card-ico">${icon(m.icon)}</span>
        <span class="lab-card-txt"><small>Model ${i + 1} · ${esc(w.short)}</small><strong>${esc(m.name)}</strong></span>
        <span class="lab-card-check" aria-label="${this.explored(m.id) ? "explored" : ""}">${this.explored(m.id) ? icon("check") : ""}</span></button>`;
    }).join("");
    $$("#labPicker .lab-card").forEach(b => b.addEventListener("click", () => { sfx.click(); this.open(b.dataset.id, true); }));
  },

  unmount() { if (this.cleanup) { this.cleanup(); this.cleanup = null; } },

  open(id, scroll) {
    this.unmount();
    this.cur = id;
    try { localStorage.setItem("nexus_lab_last", id); } catch (e) {  }
    $$("#labPicker .lab-card").forEach(b => { b.classList.toggle("on", b.dataset.id === id); b.setAttribute("aria-pressed", String(b.dataset.id === id)); });
    const m = LAB_MODELS.find(x => x.id === id), idx = LAB_MODELS.indexOf(m);
    const w = WINGS.find(x => x.id === m.wing), ch = CHAMBERS.find(c => c.id === m.chamber);
    const panel = $("#labPanel");
    panel.style.setProperty("--wc", w.color);
    panel.innerHTML = `
      <div class="lab-head">
        <span class="lab-head-ico">${icon(m.icon)}</span>
        <div><p class="eyebrow">Model ${idx + 1} of ${LAB_MODELS.length} · Wing ${w.num}: ${esc(w.short)}</p><h3>${esc(m.name)}</h3><p>${esc(m.what)}</p></div>
      </div>
      <div class="lab-goal ${this.explored(id) ? "met" : ""}" id="labGoal"><span class="lab-goal-ico">${icon(this.explored(id) ? "check" : "target")}</span><span id="labGoalText"><b>${this.explored(id) ? "Goal complete:" : "Goal (+15 gold):"}</b> ${esc(m.goal)}</span></div>
      <div class="lab-stage" id="labStage"></div>
      <div class="lab-notes">
        <div class="lab-try"><h4>Try this</h4><ol>${m.tryList.map(t => `<li>${t}</li>`).join("")}</ol></div>
        <div class="lab-explain"><h4>What's happening</h4>${m.explain}
          <a class="lab-link" href="#/chamber/${ch.id}">Learn more in ${esc(ch.name)} (Chamber ${ch.num}) →</a></div>
      </div>
      <div class="lab-nav">
        <button type="button" class="btn btn-ghost btn-sm" id="labPrev" ${idx === 0 ? "disabled" : ""}>← ${idx > 0 ? esc(LAB_MODELS[idx - 1].name) : ""}</button>
        <button type="button" class="btn btn-gold btn-sm" id="labNext" ${idx === LAB_MODELS.length - 1 ? "disabled" : ""}>${idx < LAB_MODELS.length - 1 ? esc(LAB_MODELS[idx + 1].name) : ""} →</button>
      </div>`;
    $("#labPrev").addEventListener("click", () => { if (idx > 0) { sfx.click(); this.open(LAB_MODELS[idx - 1].id, true); } });
    $("#labNext").addEventListener("click", () => { if (idx < LAB_MODELS.length - 1) { sfx.click(); this.open(LAB_MODELS[idx + 1].id, true); } });
    let finished = false;
    const done = msg => {
      if (finished) return;
      finished = true;
      const goal = $("#labGoal");
      if (!goal) return;
      goal.classList.add("met");
      $(".lab-goal-ico", goal).innerHTML = icon("check");
      $("#labGoalText").innerHTML = `<b>Goal complete!</b> ${esc(msg)}`;
      if (game.award("lab-" + id, 15, goal)) { sfx.fanfare(); this.renderPicker(); }
    };
    this.cleanup = m.mount($("#labStage"), done) || null;
    if (scroll) panel.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
};
