(function () {
  var body = document.body;
  var menuToggle = document.querySelector('.menu-toggle');

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.main-nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      body.classList.remove('menu-open');
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('.hero-prev');
    var next = hero.querySelector('.hero-next');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
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
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-target')) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    restart();
  });

  document.querySelectorAll('[data-player]').forEach(function (player) {
    var video = player.querySelector('video');
    var overlay = player.querySelector('.play-overlay');
    var started = false;
    var hlsInstance = null;

    function startPlayer() {
      if (!video) {
        return;
      }
      var source = video.getAttribute('data-video');
      if (!source) {
        return;
      }
      if (!started) {
        started = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls();
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else {
          video.src = source;
        }
        video.controls = true;
        player.classList.add('is-playing');
      }
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener('click', startPlayer);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (!started) {
          startPlayer();
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });

  var searchInput = document.getElementById('site-search-input');
  var categoryFilter = document.getElementById('site-category-filter');
  var results = document.getElementById('search-results');
  var meta = document.getElementById('search-result-meta');

  if (searchInput && results && window.SEARCH_MOVIES) {
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    searchInput.value = initialQuery;

    function card(item) {
      var tags = (item.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return [
        '<a class="movie-card" href="./' + escapeAttr(item.url) + '">',
        '  <div class="card-cover">',
        '    <img src="./' + escapeAttr(item.image) + '" alt="' + escapeAttr(item.title) + '" loading="lazy">',
        '    <span class="year-badge">' + escapeHtml(item.year) + '</span>',
        '  </div>',
        '  <div class="card-body">',
        '    <h3>' + escapeHtml(item.title) + '</h3>',
        '    <p>' + escapeHtml(item.oneLine) + '</p>',
        '    <div class="tag-row">' + tags + '</div>',
        '    <div class="card-meta"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.category) + '</span></div>',
        '  </div>',
        '</a>'
      ].join('');
    }

    function match(item, query, category) {
      var text = [
        item.title,
        item.year,
        item.region,
        item.type,
        item.genre,
        item.category,
        item.oneLine,
        (item.tags || []).join(' ')
      ].join(' ').toLowerCase();
      var queryOk = !query || text.indexOf(query.toLowerCase()) !== -1;
      var categoryOk = !category || item.category === category;
      return queryOk && categoryOk;
    }

    function render() {
      var query = searchInput.value.trim();
      var category = categoryFilter ? categoryFilter.value : '';
      var list = window.SEARCH_MOVIES.filter(function (item) {
        return match(item, query, category);
      }).slice(0, 120);
      results.innerHTML = list.map(card).join('');
      if (meta) {
        meta.textContent = list.length ? '匹配结果' : '暂无匹配内容';
      }
    }

    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeAttr(value) {
      return escapeHtml(value).replace(/`/g, '&#96;');
    }

    searchInput.addEventListener('input', render);
    if (categoryFilter) {
      categoryFilter.addEventListener('change', render);
    }
    render();
  }
})();
