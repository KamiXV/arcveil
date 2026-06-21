/* ═══════════════════════════════════════════════
   ARCVEIL — arcveil.js
   Modules: Nav · Curtain · Words · Measure ·
            Counters · Scroll Reveal · Form
═══════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ── 1. NAV SCROLL ── */
  const nav = $('#nav');
  window.addEventListener('scroll', () => {
    nav && nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ── 2. HERO WORD REVEAL on load ── */
  window.addEventListener('load', () => {
    $$('.reveal-word').forEach((w, i) => {
      setTimeout(() => w.classList.add('animate'), 300 + i * 100);
    });
    $$('.reveal-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 900 + i * 150);
    });
  });

  /* ── 3. CURTAIN REVEAL (IntersectionObserver) ── */
  const curtainObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Delay slightly for elegance
        setTimeout(() => entry.target.classList.add('revealed'), 120);
        curtainObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  $$('.curtain').forEach(c => curtainObs.observe(c));

  /* ── 4. MEASURE TOOLTIP (m² live readout) ── */
  const tip = $('#measureTip');
  const tipNum = $('#measureNum');
  let tipVisible = false;
  let currentBase = 0;
  let displayVal = 0;
  let targetVal = 0;
  let rafId = null;

  function animateTip() {
    displayVal = lerp(displayVal, targetVal, 0.08);
    tipNum.textContent = Math.round(displayVal).toLocaleString();
    if (Math.abs(displayVal - targetVal) > 0.5) {
      rafId = requestAnimationFrame(animateTip);
    } else {
      tipNum.textContent = Math.round(targetVal).toLocaleString();
    }
  }

  function attachMeasure(zone) {
    const base = parseFloat(zone.dataset.base) || 300;

    zone.addEventListener('mouseenter', () => {
      currentBase = base;
      displayVal = base * 0.5;
      tip.classList.add('visible');
      tipVisible = true;
    });

    zone.addEventListener('mouseleave', () => {
      tip.classList.remove('visible');
      tipVisible = false;
      cancelAnimationFrame(rafId);
    });

    zone.addEventListener('mousemove', (e) => {
      const rect = zone.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top)  / rect.height;
      // Map mouse position to a m² value range ±40% around base
      const factor = 0.6 + (px * 0.5) + (py * 0.3);
      targetVal = Math.round(currentBase * clamp(factor, 0.5, 1.5));
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animateTip);

      // Position tooltip near cursor
      tip.style.left = e.clientX + 'px';
      tip.style.top  = e.clientY + 'px';
    });
  }

  // Hero measure zone
  const heroMeasure = $('#heroMeasure');
  if (heroMeasure) {
    heroMeasure.dataset.base = heroMeasure.dataset.base || '420';
    attachMeasure(heroMeasure);
  }

  // Project measure zones
  $$('.measure-zone').forEach(zone => attachMeasure(zone));

  /* ── 5. STAT COUNTERS ── */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function runCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();
    (function tick(now) {
      const p = clamp((now - start) / duration, 0, 1);
      el.textContent = Math.round(easeOut(p) * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    })(performance.now());
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  $$('.stat-num[data-target]').forEach(el => counterObs.observe(el));

  /* ── 6. GENERAL SCROLL REVEAL ── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const siblings = [...entry.target.parentElement.children];
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = (idx * 0.07) + 's';
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  const revealTargets = [
    '.project-item', '.award-item', '.phil-val',
    '.contact-detail', '.section-title'
  ];
  revealTargets.forEach(sel => {
    $$(sel).forEach(el => {
      el.classList.add('reveal-up');
      revealObs.observe(el);
    });
  });

  /* ── 7. PARALLAX on hero image ── */
  const heroImg = $('.hero-image');
  window.addEventListener('scroll', () => {
    if (!heroImg) return;
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroImg.style.transform = `translateY(${scrollY * 0.18}px)`;
    }
  }, { passive: true });

  /* ── 8. FORM SUBMIT ── */
  const formBtn = $('#formSubmit');
  if (formBtn) {
    formBtn.addEventListener('click', () => {
      const form = formBtn.closest('.contact-form');
      const inputs = form ? [...$$('input, select, textarea', form)] : [];
      const allFilled = inputs.some(i => i.value.trim());
      if (allFilled) {
        formBtn.classList.add('sent');
        formBtn.querySelector('span').textContent = 'Enquiry Sent ✓';
        inputs.forEach(i => { i.disabled = true; });
      } else {
        inputs[0] && inputs[0].focus();
      }
    });
  }

  /* ── 9. SMOOTH SCROLL ── */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const t = $(link.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  console.log('%cARCVEIL — Architecture Studio', 'color:#C9A84C;font-family:serif;font-size:13px;');

})();
