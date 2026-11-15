/* Academic & Certificate Vault SPA Logic with Authentication */

(function () {
  'use strict';

  // State Management
  const state = {
    currentUser: null,
    items: [],
    categories: [],
    stats: {},
    currentCategory: 'all',
    searchQuery: '',
    currentYear: 'all',
    currentTag: '',
    currentSort: 'date_desc',
    currentView: localStorage.getItem('vault_view') || 'grid',
    selectedItem: null,
  };

  // DOM Elements cache
  const el = {
    // Auth & User Menu
    openLoginModalBtn: document.getElementById('openLoginModalBtn'),
    userMenuWrapper: document.getElementById('userMenuWrapper'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    userDropdown: document.getElementById('userDropdown'),
    userAvatarText: document.getElementById('userAvatarText'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    dropdownUserName: document.getElementById('dropdownUserName'),
    dropdownUserEmail: document.getElementById('dropdownUserEmail'),
    openChangePassBtn: document.getElementById('openChangePassBtn'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Login Modal
    loginModal: document.getElementById('loginModal'),
    closeLoginModalBtn: document.getElementById('closeLoginModalBtn'),
    loginForm: document.getElementById('loginForm'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    togglePassVisibility: document.getElementById('togglePassVisibility'),
    fillDemoLoginBtn: document.getElementById('fillDemoLoginBtn'),
    loginErrorMsg: document.getElementById('loginErrorMsg'),
    loginBtnText: document.getElementById('loginBtnText'),

    // Password Modal
    passwordModal: document.getElementById('passwordModal'),
    closePasswordModalBtn: document.getElementById('closePasswordModalBtn'),
    cancelPassBtn: document.getElementById('cancelPassBtn'),
    passwordForm: document.getElementById('passwordForm'),
    currentPasswordInput: document.getElementById('currentPasswordInput'),
    newPasswordInput: document.getElementById('newPasswordInput'),

    // Stats
    statTotal: document.getElementById('statTotalItems'),
    statCerts: document.getElementById('statWithCerts'),
    statPubs: document.getElementById('statPublications'),
    statPatents: document.getElementById('statPatents'),
    statFDPs: document.getElementById('statFDPs'),
    statEdu: document.getElementById('statEducation'),

    // Category container
    catContainer: document.getElementById('categoryPillsContainer'),
    activeCatSummary: document.getElementById('activeCategorySummary'),

    // Filters
    globalSearch: document.getElementById('globalSearchInput'),
    mobileSearch: document.getElementById('mobileSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterYear: document.getElementById('filterYear'),
    filterTag: document.getElementById('filterTag'),
    sortOrder: document.getElementById('sortOrder'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    itemCountDisplay: document.getElementById('itemCountDisplay'),
    quickTagsList: document.getElementById('quickTagsList'),

    // View toggles
    gridViewBtn: document.getElementById('gridViewBtn'),
    tableViewBtn: document.getElementById('tableViewBtn'),
    gridContainer: document.getElementById('gridContainer'),
    tableContainer: document.getElementById('tableContainer'),
    tableBody: document.getElementById('tableBody'),
    emptyState: document.getElementById('emptyState'),
    emptyStateMsg: document.getElementById('emptyStateMessage'),
    emptyResetBtn: document.getElementById('emptyResetBtn'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),

    // Theme & Menus
    themeToggle: document.getElementById('themeToggleBtn'),
    exportMenuBtn: document.getElementById('exportMenuBtn'),
    exportDropdown: document.getElementById('exportDropdown'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),

    // Item Modal
    itemModal: document.getElementById('itemModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalHeaderIcon: document.getElementById('modalHeaderIcon'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    itemForm: document.getElementById('itemForm'),
    formItemId: document.getElementById('formItemId'),
    formCategory: document.getElementById('formCategory'),
    categoryHelpBanner: document.getElementById('categoryHelpBanner'),
    categoryHelpText: document.getElementById('categoryHelpText'),
    formTitle: document.getElementById('formTitle'),
    formSubcategory: document.getElementById('formSubcategory'),
    formIssuer: document.getElementById('formIssuer'),
    formDate: document.getElementById('formDate'),
    formYear: document.getElementById('formYear'),
    formIdentifier: document.getElementById('formIdentifier'),
    formScore: document.getElementById('formScore'),
    formRole: document.getElementById('formRole'),
    formUrl: document.getElementById('formUrl'),
    formTags: document.getElementById('formTags'),
    formDescription: document.getElementById('formDescription'),
    dynamicFieldsContainer: document.getElementById('dynamicFieldsContainer'),
    dynamicFieldsGrid: document.getElementById('dynamicFieldsGrid'),
    dynamicSectionTitle: document.getElementById('dynamicSectionTitle'),
    dropZone: document.getElementById('dropZone'),
    formFile: document.getElementById('formFile'),
    dropZonePrompt: document.getElementById('dropZonePrompt'),
    filePreviewBadge: document.getElementById('filePreviewBadge'),
    fileNamePreview: document.getElementById('fileNamePreview'),
    fileSizePreview: document.getElementById('fileSizePreview'),
    removeFileBtn: document.getElementById('removeFileBtn'),
    existingFileBanner: document.getElementById('existingFileBanner'),
    existingFileName: document.getElementById('existingFileName'),
    previewExistingBtn: document.getElementById('previewExistingBtn'),
    deleteExistingBtn: document.getElementById('deleteExistingBtn'),
    removeFileFlag: document.getElementById('removeFileFlag'),
    saveBtnText: document.getElementById('saveBtnText'),

    // Viewer Modal
    viewerModal: document.getElementById('viewerModal'),
    viewerTitle: document.getElementById('viewerTitle'),
    viewerSubtitle: document.getElementById('viewerSubtitle'),
    viewerDownloadBtn: document.getElementById('viewerDownloadBtn'),
    viewerNewTabBtn: document.getElementById('viewerNewTabBtn'),
    closeViewerBtn: document.getElementById('closeViewerBtn'),
    viewerLoading: document.getElementById('viewerLoading'),
    pdfFrame: document.getElementById('pdfFrame'),
    imagePreview: document.getElementById('imagePreview'),
    fileFallback: document.getElementById('fileFallback'),
    fallbackDownloadBtn: document.getElementById('fallbackDownloadBtn'),
    viewerCategoryBadge: document.getElementById('viewerCategoryBadge'),
    viewerSubcategory: document.getElementById('viewerSubcategory'),
    viewerIssuer: document.getElementById('viewerIssuer'),
    viewerDate: document.getElementById('viewerDate'),
    viewerYear: document.getElementById('viewerYear'),
    viewerIdentifier: document.getElementById('viewerIdentifier'),
    viewerScore: document.getElementById('viewerScore'),
    viewerExtraDetails: document.getElementById('viewerExtraDetails'),
    viewerTags: document.getElementById('viewerTags'),
    viewerUrlLink: document.getElementById('viewerUrlLink'),

    // Import Modal
    importModal: document.getElementById('importModal'),
    openImportModalBtn: document.getElementById('openImportModalBtn'),
    closeImportModalBtn: document.getElementById('closeImportModalBtn'),
    cancelImportBtn: document.getElementById('cancelImportBtn'),
    importForm: document.getElementById('importForm'),
    importFileInput: document.getElementById('importFileInput'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  /* ---------------- Category Helpers & Form Schemas ---------------- */
  const CATEGORY_SCHEMAS = {
    school: {
      titleLabel: "School Certificate / Examination Name",
      titlePlaceholder: "e.g. Matriculation (10th) / Higher Secondary (12th) Board Examination",
      issuerLabel: "School Name / Board",
      issuerPlaceholder: "e.g. Vivekananda Matriculation / CBSE / State Board",
      idLabel: "Roll Number / Registration Number",
      scoreLabel: "Percentage / Aggregate Marks",
      dynamicTitle: "School Education Details",
      fields: [
        { key: "board", label: "Board of Education", placeholder: "e.g. State Board / CBSE / ICSE" },
        { key: "stream", label: "Stream / Subjects", placeholder: "e.g. Science (PCM-CS) / General" },
        { key: "school_name", label: "School Institution", placeholder: "e.g. T.S.P Matric Hr Sec School" },
        { key: "certificate_type", label: "Certificate Type", placeholder: "e.g. Marksheet / Transfer / Rank" }
      ]
    },
    college: {
      titleLabel: "Degree / Course Title",
      titlePlaceholder: "e.g. Bachelor of Engineering in CSE / Master of Engineering",
      issuerLabel: "College / University Name",
      issuerPlaceholder: "e.g. Knowledge Institute of Technology / Anna University / Galgotias University",
      idLabel: "University Registration / Roll No",
      scoreLabel: "CGPA / Percentage / Status",
      dynamicTitle: "Degree & College Details",
      fields: [
        { key: "degree", label: "Degree Level", placeholder: "e.g. B.E, M.E, Ph.D, B.Tech, Diploma" },
        { key: "branch", label: "Major / Specialization", placeholder: "e.g. Computer Science & Engineering" },
        { key: "university", label: "Affiliating University", placeholder: "e.g. Anna University / Galgotias" },
        { key: "division", label: "Class / Division", placeholder: "e.g. First Class with Distinction" }
      ]
    },
    journal: {
      titleLabel: "Research Paper Title",
      titlePlaceholder: "e.g. An Efficient Brain Tumor Classification And Segmentation Using Deep Learning",
      issuerLabel: "Journal Name",
      issuerPlaceholder: "e.g. IEEE Transactions / Springer / JISEM / IJETT",
      idLabel: "DOI / ISSN / Article Number",
      scoreLabel: "Impact Factor / Indexing Status",
      dynamicTitle: "Journal Publication Details",
      fields: [
        { key: "indexing", label: "Indexing", placeholder: "e.g. Scopus, SCI, Web of Science, UGC-CARE" },
        { key: "volume_issue", label: "Volume & Issue", placeholder: "e.g. Vol. 71, Issue 3" },
        { key: "pages", label: "Page Numbers", placeholder: "e.g. pp. 156–167" },
        { key: "doi", label: "DOI Number", placeholder: "e.g. 10.1109/..." }
      ]
    },
    conference: {
      titleLabel: "Conference Paper / Presentation Title",
      titlePlaceholder: "e.g. Predicting Cervical Cancer with Swarm Intelligence...",
      issuerLabel: "Conference Name & Organizer",
      issuerPlaceholder: "e.g. IC3IoT, IEEE / APCI / Springer IC3E",
      idLabel: "Paper ID / IEEE Xplore Article ID",
      scoreLabel: "Presentation Award / Recognition",
      dynamicTitle: "Conference Details",
      fields: [
        { key: "organizer", label: "Sponsor / Society", placeholder: "e.g. IEEE, Springer, ACM" },
        { key: "level", label: "Conference Level", placeholder: "e.g. International / National" },
        { key: "presentation_type", label: "Type of Presentation", placeholder: "e.g. Oral / Poster / Keynote" },
        { key: "location", label: "Conference Location", placeholder: "e.g. Yokohama, Japan / Chennai, India" }
      ]
    },
    fdp: {
      titleLabel: "FDP / Workshop Program Title",
      titlePlaceholder: "e.g. Two-Week Faculty Development Program on Generative AI...",
      issuerLabel: "Organizing Institution / University",
      issuerPlaceholder: "e.g. IIT Madras, Jain University, Galgotias University",
      idLabel: "Certificate Ref / FDP ID",
      scoreLabel: "Grade / Result / Attendance",
      dynamicTitle: "FDP & Workshop Details",
      fields: [
        { key: "duration", label: "Duration", placeholder: "e.g. 1 Week / 2 Weeks / 5 Days" },
        { key: "mode", label: "Mode of Delivery", placeholder: "e.g. Online / Offline / Hybrid" },
        { key: "sponsor", label: "Sponsoring Agency", placeholder: "e.g. AICTE ATAL / TEQIP / IEEE" },
        { key: "program_type", label: "Type", placeholder: "e.g. FDP, STTP, Hands-on Workshop, Pedagogy" }
      ]
    },
    book_chapter: {
      titleLabel: "Book Chapter Title",
      titlePlaceholder: "e.g. Taxonomy of Security Attacks in Advances of DNA Computing in Cryptography",
      issuerLabel: "Book Title & Publisher",
      issuerPlaceholder: "e.g. CRC Press, Taylor & Francis Group",
      idLabel: "ISBN / DOI",
      scoreLabel: "Chapter Number / Indexing",
      dynamicTitle: "Book Chapter Metadata",
      fields: [
        { key: "book_title", label: "Main Book Title", placeholder: "e.g. Advances of DNA Computing in Cryptography" },
        { key: "publisher", label: "Publisher", placeholder: "e.g. CRC Press, Springer Nature, Elsevier" },
        { key: "isbn", label: "Book ISBN", placeholder: "e.g. 978-0367495305" },
        { key: "pages", label: "Page Range", placeholder: "e.g. pp. 120–145" }
      ]
    },
    book: {
      titleLabel: "Book Title",
      titlePlaceholder: "e.g. Convergence of Blockchain, AI and IoT: A Digital Platform",
      issuerLabel: "Publisher",
      issuerPlaceholder: "e.g. CRC Press, Taylor & Francis Group",
      idLabel: "Book ISBN (10 or 13)",
      scoreLabel: "Edition / Volume",
      dynamicTitle: "Book Publishing Details",
      fields: [
        { key: "publisher", label: "Publisher Name", placeholder: "e.g. CRC Press, Routledge" },
        { key: "isbn", label: "ISBN", placeholder: "e.g. 9780367495305" },
        { key: "edition", label: "Edition", placeholder: "e.g. 1st Edition / International" },
        { key: "co_authors", label: "Co-Authors", placeholder: "e.g. Dr. Balamurugan, Dr. Poongodi, Dr. Sharma" }
      ]
    },
    patent: {
      titleLabel: "Invention / Patent Title",
      titlePlaceholder: "e.g. TRACKING GOLD JEWEL USING GOLD JEWEL IDENTIFIER",
      issuerLabel: "Patent Office / Jurisdiction",
      issuerPlaceholder: "e.g. Indian Patent Office (IPO) / USPTO / WIPO",
      idLabel: "Application / Grant Number",
      scoreLabel: "Status (Filed / Published / Granted)",
      dynamicTitle: "Patent & IPR Details",
      fields: [
        { key: "status", label: "Current Status", placeholder: "e.g. Granted, Published, Filed" },
        { key: "application_no", label: "Application Number", placeholder: "e.g. 202141012345" },
        { key: "country", label: "Jurisdiction", placeholder: "e.g. India, USA, PCT" },
        { key: "published_date", label: "Publication / Grant Date", placeholder: "e.g. 12/03/2021" }
      ]
    },
    course: {
      titleLabel: "Course / Certification Title",
      titlePlaceholder: "e.g. Teaching and Learning in Engineering / AWS Solutions Architect",
      issuerLabel: "Issuing Body / Academy",
      issuerPlaceholder: "e.g. NPTEL · IIT Madras / Coursera / AWS / UNESCO",
      idLabel: "Certificate ID / Roll No",
      scoreLabel: "Score / Medal / Grade",
      dynamicTitle: "Course & Certification Details",
      fields: [
        { key: "medal", label: "Medal / Honor", placeholder: "e.g. Elite + Silver, Gold Medal" },
        { key: "score", label: "Final Score", placeholder: "e.g. 79%, 890/1000, Top 5%" },
        { key: "institute", label: "Partner Institute", placeholder: "e.g. IIT Madras, Bennett University" },
        { key: "valid_until", label: "Validity / Expiry", placeholder: "e.g. Lifetime / 2027" }
      ]
    },
    membership: {
      titleLabel: "Society / Organization Name",
      titlePlaceholder: "e.g. Indian Society for Technical Education (ISTE)",
      issuerLabel: "Issuing Headquarters / Body",
      issuerPlaceholder: "e.g. ISTE New Delhi / IAENG / ACM / IEEE",
      idLabel: "Membership Number / ID",
      scoreLabel: "Membership Grade / Status",
      dynamicTitle: "Professional Society Details",
      fields: [
        { key: "membership_grade", label: "Grade", placeholder: "e.g. Life Member, Senior Member, Fellow" },
        { key: "id_no", label: "Membership ID", placeholder: "e.g. LM109489" },
        { key: "validity", label: "Validity", placeholder: "e.g. Life Member / Annual" },
        { key: "chapter", label: "Local Chapter", placeholder: "e.g. Tamil Nadu Section" }
      ]
    },
    role: {
      titleLabel: "Institutional Role / Designation",
      titlePlaceholder: "e.g. Project Coordinator / IQAC Coordinator / Moodle Admin",
      issuerLabel: "University / Department",
      issuerPlaceholder: "e.g. Jain University / Galgotias University",
      idLabel: "Office Order / Sanction Ref",
      scoreLabel: "Tenure / Period",
      dynamicTitle: "Role Responsibilities",
      fields: [
        { key: "tenure", label: "Duration / Period", placeholder: "e.g. 2021–2024" },
        { key: "department", label: "Department / Cell", placeholder: "e.g. CSE, IQAC, CSSP" },
        { key: "responsibilities", label: "Core Scope", placeholder: "e.g. NAAC / NBA Accreditation lead" },
        { key: "level", label: "Level", placeholder: "e.g. Departmental / University-Wide" }
      ]
    }
  };

  /* ---------------- Init Application ---------------- */
  async function init() {
    initTheme();
    setupEventListeners();
    await checkAuthStatus();
    await loadCategories();
    await loadStats();
    await loadItems();
    lucide.createIcons();
  }

  /* ---------------- Authentication Logic ---------------- */
  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (json.success && json.authenticated && json.user) {
        state.currentUser = json.user;
        updateAuthUI(true);
      } else {
        state.currentUser = null;
        updateAuthUI(false);
      }
    } catch (err) {
      console.warn('Could not verify auth status:', err);
      state.currentUser = null;
      updateAuthUI(false);
    }
  }

  function updateAuthUI(isLoggedIn) {
    if (isLoggedIn && state.currentUser) {
      el.openLoginModalBtn.classList.add('hidden');
      el.userMenuWrapper.classList.remove('hidden');

      const name = state.currentUser.name || state.currentUser.username;
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      el.userAvatarText.textContent = initials || 'AD';
      el.userNameDisplay.textContent = name;
      el.dropdownUserName.textContent = name;
      el.dropdownUserEmail.textContent = state.currentUser.email || 'Admin';
    } else {
      el.openLoginModalBtn.classList.remove('hidden');
      el.userMenuWrapper.classList.add('hidden');
    }
    lucide.createIcons();
  }

  function requireAuth(actionCallback) {
    if (state.currentUser) {
      actionCallback();
    } else {
      showToast("Please sign in with credentials to modify or upload records.", "info");
      openLoginModal();
    }
  }

  function openLoginModal() {
    el.loginErrorMsg.classList.add('hidden');
    el.loginErrorMsg.textContent = '';
    el.loginUsername.value = '';
    el.loginPassword.value = '';
    el.loginModal.classList.remove('hidden');
    el.loginUsername.focus();
    lucide.createIcons();
  }

  function closeLoginModal() {
    el.loginModal.classList.add('hidden');
  }

  /* ---------------- Theme & UI Helpers ---------------- */
  function initTheme() {
    const isDark = localStorage.getItem('vault_theme') === 'dark' || 
      (!('vault_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('vault_theme', isDark ? 'dark' : 'light');
    lucide.createIcons();
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const colors = type === 'success' 
      ? 'bg-emerald-600 text-white' 
      : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900');
    
    toast.className = `toast-animate px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold ${colors} pointer-events-auto`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-triangle' : 'info')}" class="w-4 h-4 shrink-0"></i>
      <span>${escapeHtml(message)}</span>
    `;
    el.toastContainer.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /* ---------------- Data Fetching ---------------- */
  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (!json.success) return;
      state.stats = json.data;

      el.statTotal.textContent = state.stats.total_items || 0;
      el.statCerts.textContent = state.stats.with_certs || 0;
      el.statPubs.textContent = state.stats.publications || 0;
      el.statPatents.textContent = state.stats.patents || 0;
      el.statFDPs.textContent = state.stats.fdps || 0;
      el.statEdu.textContent = state.stats.education || 0;

      // Populate year filter
      const currentYearVal = el.filterYear.value;
      el.filterYear.innerHTML = '<option value="all">All Years</option>' + 
        (state.stats.years || []).map(y => `<option value="${y}">${y}</option>`).join('');
      el.filterYear.value = currentYearVal || 'all';

      // Populate tag filter
      const currentTagVal = el.filterTag.value;
      el.filterTag.innerHTML = '<option value="">All Tags</option>' +
        (state.stats.tags || []).map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
      el.filterTag.value = currentTagVal || '';

      // Quick tags bar
      if (state.stats.tags && state.stats.tags.length > 0) {
        const topTags = state.stats.tags.slice(0, 12);
        el.quickTagsList.innerHTML = topTags.map(t => `
          <button class="quick-tag-btn px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-brand-950/60 dark:hover:text-brand-300 font-medium text-[11px] transition" data-tag="${escapeHtml(t)}">
            #${escapeHtml(t)}
          </button>
        `).join('');
      }

    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (!json.success) return;
      state.categories = json.data;

      // Populate Category Pills
      const allCount = state.categories.reduce((acc, c) => acc + (c.item_count || 0), 0);
      let html = `
        <button class="category-pill ${state.currentCategory === 'all' ? 'active bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'} px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition" data-category="all">
          <i data-lucide="layout-grid" class="w-4 h-4"></i>
          <span>All Categories</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] ${state.currentCategory === 'all' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">${allCount}</span>
        </button>
      `;

      state.categories.forEach(cat => {
        const isActive = state.currentCategory === cat.key;
        html += `
          <button class="category-pill ${isActive ? 'active bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'} px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition" data-category="${cat.key}">
            <i data-lucide="${cat.icon || 'folder'}" class="w-4 h-4"></i>
            <span>${cat.label}</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">${cat.item_count || 0}</span>
          </button>
        `;
      });

      el.catContainer.innerHTML = html;

      // Populate Form Category Dropdown
      el.formCategory.innerHTML = '<option value="" disabled selected>Select Category...</option>' +
        state.categories.map(c => `<option value="${c.key}">${c.label}</option>`).join('');

      lucide.createIcons();
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  async function loadItems() {
    try {
      const params = new URLSearchParams();
      if (state.currentCategory && state.currentCategory !== 'all') {
        params.append('category', state.currentCategory);
      }
      if (state.searchQuery && state.searchQuery.trim()) {
        params.append('search', state.searchQuery.trim());
      }
      if (state.currentYear && state.currentYear !== 'all') {
        params.append('year', state.currentYear);
      }
      if (state.currentTag && state.currentTag.trim()) {
        params.append('tag', state.currentTag.trim());
      }
      if (state.currentSort) {
        params.append('sort', state.currentSort);
      }

      const res = await fetch(`/api/items?${params.toString()}`);
      const json = await res.json();
      if (!json.success) return;
      state.items = json.data;

      renderItems();
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  }

  /* ---------------- Rendering Items (Grid & Table) ---------------- */
  function renderItems() {
    const count = state.items.length;
    el.itemCountDisplay.textContent = `${count} ${count === 1 ? 'credential' : 'credentials'} found`;

    const activeCatObj = state.categories.find(c => c.key === state.currentCategory);
    el.activeCatSummary.textContent = activeCatObj ? `Showing: ${activeCatObj.label}` : 'Showing: All Categories';

    const hasFilter = state.currentCategory !== 'all' || 
                      state.searchQuery.trim() !== '' || 
                      state.currentYear !== 'all' || 
                      state.currentTag !== '';
    el.resetFiltersBtn.classList.toggle('hidden', !hasFilter);

    if (count === 0) {
      el.gridContainer.classList.add('hidden');
      el.tableContainer.classList.add('hidden');
      el.emptyState.classList.remove('hidden');
      return;
    }

    el.emptyState.classList.add('hidden');

    if (state.currentView === 'grid') {
      el.gridContainer.classList.remove('hidden');
      el.tableContainer.classList.add('hidden');
      renderGridView();
    } else {
      el.gridContainer.classList.add('hidden');
      el.tableContainer.classList.remove('hidden');
      renderTableView();
    }

    lucide.createIcons();
  }

  function renderGridView() {
    el.gridContainer.innerHTML = state.items.map(item => {
      const hasCert = Boolean(item.file_path);
      const badgeClass = `badge-${item.category}`;

      return `
        <div class="credential-card bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between relative group" data-id="${item.id}">
          
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}">
                <i data-lucide="${item.category_icon || 'folder'}" class="w-3.5 h-3.5"></i>
                <span>${escapeHtml(item.category_label || item.category)}</span>
              </span>

              <div class="flex items-center gap-2">
                ${item.year ? `<span class="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">${item.year}</span>` : ''}
                ${hasCert 
                  ? `<span class="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" title="Certificate Attached">
                      <i data-lucide="file-check-2" class="w-4 h-4"></i>
                     </span>` 
                  : `<span class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400" title="No file attached">
                      <i data-lucide="file-minus" class="w-4 h-4"></i>
                     </span>`}
              </div>
            </div>

            <h4 class="text-base font-bold text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition cursor-pointer view-details-trigger" data-id="${item.id}">
              ${escapeHtml(item.title)}
            </h4>

            ${item.subcategory ? `
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                ${escapeHtml(item.subcategory)}
              </p>
            ` : ''}

            ${item.issuer_or_org ? `
              <div class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                <i data-lucide="building" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                <span class="truncate">${escapeHtml(item.issuer_or_org)}</span>
              </div>
            ` : ''}

            ${item.score_or_grade ? `
              <div class="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                <i data-lucide="award" class="w-3.5 h-3.5"></i>
                <span>${escapeHtml(item.score_or_grade)}</span>
              </div>
            ` : ''}

            ${item.identifier ? `
              <div class="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                <i data-lucide="hash" class="w-3 h-3 text-slate-400"></i>
                <span class="truncate select-all">${escapeHtml(item.identifier)}</span>
              </div>
            ` : ''}

            ${item.tags_list && item.tags_list.length > 0 ? `
              <div class="flex flex-wrap gap-1 mt-3">
                ${item.tags_list.map(t => `
                  <button class="item-tag-chip text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950 transition" data-tag="${escapeHtml(t)}">
                    #${escapeHtml(t)}
                  </button>
                `).join('')}
              </div>
            ` : ''}

          </div>

          <div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              ${hasCert ? `
                <button class="view-cert-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 transition" data-id="${item.id}">
                  <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                  <span>View Proof</span>
                </button>
                <a href="/${item.file_path}" download class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Download Document">
                  <i data-lucide="download" class="w-4 h-4"></i>
                </a>
              ` : `
                <button class="attach-cert-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50 rounded-lg transition" data-id="${item.id}">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                  <span>Attach Proof</span>
                </button>
              `}

              ${item.url ? `
                <a href="${item.url}" target="_blank" class="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Open Verification / Paper Link">
                  <i data-lucide="external-link" class="w-4 h-4"></i>
                </a>
              ` : ''}
            </div>

            <div class="flex items-center gap-1">
              <button class="edit-item-btn p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Edit Credential" data-id="${item.id}">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button class="delete-item-btn p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Delete Credential" data-id="${item.id}">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

        </div>
      `;
    }).join('');
  }

  function renderTableView() {
    el.tableBody.innerHTML = state.items.map(item => {
      const hasCert = Boolean(item.file_path);
      const badgeClass = `badge-${item.category}`;

      return `
        <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
          <td class="px-4 py-3.5 align-top">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}">
              <i data-lucide="${item.category_icon || 'folder'}" class="w-3 h-3"></i>
              <span>${escapeHtml(item.category_label || item.category)}</span>
            </span>
            ${item.subcategory ? `<div class="text-[11px] text-slate-400 mt-1">${escapeHtml(item.subcategory)}</div>` : ''}
          </td>

          <td class="px-4 py-3.5 align-top max-w-xs sm:max-w-md">
            <div class="font-bold text-slate-900 dark:text-white view-details-trigger cursor-pointer hover:text-brand-600 transition" data-id="${item.id}">
              ${escapeHtml(item.title)}
            </div>
            ${item.description ? `<div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">${escapeHtml(item.description)}</div>` : ''}
            ${item.tags_list && item.tags_list.length > 0 ? `
              <div class="flex flex-wrap gap-1 mt-1.5">
                ${item.tags_list.map(t => `<span class="text-[10px] text-slate-400">#${escapeHtml(t)}</span>`).join(' ')}
              </div>
            ` : ''}
          </td>

          <td class="px-4 py-3.5 align-top text-xs font-medium text-slate-700 dark:text-slate-300">
            ${escapeHtml(item.issuer_or_org || '-')}
          </td>

          <td class="px-4 py-3.5 align-top text-xs whitespace-nowrap">
            <span class="font-semibold text-slate-800 dark:text-slate-200">${item.year || '-'}</span>
            ${item.event_date ? `<div class="text-[10px] text-slate-400">${item.event_date}</div>` : ''}
          </td>

          <td class="px-4 py-3.5 align-top text-xs">
            ${item.score_or_grade ? `<div class="font-bold text-emerald-600 dark:text-emerald-400">${escapeHtml(item.score_or_grade)}</div>` : ''}
            ${item.identifier ? `<div class="font-mono text-[11px] text-slate-400 select-all">${escapeHtml(item.identifier)}</div>` : ''}
          </td>

          <td class="px-4 py-3.5 align-top text-center">
            ${hasCert ? `
              <button class="view-cert-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition" data-id="${item.id}">
                <i data-lucide="eye" class="w-3 h-3"></i>
                <span>View</span>
              </button>
            ` : `
              <button class="attach-cert-btn text-xs text-slate-400 hover:text-brand-600" data-id="${item.id}">
                + Attach
              </button>
            `}
          </td>

          <td class="px-4 py-3.5 align-top text-right whitespace-nowrap">
            <div class="inline-flex items-center gap-1">
              ${item.url ? `
                <a href="${item.url}" target="_blank" class="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                </a>
              ` : ''}
              <button class="edit-item-btn p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" data-id="${item.id}" title="Edit">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button class="delete-item-btn p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" data-id="${item.id}" title="Delete">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* ---------------- Dynamic Category Fields & Form Logic ---------------- */
  function onCategoryChange(catKey) {
    const schema = CATEGORY_SCHEMAS[catKey];
    const catObj = state.categories.find(c => c.key === catKey);

    if (catObj && catObj.description) {
      el.categoryHelpBanner.classList.remove('hidden');
      el.categoryHelpText.textContent = catObj.description;
    } else {
      el.categoryHelpBanner.classList.add('hidden');
    }

    if (schema) {
      el.formTitle.placeholder = schema.titlePlaceholder;
      el.formIssuer.placeholder = schema.issuerPlaceholder;
      el.formIdentifier.placeholder = schema.idLabel;
      el.formScore.placeholder = schema.scoreLabel;

      el.dynamicSectionTitle.textContent = schema.dynamicTitle;
      el.dynamicFieldsContainer.classList.remove('hidden');

      el.dynamicFieldsGrid.innerHTML = schema.fields.map(f => `
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            ${f.label}
          </label>
          <input 
            type="text" 
            name="extra_${f.key}" 
            id="extra_${f.key}" 
            placeholder="${f.placeholder}" 
            class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
        </div>
      `).join('');
    } else {
      el.dynamicFieldsContainer.classList.add('hidden');
      el.dynamicFieldsGrid.innerHTML = '';
      el.formTitle.placeholder = "e.g. Credential Title";
      el.formIssuer.placeholder = "e.g. Issuing Organization / Body";
    }

    lucide.createIcons();
  }

  /* ---------------- Modal Open / Edit / Save Handlers ---------------- */
  function openAddModal(preselectCat = null) {
    requireAuth(() => {
      el.itemForm.reset();
      el.formItemId.value = '';
      el.modalTitle.textContent = "Add New Credential";
      el.saveBtnText.textContent = "Save Credential";
      el.removeFileFlag.value = "false";
      el.filePreviewBadge.classList.add('hidden');
      el.existingFileBanner.classList.add('hidden');
      el.dropZonePrompt.classList.remove('hidden');

      const targetCat = preselectCat || (state.currentCategory !== 'all' ? state.currentCategory : 'college');
      el.formCategory.value = targetCat;
      onCategoryChange(targetCat);

      el.itemModal.classList.remove('hidden');
      lucide.createIcons();
    });
  }

  async function openEditModal(itemId) {
    requireAuth(async () => {
      try {
        const res = await fetch(`/api/items/${itemId}`);
        const json = await res.json();
        if (!json.success) return;
        const item = json.data;

        el.itemForm.reset();
        el.formItemId.value = item.id;
        el.modalTitle.textContent = "Edit Credential";
        el.saveBtnText.textContent = "Update Credential";
        el.removeFileFlag.value = "false";

        el.formCategory.value = item.category;
        onCategoryChange(item.category);

        el.formTitle.value = item.title || '';
        el.formSubcategory.value = item.subcategory || '';
        el.formIssuer.value = item.issuer_or_org || '';
        el.formDate.value = item.event_date || '';
        el.formYear.value = item.year || '';
        el.formIdentifier.value = item.identifier || '';
        el.formScore.value = item.score_or_grade || '';
        el.formRole.value = item.role_or_authors || '';
        el.formUrl.value = item.url || '';
        el.formTags.value = item.tags_list ? item.tags_list.join(', ') : '';
        el.formDescription.value = item.description || '';

        if (item.extra_obj) {
          Object.keys(item.extra_obj).forEach(key => {
            const input = document.getElementById(`extra_${key}`);
            if (input) input.value = item.extra_obj[key];
          });
        }

        if (item.file_path) {
          el.existingFileBanner.classList.remove('hidden');
          el.existingFileName.textContent = item.file_name || 'Attached Certificate Proof';
          el.previewExistingBtn.onclick = () => openViewer(item);
          el.deleteExistingBtn.onclick = () => {
            el.removeFileFlag.value = "true";
            el.existingFileBanner.classList.add('hidden');
            showToast("File marked for removal upon saving", "info");
          };
        } else {
          el.existingFileBanner.classList.add('hidden');
        }

        el.filePreviewBadge.classList.add('hidden');
        el.dropZonePrompt.classList.remove('hidden');

        el.itemModal.classList.remove('hidden');
        lucide.createIcons();
      } catch (err) {
        console.error('Error fetching item for edit:', err);
        showToast("Failed to load credential details", "error");
      }
    });
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const itemId = el.formItemId.value;
    const isEdit = Boolean(itemId);

    const formData = new FormData(el.itemForm);

    const extraData = {};
    for (const [key, val] of formData.entries()) {
      if (key.startsWith('extra_')) {
        const cleanKey = key.replace('extra_', '');
        if (val) extraData[cleanKey] = val;
      }
    }
    formData.append('extra_data', JSON.stringify(extraData));

    try {
      el.saveBtnText.textContent = isEdit ? "Updating..." : "Saving...";
      const url = isEdit ? `/api/items/${itemId}` : '/api/items';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        body: formData
      });
      const json = await res.json();

      if (json.success) {
        showToast(isEdit ? "Credential updated successfully!" : "Credential added to vault!", "success");
        el.itemModal.classList.add('hidden');
        await loadStats();
        await loadCategories();
        await loadItems();
      } else {
        if (res.status === 401) {
          showToast("Authentication expired. Please sign in again.", "error");
          openLoginModal();
        } else {
          showToast(json.error || "Failed to save credential", "error");
        }
      }
    } catch (err) {
      console.error('Error saving item:', err);
      showToast("Error saving credential: " + err.message, "error");
    } finally {
      el.saveBtnText.textContent = isEdit ? "Update Credential" : "Save Credential";
    }
  }

  async function deleteItem(itemId) {
    requireAuth(async () => {
      const item = state.items.find(i => i.id == itemId);
      const title = item ? `"${item.title}"` : "this credential";
      if (!confirm(`Are you sure you want to remove ${title} from your database? This will also remove any attached certificate file.`)) {
        return;
      }

      try {
        const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          showToast("Credential removed successfully", "success");
          await loadStats();
          await loadCategories();
          await loadItems();
        } else {
          showToast(json.error || "Failed to delete item", "error");
        }
      } catch (err) {
        console.error('Error deleting item:', err);
        showToast("Error deleting credential: " + err.message, "error");
      }
    });
  }

  /* ---------------- Document / Certificate Viewer Modal ---------------- */
  function openViewer(item) {
    state.selectedItem = item;

    el.viewerTitle.textContent = item.title;
    el.viewerSubtitle.textContent = `${item.category_label || item.category} • ${item.issuer_or_org || ''}`;
    el.viewerCategoryBadge.textContent = item.category_label || item.category;
    el.viewerSubcategory.textContent = item.subcategory || '';
    el.viewerIssuer.textContent = item.issuer_or_org || '-';
    el.viewerDate.textContent = item.event_date || '-';
    el.viewerYear.textContent = item.year || '-';
    el.viewerIdentifier.textContent = item.identifier || 'No ID';
    el.viewerScore.textContent = item.score_or_grade || '-';

    if (item.url) {
      el.viewerUrlLink.href = item.url;
      el.viewerUrlLink.classList.remove('hidden');
    } else {
      el.viewerUrlLink.classList.add('hidden');
    }

    if (item.extra_obj && Object.keys(item.extra_obj).length > 0) {
      el.viewerExtraDetails.innerHTML = Object.entries(item.extra_obj).map(([k, v]) => `
        <div><strong class="capitalize">${k.replace('_', ' ')}:</strong> ${escapeHtml(v)}</div>
      `).join('');
      document.getElementById('viewerExtraSection').classList.remove('hidden');
    } else {
      document.getElementById('viewerExtraSection').classList.add('hidden');
    }

    if (item.tags_list && item.tags_list.length > 0) {
      el.viewerTags.innerHTML = item.tags_list.map(t => `
        <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">#${escapeHtml(t)}</span>
      `).join('');
      document.getElementById('viewerTagsSection').classList.remove('hidden');
    } else {
      document.getElementById('viewerTagsSection').classList.add('hidden');
    }

    if (item.file_path) {
      const fileUrl = `/${item.file_path}`;
      el.viewerDownloadBtn.href = fileUrl;
      el.viewerDownloadBtn.download = item.file_name || 'certificate';
      el.viewerDownloadBtn.classList.remove('hidden');

      el.viewerNewTabBtn.href = fileUrl;
      el.viewerNewTabBtn.classList.remove('hidden');

      el.viewerLoading.classList.add('hidden');
      const ext = (item.file_type || '').toLowerCase();

      if (ext === 'pdf') {
        el.pdfFrame.src = fileUrl;
        el.pdfFrame.classList.remove('hidden');
        el.imagePreview.classList.add('hidden');
        el.fileFallback.classList.add('hidden');
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        el.imagePreview.src = fileUrl;
        el.imagePreview.classList.remove('hidden');
        el.pdfFrame.classList.add('hidden');
        el.fileFallback.classList.add('hidden');
      } else {
        el.fallbackDownloadBtn.href = fileUrl;
        el.fileFallback.classList.remove('hidden');
        el.pdfFrame.classList.add('hidden');
        el.imagePreview.classList.add('hidden');
      }
    } else {
      el.viewerDownloadBtn.classList.add('hidden');
      el.viewerNewTabBtn.classList.add('hidden');
      el.pdfFrame.classList.add('hidden');
      el.imagePreview.classList.add('hidden');
      el.viewerLoading.classList.add('hidden');
      el.fileFallback.classList.remove('hidden');
      el.fileFallback.innerHTML = `
        <i data-lucide="file-question" class="w-16 h-16 mx-auto text-slate-500"></i>
        <div class="text-sm font-semibold">No certificate document attached to this credential yet.</div>
        <button class="mt-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold" onclick="closeViewer(); openEditModal(${item.id});">
          Upload Document Now
        </button>
      `;
    }

    el.viewerModal.classList.remove('hidden');
    lucide.createIcons();
  }

  function closeViewer() {
    el.viewerModal.classList.add('hidden');
    el.pdfFrame.src = '';
    el.imagePreview.src = '';
  }

  /* ---------------- Event Listeners Setup ---------------- */
  function setupEventListeners() {
    // Theme toggle
    el.themeToggle.addEventListener('click', toggleTheme);

    // Auth Modal Triggers
    el.openLoginModalBtn.addEventListener('click', openLoginModal);
    el.closeLoginModalBtn.addEventListener('click', closeLoginModal);

    // Auto-fill demo credentials
    el.fillDemoLoginBtn.addEventListener('click', () => {
      el.loginUsername.value = 'admin';
      el.loginPassword.value = 'admin';
    });

    // Toggle Password Visibility
    el.togglePassVisibility.addEventListener('click', () => {
      const type = el.loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      el.loginPassword.setAttribute('type', type);
    });

    // Login Form Submit
    el.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = el.loginUsername.value.trim();
      const password = el.loginPassword.value;

      el.loginBtnText.textContent = "Verifying...";
      el.loginErrorMsg.classList.add('hidden');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const json = await res.json();

        if (json.success && json.user) {
          state.currentUser = json.user;
          updateAuthUI(true);
          closeLoginModal();
          showToast(json.message || "Signed in successfully!", "success");
        } else {
          el.loginErrorMsg.textContent = json.error || "Invalid credentials";
          el.loginErrorMsg.classList.remove('hidden');
        }
      } catch (err) {
        el.loginErrorMsg.textContent = "Network error: " + err.message;
        el.loginErrorMsg.classList.remove('hidden');
      } finally {
        el.loginBtnText.textContent = "Sign In to Vault";
      }
    });

    // User Dropdown toggle
    el.userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => el.userDropdown.classList.add('hidden'));

    // Logout
    el.logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        state.currentUser = null;
        updateAuthUI(false);
        showToast("Signed out of Vault", "info");
      } catch (err) {
        console.error('Logout error:', err);
      }
    });

    // Change Password Modal
    el.openChangePassBtn.addEventListener('click', () => {
      el.currentPasswordInput.value = '';
      el.newPasswordInput.value = '';
      el.passwordModal.classList.remove('hidden');
    });
    el.closePasswordModalBtn.addEventListener('click', () => el.passwordModal.classList.add('hidden'));
    el.cancelPassBtn.addEventListener('click', () => el.passwordModal.classList.add('hidden'));

    el.passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current_password = el.currentPasswordInput.value;
      const new_password = el.newPasswordInput.value;

      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password, new_password })
        });
        const json = await res.json();
        if (json.success) {
          showToast(json.message, "success");
          el.passwordModal.classList.add('hidden');
        } else {
          showToast(json.error || "Failed to update password", "error");
        }
      } catch (err) {
        showToast("Error updating password: " + err.message, "error");
      }
    });

    // Export Dropdown Toggle
    el.exportMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.exportDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => el.exportDropdown.classList.add('hidden'));

    // Category Tabs click
    el.catContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-pill');
      if (!btn) return;
      const cat = btn.getAttribute('data-category');
      state.currentCategory = cat;
      loadCategories();
      loadItems();
    });

    // Global Search with Debounce
    let searchTimeout;
    const handleSearch = (val) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.searchQuery = val;
        el.clearSearchBtn.classList.toggle('hidden', val.trim() === '');
        loadItems();
      }, 250);
    };
    el.globalSearch.addEventListener('input', (e) => handleSearch(e.target.value));
    el.mobileSearch.addEventListener('input', (e) => handleSearch(e.target.value));
    el.clearSearchBtn.addEventListener('click', () => {
      el.globalSearch.value = '';
      el.mobileSearch.value = '';
      handleSearch('');
    });

    // Filters & Sorting
    el.filterYear.addEventListener('change', (e) => {
      state.currentYear = e.target.value;
      loadItems();
    });
    el.filterTag.addEventListener('change', (e) => {
      state.currentTag = e.target.value;
      loadItems();
    });
    el.sortOrder.addEventListener('change', (e) => {
      state.currentSort = e.target.value;
      loadItems();
    });
    el.resetFiltersBtn.addEventListener('click', () => {
      state.currentCategory = 'all';
      state.searchQuery = '';
      state.currentYear = 'all';
      state.currentTag = '';
      el.globalSearch.value = '';
      el.mobileSearch.value = '';
      el.filterYear.value = 'all';
      el.filterTag.value = '';
      loadCategories();
      loadItems();
    });

    // Quick tag clicks
    document.addEventListener('click', (e) => {
      const tagBtn = e.target.closest('.quick-tag-btn, .item-tag-chip');
      if (tagBtn) {
        const tag = tagBtn.getAttribute('data-tag');
        state.currentTag = tag;
        el.filterTag.value = tag;
        loadItems();
      }
    });

    // View toggles: Grid vs Table
    el.gridViewBtn.addEventListener('click', () => {
      state.currentView = 'grid';
      localStorage.setItem('vault_view', 'grid');
      el.gridViewBtn.className = "p-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm transition";
      el.tableViewBtn.className = "p-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition";
      renderItems();
    });
    el.tableViewBtn.addEventListener('click', () => {
      state.currentView = 'table';
      localStorage.setItem('vault_view', 'table');
      el.tableViewBtn.className = "p-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm transition";
      el.gridViewBtn.className = "p-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition";
      renderItems();
    });

    // Empty state buttons
    el.emptyResetBtn.addEventListener('click', () => el.resetFiltersBtn.click());
    el.emptyAddBtn.addEventListener('click', () => openAddModal());

    // Modal controls
    el.openAddModalBtn.addEventListener('click', () => openAddModal());
    el.closeModalBtn.addEventListener('click', () => el.itemModal.classList.add('hidden'));
    el.cancelModalBtn.addEventListener('click', () => el.itemModal.classList.add('hidden'));
    el.formCategory.addEventListener('change', (e) => onCategoryChange(e.target.value));
    el.itemForm.addEventListener('submit', handleFormSubmit);

    // File Drag & Drop
    el.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.dropZone.classList.add('dragover');
    });
    el.dropZone.addEventListener('dragleave', () => el.dropZone.classList.remove('dragover'));
    el.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      el.dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        el.formFile.files = e.dataTransfer.files;
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    });
    el.formFile.addEventListener('change', () => {
      if (el.formFile.files && el.formFile.files.length > 0) {
        handleSelectedFile(el.formFile.files[0]);
      }
    });
    el.removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.formFile.value = '';
      el.filePreviewBadge.classList.add('hidden');
      el.dropZonePrompt.classList.remove('hidden');
    });

    function handleSelectedFile(file) {
      el.fileNamePreview.textContent = file.name;
      el.fileSizePreview.textContent = formatBytes(file.size);
      el.dropZonePrompt.classList.add('hidden');
      el.filePreviewBadge.classList.remove('hidden');
      el.removeFileFlag.value = "false";
      lucide.createIcons();
    }

    // Grid & Table Event Delegations (View Details, Edit, Delete, View Proof)
    document.addEventListener('click', (e) => {
      const viewProofBtn = e.target.closest('.view-cert-btn');
      if (viewProofBtn) {
        const id = viewProofBtn.getAttribute('data-id');
        const item = state.items.find(i => i.id == id);
        if (item) openViewer(item);
        return;
      }

      const attachBtn = e.target.closest('.attach-cert-btn');
      if (attachBtn) {
        const id = attachBtn.getAttribute('data-id');
        openEditModal(id);
        return;
      }

      const editBtn = e.target.closest('.edit-item-btn');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        openEditModal(id);
        return;
      }

      const delBtn = e.target.closest('.delete-item-btn');
      if (delBtn) {
        const id = delBtn.getAttribute('data-id');
        deleteItem(id);
        return;
      }

      const detailsTrigger = e.target.closest('.view-details-trigger');
      if (detailsTrigger) {
        const id = detailsTrigger.getAttribute('data-id');
        const item = state.items.find(i => i.id == id);
        if (item) openViewer(item);
        return;
      }
    });

    // Viewer modal close
    el.closeViewerBtn.addEventListener('click', closeViewer);

    // Import Modal
    el.openImportModalBtn.addEventListener('click', () => {
      requireAuth(() => el.importModal.classList.remove('hidden'));
    });
    el.closeImportModalBtn.addEventListener('click', () => el.importModal.classList.add('hidden'));
    el.cancelImportBtn.addEventListener('click', () => el.importModal.classList.add('hidden'));
    el.importForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = el.importFileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/import/json', {
          method: 'POST',
          body: formData
        });
        const json = await res.json();
        if (json.success) {
          showToast(json.message, "success");
          el.importModal.classList.add('hidden');
          el.importForm.reset();
          await loadStats();
          await loadCategories();
          await loadItems();
        } else {
          showToast(json.error || "Failed to import JSON", "error");
        }
      } catch (err) {
        showToast("Error importing: " + err.message, "error");
      }
    });

    // Keyboard Shortcuts: ESC closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        el.itemModal.classList.add('hidden');
        closeViewer();
        el.importModal.classList.add('hidden');
        el.exportDropdown.classList.add('hidden');
        closeLoginModal();
        el.passwordModal.classList.add('hidden');
      }
    });
  }

  // Start app
  document.addEventListener('DOMContentLoaded', init);

  window.openEditModal = openEditModal;
  window.closeViewer = closeViewer;

})();
