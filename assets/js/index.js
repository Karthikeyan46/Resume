/* ===========================================================================
   Academic Portfolio Script — Inspired by aanchalvij.com
   - Editorial scholarly presentation
   - Real-time client-side publication filtering & live search
   - Seamless data sync from Supabase with instant fallback to bundled preview data
   =========================================================================== */

(function () {
    'use strict';

    // Sticky Navbar shadow on scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar && navbar.classList.add('scrolled');
        } else {
            navbar && navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
        // Close menu on link click
        navMenu.querySelectorAll('.nav-links a').forEach(a => {
            a.addEventListener('click', () => {
                navMenu.classList.remove('open');
            });
        });
    }

    // Scroll-reveal animations
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
    initReveal();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#!') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navH = navbar ? navbar.offsetHeight : 68;
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
       Data Layer — Supabase + Bundled Preview Records Fallback
       ======================================================================= */
    const CACHE_KEY = 'portfolio_records_v3';
    let ALL_RECORDS = [];
    let currentPubFilter = 'all';
    let currentSearchTerm = '';

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    const PUB_KINDS = ['journal', 'conference', 'chapter', 'book', 'patent'];
    const KIND_LABELS = {
        journal: 'Journal',
        conference: 'Conference',
        chapter: 'Book Chapter',
        book: 'Book',
        patent: 'Patent',
        fdp: 'Faculty Development',
        workshop: 'Workshop',
        course: 'Certification Course',
        membership: 'Membership',
        role: 'Role'
    };

    function highlightAuthor(text) {
        if (!text) return '<strong>Karthikeyan S.</strong>';
        return text.replace(/(Karthikeyan(\s+S\.?|\s+Selvaraj)?|Selvaraj\s+Karthikeyan)/gi, '<strong class="author-highlight">$1</strong>');
    }

    /* ------------------------------------------------ Publications Rendering */
    function renderPublications() {
        const list = document.getElementById('pub-list');
        const countBox = document.getElementById('pub-count-label');
        if (!list) return;

        // Filter by kind
        let items = ALL_RECORDS.filter(r => PUB_KINDS.includes(r.kind));

        if (currentPubFilter !== 'all') {
            items = items.filter(r => r.kind === currentPubFilter);
        }

        // Filter by search query
        if (currentSearchTerm.trim()) {
            const q = currentSearchTerm.toLowerCase();
            items = items.filter(r => 
                (r.title && r.title.toLowerCase().includes(q)) ||
                (r.venue && r.venue.toLowerCase().includes(q)) ||
                (r.meta && r.meta.toLowerCase().includes(q)) ||
                (r.year && String(r.year).includes(q))
            );
        }

        // Sort by year descending, then sort_order
        items.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.sort_order || 0) - (b.sort_order || 0));

        if (countBox) {
            countBox.textContent = `Showing ${items.length} of ${ALL_RECORDS.filter(r => PUB_KINDS.includes(r.kind)).length} scholarly works`;
        }

        if (!items.length) {
            list.innerHTML = `
                <div style="padding: 3rem 2rem; text-align: center; color: var(--muted);">
                    <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No publications matching "<strong>${esc(currentSearchTerm)}</strong>".</p>
                    <button class="btn btn-secondary btn-sm" id="reset-pub-search" style="margin-top: 0.5rem;">Clear search</button>
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
                    ${r.kind === 'book' ? 'Amazon ↗' : 'View Paper ↗'}
                </a>` : '';

            const venueHtml = r.venue ? `<p class="pub-item-venue">${esc(r.venue)}</p>` : '';
            const metaHtml = r.meta ? `<span style="font-size: 0.8rem; color: var(--muted); margin-left: 0.5rem;">(${esc(r.meta)})</span>` : '';

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
        // Pill Buttons
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

        // Search Input
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
            <div class="cert-card">
                <div class="cert-icon">${esc(r.icon || '🏅')}</div>
                <div class="cert-body">
                    <span class="cert-tag">${esc(r.kind === 'fdp' ? 'Faculty Development' : r.kind)}</span>
                    <h4>${esc(r.title)}</h4>
                    <p>${esc([r.venue, r.meta, r.year].filter(Boolean).join(' · '))}</p>
                    ${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener noreferrer" style="font-size: 0.82rem; font-weight: 600; color: var(--teal); margin-top: 0.25rem; display: inline-block;">Verify Certificate →</a>` : ''}
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
            <div class="membership-card">
                ${r.image_url ? `<img src="${esc(r.image_url)}" alt="${esc(r.title)} Logo" class="membership-logo" loading="lazy">` : ''}
                <div class="membership-info">
                    <h4>${esc(r.title)}</h4>
                    <p>${esc(r.venue || 'Professional Academic Society')}</p>
                    ${r.meta ? `<span class="membership-id">${esc(r.meta)}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    /* ------------------------------------------------ Hero Stats Rendering */
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
    }

    /* ------------------------------------------------ Data Fetching */
    async function loadData() {
        // 1. Try local cache
        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (cached && Array.isArray(cached.records) && cached.records.length) {
                ALL_RECORDS = cached.records;
                renderAll();
            }
        } catch (e) { /* ignore cache errors */ }

        // 2. Fallback to bundled preview data if not populated yet
        if (!ALL_RECORDS.length && window.PREVIEW_RECORDS && Array.isArray(window.PREVIEW_RECORDS)) {
            ALL_RECORDS = window.PREVIEW_RECORDS;
            renderAll();
        }

        // 3. Sync live from Supabase if configured
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
