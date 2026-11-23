# -*- coding: utf-8 -*-
"""Публикует статьи из очереди, у которых наступила дата выхода.
Запускается GitHub Action каждый день; повторный запуск ничего не меняет (идемпотентно).
Для проверки: BLOG_TODAY=2026-12-01 python3 .github/blog-queue/publish_next.py"""
import datetime, html, json, os, re, shutil

Q = os.path.join('.github', 'blog-queue')
BASE = 'https://irektuhvatshin.ru'
MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
sched_path = os.path.join(Q, 'schedule.json')
sched = json.load(open(sched_path, encoding='utf-8'))
today = os.environ.get('BLOG_TODAY') or (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).date().isoformat()


def ru_date(s):
    y, m, d = s.split('-')
    return '%d %s %s' % (int(d), MONTHS[int(m) - 1], y)


def rw(path, fn):
    t = open(path, encoding='utf-8', newline='').read()
    t2 = fn(t)
    if t2 != t:
        open(path, 'w', encoding='utf-8', newline='').write(t2)


done = []
for it in sorted(sched, key=lambda x: x['date']):
    if it.get('published') or it['date'] > today:
        continue
    slug = it['slug']
    shutil.copyfile(os.path.join(Q, slug + '.html'), slug + '.html')
    card = '<a class="card" href="%s.html" style="display:block"><div class="eyebrow">%s</div><h3>%s</h3><p>%s</p></a>' % (
        slug, ru_date(it['date']), html.escape(it['title']), html.escape(it['desc']))

    def add_card(t):
        if 'href="%s.html"' % slug in t:
            return t
        i = t.index('<div class="grid grid-2">')
        j = t.index('</div></div></section>', i)
        return t[:j] + card + t[j:]
    rw('blog.html', add_card)

    def add_map(t):
        loc = '%s/%s.html' % (BASE, slug)
        if loc in t:
            return t
        t = t.replace('</urlset>', '  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n</urlset>' % (loc, it['date']))
        return re.sub(r'(<loc>%s/blog\.html</loc><lastmod>)[^<]*' % re.escape(BASE), r'\g<1>' + today, t)
    rw('sitemap.xml', add_map)
    for extra in it.get('replace', []):   # страницы, которые обновляются в день выхода статьи (например, словарь)
        shutil.copyfile(os.path.join(Q, extra), extra)
    it['published'] = True
    done.append(slug)

if done:
    json.dump(sched, open(sched_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('published:', done or 'nothing to publish (today=%s)' % today)
