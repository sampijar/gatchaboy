// Gacha Pesan — tanpa server: isi pesan disimpan di bagian # pada link.
(() => {
  const $ = (s) => document.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const COLORS = ['#f7b733', '#f0533f', '#3b7dd8', '#1f8a6b', '#e86aa6', '#8b5cf6', '#ff8a3d'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- encode / decode (UTF-8 aman, base64url) ----------
  const enc = (obj) => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const dec = (str) => {
    try {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) str += '=';
      const bytes = Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch { return null; }
  };
  const baseUrl = () => location.origin + location.pathname;

  // ---------- suara kecil (WebAudio) ----------
  let ac, soundOn = true;
  const beep = (freq = 600, dur = 0.06, type = 'square', vol = 0.04, delay = 0) => {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t); o.stop(t + dur);
    } catch {}
  };
  const crank = () => { for (let i = 0; i < 8; i++) beep(320 + (i % 2) * 80, 0.04, 'square', 0.03, i * 0.13); };
  const thud = () => beep(140, 0.18, 'sine', 0.12);
  const pop = () => { beep(700, 0.08, 'triangle', 0.08); beep(1050, 0.12, 'triangle', 0.06, 0.08); };

  // ---------- MODE PEMBUAT ----------
  function showMaker() {
    $('#player').hidden = true;
    $('#maker').hidden = false;
    document.title = 'Gacha Pesan — bikin punyamu';
  }

  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    const to = $('#to').value.trim();
    const from = $('#from').value.trim();
    const msgs = $('#msg').value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    const err = $('#err');
    if (!msgs.length) { err.textContent = 'Tulis minimal satu pesan dulu ya.'; err.hidden = false; return; }
    err.hidden = true;

    const url = baseUrl() + '#' + enc({ to, from, msgs });
    $('#link').value = url;
    $('#preview').href = url;
    const text = `${to ? to + ', ada' : 'Ada'} pesan rahasia buat kamu di dalam mesin gacha 🎰 Putar tuasnya ya: ${url}`;
    $('#wa').href = 'https://wa.me/?text=' + encodeURIComponent(text);
    if (navigator.share) {
      $('#share').hidden = false;
      $('#share').onclick = () => navigator.share({ title: 'Gacha Pesan', text, url }).catch(() => {});
    }
    $('#result').hidden = false;
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('#copy').addEventListener('click', async () => {
    const input = $('#link');
    try { await navigator.clipboard.writeText(input.value); }
    catch { input.select(); document.execCommand('copy'); }
    $('#copy').textContent = 'Tersalin ✓';
    setTimeout(() => ($('#copy').textContent = 'Salin'), 1600);
  });

  // ---------- MODE PENERIMA ----------
  let data, pool = [], busy = false, current = '';

  function fillCapsules() {
    const g = $('#caps');
    g.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const spots = [
      [80, 214], [122, 218], [164, 214], [206, 218], [232, 200],
      [70, 178], [108, 182], [148, 178], [190, 184], [228, 164],
      [92, 146], [134, 150], [176, 146], [214, 132], [72, 120], [118, 116], [160, 112]
    ];
    spots.forEach(([x, y]) => {
      const r = 18, c = pick(COLORS), rot = Math.floor(Math.random() * 360);
      const cap = document.createElementNS(ns, 'g');
      cap.setAttribute('transform', `rotate(${rot} ${x} ${y})`);
      cap.innerHTML =
        `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#1f2a30" stroke-width="2.5"/>` +
        `<path d="M${x - r} ${y} a${r} ${r} 0 0 1 ${2 * r} 0 z" fill="${c}" stroke="#1f2a30" stroke-width="2.5"/>`;
      g.appendChild(cap);
    });
  }

  function refill() {
    pool = data.msgs.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  function showPlayer(d) {
    data = d;
    $('#maker').hidden = true;
    $('#player').hidden = false;
    $('#title').textContent = d.to ? `Gacha buat ${d.to}` : 'Gacha buat kamu';
    document.title = d.to ? `Gacha buat ${d.to} 🎰` : 'Gacha Pesan 🎰';
    $('#makeOwn').href = baseUrl();
    refill();
    fillCapsules();
    resetPlayer();
  }

  function resetPlayer() {
    busy = false;
    const prize = $('#prize');
    prize.hidden = true;
    prize.className = 'capsule';
    $('#knob').classList.add('idle');
    const left = pool.length;
    $('#hint').textContent = data.msgs.length > 1 && left < data.msgs.length
      ? (left ? `Masih ada ${left} pesan lagi — putar tuasnya 👆` : 'Semua pesan sudah kebuka 💌 Putar lagi buat ulang')
      : 'Putar tuasnya 👆';
  }

  async function pull() {
    if (busy) return;
    busy = true;
    if (!pool.length) refill();
    current = pool.shift();

    const knob = $('#knob'), caps = $('#caps'), prize = $('#prize');
    knob.classList.remove('idle');
    void knob.getBBox();
    knob.classList.add('spin');
    caps.classList.add('shake');
    $('#hint').textContent = 'Krek… krek… krek…';
    crank();
    await wait(1100);
    knob.classList.remove('spin');
    caps.classList.remove('shake');

    prize.style.setProperty('--cap', pick(COLORS));
    prize.className = 'capsule';
    prize.hidden = false;
    void prize.offsetWidth;
    prize.classList.add('drop');
    await wait(450);
    thud();
    await wait(350);
    prize.classList.replace('drop', 'ready');
    $('#hint').textContent = 'Tap kapsulnya! ✨';
  }

  $('#knob').addEventListener('click', pull);
  $('#machine').addEventListener('click', (e) => { if (!e.target.closest('#knob')) pull(); });

  $('#prize').addEventListener('click', async () => {
    const prize = $('#prize');
    if (!prize.classList.contains('ready') || prize.classList.contains('open')) return;
    prize.classList.add('open');
    pop();
    hearts();
    await wait(450);
    openModal(current);
  });

  // ---------- popup + efek ketik ----------
  let typing;
  function openModal(text) {
    const box = $('#mtext');
    $('#mfrom').textContent = data.from ? `— ${data.from}` : '';
    $('#again').hidden = false;
    $('#modal').hidden = false;
    box.textContent = '';
    clearInterval(typing);
    const chars = Array.from(text);
    let i = 0;
    typing = setInterval(() => {
      box.textContent += chars[i++] || '';
      if (i >= chars.length) clearInterval(typing);
    }, 40);
    box.onclick = () => { clearInterval(typing); box.textContent = text; };
  }
  function closeModal() {
    clearInterval(typing);
    $('#modal').hidden = true;
    resetPlayer();
  }
  $('#close').addEventListener('click', closeModal);
  $('#again').addEventListener('click', () => { closeModal(); pull(); });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

  function hearts() {
    const set = ['💖', '💌', '✨', '💕', '🌸'];
    for (let i = 0; i < 14; i++) {
      const h = document.createElement('span');
      h.className = 'heart';
      h.textContent = pick(set);
      h.style.left = Math.random() * 100 + 'vw';
      h.style.animationDelay = Math.random() * 0.6 + 's';
      h.style.fontSize = 18 + Math.random() * 18 + 'px';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 3500);
    }
  }

  $('#sound').addEventListener('click', () => {
    soundOn = !soundOn;
    $('#sound').textContent = soundOn ? '🔊 Suara' : '🔇 Senyap';
    $('#sound').setAttribute('aria-pressed', String(soundOn));
  });

  // ---------- router ----------
  function route() {
    const d = location.hash.length > 1 ? dec(location.hash.slice(1)) : null;
    if (d && Array.isArray(d.msgs) && d.msgs.length) showPlayer(d);
    else showMaker();
  }
  window.addEventListener('hashchange', route);
  route();
})();
