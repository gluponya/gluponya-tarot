// Живой 3D-питомец (three.js): модель стадии из static/tama/3d/ (tamagotchi/blender/export_glb.py → stream_export.py),
// анимации состояний, глаза — подмена текстуры по кадрам из anim.json, детали гибрида включаются в самой модели.
// Общий для оверлея (static/tama.html) и галереи (web/pets.html):
//   const pet = await createPet(box, { base: '/static/tama/3d/' });
//   await pet.show({ family: 'sweet', stage: 'adult', parts: ['fins'], character: 'normal' });
//   pet.act('eat');      // разово, потом снова сам по себе (стоит, ходит, сидит)
//   pet.loop('sleep');   // одно состояние по кругу; pet.loop(null) — снова сам по себе
//   pet.pause(true);     // не рисовать, пока питомца не видно
//   pet.turn(rx, ry);    // повернуть, градусы (страница питомцев крутит его мышкой, как яйцо)
// three.js не загрузился или модели нет — createPet / show бросают ошибку, страница остаётся на картинках.
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.169.0/';
let lib = null;
function three() {                  // +esm: загрузчик берёт тот же модуль three, importmap на странице не нужен
  return lib ||= Promise.all([
    import(CDN + '+esm'),
    import(CDN + 'examples/jsm/loaders/GLTFLoader.js/+esm'),
    import(CDN + 'examples/jsm/environments/RoomEnvironment.js/+esm'),
  ]).then(([THREE, { GLTFLoader }, { RoomEnvironment }]) => ({ THREE, GLTFLoader, RoomEnvironment }));
}

// сам по себе: чаще стоит, иногда ходит, сидит или дремлет; сколько секунд держит состояние
const WANDER = [['idle', 0.45, 6, 12], ['walk', 0.2, 3, 5], ['sit', 0.25, 7, 14], ['sleep', 0.1, 8, 15]];
const FADE = 0.3;

