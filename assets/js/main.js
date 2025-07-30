// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100,
    disable: 'mobile' // Disable AOS on mobile to prevent conflicts
});

// Typed.js initialization
// Get typed strings from Jekyll data (injected via window.typedStrings) or use fallback
const typedStrings = window.typedStrings && window.typedStrings.length > 0 ? window.typedStrings : [
    'Full-Stack Developer',
    'Problem Solver',
    'Tech Enthusiast',
    'Creative Thinker'
];

const typed = new Typed('#typed-text', {
    strings: typedStrings,
    typeSpeed: 100,
    backSpeed: 60,
    backDelay: 2000,
    loop: true
});

// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle.querySelector('i');

// Check for saved theme preference or default to light
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

if (currentTheme === 'dark') {
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Toggle icon
    if (newTheme === 'dark') {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
});

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const icon = mobileMenuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

// Smooth Scrolling Navigation
const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
        
        // Close mobile menu if open
        navMenu.classList.remove('active');
        const mobileIcon = mobileMenuToggle.querySelector('i');
        mobileIcon.classList.add('fa-bars');
        mobileIcon.classList.remove('fa-times');
    });
});

// Active Navigation Highlighting
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Animated Counters
const animateCounters = () => {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
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
    const skillBars = document.querySelectorAll('.skill-progress');
    
    skillBars.forEach((bar, index) => {
        const width = bar.getAttribute('data-width');
        // Stagger the animations slightly
        setTimeout(() => {
            bar.style.width = width + '%';
        }, index * 100);
    });
};

// Check if element is in viewport
const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

// Intersection Observer for animations with mobile-friendly settings
const observerOptions = {
    threshold: 0.1, // Lower threshold for mobile
    rootMargin: '0px 0px -50px 0px' // Smaller margin for mobile
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.id === 'about') {
                // Add a small delay for mobile devices
                const delay = window.innerWidth <= 768 ? 100 : 500;
                setTimeout(animateCounters, delay);
            }
            if (entry.target.id === 'skills') {
                // Add a small delay for mobile devices
                const delay = window.innerWidth <= 768 ? 100 : 500;
                setTimeout(animateSkillBars, delay);
            }
        }
    });
}, observerOptions);

// Observe sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Fallback for mobile devices - trigger animations on scroll
let aboutAnimated = false;
let skillsAnimated = false;

const handleScroll = () => {
    const aboutSection = document.getElementById('about');
    const skillsSection = document.getElementById('skills');
    
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
window.addEventListener('scroll', handleScroll);

// Add touch event listener for mobile devices
window.addEventListener('touchstart', handleScroll);
window.addEventListener('touchmove', handleScroll);

// Trigger animations on page load if sections are already visible
window.addEventListener('load', () => {
    const aboutSection = document.getElementById('about');
    const skillsSection = document.getElementById('skills');
    
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
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');
        
        // Update active filter button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Filter projects
        projectCards.forEach(card => {
            const categories = card.getAttribute('data-category');
            
            if (filter === 'all' || (categories && categories.toLowerCase().includes(filter.toLowerCase()))) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Project Card Click Handlers
projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking on links
        if (e.target.closest('.project-link')) {
            return;
        }
        
        // Get the project URL from data attribute
        const projectUrl = card.getAttribute('data-project-url');
        
        if (projectUrl) {
            // Navigate to the project page
            window.location.href = projectUrl;
        } else {
            // Fallback to live demo or GitHub if no project page exists
            const liveLink = card.querySelector('a[href*="demo"]');
            const githubLink = card.querySelector('a[href*="github"]');
            
            if (liveLink) {
                window.open(liveLink.href, '_blank');
            } else if (githubLink) {
                window.open(githubLink.href, '_blank');
            }
        }
    });
});

// Blog Card Click Handlers
const blogCards = document.querySelectorAll('.blog-card');
blogCards.forEach(card => {
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking on the read more link
        if (e.target.closest('.blog-read-more')) {
            return;
        }
        
        // Find the read more link and navigate to it
        const readMoreLink = card.querySelector('.blog-read-more');
        if (readMoreLink) {
            window.location.href = readMoreLink.href;
        }
    });
});

// Back to Top Button
const backToTopButton = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Particle Animation (Simple)
const createParticles = () => {
    const particlesContainer = document.querySelector('.particles-container');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'var(--primary-color)';
        particle.style.borderRadius = '50%';
        particle.style.opacity = Math.random() * 0.5 + 0.2;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`;
        
        particlesContainer.appendChild(particle);
    }
};

// Initialize particles
createParticles();

// Smooth loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
}); 