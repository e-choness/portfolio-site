// Initialize AOS (Animate On Scroll)
AOS.init({
  duration: 800,
  easing: "ease-in-out",
  once: true,
  offset: 100,
  disable: "mobile", // Disable AOS on mobile to prevent conflicts
});

// Typed.js initialization
// Get typed strings from Jekyll data (injected via window.typedStrings) or use fallback
const typedStrings =
  window.typedStrings && window.typedStrings.length > 0
    ? window.typedStrings
    : [
        "Full-Stack Developer",
        "Problem Solver",
        "Tech Enthusiast",
        "Creative Thinker",
      ];

if (document.querySelector("#typed-text") && typeof Typed !== "undefined") {
  const typed = new Typed("#typed-text", {
    strings: typedStrings,
    typeSpeed: 100,
    backSpeed: 60,
    backDelay: 2000,
    loop: true,
  });
}

// Theme Toggle
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = themeToggle ? themeToggle.querySelector("i") : null;

// Check for saved theme preference or default to light
const currentTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", currentTheme);

if (themeIcon && currentTheme === "dark") {
  themeIcon.classList.replace("fa-moon", "fa-sun");
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    // Toggle icon
    if (themeIcon) {
      if (newTheme === "dark") {
        themeIcon.classList.replace("fa-moon", "fa-sun");
      } else {
        themeIcon.classList.replace("fa-sun", "fa-moon");
      }
    }

    // Regenerate starfield with new theme colors
    const container = document.querySelector(".particles-container");
    if (container) {
      // Fade out, swap colors, fade in
      container.style.transition = "opacity 0.3s ease";
      container.style.opacity = "0";
      setTimeout(() => {
        container.innerHTML = "";
        createStarfield();
        container.style.opacity = "1";
      }, 300);
    }
  });
}

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const headerEl = document.querySelector(".header");

if (mobileMenuToggle && navMenu) {
  mobileMenuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");
    const icon = mobileMenuToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
    mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      const icon = mobileMenuToggle.querySelector("i");
      if (icon) {
        icon.classList.add("fa-bars");
        icon.classList.remove("fa-times");
      }
      mobileMenuToggle.setAttribute("aria-expanded", "false");
    }
  });

  // Close when clicking outside the navigation
  document.addEventListener("click", (e) => {
    const withinNav = e.target.closest(".nav-container");
    if (!withinNav && navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      const icon = mobileMenuToggle.querySelector("i");
      if (icon) {
        icon.classList.add("fa-bars");
        icon.classList.remove("fa-times");
      }
      mobileMenuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

// Smooth Scrolling Navigation
const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href") || "";
    const url = new URL(href, window.location.origin);

    const isSamePageHash =
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.hash &&
      url.hash.startsWith("#");

    // Only intercept same-page hash links for smooth scroll; otherwise let browser navigate
    if (href.startsWith("#") || isSamePageHash) {
      e.preventDefault();
      const targetId = href.startsWith("#") ? href : url.hash;
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }

      // Close mobile menu if open
      if (navMenu) {
        navMenu.classList.remove("active");
      }
      if (mobileMenuToggle) {
        const mobileIcon = mobileMenuToggle.querySelector("i");
        if (mobileIcon) {
          mobileIcon.classList.add("fa-bars");
          mobileIcon.classList.remove("fa-times");
        }
        mobileMenuToggle.setAttribute("aria-expanded", "false");
      }
    }
  });
});

