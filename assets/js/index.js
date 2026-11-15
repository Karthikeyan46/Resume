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

// Called after the stats bar has been filled in from the records store
function initStatsCounter() {
    const statsEl = document.querySelector('.pub-stats');
    if (!statsEl || statsEl.dataset.counted) return;
    statsEl.dataset.counted = '1';

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statsEl.querySelectorAll('.pub-stat-num').forEach(el => {
                    const raw = el.textContent.trim();
                    const suffix = raw.includes('+') ? '+' : '';
                    const target = parseInt(raw.replace('+', ''), 10);
                    el.textContent = '0' + suffix;
                    animateCount(el, target, suffix);
                });
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });

    statsObserver.observe(statsEl);
}

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

/* ===========================================================================
   Public content — Publications + Certifications
   ---------------------------------------------------------------------------
   Both sections are rendered from ONE source: the `public_records` view in
   Supabase, which exposes only the rows you marked public in the vault.
   Nothing about publications or certificates is hard-coded in index.html any
   more, so there is no second list to keep in sync.

   The last successful fetch is cached in localStorage, so a returning visitor
   still sees content if the database is briefly unreachable.
   =========================================================================== */
(function () {
    'use strict';

    // If the console does not show this line, the browser is serving a cached
    // copy of index.js — hard-refresh with Ctrl+Shift+R.
    console.log('index.js build: data-driven 2026-08-05 | Supabase configured:',
        !!(window.SUPABASE_READY && window.SUPABASE_READY()));

    const CACHE_KEY = 'portfolio_records_v2';

    const PUB_SECTIONS = [
        { kind: 'book', title: 'Book Published', label: 'Book' },
        { kind: 'journal', title: 'Journals', label: 'Journals' },
        { kind: 'patent', title: 'Patent', label: 'Patent' },
        { kind: 'chapter', title: 'Book Chapters', label: 'Book Chapters' },
        { kind: 'conference', title: 'International Conferences', label: 'Conferences' }
    ];

    // Academic-activity types, shown together in the Certifications grid.
    // Order here is the order of the filter pills above the grid.
    const CERT_KINDS = [
        { kind: 'fdp', label: 'FDP', tag: 'FDP' },
        { kind: 'workshop', label: 'Workshops', tag: 'Workshop' },
        { kind: 'course', label: 'Courses', tag: 'Course' },
        { kind: 'certificate', label: 'Other', tag: 'Certificate' }
    ];

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    function bySort(a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
    }

    function renderPublications(records) {
        const box = document.getElementById('pub-container');
        if (!box) return;

        let html = '';
        PUB_SECTIONS.forEach(sec => {
            const items = records.filter(r => r.kind === sec.kind).sort(bySort);
            if (!items.length) return;

            const lis = items.map(r => {
                const tail = [r.venue, r.meta].filter(Boolean).join(', ');
                const titleHtml = r.link
                    ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.title)}</a>`
                    : esc(r.title);
                return `<li>${titleHtml}${tail ? ' — ' + esc(tail) + '.' : ''}</li>`;
            }).join('');

            html += `<details class="dropdown-item" data-section="${sec.kind}">` +
                `<summary>${esc(sec.title)}</summary>` +
                `<div class="dropdown-content"><ul>${lis}</ul></div></details>`;
        });

        box.innerHTML = html || '<p class="data-status">No publications listed yet.</p>';
        box.removeAttribute('data-loading');

        // re-apply whichever filter tab is currently active
        const active = document.querySelector('.pub-filter-btn.active');
        if (active) active.click();
    }

    function renderStats(records) {
        const bar = document.getElementById('pub-stats');
        if (!bar) return;
        bar.innerHTML = PUB_SECTIONS
            .map(sec => ({ sec, n: records.filter(r => r.kind === sec.kind).length }))
            .filter(x => x.n > 0)
            .sort((a, b) => b.n - a.n)
            .map(x => `<div class="pub-stat"><span class="pub-stat-num">${x.n}</span>` +
                `<span class="pub-stat-label">${esc(x.sec.label)}</span></div>`)
            .join('');
        initStatsCounter();
    }

    function renderCertifications(records) {
        const box = document.getElementById('cert-container');
        const pills = document.getElementById('cert-filters');
        const status = document.getElementById('cert-status');
        if (!box) return;

        const kinds = CERT_KINDS.map(c => c.kind);
        const items = records.filter(r => kinds.includes(r.kind))
            .sort((a, b) => kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || bySort(a, b));

        box.innerHTML = items.map(r => {
            const tag = (CERT_KINDS.find(c => c.kind === r.kind) || {}).tag || '';
            return '<div class="cert-card" data-kind="' + esc(r.kind) + '">' +
                `<div class="cert-icon">${esc(r.icon || '🏅')}</div>` +
                '<div class="cert-body">' +
                `<span class="cert-tag cert-tag--${esc(r.kind)}">${esc(tag)}</span>` +
                `<h4>${esc(r.title)}</h4>` +
                `<p>${esc([r.venue, r.meta, r.year].filter(Boolean).join(' · '))}</p>` +
                (r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener" class="pub-link">Verify →</a>` : '') +
                '</div></div>';
        }).join('');
        box.removeAttribute('data-loading');
        if (status) status.remove();

        // filter pills — only for the types that actually have entries
        if (pills) {
            const present = CERT_KINDS.filter(c => items.some(r => r.kind === c.kind));
            pills.innerHTML = present.length > 1
                ? '<button class="pub-filter-btn active" data-cert-filter="all">All</button>' +
                present.map(c => `<button class="pub-filter-btn" data-cert-filter="${c.kind}">${esc(c.label)}</button>`).join('')
                : '';
        }
    }

    // one delegated listener, survives every re-render
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cert-filter]');
        if (!btn) return;
        btn.parentElement.querySelectorAll('.pub-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.certFilter;
        document.querySelectorAll('#cert-container .cert-card').forEach(card => {
            card.style.display = (f === 'all' || card.dataset.kind === f) ? '' : 'none';
        });
    });

    function renderMemberships(records) {
        const box = document.getElementById('membership-container');
        if (!box) return;
        const items = records.filter(r => r.kind === 'membership').sort(bySort);
        if (!items.length) { box.closest('section').hidden = true; return; }
        box.closest('section').hidden = false;

        box.innerHTML = items.map(r => (
            '<div class="prof-body-card">' +
            (r.image_url ? `<img src="${esc(r.image_url)}" alt="${esc(r.title)} Logo" loading="lazy">` : '') +
            '<div class="prof-body-info">' +
            `<h4>${esc(r.title)}</h4>` +
            `<p>${esc(r.venue || '')}</p>` +
            (r.meta ? `<span class="prof-id">${esc(r.meta)}</span>` : '') +
            '</div></div>'
        )).join('');
        box.removeAttribute('data-loading');
    }

    function renderRoles(records) {
        const box = document.getElementById('roles-container');
        if (!box) return;
        const items = records.filter(r => r.kind === 'role').sort(bySort);
        if (!items.length) { box.closest('.card').hidden = true; return; }
        box.closest('.card').hidden = false;

        box.innerHTML = items.map(r => (
            '<li><span class="role-dot"></span>' +
            `<span>${esc(r.title)}${r.meta ? ' (' + esc(r.meta) + ')' : ''}</span></li>`
        )).join('');
        box.removeAttribute('data-loading');
    }

    function renderAll(records) {
        renderStats(records);
        renderPublications(records);
        renderCertifications(records);
        renderMemberships(records);
        renderRoles(records);
        // let the scroll-reveal observer pick up freshly injected blocks
        document.querySelectorAll('.reveal:not(.active)').forEach(el => observer.observe(el));
    }

    function failed(message) {
        const pubStatus = document.getElementById('pub-status');
        const certStatus = document.getElementById('cert-status');
        if (pubStatus) pubStatus.textContent = message;
        if (certStatus) certStatus.textContent = message;
    }

    // Local preview: when the site is served from localhost without a Supabase
    // project connected, fall back to the generated seed snapshot so the page
    // is not blank. Never runs on the deployed site.
    const IS_LOCAL = ['localhost', '127.0.0.1', '0.0.0.0', '::1', ''].includes(location.hostname);

    function loadPreviewData() {
        return new Promise(resolve => {
            if (window.PREVIEW_RECORDS) return resolve(window.PREVIEW_RECORDS);
            const s = document.createElement('script');
            s.src = 'assets/js/preview-data.js';
            s.onload = () => resolve(window.PREVIEW_RECORDS || null);
            s.onerror = () => resolve(null);
            document.head.appendChild(s);
        });
    }

    function previewBanner() {
        if (document.getElementById('preview-banner')) return;
        const bar = document.createElement('div');
        bar.id = 'preview-banner';
        bar.textContent = 'Local preview — showing seed data. Connect Supabase (SETUP.md) for live content.';
        document.body.appendChild(bar);
    }

    async function load() {
        // 1. paint from cache instantly if we have one
        let cached = null;
        try {
            cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        } catch (e) { /* ignore corrupt cache */ }
        if (cached && Array.isArray(cached.records) && cached.records.length) {
            renderAll(cached.records);
        }

        if (!window.SUPABASE_READY || !window.SUPABASE_READY() || !window.supabase) {
            if (IS_LOCAL) {
                const preview = await loadPreviewData();
                if (preview && preview.length) {
                    renderAll(preview);
                    previewBanner();
                    return;
                }
            }
            if (!cached) failed('Content store not configured yet — see SETUP.md.');
            return;
        }

        // 2. refresh from the single source of truth
        try {
            const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            const { data, error } = await db.from('public_records').select('*');
            if (error) throw error;
            if (!data) throw new Error('empty response');

            renderAll(data);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), records: data }));
        } catch (err) {
            console.error('records fetch failed:', err);
            if (!cached) failed('Content is temporarily unavailable. Please try again shortly.');
        }
    }

    load();
})();

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
