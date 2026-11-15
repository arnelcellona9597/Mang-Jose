/* Mang Jose Fried Chicken Corner — interactions */
(() => {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Preloader ---------- */
  document.body.classList.add('is-loading');
  const hidePreloader = () => {
    $('.preloader')?.classList.add('is-done');
    document.body.classList.remove('is-loading');
    $('.dock')?.classList.add('is-ready');
  };
  window.addEventListener('load', () => setTimeout(hidePreloader, reduced ? 0 : 500));
  setTimeout(hidePreloader, 3500); // safety net

  /* ---------- Year ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Header: scrolled / hide on scroll down ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const sy = window.scrollY;
    header.classList.toggle('is-scrolled', sy > 40);
    const menuOpen = document.body.classList.contains('is-menu-open');
    header.classList.toggle('is-hidden', !menuOpen && sy > 600 && sy > lastY + 4);
    if (sy < lastY - 4) header.classList.remove('is-hidden');
    lastY = sy;
    const max = doc.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? sy / max : 0})`;
    parallax();
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  /* ---------- Mobile full-screen menu ---------- */
  const menuBtn = $('.menu-btn'), overlay = $('#menu-overlay'), brand = $('.brand');
  const behind = [$('main'), $('.foot'), $('.dock')].filter(Boolean);
  const setMenu = (open) => {
    overlay.classList.toggle('is-open', open);
    overlay.inert = !open;
    behind.forEach(el => { el.inert = open; });
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { header.classList.remove('is-hidden'); $('a', overlay).focus({ preventScroll: true }); }
  };
  menuBtn.addEventListener('click', () => setMenu(!overlay.classList.contains('is-open')));
  $$('a', overlay).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false); menuBtn.focus(); return; }
    if (e.key === 'Tab') { // focus trap: brand → menu button → overlay links
      const f = [brand, menuBtn, ...$$('a', overlay)];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.addEventListener('resize', () => { if (innerWidth > 860 && overlay.classList.contains('is-open')) setMenu(false); });

  /* hide dock while the on-screen keyboard is likely open */
  document.addEventListener('focusin', e => { if (e.target.matches('input, textarea, select')) document.body.classList.add('is-typing'); });
  document.addEventListener('focusout', () => document.body.classList.remove('is-typing'));

  /* ---------- Active section (nav, overlay, dock) ---------- */
  const spyLinks = $$('a[data-spy]');
  const spyTargets = [...new Set(spyLinks.map(l => l.getAttribute('href')))].map(h => $(h)).filter(Boolean);
  const spyIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      spyLinks.forEach(l => {
        const on = l.getAttribute('href') === '#' + en.target.id;
        l.classList.toggle('is-active', on);
        on ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  spyTargets.forEach(s => spyIO.observe(s));

  /* ---------- Hero slider ---------- */
  const hero = $('.hero');
  const slides = $$('.hero__slide', hero);
  const dots = $$('.hero__dots button', hero);
  const DURATION = 6500;
  let idx = 0, timer = null, paused = reduced;
  hero.style.setProperty('--dur', DURATION + 'ms');
  const go = (n) => {
    slides[idx].classList.remove('is-active');
    slides[idx].setAttribute('aria-hidden', 'true');
    slides[idx].inert = true;
    dots[idx].setAttribute('aria-selected', 'false');
    idx = (n + slides.length) % slides.length;
    slides[idx].classList.add('is-active');
    slides[idx].removeAttribute('aria-hidden');
    slides[idx].inert = false;
    const d = dots[idx];
    d.setAttribute('aria-selected', 'true');
    const bar = d.querySelector('span'); bar.style.display = 'none'; void bar.offsetWidth; bar.style.display = '';
    schedule();
  };
  const schedule = () => { clearTimeout(timer); if (!paused) timer = setTimeout(() => go(idx + 1), DURATION); };
  slides.forEach((s, i) => { if (i) { s.setAttribute('aria-hidden', 'true'); s.inert = true; } });
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  $$('.hero__arrow', hero).forEach(b => b.addEventListener('click', () => go(idx + Number(b.dataset.dir))));
  const pauseBtn = $('.hero__pause', hero);
  const setPaused = (p) => {
    paused = p; hero.classList.toggle('is-paused', p);
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
    schedule();
  };
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  hero.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go(idx + 1);
    if (e.key === 'ArrowLeft') go(idx - 1);
  });
  let sx = null;
  hero.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });
  hero.addEventListener('focusin', () => { clearTimeout(timer); });
  hero.addEventListener('focusout', () => schedule());
  setPaused(paused);

  if (finePointer && !reduced) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, yv = (e.clientY - r.top) / r.height - .5;
      const s = slides[idx];
      s.querySelector('.hero__content').style.transform = `rotateY(${x * 6}deg) rotateX(${-yv * 6}deg) translateZ(20px)`;
      s.querySelector('.hero__bg').style.translate = `${-x * 24}px ${-yv * 18}px`;
    });
  }

  /* ---------- Reveal on scroll ---------- */
  $$('.reveal-stagger').forEach(g => [...g.children].forEach((c, i) => { c.style.transitionDelay = `${i * 0.09}s`; }));
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        if (en.target.classList.contains('reveal-stagger')) {
          setTimeout(() => [...en.target.children].forEach(c => { c.style.transitionDelay = ''; }), 1600);
        }
        revealIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .reveal-stagger').forEach(el => revealIO.observe(el));

  /* ---------- Counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
      const t0 = performance.now(), dur = reduced ? 1 : 1600;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(end * e) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Parallax + footer lift ---------- */
  const parEls = $$('[data-parallax]');
  const parX = $$('[data-parallax-x]');
  const foot = $('.foot');
  function parallax() {
    if (reduced) return;
    const vh = innerHeight;
    parEls.forEach(el => {
      const r = el.getBoundingClientRect();
      const c = r.top + r.height / 2 - vh / 2;
      el.style.translate = `0 ${c * +el.dataset.parallax}px`;
    });
    parX.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      el.style.setProperty('--px', `${(r.top - vh / 2) * +el.dataset.parallaxX}px`);
    });
    if (foot) {
      const r = foot.getBoundingClientRect();
      const p = clamp((vh - r.top) / r.height, 0, 1);
      foot.style.setProperty('--fp', p.toFixed(3));
      foot.style.setProperty('--cut', `${((1 - clamp((p - .3) / .55, 0, 1)) * 100).toFixed(1)}%`);
    }
  }
  onScroll();

  /* ---------- Ticker: scroll-reactive ---------- */
  const tracks = $$('.ticker__track');
  if (tracks.length && !reduced) {
    const T = tracks.map((el, i) => ({ el, dir: i % 2 ? 1 : -1, base: i % 2 ? 36 : 54, x: null, w: 0 }));
    const measure = () => T.forEach(t => {
      const w = t.el.scrollWidth / 2;
      if (!w) return;
      t.x = t.x === null ? (t.dir > 0 ? -w : 0) : ((t.x % w) - (t.dir > 0 ? w : 0));
      t.w = w;
    });
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    document.fonts?.ready.then(measure);
    let last = 0, prevY = scrollY, sv = 0, skew = 0, running = false;
    const tick = (now) => {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const dy = scrollY - prevY; prevY = scrollY;
      sv += (dy - sv) * .12;
      const boost = Math.min(Math.abs(sv) * 22, 520);
      skew += (clamp(-sv * .3, -9, 9) - skew) * .1;
      T.forEach(t => {
        if (!t.w) return;
        t.x += t.dir * (t.base + boost) * dt;
        if (t.dir < 0 && t.x <= -t.w) t.x += t.w;
        if (t.dir > 0 && t.x >= 0) t.x -= t.w;
        t.el.style.transform = `translate3d(${t.x.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      });
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(([en]) => {
      running = en.isIntersecting;
      if (running) { last = performance.now(); prevY = scrollY; requestAnimationFrame(tick); }
    }, { rootMargin: '100px 0px' }).observe($('.ticker'));
  }

  /* ---------- 3D tilt + magnetic + cursor glow ---------- */
  if (finePointer && !reduced) {
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, yv = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', `${(x - .5) * 12}deg`);
        el.style.setProperty('--rx', `${(.5 - yv) * 10}deg`);
        el.style.setProperty('--mx', `${x * 100}%`);
        el.style.setProperty('--my', `${yv * 100}%`);
      });
      el.addEventListener('mouseleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });

    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * .25}px`);
        el.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * .35}px`);
      });
      el.addEventListener('mouseleave', () => { el.style.setProperty('--bx', '0px'); el.style.setProperty('--by', '0px'); });
    });

    const glow = $('.cursor-glow');
    let gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { gx = e.clientX; gy = e.clientY; }, { passive: true });
    (function loop() { cx += (gx - cx) * .12; cy += (gy - cy) * .12; glow.style.translate = `${cx}px ${cy}px`; requestAnimationFrame(loop); })();
  }

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox'), lbImg = $('img', lb), items = $$('.g-item');
  let lbIdx = 0, lastFocus = null;
  const show = (i) => {
    lbIdx = (i + items.length) % items.length;
    const it = items[lbIdx], im = it.querySelector('img');
    lbImg.src = it.dataset.full; lbImg.alt = im.alt;
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
  };
  const openLb = (i) => { lastFocus = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; document.body.classList.add('is-lightbox'); $('.lightbox__close').focus(); };
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; document.body.classList.remove('is-lightbox'); lastFocus?.focus(); };
  items.forEach((it, i) => {
    it.setAttribute('aria-label', `View larger: ${it.querySelector('img').alt}`);
    it.addEventListener('click', () => openLb(i));
  });
  $('.lightbox__close').addEventListener('click', closeLb);
  $('.lightbox__prev').addEventListener('click', () => show(lbIdx - 1));
  $('.lightbox__next').addEventListener('click', () => show(lbIdx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(lbIdx + 1);
    if (e.key === 'ArrowLeft') show(lbIdx - 1);
    if (e.key === 'Tab') {
      const f = $$('button', lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Footer sparks (desktop only) ---------- */
  const cv = $('.sparks');
  if (cv && !reduced && finePointer) {
    const ctx = cv.getContext('2d');
    let w, h, parts = [], running = false;
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); w = cv.offsetWidth; h = cv.offsetHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const spawn = () => ({ x: Math.random() * w, y: h + 10, r: Math.random() * 2 + .5, vy: Math.random() * .7 + .3, vx: (Math.random() - .5) * .4, a: Math.random() * .6 + .3, hue: 30 + Math.random() * 20 });
    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      if (parts.length < 55) parts.push(spawn());
      parts.forEach(p => {
        p.y -= p.vy; p.x += p.vx + Math.sin(p.y / 40) * .2; p.a -= .0016;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},95%,60%,${Math.max(p.a, 0)})`;
        ctx.shadowBlur = 12; ctx.shadowColor = `hsla(${p.hue},100%,55%,.9)`; ctx.fill();
      });
      parts = parts.filter(p => p.a > 0 && p.y > -10);
      requestAnimationFrame(tick);
    };
    resize(); window.addEventListener('resize', resize);
    new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running) tick(); }).observe(cv);
  }

  /* ---------- Contact form ---------- */
  const form = $('#contact-form');
  if (form) {
    $('#f-ts').value = Date.now();
    const status = $('.form__status', form);
    const rules = {
      name: v => v.trim().length >= 2 || 'Please enter your name.',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      message: v => v.trim().length >= 10 || 'Please write at least 10 characters.'
    };
    const validate = (input) => {
      const rule = rules[input.name]; if (!rule) return true;
      const res = rule(input.value), field = input.closest('.field'), err = $('.field__error', field);
      const ok = res === true;
      field.classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (err) { err.textContent = ok ? '' : res; input.setAttribute('aria-describedby', err.id); }
      return ok;
    };
    Object.keys(rules).forEach(n => {
      const inp = form.elements[n];
      inp.addEventListener('blur', () => validate(inp));
      inp.addEventListener('input', () => { if (inp.closest('.field').classList.contains('has-error')) validate(inp); });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const invalid = Object.keys(rules).map(n => form.elements[n]).filter(i => !validate(i));
      if (invalid.length) { invalid[0].focus(); status.className = 'form__status is-err'; status.textContent = 'Please fix the highlighted fields.'; return; }
      form.classList.add('is-sending');
      status.className = 'form__status'; status.textContent = 'Sending…';
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          status.className = 'form__status is-ok';
          status.textContent = data.message || 'Thank you! We will get back to you soon.';
          form.reset(); $('#f-ts').value = Date.now();
        } else {
          throw new Error(data.message || 'Something went wrong.');
        }
      } catch (err) {
        status.className = 'form__status is-err';
        status.textContent = err.message || 'Could not send. Please try again or message us on Facebook.';
      } finally {
        form.classList.remove('is-sending');
      }
    });
  }
})();
