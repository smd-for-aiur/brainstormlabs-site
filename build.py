# -*- coding: utf-8 -*-
"""Brainstorm Labs のサイトを書き出す。  python3 build.py

index.html（日本語）と en/index.html（英語）を、下の TEXT から同じ骨組みで作る。
文言を直すときは TEXT を直して、このスクリプトを実行する。
"""
import html, json, pathlib

ROOT = pathlib.Path(__file__).parent
SITE = 'https://brainstormlabs.app'
EMAIL = 'hello@brainstormlabs.app'
APPSTORE = 'https://apps.apple.com/app/apple-store/id6823616416?pt=616456&ct=brainstormlabs&mt=8'

AMBER = '#ffb52e'

# ドット絵（. は透明、X は文字色、ほかは下の PALETTE）
# マーク：ひらめき（スパーク）をふらせる雲 = brainstorm
MARK = ['.....XXXX.....',
        '....XXXXXX....',
        '...XXXXXXXXXX.',
        '.XXXXXXXXXXXXX',
        'XXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXX',
        '.XXXXXXXXXXXX.',
        '..............',
        '...A......A...',
        '..AAA....AAA..',
        '...A..A...A...',
        '.....AAA......',
        '......A.......']
# ロゴタイプ：brainstorm labs（7段のドット文字、手描き）
WORD = ['X.............X.................................X......X........',
        'X..........................X....................X......X........',
        'XXX..X.X.XXX..X.XXX...XXX.XXX..XX..X.X.XXXX.....X.XXX..XXX...XXX',
        'X..X.XX.....X.X.X..X.X.....X..X..X.XX..X.X.X....X....X.X..X.X...',
        'X..X.X....XXX.X.X..X..XX...X..X..X.X...X.X.X....X..XXX.X..X..XX.',
        'X..X.X...X..X.X.X..X....X..X..X..X.X...X.X.X....X.X..X.X..X....X',
        'XXX..X....XXX.X.X..X.XXX....X..XX..X...X.X.X....X..XXX.XXX..XXX.']
ICONS = {
    'apps': ['..XXXXXXXX..',
             '..X......X..',
             '..X......X..',
             '..X..A...X..',
             '..X.AAA..X..',
             '..X..A...X..',
             '..X......X..',
             '..X......X..',
             '..X......X..',
             '..X..XX..X..',
             '..XXXXXXXX..'],
    'characters': ['.X........X.',
                   '.XX......XX.',
                   '.XPX....XPX.',
                   '.X.XXXXXX.X.',
                   'X..........X',
                   'X..X....X..X',
                   'X..X....X..X',
                   'X....PP....X',
                   'X...X..X...X',
                   '.X........X.',
                   '..XXXXXXXX..'],
    'licensing': ['.....XX.....',
                  '....XAAX....',
                  '....XAAX....',
                  'XXXXXAAXXXXX',
                  '.XAAAAAAAAX.',
                  '..XAAAAAAX..',
                  '...XAAAAX...',
                  '..XAAXXAAX..',
                  '..XAX..XAX..',
                  '.XAX....XAX.',
                  '.XX......XX.'],
    'goods': ['............',
              'XXXXX..XXXXX',
              'X...XXXX...X',
              'X.SS.XX.SS.X',
              'X....XX....X',
              'X.SS.XX.SS.X',
              'X....XX....X',
              'X.SS.XX.SS.X',
              'X....XX....X',
              'XXXXXXXXXXXX',
              '.....XX.....'],
}
PALETTE = {'X': 'currentColor', 'A': AMBER, 'P': '#f2577b', 'S': '#4fb0e3', 'L': '#5fb350'}


def pixels(grid, cls='', unit=None):
    w, h = len(grid[0]), len(grid)
    rects = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{PALETTE[c]}"/>'
                    for y, row in enumerate(grid) for x, c in enumerate(row) if c != '.')
    size = f' width="{w * unit:g}" height="{h * unit:g}"' if unit else ''
    return (f'<svg{" class=" + chr(34) + cls + chr(34) if cls else ""}{size} viewBox="0 0 {w} {h}" '
            f'shape-rendering="crispEdges" aria-hidden="true">{rects}</svg>')


def logo(mark_unit, word_unit):
    return pixels(MARK, 'mk', mark_unit) + pixels(WORD, 'wd', word_unit)


