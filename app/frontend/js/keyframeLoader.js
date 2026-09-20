/* Load the current viewport first, with a bounded queue for nearby frames. */
function observeKeyframeImages(root) {
  var images = Array.from(root.querySelectorAll('img[data-src]'));
  var pending = new Set();
  var active = 0;
  var scheduled = false;
  var idleScheduled = false;
  var observer;

  function start(img, priority) {
    if (!img || !img.dataset.src) return;
    pending.delete(img);
    if (observer) observer.unobserve(img);
    active++;
    img.fetchPriority = priority;
    function complete() {
      img.removeEventListener('load', complete);
      img.removeEventListener('error', complete);
      active--;
      schedule();
    }
    img.addEventListener('load', complete);
    img.addEventListener('error', complete);
    img.src = img.dataset.src;
    delete img.dataset.src;
  }

  function scheduleIdle() {
    if (idleScheduled) return;
    idleScheduled = true;
    var idle = window.requestIdleCallback || function (callback) {
      return window.setTimeout(callback, 150);
    };
    idle.call(window, function () {
      idleScheduled = false;
      pump(true);
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      pump(false);
    });
  }

  function pump(allowPreload) {
    var height = window.innerHeight;
    var candidates = Array.from(pending).map(function (img) {
      var rect = img.getBoundingClientRect();
      var visible = rect.bottom > 0 && rect.top < height;
      return { img: img, visible: visible,
        centerDistance: Math.abs((rect.top + rect.bottom) / 2 - height / 2),
        distance: Math.max(0, -rect.bottom, rect.top - height) };
    }).sort(function (a, b) {
      return Number(b.visible) - Number(a.visible) || a.distance - b.distance ||
        a.centerDistance - b.centerDistance;
    });

    candidates.forEach(function (candidate) {
      // Reserve capacity for visible frames instead of filling it with preloads.
      if (active >= (candidate.visible ? 6 : 2)) return;
      if (candidate.distance > height) return;
      if (!candidate.visible && !allowPreload) {
        scheduleIdle();
        return;
      }
      start(candidate.img, candidate.visible ? 'high' : 'low');
    });
  }

  // Do not wait for observer delivery to request the selected frame and its neighbors.
  var selectedIndex = images.findIndex(function (img) {
    return img.classList.contains('videoSummarySelected');
  });
  if (selectedIndex < 0) selectedIndex = 0;
  start(images[selectedIndex], 'high');
  start(images[selectedIndex - 1], 'high');
  start(images[selectedIndex + 1], 'high');

  if (!('IntersectionObserver' in window)) {
    images.forEach(function (img) {
      if (!img.dataset.src) return;
      img.loading = 'lazy';
      img.src = img.dataset.src;
      delete img.dataset.src;
    });
    return;
  }

  observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.target.dataset.src) pending.add(entry.target);
      else pending.delete(entry.target);
    });
    schedule();
  }, { rootMargin: '100% 0px' });
  images.forEach(function (img) {
    if (img.dataset.src) observer.observe(img);
  });
  // Reprioritize the small nearby set once per animation frame, never the full list.
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
}
