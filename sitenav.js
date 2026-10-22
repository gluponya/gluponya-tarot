/* Общее меню сайта gluponya: главная, таро, питомцы, команды, профили. Одно на все страницы.
   В странице: <nav class="sn" data-page="tarot"></nav><script src="/static/sitenav.js"></script> — сразу за меню, без defer,
   чтобы меню нарисовалось до первой отрисовки и ничего не прыгало.
   Станция: ссылки /home, /tarot…  GitHub Pages (gh_pages.py меняет путь скрипта на sitenav.js): index.html, tarot.html…
   ?obs (сцена OBS) — без меню. */
(() => {
  const nav = document.querySelector('nav.sn');
  if (!nav) return;
  if (/[?&]obs(=|&|$)/.test(location.search)) { nav.remove(); return; }
  const GH = !/\/static\/sitenav\.js/.test((document.currentScript || {}).src || '');
  const PAGES = [
    ['home', '🏠', 'Главная', '/home', './'],
    ['tarot', '🔮', 'Таро', '/tarot', 'tarot.html'],
    ['pets', '🐣', 'Питомцы', '/pets', 'pets.html'],
    ['commands', '💬', 'Команды', '/commands', 'commands.html'],
    ['profile', '🪪', 'Профили', '/profile', 'profile.html'],
  ];
  const st = document.createElement('style');
  st.textContent = `
.sn{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
.sn ul{list-style:none;margin:0;padding:4px;display:flex;flex-wrap:wrap;gap:4px;background:var(--sheet);border:2.5px solid var(--ink);border-radius:26px}
.sn a{display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:0 14px;border-radius:22px;text-decoration:none;color:var(--ink);
  font:900 14px/1.1 var(--display);text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.sn a:hover{background:color-mix(in srgb,var(--ink) 9%,transparent)}
.sn a[aria-current="page"]{background:var(--ink);color:var(--paper)}
.sn a:focus-visible{outline:3px solid var(--focus,var(--ink));outline-offset:2px}
.sn i{font-style:normal;font-size:17px;line-height:1}
.sn .tw{margin-left:auto;border:2.5px solid var(--ink);background:var(--sheet);text-transform:none;letter-spacing:0;font:800 14px/1.1 var(--body)}
@media (max-width:640px){
  .sn ul{width:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border-radius:20px}
  .sn a{flex-direction:column;justify-content:center;gap:3px;min-height:56px;padding:6px 2px;border-radius:15px;
    font:800 12px/1.1 var(--body);text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis}
  .sn i{font-size:21px}
  .sn .tw{display:none}
}
@media (forced-colors:active){.sn ul,.sn .tw{border-color:CanvasText}.sn a[aria-current="page"]{outline:3px solid CanvasText}}`;
  document.head.appendChild(st);
  nav.setAttribute('aria-label', 'Страницы gluponya');
  const ul = document.createElement('ul');
  for (const [key, ico, name, local, gh] of PAGES) {
    const li = document.createElement('li'), a = document.createElement('a'), i = document.createElement('i');
    a.href = GH ? gh : local;
    i.textContent = ico; i.setAttribute('aria-hidden', 'true');
    a.append(i, name);
    if (key === nav.dataset.page) a.setAttribute('aria-current', 'page');
    li.appendChild(a); ul.appendChild(li);
  }
  const tw = document.createElement('a');
  tw.className = 'tw'; tw.href = 'https://twitch.tv/gluponya'; tw.rel = 'noopener'; tw.textContent = 'twitch.tv/gluponya ↗';
  nav.replaceChildren(ul, tw);
})();
