(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const TG = 'https://t.me/erikhvat';
  const LEAD = 'https://lead-relay.leestygpt.workers.dev/lead/GPDG9H3E9M';
  const audio = new Audio();
  audio.preload = 'none';
  let cur = null;
  const bar = $('#bar');
  const fmt = t => isFinite(t) ? Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') : '0:00';
  const goal = n => { try { window.ym && window.YM_ID && ym(window.YM_ID, 'reachGoal', n); } catch (e) {} };
  const playable = () => $$('.vt-card[data-src]');

  const setUI = () => {
    $$('.vt-card').forEach(c => {
      const on = cur && c.dataset.id === cur.dataset.id && !audio.paused;
      c.classList.toggle('is-playing', on);
      const b = $('.vt-play', c);
      if (b) b.innerHTML = on ? '&#10074;&#10074;' : '&#9654;';
    });
    if (bar) $('#barPlay').innerHTML = audio.paused ? '&#9654;' : '&#10074;&#10074;';
  };
  const load = card => {
    cur = card;
    audio.src = card.dataset.src;
    if (bar) { bar.hidden = false; $('#barTitle').textContent = $('h1,h3', card).textContent; $('#barSub').textContent = 'Эрик Хват'; }
  };
  const play = card => {
    if (!cur || cur.dataset.id !== card.dataset.id) load(card);
    audio.play().catch(() => {});
    goal('vitrina_play');
  };
  const step = d => {
    const vis = playable().filter(c => c.offsetParent !== null);
    const list = vis.length ? vis : playable();
    if (!list.length) return;
    const i = list.findIndex(c => cur && c.dataset.id === cur.dataset.id);
    play(list[(i + d + list.length) % list.length]);
  };

  document.addEventListener('click', e => {
    const lb = e.target.closest('.vt-cover');
    if (lb) { const box = $('#lb'); $('img', box).src = lb.dataset.full; box.hidden = false; return; }
    if (e.target.closest('#lb')) { $('#lb').hidden = true; return; }
    const card = e.target.closest('.vt-card');
    if (!card) return;
    if (e.target.closest('.vt-play')) {
      if (cur && cur.dataset.id === card.dataset.id && !audio.paused) audio.pause(); else play(card);
    } else if (e.target.closest('.vt-wave') && card.dataset.src) {
      const r = e.target.closest('.vt-wave').getBoundingClientRect(), x = e.clientX;
      if (!cur || cur.dataset.id !== card.dataset.id) play(card);
      const seek = () => { if (audio.duration) audio.currentTime = audio.duration * (x - r.left) / r.width; };
      audio.readyState ? seek() : audio.addEventListener('loadedmetadata', seek, { once: true });
    } else if (e.target.closest('.vt-fav')) {
      toggleFav(card.dataset.id); goal('vitrina_fav');
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#lb')) $('#lb').hidden = true; });
  audio.addEventListener('play', setUI);
  audio.addEventListener('pause', setUI);
  audio.addEventListener('ended', () => step(1));
  audio.addEventListener('timeupdate', () => {
    if (!cur || !audio.duration) return;
    const p = audio.currentTime / audio.duration;
    $$('.vt-card').forEach(c => {
      const same = c.dataset.id === cur.dataset.id;
      $$('.vt-wave i', c).forEach((b, i, a) => b.classList.toggle('pl', same && i / a.length < p));
    });
    if (bar) { $('#barSeek').value = Math.round(p * 1000); $('#barT').textContent = fmt(audio.currentTime); }
  });
  $$('.vt-wave').forEach(w => $$('i', w).forEach((b, i) => b.style.setProperty('--n', i)));
  if (bar) {
    $('#barPlay').onclick = () => cur && (audio.paused ? audio.play() : audio.pause());
    $('#barPrev').onclick = () => step(-1);
    $('#barNext').onclick = () => step(1);
    $('#barSeek').oninput = e => audio.duration && (audio.currentTime = audio.duration * e.target.value / 1000);
  }

  /* подборка (хранится только в этой вкладке) */
  let fav = [];
  try { fav = JSON.parse(sessionStorage.getItem('vt-fav') || '[]'); } catch (e) {}
  const titleOf = id => { const c = $('.vt-card[data-id="' + id + '"]'); return c ? $('h1,h3', c).textContent : id; };
  function toggleFav(id) { fav = fav.includes(id) ? fav.filter(x => x !== id) : [...fav, id]; favUI(); }
  function favUI() {
    $$('.vt-card').forEach(c => {
      const on = fav.includes(c.dataset.id);
      $$('.vt-fav', c).forEach(b => { b.classList.toggle('on', on); b.innerHTML = (on ? '&#9829;' : '&#9825;') + (b.classList.contains('vt-fav--txt') ? (on ? ' В подборке' : ' В подборку') : ''); });
    });
    try { sessionStorage.setItem('vt-fav', JSON.stringify(fav)); } catch (e) {}
    const sel = $('#sel');
    if (!sel) return;
    sel.hidden = !fav.length;
    $('#selN').textContent = fav.length;
    $('#selSend').href = TG + '?text=' + encodeURIComponent('Здравствуйте! Хочу запросить лицензию на песни: ' + fav.map(i => '«' + titleOf(i) + '»').join(', ') + '.');
  }
  favUI();

  /* фильтр по языку, поиск, «показать ещё» */
  const grid = $('#grid');
  if (grid) {
    const PAGE = +grid.dataset.page || 24;
    const st = { lang: '', q: '' };
    let shown = PAGE;
    const run = reset => {
      if (reset) shown = PAGE;
      const match = $$('.vt-card', grid).filter(c => (!st.lang || c.dataset.lang === st.lang) && (!st.q || c.dataset.title.includes(st.q)));
      $$('.vt-card', grid).forEach(c => { c.hidden = true; });
      match.forEach((c, i) => { c.hidden = i >= shown; });
      $('#cnt').textContent = 'Найдено: ' + match.length + ' из ' + $$('.vt-card', grid).length;
      $('#more').hidden = match.length <= shown;
      $('#empty').hidden = match.length > 0;
    };
    $$('.vt-chips').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const on = b.classList.contains('on');
      $$('button', g).forEach(x => x.classList.remove('on'));
      st[g.dataset.f] = on ? '' : b.dataset.v;
      if (!on) b.classList.add('on');
      run(true);
    }));
    $('#q').addEventListener('input', e => { st.q = e.target.value.trim().toLowerCase().replace(/ё/g, 'е'); run(true); });
    $('#more').onclick = () => { shown += PAGE; run(); };
    $('#clear').onclick = () => { st.lang = st.q = ''; $('#q').value = ''; $$('.vt-chips button').forEach(x => x.classList.remove('on')); run(true); };
    run(true);
  }

  /* заявка на песню */
  $$('form.vtForm').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    if (fd._gotcha) return;
    const msg = $('.vt-form-msg', form), btn = $('button[type=submit]', form);
    const comment = ['Песня: «' + form.dataset.song + '»', 'Коллектив: ' + (fd.band || '—'), 'Город: ' + (fd.city || '—'), 'Цель: ' + (fd.purpose || '—')].join('\n');
    btn.disabled = true; msg.textContent = 'Отправляем…';
    try {
      const r = await fetch(LEAD, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fd.name, contact: fd.contact, comment, source: 'vitrina' }) });
      if (!r.ok) throw new Error(r.status);
      msg.textContent = 'Заявка отправлена. Автор свяжется с Вами.';
      form.reset(); goal('vitrina_request');
    } catch (err) {
      msg.textContent = 'Не получилось отправить. Напишите автору в Telegram: t.me/erikhvat';
    } finally { btn.disabled = false; }
  }));
})();
