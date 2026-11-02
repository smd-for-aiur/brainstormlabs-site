// 背景のなにもないところをクリック（タップ）すると、ドットのふきだしでアイデアがぽんぽん出てくる。
// 文字やカード、リンクの上では出ない。出たふきだしは 3 秒ほどでふわっと消える。
(function () {
  var ja = document.documentElement.lang === 'ja';
  var IDEAS = ja ? [
    '冷蔵庫の転職を支援するアプリ', 'ブロッコリーと文通できるSNS', '月曜日を3回タップすると消えるボタン', 'ため息を圧縮して保存するクラウド',
    '毎朝カラスが議事録を送ってくるサービス', '消しゴムが将軍の時代劇RPG', '靴下の片方だけが住む国の建国シミュレーション', '冷蔵庫の中で開かれるオリンピック',
    '雲の形を審査するだけのオーディション', '定年退職した信号機のエッセイ集', '税関で働くペンギンの日常マンガ', '自分をパンだと信じている消防車のぬいぐるみ',
    '火曜日の擬人化キャラ（自己肯定感低め）', 'ちくわの穴から世界を見る哲学者', '電子レンジの気持ちを翻訳するイヤホン', '宇宙の果てで開かれるおでんの品評会',
    '謝罪だけを売る自動販売機', '階段の13段目専門の不動産屋', '雨粒に名前をつける公務員', 'ネクタイだけで運営される会社'
  ] : [
    'An app that helps your fridge find a new job', 'A social network for becoming pen pals with broccoli', 'A button that deletes Monday if you tap it three times',
    'A cloud service that compresses and stores your sighs', 'A service where a crow emails you meeting minutes every morning', 'A samurai RPG where an eraser is the shogun',
    'A nation-building sim for the land where all the lost left socks live', 'The Olympics, held inside a refrigerator', 'An audition show where you only judge the shapes of clouds',
    'A memoir by a recently retired traffic light', 'A slice-of-life manga about a penguin who works at customs', 'A plush fire truck that believes it is bread',
    'Tuesday, as a mascot character (low self-esteem)', 'A philosopher who views the world only through the hole of a fish cake', 'Earbuds that translate what your microwave is feeling',
    'An oden tasting contest held at the edge of the universe', 'A vending machine that only sells apologies', 'A real-estate agency that only deals in 13th stairs',
    'A civil servant whose job is naming raindrops', 'A company run entirely by neckties'
  ];
  var SKIP = 'a, button, input, textarea, select, label, .stage, .feature, .moment, .services li, .contact, figure, img, svg';
  var TEXT = 'h1, h2, h3, p, dt, dd, li';               // 文字の行そのものの上だけよける（行の横の余白は背景あつかい）
  var deck = [], live = [];
  var base = (document.currentScript && document.currentScript.src || '').replace(/ideas\.js.*$/, '');

  // 1000 個の本番リストはページが落ちついてから別ファイルで読む。読めるまでは上の 20 個を使う
  function load() {
    if (!window.fetch || !base) return;
    fetch(base + 'ideas-' + (ja ? 'ja' : 'en') + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (list) { if (list && list.length) { IDEAS = list; deck = []; } })
      .catch(function () {});
  }
  if (document.readyState === 'complete') setTimeout(load, 1200);
  else window.addEventListener('load', function () { setTimeout(load, 1200); });

  function next() {                                        // 一巡するまで同じものは出さない
    if (!deck.length) {
      deck = IDEAS.map(function (_, i) { return i; });
      for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    }
    var n = deck.pop();
    return { no: n + 1, text: IDEAS[n] };
  }

  function add(el, ms) {
    document.body.appendChild(el);
    live.push(el);
    setTimeout(function () { el.remove(); live.splice(live.indexOf(el), 1); }, ms);
  }

  function pop(x, y) {
    while (live.length > 18) live.shift().remove();
    var idea = next();
    var b = document.createElement('div');
    b.className = 'idea';
    b.setAttribute('aria-hidden', 'true');
    var no = document.createElement('span');
    no.className = 'no';
    no.textContent = 'IDEA ' + ('000' + idea.no).slice(-4);
    b.appendChild(no);
    b.appendChild(document.createTextNode(idea.text));
    add(b, 3400);
    var vw = document.documentElement.clientWidth, w = b.offsetWidth, h = b.offsetHeight;
    var above = y - window.scrollY > h + 70;                 // 上に出す場所がなければ下に出す
    var left = Math.max(12, Math.min(vw - w - 12, x - 18));
    b.style.left = left + 'px';
    b.style.top = (above ? y - h - 34 : y + 34) + 'px';
    b.style.transformOrigin = (x - left) + 'px ' + (above ? '100%' : '0');
    [[5, 10], [8, 22]].forEach(function (d, i) {            // 考えごとのふきだしの、小さな点
      var s = document.createElement('i');
      s.className = 'idea-dot';
      s.setAttribute('aria-hidden', 'true');
      s.style.cssText = 'left:' + (x - d[0] / 2 + i * 5) + 'px;top:' + (above ? y - d[1] - d[0] / 2 : y + d[1] - d[0] / 2) +
                        'px;width:' + d[0] + 'px;height:' + d[0] + 'px;animation-delay:' + i * 50 + 'ms';
      add(s, 3400);
    });
  }

  function onText(el, x, y) {
    var r = document.createRange();
    r.selectNodeContents(el);
    return Array.prototype.some.call(r.getClientRects(), function (b) {
      return x >= b.left - 4 && x <= b.right + 4 && y >= b.top - 4 && y <= b.bottom + 4;
    });
  }

  document.addEventListener('click', function (e) {
    if (e.button !== 0 || !(e.target instanceof Element) || e.target.closest(SKIP)) return;
    var t = e.target.closest(TEXT);
    if (t && onText(t, e.clientX, e.clientY)) return;
    if (window.getSelection && String(window.getSelection())) return;
    pop(e.pageX, e.pageY);
  });
})();