export async function createPet(box, { base = '/static/tama/3d/' } = {}) {
  const { THREE, GLTFLoader, RoomEnvironment } = await three();
  const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false });
  ren.setPixelRatio(Math.min(devicePixelRatio, 2));
  ren.outputColorSpace = THREE.SRGBColorSpace;
  ren.toneMapping = THREE.NeutralToneMapping;
  ren.setClearColor(0x000000, 0);
  Object.assign(ren.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  box.append(ren.domElement);
  const scene = new THREE.Scene();
  // мягкая белая комната — только для глянца (глазурь, жемчуг), как белый мир в рендерах Cycles
  const room = new THREE.PMREMGenerator(ren).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf2d9c4, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-2, 3, 4); scene.add(key);
  // камера как у картинок (tamagotchi/blender/dna.py): ортогональная, 18° вбок, 10° сверху
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
  const AZ = THREE.MathUtils.degToRad(18), EL = THREE.MathUtils.degToRad(10);
  const view = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
  cam.position.copy(view).multiplyScalar(10); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const loader = new GLTFLoader(), texLoader = new THREE.TextureLoader();
  const timeline = await (await fetch(base + 'anim.json')).json();
  const models = {}, eyeTex = {};
  // мягкая тень под лапами, как в рендерах: круг с размытым краем на земле
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), new THREE.MeshBasicMaterial({
    map: blur(), color: 0x3a1f2a, transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = -1; scene.add(shadow);
  function blur() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, '#fff'); r.addColorStop(0.45, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function prepare(gltf) {          // один раз на модель: свечение, порядок слоёв лица, отражения глянца
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m.userData.glow) {        // светится само (extras.glow): без света, своими цветами, как emission в Cycles
        const vc = !!o.geometry.attributes.color;
        o.material = new THREE.MeshBasicMaterial({ name: m.name, vertexColors: vc, color: vc ? 0xffffff : m.color,
          transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite, side: m.side, toneMapped: false });
      } else if (m.roughness < 0.4) { m.envMap = room; m.envMapIntensity = 0.8; }
      // прозрачные слои лица не пишут глубину: тени и румянец рисуются раньше глаз и рта
      if (o.material.transparent)
        o.renderOrder = /_(eyes|mouth)$/.test(o.name) ? 3 : /eye_shadow|cheek|bib|belly/.test(o.name + m.name) ? 1 : 0;
    });
    return gltf;
  }
  // не загрузилось — забываем, следующий show попробует снова
  const model = (family, stage) => models[family + '_' + stage] ||= loader.loadAsync(`${base}${family}_${stage}.glb`)
    .then(prepare, e => { delete models[family + '_' + stage]; throw e; });
  async function eyes(family) {     // все глаза семейства заранее: подмена никогда не показывает пустой глаз
    const names = new Set(['normal', 'happy', 'lazy', 'grumpy', ...Object.values(timeline).flatMap(t => t.eyes)].filter(n => n !== 'char'));
    await Promise.all([...names].map(async n => {
      const k = family + '_' + n;
      if (eyeTex[k]) return;
      const t = await texLoader.loadAsync(`${base}${family}_eyes_${n}.png`);
      t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; eyeTex[k] ||= t;
    }));
  }

  let cur = null, mixer = null, eyeMesh = null, action = null, state = null, fixed = null, until = 0, after = null;
  let asked = 0, paused = false, rot = [0, 0];    // asked: номер последнего show — устаревший, догрузившись позже, ничего не меняет
  const clock = new THREE.Clock();

  // кадр как у картинок: окно их камеры из модели (extras.frame, export_glb.py); в старых моделях — по всем
  // деталям стадии сразу, и скрытым тоже (как dna.frame_points): высота — 0.8 кадра, ширина — не больше 0.92
  const FILL = 0.80, WIDE = 0.92;
  let span = null;
  function frame(pet) {
    pet.updateMatrixWorld(true);
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const v = new THREE.Vector3(), lo = [Infinity, Infinity], hi = [-Infinity, -Infinity], g = new THREE.Box3();
    pet.traverse(o => {
      if (!o.isMesh) return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        o.getVertexPosition(i, v).applyMatrix4(o.matrixWorld);   // со скелетом, как на экране
        const x = v.dot(right), y = v.dot(up);
        lo[0] = Math.min(lo[0], x); hi[0] = Math.max(hi[0], x); lo[1] = Math.min(lo[1], y); hi[1] = Math.max(hi[1], y);
      }
      if (o.visible && !o.material.transparent) g.expandByObject(o);
    });
    span = { cx: (lo[0] + hi[0]) / 2, cy: (lo[1] + hi[1]) / 2, w: hi[0] - lo[0], h: hi[1] - lo[1] };
    pet.traverse(o => { const f = o.userData.frame; if (f) span = { cx: f.cx, cy: f.cy, side: f.h }; });   // окно картинок из модели
    lens();
    const mid = g.getCenter(new THREE.Vector3()), size = g.getSize(new THREE.Vector3());
    shadow.position.set(mid.x, g.min.y + 0.002, mid.z);
    shadow.scale.set(size.x * 0.95, size.x * 0.6, 1);
  }
  function lens() {                 // окно камеры по размеру коробки: квадрат — как картинка
    if (!span) return;
    const aspect = box.clientWidth / Math.max(1, box.clientHeight);
    const hh = (span.side || Math.max(span.h / FILL, span.w / WIDE)) / Math.min(aspect, 1) / 2, hw = hh * aspect;
    Object.assign(cam, { left: span.cx - hw, right: span.cx + hw, top: span.cy + hh, bottom: span.cy - hh });
    cam.updateProjectionMatrix();
  }
  function play(name) {
    const clip = cur.animations.find(a => a.name === name); if (!clip) return;
    const next = mixer.clipAction(clip);
    if (next === action) return;
    next.reset().play();
    if (action) action.crossFadeTo(next, FADE, false);
    action = next; state = name;
  }
  function wander() {               // следующее «само по себе» состояние, не то же самое подряд
    const pool = WANDER.filter(w => w[0] !== state || WANDER.length === 1);
    let r = Math.random() * pool.reduce((a, w) => a + w[1], 0), w = pool[0];
    for (const x of pool) { if ((r -= x[1]) <= 0) { w = x; break; } }
    play(w[0]);
    until = clock.elapsedTime + w[2] + Math.random() * (w[3] - w[2]);
  }

  const api = {
    canvas: ren.domElement,
    // питомец: семейство, стадия, детали других семейств (имена из extras.part), характер (глаза)
    async show({ family, stage, parts = [], character = 'normal' }) {
      const my = ++asked;
      const [gltf] = await Promise.all([model(family, stage), eyes(family)]);
      if (my !== asked) return false;
      if (cur !== gltf) {
        if (cur) scene.remove(cur.scene);
        cur = gltf; scene.add(gltf.scene);
        mixer = new THREE.AnimationMixer(gltf.scene); action = null; state = null;
        eyeMesh = null;
        gltf.scene.traverse(o => { if (o.isMesh && /_eyes$/.test(o.name) && o.material.map) eyeMesh = o; });
      }
      const on = new Set(parts);
      gltf.scene.traverse(o => {
        const u = o.userData;
        if (u.part) o.visible = on.has(u.part);
        if (u.only) o.visible = u.only === (on.size ? 'hybrid' : 'pure');
      });
      api.family = family; api.character = character;
      mixer.stopAllAction(); action = null;
      for (const a of gltf.animations) mixer.clipAction(a).reset();
      gltf.scene.rotation.set(0, 0, 0);
      gltf.scene.updateMatrixWorld(true);
      frame(gltf.scene);
      api.turn(...rot);
      if (fixed) play(fixed); else wander();
      return true;
    },
    act(name, loops = 1) {          // разово: кормление, радость; потом снова сам по себе (или то, что задано loop)
      if (!cur) return;
      const clip = cur.animations.find(a => a.name === name); if (!clip) return;
      play(name); action.time = 0;
      until = clock.elapsedTime + clip.duration * loops; after = true;
    },
    pause(on) { paused = !!on; },
    turn(rx, ry) {                  // вокруг своей оси (питомец стоит в начале координат); наклон вполсилы
      rot = [rx, ry];
      if (cur) cur.scene.rotation.set(THREE.MathUtils.degToRad(rx) * 0.5, THREE.MathUtils.degToRad(ry), 0);
    },
    loop(name) { fixed = name; if (!cur) return; if (name) play(name); else wander(); },
    states: () => cur ? cur.animations.map(a => a.name) : [],
    destroy() { ren.setAnimationLoop(null); ren.dispose(); ren.domElement.remove(); },
  };

  function fit() { ren.setSize(box.clientWidth, box.clientHeight, false); lens(); }
  new ResizeObserver(fit).observe(box); fit();
  ren.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!mixer || !action || paused) return;
    mixer.update(dt);
    if (clock.elapsedTime >= until && (after || !fixed)) {
      after = null;
      if (fixed) play(fixed); else wander();
    }
    if (eyeMesh) {                  // глаза кадра, на котором сейчас анимация
      const tl = timeline[state], f = Math.floor(action.time * tl.fps) % tl.frames;
      const want = api.family + '_' + (tl.eyes[f] === 'char' ? api.character : tl.eyes[f]);
      if (eyeMesh.userData.now !== want && eyeTex[want]) {
        eyeMesh.material.map = eyeTex[want]; eyeMesh.material.needsUpdate = true; eyeMesh.userData.now = want;
      }
    }
    ren.render(scene, cam);
  });
  return api;
}
