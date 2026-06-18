(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var navPanel = document.querySelector('[data-nav-panel]');

  if (menuButton && navPanel) {
    menuButton.addEventListener('click', function () {
      navPanel.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }

      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    restart();
  }

  var searchInput = document.querySelector('[data-search-input]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.searchable-card'));
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-button]'));
  var noResults = document.querySelector('[data-no-results]');
  var activeFilter = {
    type: 'all',
    value: 'all'
  };

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function cardText(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-type'),
      card.getAttribute('data-year'),
      card.getAttribute('data-genre'),
      card.textContent
    ].join(' '));
  }

  function matchesFilter(card) {
    if (activeFilter.type === 'all') {
      return true;
    }

    var value = normalize(card.getAttribute('data-' + activeFilter.type));
    return value.indexOf(normalize(activeFilter.value)) !== -1;
  }

  function runFilter() {
    if (!cards.length) {
      return;
    }

    var query = searchInput ? normalize(searchInput.value) : '';
    var visibleCount = 0;

    cards.forEach(function (card) {
      var visible = matchesFilter(card) && cardText(card).indexOf(query) !== -1;
      card.classList.toggle('is-hidden-by-filter', !visible);

      if (visible) {
        visibleCount += 1;
      }
    });

    if (noResults) {
      noResults.classList.toggle('show', visibleCount === 0);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', runFilter);
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      filterButtons.forEach(function (item) {
        item.classList.remove('active');
      });

      button.classList.add('active');
      activeFilter.type = button.getAttribute('data-filter-type') || 'all';
      activeFilter.value = button.getAttribute('data-filter-value') || 'all';
      runFilter();
    });
  });
})();

function initMoviePlayer(videoId, overlayId, buttonId, source) {
  var video = document.getElementById(videoId);
  var overlay = document.getElementById(overlayId);
  var button = document.getElementById(buttonId);
  var ready = false;
  var hlsInstance = null;

  if (!video || !source) {
    return;
  }

  function prepare() {
    return new Promise(function (resolve) {
      if (ready) {
        resolve();
        return;
      }

      ready = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        resolve();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          resolve();
        });
        hlsInstance.on(window.Hls.Events.ERROR, function () {
          resolve();
        });
        return;
      }

      video.src = source;
      resolve();
    });
  }

  function start() {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }

    video.controls = true;

    prepare().then(function () {
      window.setTimeout(function () {
        video.play().catch(function () {});
      }, 80);
    });
  }

  if (overlay) {
    overlay.addEventListener('click', start);
  }

  if (button) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      start();
    });
  }

  video.addEventListener('click', function () {
    if (!ready) {
      start();
    }
  });

  video.addEventListener('ended', function () {
    if (hlsInstance && typeof hlsInstance.stopLoad === 'function') {
      hlsInstance.stopLoad();
    }
  });
}
