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

// Publication filter
document.querySelectorAll('.pub-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pub-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.pub-card').forEach(card => {
            card.classList.toggle('hidden', filter !== 'all' && card.dataset.type !== filter);
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
