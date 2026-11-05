(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const TG = 'https://t.me/erikhvat';
  const audio = new Audio();
  audio.preload = 'none';
  let cards = [], cur = null;
  const bar = $('#bar');
  const fmt = t => isFinite(t) ? Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') : '0:00';
  const goal = n => { try { window.ym && window.YM_ID && ym(window.YM_ID, 'reachGoal', n); } catch (e) {} };

  const sync = () => {
    cards = $$('.vt-card[data-src]');
    cards.forEach(c => $$('.vt-wave i', c).forEach((b, i) => b.style.setProperty('--n', i)));
  };
  sync();

  const setPlayingUI = () => {
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
    if (bar) {
      bar.hidden = false;
      $('#barTitle').textContent = card.querySelector('h3').textContent;
      $('#barSub').textContent = 'Эрик Хват';
    }
  };
  const play = card => {
    if (!cur || cur.dataset.id !== card.dataset.id) load(card);
    audio.play().catch(() => {});
    goal('vitrina_play');
  };
  const toggle = card => {
    if (cur && cur.dataset.id === card.dataset.id && !audio.paused) audio.pause();
    else play(card);
  };
  const step = d => {
    const vis = cards.filter(c => !c.hidden && c.closest('#grid, .vt-song') && c.offsetParent !== null);
    const list = vis.length ? vis : cards;
    const i = list.findIndex(c => cur && c.dataset.id === cur.dataset.id);
    const n = list[(i + d + list.length) % list.length];
    if (n) play(n);
  };

  document.addEventListener('click', e => {
    const card = e.target.closest('.vt-card');
    if (!card) return;
    if (e.target.closest('.vt-play')) toggle(card);
    else if (e.target.closest('.vt-wave')) {
      const w = e.target.closest('.vt-wave'), r = w.getBoundingClientRect();
      if (!cur || cur.dataset.id !== card.dataset.id) play(card);
      const seek = () => { if (audio.duration) audio.currentTime = audio.duration * (e.clientX - r.left) / r.width; };
      audio.readyState ? seek() : audio.addEventListener('loadedmetadata', seek, { once: true });
    } else if (e.target.closest('.vt-fav')) {
      card.dataset.fav = card.dataset.fav === '1' ? '' : '1';
      favs(); goal('vitrina_fav');
    } else if (e.target.closest('.btn-gold')) goal('vitrina_request');
  });

  audio.addEventListener('play', setPlayingUI);
  audio.addEventListener('pause', setPlayingUI);
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
  if (bar) {
    $('#barPlay').onclick = () => cur && (audio.paused ? audio.play() : audio.pause());
    $('#barPrev').onclick = () => step(-1);
    $('#barNext').onclick = () => step(1);
    $('#barSeek').oninput = e => audio.duration && (audio.currentTime = audio.duration * e.target.value / 1000);
  }

  /* подборка */
  const sel = $('#sel');
  function favs() {
    const f = cards.filter(c => c.dataset.fav === '1');
    $$('.vt-card').forEach(c => {
      const b = $('.vt-fav', c), on = f.some(x => x.dataset.id === c.dataset.id);
      if (b) { b.classList.toggle('on', on); b.innerHTML = on ? '&#9829;' : '&#9825;'; }
    });
    try { sessionStorage.setItem('vt-fav', JSON.stringify(f.map(c => c.dataset.id))); } catch (e) {}
    if (!sel) return;
    sel.hidden = !f.length;
    $('#selN').textContent = f.length;
    const names = f.map(c => '«' + c.querySelector('h3').textContent + '»').join(', ');
    $('#selSend').href = TG + '?text=' + encodeURIComponent('Здравствуйте! Хочу запросить лицензию на песни: ' + names + '.');
  }
  try { (JSON.parse(sessionStorage.getItem('vt-fav') || '[]')).forEach(id => { const c = cards.find(x => x.dataset.id === id); if (c) c.dataset.fav = '1'; }); } catch (e) {}
  favs();

  /* фильтры и поиск */
  const grid = $('#grid');
  if (grid) {
    const st = { kind: '', mood: '', vocal: '', q: '' };
    const run = () => {
      let n = 0;
      cards.forEach(c => {
        const ok = (!st.kind || c.dataset.kind === st.kind) && (!st.mood || c.dataset.mood === st.mood) &&
          (!st.vocal || c.dataset.vocal === st.vocal) && (!st.q || c.dataset.title.includes(st.q));
        c.hidden = !ok; if (ok) n++;
      });
      $('#cnt').textContent = 'Найдено: ' + n + ' из ' + cards.length;
      $('#empty').hidden = n > 0;
    };
    $$('.vt-chips').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', g).forEach(x => x.classList.toggle('on', x === b));
      st[g.dataset.f] = b.dataset.v; run();
    }));
    $('#q').addEventListener('input', e => { st.q = e.target.value.trim().toLowerCase(); run(); });
    $('#clear').onclick = () => {
      st.kind = st.mood = st.vocal = st.q = ''; $('#q').value = '';
      $$('.vt-chips').forEach(g => $$('button', g).forEach((x, i) => x.classList.toggle('on', i === 0)));
      run();
    };
    run();
  }
})();