def asset_svgs():
    """assets/ の mark.svg・logo.svg・favicon.svg を書く（ほかで使うときの原本）"""
    def rects(grid, colors, dx=0, dy=0):
        return ''.join(f'<rect x="{x + dx:g}" y="{y + dy:g}" width="1" height="1" fill="{colors[c]}"/>'
                       for y, row in enumerate(grid) for x, c in enumerate(row) if c != '.')
    ink = {'X': '#16171b', 'A': AMBER}
    head = '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" '
    (ROOT / 'assets' / 'mark.svg').write_text(f'{head}viewBox="0 0 14 14">{rects(MARK, ink)}</svg>\n', encoding='utf-8')
    word = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>' for y, row in enumerate(WORD) for x, c in enumerate(row) if c != '.')
    (ROOT / 'assets' / 'logo.svg').write_text(
        f'{head}viewBox="0 0 115 14">{rects(MARK, ink)}<g fill="#16171b" transform="translate(19 1.75) scale(1.5)">{word}</g></svg>\n', encoding='utf-8')
    cells = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"{"" if c == "A" else " class=" + chr(34) + "c" + chr(34)}/>'
                    for y, row in enumerate(MARK) for x, c in enumerate(row) if c != '.')
    (ROOT / 'assets' / 'favicon.svg').write_text(
        f'{head}viewBox="-1 -1 16 16" fill="{AMBER}"><style>.c{{fill:#16171b}}@media (prefers-color-scheme:dark){{.c{{fill:#eeece6}}}}</style>{cells}</svg>\n', encoding='utf-8')


MOMENTS = ['yubi', 'chou-hana', 'neko-suzume', 'ame-ki', 'tsukikage', 'yuki-inu']

