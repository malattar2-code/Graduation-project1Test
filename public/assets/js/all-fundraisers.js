/**
 * all-fundraisers.js
 * Consolidated external script for the All Fundraisers page.
 * Replaces all inline scripts for CSP/security compliance.
 */

(function () {
  'use strict';

  /* ============================================================
     1. CONFIG & STATE
     ============================================================ */
  const CONFIG = window.APP_CONFIG || {
    categories: [],
    searchQuery: '',
    categoryFilter: ''
  };

  const state = {
    recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
    userType: sessionStorage.getItem('userType') || null
  };

  /* ============================================================
     2. UTILITIES
     ============================================================ */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderIcons(f, id) {
    const uid = id || f.public_id || '0';
    let html = '<div class="fundraiser-Icons">';
    if (f.fundraiser_status !== 'waiting_verification') {
      html += `<span class="icon-wrapper"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;"><defs><linearGradient id="verifiedGrad-${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff9a17;stop-opacity:1"/><stop offset="100%" style="stop-color:#e67e00;stop-opacity:1"/></linearGradient><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="12" cy="12" r="11" fill="url(#verifiedGrad-${uid})" stroke="#fff" stroke-width="0.8"><animate attributeName="r" values="11;11.4;11" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.92;1" dur="3s" repeatCount="indefinite"/></circle><path d="M7 12l3 3 7-7" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="20" stroke-dashoffset="20" filter="url(#glow-${uid})"><animate attributeName="stroke-dashoffset" values="20;0;0;20" dur="3s" repeatCount="indefinite" keyTimes="0;0.3;0.8;1"/><animate attributeName="stroke-width" values="2.5;3;2.5" dur="2s" repeatCount="indefinite"/></path><circle cx="12" cy="12" r="11" fill="none" stroke="#ff9a17" stroke-width="0.5" opacity="0"><animate attributeName="r" values="11;14;16" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0" dur="2.5s" repeatCount="indefinite"/></circle></svg><span class="tooltip tooltip-verified">This campaign account is verified</span></span>`;
    }
    if (f.user_type === 'Charity') {
      html += `<span class="icon-wrapper"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;"><defs><linearGradient id="charityGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2ecc71;stop-opacity:1"/><stop offset="100%" style="stop-color:#27ae60;stop-opacity:1"/></linearGradient><filter id="glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="12" cy="12" r="11" fill="url(#charityGrad-${uid})" stroke="#fff" stroke-width="0.8"><animate attributeName="r" values="11;11.4;11" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.92;1" dur="3s" repeatCount="indefinite"/></circle><path d="M12 15.5 C8 12, 6 9.5, 7 7 C8 5, 10 5, 12 7 C14 5, 16 5, 17 7 C18 9.5, 16 12, 12 15.5" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="28" stroke-dashoffset="28" filter="url(#glow2-${uid})"><animate attributeName="stroke-dashoffset" values="28;0;0;28" dur="3s" repeatCount="indefinite" keyTimes="0;0.3;0.8;1"/><animate attributeName="stroke-width" values="2.2;2.7;2.2" dur="2s" repeatCount="indefinite"/></path><circle cx="12" cy="12" r="11" fill="none" stroke="#2ecc71" stroke-width="0.5" opacity="0"><animate attributeName="r" values="11;14;16" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0" dur="2.5s" repeatCount="indefinite"/></circle></svg><span class="tooltip tooltip-charity">This campaign is for a charity</span></span>`;
    }
    if (f.is_urgent) {
      html += `<span class="icon-wrapper"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" 
      style="display:inline-block;vertical-align:middle;"><defs><linearGradient id="urgentGrad-${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff4757;stop-opacity:1"/><stop offset="100%" style="stop-color:#e84118;stop-opacity:1"/></linearGradient><filter id="glow3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="12" cy="12" r="11" fill="url(#urgentGrad-${uid})" stroke="#fff" stroke-width="0.8"><animate attributeName="r" values="11;11.4;11" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.92;1" dur="3s" repeatCount="indefinite"/></circle><path d="M12 17 L12 6 M7 11 L12 6 L17 11" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="26" stroke-dashoffset="26" filter="url(#glow3-${uid})"><animate attributeName="stroke-dashoffset" values="26;0;0;26" dur="3s" repeatCount="indefinite" keyTimes="0;0.3;0.8;1"/><animate attributeName="stroke-width" values="2.5;3;2.5" dur="2s" repeatCount="indefinite"/></path><path d="M12 17 L12 6 M7 11 L12 6 L17 11" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0" filter="url(#glow3-${uid})"><animate attributeName="opacity" values="0;0.5;0" dur="2s" repeatCount="indefinite" keyTimes="0;0.3;1"/><animateTransform attributeName="transform" type="translate" values="0 2; 0 -3; 0 -4" dur="2s" repeatCount="indefinite" keyTimes="0;0.5;1"/></path><path d="M12 17 L12 6 M7 11 L12 6 L17 11" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0" filter="url(#glow3-${uid})"><animate attributeName="opacity" values="0;0.4;0" dur="2s" repeatCount="indefinite" keyTimes="0;0.3;1" begin="1s"/><animateTransform attributeName="transform" type="translate" values="0 2; 0 -3; 0 -4" dur="2s" repeatCount="indefinite" keyTimes="0;0.5;1" begin="1s"/></path><circle cx="12" cy="12" r="11" fill="none" stroke="#ff4757" stroke-width="0.5" opacity="0"><animate attributeName="r" values="11;14;16" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0" dur="2.5s" repeatCount="indefinite"/></circle></svg><span class="tooltip tooltip-urgent">This campaign urgently needs donations</span></span>`;
    }
    html += '</div>';
    return html;
  }

  function showNotification(message, type) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:4px;
      color:#fff;font-weight:bold;z-index:10000;transition:opacity .3s;
      background:${type === 'success' ? '#28a745' : '#dc3545'};`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  /* ============================================================
     3. USER TYPE BUTTONS (replaces duplicate-ID logic)
     ============================================================ */
  function initUserTypeButtons() {
    document.querySelectorAll('.buttons-container').forEach(container => {
      if (!container) return;
      if (!state.userType || state.userType === 'donor' || state.userType === 'superadmin') {
        // Ensure link exists; if container was emptied by EJS condition, rebuild
        if (!container.querySelector('a.donate-btn')) {
          const box = container.closest('.fundraiser-box');
          const id = box ? box.dataset.fundraiserId : '';
          container.innerHTML = `<a class="donate-btn btn-website" href="/fundraiser/${id}" data-i18n="allFundraisersDonateBtnTgt">Donate</a>`;
        }
      } else if (state.userType === 'requester') {
        container.innerHTML = `<p class="donate-btn btn-website" data-i18n="allFundraisersDonateBtnTgt">Indigent Does Not Donate</p>`;
      }
    });
  }

  /* ============================================================
     4. NAVIGATION & CONTENT TABS
     ============================================================ */
  const contentMap = [
    { menuClass: 'link-content-one',  contentClass: 'lastest-fundraiser-content-box' },
    { menuClass: 'link-content-two',  contentClass: 'popular-fundraiser-content-box' },
    { menuClass: 'link-content-three',contentClass: 'fundraiser-in-your-area-content-box' },
    { menuClass: 'link-content-four', contentClass: 'saved-fundraisers-content-box' },
    { menuClass: 'link-content-five',contentClass: 'almost-done-fundraisers-content-box' },
    { menuClass: 'link-content-six',  contentClass: 'charity-fundraisers-content-box' },
    // link-content-seven is excluded - it's a pure link to /categories
  ];

  function hideAllContent() {
    contentMap.forEach(c => {
      if (!c.contentClass) return;
      const el = document.querySelector('.' + c.contentClass);
      if (el) el.style.display = 'none';
    });
    const searchBox = document.querySelector('.search-results-content-box');
    if (searchBox) searchBox.style.display = 'none';
  }

  function initContent() {
    const url = new URLSearchParams(window.location.search);
    const hasSearch = url.get('search') || CONFIG.searchQuery || url.get('category') || CONFIG.categoryFilter;

    if (hasSearch) {
      hideAllContent();
      const searchBox = document.querySelector('.search-results-content-box');
      if (searchBox) searchBox.style.display = 'block';
      document.querySelectorAll('.links li').forEach(li => li.classList.remove('active-li'));
    } else {
      hideAllContent();
      const latest = document.querySelector('.lastest-fundraiser-content-box');
      if (latest) latest.style.display = 'block';
      const first = document.querySelector('.links li');
      if (first) first.classList.add('active-li');
    }
  }

    function initNavigation() {
    const items = document.querySelectorAll('.links li');
    items.forEach((item, idx) => {
      const btn = item.querySelector('a');
      if (!btn) return;
      
      // Skip link-content-seven - it's a pure link
      if (item.classList.contains('link-content-seven')) return;
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        items.forEach(i => i.classList.remove('active-li'));
        hideAllContent();
        item.classList.add('active-li');
        if (contentMap[idx] && contentMap[idx].contentClass) {
          const sec = document.querySelector('.' + contentMap[idx].contentClass);
          if (sec) {
            sec.style.display = 'block';
            // Lazy load content if empty
            const container = sec.querySelector('.fundraisers-boxes');
            if (container && !container.children.length) {
              const sectionMap = {
                'lastest-fundraiser-content-box': 'latest',
                'popular-fundraiser-content-box': 'popular',
                'fundraiser-in-your-area-content-box': 'local',
                'saved-fundraisers-content-box': 'saved',
                'almost-done-fundraisers-content-box': 'almostDone',
                'charity-fundraisers-content-box': 'charity'
              };
              const section = sectionMap[contentMap[idx].contentClass];
              if (section) loadPage(section, 1);
            }
          }
        }
        closeMobileMenu();
      });
    });
  }

  /* ============================================================
     5. MOBILE SIDEBAR MENU
     ============================================================ */
  const menuBtn = document.querySelector('.access-links-btn');
  const mobileMenu = document.querySelector('.access-links');
  const overlay = document.querySelector('.overlay');

  function openMobileMenu() {
    if (mobileMenu) mobileMenu.classList.add('active');
    if (overlay) overlay.classList.add('active');
    if (menuBtn) menuBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileMenu() {
    if (mobileMenu) mobileMenu.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (menuBtn) menuBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  function initMobileMenu() {
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu && mobileMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu();
      });
    }
    if (overlay) overlay.addEventListener('click', closeMobileMenu);
    if (mobileMenu) mobileMenu.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) closeMobileMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 480 && mobileMenu && mobileMenu.classList.contains('active')) closeMobileMenu();
    });
  }

  /* ============================================================
     6. TOP-RIGHT DROPDOWN MENU
     ============================================================ */
  function initDropdownMenu() {
    const btn = document.getElementById('menuButton');
    const menu = document.getElementById('dropdownMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      menu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('show');
    });
  }

  /* ============================================================
     7. SEARCH & AUTOCOMPLETE
     ============================================================ */
  function initSearch() {
    const searchInput = document.getElementById('search-input');
    const catFilter = document.getElementById('categoryFilter');
    const form = document.getElementById('searchForm');
    const autoBox = document.getElementById('autocomplete-box');
    const list = document.getElementById('suggestions-list');
    const recentWrap = document.getElementById('recent-tags');
    const clearBtn = document.getElementById('clear-recent');
    const categories = CONFIG.categories || [];

    if (!searchInput || !form) return;

    function displayRecent() {
      if (!recentWrap) return;
      recentWrap.innerHTML = '';
      state.recentSearches.slice(0, 5).forEach(term => {
        const tag = document.createElement('div');
        tag.className = 'recent-tag';
        tag.textContent = term;
        tag.addEventListener('click', () => {
          searchInput.value = '';
          if (catFilter) catFilter.value = '';
          const arr = Array.isArray(categories) ? categories : [];
          if (arr.includes(term)) { if (catFilter) catFilter.value = term; }
          else { searchInput.value = term; }
          form.submit();
        });
        recentWrap.appendChild(tag);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.recentSearches = [];
        localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
        displayRecent();
      });
    }

    // Static server-rendered suggestions
    document.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', function () {
        const cat = this.dataset.category;
        searchInput.value = '';
        if (catFilter) catFilter.value = cat;
        addRecent(cat);
        form.submit();
      });
    });

    function addRecent(term) {
      if (!term || state.recentSearches.includes(term)) return;
      state.recentSearches.unshift(term);
      if (state.recentSearches.length > 5) state.recentSearches.pop();
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
      displayRecent();
    }

    function showSuggestions(val) {
      if (!list) return;
      list.innerHTML = '';
      const recentContainer = document.getElementById('recent-searches-container');
      if (recentContainer) recentContainer.style.display = 'none';

      const arr = Array.isArray(categories) ? categories : [];
      const filtered = arr.filter(c => c.toLowerCase().includes(val.toLowerCase()));
      if (!filtered.length) { hideSuggestions(); return; }

      filtered.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.dataset.category = cat;
        div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hash" viewBox="0 0 16 16">
          <path d="M8.39 12.648a1 1 0 0 0-.015.18c0 .305.21.508.5.508.266 0 .492-.172.555-.477l.554-2.703h1.204c.421 0 .617-.234.617-.547 0-.312-.188-.53-.617-.53h-.985l.516-2.524h1.265c.43 0 .618-.227.618-.547 0-.313-.188-.524-.618-.524h-1.046l.476-2.304a1 1 0 0 0 .016-.164.51.51 0 0 0-.516-.516.54.54 0 0 0-.539.43l-.523 2.554H7.617l.477-2.304c.008-.04.015-.118.015-.164a.51.51 0 0 0-.523-.516.54.54 0 0 0-.531.43L6.53 5.484H5.414c-.43 0-.617.22-.617.532s.187.539.617.539h.906l-.515 2.523H4.609c-.421 0-.609.219-.609.531s.188.547.61.547h.976l-.516 2.492c-.008.04-.015.125-.015.18 0 .305.21.508.5.508.265 0 .492-.172.554-.477l.555-2.703h2.242zm-1-6.109h2.266l-.515 2.563H6.859l.532-2.563z"/>
        </svg> ${escapeHtml(cat)}`;
        div.addEventListener('click', () => {
          searchInput.value = '';
          if (catFilter) catFilter.value = cat;
          addRecent(cat);
          form.submit();
        });
        list.appendChild(div);
      });
      if (autoBox) autoBox.classList.add('visible');
    }

    function hideSuggestions() { if (autoBox) autoBox.classList.remove('visible'); }
    function showAutoBox() {
      const rc = document.getElementById('recent-searches-container');
      if (rc) rc.style.display = state.recentSearches.length ? 'block' : 'none';
      if (autoBox) autoBox.classList.add('visible');
    }

    searchInput.addEventListener('focus', () => searchInput.value.length ? showSuggestions(searchInput.value) : showAutoBox());
    searchInput.addEventListener('input', () => searchInput.value.length ? showSuggestions(searchInput.value) : showAutoBox());

    document.addEventListener('click', e => {
      if (!searchInput.contains(e.target) && (!autoBox || !autoBox.contains(e.target))) hideSuggestions();
    });

    form.addEventListener('submit', () => {
      const val = searchInput.value.trim();
      if (val && catFilter && !catFilter.value) catFilter.value = '';
      if (val || (catFilter && catFilter.value)) addRecent(val || catFilter.value);
    });

    displayRecent();
  }

  function loadTrendingHashtags() {
    const box = document.getElementById('trending-hashtags');
    if (!box) return;
    fetch('/api/hashtags/popular?limit=8')
      .then(r => r.json())
      .then(data => {
        if (!data || !data.length) return;
        box.innerHTML = data.map(h => `<span class="hashtag-chip" data-tag="${escapeHtml(h.tag_name)}" style="background:#fff3e0;color:#e65100;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;">#${escapeHtml(h.tag_name)}</span>`).join('');
        box.querySelectorAll('.hashtag-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const si = document.getElementById('search-input');
            const cf = document.getElementById('categoryFilter');
            const sf = document.getElementById('searchForm');
            if (si) si.value = chip.dataset.tag;
            if (cf) cf.value = '';
            if (sf) sf.submit();
          });
        });
      })
      .catch(console.error);
  }

  /* ============================================================
     8. CARD RENDERERS (for AJAX pagination)
     ============================================================ */
  function renderStandardCard(f) {
    const cats = (f.fundraiser_categories && f.fundraiser_categories.length)
      ? `<div class="fundraiser-categories">${f.fundraiser_categories.map(c => `<span class="category-tag">${escapeHtml(c)}</span>`).join('')}</div>` : '';
    const tags = (f.fundraiser_hashtags && f.fundraiser_hashtags.length)
      ? `<div class="fundraiser-hashtags" style="display:flex;flex-wrap:wrap;gap:5px;margin:5px 0;">${f.fundraiser_hashtags.map(t => `<span class="hashtag-tag" style="background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:12px;font-size:11px;">#${escapeHtml(t)}</span>`).join('')}</div>` : '';

    return `
      <div class="fundraiser-box" data-fundraiser-id="${f.public_id}">
        <div class="fundraiser-account" data-account-link="/indigent-account/${f.fundraiser_user_id}" style="cursor:pointer;">
          ${f.user_image ? `<img src="${escapeHtml(f.user_image)}" alt="${escapeHtml(f.user_name)}'s Profile" onerror="this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'">`
                        : `<img src="/assets/image/Fundraiser-Page/header-sec/man-profile.png" alt="Default Profile">`}
          <h1 class="account-name">${escapeHtml(f.user_name)}</h1>${renderIcons(f, f.public_id)}
        </div>
        <div class="fundraiser-img" style="background:url('${escapeHtml(f.fundraiser_main_image)}') center/cover;cursor:pointer;" data-fundraiser-link="/fundraiser/${f.public_id}"></div>
        <div class="fundraiser-title">
          <h2 class="main-title">${escapeHtml(f.fundraiser_title)}</h2>
          <span>${escapeHtml(f.user_location)}</span>
        </div>
        ${cats}${tags}
        <p class="fundraiser-des">${f.fundraiser_description.length > 150 ? f.fundraiser_description.substring(0,150)+'...' : f.fundraiser_description}</p>
        <div class="fundraiser-btns">
          <div class="flex-btns">
            <a class="donate-later-btn btn-website save-fundraiser-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-bookmark-plus" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4"/>
              </svg>
            </a>
            <div class="donation-bar">
              <div class="donation-scale"><div class="donation-progress" style="width:${f.progressWidth||'0%'}"></div></div>
              <div class="donation-money-number"><div class="money" data-goal="${f.fundraiser_target_amount}">$${f.fundraiser_collected_amount} / $${f.fundraiser_target_amount}</div></div>
            </div>
          </div>
          <div class="btns buttons-container">
            <a class="donate-btn btn-website" href="/fundraiser/${f.public_id}" data-i18n="allFundraisersDonateBtnTgt">Donate</a>
          </div>
        </div>
      </div>`;
  }

  function renderCharityCard(f) {
    const submitted = f.user_has_submitted ? 'campaign-submitted' : '';
    const full = (f.form_current >= f.form_target) ? 'campaign-full' : '';
    let status = '', btn = '';
    if (f.user_has_submitted) {
      status = `<div class="money" style="color:#28a745;font-weight:bold;">✓ Form Filled Out</div>`;
      btn = `<button class="btn-website fill-form" style="background:#6c757d;cursor:not-allowed;opacity:.7;" disabled>✓ Already Filled</button>`;
    } else if (f.form_current >= f.form_target) {
      status = `<div class="money" style="color:#dc3545;font-weight:bold;">✕ Target Reached</div>`;
      btn = `<button class="btn-website fill-form" style="background:#dc3545;cursor:not-allowed;opacity:.7;" disabled>✕ Target Reached</button>`;
    } else {
      status = `<div class="money" style="color:#6f42c1;font-weight:bold;">📝 Form Available (${f.form_current}/${f.form_target})</div>`;
      btn = `<a href="/fundraiser-requester-form/${f.public_id}" class="btn-website fill-form" style="background:#6f42c1;">Fill Form</a>`;
    }
    const cats = (f.fundraiser_categories && f.fundraiser_categories.length)
      ? `<div class="fundraiser-categories">${f.fundraiser_categories.map(c => `<span class="category-tag">${escapeHtml(c)}</span>`).join('')}</div>` : '';

    return `
      <div class="fundraiser-box ${submitted} ${full}" data-fundraiser-id="${f.public_id}">
        <div class="fundraiser-account" data-account-link="/indigent-account/${f.fundraiser_user_id}" style="cursor:pointer;">
          ${f.user_image ? `<img src="${escapeHtml(f.user_image)}" alt="${escapeHtml(f.user_name)}'s Profile" onerror="this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'">`
                        : `<img src="/assets/image/Fundraiser-Page/header-sec/man-profile.png" alt="Default Profile">`}
          <h1 class="account-name">${escapeHtml(f.user_name)}</h1>${renderIcons(f, f.public_id)}
        </div>
        <div class="fundraiser-img" style="background:url('${escapeHtml(f.fundraiser_main_image)}') center/cover;"></div>
        <div class="fundraiser-title">
          <h2 class="main-title">${escapeHtml(f.fundraiser_title)}</h2>
          <span>${escapeHtml(f.user_location)}</span>
        </div>
        ${cats}
        <p class="fundraiser-des">${f.fundraiser_description.length > 150 ? f.fundraiser_description.substring(0,150)+'...' : f.fundraiser_description}</p>
        <div class="fundraiser-btns">
          <div class="flex-btns">
            <div class="donation-bar" style="background:transparent;">
              <div class="donation-money-number" style="margin-top:4px;">${status}</div>
            </div>
          </div>
          ${btn}
        </div>
      </div>`;
  }

  function renderCards(list) {
    if (!list || !list.length) return '';
    return list.map(f => f.fundraiser_status === 'Waiting_requesters' ? renderCharityCard(f) : renderStandardCard(f)).join('');
  }

  /* ============================================================
     9. PAGINATION
     ============================================================ */
  function containerId(section) {
    const map = {
      latest:'latestFundraisersContainer', popular:'popularFundraisersContainer',
      local:'localFundraisersContainer', almostDone:'almostDoneFundraisersContainer',
      saved:'savedFundraisersContainer', search:'searchResultsContainer'
    };
    return map[section];
  }

  function updatePaginationUI(section, current, total) {
    const wrap = document.querySelector('.' + section + '-pagination');
    if (!wrap) return;
    const prev = wrap.querySelector('.prev-page-btn');
    const next = wrap.querySelector('.next-page-btn');
    const info = wrap.querySelector('.page-info');
    if (prev) { prev.disabled = current <= 1; prev.dataset.page = current - 1; }
    if (next) { next.disabled = current >= total; next.dataset.page = current + 1; }
    if (info) info.textContent = `Page ${current} of ${total}`;
  }

  async function loadPage(section, page) {
    const wrap = document.querySelector('.' + section + '-pagination');
    const prev = wrap?.querySelector('.prev-page-btn');
    const next = wrap?.querySelector('.next-page-btn');
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;

    try {
      const params = new URLSearchParams({ section, page });
      if (section === 'search') {
        const si = document.getElementById('search-input');
        const cf = document.getElementById('categoryFilter');
        if (si && si.value) params.append('search', si.value);
        if (cf && cf.value) params.append('category', cf.value);
      }
      const res = await fetch('/all-fundraisers/load-more?' + params.toString());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const box = document.getElementById(containerId(section));
      if (box && data.fundraisers) box.innerHTML = renderCards(data.fundraisers);
      updatePaginationUI(section, data.currentPage, data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      if (prev) prev.disabled = false;
      if (next) next.disabled = false;
    }
  }

  function initPagination() {
    document.querySelectorAll('.prev-page-btn, .next-page-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const page = parseInt(this.dataset.page);
        if (isNaN(page)) return;
        const wrap = this.closest('.pagination-controls');
        if (!wrap) return;
        const section = wrap.dataset.section;
        if (!section) return;
        loadPage(section, page);
      });
    });
  }

  /* ============================================================
     10. SAVE FUNDRAISER
     ============================================================ */
  function getFundraiserId(btn) {
    const box = btn.closest('[data-fundraiser-id]');
    if (box) return box.dataset.fundraiserId;
    const dBtn = btn.closest('.fundraiser-btns')?.querySelector('.donate-btn');
    if (dBtn && dBtn.href) {
      const m = dBtn.href.match(/\/fundraiser\/(\d+)/);
      if (m) return m[1];
    }
    return null;
  }

  async function checkSaved(id) {
    try {
      const r = await fetch(`/saved-fundraisers/check/${id}`, { headers: { 'Accept':'application/json' } });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      return d.isSaved;
    } catch (e) { return false; }
  }

  function setSaveIcon(btn, saved) {
    const icon = btn.querySelector('svg');
    if (!icon) return;
    if (saved) {
      btn.classList.add('saved'); btn.title = 'Remove from saved';
      icon.innerHTML = `<path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>`;
    } else {
      btn.classList.remove('saved'); btn.title = 'Save fundraiser';
      icon.innerHTML = `<path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
        <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4"/>`;
    }
  }

  async function toggleSave(btn) {
    try {
      const id = getFundraiserId(btn);
      if (!id) return;
      const saved = await checkSaved(id);
      const url = saved ? `/saved-fundraisers/unsave/${id}` : `/saved-fundraisers/save/${id}`;
      const method = saved ? 'DELETE' : 'POST';
      const r = await fetch(url, { method, headers: { 'Accept':'application/json' } });
      if (!r.ok) throw new Error('Save failed');
      const d = await r.json();
      setSaveIcon(btn, !saved);
      showNotification(d.message || (saved ? 'Removed from saved' : 'Saved successfully'), 'success');
    } catch (e) {
      console.error(e);
      showNotification('Failed to update saved status', 'error');
    }
  }

  async function initSaveButtons() {
    for (const btn of document.querySelectorAll('.save-fundraiser-btn')) {
      const id = getFundraiserId(btn);
      if (id) setSaveIcon(btn, await checkSaved(id));
    }
    document.addEventListener('click', e => {
      const btn = e.target.closest('.save-fundraiser-btn');
      if (btn) { e.preventDefault(); toggleSave(btn); }
    });
  }

  /* ============================================================
     11. i18n
     ============================================================ */
  function initI18n() {
    if (typeof i18next === 'undefined') { console.error('i18next missing'); return; }
    const resources = {
      en: { translation: {
        "dropdownHomeTgt":"Home","dropdownDashboardTgt":"Dashboard","dropdownFundraisersTgt":"Fundraisers",
        "dropdownCategoriesTgt":"Categories","dropdownContactTgt":"Contact Us","dropdownLanguageTgt":"Language",
        "notificationsTitleTgt":"Notifications",
        "allFundraisersLinkOneTgt":"Lastest Fundraiser","allFundraisersLinkTwoTgt":"Popular Fundraiser",
        "allFundraisersLinkThreeTgt":"Fundraiser In Your Area","allFundraisersLinkFourTgt":"Saved Fundraisers",
        "allFundraisersLinkFiveTgt":"Almost Done Fundraisers","allFundraisersLinkSixTgt":"Charity Campaigns",
        "allFundraisersLinkSevenTgt":"Categories",
        "searchPlaceholder":"Search..","searchRecentSearchesTgt":"Recent Searches",
        "searchRecentSearchesClearBtnTgt":"Clear all","searchContainerSuggestTitleTgt":"Suggested searches :",
        "allFundraisersCategoriesOneTgt":"environment","allFundraisersCategoriesTwoTgt":"poverty",
        "allFundraisersCategoriesThreeTgt":"Education","allFundraisersCategoriesFourTgt":"gaza",
        "allFundraisersCategoriesFiveTgt":"Orphans","allFundraisersCategoriesSixTgt":"disabilities",
        "allFundraisersCategoriesSevenTgt":"health care",
        "allFundraisersDonateBtnTgt":"Donate",
        "allFundraisersShowMoreBtnTgt":"Show More ",
        //_______________________________________________
        "allFundraisersNoResultTitleSearchTgt":"No Results Found",
        "allFundraisersNoResultDesSearchTgt":"No fundraisers match your search criteria. Try different keywords or categories or hastag",
        "allFundraisersNoResultTitleLastestTgt":"No Latest Fundraisers",
        "allFundraisersNoResultDesLastestTgt":"Check back later for new fundraising campaigns.",
        "allFundraisersNoResultTitlePopularTgt":"No Trending Fundraisers",
        "allFundraisersNoResultDesPopularTgt":"No fundraisers are currently trending. Be the first to create one!",
        "allFundraisersNoResultTitleAreaTgt":"No Fundraisers in Your Country",
        "allFundraisersNoResultDesAreaTgt":"No fundraisers found from your country. Try expanding your search.",
        "allFundraisersNoResultTitleAlmostTgt":"No Fundraisers Close to The Goal",
        "allFundraisersNoResultDesAlmostTgt":"No fundraisers are currently close to reaching their targets.",
        "allFundraisersNoResultTitleSavedTgt":"No Saved Fundraisers",
        "allFundraisersNoResultDesSavedTgt":"Check back later for new fundraising campaigns.",
        "allFundraisersNoResultTitleCharityTgt":"No Available Campaign Forms",
        "allFundraisersNoResultDesCharityTgt":"No charity campaigns are currently accepting requests.",

      }},
      ar: { translation: {
        "dropdownHomeTgt":"الرئيسية","dropdownDashboardTgt":"لوحة التحكم","dropdownFundraisersTgt":"حملات التبرع",
        "dropdownCategoriesTgt":"التصنيفات","dropdownContactTgt":"تواصل معنا","dropdownLanguageTgt":"اللغة",
        "notificationsTitleTgt":"الإشعارات",
        "allFundraisersLinkOneTgt":"أحدث حملات التبرع","allFundraisersLinkTwoTgt":"حملات التبرع الأكثر تفاعلاً",
        "allFundraisersLinkThreeTgt":"حملات التبرع في منطقتك","allFundraisersLinkFourTgt":"حملات التبرع التي تم حفظها",
        "allFundraisersLinkFiveTgt":"حملات التبرع شبه المكتملة","allFundraisersLinkSixTgt":"حملات الجمعيات الخيرية",
        "allFundraisersLinkSevenTgt":"التصنيفات",
        "searchPlaceholder":"ابحث..","searchRecentSearchesTgt":"عمليات البحث الأخيرة",
        "searchRecentSearchesClearBtnTgt":"مسح الكل","searchContainerSuggestTitleTgt":"اقتراحات البحث :",
        "allFundraisersCategoriesOneTgt":"البيئة","allFundraisersCategoriesTwoTgt":"الفقر",
        "allFundraisersCategoriesThreeTgt":"التعليم","allFundraisersCategoriesFourTgt":"غزة",
        "allFundraisersCategoriesFiveTgt":"أيتام","allFundraisersCategoriesSixTgt":"ذوي الإحتياجات",
        "allFundraisersCategoriesSevenTgt":"الرعاية الصحية",
        "allFundraisersDonateBtnTgt":"تبرع الآن","allFundraisersShowMoreBtnTgt":"عرض المزيد",
        //_______________________________________________________________
        "allFundraisersNoResultTitleSearchTgt":"لم يتم العثور على نتائج",
        "allFundraisersNoResultDesSearchTgt":"لا توجد حملات تبرعات مطابقة لمعايير بحثك. جرب كلمات مفتاحية أو فئات",
        "allFundraisersNoResultTitleLastestTgt":"لا توجد حملات تبرعات حديثة",
        "allFundraisersNoResultDesLastestTgt":"تحقق لاحقًا من حملات التبرعات الجديدة",
        "allFundraisersNoResultTitlePopularTgt":"لا توجد حملات تبرعات رائجة",
        "allFundraisersNoResultDesPopularTgt":"لا توجد حملات تبرعات رائجة حاليًا. كن أول من ينشئ واحدة",
        "allFundraisersNoResultTitleAreaTgt":"لا توجد حملات تبرعات في بلدك",
        "allFundraisersNoResultDesAreaTgt":"لم يتم العثور على أي جهات لجمع التبرعات من بلدك. حاول توسيع نطاق بحثك",
        "allFundraisersNoResultTitleAlmostTgt":"لا توجد جهات لجمع التبرعات قريبة من تحقيق الهدف",
        "allFundraisersNoResultDesAlmostTgt":"لا توجد جهات لجمع التبرعات قريبة من تحقيق أهدافها حاليًا",
        "allFundraisersNoResultTitleSavedTgt":"لا توجد جهات لجمع التبرعات محفوظة",
        "allFundraisersNoResultDesSavedTgt":"تحقق لاحقًا من حملات جمع التبرعات الجديدة",
        "allFundraisersNoResultTitleCharityTgt":"لا توجد نماذج حملات متاحة",
        "allFundraisersNoResultDesCharityTgt":"لا توجد حملات خيرية تقبل الطلبات حاليًا",
      }}
    };

    i18next.use(window.i18nextHttpBackend).use(window.i18nextBrowserLanguageDetector).init({
      fallbackLng:'en', debug:false, resources
    }, err => { if (!err) updateI18nContent(); });

    const enBtn = document.getElementById('en-btn');
    const arBtn = document.getElementById('ar-btn');
    if (enBtn) enBtn.addEventListener('click', () => { i18next.changeLanguage('en'); setLangBtn('en'); });
    if (arBtn) arBtn.addEventListener('click', () => { i18next.changeLanguage('ar'); setLangBtn('ar'); });

    function setLangBtn(lang) {
      if (enBtn) enBtn.classList.toggle('active', lang === 'en');
      if (arBtn) arBtn.classList.toggle('active', lang === 'ar');
    }
    function updateI18nContent() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.placeholder !== undefined) el.placeholder = i18next.t(key);
        else el.innerHTML = i18next.t(key);
      });
      if (i18next.language === 'ar') { document.body.classList.add('rtl'); document.body.setAttribute('dir','rtl'); }
      else { document.body.classList.remove('rtl'); document.body.setAttribute('dir','ltr'); }
    }
    i18next.on('languageChanged', updateI18nContent);
    if (navigator.language.startsWith('ar')) { i18next.changeLanguage('ar'); setLangBtn('ar'); }
  }

  function initLanguageMenu() {
    const langMenu = document.getElementById('languageMenu');
    const switcher = document.getElementById('languageSwitcher');
    const dropdown = document.getElementById('dropdownMenu');
    if (langMenu) {
      langMenu.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); switcher.classList.toggle('show'); switcher.classList.toggle('flex'); });
    }
    document.addEventListener('click', e => {
      if (dropdown && !dropdown.contains(e.target) && switcher) switcher.classList.remove('show','flex');
    });
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.addEventListener('click', function () {
        document.querySelectorAll('.lang-btn').forEach(x => x.classList.remove('active'));
        this.classList.add('active');
        if (switcher) switcher.classList.remove('show','flex');
      });
    });
    if (switcher) switcher.addEventListener('click', e => e.stopPropagation());
  }

  /* ============================================================
     12. CONTROL PANEL / DASHBOARD LINK
     ============================================================ */
  function initControlPanel() {
    const btn = document.getElementById('controlPanelBtn');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      const ut = sessionStorage.getItem('userType');
      if (!ut) { window.location.href = '/register'; return; }
      if (ut === 'superadmin') window.location.href = '/admin';
      else if (ut === 'requester') window.location.href = '/userPanelIndigent';
      else if (ut === 'Donor') window.location.href = '/UserPanelDonor';
      else console.log('Please specify a valid user type');
    });
  }

  /* ============================================================
     13. EVENT DELEGATION (replaces inline onclick handlers)
     ============================================================ */
  function initCardDelegation() {
    const main = document.querySelector('.main-content-all-fundraisers');
    if (!main) return;
    main.addEventListener('click', e => {
      const account = e.target.closest('.fundraiser-account[data-account-link]');
      if (account) { window.location.href = account.dataset.accountLink; return; }
      const img = e.target.closest('.fundraiser-img[data-fundraiser-link]');
      if (img) { window.location.href = img.dataset.fundraiserLink; }
    });
  }

  /* ============================================================
     14. OWL CAROUSEL & LIBRARY FALLBACKS
     ============================================================ */
  function loadScript(src, onLoad) {
    const s = document.createElement('script'); s.src = src; s.onload = onLoad; s.onerror = () => console.warn('Failed to load '+src); document.head.appendChild(s);
  }
  function initOwl() {
    if (typeof jQuery !== 'undefined' && jQuery.fn.owlCarousel) {
      jQuery('.owl-carousel').owlCarousel({ loop:true, items:1, responsive:{768:{items:3}}, autoplay:false, dots:true, nav:true, margin:10, autoplayTimeout:5000, autoplayHoverPause:true });
    }
  }
  function initLibraries() {
    if (typeof jQuery === 'undefined') loadScript('https://code.jquery.com/jquery-3.6.0.min.js', () => {
      if (typeof jQuery.fn.owlCarousel === 'undefined') loadScript('https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js', initOwl);
      else initOwl();
    }); else initOwl();

    if (typeof i18next === 'undefined') {
      loadScript('https://unpkg.com/i18next@21.9.2/dist/umd/i18next.min.js', () => {
        loadScript('https://unpkg.com/i18next-http-backend@1.4.1/i18nextHttpBackend.min.js', () => {
          loadScript('https://unpkg.com/i18next-browser-languagedetector@7.0.1/i18nextBrowserLanguageDetector.min.js', initI18n);
        });
      });
    } else initI18n();
  }

  /* ============================================================
     15. BOOT
     ============================================================ */
  function boot() {
    initContent();
    initNavigation();
    initMobileMenu();
    initDropdownMenu();
    initSearch();
    loadTrendingHashtags();
    initPagination();
    initSaveButtons();
    initControlPanel();
    initLanguageMenu();
    initUserTypeButtons();
    initCardDelegation();
    initLibraries();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();