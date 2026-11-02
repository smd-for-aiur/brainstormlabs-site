// ヒーローの「いまの空」：見ている人の時刻の空に、ロゴの雲がひらめき（スパーク）をふらせる。
// 地面に落ちたひらめきは、小さな花になってしばらく咲く。雲はポインタのほうへゆっくり動き、
// クリック（タップ）するとたくさんふる。動きを減らす設定のときは止まった絵だけ描く。
(function () {
  var stage = document.querySelector('.stage');
  if (!stage) return;
  var cv = stage.querySelector('canvas'), label = stage.querySelector('.sky-label .t');
  var ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return;

  var CLOUD = ['.....XXXX.....', '....XXXXXX....', '...XXXXXXXXXX.', '.XXXXXXXXXXXXX',
               'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', '.XXXXXXXXXXXX.'];
  var PUFF = ['..XXX...', '.XXXXXX.', 'XXXXXXXX'];
  var MOON = ['.XXX.', 'XXXX.', 'XXX..', 'XXXX.', '.XXX.'];
  var SKIES = {
    night: { sky: ['#0d1430', '#121c40', '#18244f', '#22325f'], ground: ['#2d5138', '#203d2a'], cloud: ['#d3daee', '#a3aecb'], puff: '#2f3d6b' },
    dawn:  { sky: ['#6470ad', '#a88cbc', '#eba8a2', '#f8d2a2'], ground: ['#6fae5c', '#579a4a'], cloud: ['#fff7f2', '#f0d0cc'], puff: '#f6cfc6' },
    day:   { sky: ['#62b4e8', '#80c5ef', '#9fd5f4', '#c2e6f8'], ground: ['#7cc46a', '#5fb350'], cloud: ['#ffffff', '#d6e7f2'], puff: '#ecf7fd' },
    dusk:  { sky: ['#4c5394', '#986ea4', '#e38e7a', '#f6c587'], ground: ['#5f9c50', '#4c8442'], cloud: ['#fff2e8', '#e9c1b6'], puff: '#f3b9a6' }
  };
  var SPARKS = ['#ffb52e', '#f2577b', '#ffffff', '#ffd25e'];
  var S = 3;                                   // 雲 1マス = 3px（キャンバスは横 96px）
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var W = 96, H = 96, GROUND = 14, phase = '', pal = SKIES.day, bg = document.createElement('canvas');
  var stars = [], puffs = [], drops = [], bursts = [], flowers = [];
  var cloud = { x: -1, tx: 0, y: 18 }, tick = 0, rainIn = 0, running = false, visible = true, last = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function px(x, y, c, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); }

  var forced = (location.search.match(/[?&]sky=(night|dawn|day|dusk)/) || [])[1];   // 確認用 ?sky=night など
  function phaseOf(h) { return forced || (h >= 19 || h < 5 ? 'night' : h < 7 ? 'dawn' : h < 16 ? 'day' : 'dusk'); }

  function clock() {
    var d = new Date(), p = phaseOf(d.getHours());
    if (label) label.textContent = 'YOUR SKY · ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    if (p !== phase) {
      phase = p; pal = SKIES[p];
      stage.classList.toggle('is-night', p === 'night');
      paintBackground();
    }
  }

  // 空・地面・星の土台（変わらないもの）は別のキャンバスに一度だけ描く
  function paintBackground() {
    bg.width = W; bg.height = H;
    var b = bg.getContext('2d'), n = pal.sky.length, skyH = H - GROUND;
    var stops = pal.sky.map(function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; });
    for (var y = 0; y < skyH; y += 3) {             // 3px ごとの帯で、なめらかに色を変える
      var f = Math.min(0.999, (y + 1.5) / skyH) * (n - 1), i = Math.floor(f), k = f - i, c0 = stops[i], c1 = stops[i + 1];
      b.fillStyle = 'rgb(' + [0, 1, 2].map(function (j) { return Math.round(c0[j] + (c1[j] - c0[j]) * k); }).join(',') + ')';
      b.fillRect(0, y, W, 3);
    }
    b.fillStyle = pal.ground[1]; b.fillRect(0, skyH, W, GROUND);
    b.fillStyle = pal.ground[0]; b.fillRect(0, skyH, W, 2);
    for (var gx = 2; gx < W; gx += 5 + (gx * 7 % 4)) b.fillRect(gx, skyH - 1, 1, 1);   // 草の先
    for (var sx = 1; sx < W; sx += 3 + (sx * 5 % 5)) b.fillRect(sx, skyH + 4 + (sx % 3) * 3, 1, 1);
    if (phase === 'night') {
      b.fillStyle = '#f4efd6';
      MOON.forEach(function (row, j) { for (var i = 0; i < row.length; i++) if (row[i] === 'X') b.fillRect(W - 14 + i, 6 + j, 1, 1); });
    }
  }

  function resize() {
    var r = cv.getBoundingClientRect();
    if (!r.width) return;
    W = 96; H = Math.max(54, Math.round(W * r.height / r.width));
    cv.width = W; cv.height = H;
    GROUND = Math.round(H * 0.11);
    cloud.y = Math.round(H * (H < 100 ? 0.1 : 0.15));
    cloud.x = cloud.tx = Math.round((W - 14 * S) / 2);
    stars = [];
    for (var i = 0; i < 22; i++) stars.push({ x: Math.floor(rnd(0, W)), y: Math.floor(rnd(0, (H - GROUND) * 0.7)), p: Math.floor(rnd(0, 60)) });
    puffs = [];
    for (var k = 0; k < 3; k++) puffs.push({ x: rnd(0, W), y: Math.round(rnd(H * 0.06, H * 0.5)), v: rnd(0.04, 0.1) });
    flowers = flowers.filter(function (f) { return f.x < W; });
    paintBackground();
    draw();
  }

  function drawCloud() {
    var bob = (tick >> 4) & 1, x0 = Math.round(cloud.x), y0 = cloud.y + bob;
    CLOUD.forEach(function (row, j) {
      for (var i = 0; i < 14; i++) if (row[i] === 'X') {
        var shade = j === CLOUD.length - 1 || (j === CLOUD.length - 2 && (i === 0 || i === 13));
        px(x0 + i * S, y0 + j * S, shade ? pal.cloud[1] : pal.cloud[0], S, S);
      }
    });
  }

  function draw() {
    ctx.drawImage(bg, 0, 0);
    if (phase === 'night') stars.forEach(function (s) {
      var k = (tick + s.p) % 60;
      if (k > 4) px(s.x, s.y, k > 50 ? '#ffffff' : '#c9d1ef');
    });
    puffs.forEach(function (p) {
      PUFF.forEach(function (row, j) { for (var i = 0; i < row.length; i++) if (row[i] === 'X') px(p.x + i * 2, p.y + j * 2, pal.puff, 2, 2); });
    });
    var top = H - GROUND;
    flowers.forEach(function (f) {
      var a = f.age, end = f.life - a;
      if (a < 3 || end < 3) { px(f.x, top - 1, pal.ground[0]); return; }
      px(f.x, top - 3, pal.ground[0], 1, 3);
      if (a > 6 && end > 6) { px(f.x, top - 5, f.c); px(f.x - 1, top - 4, f.c); px(f.x + 1, top - 4, f.c); px(f.x, top - 4, '#fff3b0'); }
      else px(f.x, top - 4, f.c);
    });
    drops.forEach(function (d) {
      if ((tick + d.p) % 8 < 5) { px(d.x, d.y, d.c); px(d.x - 1, d.y + 1, d.c); px(d.x + 1, d.y + 1, d.c); px(d.x, d.y + 2, d.c); px(d.x, d.y + 1, d.c); }
      else px(d.x, d.y + 1, d.c);
    });
    bursts.forEach(function (b) {
      var r = b.f + 1;
      [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r - 1], [-r - 1, 0], [r + 1, 0]].forEach(function (o) { px(b.x + o[0], b.y + o[1], b.c); });
    });
    drawCloud();
  }

  function rain(n) {
    for (var i = 0; i < n; i++)
      drops.push({ x: Math.round(cloud.x + rnd(3, 14 * S - 3)), y: cloud.y + 8 * S + 1 + i * 3, v: rnd(0.55, 0.85), c: pick(SPARKS), p: Math.floor(rnd(0, 8)) });
  }

  function step() {
    tick++;
    puffs.forEach(function (p) { p.x += p.v; if (p.x > W) p.x = -16; });
    var dx = cloud.tx - cloud.x;
    if (Math.abs(dx) > 0.5) cloud.x += Math.max(-0.6, Math.min(0.6, dx * 0.08));
    if (--rainIn <= 0) { rain(1); rainIn = Math.round(rnd(5, 13)); }
    var ground = H - GROUND - 3;
    drops = drops.filter(function (d) {
      d.y += d.v;
      if (d.y < ground) return true;
      bursts.push({ x: d.x, y: ground + 1, c: d.c, f: 0 });
      if (flowers.length < 16 && Math.random() < 0.7) flowers.push({ x: d.x, c: d.c === '#ffffff' ? '#f2577b' : d.c, age: 0, life: Math.round(rnd(180, 320)) });
      return false;
    });
    bursts = bursts.filter(function (b) { return ++b.f < 3; });
    flowers = flowers.filter(function (f) { return ++f.age < f.life; });
  }

  function loop(now) {
    if (!running) return;
    if (!last) last = now;
    var n = Math.min(20, Math.floor((now - last) / 50));   // 1コマ 50ms。フレームが落ちても進みぐあいは同じ
    if (n > 0) { last += n * 50; while (n--) step(true); draw(); }
    requestAnimationFrame(loop);
  }

  function still() {
    drops = [{ x: cloud.x + 10, y: cloud.y + 30, c: SPARKS[0], p: 0 }, { x: cloud.x + 30, y: cloud.y + 44, c: SPARKS[1], p: 0 }];
    flowers = [{ x: 22, c: SPARKS[0], age: 20, life: 999 }, { x: 52, c: SPARKS[1], age: 20, life: 999 }, { x: 74, c: SPARKS[3], age: 20, life: 999 }];
    draw();
  }

  function update() {
    var go = visible && !document.hidden && !reduce.matches;
    if (go && !running) { running = true; last = 0; requestAnimationFrame(loop); }
    if (!go) { running = false; if (reduce.matches) still(); }
  }

  function toCanvasX(e) { var r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; }
  stage.addEventListener('pointermove', function (e) { cloud.tx = Math.max(0, Math.min(W - 14 * S, toCanvasX(e) - 7 * S)); });
  stage.addEventListener('pointerdown', function () { if (running) rain(6); });

  clock();
  resize();
  setInterval(clock, 20000);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv); else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; update(); }).observe(stage);
  document.addEventListener('visibilitychange', update);
  if (reduce.addEventListener) reduce.addEventListener('change', update); else reduce.addListener(update);
  update();
})();
