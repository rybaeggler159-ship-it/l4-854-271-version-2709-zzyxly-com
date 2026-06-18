(function () {
  var heroTimer = null;

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-nav-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function restart() {
      window.clearInterval(heroTimer);
      heroTimer = window.setInterval(function () {
        show(index + 1);
      }, 6500);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
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
  }

  function initRails() {
    document.querySelectorAll('.rail-wrap').forEach(function (wrap) {
      var rail = wrap.querySelector('[data-rail]');
      var left = wrap.querySelector('[data-rail-left]');
      var right = wrap.querySelector('[data-rail-right]');
      if (!rail) {
        return;
      }
      if (left) {
        left.addEventListener('click', function () {
          rail.scrollBy({ left: -520, behavior: 'smooth' });
        });
      }
      if (right) {
        right.addEventListener('click', function () {
          rail.scrollBy({ left: 520, behavior: 'smooth' });
        });
      }
    });
  }

  function createResult(item) {
    var link = document.createElement('a');
    link.href = './' + item.url;
    link.innerHTML = '<img src="' + item.cover + '" alt="">' +
      '<span><strong>' + escapeHtml(item.title) + '</strong>' +
      '<span>' + escapeHtml(item.year + ' · ' + item.region + ' · ' + item.type) + '</span></span>';
    return link;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function initGlobalSearch() {
    var index = window.MovieIndex || [];
    document.querySelectorAll('[data-global-search]').forEach(function (form) {
      var input = form.querySelector('[data-global-search-input]');
      var results = form.querySelector('[data-global-search-results]');
      var trigger = form.querySelector('[data-search-trigger]');
      if (!input || !results) {
        return;
      }

      function search() {
        var q = input.value.trim().toLowerCase();
        results.innerHTML = '';
        if (!q) {
          results.classList.remove('open');
          return;
        }
        var matched = index.filter(function (item) {
          return item.search.indexOf(q) !== -1;
        }).slice(0, 18);
        if (!matched.length) {
          var empty = document.createElement('div');
          empty.className = 'search-empty';
          empty.textContent = '没有找到相关影片';
          results.appendChild(empty);
        } else {
          matched.forEach(function (item) {
            results.appendChild(createResult(item));
          });
        }
        results.classList.add('open');
      }

      input.addEventListener('input', search);
      input.addEventListener('focus', search);
      if (trigger) {
        trigger.addEventListener('click', search);
      }
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        search();
      });
      document.addEventListener('click', function (event) {
        if (!form.contains(event.target)) {
          results.classList.remove('open');
        }
      });
    });
  }

  function initGridFilters() {
    document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
      var input = panel.querySelector('[data-grid-search]');
      var grid = document.querySelector('[data-card-grid]');
      var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-type]'));
      if (!grid) {
        return;
      }
      var activeType = 'all';
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));

      function apply() {
        var q = input ? input.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var text = card.getAttribute('data-search') || '';
          var type = (card.getAttribute('data-type') || '').toLowerCase();
          var matchText = !q || text.indexOf(q) !== -1;
          var matchType = activeType === 'all' || type === activeType;
          card.style.display = matchText && matchType ? '' : 'none';
        });
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          activeType = button.getAttribute('data-filter-type') || 'all';
          buttons.forEach(function (btn) {
            btn.classList.toggle('active', btn === button);
          });
          apply();
        });
      });

      if (input) {
        input.addEventListener('input', apply);
      }
    });
  }

  function initPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      var video = player.querySelector('video');
      var playButton = player.querySelector('[data-play-button]');
      var toggle = player.querySelector('[data-player-toggle]');
      var mute = player.querySelector('[data-player-mute]');
      var fullscreen = player.querySelector('[data-player-fullscreen]');
      var status = player.querySelector('[data-player-status]');
      var hls = null;
      var isReady = false;
      var isLoading = false;

      if (!video) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message || '';
        }
      }

      function load(callback) {
        var url = video.getAttribute('data-hls-url');
        if (!url) {
          setStatus('当前视频暂不可播放');
          return;
        }
        if (isReady) {
          callback();
          return;
        }
        if (isLoading) {
          video.addEventListener('canplay', callback, { once: true });
          return;
        }
        isLoading = true;

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            isReady = true;
            isLoading = false;
            setStatus('');
            callback();
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus('视频加载失败，请稍后重试');
              isLoading = false;
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          video.addEventListener('loadedmetadata', function () {
            isReady = true;
            isLoading = false;
            setStatus('');
            callback();
          }, { once: true });
          video.load();
        } else {
          setStatus('当前浏览器暂不支持该视频格式');
          isLoading = false;
        }
      }

      function play() {
        load(function () {
          var promise = video.play();
          player.classList.add('playing');
          if (promise && promise.catch) {
            promise.catch(function () {
              setStatus('点击播放按钮开始观看');
            });
          }
        });
      }

      function togglePlay() {
        if (video.paused) {
          play();
        } else {
          video.pause();
          player.classList.remove('playing');
        }
      }

      if (playButton) {
        playButton.addEventListener('click', play);
      }
      if (toggle) {
        toggle.addEventListener('click', togglePlay);
      }
      video.addEventListener('click', togglePlay);
      video.addEventListener('play', function () {
        player.classList.add('playing');
        if (toggle) {
          toggle.textContent = '暂停';
        }
      });
      video.addEventListener('pause', function () {
        if (toggle) {
          toggle.textContent = '播放';
        }
      });
      if (mute) {
        mute.addEventListener('click', function () {
          video.muted = !video.muted;
          mute.textContent = video.muted ? '取消静音' : '静音';
        });
      }
      if (fullscreen) {
        fullscreen.addEventListener('click', function () {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (player.requestFullscreen) {
            player.requestFullscreen();
          }
        });
      }
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initRails();
    initGlobalSearch();
    initGridFilters();
    initPlayers();
  });
})();
