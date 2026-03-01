/* Header Module JS */
(function () {
  'use strict';

  var header = document.querySelector('.amp-header');
  if (!header) return;

  /* ---------- Scroll: sticky background ---------- */
  var scrollThreshold = 50;

  function onScroll() {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Desktop dropdowns ---------- */
  var navItems = header.querySelectorAll('.amp-header__nav-item.has-dropdown');

  navItems.forEach(function (item) {
    var toggle = item.querySelector('.amp-header__nav-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = item.classList.contains('is-open');

      // Close all dropdowns first
      navItems.forEach(function (ni) {
        ni.classList.remove('is-open');
        var t = ni.querySelector('.amp-header__nav-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', function () {
    navItems.forEach(function (ni) {
      ni.classList.remove('is-open');
      var t = ni.querySelector('.amp-header__nav-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Mobile hamburger ---------- */
  var hamburger = header.querySelector('.amp-header__hamburger');
  var overlay = header.querySelector('.amp-header__mobile-overlay');

  if (hamburger && overlay) {
    hamburger.addEventListener('click', function () {
      var isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!isExpanded));
      overlay.classList.toggle('is-open');
      overlay.setAttribute('aria-hidden', String(isExpanded));
      document.body.style.overflow = isExpanded ? '' : 'hidden';
    });
  }

  /* ---------- Mobile dropdown toggles ---------- */
  var mobileToggles = header.querySelectorAll('.amp-header__mobile-toggle');

  mobileToggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var parentItem = btn.closest('.amp-header__mobile-item');
      var isOpen = parentItem.classList.contains('is-open');
      parentItem.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();