// Active Navigation Highlighting
window.addEventListener("scroll", () => {
  const sections = document.querySelectorAll("section");
  const scrollPos = window.scrollY + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${sectionId}`) {
          link.classList.add("active");
        }
      });
    }
  });

  // Toggle header shadow when scrolled
  if (headerEl) {
    if (window.scrollY > 10) {
      headerEl.classList.add("scrolled");
    } else {
      headerEl.classList.remove("scrolled");
    }
  }
});

// Animated Counters
const animateCounters = () => {
  const counters = document.querySelectorAll(".stat-number");

  counters.forEach((counter) => {
    const target = parseInt(counter.getAttribute("data-count"));
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(target * easeOutQuart);

      counter.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };

    requestAnimationFrame(updateCounter);
  });
};

// Animate skill bars
const animateSkillBars = () => {
  const skillBars = document.querySelectorAll(".skill-progress");

  skillBars.forEach((bar, index) => {
    const width = bar.getAttribute("data-width");
    // Stagger the animations slightly
    setTimeout(() => {
      bar.style.width = width + "%";
    }, index * 100);
  });
};

// Check if element is in viewport
const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Intersection Observer for animations with mobile-friendly settings
const observerOptions = {
  threshold: 0.1, // Lower threshold for mobile
  rootMargin: "0px 0px -50px 0px", // Smaller margin for mobile
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      if (entry.target.id === "about") {
        // Add a small delay for mobile devices
        const delay = window.innerWidth <= 768 ? 100 : 500;
        setTimeout(animateCounters, delay);
      }
      if (entry.target.id === "skills") {
        // Add a small delay for mobile devices
        const delay = window.innerWidth <= 768 ? 100 : 500;
        setTimeout(animateSkillBars, delay);
      }
    }
  });
}, observerOptions);

// Observe sections
document.querySelectorAll("section").forEach((section) => {
  observer.observe(section);
});

// Fallback for mobile devices - trigger animations on scroll
let aboutAnimated = false;
let skillsAnimated = false;

const handleScroll = () => {
  const aboutSection = document.getElementById("about");
  const skillsSection = document.getElementById("skills");

  if (aboutSection && !aboutAnimated && isInViewport(aboutSection)) {
    animateCounters();
    aboutAnimated = true;
  }

  if (skillsSection && !skillsAnimated && isInViewport(skillsSection)) {
    animateSkillBars();
    skillsAnimated = true;
  }
};

// Add scroll listener for mobile fallback
window.addEventListener("scroll", handleScroll);

// Add touch event listener for mobile devices
window.addEventListener("touchstart", handleScroll);
window.addEventListener("touchmove", handleScroll);

// Trigger animations on page load if sections are already visible
window.addEventListener("load", () => {
  const aboutSection = document.getElementById("about");
  const skillsSection = document.getElementById("skills");

  if (aboutSection && isInViewport(aboutSection)) {
    setTimeout(animateCounters, 500);
    aboutAnimated = true;
  }

  if (skillsSection && isInViewport(skillsSection)) {
    setTimeout(animateSkillBars, 500);
    skillsAnimated = true;
  }

  // Fallback: If animations haven't triggered after 2 seconds, force them
  setTimeout(() => {
    if (!aboutAnimated && aboutSection) {
      animateCounters();
      aboutAnimated = true;
    }
    if (!skillsAnimated && skillsSection) {
      animateSkillBars();
      skillsAnimated = true;
    }
  }, 2000);
});



// Project Card Click Handlers
const projectCards = document.querySelectorAll(".project-card");
projectCards.forEach((card) => {
  card.addEventListener("click", (e) => {
    // Don't trigger if clicking on links
    if (e.target.closest(".project-link")) {
      return;
    }

    // Get the project URL from data attribute
    const projectUrl = card.getAttribute("data-project-url");

    if (projectUrl) {
      // Navigate to the project page
      window.location.href = projectUrl;
    } else {
      // Fallback to live demo or GitHub if no project page exists
      const liveLink = card.querySelector('a[href*="demo"]');
      const githubLink = card.querySelector('a[href*="github"]');

      if (liveLink) {
        window.open(liveLink.href, "_blank");
      } else if (githubLink) {
        window.open(githubLink.href, "_blank");
      }
    }
  });
});

// Blog Card Click Handlers
const blogCards = document.querySelectorAll(".blog-card");
blogCards.forEach((card) => {
  card.addEventListener("click", (e) => {
    // Don't trigger if clicking on the read more link
    if (e.target.closest(".blog-read-more")) {
      return;
    }

    // Find the read more link and navigate to it
    const readMoreLink = card.querySelector(".blog-read-more");
    if (readMoreLink) {
      window.location.href = readMoreLink.href;
    }
  });
});

// Back to Top Button
const backToTopButton = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopButton.classList.add("visible");
  } else {
    backToTopButton.classList.remove("visible");
  }
});

backToTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Enhanced Starfield - Theme-Aware High-Visibility Particle System
const createStarfield = () => {
  const container = document.querySelector(".particles-container");
  if (!container) return;

  // Detect current theme
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  // Theme-specific color palettes
  const palettes = {
    dark: {
      // Cool blue-white spectrum — bright, luminous stars
      baseHue: 210,
      hueRange: 40,
      saturation: 75,
      lightness: 94,
      glowIntensity: 1.0,
      shadowColor: 'hsla(210, 70%, 55%, 0.45)',
      blendMode: 'screen'
    },
    light: {
      // Deep indigo/violet — high contrast against light bg
      baseHue: 255,
      hueRange: 25,
      saturation: 90,
      lightness: 38,
      glowIntensity: 0.55,
      shadowColor: 'hsla(255, 90%, 35%, 0.3)',
      blendMode: 'multiply'
    }
   };

  const theme = isDark ? palettes.dark : palettes.light;

  // Multi-layered depth system with optimized visibility per theme
  const layers = [
    // Far: background stars - smaller, softer, slower
    {
      count: isDark ? 30 : 22,
      sizeMin: isDark ? 0.8 : 1.2,
      sizeMax: isDark ? 1.8 : 2.2,
      opacityBase: isDark ? 0.2 : 0.45,
      blur: isDark ? 1.2 : 0.6,
      speedMin: isDark ? 25 : 30,
      speedMax: isDark ? 45 : 50,
      glowMultiplier: isDark ? 0.7 : 0.5
    },
    // Mid-range: main visible field
    {
      count: isDark ? 40 : 32,
      sizeMin: isDark ? 1.8 : 2.3,
      sizeMax: isDark ? 3.8 : 4.5,
      opacityBase: isDark ? 0.5 : 0.7,
      blur: isDark ? 0.6 : 0.2,
      speedMin: isDark ? 15 : 18,
      speedMax: isDark ? 28 : 32,
      glowMultiplier: isDark ? 1.0 : 0.7
    },
    // Near: prominent, sharper stars
    {
      count: isDark ? 25 : 18,
      sizeMin: isDark ? 3.5 : 2.8,
      sizeMax: isDark ? 6.5 : 5.5,
      opacityBase: isDark ? 0.9 : 0.9,
      blur: isDark ? 0.2 : 0.05,
      speedMin: isDark ? 8 : 10,
      speedMax: isDark ? 18 : 22,
      glowMultiplier: isDark ? 1.2 : 0.9
    },
    // Accent beacons: bright focal points
    {
      count: isDark ? 6 : 3,
      sizeMin: isDark ? 7 : 5.5,
      sizeMax: isDark ? 11 : 8.5,
      opacityBase: 1.0,
      blur: 0,
      speedMin: isDark ? 4 : 5,
      speedMax: isDark ? 10 : 12,
      glowMultiplier: isDark ? 1.4 : 1.0
    }
  ];

  layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i++) {
      const star = document.createElement("div");
      const size = Math.random() * (layer.sizeMax - layer.sizeMin) + layer.sizeMin;
      const duration = Math.random() * (layer.speedMax - layer.speedMin) + layer.speedMin;
      const delay = Math.random() * -duration;
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      const driftX = (Math.random() - 0.5) * (6 + size * 0.4);
      const driftY = (Math.random() - 0.5) * 5;

      // Theme-aware color generation
      const hue = theme.baseHue + (Math.random() - 0.5) * theme.hueRange;
      const sat = theme.saturation + (Math.random() - 0.5) * 15;
      const light = theme.lightness + (Math.random() - 0.5) * 10;
      const glow1Size = size * (1.0 + layer.glowMultiplier * 0.4);
      const glow2Size = size * (2.2 + layer.glowMultiplier * 0.6);
      const glow3Size = size * (3.5 + layer.glowMultiplier * 0.8);
      // Smoother blur for natural edge softening
      const blurVal = layer.blur + Math.random() * 0.4;
      // Soft border radius for organic shape (slightly off-perfect circle)
      const radiusX = 48 + Math.random() * 4;
      const radiusY = 48 + Math.random() * 4;

      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: hsl(${hue}, ${sat}%, ${light}%);
        border-radius: ${radiusX}% ${100 - radiusX}% ${radiusY}% ${100 - radiusY}% / ${radiusY}% ${radiusX}% ${100 - radiusY}% ${100 - radiusX}%;
        box-shadow:
          0 0 ${glow1Size * 1.15}px hsla(${hue}, ${sat}%, ${light + 30}%, 0.45),
          0 0 ${glow2Size * 1.2}px hsla(${hue}, ${sat}%, ${light + 20}%, 0.4),
          0 0 ${glow3Size}px hsla(${hue}, ${sat}%, ${light + 10}%, 0.3);
         filter: blur(${blurVal}px);
         --twinkle-base: ${layer.opacityBase * (0.7 + Math.random() * 0.3)};
         opacity: calc(var(--twinkle-base) * 0.85);
        left: ${startX}%;
        top: ${startY}%;
        pointer-events: none;
        will-change: transform, opacity, filter;
        mix-blend-mode: ${theme.blendMode};
        animation: starFloat ${duration}s ease-in-out ${delay}s infinite alternate,
                   starTwinkle ${1.8 + Math.random() * 2.2}s ease-in-out ${Math.random() * 2}s infinite,
                   starPulse ${3 + Math.random() * 5}s ease-in-out ${Math.random() * 3}s infinite;
        --drift-x: ${driftX}vmin;
        --drift-y: ${driftY}vmin;
        --pulse-scale: ${1 + (size / 20)};
        z-index: ${Math.floor(size)};
      `;

      container.appendChild(star);
    }
  });
};

