// ============================================================
//  Animation logic. You shouldn't need to edit this file —
//  change text/photos in content.js and colors in style.css.
// ============================================================

// ---------- 1) letter rain on the opening screen ----------
const GLYPHS = 'HAPPY BIRTHDAY YA MONY ♡♥';
const rainCanvas = document.getElementById('rain-canvas');
const rctx = rainCanvas.getContext('2d');
let rainColumns = [], rainFontSize = 16;

function setupRain() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  rainCanvas.width = rainCanvas.clientWidth * dpr;
  rainCanvas.height = rainCanvas.clientHeight * dpr;
  rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rainFontSize = rainCanvas.clientWidth < 480 ? 14 : 16;
  const count = Math.floor(rainCanvas.clientWidth / rainFontSize);
  rainColumns = new Array(count).fill(0).map(() => Math.random() * -100);
}
function drawRain() {
  const w = rainCanvas.clientWidth, h = rainCanvas.clientHeight;
  rctx.fillStyle = 'rgba(10,10,18,0.18)';
  rctx.fillRect(0, 0, w, h);
  rctx.font = rainFontSize + 'px monospace';
  rainColumns.forEach((y, i) => {
    const x = i * rainFontSize;
    const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const fade = Math.random();
    rctx.fillStyle = fade > 0.92 ? '#ffd7de' : `rgba(255,93,122,${0.35 + Math.random() * 0.5})`;
    rctx.fillText(glyph, x, y * rainFontSize);
    if (y * rainFontSize > h && Math.random() > 0.975) rainColumns[i] = 0;
    else rainColumns[i] += 0.4 + Math.random() * 0.5;
  });
  requestAnimationFrame(drawRain);
}
setupRain();
window.addEventListener('resize', setupRain);
drawRain();

const rainWords = document.getElementById('rain-words');
CONTENT.introWords.forEach(w => {
  const span = document.createElement('span');
  span.textContent = w;
  rainWords.appendChild(span);
});

let entered = false;
function handleEnter() {
  if (entered) return;
  entered = true;
  rainWords.classList.add('shown');
  document.getElementById('rain-cta').style.display = 'none';
  setTimeout(() => {
    document.getElementById('rain-screen').classList.add('leaving');
  }, 1400);
  setTimeout(() => {
    document.getElementById('rain-screen').style.display = 'none';
    document.getElementById('story').classList.add('visible');
  }, 2200);
}
document.getElementById('rain-overlay').addEventListener('click', handleEnter);

