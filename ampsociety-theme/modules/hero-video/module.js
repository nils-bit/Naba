/* Hero Video Module JS */
(function () {
  'use strict';

  /* Ensure hero reveal elements animate in immediately (above the fold) */
  var heroReveals = document.querySelectorAll('.amp-hero .amp-reveal');
  setTimeout(function () {
    heroReveals.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }, 300);
})();
