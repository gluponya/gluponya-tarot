/* cardview.js — карта таро на весь экран: фон размыт, карту можно вертеть мышкой/пальцем, рядом название,
   редкость, дата получения и предсказания. Общий для альбома (tarot.html) и профиля (profile.html).
   CardView.open(items, index): items = [{img, back, num, title, rarity, rlabel, n, log:[[unix, текст, обмен], ...], note}] */
(function () {
  const RC = { common: '#B9A79D', rare: '#4F86C6', myth: '#8E54D6', legend: '#D9A21E' };
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = `
.cv{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;opacity:0;transition:opacity .22s ease;
  background:rgba(20,12,24,.55);-webkit-backdrop-filter:blur(14px) saturate(1.1);backdrop-filter:blur(14px) saturate(1.1);font-family:"Nunito",system-ui,sans-serif}
.cv.on{opacity:1}
.cv-in{display:grid;grid-template-columns:auto minmax(0,410px);gap:clamp(20px,4vw,56px);align-items:center;max-width:1000px;width:100%;justify-content:center}
.cv-stage{perspective:1300px;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;display:grid;place-items:center}
.cv-stage:active{cursor:grabbing}
.cv-card{position:relative;height:min(78vh,620px);aspect-ratio:360/620;transform-style:preserve-3d;will-change:transform}
.cv-face{position:absolute;inset:0;border-radius:18px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#F6EBD3}
.cv-face img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;-webkit-user-drag:none}
.cv-back{transform:rotateY(180deg)}
.cv-glare{position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;opacity:.85}
.cv-holo{position:absolute;inset:0;pointer-events:none;mix-blend-mode:color-dodge;opacity:0}
.cv-card.legend .cv-holo,.cv-card.myth .cv-holo{opacity:.32}
.cv-info{container-type:inline-size;color:#FFF8EC;display:grid;gap:12px;max-height:78vh;overflow-y:auto;overflow-x:hidden;padding:4px 6px 4px 4px;min-width:0}
.cv-num{font:900 14px/1 "Rubik",system-ui,sans-serif;letter-spacing:.12em;opacity:.8}
.cv-title{margin:0;overflow-wrap:anywhere;font:900 clamp(26px,3.4vw,40px)/1.05 "Rubik",system-ui,sans-serif;font-size:min(clamp(26px,3.4vw,40px),calc((100cqw - 46px) / var(--L,8) / .86));text-transform:uppercase;letter-spacing:.06em;overflow-wrap:normal;
  justify-self:start;max-width:100%;box-sizing:border-box;padding:10px 16px 12px;background:#FFF8EC;border:3px solid #1B1418;border-radius:16px;box-shadow:0 4px 0 #1B1418;
  color:#F7D44C;text-shadow:1.2px 0.0px 0 #1B1418,1.04px 0.6px 0 #1B1418,0.6px 1.04px 0 #1B1418,0.0px 1.2px 0 #1B1418,-0.6px 1.04px 0 #1B1418,-1.04px 0.6px 0 #1B1418,-1.2px 0.0px 0 #1B1418,-1.04px -0.6px 0 #1B1418,-0.6px -1.04px 0 #1B1418,-0.0px -1.2px 0 #1B1418,0.6px -1.04px 0 #1B1418,1.04px -0.6px 0 #1B1418,2.4px 0.0px 0 #1B1418,2.32px 0.62px 0 #1B1418,2.08px 1.2px 0 #1B1418,1.7px 1.7px 0 #1B1418,1.2px 2.08px 0 #1B1418,0.62px 2.32px 0 #1B1418,0.0px 2.4px 0 #1B1418,-0.62px 2.32px 0 #1B1418,-1.2px 2.08px 0 #1B1418,-1.7px 1.7px 0 #1B1418,-2.08px 1.2px 0 #1B1418,-2.32px 0.62px 0 #1B1418,-2.4px 0.0px 0 #1B1418,-2.32px -0.62px 0 #1B1418,-2.08px -1.2px 0 #1B1418,-1.7px -1.7px 0 #1B1418,-1.2px -2.08px 0 #1B1418,-0.62px -2.32px 0 #1B1418,-0.0px -2.4px 0 #1B1418,0.62px -2.32px 0 #1B1418,1.2px -2.08px 0 #1B1418,1.7px -1.7px 0 #1B1418,2.08px -1.2px 0 #1B1418,2.32px -0.62px 0 #1B1418,0 3.5px 0 #1B1418}
.cv-chips{display:flex;flex-wrap:wrap;gap:8px}
.cv-chip{font:800 14px/1 "Nunito",system-ui,sans-serif;padding:7px 11px;border-radius:999px;border:2px solid #1B1418;background:#FFF8EC;color:#1B1418}
.cv-chip.r{color:#fff}
.cv-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.cv-list li{background:rgba(255,248,236,.96);color:#1B1418;border:2.5px solid #1B1418;border-radius:14px;padding:11px 13px;display:grid;gap:4px}
.cv-list time{font:800 13px/1.2 "Nunito",system-ui,sans-serif;color:#6E5A60}
.cv-list q{font:800 17px/1.35 "Nunito",system-ui,sans-serif;quotes:"«" "»"}
.cv-note{font:700 14px/1.4 "Nunito",system-ui,sans-serif;opacity:.85;margin:0}
.cv-btns{display:flex;flex-wrap:wrap;gap:8px}
.cv button{font:900 13px/1 "Rubik",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;padding:10px 12px;border-radius:12px;border:3px solid #1B1418;background:#F7D44C;color:#1B1418;cursor:pointer}
.cv button.g{background:#FFF8EC}
.cv button:focus-visible{outline:3px solid #F49CB9;outline-offset:2px}
.cv-x{position:fixed;top:max(12px,env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px));width:46px;height:46px;padding:0!important;font-size:20px!important;border-radius:50%!important}
.cv-hint{font:700 13px/1.3 "Nunito",system-ui,sans-serif;opacity:.7;margin:0}
@media (max-width:720px){
  .cv{place-items:start center;overflow:auto}
  .cv-in{grid-template-columns:1fr;justify-items:center;gap:18px;padding-top:44px}
  .cv-card{height:min(56vh,520px)}
  .cv-info{max-height:none;width:100%;max-width:420px}
}
@media (prefers-reduced-motion:reduce){.cv{transition:none}}`;
  let st = null;

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function fmt(t) {
    if (!t) return '';
    const d = new Date(t * 1000);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function build() {
    if (!document.getElementById('cv-css')) { const s = el('style'); s.id = 'cv-css'; s.textContent = css; document.head.appendChild(s); }
    const root = el('div', 'cv'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    const x = el('button', 'cv-x g', '✕'); x.setAttribute('aria-label', 'Закрыть');
    const inn = el('div', 'cv-in');
    const stage = el('div', 'cv-stage');
    const cardEl = el('div', 'cv-card');
    const front = el('div', 'cv-face'), fimg = el('img'); front.appendChild(fimg);
    const holo = el('div', 'cv-holo'), glare = el('div', 'cv-glare'); front.append(holo, glare);
    const back = el('div', 'cv-face cv-back'), bimg = el('img'); bimg.alt = ''; back.appendChild(bimg);
    cardEl.append(front, back); stage.appendChild(cardEl);
    const info = el('div', 'cv-info');
    inn.append(stage, info); root.append(x, inn);
    return { root, x, stage, cardEl, fimg, bimg, holo, glare, info };
  }

  function paint() {
    const { cardEl, glare, holo } = st.ui;
    const ry = st.ry, rx = st.rx;
    cardEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    const a = ((ry % 360) + 360) % 360, gx = 50 + Math.sin(a * Math.PI / 180) * 60, gy = 50 - rx * 2.2;
    glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.75), rgba(255,255,255,0) 55%)`;
    holo.style.background = `linear-gradient(${115 + ry * 1.5}deg, #ff6ec7 0%, #7afcff 25%, #feff9c 50%, #b28dff 75%, #ff6ec7 100%)`;
    const c = RC[st.items[st.i].rarity] || '#ccc';
    const glow = st.items[st.i].rarity === 'common' ? '0 30px 60px rgba(0,0,0,.45)' :
      `0 0 0 4px ${c}, 0 0 ${st.items[st.i].rarity === 'legend' ? 70 : 45}px ${c}, 0 30px 60px rgba(0,0,0,.45)`;
    cardEl.querySelectorAll('.cv-face').forEach(f => { f.style.boxShadow = glow; });
  }

  function loop() {
    if (!st) return;
    if (!st.drag) {
      if (Math.abs(st.vy) > .02 || Math.abs(st.vx) > .02) {           // инерция после броска
        st.ry += st.vy; st.rx = Math.max(-35, Math.min(35, st.rx + st.vx)); st.vy *= .94; st.vx *= .9;
      } else if (st.target != null) {                                // плавный переворот кнопкой
        const d = st.target - st.ry; st.ry += d * .14; st.rx *= .85; if (Math.abs(d) < .3) { st.ry = st.target; st.target = null; }
      } else if (!reduce()) {                                        // лёгкое покачивание
        st.t += 1; st.rx += ((Math.sin(st.t / 70) * 6) - st.rx) * .03;
        const base = Math.round(st.ry / 180) * 180; st.ry += (base + Math.sin(st.t / 90) * 8 - st.ry) * .03;
      }
    }
    paint();
    st.raf = requestAnimationFrame(loop);
  }

  function fill() {
    const it = st.items[st.i], { fimg, bimg, info, cardEl } = st.ui;
    fimg.src = it.img; fimg.alt = `${it.num} ${it.title}`; bimg.src = it.back;
    cardEl.className = 'cv-card ' + (it.rarity || '');
    info.replaceChildren();
    info.appendChild(el('div', 'cv-num', it.num === '✦' ? '✦ ОСОБАЯ КАРТА' : `АРКАН ${it.num}`));
    const h = el('h2', 'cv-title'); h.id = 'cv-h'; h.setAttribute('aria-label', it.title);
    // буквы в цветах колоды, как надпись на самой карте
    const RAINBOW = ['#E8553F', '#F29A3A', '#F7D44C', '#6CC08B', '#4F86C6', '#F49CB9'];
    let k = 0;
    h.style.setProperty('--L', Math.max(6, ...String(it.title || '').split(/\s+/).map(w => w.length)));
    for (const ch of String(it.title || '')) {
      if (/\s/.test(ch)) { h.append(ch); continue; }
      const sp = el('span', null, ch); sp.style.color = RAINBOW[k++ % RAINBOW.length]; sp.setAttribute('aria-hidden', 'true'); h.appendChild(sp);
    }
    info.appendChild(h);
    st.ui.root.setAttribute('aria-labelledby', 'cv-h');
    const chips = el('div', 'cv-chips');
    const r = el('span', 'cv-chip r', it.rlabel || ''); r.style.background = RC[it.rarity] || '#8C7B72'; chips.appendChild(r);
    if (it.n > 1) chips.appendChild(el('span', 'cv-chip', `×${it.n} в колоде`));
    info.appendChild(chips);
    const log = (it.log || []).slice().sort((a, b) => (a[0] || 0) - (b[0] || 0));
    const firstT = log.find(x => x[0]);
    if (log.length) {
      info.appendChild(el('p', 'cv-note', firstT ? `Получена впервые: ${fmt(firstT[0])}` : 'Получена в первые дни колоды, дату тогда ещё не записывали'));
      const ul = el('ul', 'cv-list');
      log.forEach(([t, say, tr]) => {
        const li = el('li');
        li.appendChild(el('time', null, (t ? fmt(t) : 'дата не записана') + (tr ? ' | по обмену' : '')));
        if (say) li.appendChild(el('q', null, say)); else li.appendChild(el('span', null, 'предсказание не сохранилось'));
        ul.appendChild(li);
      });
      info.appendChild(ul);
    }
    if (it.note) info.appendChild(el('p', 'cv-note', it.note));
    const btns = el('div', 'cv-btns');
    const flip = el('button', null, 'Перевернуть'); flip.onclick = () => { st.vx = st.vy = 0; st.target = Math.round(st.ry / 180) * 180 + 180; };
    btns.appendChild(flip);
    if (st.items.length > 1) {
      const pv = el('button', 'g', '← пред.'), nx = el('button', 'g', 'след. →');
      pv.onclick = () => go(-1); nx.onclick = () => go(1); btns.append(pv, nx);
    }
    info.appendChild(btns);
    info.appendChild(el('p', 'cv-hint', 'Карту можно крутить мышкой или пальцем. Esc или клик по фону — закрыть'));
    st.ry = 0; st.rx = 0; st.vx = st.vy = 0; st.target = null;
  }
  function go(d) { st.i = (st.i + d + st.items.length) % st.items.length; fill(); }

  function close() {
    if (!st) return;
    const s = st; st = null;
    cancelAnimationFrame(s.raf);
    document.removeEventListener('keydown', s.key);
    document.documentElement.style.overflow = s.ov;
    s.ui.root.classList.remove('on');
    setTimeout(() => s.ui.root.remove(), reduce() ? 0 : 230);
    if (s.focus && s.focus.focus) s.focus.focus();
  }

  function open(items, i) {
    if (st) close();
    const ui = build();
    st = { items, i: i || 0, ui, rx: 0, ry: 0, vx: 0, vy: 0, t: 0, drag: null, target: null, focus: document.activeElement,
           ov: document.documentElement.style.overflow };
    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(ui.root);
    fill();
    requestAnimationFrame(() => ui.root.classList.add('on'));
    ui.x.onclick = close;
    ui.root.addEventListener('click', e => { if (e.target === ui.root || e.target.classList.contains('cv-in')) close(); });
    ui.stage.addEventListener('pointerdown', e => {
      st.drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; st.target = null; st.vx = st.vy = 0;
      ui.stage.setPointerCapture(e.pointerId);
    });
    ui.stage.addEventListener('pointermove', e => {
      if (!st || !st.drag) return;
      const dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
      st.drag.x = e.clientX; st.drag.y = e.clientY; st.drag.moved += Math.abs(dx) + Math.abs(dy);
      st.ry += dx * .55; st.rx = Math.max(-35, Math.min(35, st.rx - dy * .35));
      st.vy = dx * .55; st.vx = -dy * .35;
    });
    const up = () => { if (!st || !st.drag) return; st.drag = null; if (reduce()) st.vx = st.vy = 0; };
    ui.stage.addEventListener('pointerup', up); ui.stage.addEventListener('pointercancel', up);
    st.key = e => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && st.items.length > 1) go(1);
      else if (e.key === 'ArrowLeft' && st.items.length > 1) go(-1);
      else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); st.target = Math.round(st.ry / 180) * 180 + 180; }
    };
    document.addEventListener('keydown', st.key);
    ui.x.focus();
    loop();
  }
  window.CardView = { open, close };
})();
