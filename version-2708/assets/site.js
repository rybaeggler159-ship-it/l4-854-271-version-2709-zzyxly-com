import { H as Hls } from './hls-vendor-dru42stk.js';

const ready = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
};

const normalizeText = (value) => (value || '').toString().toLowerCase().trim();

function setupMobileMenu() {
    const button = document.querySelector('[data-mobile-menu-button]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (!button || !menu) {
        return;
    }
    button.addEventListener('click', () => {
        menu.classList.toggle('is-open');
    });
}

function setupHeroCarousel() {
    const carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) {
        return;
    }
    const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
    const prev = carousel.querySelector('[data-hero-prev]');
    const next = carousel.querySelector('[data-hero-next]');
    if (!slides.length) {
        return;
    }
    let current = 0;
    let timer = null;
    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === current);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === current);
        });
    };
    const startTimer = () => {
        window.clearInterval(timer);
        timer = window.setInterval(() => show(current + 1), 5200);
    };
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            show(index);
            startTimer();
        });
    });
    if (prev) {
        prev.addEventListener('click', () => {
            show(current - 1);
            startTimer();
        });
    }
    if (next) {
        next.addEventListener('click', () => {
            show(current + 1);
            startTimer();
        });
    }
    show(0);
    startTimer();
}

function applyPanelFilter(panel) {
    const targetSelector = panel.getAttribute('data-target');
    const target = targetSelector ? document.querySelector(targetSelector) : null;
    if (!target) {
        return;
    }
    const cards = Array.from(target.querySelectorAll('[data-search]'));
    const input = panel.querySelector('[data-movie-search]');
    const activeChip = panel.querySelector('[data-filter-value].is-active');
    const query = normalizeText(input ? input.value : '');
    const chipValue = activeChip ? normalizeText(activeChip.getAttribute('data-filter-value')) : 'all';
    cards.forEach((card) => {
        const text = normalizeText(card.getAttribute('data-search'));
        const keywordMatch = !query || text.includes(query);
        const chipMatch = !chipValue || chipValue === 'all' || text.includes(chipValue);
        card.hidden = !(keywordMatch && chipMatch);
    });
}

function setupFilters() {
    const panels = Array.from(document.querySelectorAll('[data-filter-panel]'));
    panels.forEach((panel) => {
        const input = panel.querySelector('[data-movie-search]');
        const chips = Array.from(panel.querySelectorAll('[data-filter-value]'));
        if (input) {
            input.addEventListener('input', () => applyPanelFilter(panel));
        }
        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                chips.forEach((item) => item.classList.remove('is-active'));
                chip.classList.add('is-active');
                applyPanelFilter(panel);
            });
        });
    });
}

function setupPlayers() {
    const panels = Array.from(document.querySelectorAll('[data-player]'));
    panels.forEach((panel) => {
        const video = panel.querySelector('video[data-src]');
        const overlay = panel.querySelector('[data-play-overlay]');
        if (!video || !overlay) {
            return;
        }
        const src = video.getAttribute('data-src');
        let prepared = false;
        let hls = null;
        const prepare = () => {
            if (prepared) {
                return;
            }
            prepared = true;
            video.controls = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
            } else if (Hls && Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(src);
                hls.attachMedia(video);
            } else {
                video.src = src;
            }
        };
        const start = () => {
            prepare();
            overlay.classList.add('is-hidden');
            const attempt = video.play();
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(() => {
                    overlay.classList.remove('is-hidden');
                });
            }
        };
        overlay.addEventListener('click', start);
        video.addEventListener('click', () => {
            if (!prepared) {
                start();
            }
        });
        window.addEventListener('pagehide', () => {
            if (hls) {
                hls.destroy();
                hls = null;
            }
        });
    });
}

ready(() => {
    setupMobileMenu();
    setupHeroCarousel();
    setupFilters();
    setupPlayers();
});