// Initialize starfield on DOM ready
const initStarfield = () => {
  // Clear existing stars
  const container = document.querySelector(".particles-container");
  if (container) container.innerHTML = "";
  createStarfield();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStarfield);
} else {
  initStarfield();
}

// Smooth loading animation
window.addEventListener("load", () => {
  document.body.style.opacity = "1";
});
// Search modules: centralized here (removed from page-level inline scripts)
(function () {
  const hasBlogSearch = () =>
    document.querySelector("#search-results.blog-grid");
  const hasProjectSearch = () =>
    document.querySelector("#search-results.projects-grid");

  // Utility for toggling hidden state via CSS class (no inline styles)
  const setHidden = (el, hidden) => {
    if (!el) return;
    el.classList.toggle("is-hidden", !!hidden);
  };

  // Read embedded JSON from script[type="application/json"] blocks
  const getJSONData = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  };

  class BlogSearch {
    constructor() {
      this.searchInput = document.getElementById("search-input");
      this.searchButton = document.getElementById("search-button");
      this.clearButton = document.getElementById("clear-search");
      this.categoryFilter = document.getElementById("category-filter");
      this.sortFilter = document.getElementById("sort-filter");
      this.resultsContainer = document.getElementById("search-results");
      this.resultsCount = document.getElementById("search-results-count");
      this.noResults = document.getElementById("no-results");
      this.suggestions = document.getElementById("search-suggestions");

      this.posts = getJSONData("blog-search-data") || window.searchData || [];
      this.filteredPosts = [...this.posts];

      this.init();
    }

    init() {
      if (!this.searchInput) return;

      this.searchInput.addEventListener(
        "input",
        this.debounce(this.handleSearch.bind(this), 300)
      );
      this.searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.handleSearch();
        }
      });

      this.searchButton?.addEventListener(
        "click",
        this.handleSearch.bind(this)
      );
      this.clearButton?.addEventListener("click", this.clearSearch.bind(this));
      this.categoryFilter?.addEventListener(
        "change",
        this.handleFilter.bind(this)
      );
      this.sortFilter?.addEventListener("change", this.handleSort.bind(this));

      document.querySelectorAll(".tag-suggestion").forEach((tag) => {
        tag.addEventListener("click", (e) => {
          const tagValue = e.target.getAttribute("data-tag");
          this.searchInput.value = tagValue;
          this.handleSearch();
        });
      });