TEXT = {
    'ja': {
        'path': '', 'other': 'en/', 'other_label': 'English', 'other_lang': 'en',
        'title': 'Brainstorm Labs｜アプリ・ゲーム・キャラクターの会社',
        'description': 'Brainstorm Labs合同会社は、アプリとゲーム、キャラクターをつくる東京のスタジオです。ドット絵ペットアプリ「Pikomofu」を開発・運営しています。',
        'nav': [('products', 'プロダクト'), ('business', '事業内容'), ('company', '会社概要'), ('contact', 'お問い合わせ')],
        'eyebrow': 'Tokyo · Apps, Games & Characters',
        'h1': 'ひらめきを、<br>手のひらに。',
        'lead': 'Brainstorm Labs は、アプリとゲーム、そしてキャラクターをつくる東京のスタジオです。毎日ひらきたくなる、小さくてやさしいものをつくっています。',
        'cta1': 'プロダクトを見る', 'cta2': 'お問い合わせ',
        'products_h': 'プロダクト',
        'app_tag': 'ほんとうの空の下の、ちいさなおにわ',
        'app_desc': 'ドット絵の犬や猫と暮らすアプリです。おにわの空と天気は、ほんとうの空と天気。季節がうつろい、夜には今夜とおなじ形の月がのぼります。',
        'facts': ['iPhone・iPad・Apple Watch・ウィジェット', '1匹はずっと無料・広告なし', '日本語・英語など12言語', 'Android 版は準備中'],
        'badge': 'ja', 'badge_alt': 'App Store からダウンロード', 'site_link': 'pikomofu.com', 'site_url': 'https://pikomofu.com/',
        'app_art_alt': 'Pikomofu のおにわで、柴犬と白い猫がならんでいる絵',
        'moments_h': 'おにわで おきること',
        'moments': ['ゆびをのせると、トクトク', 'はなに、ちょうちょ', 'すずめに、カカカ', '雨の日は、木の下で', '今夜とおなじ月', '雪の日は、はしゃいで'],
        'business_h': '事業内容',
        'business': [('apps', 'アプリ・ゲーム', 'スマートフォン、タブレット、パソコン向けのアプリとゲームの企画、開発、配信、運営。'),
                     ('characters', 'キャラクター・コンテンツ', 'キャラクター、イラスト、映像、音楽などのデジタルコンテンツの制作と配信。'),
                     ('licensing', 'ライセンス', '自社のキャラクターと作品の、知的財産の管理と使用許諾。'),
                     ('goods', 'グッズ・出版', '自社キャラクターの商品と、書籍・絵本・電子書籍の企画と販売。')],
        'company_h': '会社概要',
        'company': [('商号', 'Brainstorm Labs合同会社<br><span class="sub">英文表記 Brainstorm Labs LLC</span>'),
                    ('設立', '2026年11月2日'),
                    ('所在地', '東京都渋谷区'),
                    ('事業内容', '<ul><li>アプリ・ゲームの企画・開発・配信・運営</li><li>キャラクター・デジタルコンテンツの制作・配信</li><li>知的財産の管理・使用許諾</li><li>キャラクター商品の企画・販売、出版</li></ul>'),
                    ('お問い合わせ', f'<a href="mailto:{EMAIL}">{EMAIL}</a>')],
        'contact_h': 'お問い合わせ',
        'contact_p': 'ライセンスやコラボレーション、取材、そのほかのご相談は、メールでお気軽にどうぞ。',
        'tm': 'Apple、Apple のロゴ、iPhone、iPad、Apple Watch は、米国およびその他の国で登録された Apple Inc. の商標です。App Store は Apple Inc. のサービスマークです。',
    },
    'en': {
        'path': 'en/', 'other': '', 'other_label': '日本語', 'other_lang': 'ja',
        'title': 'Brainstorm Labs — apps, games and characters from Tokyo',
        'description': 'Brainstorm Labs is a Tokyo studio making apps, games and characters, including the pixel-art pet app Pikomofu.',
        'nav': [('products', 'Products'), ('business', 'What we do'), ('company', 'Company'), ('contact', 'Contact')],
        'eyebrow': 'Tokyo · Apps, Games & Characters',
        'h1': 'Little sparks,<br>made <span class="nw">pocket-sized.</span>',
        'lead': 'Brainstorm Labs is a studio in Tokyo making apps, games and characters — small, gentle things you’ll want to open every day.',
        'cta1': 'See our products', 'cta2': 'Get in touch',
        'products_h': 'Products',
        'app_tag': 'A little garden under the real sky',
        'app_desc': 'Live with pixel-art dogs and cats. The sky and weather in the garden are the real sky and weather. Seasons change, and at night the moon rises in the same shape as tonight’s.',
        'facts': ['iPhone, iPad, Apple Watch and widgets', 'One pet free forever · no ads', '12 languages', 'Android coming soon'],
        'badge': 'en', 'badge_alt': 'Download on the App Store', 'site_link': 'pikomofu.com', 'site_url': 'https://pikomofu.com/en/',
        'app_art_alt': 'A shiba dog and a white cat side by side in the Pikomofu garden',
        'moments_h': 'Little moments in the garden',
        'moments': ['Rest a finger, feel the beat', 'A butterfly on the nose', 'Chattering at a sparrow', 'Rainy days, under the tree', 'The same moon as tonight', 'Snow days are for romping'],
        'business_h': 'What we do',
        'business': [('apps', 'Apps & games', 'Planning, development, publishing and operation of apps and games for phones, tablets and computers.'),
                     ('characters', 'Characters & content', 'Characters, illustration, video, music and other digital content.'),
                     ('licensing', 'Licensing', 'Managing and licensing the intellectual property behind our own characters and works.'),
                     ('goods', 'Goods & publishing', 'Merchandise for our characters, plus books, picture books and e-books.')],
        'company_h': 'Company',
        'company': [('Name', 'Brainstorm Labs LLC<br><span class="sub" lang="ja">Brainstorm Labs合同会社</span>'),
                    ('Founded', 'November 2, 2026'),
                    ('Location', 'Shibuya, Tokyo, Japan'),
                    ('Business', '<ul><li>Apps and games</li><li>Characters and digital content</li><li>Intellectual property licensing</li><li>Character merchandise and publishing</li></ul>'),
                    ('Contact', f'<a href="mailto:{EMAIL}">{EMAIL}</a>')],
        'contact_h': 'Say hello',
        'contact_p': 'For licensing, collaborations, press or anything else, drop us a line.',
        'tm': 'Apple, the Apple logo, iPhone, iPad and Apple Watch are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc.',
    },
}


def page(lang):
    t = TEXT[lang]
    up = '../' if t['path'] else ''
    a = up + 'assets/'
    url = SITE + '/' + t['path']
    org = {'@context': 'https://schema.org', '@type': 'Organization', 'name': 'Brainstorm Labs LLC',
           'alternateName': 'Brainstorm Labs合同会社', 'url': SITE + '/', 'logo': SITE + '/assets/icon-512.png',
           'email': EMAIL, 'foundingDate': '2026-11-02',
           'address': {'@type': 'PostalAddress', 'addressLocality': 'Shibuya-ku', 'addressRegion': 'Tokyo', 'addressCountry': 'JP'}}
    nav = ''.join(f'<a href="#{i}">{n}</a>' for i, n in t['nav'])
    facts = ''.join(f'<li>{f}</li>' for f in t['facts'])
    moments = ''.join(
        f'<figure class="moment"><picture><source srcset="{a}moments/{m}.png" media="(prefers-reduced-motion: reduce)">'
        f'<img src="{a}moments/{m}.gif" width="120" height="56" alt="{html.escape(c)}" loading="lazy" decoding="async"></picture>'
        f'<figcaption>{c}</figcaption></figure>' for m, c in zip(MOMENTS, t['moments']))
    business = ''.join(f'<li>{pixels(ICONS[k])}<h3>{h}</h3><p>{p}</p></li>' for k, h, p in t['business'])
    company = ''.join(f'<dt>{k}</dt><dd>{v}</dd>' for k, v in t['company'])
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t["title"]}</title>
<meta name="description" content="{t["description"]}">
<meta name="theme-color" content="#f6f4ee" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1013" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="ja" href="{SITE}/">
<link rel="alternate" hreflang="en" href="{SITE}/en/">
<link rel="alternate" hreflang="x-default" href="{SITE}/en/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Brainstorm Labs">
<meta property="og:title" content="Brainstorm Labs">
<meta property="og:description" content="{t["description"]}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{a}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{a}apple-touch-icon.png">
<link rel="preload" href="{a}fonts/dot-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{a}site.css">
<script type="application/ld+json">{json.dumps(org, ensure_ascii=False)}</script>
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="brand" href="./" aria-label="Brainstorm Labs">{logo(2, 3)}</a>
    <nav class="nav">{nav}<a class="lang" href="{up}{t["other"]}" hreflang="{t["other_lang"]}" lang="{t["other_lang"]}">{t["other_label"]}</a></nav>
  </div>
