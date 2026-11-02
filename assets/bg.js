// 背景のしかけ：ページの下に、ほとんど見えないドットの方眼がしいてある。ポインタのまわりだけ方眼が浮かびあがり、
// そのあたりでひらめき（スパーク）がときどき光る。キーボードで「storm」と打つか、お問い合わせの雲を押すと、
// 画面じゅうにひらめきが数秒ふる。動きを減らす設定のときは何もしない。
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cv = document.createElement('canvas');
  var ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return;
  cv.className = 'bgfx';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);

  var STEP = 22, R = 160, P = 4;                      // 方眼の間隔・明かりの半径・ひらめき 1 マスの大きさ（CSS px）
  var FRAMES = [
    [[0, 0]],
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]],
    [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]],
    [[2, 0], [-2, 0], [0, 2], [0, -2]]
  ];
  var W = 0, H = 0, ink = '', colors = [];
  var px = -1e4, py = -1e4, glow = 0, lastMove = -1e4, lastSpawn = 0, sparks = [], drops = [], stormUntil = 0, raf = 0, prev = 0;

  function readColors() {
    var s = getComputedStyle(document.documentElement);
    ink = s.getPropertyValue('--ink').trim();
    colors = ['--amber', '--pink', '--sky', '--leaf'].map(function (v) { return s.getPropertyValue(v).trim(); });
  }
  function resize() {
    var d = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function offY() { return -(window.scrollY % STEP); }   // 方眼はページといっしょに動く

  function frame(t) {
    raf = 0;
    var dt = Math.min(64, prev ? t - prev : 16); prev = t;
    ctx.clearRect(0, 0, W, H);
    glow += ((t - lastMove < 1400 ? 1 : 0) - glow) * Math.min(1, dt / 160);

    if (glow > 0.01) {                                   // ポインタのまわりの方眼
      var oy = offY();
      ctx.fillStyle = ink;
      for (var gx = Math.floor((px - R) / STEP) * STEP; gx <= px + R; gx += STEP)
        for (var gy = Math.floor((py - R - oy) / STEP) * STEP + oy; gy <= py + R; gy += STEP) {
          var k = 1 - Math.hypot(gx - px, gy - py) / R;
          if (k <= 0) continue;
          ctx.globalAlpha = glow * 0.28 * k * k;
          ctx.fillRect(gx - 1, gy - 1, 2, 2);
        }
      ctx.globalAlpha = 1;
    }

    sparks = sparks.filter(function (s) {                 // ひらめき
      var f = Math.floor((t - s.t0) / 90);
      if (f >= FRAMES.length) return false;
      ctx.fillStyle = s.c;
      FRAMES[f].forEach(function (o) { ctx.fillRect(s.x + o[0] * P - P / 2, s.y + o[1] * P - P / 2, P, P); });
      return true;
    });

    if (t < stormUntil)                                   // ひらめきの雨
      for (var n = Math.round(dt / 16 * 1.4); n > 0; n--)
        drops.push({ x: Math.random() * W, y: -12, v: 0.25 + Math.random() * 0.25, c: pick(colors), p: Math.random() * 400 });
    drops = drops.filter(function (d) {
      d.y += d.v * dt;
      if (d.y > H + 12) return false;
      ctx.fillStyle = d.c;
      if ((t + d.p) % 400 < 260) {
        ctx.fillRect(d.x - 1.5, d.y - 4.5, 3, 9);
        ctx.fillRect(d.x - 4.5, d.y - 1.5, 9, 3);
      } else ctx.fillRect(d.x - 1.5, d.y - 1.5, 3, 3);
      return true;
    });

    if (glow > 0.01 || sparks.length || drops.length || t < stormUntil) kick();
  }

  function move(e) {
    px = e.clientX; py = e.clientY;
    var now = performance.now();
    lastMove = now;
    if (now - lastSpawn > 110 && Math.random() < 0.55) {
      lastSpawn = now;
      var oy = offY(), a = Math.random() * Math.PI * 2, r = 30 + Math.random() * (R * 0.6);
      sparks.push({ x: Math.round((px + Math.cos(a) * r) / STEP) * STEP,
                    y: Math.round((py + Math.sin(a) * r - oy) / STEP) * STEP + oy,
                    c: pick(colors), t0: now });
    }
    kick();
  }

  function storm() { stormUntil = performance.now() + 3500; kick(); }

  var typed = '';
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed === 'storm') storm();
  });
  var deco = document.querySelector('.contact .deco');
  if (deco) deco.addEventListener('click', storm);

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', move, { passive: true });
  window.addEventListener('scroll', function () { if (glow > 0.01) kick(); }, { passive: true });
  window.addEventListener('resize', resize);
  var dark = window.matchMedia('(prefers-color-scheme: dark)');
  (dark.addEventListener ? dark.addEventListener('change', readColors) : dark.addListener(readColors));
  readColors();
  resize();
})();
