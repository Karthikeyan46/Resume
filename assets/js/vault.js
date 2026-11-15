/* ===========================================================================
   Private vault — auth, file storage, record management.
   One record per item; the same row feeds the public portfolio when
   is_public = true. Files live in a private bucket and are only ever handed
   out as short-lived signed URLs.
   =========================================================================== */

(function () {
    'use strict';

    // Bump when this file changes. If the console does not show the version you
    // expect, the browser is serving a cached copy — hard-refresh (Ctrl+Shift+R).
    var VAULT_BUILD = 'folder-view 2026-08-05';
    console.log('vault.js build:', VAULT_BUILD);

    if (!window.SUPABASE_READY || !window.SUPABASE_READY()) {
        document.body.innerHTML =
            '<div style="max-width:640px;margin:8rem auto;padding:2rem;font-family:Inter,sans-serif;' +
            'color:#f8fafc;background:#1e293b;border-radius:16px;line-height:1.7">' +
            '<h2>Vault not configured yet</h2><p>Open <code>supabase-config.js</code> and paste your ' +
            'Supabase Project URL and anon key. Full steps are in <code>SETUP.md</code>.</p></div>';
        return;
    }

    var db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    var KIND_LABEL = {
        fdp: 'FDP', workshop: 'Workshop', course: 'Course', certificate: 'Certificate',
        journal: 'Journal', conference: 'Conference', chapter: 'Book chapter',
        book: 'Book', patent: 'Patent',
        membership: 'Membership', role: 'Institutional role',
        education: 'Education', employment: 'Employment', teaching: 'Teaching material',
        misc: 'Miscellaneous', other: 'Other'
    };
    var DEFAULT_ICON = {
        fdp: '🧑‍🏫', workshop: '🛠️', course: '💻', certificate: '🏅',
        journal: '📗', conference: '🎤', chapter: '📘', book: '📕', patent: '🔖',
        membership: '🎫', role: '📌',
        education: '🎓', employment: '📜', teaching: '📝', misc: '🗂️', other: '📄'
    };

    // Kinds the database will accept as public (mirrors the check constraint
    // `publishable_kinds_only` in db/schema.sql). Everything else is vault-only.
    var PUBLISHABLE = ['journal', 'conference', 'chapter', 'book', 'patent',
        'fdp', 'workshop', 'course', 'certificate', 'membership', 'role'];
    function canPublish(kind) { return PUBLISHABLE.indexOf(kind) !== -1; }

    // Folder view: four bands, each holding the types that belong to it.
    var BANDS = [
        {
            title: 'Academic activity', note: 'FDPs, workshops and courses you attended',
            kinds: ['fdp', 'workshop', 'course', 'certificate']
        },
        {
            title: 'Research output', note: 'Published work',
            kinds: ['journal', 'conference', 'chapter', 'book', 'patent']
        },
        {
            title: 'Standing & service', note: 'Societies and institutional duties',
            kinds: ['membership', 'role']
        },
        {
            title: 'Private records', note: 'Never published — yours alone',
            kinds: ['education', 'employment', 'teaching', 'misc', 'other']
        }
    ];
    var FOLDER_NAME = {
        fdp: 'FDP', workshop: 'Workshops', course: 'Courses', certificate: 'Certificates',
        journal: 'Journals', conference: 'Conferences', chapter: 'Book chapters',
        book: 'Books', patent: 'Patents',
        membership: 'Memberships', role: 'Institutional roles',
        education: 'Degree certificates', employment: 'Employment letters',
        teaching: 'Teaching material', misc: 'Miscellaneous', other: 'Other'
    };

    var $ = function (id) { return document.getElementById(id); };

    // view: 'folders' | 'records'.  folder: a kind, or 'all' for everything.
    var state = { user: null, records: [], view: 'folders', folder: 'all' };

    /* ---------------------------------------------------------------- utils */
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function say(el, text, kind) {
        el.textContent = text || '';
        el.className = 'msg' + (kind ? ' msg-' + kind : '');
        if (text && kind === 'ok') setTimeout(function () { if (el.textContent === text) el.textContent = ''; }, 4000);
    }
    function humanSize(bytes) {
        if (!bytes) return '';
        var u = ['B', 'KB', 'MB', 'GB'], i = 0, n = bytes;
        while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
        return (n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)) + ' ' + u[i];
    }
    function safeName(name) {
        return name.replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, '_').slice(-90);
    }
    function titleFromFile(name) {
        return name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    /* ----------------------------------------------------------------- auth */
    function showLogin() { $('login-view').hidden = false; $('app-view').hidden = true; }
    function showApp() { $('login-view').hidden = true; $('app-view').hidden = false; }

    $('login-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var btn = $('login-btn');
        btn.disabled = true;
        say($('login-msg'), 'Signing in…');
        var res = await db.auth.signInWithPassword({
            email: $('email').value.trim(), password: $('password').value
        });
        btn.disabled = false;
        if (res.error) { say($('login-msg'), res.error.message, 'err'); return; }
        state.user = res.data.user;
        say($('login-msg'), '');
        $('password').value = '';
        await boot();
    });

    $('forgot-btn').addEventListener('click', async function () {
        var email = $('email').value.trim();
        if (!email) { say($('login-msg'), 'Type your email first, then press this.', 'err'); return; }
        var res = await db.auth.resetPasswordForEmail(email, { redirectTo: location.href });
        say($('login-msg'), res.error ? res.error.message : 'Reset link sent to ' + email,
            res.error ? 'err' : 'ok');
    });

    $('logout-btn').addEventListener('click', async function () {
        await db.auth.signOut();
        state.user = null; state.records = [];
        showLogin();
    });

    /* -------------------------------------------------------------- loading */
    async function loadRecords() {
        var res = await db.from('records').select('*')
            .order('kind', { ascending: true })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (res.error) { say($('form-msg'), res.error.message, 'err'); return; }
        state.records = res.data || [];
        render();
    }

    async function boot() {
        showApp();
        $('who').textContent = state.user.email;
        syncKindUI();
        await loadRecords();
    }

    /* --------------------------------------------------------------- render */
    function renderStats() {
        var byKind = {}, withFile = 0, pub = 0;
        state.records.forEach(function (r) {
            byKind[r.kind] = (byKind[r.kind] || 0) + 1;
            if (r.file_path) withFile++;
            if (r.is_public) pub++;
        });
        var missing = state.records.length - withFile;
        var learning = (byKind.fdp || 0) + (byKind.workshop || 0) +
            (byKind.course || 0) + (byKind.certificate || 0);
        var research = (byKind.journal || 0) + (byKind.conference || 0) +
            (byKind.chapter || 0) + (byKind.book || 0) + (byKind.patent || 0);
        var cells = [
            ['Records', state.records.length],
            ['Certificates', learning],
            ['Research', research],
            ['With file', withFile],
            ['Missing file', missing],
            ['Public', pub]
        ];
        $('stat-row').innerHTML = cells.map(function (c) {
            return '<div class="stat' + (c[0] === 'Missing file' && c[1] > 0 ? ' stat-warn' : '') + '">' +
                '<span class="stat-num">' + c[1] + '</span><span class="stat-label">' + c[0] + '</span></div>';
        }).join('');
    }

    /* ------------------------------------------------------------- folders */
    function renderFolders() {
        var counts = {}, missing = {};
        state.records.forEach(function (r) {
            counts[r.kind] = (counts[r.kind] || 0) + 1;
            if (!r.file_path) missing[r.kind] = (missing[r.kind] || 0) + 1;
        });

        $('folder-groups').innerHTML = BANDS.map(function (band) {
            var tiles = band.kinds.map(function (kind) {
                var n = counts[kind] || 0;
                var miss = missing[kind] || 0;
                return '<button class="folder" data-folder="' + kind + '"' +
                    (n === 0 ? ' data-empty="1"' : '') + '>' +
                    '<span class="folder-icon">' + (DEFAULT_ICON[kind] || '📁') + '</span>' +
                    '<span class="folder-name">' + esc(FOLDER_NAME[kind] || kind) + '</span>' +
                    '<span class="folder-count">' + n + (n === 1 ? ' item' : ' items') + '</span>' +
                    (miss ? '<span class="folder-missing">' + miss + ' without a file</span>' : '') +
                    '</button>';
            }).join('');

            return '<section class="folder-band">' +
                '<h4>' + esc(band.title) + ' <span class="muted small">' + esc(band.note) + '</span></h4>' +
                '<div class="folder-grid">' + tiles + '</div></section>';
        }).join('');
    }

    function openFolder(kind) {
        state.view = 'records';
        state.folder = kind;
        $('filter-kind').value = kind;
        $('search').value = '';
        $('filter-file').value = 'all';
        $('filter-vis').value = 'all';
        $('crumb-current').textContent = kind === 'all'
            ? 'All records'
            : (FOLDER_NAME[kind] || kind);
        render();
        $('crumbs').scrollIntoView && $('crumbs').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showFolders() {
        state.view = 'folders';
        state.folder = 'all';
        render();
    }

    document.addEventListener('click', function (e) {
        var tile = e.target.closest('[data-folder]');
        if (tile) { openFolder(tile.dataset.folder); return; }
    });
    $('back-btn').addEventListener('click', showFolders);
    $('show-all-btn').addEventListener('click', function () { openFolder('all'); });

    function visible() {
        var q = $('search').value.trim().toLowerCase();
        var kind = $('filter-kind').value;
        var file = $('filter-file').value;
        var vis = $('filter-vis').value;
        return state.records.filter(function (r) {
            if (kind !== 'all' && r.kind !== kind) return false;
            if (file === 'yes' && !r.file_path) return false;
            if (file === 'no' && r.file_path) return false;
            if (vis === 'public' && !r.is_public) return false;
            if (vis === 'private' && r.is_public) return false;
            if (q) {
                var hay = [r.title, r.venue, r.meta, r.notes, r.year].join(' ').toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function render() {
        renderStats();

        var onFolders = state.view === 'folders';
        $('folder-view').hidden = !onFolders;
        $('crumbs').hidden = onFolders;
        $('toolbar').hidden = onFolders;
        $('record-list').hidden = onFolders;

        if (onFolders) {
            renderFolders();
            $('empty-msg').hidden = true;
            return;
        }

        var list = visible();
        $('empty-msg').hidden = list.length !== 0;
        $('empty-msg').textContent = $('search').value.trim()
            ? 'Nothing matches that search in this folder.'
            : 'This folder is empty. Add a record above, or drop files into the bulk box.';
        $('record-list').innerHTML = list.map(function (r) {
            var icon = r.icon || DEFAULT_ICON[r.kind] || '📄';
            var sub = [r.venue, r.meta, r.year].filter(Boolean).join(' · ');
            return '' +
                '<article class="rec" data-id="' + r.id + '">' +
                '  <div class="rec-icon">' + esc(icon) + '</div>' +
                '  <div class="rec-main">' +
                '    <h4>' + esc(r.title) + '</h4>' +
                '    <p class="rec-sub">' + esc(sub) + '</p>' +
                '    <div class="rec-tags">' +
                '      <span class="chip">' + esc(KIND_LABEL[r.kind] || r.kind) + '</span>' +
                (r.is_public ? '<span class="chip chip-pub">public</span>'
                    : '<span class="chip chip-priv">private</span>') +
                (r.file_path
                    ? '<span class="chip chip-file">' + esc(r.file_name || 'file') +
                    (r.file_size ? ' · ' + humanSize(r.file_size) : '') + '</span>'
                    : '<span class="chip chip-warn">no file</span>') +
                (r.link ? '<a class="chip chip-link" target="_blank" rel="noopener" href="' +
                    esc(r.link) + '">link ↗</a>' : '') +
                '    </div>' +
                (r.notes ? '<p class="rec-notes">' + esc(r.notes) + '</p>' : '') +
                '  </div>' +
                '  <div class="rec-actions">' +
                (r.file_path
                    ? '<button class="btn-mini" data-act="download">⬇ Download</button>' +
                    '<button class="btn-mini" data-act="open">👁 Open</button>' : '') +
                '    <button class="btn-mini" data-act="edit">✎ Edit</button>' +
                (canPublish(r.kind)
                    ? '<button class="btn-mini" data-act="toggle">' +
                    (r.is_public ? '🙈 Make private' : '🌐 Make public') + '</button>'
                    : '<span class="btn-mini locked" title="This type is private by design">🔒 Private only</span>') +
                '    <button class="btn-mini danger" data-act="delete">🗑 Delete</button>' +
                '  </div>' +
                '</article>';
        }).join('');
    }

    ['search', 'filter-kind', 'filter-file', 'filter-vis'].forEach(function (id) {
        $(id).addEventListener('input', function () {
            // changing the type dropdown by hand is the same as walking into
            // another folder — keep the breadcrumb honest
            if (id === 'filter-kind') {
                state.folder = $('filter-kind').value;
                $('crumb-current').textContent = state.folder === 'all'
                    ? 'All records'
                    : (FOLDER_NAME[state.folder] || state.folder);
            }
            render();
        });
    });

    /* -------------------------------------------------------------- actions */
    $('record-list').addEventListener('click', async function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var id = e.target.closest('.rec').dataset.id;
        var rec = state.records.find(function (r) { return r.id === id; });
        if (!rec) return;
        var act = btn.dataset.act;

        if (act === 'download' || act === 'open') {
            btn.disabled = true;
            var signed = await db.storage.from('vault')
                .createSignedUrl(rec.file_path, 120, act === 'download' ? { download: rec.file_name || true } : {});
            btn.disabled = false;
            if (signed.error) { alert(signed.error.message); return; }
            window.open(signed.data.signedUrl, '_blank', 'noopener');
        }

        if (act === 'edit') fillForm(rec);

        if (act === 'toggle') {
            if (!canPublish(rec.kind)) return;
            var res = await db.from('records').update({ is_public: !rec.is_public }).eq('id', id);
            if (res.error) { alert(res.error.message); return; }
            rec.is_public = !rec.is_public;
            render();
        }

        if (act === 'delete') {
            if (!confirm('Delete "' + rec.title + '"' + (rec.file_path ? ' and its file' : '') + '? This cannot be undone.')) return;
            if (rec.file_path) await db.storage.from('vault').remove([rec.file_path]);
            var del = await db.from('records').delete().eq('id', id);
            if (del.error) { alert(del.error.message); return; }
            state.records = state.records.filter(function (r) { return r.id !== id; });
            render();
        }
    });

    /* ----------------------------------------------------------- form logic */
    /* React to the chosen type: private-only kinds cannot be published, and the
       logo field only matters for membership cards. */
    function syncKindUI() {
        var kind = $('rec-kind').value;
        var ok = canPublish(kind);
        $('rec-public').disabled = !ok;
        if (!ok) $('rec-public').checked = false;
        $('public-hint').textContent = ok
            ? 'The file itself always stays private — only the title, venue and link go public.'
            : KIND_LABEL[kind] + ' records are private by design. The database refuses to publish them.';
        $('image-field').hidden = kind !== 'membership';
        if (!$('rec-icon').value) $('rec-icon').placeholder = DEFAULT_ICON[kind] || '📄';
    }
    $('rec-kind').addEventListener('change', syncKindUI);

    function fillForm(r) {
        $('rec-id').value = r.id;
        $('rec-title').value = r.title || '';
        $('rec-kind').value = r.kind;
        $('rec-icon').value = r.icon || '';
        $('rec-venue').value = r.venue || '';
        $('rec-meta').value = r.meta || '';
        $('rec-year').value = r.year || '';
        $('rec-link').value = r.link || '';
        $('rec-notes').value = r.notes || '';
        $('rec-image').value = r.image_url || '';
        syncKindUI();
        $('rec-public').checked = !!r.is_public;
        $('rec-file').value = '';
        $('file-current').textContent = r.file_path
            ? 'Current file: ' + (r.file_name || '') + ' — choosing a new file replaces it.'
            : 'No file attached yet.';
        $('form-summary').textContent = '✎ Editing: ' + r.title;
        $('cancel-btn').hidden = false;
        $('form-card').open = true;
        if ($('form-card').scrollIntoView) {
            $('form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function resetForm() {
        $('record-form').reset();
        $('rec-id').value = '';
        $('file-current').textContent = '';
        $('form-summary').textContent = '➕ Add a record';
        $('cancel-btn').hidden = true;
        syncKindUI();
    }
    $('cancel-btn').addEventListener('click', function () { resetForm(); $('form-card').open = false; });

    async function uploadFile(file) {
        var path = state.user.id + '/' + crypto.randomUUID() + '-' + safeName(file.name);
        var up = await db.storage.from('vault').upload(path, file, {
            cacheControl: '3600', upsert: false, contentType: file.type || undefined
        });
        if (up.error) throw up.error;
        return {
            file_path: path, file_name: file.name,
            file_size: file.size, mime_type: file.type || null
        };
    }

    $('record-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var msg = $('form-msg'), btn = $('save-btn');
        btn.disabled = true;

        var id = $('rec-id').value;
        var existing = id ? state.records.find(function (r) { return r.id === id; }) : null;
        var kind = $('rec-kind').value;

        var payload = {
            user_id: state.user.id,
            kind: kind,
            title: $('rec-title').value.trim(),
            venue: $('rec-venue').value.trim() || null,
            meta: $('rec-meta').value.trim() || null,
            year: $('rec-year').value ? parseInt($('rec-year').value, 10) : null,
            link: $('rec-link').value.trim() || null,
            notes: $('rec-notes').value.trim() || null,
            icon: $('rec-icon').value.trim() || DEFAULT_ICON[kind] || '📄',
            image_url: $('rec-image').value.trim() || null,
            is_public: canPublish(kind) && $('rec-public').checked
        };

        try {
            var file = $('rec-file').files[0];
            if (file) {
                say(msg, 'Uploading file…');
                Object.assign(payload, await uploadFile(file));
            }

            say(msg, 'Saving…');
            var res = id
                ? await db.from('records').update(payload).eq('id', id).select().single()
                : await db.from('records').insert(payload).select().single();
            if (res.error) throw res.error;

            // remove the old file only after the new one is safely referenced
            if (file && existing && existing.file_path && existing.file_path !== res.data.file_path) {
                await db.storage.from('vault').remove([existing.file_path]);
            }

            if (id) {
                state.records = state.records.map(function (r) { return r.id === id ? res.data : r; });
            } else {
                state.records.unshift(res.data);
            }
            resetForm();
            render();
            say(msg, 'Saved.', 'ok');
        } catch (err) {
            say(msg, err.message || String(err), 'err');
        } finally {
            btn.disabled = false;
        }
    });

    /* ------------------------------------------------------------ bulk drop */
    $('bulk-btn').addEventListener('click', function () { $('bulk-input').click(); });
    $('bulk-input').addEventListener('change', function () { bulkUpload(this.files); this.value = ''; });

    var dz = $('drop-zone');
    ['dragenter', 'dragover'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('over'); });
    });
    dz.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files.length) bulkUpload(e.dataTransfer.files);
    });

    async function bulkUpload(files) {
        var msg = $('bulk-msg'), done = 0, failed = 0;
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            say(msg, 'Uploading ' + (i + 1) + ' of ' + files.length + ': ' + f.name + '…');
            try {
                var meta = await uploadFile(f);
                var payload = Object.assign({
                    user_id: state.user.id, kind: 'certificate',
                    title: titleFromFile(f.name), icon: '🏅', is_public: false
                }, meta);
                var res = await db.from('records').insert(payload).select().single();
                if (res.error) throw res.error;
                state.records.unshift(res.data);
                done++;
            } catch (err) {
                failed++;
                console.error(f.name, err);
            }
        }
        render();
        say(msg, done + ' uploaded as private drafts' + (failed ? ', ' + failed + ' failed' : '') +
            '. Edit each one to set the type, venue and visibility.', failed ? 'err' : 'ok');
    }

    /* --------------------------------------------------------------- backup */
    $('export-btn').addEventListener('click', function () {
        var clean = state.records.map(function (r) {
            var c = Object.assign({}, r);
            delete c.user_id;
            return c;
        });
        var blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), records: clean }, null, 2)],
            { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vault-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    /* ----------------------------------------------------------------- init */
    (async function () {
        var res = await db.auth.getSession();
        if (res.data && res.data.session) {
            state.user = res.data.session.user;
            await boot();
        } else {
            showLogin();
        }
    })();
})();
