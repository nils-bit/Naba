/* USP Slider Module JS */
(function () {
  'use strict';

  var slider = document.querySelector('[data-usp-slider]');
  if (!slider) return;

  var slides = slider.querySelectorAll('.amp-usp__slide');
  var dots = slider.querySelectorAll('.amp-usp__dot');
  var prevBtn = slider.querySelector('.amp-usp__arrow--prev');
  var nextBtn = slider.querySelector('.amp-usp__arrow--next');
  var current = 0;
  var total = slides.length;

  function goTo(index) {
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;

    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');

    current = index;

    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
  }

  /* Dot navigation */
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var target = parseInt(this.getAttribute('data-slide-target'), 10);
      goTo(target);
    });
  });

  /* Arrow navigation */
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      goTo(current - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      goTo(current + 1);
    });
  }

  /* Keyboard navigation */
  slider.setAttribute('tabindex', '0');
  slider.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  /* Touch swipe */
  var touchStartX = 0;

  slider.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  slider.addEventListener('touchend', function (e) {
    var diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? current + 1 : current - 1);
    }
  }, { passive: true });
})();
