/* ===========================================================================
   Prof. Karthikeyan S. — Academic Portfolio Script
   Features:
   - Interactive Smooth Cursor Motion & Follower Ring
   - Real-time Card Spotlight Cursor Reflection
   - Hero Parallax Ambient Movement
   - Instant Publication Category Filtering & Live Search
   - Real-time Sync from Supabase with Bundled Seed Fallback
   =========================================================================== */

(function () {
    'use strict';

    /* =======================================================================
       1. Interactive Cursor Motion & Mouse Follower
       ======================================================================= */
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (isFinePointer) {
        const dot = document.createElement('div');
        dot.className = 'cursor-dot';
        const ring = document.createElement('div');
        ring.className = 'cursor-ring';
        document.body.appendChild(dot);
        document.body.appendChild(ring);

        let mouseX = -100, mouseY = -100;
        let ringX = -100, ringY = -100;
        let isMoving = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

            if (!isMoving) {
                isMoving = true;
                dot.style.opacity = '1';
                ring.style.opacity = '1';
            }
        }, { passive: true });

        // Physics-based smooth spring follow loop
        function renderCursor() {
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
            requestAnimationFrame(renderCursor);
        }
        requestAnimationFrame(renderCursor);

        // Hover expansion on interactive nodes
        const interactiveSelector = 'a, button, input, select, textarea, .pub-pill-btn, .spotlight-card, .course-chip, summary';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(interactiveSelector)) {
                ring.classList.add('cursor-active');
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(interactiveSelector)) {
                ring.classList.remove('cursor-active');
            }
        });

        document.addEventListener('mouseleave', () => {
            dot.style.opacity = '0';
            ring.style.opacity = '0';
            isMoving = false;
        });
    }

    /* =======================================================================
       2. Dynamic Card Spotlight & Hero Ambient Motion
       ======================================================================= */
    function initCardSpotlights() {
        document.querySelectorAll('.spotlight-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }, { passive: true });
        });
    }

    // Hero subtle parallax on mouse move
    const hero = document.getElementById('home');
    if (hero) {
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            hero.style.setProperty('--cursor-x', x);
            hero.style.setProperty('--cursor-y', y);
        }, { passive: true });
    }

    /* =======================================================================
       3. Navigation, Scroll Reveal & Smooth Scrolling
       ======================================================================= */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar && navbar.classList.add('scrolled');
        } else {
            navbar && navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // Mobile nav drawer
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
        navMenu.querySelectorAll('.nav-links a').forEach(a => {
            a.addEventListener('click', () => navMenu.classList.remove('open'));
        });
    }

    // Scroll reveal observer
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    function initReveal() {
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#!') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navH = navbar ? navbar.offsetHeight : 70;
                const top = target.getBoundingClientRect().top + window.pageYOffset - navH;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // Floating back to top button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.pointerEvents = 'auto';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.pointerEvents = 'none';
            }
        }, { passive: true });

        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* =======================================================================
       4. Data Layer — Publications, Certifications & Memberships
       ======================================================================= */
    const CACHE_KEY = 'portfolio_records_v4';
    let ALL_RECORDS = [];
    let currentPubFilter = 'all';
    let currentSearchTerm = '';

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    const PUB_KINDS = ['journal', 'conference', 'chapter', 'book', 'patent'];
    const KIND_LABELS = {
        journal: 'Journal Paper',
        conference: 'Conference Proceeding',
        chapter: 'Book Chapter',
        book: 'Authored Book',
        patent: 'Intellectual Property Patent',
        fdp: 'Faculty Development Program',
        workshop: 'Workshop',
        course: 'Professional Certification',
        membership: 'Academic Society',
        role: 'Institutional Role'
    };

    function highlightAuthor(text) {
        if (!text) return '<strong class="author-highlight">Karthikeyan S.</strong>';
        return text.replace(/(Karthikeyan(\s+S\.?|\s+Selvaraj)?|Selvaraj\s+Karthikeyan)/gi, '<strong class="author-highlight">$1</strong>');
    }

    /* ------------------------------------------------ Publications Rendering */
    function renderPublications() {
        const list = document.getElementById('pub-list');
        const countBox = document.getElementById('pub-count-label');
        if (!list) return;

        let items = ALL_RECORDS.filter(r => PUB_KINDS.includes(r.kind));

        if (currentPubFilter !== 'all') {
            items = items.filter(r => r.kind === currentPubFilter);
        }

        if (currentSearchTerm.trim()) {
            const q = currentSearchTerm.toLowerCase();
            items = items.filter(r => 
                (r.title && r.title.toLowerCase().includes(q)) ||
                (r.venue && r.venue.toLowerCase().includes(q)) ||
                (r.meta && r.meta.toLowerCase().includes(q)) ||
                (r.year && String(r.year).includes(q))
            );
        }

        items.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.sort_order || 0) - (b.sort_order || 0));

        if (countBox) {
            countBox.textContent = `Showing ${items.length} of ${ALL_RECORDS.filter(r => PUB_KINDS.includes(r.kind)).length} scholarly contributions`;
        }

        if (!items.length) {
            list.innerHTML = `
                <div style="padding: 3.5rem 2rem; text-align: center; color: var(--muted);">
                    <p style="font-size: 1.1rem; margin-bottom: 0.75rem;">No publications matching "<strong>${esc(currentSearchTerm)}</strong>".</p>
                    <button class="btn btn-secondary btn-sm" id="reset-pub-search">Clear Search Filter</button>
                </div>`;
            const resetBtn = document.getElementById('reset-pub-search');
            if (resetBtn) resetBtn.addEventListener('click', () => {
                const input = document.getElementById('pub-search');
                if (input) input.value = '';
                currentSearchTerm = '';
                renderPublications();
            });
            return;
        }

        list.innerHTML = items.map(r => {
            const yearDisplay = r.year ? esc(r.year) : (r.kind === 'patent' ? '2021' : 'Pub');
            const kindBadge = `<span class="pub-badge pub-badge--${esc(r.kind)}">${esc(KIND_LABELS[r.kind] || r.kind)}</span>`;
            
            const linkHtml = r.link ? `
                <a href="${esc(r.link)}" target="_blank" rel="noopener noreferrer" class="pub-doi-btn">
                    ${r.kind === 'book' ? 'Amazon Listing ↗' : 'View Publication ↗'}
                </a>` : '';

            const venueHtml = r.venue ? `<p class="pub-item-venue">${esc(r.venue)}</p>` : '';
            const metaHtml = r.meta ? `<span style="font-size: 0.8rem; color: var(--muted); margin-left: 0.4rem;">(${esc(r.meta)})</span>` : '';

            return `
                <div class="pub-item" data-kind="${esc(r.kind)}">
                    <div class="pub-year-col">${yearDisplay}</div>
                    <div class="pub-content-col">
                        <h4 class="pub-item-title">
                            ${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title)}
                        </h4>
                        <p class="pub-item-authors">
                            ${highlightAuthor(r.authors || 'Karthikeyan S.')}
                        </p>
                        ${venueHtml}
                        <div class="pub-item-actions">
                            ${kindBadge}
                            ${metaHtml}
                            ${linkHtml}
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    function initPubToolbar() {
        const pillsContainer = document.getElementById('pub-pills');
        if (pillsContainer) {
            const totalPubs = ALL_RECORDS.filter(r => PUB_KINDS.includes(r.kind)).length;
            const journalsCount = ALL_RECORDS.filter(r => r.kind === 'journal').length;
            const confCount = ALL_RECORDS.filter(r => r.kind === 'conference').length;
            const chapCount = ALL_RECORDS.filter(r => r.kind === 'chapter').length;
            const bookCount = ALL_RECORDS.filter(r => r.kind === 'book').length;
            const patentCount = ALL_RECORDS.filter(r => r.kind === 'patent').length;

            pillsContainer.innerHTML = `
                <button class="pub-pill-btn active" data-pub-filter="all">All <span class="pub-pill-count">(${totalPubs})</span></button>
                <button class="pub-pill-btn" data-pub-filter="journal">Journals <span class="pub-pill-count">(${journalsCount})</span></button>
                <button class="pub-pill-btn" data-pub-filter="conference">Conferences <span class="pub-pill-count">(${confCount})</span></button>
                <button class="pub-pill-btn" data-pub-filter="chapter">Book Chapters <span class="pub-pill-count">(${chapCount})</span></button>
                <button class="pub-pill-btn" data-pub-filter="book">Books <span class="pub-pill-count">(${bookCount})</span></button>
                <button class="pub-pill-btn" data-pub-filter="patent">Patents <span class="pub-pill-count">(${patentCount})</span></button>
            `;

            pillsContainer.querySelectorAll('.pub-pill-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    pillsContainer.querySelectorAll('.pub-pill-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentPubFilter = btn.dataset.pubFilter;
                    renderPublications();
                });
            });
        }

        const searchInput = document.getElementById('pub-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    currentSearchTerm = e.target.value;
                    renderPublications();
                }, 150);
            });
        }
    }

    /* ------------------------------------------------ Certifications Rendering */
    function renderCertifications() {
        const box = document.getElementById('cert-container');
        if (!box) return;

        const certKinds = ['fdp', 'workshop', 'course', 'certificate'];
        const items = ALL_RECORDS.filter(r => certKinds.includes(r.kind));
        if (!items.length) return;

        box.innerHTML = items.map(r => `
            <div class="cert-card spotlight-card">
                <div class="cert-icon">${esc(r.icon || '🏅')}</div>
                <div class="cert-body">
                    <span class="cert-tag">${esc(r.kind === 'fdp' ? 'Faculty Development' : r.kind)}</span>
                    <h4>${esc(r.title)}</h4>
                    <p>${esc([r.venue, r.meta, r.year].filter(Boolean).join(' · '))}</p>
                    ${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener noreferrer" style="font-size: 0.82rem; font-weight: 700; color: var(--primary); margin-top: 0.25rem; display: inline-block;">Verify Credential →</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    /* ------------------------------------------------ Memberships Rendering */
    function renderMemberships() {
        const box = document.getElementById('membership-container');
        if (!box) return;

        const items = ALL_RECORDS.filter(r => r.kind === 'membership');
        if (!items.length) return;

        box.innerHTML = items.map(r => `
            <div class="membership-card spotlight-card">
                ${r.image_url ? `<img src="${esc(r.image_url)}" alt="${esc(r.title)} Logo" class="membership-logo" loading="lazy">` : ''}
                <div class="membership-info">
                    <h4>${esc(r.title)}</h4>
                    <p>${esc(r.venue || 'Professional Computing Society')}</p>
                    ${r.meta ? `<span class="membership-id">${esc(r.meta)}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    function updateHeroStats() {
        const pubCountEl = document.getElementById('hero-pub-count');
        const pubTotal = ALL_RECORDS.filter(r => PUB_KINDS.includes(r.kind)).length;
        if (pubCountEl && pubTotal) {
            pubCountEl.textContent = `${pubTotal}+`;
        }
    }

    function renderAll() {
        initPubToolbar();
        renderPublications();
        renderCertifications();
        renderMemberships();
        updateHeroStats();
        initReveal();
        initCardSpotlights();
    }

    /* ------------------------------------------------ Data Fetching */
    async function loadData() {
        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (cached && Array.isArray(cached.records) && cached.records.length) {
                ALL_RECORDS = cached.records;
                renderAll();
            }
        } catch (e) { /* ignore cache parse error */ }

        if (!ALL_RECORDS.length && window.PREVIEW_RECORDS && Array.isArray(window.PREVIEW_RECORDS)) {
            ALL_RECORDS = window.PREVIEW_RECORDS;
            renderAll();
        }

        if (window.SUPABASE_READY && window.SUPABASE_READY() && window.supabase) {
            try {
                const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                const { data, error } = await client.from('public_records').select('*');
                if (!error && data && data.length) {
                    ALL_RECORDS = data;
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), records: data }));
                    renderAll();
                }
            } catch (err) {
                console.warn('Supabase sync notice:', err.message || err);
            }
        }
    }

    loadData();
})();