// ---------- 2) starfield background (used on every section) ----------
function initStarfield(canvas, density) {
  const ctx = canvas.getContext('2d');
  let stars = [];
  function setup() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.floor(canvas.clientWidth * canvas.clientHeight * density);
    stars = new Array(count).fill(0).map(() => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.02,
    }));
  }
  setup();
  window.addEventListener('resize', setup);
  function draw(t) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    stars.forEach(s => {
      const twinkle = 0.5 + 0.5 * Math.sin(t * 0.001 * s.speed * 60 + s.phase);
      ctx.globalAlpha = 0.25 + twinkle * 0.75;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
document.querySelectorAll('.star-canvas').forEach(c => initStarfield(c, 0.00015));

// ---------- 3) fill in text from content.js ----------
document.getElementById('hero-title').textContent = CONTENT.occasionTitle;
document.getElementById('hero-subtitle').textContent = CONTENT.occasionSubtitle;
document.getElementById('collage-message').textContent = CONTENT.finalMessage;
document.getElementById('collage-closing').textContent = CONTENT.closingLine;

// ---------- 4) build the moments story + scroll reveal ----------
const momentsInner = document.getElementById('moments-inner');
CONTENT.moments.forEach((m, i) => {
  const div = document.createElement('div');
  div.className = 'moment';
  const bubble = document.createElement('div');
  bubble.className = 'moment__bubble';
  bubble.innerHTML = `<p></p><span class="moment__heart">♥</span>`;
  bubble.querySelector('p').textContent = m.message;
  div.appendChild(bubble);

  if (m.photos && m.photos.length > 0) {
    const photosDiv = document.createElement('div');
    photosDiv.className = 'moment__photos';
    m.photos.forEach(src => {
      const img = document.createElement('img');
      img.src = src; img.loading = 'lazy';
      photosDiv.appendChild(img);
    });
    div.appendChild(photosDiv);
  } else {
    const ph = document.createElement('div');
    ph.className = 'moment__placeholder';
    ph.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span><p>Add your photo filename in content.js</p>`;
    div.appendChild(ph);
  }
  momentsInner.appendChild(div);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('shown');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.35 });
document.querySelectorAll('.moment').forEach(el => observer.observe(el));

// ---------- 5) heart-shaped photo collage ----------
// Positions are calculated from the mathematical heart-curve formula below,
// so it always forms a real heart shape no matter how many photos you add
// (tested from 1 up to ~20 photos).
// Walks the heart curve at 720 tiny steps and measures the running distance
// travelled, so we know the curve's total length at this ring's scale.
function heartCurveSamples(scale) {
  const SAMPLES = 720;
  const samples = [];
  let prevX = 0, prevY = 13 - 5 - 2 - 1; // point at t = 0
  samples.push({ t: 0, len: 0, x: prevX, y: prevY });
  let cumLen = 0;
  for (let s = 1; s <= SAMPLES; s++) {
    const t = (s / SAMPLES) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3) * scale;
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
    cumLen += Math.hypot(x - prevX, y - prevY);
    samples.push({ t, len: cumLen, x, y });
    prevX = x; prevY = y;
  }
  return { samples, totalLen: cumLen };
}

function heartLayout(n) {
  const points = [];
  const ringsCount = Math.min(4, Math.max(1, Math.ceil(n / 7)));
  const perRing = Math.ceil(n / ringsCount);
  let idx = 0;
  for (let r = 0; r < ringsCount && idx < n; r++) {
    const scale = 1 - r * 0.24;              // each inner ring sits closer to the center
    const { samples, totalLen } = heartCurveSamples(scale);
    const arcOffset = (r * 0.14) * totalLen; // stagger each ring's starting point along the path
    const countThisRing = Math.min(perRing, n - idx);
    for (let i = 0; i < countThisRing; i++, idx++) {
      // even spacing by DISTANCE along the curve (not angle) -> no bunching at the tip/ears
      const targetLen = ((i / countThisRing) * totalLen + arcOffset) % totalLen;
      let closest = samples[0], bestDiff = Infinity;
      for (const smp of samples) {
        const diff = Math.abs(smp.len - targetLen);
        if (diff < bestDiff) { bestDiff = diff; closest = smp; }
      }
      const left = 50 + (closest.x / 16) * 40;
      const top = 50 + (-closest.y / 17) * 42 - 8;
      const rot = Math.round((Math.random() * 12 - 6) * 10) / 10;
      points.push({ left, top, rot });
    }
  }
  return points;
}

const heartEl = document.getElementById('collage-heart');
const heartContainer = heartEl; // container used both for sizing math and the 'shown' trigger
const heartPhotos = CONTENT.heartPhotos && CONTENT.heartPhotos.length > 0
  ? CONTENT.heartPhotos
  : new Array(8).fill(null);
const layout = heartLayout(heartPhotos.length);
// size the cards to the photo count: too big and a small heart turns into an overlapping
// blob, too small and a big heart looks sparse
const frameSize = heartPhotos.length > 14 ? 60
  : heartPhotos.length > 9 ? 70
  : heartPhotos.length > 6 ? 76
  : 66;
// approximate on-screen size of #collage-heart (matches the CSS: width:min(340px,88vw), aspect-ratio 1/0.92)
// used so each photo knows how far it has to fly in from the center to reach its heart position
const containerW = Math.min(340, window.innerWidth * 0.88);
const containerH = containerW * 0.92;

heartPhotos.forEach((src, i) => {
  const pos = layout[i];
  const frame = document.createElement('div');
  frame.className = 'collage__frame';
  frame.style.width = frameSize + 'px';
  frame.style.height = Math.round(frameSize * 1.23) + 'px';
  frame.style.top = pos.top + '%';
  frame.style.left = pos.left + '%';
  frame.style.zIndex = String(i);
  // how far this photo has to travel from the center of the heart to its final spot
  const dx = ((50 - pos.left) / 100) * containerW;
  const dy = ((50 - pos.top) / 100) * containerH;
  frame.style.setProperty('--dx', dx.toFixed(1) + 'px');
  frame.style.setProperty('--dy', dy.toFixed(1) + 'px');
  frame.style.setProperty('--rot', pos.rot + 'deg');
  frame.style.setProperty('--delay', (i * 0.12) + 's');
  if (src) {
    const img = document.createElement('img');
    img.src = src; img.loading = 'lazy';
    frame.appendChild(img);
  } else {
    frame.innerHTML = '<span>♥</span>';
  }
  heartEl.appendChild(frame);
});

// don't assemble the heart until the visitor actually scrolls down to it
const heartRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      heartContainer.classList.add('shown');
      heartRevealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.35 });
heartRevealObserver.observe(heartContainer);
