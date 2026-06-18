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
        var nav = document.querySelector(".mobile-nav");
        if (!button || !nav) {
            return;
        }
        button.addEventListener("click", function () {
            var open = nav.classList.toggle("is-open");
            button.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function setupFilters() {
        var scopes = document.querySelectorAll("[data-filter-scope]");
        scopes.forEach(function (scope) {
            var main = scope.closest("main") || document;
            var input = scope.querySelector("[data-filter-input]");
            var region = scope.querySelector("[data-filter-region]");
            var type = scope.querySelector("[data-filter-type]");
            var year = scope.querySelector("[data-filter-year]");
            var grid = main.querySelector(".filter-grid");
            if (!grid) {
                return;
            }
            var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card, .rank-card"));
            if (input && input.hasAttribute("data-query-from-url")) {
                var params = new URLSearchParams(window.location.search);
                var q = params.get("q");
                if (q) {
                    input.value = q;
                }
            }
            function apply() {
                var q = normalize(input ? input.value : "");
                var regionValue = normalize(region ? region.value : "");
                var typeValue = normalize(type ? type.value : "");
                var yearValue = normalize(year ? year.value : "");
                cards.forEach(function (card) {
                    var text = normalize(card.textContent + " " + card.dataset.title + " " + card.dataset.genre);
                    var cardRegion = normalize(card.dataset.region);
                    var cardType = normalize(card.dataset.type);
                    var cardYear = normalize(card.dataset.year);
                    var matched = true;
                    if (q && text.indexOf(q) === -1) {
                        matched = false;
                    }
                    if (regionValue && cardRegion.indexOf(regionValue) === -1) {
                        matched = false;
                    }
                    if (typeValue && cardType.indexOf(typeValue) === -1) {
                        matched = false;
                    }
                    if (yearValue && cardYear !== yearValue) {
                        matched = false;
                    }
                    card.classList.toggle("is-hidden", !matched);
                });
            }
            [input, region, type, year].forEach(function (element) {
                if (element) {
                    element.addEventListener("input", apply);
                    element.addEventListener("change", apply);
                }
            });
            apply();
        });
    }

    function setupPlayers() {
        var players = document.querySelectorAll("[data-player]");
        players.forEach(function (shell) {
            var video = shell.querySelector("video");
            var cover = shell.querySelector(".player-cover");
            var stream = shell.getAttribute("data-stream");
            var hlsInstance = null;
            if (!video || !cover || !stream) {
                return;
            }
            function attach() {
                if (hlsInstance) {
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hlsInstance.loadSource(stream);
                    hlsInstance.attachMedia(video);
                } else {
                    video.src = stream;
                }
            }
            function play() {
                attach();
                shell.classList.add("is-playing");
                var result = video.play();
                if (result && typeof result.catch === "function") {
                    result.catch(function () {});
                }
            }
            cover.addEventListener("click", play);
            video.addEventListener("click", function () {
                if (video.paused) {
                    play();
                }
            });
        });
    }

    ready(function () {
        setupMenu();
        setupFilters();
        setupPlayers();
    });
})();
