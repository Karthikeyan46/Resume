// Sticky Navbar effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Scroll Reveal Animation
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Count-up animation for pub stats
function animateCount(el, target, suffix) {
    let start = 0;
    const duration = 1500;
    const step = 16;
    const increment = target / (duration / step);

    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            start = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(start) + suffix;
    }, step);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            document.querySelectorAll('.pub-stat-num').forEach(el => {
                const raw = el.textContent.trim();
                const suffix = raw.includes('+') ? '+' : '';
                const target = parseInt(raw.replace('+', ''));
                el.textContent = '0' + suffix;
                animateCount(el, target, suffix);
            });
            statsObserver.disconnect();
        }
    });
}, { threshold: 0.3 });

const statsEl = document.querySelector('.pub-stats');
if (statsEl) statsObserver.observe(statsEl);

// Publication filter tabs → show/hide accordion sections
document.querySelectorAll('.pub-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pub-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
            if (filter === 'all' || item.dataset.section === filter) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Smooth navigation for hash links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80, // Offset for sticky nav
                behavior: 'smooth'
            });
        }
    });
});
