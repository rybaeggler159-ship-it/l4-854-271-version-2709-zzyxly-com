(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function initMobileNav() {
        var toggle = document.querySelector("[data-mobile-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("open");
            toggle.textContent = panel.classList.contains("open") ? "×" : "☰";
        });
    }

    function initHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, itemIndex) {
                slide.classList.toggle("active", itemIndex === index);
            });
            dots.forEach(function (dot, itemIndex) {
                dot.classList.toggle("active", itemIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        root.addEventListener("mouseenter", stop);
        root.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initPlayer() {
        var video = document.querySelector("[data-video-src]");
        if (!video) {
            return;
        }
        var source = video.getAttribute("data-video-src");
        var cover = document.querySelector("[data-play-button]");

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
        } else {
            var message = document.createElement("div");
            message.className = "player-message";
            message.textContent = "此浏览器暂不支持该视频格式";
            video.parentNode.appendChild(message);
        }

        function playVideo() {
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener("click", playVideo);
            video.addEventListener("play", function () {
                cover.classList.add("hidden");
            });
            video.addEventListener("pause", function () {
                if (!video.ended) {
                    cover.classList.remove("hidden");
                }
            });
        }
    }

    function getQuery(name) {
        var params = new URLSearchParams(window.location.search);
        return params.get(name) || "";
    }

    function createCard(item) {
        var a = document.createElement("a");
        a.className = "movie-card";
        a.href = item.url;
        a.innerHTML = [
            "<div class=\"movie-card-poster\">",
            "<img src=\"" + escapeHtml(item.cover) + "\" alt=\"" + escapeHtml(item.title) + "\" loading=\"lazy\">",
            "<span class=\"movie-badge\">" + escapeHtml(item.category) + "</span>",
            "<span class=\"movie-year\">" + escapeHtml(item.year) + "</span>",
            "</div>",
            "<div class=\"movie-card-body\">",
            "<h3>" + escapeHtml(item.title) + "</h3>",
            "<p>" + escapeHtml(item.description) + "</p>",
            "<div class=\"movie-meta-line\"><span>★ " + escapeHtml(item.rating) + "</span><span>" + escapeHtml(item.duration) + "</span></div>",
            "</div>"
        ].join("");
        return a;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function initSearch() {
        var results = document.getElementById("searchResults");
        var input = document.getElementById("searchInput");
        var category = document.getElementById("categoryFilter");
        var year = document.getElementById("yearFilter");
        var count = document.getElementById("searchCount");
        var data = window.MOVIE_INDEX || [];
        if (!results || !input || !data.length) {
            return;
        }

        input.value = getQuery("q");

        function render() {
            var keyword = input.value.trim().toLowerCase();
            var selectedCategory = category ? category.value : "";
            var selectedYear = year ? year.value : "";
            var filtered = data.filter(function (item) {
                var text = String(item.text || "").toLowerCase();
                var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
                var matchCategory = !selectedCategory || item.categorySlug === selectedCategory;
                var matchYear = !selectedYear || item.year === selectedYear;
                return matchKeyword && matchCategory && matchYear;
            }).slice(0, 120);

            results.innerHTML = "";
            filtered.forEach(function (item) {
                results.appendChild(createCard(item));
            });

            if (!filtered.length) {
                var empty = document.createElement("div");
                empty.className = "empty-result";
                empty.textContent = "未找到相关影片";
                results.appendChild(empty);
            }
            if (count) {
                count.textContent = "共找到 " + filtered.length + " 部影片";
            }
        }

        input.addEventListener("input", render);
        if (category) {
            category.addEventListener("change", render);
        }
        if (year) {
            year.addEventListener("change", render);
        }
        render();
    }

    ready(function () {
        initMobileNav();
        initHero();
        initPlayer();
        initSearch();
    });
})();
