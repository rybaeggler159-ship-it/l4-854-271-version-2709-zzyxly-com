(() => {
    const mobileToggle = document.querySelector('[data-mobile-toggle]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            document.body.classList.toggle('menu-open', mobileMenu.classList.contains('open'));
        });
    }

    document.querySelectorAll('[data-search-form]').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const input = form.querySelector('input[name="q"]');
            const keyword = input ? input.value.trim() : '';
            const base = form.dataset.base || './';
            if (keyword) {
                window.location.href = `${base}search.html?q=${encodeURIComponent(keyword)}`;
            }
        });
    });

    const hero = document.querySelector('[data-hero]');

    if (hero) {
        const track = hero.querySelector('[data-hero-track]');
        const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
        const prev = hero.querySelector('[data-hero-prev]');
        const next = hero.querySelector('[data-hero-next]');
        let current = 0;
        let timer = null;

        const show = (index) => {
            current = (index + slides.length) % slides.length;
            track.style.transform = `translateX(-${current * 100}%)`;
            dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === current));
        };

        const play = () => {
            timer = window.setInterval(() => show(current + 1), 5000);
        };

        const reset = () => {
            window.clearInterval(timer);
            play();
        };

        if (prev) {
            prev.addEventListener('click', () => {
                show(current - 1);
                reset();
            });
        }

        if (next) {
            next.addEventListener('click', () => {
                show(current + 1);
                reset();
            });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                show(index);
                reset();
            });
        });

        show(0);
        play();
    }

    const filterInput = document.querySelector('[data-filter-input]');
    const filterYear = document.querySelector('[data-filter-year]');
    const filterRegion = document.querySelector('[data-filter-region]');
    const filterType = document.querySelector('[data-filter-type]');
    const cards = Array.from(document.querySelectorAll('[data-movie-card]'));
    const empty = document.querySelector('[data-empty]');

    const fillOptions = (select, key) => {
        if (!select) {
            return;
        }

        const values = Array.from(new Set(cards.map((card) => card.dataset[key]).filter(Boolean))).sort();
        values.forEach((value) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    };

    fillOptions(filterYear, 'year');
    fillOptions(filterRegion, 'region');
    fillOptions(filterType, 'type');

    const applyInitialQuery = () => {
        if (!filterInput) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');

        if (q) {
            filterInput.value = q;
        }
    };

    const runFilter = () => {
        if (!cards.length) {
            return;
        }

        const keyword = filterInput ? filterInput.value.trim().toLowerCase() : '';
        const year = filterYear ? filterYear.value : '';
        const region = filterRegion ? filterRegion.value : '';
        const type = filterType ? filterType.value : '';
        let visible = 0;

        cards.forEach((card) => {
            const haystack = [
                card.dataset.title,
                card.dataset.genre,
                card.dataset.region,
                card.dataset.type,
                card.dataset.category,
                card.textContent
            ].join(' ').toLowerCase();
            const matched = (!keyword || haystack.includes(keyword)) &&
                (!year || card.dataset.year === year) &&
                (!region || card.dataset.region === region) &&
                (!type || card.dataset.type === type);

            card.classList.toggle('is-hidden', !matched);
            if (matched) {
                visible += 1;
            }
        });

        if (empty) {
            empty.style.display = visible ? 'none' : 'block';
        }
    };

    applyInitialQuery();
    [filterInput, filterYear, filterRegion, filterType].forEach((item) => {
        if (item) {
            item.addEventListener('input', runFilter);
            item.addEventListener('change', runFilter);
        }
    });
    runFilter();
})();
