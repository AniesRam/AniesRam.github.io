(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => mqReduce.matches || root.dataset.motion === 'reduce';

  const prefs = (() => { try { return JSON.parse(localStorage.getItem('na-prefs') || '{}'); } catch { return {}; } })();
  const save = () => { try { localStorage.setItem('na-prefs', JSON.stringify(prefs)); } catch {} };

  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  };

  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  function setTheme(mode) {
    if (mode === 'auto') { delete root.dataset.theme; delete prefs.theme; }
    else { root.dataset.theme = mode; prefs.theme = mode; }
    save();
    $$('[data-theme-set]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.themeSet === mode)));
    $('#themeBtn').setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
  }
  setTheme(prefs.theme || 'auto');
  $('#themeBtn').addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark'));
  $$('[data-theme-set]').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.themeSet)));

  const a11yBtn = $('#a11yBtn'), panel = $('#a11yPanel');
  const showPanel = (open) => { panel.hidden = !open; a11yBtn.setAttribute('aria-expanded', String(open)); };
  a11yBtn.addEventListener('click', (e) => { e.stopPropagation(); showPanel(panel.hidden); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target)) showPanel(false); });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { showPanel(false); a11yBtn.focus(); } });

  let scale = parseFloat(prefs.scale) || 1;
  const applyScale = () => {
    root.style.setProperty('--text-scale', scale);
    $('#textVal').textContent = Math.round(scale * 100) + '%';
    $('#textDown').disabled = scale <= 0.9;
    $('#textUp').disabled = scale >= 1.3;
    prefs.scale = scale; save();
  };
  applyScale();
  $('#textUp').addEventListener('click', () => { scale = Math.min(1.3, +(scale + 0.1).toFixed(1)); applyScale(); });
  $('#textDown').addEventListener('click', () => { scale = Math.max(0.9, +(scale - 0.1).toFixed(1)); applyScale(); });

  const motion = $('#motionToggle');
  motion.checked = reduced();
  motion.addEventListener('change', () => {
    if (motion.checked) { root.dataset.motion = 'reduce'; prefs.motion = 'reduce'; }
    else { delete root.dataset.motion; delete prefs.motion; }
    save();
  });

  const menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  const bar = $('#progressBar'), header = $('.site-header'), toTop = $('#toTop');
  const onScroll = () => {
    const h = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    header.classList.toggle('scrolled', scrollY > 8);
    toTop.hidden = scrollY < innerHeight;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    $('.name').focus({ preventScroll: true });
  });

  const navAs = $$('.nav-links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navAs.forEach(a => {
        if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  const fadeEls = $$('.section .split, .job, .fyp, .proj, .prog, .contact-body');
  const fader = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); fader.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -60px 0px' });
  fadeEls.forEach(el => { el.classList.add('fade'); fader.observe(el); });

  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
  const ALBUMS = {
    kesuwa: { name: 'KESUWA', cap: 'KESUWA, UMS student volunteer club', photos: range(13, i => `assets/kesuwa/kesuwa-${i}.jpg`) },
    jiwa: { name: 'JIWA 3.0', cap: 'JIWA 3.0, UPSI × UNIMAS × UMS in Sarawak', photos: range(8, i => `assets/jiwa/jiwa-${i}.jpg`) },
    kesass: { name: 'KESASS', cap: 'KESASS, Kesatuan Anak Selangor Sabah', photos: [1, 2, 4, 5].map(i => `assets/kesass/kesass-${i}.jpg`) },
    jelajah: { name: 'Jelajah IT', cap: 'Jelajah IT school visit', photos: ['assets/jelajah/jelajah-1.jpg'] },
    intern: { name: 'Allianz internship', cap: 'Internship at Allianz Malaysia', photos: range(4, i => `assets/intern/intern-${i}.jpg`) },
  };
  const album = (key) => ALBUMS[key].photos.map((src, i, a) => ({
    src, cap: ALBUMS[key].cap, alt: `${ALBUMS[key].name}, photo ${i + 1} of ${a.length}`,
  }));

  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
  let lbList = [], lbIdx = 0, lbBack = null;
  function lbShow(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    const it = lbList[lbIdx];
    lbImg.src = it.src; lbImg.alt = it.alt;
    lbCap.textContent = it.cap || '';
    lbCount.textContent = `${lbIdx + 1} of ${lbList.length}`;
    const single = lbList.length < 2;
    $('#lbPrev').hidden = single; $('#lbNext').hidden = single;
    [1, -1].forEach(d => { const n = lbList[(lbIdx + d + lbList.length) % lbList.length]; if (n) new Image().src = n.src; });
  }
  function lbOpen(list, i, from) {
    lbList = list; lbBack = from || document.activeElement;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    lbShow(i);
    $('#lbClose').focus();
  }
  function lbClose() {
    lb.hidden = true; document.body.style.overflow = '';
    if (lbBack && lbBack.focus) lbBack.focus();
  }
  $('#lbClose').addEventListener('click', lbClose);
  $('#lbPrev').addEventListener('click', () => lbShow(lbIdx - 1));
  $('#lbNext').addEventListener('click', () => lbShow(lbIdx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-stage')) lbClose(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
    else if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
    else if (e.key === 'Tab') {
      const f = $$('button', lb).filter(b => !b.hidden);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) lbShow(lbIdx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  const row = $('[data-gallery="intern"]');
  const internPhotos = album('intern');
  internPhotos.forEach((p, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `View ${p.alt}`);
    b.innerHTML = `<img src="${p.src}" alt="" loading="lazy" />`;
    b.addEventListener('click', () => lbOpen(internPhotos, i, b));
    row.appendChild(b);
  });

  $$('.prog-photo').forEach(b => b.addEventListener('click', () => lbOpen(album(b.dataset.open), 0, b)));

  const filters = $$('.others .filter'), projs = $$('.proj'), status = $('#filterStatus'), empty = $('#emptyState');
  function filterProjects(cat) {
    let n = 0;
    filters.forEach(b => { const on = b.dataset.filter === cat; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    projs.forEach(p => {
      const show = cat === 'all' || p.dataset.cats.split(' ').includes(cat);
      p.hidden = !show;
      if (show) { n++; p.classList.add('in'); }
    });
    empty.hidden = n > 0;
    status.textContent = `Showing ${n} project${n === 1 ? '' : 's'}.`;
  }
  filters.forEach(b => b.addEventListener('click', () => filterProjects(b.dataset.filter)));
  $('[data-reset]').addEventListener('click', () => filterProjects('all'));

  const S = (n, t, d) => ({ src: `assets/fyp/fyp-${n}.jpg`, t, d });
  const SCREENS = {
    patient: [
      S(1, 'Landing page', 'Patients, staff and admins each sign up through their own path.'),
      S(2, 'Patient dashboard', 'Upcoming appointments, health status and notifications.'),
      S(3, 'Symptom checker', 'Tick symptoms or describe them. There is a disclaimer that it doesn\'t replace a doctor.'),
      S(27, 'Picking symptoms', 'Checkboxes keep typing to a minimum.'),
      S(28, 'Model results', 'Likely conditions with confidence scores and a button to book a doctor.'),
      S(4, 'Medical records', 'Diagnoses, prescriptions, labs and treatment plans, split into tabs.'),
      S(5, 'Feedback form', 'Category, rating and comments.'),
      S(6, 'Hospital analytics', 'Common symptoms and patient volume trends.'),
      S(7, 'Booking an appointment', 'Pick the type, date, time, department and doctor.'),
      S(8, 'Appointment history', 'Every booking with its status.'),
      S(9, 'Hospital map', 'Floor map with searchable places like the pharmacy and ER.'),
      S(10, 'Emergency button', 'One big button that alerts staff.'),
      S(11, 'Knowledge base', 'Health articles, tips and quizzes.'),
    ],
    doctor: [
      S(12, 'Doctor dashboard', 'Today\'s patients, the queue and the model\'s pre-diagnosis for the next patient.'),
      S(13, 'Queue', 'Approve or reject patients waiting in the queue.'),
      S(14, 'Schedule', 'Set which time slots are available.'),
      S(15, 'Patient records', 'Look up a patient\'s history before the consultation.'),
      S(16, 'Consultation', 'The model\'s suggestion is shown, but the doctor confirms or changes the diagnosis.'),
      S(17, 'Reviewing predictions', 'Doctors mark predictions right or wrong, and that is saved for retraining.'),
      S(18, 'Hospital map', 'Same floor map as patients see.'),
      S(19, 'Knowledge base', 'Articles for staff.'),
    ],
    admin: [
      S(20, 'Users & roles', 'Change roles or suspend accounts.'),
      S(21, 'All appointments', 'Reschedule or cancel anything.'),
      S(22, 'Data management', 'View, anonymise and export patient records.'),
      S(23, 'Analytics', 'Symptom trends and department workloads, with PDF export.'),
      S(29, 'Power BI report', 'Embedded report on conditions, departments and patient volume.'),
      S(24, 'Settings', 'Notifications, the model\'s alert threshold and backups.'),
      S(25, 'Emergency panel', 'Route, notify and log each emergency and its response time.'),
      S(26, 'Knowledge base editor', 'Write and publish articles.'),
    ],
  };
  const tabs = $$('.tabs [role="tab"]'), tabPanel = $('#panel-roles');
  const vImg = $('#viewerImg'), vTitle = $('#viewerTitle'), vDesc = $('#viewerDesc'),
        vIdx = $('#viewerIdx'), vTotal = $('#viewerTotal'), vThumbs = $('#viewerThumbs');
  let role = 'patient', vi = 0;
  function showScreen(i) {
    const list = SCREENS[role];
    vi = (i + list.length) % list.length;
    const s = list[vi];
    vImg.classList.add('swap');
    const pre = new Image();
    pre.onload = () => { vImg.src = s.src; vImg.alt = `${s.t} (${role} view)`; vImg.classList.remove('swap'); };
    pre.src = s.src;
    vTitle.textContent = s.t; vDesc.textContent = s.d;
    vIdx.textContent = vi + 1; vTotal.textContent = list.length;
    $$('button', vThumbs).forEach((b, j) => b.setAttribute('aria-current', String(j === vi)));
  }
  function setRole(r, focus) {
    role = r;
    tabs.forEach(t => {
      const on = t.dataset.role === r;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) { tabPanel.setAttribute('aria-labelledby', t.id); if (focus) t.focus(); }
    });
    vThumbs.innerHTML = '';
    SCREENS[r].forEach((s, j) => {
      const li = document.createElement('li');
      li.innerHTML = `<button aria-label="Screen ${j + 1}: ${s.t}"><img src="${s.src}" alt="" loading="lazy" /></button>`;
      li.firstChild.addEventListener('click', () => showScreen(j));
      vThumbs.appendChild(li);
    });
    showScreen(0);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setRole(t.dataset.role));
    t.addEventListener('keydown', (e) => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); setRole(tabs[j].dataset.role, true); }
    });
  });
  $('#viewerPrev').addEventListener('click', () => showScreen(vi - 1));
  $('#viewerNext').addEventListener('click', () => showScreen(vi + 1));
  $('#viewerShot').addEventListener('click', (e) => {
    lbOpen(SCREENS[role].map(s => ({ src: s.src, alt: s.t, cap: `${s.t}: ${s.d}` })), vi, e.currentTarget);
  });
  setRole('patient');

  $('#copyEmail').addEventListener('click', async (e) => {
    const email = e.currentTarget.dataset.email;
    try { await navigator.clipboard.writeText(email); toast('Copied'); e.currentTarget.textContent = 'Copied'; }
    catch { location.href = 'mailto:' + email; }
  });

  const fields = {
    name: { el: $('#fName'), err: $('#eName'), check: v => v.trim().length >= 2 ? '' : 'Please add your name.' },
    email: { el: $('#fEmail'), err: $('#eEmail'), check: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That email doesn\'t look right. Check for typos?' },
    message: { el: $('#fMsg'), err: $('#eMsg'), check: v => v.trim().length >= 10 ? '' : 'A little more detail, please (10+ characters).' },
  };
  const validate = (f) => {
    const msg = f.check(f.el.value);
    f.err.textContent = msg;
    f.el.setAttribute('aria-invalid', String(!!msg));
    return !msg;
  };
  Object.values(fields).forEach(f => {
    f.el.addEventListener('blur', () => { if (f.el.value) validate(f); });
    f.el.addEventListener('input', () => { if (f.el.getAttribute('aria-invalid') === 'true') validate(f); });
  });
  fields.message.el.addEventListener('input', () => { $('#msgCount').textContent = `${fields.message.el.value.length}/1000`; });
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = Object.values(fields).map(validate);
    if (ok.includes(false)) { Object.values(fields)[ok.indexOf(false)].el.focus(); return; }
    const name = fields.name.el.value.trim();
    const subject = encodeURIComponent(`Hello from ${name}`);
    const body = encodeURIComponent(`${fields.message.el.value.trim()}\n\n${name}\n${fields.email.el.value.trim()}`);
    location.href = `mailto:naniesahr@gmail.com?subject=${subject}&body=${body}`;
    toast('Opening your email app…');
  });

})();
