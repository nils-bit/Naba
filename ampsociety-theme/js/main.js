/* ==========================================================================
   AmpSociety Theme — Global Scripts
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Scroll Reveal (IntersectionObserver) ---------- */
  function initScrollReveal() {
    var els = document.querySelectorAll('.amp-reveal');
    if (!els.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- Smooth Scroll for Anchor Links ---------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    initScrollReveal();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