</header>

<main>
  <div class="wrap hero">
    <div>
      <p class="eyebrow">{t["eyebrow"]}</p>
      <h1>{t["h1"]}</h1>
      <p class="lead">{t["lead"]}</p>
      <p class="cta"><a class="btn primary" href="#products">{t["cta1"]}</a><a class="btn" href="#contact">{t["cta2"]}</a></p>
    </div>
    <div class="stage" aria-hidden="true"><canvas></canvas><p class="sky-label"><span class="t"></span></p></div>
  </div>

  <section id="products">
    <div class="wrap">
      <div class="head"><p class="eyebrow">01 · Products</p><h2>{t["products_h"]}</h2></div>
      <article class="feature">
        <div class="art"><img src="{a}pikomofu-og.png" width="1200" height="630" alt="{t["app_art_alt"]}"></div>
        <div class="body">
          <div>
            <div class="app"><img src="{a}pikomofu.png" width="64" height="64" alt=""><div><h3>Pikomofu</h3><p>{t["app_tag"]}</p></div></div>
            <p class="desc">{t["app_desc"]}</p>
          </div>
          <div>
          <ul class="facts">{facts}</ul>
          <div class="stores">
            <a href="{APPSTORE}"><picture><source srcset="{a}{t["badge"]}-white.svg" media="(prefers-color-scheme: dark)"><img src="{a}{t["badge"]}-black.svg" height="44" alt="{t["badge_alt"]}"></picture></a>
            <a class="more" href="{t["site_url"]}">{t["site_link"]} <span aria-hidden="true">→</span></a>
          </div>
          </div>
        </div>
      </article>
      <h3 class="moments-h">{t["moments_h"]}</h3>
      <div class="moments">{moments}</div>
    </div>
  </section>

  <section id="business">
    <div class="wrap">
      <div class="head"><p class="eyebrow">02 · What we do</p><h2>{t["business_h"]}</h2></div>
      <ul class="services">{business}</ul>
    </div>
  </section>

  <section id="company">
    <div class="wrap">
      <div class="head"><p class="eyebrow">03 · Company</p><h2>{t["company_h"]}</h2></div>
      <dl class="company">{company}</dl>
    </div>
  </section>

  <section id="contact" class="last">
    <div class="wrap">
      <div class="contact">
        <p class="eyebrow">04 · Contact</p>
        <h2>{t["contact_h"]}</h2>
        <p>{t["contact_p"]}</p>
        <a class="mail" href="mailto:{EMAIL}">{EMAIL}<span aria-hidden="true">→</span></a>
        {pixels(MARK, "deco")}
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <div class="row"><a class="brand" href="./" aria-label="Brainstorm Labs">{logo(1.5, 2)}</a><span>© 2026 Brainstorm Labs LLC</span></div>
    <p class="tm">{t["tm"]}</p>
  </div>
</footer>
<script src="{a}sky.js" defer></script>
<script src="{a}bg.js" defer></script>
<script src="{a}ideas.js" defer></script>
</body>
</html>
'''


if __name__ == '__main__':
    (ROOT / 'index.html').write_text(page('ja'), encoding='utf-8')
    (ROOT / 'en').mkdir(exist_ok=True)
    (ROOT / 'en' / 'index.html').write_text(page('en'), encoding='utf-8')
    asset_svgs()
    print('wrote index.html, en/index.html, assets/mark.svg, logo.svg, favicon.svg')