this.checkUrlParams();
       // Don't auto-display results - let the initial page content (paginated) show
       // Results will be displayed when user searches or filters
    }

    checkUrlParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get("q");
      const category = urlParams.get("category");

      if (query) {
        this.searchInput.value = query;
        this.handleSearch();
      }

      if (category && this.categoryFilter) {
        this.categoryFilter.value = category;
        this.handleFilter();
      }
    }

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    handleSearch() {
      const query = (this.searchInput.value || "").trim().toLowerCase();

      if (query === "") {
        this.clearSearch();
        return;
      }

      // Split query into words and require ALL words to match (AND search)
      const queryWords = query.split(/\s+/).filter(w => w.length > 0);

      this.filteredPosts = this.posts.filter((post) => {
        const searchFields = [
          post.title,
          post.content,
          post.category || "",
          (post.tags || []).join(" "),
          post.author || "",
        ]
          .join(" ")
          .toLowerCase();

        // All query words must be present in the search fields
        return queryWords.every(word => searchFields.includes(word));
      });

      this.applyFilters();
      this.updateUI(query);
    }

    handleFilter() {
      const category = this.categoryFilter?.value || "";
      const query = (this.searchInput.value || "").trim();

      let results = [...this.posts];

      if (category !== "") {
        results = results.filter(post => post.category === category);
      }

      if (query !== "") {
        const queryWords = query.split(/\s+/).filter(w => w.length > 0);
        results = results.filter(post => {
          const searchFields = [
            post.title,
            post.content,
            post.category || "",
            (post.tags || []).join(" "),
            post.author || "",
          ].join(" ").toLowerCase();
          return queryWords.every(word => searchFields.includes(word));
        });
      }

      this.filteredPosts = results;
      this.applySort();
      this.updateUI();
    }

    handleSort() {
      this.applySort();
      this.displayResults(this.filteredPosts);
    }

    applyFilters() {
      const category = this.categoryFilter?.value || "";
      if (category !== "") {
        this.filteredPosts = this.filteredPosts.filter(
          (post) => post.category === category
        );
      }
      this.applySort();
    }

    applySort() {
      const sortBy = this.sortFilter?.value || "date-desc";
      this.filteredPosts.sort((a, b) => {
        switch (sortBy) {
          case "date-desc":
            return new Date(b.date) - new Date(a.date);
          case "date-asc":
            return new Date(a.date) - new Date(b.date);
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          default:
            return new Date(b.date) - new Date(a.date);
        }
      });
    }

    updateUI(query = "") {
      this.displayResults(this.filteredPosts, query);
      this.updateResultsCount();
      this.toggleClearButton();
      this.toggleSuggestions();
    }

    displayResults(posts, query = "") {
      if (!this.resultsContainer) return;

      if (posts.length === 0) {
        setHidden(this.resultsContainer, true);
        setHidden(this.noResults, false);
        return;
      }

      setHidden(this.resultsContainer, false);
      setHidden(this.noResults, true);

      const resultsHTML = posts
        .map((post, index) => {
          const delay = Math.min(index * 100, 800);
          const highlightedTitle = query
            ? this.highlightText(post.title, query)
            : post.title;
          const highlightedExcerpt = query
            ? this.highlightText(post.excerpt || "", query)
            : post.excerpt || "";
          const imageSrc = post.image
            ? (post.image.startsWith('assets/') ? '/' + post.image : post.image)
            : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop";

          return `
          <article class="blog-card" data-aos="fade-up" data-aos-delay="${delay}">
            <img src="${imageSrc}" alt="${post.title}" class="blog-image">
            <div class="blog-content">
              <div class="blog-meta">
                <span class="blog-date">
                  <i class="fas fa-calendar"></i>
                  ${post.dateFormatted}
                </span>
                ${
                  post.category
                    ? `<span class="blog-category">${
                        post.category.charAt(0).toUpperCase() +
                        post.category.slice(1)
                      }</span>`
                    : ""
                }
              </div>
              <h2 class="blog-card-title">
                <a href="${post.url}">${highlightedTitle}</a>
              </h2>
              <p class="blog-excerpt">${highlightedExcerpt}</p>
              ${
                post.tags && post.tags.length > 0
                  ? `
              <div class="post-tags-preview">
                ${post.tags
                  .slice(0, 3)
                  .map((tag) => `<span class="tag-small">#${tag}</span>`)
                  .join("")}
              </div>`
                  : ""
              }
              <a href="${post.url}" class="blog-read-more">
                Read More <i class="fas fa-arrow-right"></i>
              </a>
            </div>
          </article>
        `;
        })
        .join("");

      this.resultsContainer.innerHTML = resultsHTML;
      if (typeof AOS !== "undefined") {
        AOS.refresh();
      }
    }

    highlightText(text, query) {
      if (!query || !text) return text;
      const regex = new RegExp(`(${this.escapeRegExp(query)})`, "gi");
      return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    escapeRegExp(string) {
      return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    updateResultsCount() {
      if (!this.resultsCount) return;
      const count = this.filteredPosts.length;
      const query = (this.searchInput.value || "").trim();

      if (query === "" && (this.categoryFilter?.value || "") === "") {
        this.resultsCount.textContent = `Showing all ${count} posts`;
      } else if (query !== "" && (this.categoryFilter?.value || "") !== "") {
        this.resultsCount.textContent = `Found ${count} posts matching "${query}" in ${
          this.categoryFilter.options[this.categoryFilter.selectedIndex].text
        }`;
      } else if (query !== "") {
        this.resultsCount.textContent = `Found ${count} posts matching "${query}"`;
      } else {
        this.resultsCount.textContent = `Showing ${count} posts in ${
          this.categoryFilter.options[this.categoryFilter.selectedIndex].text
        }`;
      }
    }

    toggleClearButton() {
      const hasQuery = (this.searchInput.value || "").trim() !== "";
      setHidden(this.clearButton, !hasQuery);
    }

    toggleSuggestions() {
      if (!this.suggestions) return;
      const hasQuery = (this.searchInput.value || "").trim() !== "";
      const hasResults = this.filteredPosts.length > 0;
      this.suggestions.style.display =
        !hasQuery && hasResults ? "block" : "none";
    }

    clearSearch() {
      if (!this.searchInput) return;
      this.searchInput.value = "";
      if (this.categoryFilter) this.categoryFilter.value = "";
      this.filteredPosts = [...this.posts];
      this.applySort();
      this.updateUI();

      const url = new URL(window.location);
      url.searchParams.delete("q");
      url.searchParams.delete("category");
      window.history.replaceState({}, "", url);
    }
  }

  class ProjectSearch {
    constructor() {
      this.searchInput = document.getElementById("search-input");
      this.searchButton = document.getElementById("search-button");
      this.clearSearchBtn = document.getElementById("clear-search");
      this.categoryFilter = document.getElementById("category-filter");
      this.sortFilter = document.getElementById("sort-filter");
      this.searchResults = document.getElementById("search-results");
      this.noResults = document.getElementById("no-results");
      this.searchSuggestions = document.getElementById("search-suggestions");
      this.resultsCount = document.getElementById("search-results-count");

      this.currentResults = [];
      this.projects =
        getJSONData("project-search-data") || window.searchData || [];

      this.init();
    }

    init() {
      if (!this.searchInput) return;

      this.searchInput.addEventListener("input", () => this.performSearch());
      this.searchButton?.addEventListener("click", () => this.performSearch());
      this.categoryFilter?.addEventListener("change", () =>
        this.performSearch()
      );
      this.sortFilter?.addEventListener("change", () => this.performSearch());

      this.clearSearchBtn?.addEventListener("click", () => {
        this.searchInput.value = "";
        if (this.categoryFilter) this.categoryFilter.value = "";
        if (this.sortFilter) this.sortFilter.value = "order-asc";
        this.performSearch();
        setHidden(this.clearSearchBtn, true);
      });

      this.searchInput.addEventListener("input", () => {
        setHidden(this.clearSearchBtn, !this.searchInput.value);
      });

      document.querySelectorAll(".tag-suggestion").forEach((button) => {
        button.addEventListener("click", () => {
          const tech = button.getAttribute("data-tech");
          this.searchInput.value = tech;
          this.performSearch();
          setHidden(this.clearSearchBtn, false);
        });
      });

      document.addEventListener("click", (e) => {
        const card = e.target.closest(".project-card");
        if (card && !e.target.closest(".project-link")) {
          const viewDetailsLink = card.querySelector('a[href*="/projects/"]');
          if (viewDetailsLink) {
            window.location.href = viewDetailsLink.href;
          }
        }
      });

      this.performSearch();
    }

    performSearch() {
      const query = (this.searchInput.value || "").toLowerCase();
      const category = this.categoryFilter?.value || "";
      const sortBy = this.sortFilter?.value || "order-asc";

      this.currentResults = (this.projects || []).filter((project) => {
        const matchesQuery =
          !query ||
          project.title.toLowerCase().includes(query) ||
          (project.description || "").toLowerCase().includes(query) ||
          (project.technologies || []).some((tech) =>
            tech.toLowerCase().includes(query)
          ) ||
          (project.categories || []).some((cat) =>
            cat.toLowerCase().includes(query)
          );

        const matchesCategory =
          !category || (project.categories || []).some(
            cat => cat.toLowerCase() === category.toLowerCase()
          );
        return matchesQuery && matchesCategory;
      });

      this.currentResults.sort((a, b) => {
        switch (sortBy) {
          case "order-asc":
            return (a.order || 999) - (b.order || 999);
          case "title-asc":
            return (a.title || "").localeCompare(b.title || "");
          case "title-desc":
            return (b.title || "").localeCompare(a.title || "");
          case "date-desc":
            return new Date(b.date) - new Date(a.date);
          case "date-asc":
            return new Date(a.date) - new Date(b.date);
          default:
            return 0;
        }
      });

      this.displayResults();
    }

    displayResults() {
      if (!this.searchResults) return;

      if (this.currentResults.length === 0) {
        setHidden(this.searchResults, true);
        setHidden(this.noResults, false);
        if (this.searchSuggestions) setHidden(this.searchSuggestions, false);
        if (this.resultsCount)
          this.resultsCount.textContent = "No projects found";
        return;
      }

      setHidden(this.searchResults, false);
      setHidden(this.noResults, true);
      if (this.searchSuggestions) setHidden(this.searchSuggestions, true);
      if (this.resultsCount) {
        this.resultsCount.textContent = `${this.currentResults.length} project${
          this.currentResults.length !== 1 ? "s" : ""
        } found`;
      }

this.searchResults.innerHTML = this.currentResults
        .map(
          (project) => {
            const imageSrc = project.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop";
            return `
         <div class="project-card" data-category="${(
           project.categories || []
         ).join(" ")}">
           <img src="${imageSrc}" alt="${
           project.title
         }" class="project-card-image">
           <div class="project-card-content">
             <h3 class="project-card-title">${
               project.title
             }</h3>
             <p class="project-card-description">${
               project.description || ""
             }</p>
             <div class="project-card-tags">
               ${(project.technologies || [])
                 .map((tech) => `<span class="project-card-tag">${tech}</span>`)
                 .join("")}
             </div>
             <div class="project-card-links">
               <a href="${
                 project.url
               }" class="project-card-link"><i class="fas fa-info-circle"></i> View Details</a>
               ${
                 project.live_url
                   ? `<a href="${project.live_url}" class="project-card-link" target="_blank"><i class="fas fa-external-link-alt"></i> Live Demo</a>`
                   : ""
               }
               ${
                 project.github_url
                   ? `<a href="${project.github_url}" class="project-card-link" target="_blank"><i class="fab fa-github"></i> GitHub</a>`
                   : ""
               }
             </div>
           </div>
         </div>
       `;}
        )
        .join("");
    }
  }

   document.addEventListener("DOMContentLoaded", () => {
     if (hasBlogSearch()) new BlogSearch();
     if (hasProjectSearch()) new ProjectSearch();
     initCategoryFilters();
   });
 })();

 // Category Filter Tabs (for Blog and Projects index pages)
 class CategoryFilter {
   constructor(containerSelector, itemSelector, itemCategoryAttr) {
     this.container = document.querySelector(containerSelector);
     this.items = document.querySelectorAll(itemSelector);
     this.itemCategoryAttr = itemCategoryAttr;

     if (!this.container) return;

     this.filterButtons = this.container.querySelectorAll('.filter-btn');
     this.init();
   }

   init() {
     if (!this.container || this.filterButtons.length === 0) return;

     this.filterButtons.forEach((btn) => {
       btn.addEventListener('click', () => {
         // Update active state
         this.filterButtons.forEach(b => b.classList.remove('active'));
         btn.classList.add('active');

         const filterValue = btn.getAttribute('data-filter');
         this.filterItems(filterValue);
       });
     });
   }

   filterItems(filterValue) {
     this.items.forEach(item => {
       const itemCategories = item.getAttribute(this.itemCategoryAttr);
       const categories = itemCategories ? itemCategories.split(',').map(c => c.trim()).filter(c => c) : [];

       const shouldShow = filterValue === 'all' || categories.includes(filterValue);

       if (shouldShow) {
         item.style.display = '';
         // Re-trigger AOS animation for newly visible items
         if (typeof AOS !== 'undefined') {
           AOS.refresh();
         }
       } else {
         item.style.display = 'none';
       }
     });

     // Trigger a scroll event to handle any lazy animations
     window.dispatchEvent(new Event('scroll'));
   }
 }

 function initCategoryFilters() {
   // Blog page filter
   new CategoryFilter('.blog-filter', '.blog-card', 'data-category');

   // Projects page filter
   new CategoryFilter('.projects-filter', '.project-card', 'data-category');
 }
