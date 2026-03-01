/* News Carousel — Drag-to-scroll on desktop */
(function () {
  'use strict';

  var track = document.querySelector('[data-news-carousel]');
  if (!track) return;

  var isDown = false;
  var startX;
  var scrollLeft;

  track.addEventListener('mousedown', function (e) {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', function () {
    isDown = false;
    track.style.cursor = 'grab';
  });

  track.addEventListener('mouseup', function () {
    isDown = false;
    track.style.cursor = 'grab';
  });

  track.addEventListener('mousemove', function (e) {
    if (!isDown) return;
    e.preventDefault();
    var x = e.pageX - track.offsetLeft;
    var walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });
})();
