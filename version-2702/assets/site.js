(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var button = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "×" : "☰";
    });
  }

  function setupHero() {
    var slider = document.querySelector(".hero-slider");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    start();
  }

  function setupCardFilter() {
    var input = document.querySelector("[data-card-filter]");
    var list = document.querySelector("[data-card-list]");
    if (!input || !list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
    input.addEventListener("input", function () {
      var value = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = ((card.getAttribute("data-title") || "") + " " + (card.getAttribute("data-text") || "")).toLowerCase();
        card.classList.toggle("is-hidden", value.length > 0 && text.indexOf(value) === -1);
      });
    });
  }

  function cardTemplate(movie) {
    var tags = movie.tags.slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return [
      "<article class=\"movie-card\" data-title=\"" + escapeHtml(movie.title) + "\" data-text=\"" + escapeHtml(movie.text) + "\">",
      "  <a class=\"card-poster\" href=\"" + movie.file + "\" aria-label=\"" + escapeHtml(movie.title) + "\">",
      "    <img src=\"" + movie.cover + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">",
      "    <span class=\"card-type\">" + escapeHtml(movie.type) + "</span>",
      "    <span class=\"card-play\">▶</span>",
      "  </a>",
      "  <div class=\"card-body\">",
      "    <h2><a href=\"" + movie.file + "\">" + escapeHtml(movie.title) + "</a></h2>",
      "    <p>" + escapeHtml(movie.oneLine) + "</p>",
      "    <div class=\"card-meta\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.year) + "</span></div>",
      "    <div class=\"tag-row\">" + tags + "</div>",
      "  </div>",
      "</article>"
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupSearchPage() {
    var results = document.getElementById("searchResults");
    if (!results || typeof SITE_MOVIES === "undefined") {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var input = document.getElementById("searchInput");
    var state = document.querySelector("[data-search-state]");
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-search-category]"));
    var query = params.get("q") || "";
    var category = params.get("category") || "";
    if (input) {
      input.value = query;
    }

    function render() {
      var value = (input ? input.value : query).trim().toLowerCase();
      var items = SITE_MOVIES.filter(function (movie) {
        var matchesText = value.length === 0 || movie.text.toLowerCase().indexOf(value) !== -1;
        var matchesCategory = category.length === 0 || movie.category === category;
        return matchesText && matchesCategory;
      });
      results.innerHTML = items.map(cardTemplate).join("");
      if (state) {
        state.textContent = items.length ? "点击影片卡片进入详情页。" : "没有找到相关影片。";
      }
      buttons.forEach(function (button) {
        button.classList.toggle("is-active", (button.getAttribute("data-search-category") || "") === category);
      });
    }

    if (input) {
      input.addEventListener("input", render);
    }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        category = button.getAttribute("data-search-category") || "";
        var url = new URL(window.location.href);
        if (category) {
          url.searchParams.set("category", category);
        } else {
          url.searchParams.delete("category");
        }
        if (input && input.value.trim()) {
          url.searchParams.set("q", input.value.trim());
        } else {
          url.searchParams.delete("q");
        }
        history.replaceState(null, "", url.toString());
        render();
      });
    });
    render();
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupCardFilter();
    setupSearchPage();
  });
})();

function initializePlayer(videoId, buttonId, streamUrl) {
  var video = document.getElementById(videoId);
  var button = document.getElementById(buttonId);
  if (!video || !button || !streamUrl) {
    return;
  }
  var shell = video.closest(".player-shell");
  var message = shell ? shell.querySelector("[data-player-message]") : null;
  var attached = false;
  var hlsPlayer = null;

  function showMessage(text) {
    if (!message) {
      return;
    }
    message.textContent = text;
    message.classList.add("is-visible");
  }

  function attachStream() {
    if (attached) {
      return;
    }
    attached = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      return;
    }
    if (typeof Hls !== "undefined" && Hls.isSupported()) {
      hlsPlayer = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsPlayer.loadSource(streamUrl);
      hlsPlayer.attachMedia(video);
      hlsPlayer.on(Hls.Events.ERROR, function (eventName, data) {
        if (data && data.fatal) {
          showMessage("播放暂时不可用，请稍后再试。");
        }
      });
      return;
    }
    showMessage("播放暂时不可用，请稍后再试。");
  }

  function startPlayback() {
    attachStream();
    if (shell) {
      shell.classList.add("is-playing");
    }
    var promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {
        if (shell) {
          shell.classList.remove("is-playing");
        }
      });
    }
  }

  button.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    startPlayback();
  });

  video.addEventListener("click", function () {
    if (video.paused) {
      startPlayback();
    }
  });

  video.addEventListener("play", function () {
    if (shell) {
      shell.classList.add("is-playing");
    }
  });

  video.addEventListener("pause", function () {
    if (shell) {
      shell.classList.remove("is-playing");
    }
  });

  window.addEventListener("pagehide", function () {
    if (hlsPlayer) {
      hlsPlayer.destroy();
      hlsPlayer = null;
    }
  });
}
