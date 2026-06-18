(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupScrollers() {
    document.querySelectorAll("[data-scroll-wrap]").forEach(function (wrap) {
      var list = wrap.querySelector("[data-scroll-list]");
      var left = wrap.querySelector("[data-scroll-left]");
      var right = wrap.querySelector("[data-scroll-right]");
      if (!list) {
        return;
      }
      function move(amount) {
        list.scrollBy({ left: amount, behavior: "smooth" });
      }
      if (left) {
        left.addEventListener("click", function () {
          move(-420);
        });
      }
      if (right) {
        right.addEventListener("click", function () {
          move(420);
        });
      }
    });
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function setupSearch() {
    document.querySelectorAll("[data-search-input]").forEach(function (input) {
      var scopeSelector = input.getAttribute("data-search-scope");
      var scope = scopeSelector ? document.querySelector(scopeSelector) : document;
      if (!scope) {
        scope = document;
      }
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));
      var empty = document.querySelector(input.getAttribute("data-empty-target") || "");
      function apply() {
        var query = normalize(input.value);
        var shown = 0;
        cards.forEach(function (card) {
          var haystack = normalize((card.getAttribute("data-title") || "") + " " + (card.getAttribute("data-meta") || "") + " " + card.textContent);
          var matched = !query || haystack.indexOf(query) !== -1;
          card.style.display = matched ? "" : "none";
          if (matched) {
            shown += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("show", shown === 0);
        }
      }
      input.addEventListener("input", apply);
      apply();
    });
  }

  function setupPlayer() {
    var shell = document.querySelector("[data-player]");
    if (!shell) {
      return;
    }
    var video = shell.querySelector("video");
    var overlay = shell.querySelector(".player-overlay");
    var button = shell.querySelector("[data-play]");
    var status = shell.querySelector("[data-player-status]");
    var stream = shell.getAttribute("data-stream");
    var hlsInstance = null;
    var attached = false;

    if (!video || !stream) {
      return;
    }

    function setStatus(text) {
      if (status) {
        status.textContent = text || "";
      }
    }

    function attach() {
      if (attached) {
        return;
      }
      attached = true;
      setStatus("正在载入");
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus("");
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setStatus("视频暂时无法播放");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        setStatus("");
      } else {
        video.src = stream;
        setStatus("");
      }
    }

    function play() {
      attach();
      if (overlay) {
        overlay.classList.add("hidden");
      }
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          setStatus("点击画面继续播放");
        });
      }
    }

    function toggle() {
      if (!attached || video.paused) {
        play();
      } else {
        video.pause();
      }
    }

    if (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        play();
      });
    }
    if (overlay) {
      overlay.addEventListener("click", play);
    }
    video.addEventListener("click", toggle);
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupScrollers();
    setupSearch();
    setupPlayer();
  });
})();
