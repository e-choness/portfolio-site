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

// Project Filtering
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.getAttribute("data-filter");

    // Update active filter button
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Filter projects
    projectCards.forEach((card) => {
      const categories = card.getAttribute("data-category");

      if (
        filter === "all" ||
        (categories && categories.toLowerCase().includes(filter.toLowerCase()))
      ) {
        card.style.display = "block";
        card.style.animation = "fadeIn 0.5s ease forwards";
      } else {
        card.style.display = "none";
      }
    });
  });
});

// Project Card Click Handlers
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

// Particle Animation (Simple)
const createParticles = () => {
  const particlesContainer = document.querySelector(".particles-container");
  if (!particlesContainer) return;
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = Math.random() * 4 + 2 + "px";
    particle.style.height = particle.style.width;
    particle.style.background = "var(--primary-color)";
    particle.style.borderRadius = "50%";
    particle.style.opacity = Math.random() * 0.5 + 0.2;
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.animation = `float ${
      Math.random() * 10 + 10
    }s linear infinite`;

    particlesContainer.appendChild(particle);
  }
};

// Initialize particles
createParticles();

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
      this.displayResults(this.posts);
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

        return searchFields.includes(query);
      });

      this.applyFilters();
      this.updateUI(query);
    }

    handleFilter() {
      const category = this.categoryFilter?.value || "";

      if (category === "") {
        this.filteredPosts = [...this.posts];
      } else {
        this.filteredPosts = this.posts.filter(
          (post) => post.category === category
        );
      }

      const query = (this.searchInput.value || "").trim();
      if (query !== "") {
        this.handleSearch();
        return;
      }

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
          const imageSrc =
            post.image ||
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop";

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
          !category || (project.categories || []).includes(category);
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
        setHidden(this.searchSuggestions, false);
        if (this.resultsCount)
          this.resultsCount.textContent = "No projects found";
        return;
      }

      setHidden(this.searchResults, false);
      setHidden(this.noResults, true);
      setHidden(this.searchSuggestions, true);
      if (this.resultsCount) {
        this.resultsCount.textContent = `${this.currentResults.length} project${
          this.currentResults.length !== 1 ? "s" : ""
        } found`;
      }

      this.searchResults.innerHTML = this.currentResults
        .map(
          (project) => `
        <div class="project-card" data-category="${(
          project.categories || []
        ).join(" ")}">
          <img src="${project.image}" alt="${
            project.title
          }" class="project-image">
          <div class="project-content">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tags">
              ${(project.technologies || [])
                .map((tech) => `<span class="project-tag">${tech}</span>`)
                .join("")}
            </div>
            <div class="project-links">
              <a href="${
                project.url
              }" class="project-link"><i class="fas fa-info-circle"></i> View Details</a>
              ${
                project.live_url
                  ? `<a href="${project.live_url}" class="project-link" target="_blank"><i class="fas fa-external-link-alt"></i> Live Demo</a>`
                  : ""
              }
              ${
                project.github_url
                  ? `<a href="${project.github_url}" class="project-link" target="_blank"><i class="fab fa-github"></i> GitHub</a>`
                  : ""
              }
            </div>
          </div>
        </div>
      `
        )
        .join("");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (hasBlogSearch()) new BlogSearch();
    if (hasProjectSearch()) new ProjectSearch();
  });
})();
