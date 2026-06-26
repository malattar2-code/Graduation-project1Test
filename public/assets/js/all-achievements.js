/**
 * All Achievements Page - Consolidated Frontend Logic
 * Handles: navigation tabs, mobile menu, like buttons, share, search
 */

(function () {
  'use strict';

  /* ============================================================
     1. CONFIG & STATE
     ============================================================ */
  const state = {
    userType: sessionStorage.getItem('userType') || null
  };

  /* ============================================================
     2. UTILITIES
     ============================================================ */
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
     3. NAVIGATION & CONTENT TABS
     ============================================================ */
  const contentMap = [
    { menuClass: 'link-content-one',  contentClass: 'lastest-achievements-content-box' },
    { menuClass: 'link-content-two',  contentClass: 'milestone-achievements-content-box' },
    { menuClass: 'link-content-three',contentClass: 'final-achievements-content-box' },
    // link-content-four is "Back to Fundraisers" link - excluded from tab switching
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
    const hasSearch = url.get('search');

    if (hasSearch) {
      hideAllContent();
      const searchBox = document.querySelector('.search-results-content-box');
      if (searchBox) searchBox.style.display = 'block';
      document.querySelectorAll('.links li').forEach(li => li.classList.remove('active-li'));
    } else {
      hideAllContent();
      const latest = document.querySelector('.lastest-achievements-content-box');
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

      // Skip link-content-four (it's a real link to /all-fundraisers)
      if (item.classList.contains('link-content-four')) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        items.forEach(i => i.classList.remove('active-li'));
        hideAllContent();
        item.classList.add('active-li');
        if (contentMap[idx] && contentMap[idx].contentClass) {
          const sec = document.querySelector('.' + contentMap[idx].contentClass);
          if (sec) sec.style.display = 'block';
        }
        closeMobileMenu();
      });
    });
  }

  /* ============================================================
     4. MOBILE SIDEBAR MENU
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
     5. DROPDOWN MENU
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
     6. LIKE BUTTONS
     ============================================================ */
  async function checkLikeStatus(achievementId) {
    try {
      const res = await fetch(`/api/achievement/${achievementId}/like-status`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      return { liked: false, likeCount: 0 };
    }
  }

  function updateLikeButton(btn, liked, likeCount) {
    const svg = btn.querySelector('svg');
    const countSpan = btn.querySelector('.like-count');

    if (liked) {
      btn.classList.add('liked');
      // Remove inline styles - let CSS handle it
      btn.style.color = '';
      btn.style.borderColor = '';
      btn.style.background = '';
      if (svg) {
        svg.innerHTML = '<path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>';
      }
    } else {
      btn.classList.remove('liked');
      btn.style.color = '';
      btn.style.borderColor = '';
      btn.style.background = '';
      if (svg) {
        svg.innerHTML = '<path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"/>';
      }
    }

    if (countSpan) countSpan.textContent = likeCount;
  }

  async function toggleLike(achievementId, btn) {
    try {
      const res = await fetch(`/api/achievement/${achievementId}/like`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (data.success) {
        updateLikeButton(btn, data.liked, data.likeCount);
        showNotification(data.liked ? 'Liked!' : 'Unliked', 'success');
      } else {
        if (res.status === 401) {
          showNotification('Please log in to like achievements', 'error');
        } else {
          showNotification(data.message || 'Failed to update like', 'error');
        }
      }
    } catch (err) {
      console.error('Like error:', err);
      showNotification('Failed to update like', 'error');
    }
  }

  async function initLikeButtons() {
    const buttons = document.querySelectorAll('.achievement-like-btn');
    for (const btn of buttons) {
      const achievementId = btn.dataset.achievementId;
      if (achievementId) {
        const status = await checkLikeStatus(achievementId);
        updateLikeButton(btn, status.liked, status.likeCount);
      }
    }

    // Event delegation for like buttons
    document.addEventListener('click', e => {
      const btn = e.target.closest('.achievement-like-btn');
      if (btn) {
        e.preventDefault();
        const achievementId = btn.dataset.achievementId;
        if (achievementId) toggleLike(achievementId, btn);
      }
    });
  }

  /* ============================================================
     7. SHARE BUTTONS
     ============================================================ */
  function initShareButtons() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.achievement-share-btn');
      if (!btn) return;
      e.preventDefault();

      const link = btn.dataset.achievementLink;
      if (!link) return;

      const fullUrl = window.location.origin + link;

      if (navigator.share) {
        navigator.share({
          title: 'Check out this achievement!',
          url: fullUrl
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(fullUrl).then(() => {
          showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = fullUrl;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showNotification('Link copied to clipboard!', 'success');
        });
      }
    });
  }

  /* ============================================================
     8. CARD CLICK DELEGATION
     ============================================================ */
  function initCardDelegation() {
    const main = document.querySelector('.main-content-all-achievements');
    if (!main) return;
    main.addEventListener('click', e => {
      const account = e.target.closest('.achievement-account[data-account-link]');
      if (account) { window.location.href = account.dataset.accountLink; return; }
      const img = e.target.closest('.achievement-img[data-achievement-link]');
      if (img) { window.location.href = img.dataset.achievementLink; }
    });
  }

  /* ============================================================
     9. i18n
     ============================================================ */
  function initI18n() {
    if (typeof i18next === 'undefined') { console.error('i18next missing'); return; }

    const resources = {
      en: { translation: {
        "dropdownHomeTgt":"Home","dropdownDashboardTgt":"Dashboard",
        "dropdownFundraisersTgt":"Fundraisers","dropdownAchievementsTgt":"Achievements",
        "dropdownCategoriesTgt":"Categories","dropdownContactTgt":"Contact Us",
        "dropdownLanguageTgt":"Language",
        "allAchievementsLinkOneTgt":"Latest Achievements",
        "allAchievementsLinkTwoTgt":"Milestone Achievements",
        "allAchievementsLinkThreeTgt":"Final Achievements",
        "allAchievementsLinkFourTgt":"Back to Fundraisers",
        "allAchievementsNoResultTitleSearchTgt":"No Results Found",
        "allAchievementsNoResultDesSearchTgt":"No achievements match your search. Try different keywords.",
        "allAchievementsNoResultTitleLatestTgt":"No Achievements Yet",
        "allAchievementsNoResultDesLatestTgt":"Check back later for campaign achievements.",
        "allAchievementsNoResultTitleMilestoneTgt":"No Milestone Achievements",
        "allAchievementsNoResultDesMilestoneTgt":"No milestone achievements have been posted yet.",
        "allAchievementsNoResultTitleFinalTgt":"No Final Achievements",
        "allAchievementsNoResultDesFinalTgt":"No campaigns have reached their final achievement yet.",
        "complaintTitleTgt":"Enter the problem you are facing",
        "complaintLabelTgt":"Enter A Problem","complaintBtnTgt":"Send"
      }},
      ar: { translation: {
        "dropdownHomeTgt":"الرئيسية","dropdownDashboardTgt":"لوحة التحكم",
        "dropdownFundraisersTgt":"حملات التبرع","dropdownAchievementsTgt":"الإنجازات",
        "dropdownCategoriesTgt":"التصنيفات","dropdownContactTgt":"تواصل معنا",
        "dropdownLanguageTgt":"اللغة",
        "allAchievementsLinkOneTgt":"أحدث الإنجازات",
        "allAchievementsLinkTwoTgt":"إنجازات المراحل",
        "allAchievementsLinkThreeTgt":"الإنجازات النهائية",
        "allAchievementsLinkFourTgt":"العودة لحملات التبرع",
        "allAchievementsNoResultTitleSearchTgt":"لم يتم العثور على نتائج",
        "allAchievementsNoResultDesSearchTgt":"لا توجد إنجازات مطابقة لبحثك. جرب كلمات مختلفة.",
        "allAchievementsNoResultTitleLatestTgt":"لا توجد إنجازات بعد",
        "allAchievementsNoResultDesLatestTgt":"تحقق لاحقاً لإنجازات الحملات.",
        "allAchievementsNoResultTitleMilestoneTgt":"لا توجد إنجازات مرحلية",
        "allAchievementsNoResultDesMilestoneTgt":"لم يتم نشر إنجازات مرحلية بعد.",
        "allAchievementsNoResultTitleFinalTgt":"لا توجد إنجازات نهائية",
        "allAchievementsNoResultDesFinalTgt":"لم تصل أي حملة إلى إنجازها النهائي بعد.",
        "complaintTitleTgt":"أدخل المشكلة التي تواجهك",
        "complaintLabelTgt":"أدخل المشكلة","complaintBtnTgt":"أرسل"
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
        if (el.placeholder !== undefined && el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = i18next.t(key);
        } else {
          el.innerHTML = i18next.t(key);
        }
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
     10. CONTROL PANEL / DASHBOARD LINK
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
    });
  }

  /* ============================================================
     11. COMPLAINT FORM
     ============================================================ */
  function initComplaintForm() {
    const form = document.getElementById('complaintForm');
    if (!form) return;
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const content = document.getElementById('complaint_content');
      const messageDiv = document.getElementById('complaintMessage');
      try {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ complaint_content: content.value.trim() })
        });
        const result = await res.json();
        if (messageDiv) {
          messageDiv.style.display = 'block';
          messageDiv.textContent = result.message;
          messageDiv.className = result.success ? 'success-message' : 'error-message';
        }
        if (result.success) { form.reset(); }
      } catch (err) {
        if (messageDiv) {
          messageDiv.style.display = 'block';
          messageDiv.className = 'error-message';
          messageDiv.textContent = 'Failed to submit complaint. Please try again.';
        }
      }
    });
  }

  /* ============================================================
     12. BOOT
     ============================================================ */
  function boot() {
    initContent();
    initNavigation();
    initMobileMenu();
    initDropdownMenu();
    initLikeButtons();
    initShareButtons();
    initCardDelegation();
    initI18n();
    initLanguageMenu();
    initControlPanel();
    initComplaintForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
