(function() {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(function() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");
    if (toggle && mobileNav) {
      toggle.addEventListener("click", function() {
        var open = mobileNav.classList.toggle("is-open");
        document.body.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var hero = document.querySelector("[data-hero]");
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-target]"));
      var index = 0;
      function setSlide(next) {
        if (!slides.length) {
          return;
        }
        index = (next + slides.length) % slides.length;
        slides.forEach(function(slide, i) {
          slide.classList.toggle("is-active", i === index);
        });
        dots.forEach(function(dot, i) {
          dot.classList.toggle("is-active", i === index);
        });
      }
      dots.forEach(function(dot) {
        dot.addEventListener("click", function() {
          var next = Number(dot.getAttribute("data-hero-target"));
          setSlide(next);
        });
      });
      setSlide(0);
      window.setInterval(function() {
        setSlide(index + 1);
      }, 6500);
    }

    var areas = document.querySelectorAll("[data-filter-area]");
    areas.forEach(function(area) {
      var search = area.querySelector("[data-search-input]");
      var type = area.querySelector("[data-type-filter]");
      var cards = Array.prototype.slice.call(area.querySelectorAll("[data-search]"));
      var empty = area.querySelector("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q") || "";
      if (search && query) {
        search.value = query;
      }
      function apply() {
        var q = search ? search.value.trim().toLowerCase() : "";
        var t = type ? type.value.trim() : "";
        var visible = 0;
        cards.forEach(function(card) {
          var haystack = (card.getAttribute("data-search") || "").toLowerCase();
          var cardType = card.getAttribute("data-type") || "";
          var okSearch = !q || haystack.indexOf(q) !== -1;
          var okType = !t || cardType.indexOf(t) !== -1;
          var show = okSearch && okType;
          card.style.display = show ? "" : "none";
          if (show) {
            visible += 1;
          }
        });
        if (empty) {
          empty.style.display = visible ? "none" : "block";
        }
      }
      if (search) {
        search.addEventListener("input", apply);
      }
      if (type) {
        type.addEventListener("change", apply);
      }
      apply();
    });
  });
}());
