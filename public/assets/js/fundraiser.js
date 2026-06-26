/**
 * Najdah Fundraiser Page - Consolidated Logic
 * Moved from inline scripts in fundraiser.ejs for CSP & maintainability
 */

/* ── 1. Utilities & Flash Messages ───────────────────────────────────────── */

function showFlashMessage(message, type = 'success') {
  const existingFlash = document.querySelector('.flash-message');
  if (existingFlash) existingFlash.remove();

  const flashDiv = document.createElement('div');
  flashDiv.className = `flash-message flash-${type}`;
  flashDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 300px;
    max-width: 90%;
    animation: slideDownFlashMessage 0.3s ease-out;
    ${type === 'success'
      ? 'background: #e8f5e8; border: 2px solid #4caf50; color: #2e7d32;'
      : type === 'warning'
      ? 'background: #fffbf0; border: 2px solid #ffc107; color: #856404;'
      : 'background: #ffebee; border: 2px solid #f44336; color: #c62828;'}
  `;

  const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
  flashDiv.innerHTML = `
    <span style="font-size: 18px;">${icon}</span>
    <span style="flex: 1; font-size: 14px; font-weight: 500;">${message}</span>
    <button class="flash-close" style="
      background: none; border: none; font-size: 20px; cursor: pointer;
      color: inherit; opacity: 0.7; padding: 0; width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
    " onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(flashDiv);

  setTimeout(() => {
    if (flashDiv.parentElement) {
      flashDiv.style.animation = 'slideUpFlashMessage 0.3s ease-out';
      setTimeout(() => flashDiv.remove(), 300);
    }
  }, 5000);
}

/* ── 2. Image Fallbacks (replaces inline onerror) ────────────────────────── */

function initImageFallbacks() {
  document.querySelectorAll('img[data-fallback-src]').forEach(img => {
    img.addEventListener('error', function() {
      this.src = this.dataset.fallbackSrc;
    });
  });
}

/* ── 3. Navigation & Dropdowns ───────────────────────────────────────────── */

function initNavigation() {
  const menuButton = document.getElementById('menuButton');
  const dropdownMenu = document.getElementById('dropdownMenu');

  if (menuButton && dropdownMenu) {
    menuButton.addEventListener('click', function(e) {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
    });
    document.addEventListener('click', function(e) {
      if (!menuButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  }

  const helpBtn = document.getElementById('helpBtn');
  const submitComplaint = document.getElementById('submitComplaint');
  if (helpBtn && submitComplaint) {
    helpBtn.addEventListener('click', function(e) {
      e.preventDefault();
      submitComplaint.classList.toggle('show');
    });
    document.addEventListener('click', function(e) {
      if (!helpBtn.contains(e.target) && !submitComplaint.contains(e.target)) {
        submitComplaint.classList.remove('show');
      }
    });
  }
}

/* ── 4. Input Box Styling ────────────────────────────────────────────────── */

function initInputBoxes() {
  const inputBoxes = document.querySelectorAll('.input-box');
  inputBoxes.forEach(box => {
    const inputField = box.querySelector('input');
    const textareaField = box.querySelector('textarea');
    const field = inputField || textareaField;

    if (field) {
      if (field.value === '') box.classList.remove('field-is-filled');
      else box.classList.add('field-is-filled');

      field.addEventListener('focus', () => box.classList.add('input-box-active'));
      field.addEventListener('blur', () => {
        setTimeout(() => box.classList.remove('input-box-active'), 300);
      });
      field.addEventListener('input', () => {
        box.classList.toggle('field-is-filled', field.value !== '');
      });
    }

    if (textareaField) {
      const signalNum = box.querySelector('.signal_num');
      textareaField.addEventListener('keyup', () => {
        const valLength = textareaField.value.length;
        if (signalNum) signalNum.innerText = valLength;
        box.classList.toggle('input-box-active', valLength > 0);
        box.classList.toggle('error', valLength > 100);
      });
    }
  });
}

/* ── 5. Fundraiser Progress & Animations ─────────────────────────────────── */

function parseFundraiserAmount(amountText) {
  if (!amountText) return 0;
  let cleaned = amountText.trim().replace(/\s+/g, '');
  const arabicToWestern = {
    '٠':'0','۰':'0','١':'1','۱':'1','٢':'2','۲':'2','٣':'3','۳':'3',
    '٤':'4','۴':'4','٥':'5','۵':'5','٦':'6','۶':'6','٧':'7','۷':'7',
    '٨':'8','۸':'8','٩':'9','۹':'9'
  };
  cleaned = cleaned.split('').map(c => arabicToWestern[c] || c).join('');
  // Keep decimals, remove only non-numeric except dot
  cleaned = cleaned.replace(/[^\d.]/g, '');
  // Handle multiple dots by keeping first
  const parts = cleaned.split('.');
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function determineIncrement(goal) {
  if (goal <= 1000) return 10;
  if (goal <= 5000) return 15;
  if (goal <= 10000) return 30;
  if (goal <= 50000) return 50;
  if (goal <= 100000) return 100;
  if (goal <= 500000) return 300;
  return 100;
}

function startCountAnimation(el, currentAmount, goal) {
  if (currentAmount >= goal) {
    // Force English numerals
    el.textContent = goal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return;
  }
  const increment = determineIncrement(goal);
  const hasDecimals = currentAmount % 1 !== 0 || goal % 1 !== 0;
  const timer = setInterval(() => {
    let current = parseFloat(el.dataset.animatedValue) || 0;
    let next = Math.min(current + increment, goal);
    el.dataset.animatedValue = next;
    if (hasDecimals) {
      // Force English numerals
      el.textContent = next.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    } else {
      // Force English numerals
      el.textContent = next.toLocaleString('en-US');
    }
    if (next >= goal) {
      clearInterval(timer);
    }
  }, 30);
}

function updateProgressBar(currentAmount, maxGoal, progressBar, moneyNumber) {
  if (!maxGoal || maxGoal === 0) return;
  let pct = Math.min(Math.max((currentAmount / maxGoal) * 100, 0), 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
  // No longer need to position moneyNumber vertically
}

function initFundraiserAnimations() {
  const moneyElement = document.querySelector('.money');
  const maxGoalElement = document.querySelector('.max-goal');
  const progressBar = document.querySelector('.donation-progress');

  if (!moneyElement || !maxGoalElement || !progressBar) return;

  const initialCollected = parseFundraiserAmount(moneyElement.textContent);
  const maxGoal = parseFloat(maxGoalElement.dataset.max) || 0;

  moneyElement.dataset.animatedValue = 0;
  moneyElement.dataset.finalValue = initialCollected;

  setTimeout(() => {
    updateProgressBar(initialCollected, maxGoal, progressBar);
    startCountAnimation(moneyElement, 0, initialCollected);
  }, 100);
}

function setupProgressObserver(currentAmount, maxGoal, progressBar) {
  const moneyElement = document.querySelector('.money');
  if (!moneyElement) return;
  const observer = new MutationObserver(() => {
    const newAmount = parseFloat(moneyElement.textContent.replace(/,/g, '')) || 0;
    updateProgressBar(newAmount, maxGoal, progressBar);
  });
  observer.observe(moneyElement, { childList: true, subtree: true, characterData: true });
}

/* ── 6. i18n (Internationalization) ───────────────────────────────────────── */

function loadScript(src, onLoad) {
  const script = document.createElement('script');
  script.src = src;
  script.onload = onLoad;
  script.onerror = () => console.warn('Failed to load script: ' + src);
  document.head.appendChild(script);
}

function initI18n() {
  if (typeof i18next === 'undefined') {
    console.error('i18next not available; loading from CDN...');
    loadScript('https://unpkg.com/i18next@21.9.2/dist/umd/i18next.min.js', () => {
      loadScript('https://unpkg.com/i18next-http-backend@1.4.1/i18nextHttpBackend.min.js', () => {
        loadScript('https://unpkg.com/i18next-browser-languagedetector@7.0.1/i18nextBrowserLanguageDetector.min.js', () => {
          location.reload();
        });
      });
    });
    return;
  }

  const i18nextHttpBackend = window.i18nextHttpBackend;
  const i18nextBrowserLanguageDetector = window.i18nextBrowserLanguageDetector;

  i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
      fallbackLng: 'en',
      debug: false,
      resources: {
        en: {
          translation: {
            dropdownHomeTgt: "Home",
            dropdownDashboardTgt: "Dashboard",
            dropdownFundraisersTgt: "Fundraisers",
            dropdownCategoriesTgt: "Categories",
            dropdownContactTgt: "Contact Us",
            dropdownLanguageTgt: "Language",
            complaintTitleTgt: "Enter the problem you are facing",
            complaintLabelTgt: "Enter A Problem",
            complaintBtnTgt: "Send",
            fundraiserCategoriesOneTgt: "environment",
            fundraiserCategoriesTwoTgt: "poverty",
            fundraiserCategoriesThreeTgt: "gaza",
            fundraiserCategoriesFourTgt: "health care",
            fundraiserGoalTitleTgt: "Fundraiser Goal :",
            fundraiserDonateBtnTgt: "Donate Now",
            fundraiserDonateBtnIndigentTgt: "Indigent Does Not Donate",
            fundraiserDescriptionTgt: "Lorem ipsum dolor sit amet consectetur adipisicing elit...",
            fundraiserCommentTitleTgt: "Add a comment",
            fundraiserCommentDescriptionTgt: "Share your thoughts and support for this fundraiser.",
            fundraiserCommentLabelTgt: "Type A comment",
            fundraiserCommentBtnTgt: "Submit",
            fundraiserCommentSubTitleTgt: "Comments",
            fundraiserCommentLikeTgt: "Like",
            fundraiserCommentReplyTgt: "Reply",
            fundraiserCommentTimeTgt: "4d",
            fundraiserCommentReplyBtnTgt: "Post Reply",
            fundraiserMoreFundraisersTitleTgt: "More Fundraisers From AbOoD1",
            fundraiserSimilarFundraisersTitleTgt: "Similar Fundraisers Requests",
            fundraiserSameAreaFundraisersTitleTgt: "Fundraisers From The Same Area",
            loadMoreCommentsTgt: "Load More Comments"
          }
        },
        ar: {
          translation: {
            dropdownHomeTgt: "الرئيسية",
            dropdownDashboardTgt: "لوحة التحكم",
            dropdownFundraisersTgt: "حملات التبرع",
            dropdownCategoriesTgt: "التصنيفات",
            dropdownContactTgt: "تواصل معنا",
            dropdownLanguageTgt: "اللغة",
            complaintTitleTgt: "أدخل المشكلة التي تواجهك",
            complaintLabelTgt: "أدخل المشكلة",
            complaintBtnTgt: "أرسل",
            fundraiserCategoriesOneTgt: "البيئة",
            fundraiserCategoriesTwoTgt: "الفقر",
            fundraiserCategoriesThreeTgt: "غزة",
            fundraiserCategoriesFourTgt: "الرعاية الصحية",
            fundraiserGoalTitleTgt: "هدف حملة التبرع :",
            fundraiserDonateBtnTgt: "تبرع الآن",
            fundraiserDonateBtnIndigentTgt: "المحتاج لا يتبرع",
            fundraiserDescriptionTgt: "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة...",
            fundraiserCommentTitleTgt: "أضف تعليقاً",
            fundraiserCommentDescriptionTgt: "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة...",
            fundraiserCommentLabelTgt: "أكتب تعليقاً",
            fundraiserCommentBtnTgt: "أرسل",
            fundraiserCommentSubTitleTgt: "التعليقات",
            fundraiserCommentLikeTgt: "إعجاب",
            fundraiserCommentReplyTgt: "رد",
            fundraiserCommentTimeTgt: "4ي",
            fundraiserCommentReplyBtnTgt: "الرد",
            fundraiserMoreFundraisersTitleTgt: "AbOod1 المزيد من حملات التبرع من",
            fundraiserSimilarFundraisersTitleTgt: "حملات التبرع المشابهة",
            fundraiserSameAreaFundraisersTitleTgt: "حملات التبرع من نفس المنطقة",
            loadMoreCommentsTgt: "تحميل المزيد من التعليقات"
          }
        }
      }
    }, (err) => {
      if (err) console.error('i18next init error:', err);
      else updateContent();
    });

  function updateButtonState(lang) {
    document.getElementById('en-btn')?.classList.toggle('active', lang === 'en');
    document.getElementById('ar-btn')?.classList.toggle('active', lang === 'ar');
  }

  function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.innerHTML = i18next.t(key);
    });
    if (i18next.language === 'ar') {
      document.body.classList.add('rtl');
      document.body.setAttribute('dir', 'rtl');
    } else {
      document.body.classList.remove('rtl');
      document.body.setAttribute('dir', 'ltr');
    }
  }

  document.getElementById('en-btn')?.addEventListener('click', () => {
    i18next.changeLanguage('en');
    updateButtonState('en');
  });
  document.getElementById('ar-btn')?.addEventListener('click', () => {
    i18next.changeLanguage('ar');
    updateButtonState('ar');
  });

  i18next.on('languageChanged', updateContent);
  if (navigator.language.startsWith('ar')) {
    i18next.changeLanguage('ar');
    updateButtonState('ar');
  }
}

function initLanguageSwitcher() {
  const languageMenu = document.getElementById('languageMenu');
  const languageSwitcher = document.getElementById('languageSwitcher');
  const dropdownMenu = document.getElementById('dropdownMenu');

  if (!languageMenu || !languageSwitcher) return;

  languageMenu.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    languageSwitcher.classList.toggle('show');
    languageSwitcher.classList.toggle('flex');
  });

  document.addEventListener('click', function(e) {
    if (!dropdownMenu?.contains(e.target)) {
      languageSwitcher.classList.remove('show', 'flex');
    }
  });

  languageSwitcher.addEventListener('click', e => e.stopPropagation());

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      languageSwitcher.classList.remove('show', 'flex');
      console.log('Selected language: ' + this.textContent);
    });
  });
}

/* ── 7. Save Fundraiser ──────────────────────────────────────────────────── */

function getFundraiserId(button) {
  const box = button.closest('[data-fundraiser-id]');
  if (box?.dataset.fundraiserId) return box.dataset.fundraiserId;

  const urlMatch = window.location.href.match(/\/fundraiser\/(\d+)/);
  if (urlMatch) return urlMatch[1];

  const meta = document.querySelector('meta[name="fundraiser-id"]');
  if (meta?.content) return meta.content;

  const hidden = document.querySelector('input[name="fundraiser-id"]');
  if (hidden?.value) return hidden.value;

  const container = button.closest('.fundraiser-container, .fundraiser-box, [id*="fundraiser"]');
  if (container) {
    const idEl = container.querySelector('[data-fundraiser-id]');
    if (idEl) return idEl.dataset.fundraiserId;
  }
  return null;
}

async function checkSaveStatus(fundraiserId) {
  try {
    const res = await fetch(`/saved-fundraisers/check/${fundraiserId}`, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data.isSaved;
  } catch (e) {
    console.error('Error checking save status:', e);
    return false;
  }
}

function updateSaveButtonAppearance(button, isSaved) {
  const icon = button.querySelector('svg');
  if (!icon) return;
  if (isSaved) {
    button.classList.add('saved');
    button.title = 'Remove from saved';
    icon.innerHTML = `<path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>`;
  } else {
    button.classList.remove('saved');
    button.title = 'Save fundraiser';
    icon.innerHTML = `<path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                      <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4"/>`;
  }
}

async function toggleSaveFundraiser(button) {
  try {
    const fundraiserId = getFundraiserId(button);
    if (!fundraiserId) return;

    const isSaved = await checkSaveStatus(fundraiserId);
    const method = isSaved ? 'DELETE' : 'POST';
    const endpoint = isSaved ? `/saved-fundraisers/unsave/${fundraiserId}` : `/saved-fundraisers/save/${fundraiserId}`;

    const res = await fetch(endpoint, {
      method,
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      const result = await res.json();
      updateSaveButtonAppearance(button, !isSaved);
      showNotification(result.message || (isSaved ? 'Removed from saved' : 'Saved successfully'), 'success');
    } else {
      throw new Error('Failed to update save status');
    }
  } catch (e) {
    console.error('Error toggling save:', e);
    showNotification('Failed to update saved status', 'error');
  }
}

async function initSaveButtons() {
  const buttons = document.querySelectorAll('.save-fundraiser-btn');
  for (const btn of buttons) {
    const id = getFundraiserId(btn);
    if (id) {
      const isSaved = await checkSaveStatus(id);
      updateSaveButtonAppearance(btn, isSaved);
    }
  }
}

function showNotification(message, type) {
  const n = document.createElement('div');
  n.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 12px 20px;
    border-radius: 4px; color: white; font-weight: bold; z-index: 10000;
    transition: opacity 0.3s;
    background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
  `;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
}

/* ── 8. Complaint Form ───────────────────────────────────────────────────── */

function initComplaintForm() {
  const form = document.getElementById('complaintForm');
  const content = document.getElementById('complaint_content');
  const signalNum = document.querySelector('.signal_num');
  const messageDiv = document.getElementById('complaintMessage');

  if (!form) return;

  if (content && signalNum) {
    content.addEventListener('input', function() {
      const len = this.value.length;
      signalNum.textContent = len;
      signalNum.style.color = len > 90 ? '#ff6b6b' : '';
    });
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending...';
    if (messageDiv) messageDiv.style.display = 'none';

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
      if (result.success) {
        form.reset();
        if (signalNum) signalNum.textContent = '0';
      }
    } catch (err) {
      console.error('Complaint error:', err);
      if (messageDiv) {
        messageDiv.style.display = 'block';
        messageDiv.className = 'error-message';
        messageDiv.textContent = 'Failed to submit complaint. Please try again.';
      }
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

/* ── 9. Control Panel Routing ────────────────────────────────────────────── */

function initControlPanelRouting() {
  const btn = document.getElementById('controlPanelBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const userType = sessionStorage.getItem('userType');
    if (!userType) { window.location.href = '/register'; return; }
    if (userType === 'superadmin') window.location.href = '/admin';
    else if (userType === 'requester') window.location.href = '/userPanelIndigent';
    else if (userType === 'donor') window.location.href = '/UserPanelDonor';
    else console.log('الرجاء تحديد تصنيف ناجح');
  });
}

/* ── 10. Donate Button Visibility ────────────────────────────────────────── */

function initDonateButton() {
  const container = document.getElementById('buttons-container');
  if (!container) return;
  
  const userType = sessionStorage.getItem('userType');
  
  if (!userType) {
    // Not logged in - redirect to login
    container.innerHTML = `<a href="/login" class="donate-btn btn-website">Donate</a>`;
  } else if (userType === 'requester') {
    container.innerHTML = `<p class="donate-btn btn-website" style="opacity:0.6;cursor:not-allowed;">You Can't Donate</p>`;
  } else {
    // Donor, charity, or admin - show donation modal
    const target = parseFloat(window.initialData?.targetAmount) || 0;
    const collected = parseFloat(window.initialData?.collectedAmount) || 0;
    const remaining = parseFloat((target - collected).toFixed(2));
    container.innerHTML = `<a id="donateButton" class="donate-btn btn-website" data-remaining="${remaining}" data-i18n="fundraiserDonateBtnTgt">Donate Now</a>`;
  }
}

/* ── 11. Fundraiser Account Click ────────────────────────────────────────── */

function initFundraiserAccountClick() {
  const account = document.querySelector('.fundraiser-account');
  if (!account) return;
  account.addEventListener('click', () => {
    const userId = account.dataset.userId;
    if (userId) window.location.href = `/indigent-account/${userId}`;
  });
}

/* ── 12. Owl Carousel ────────────────────────────────────────────────────── */

function initOwlCarousel() {
  if (typeof jQuery === 'undefined' || typeof $.fn.owlCarousel === 'undefined') return;
  $(document).ready(function() {
    $('.owl-carousel').owlCarousel({
      loop: true,
      items: 1,
      responsive: { 768: { items: 3 } },
      autoplay: false,
      dots: true,
      nav: true,
      margin: 10,
      autoplayTimeout: 5000,
      autoplayHoverPause: true
    });
  });
}

/* ── 13. Comments System ─────────────────────────────────────────────────── */

class CommentsManager {
  constructor() {
    this.currentPage = 1;
    const el = document.getElementById('fundraiser-data');
    this.fundraiserId = el ? el.dataset.fundraiserId : null;
    this.isLoading = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadComments(1);
  }

  bindEvents() {
    const commentText = document.getElementById('commentText');
    commentText?.addEventListener('input', this.handleCharacterCount.bind(this));
    document.getElementById('commentForm')?.addEventListener('submit', this.handleCommentSubmit.bind(this));
  }

  handleCharacterCount(e) {
    const len = e.target.value.length;
    const counter = document.querySelector('.current-count');
    const container = document.querySelector('.character-counter');
    if (counter) counter.textContent = len;
    container?.classList.remove('near-limit', 'over-limit');
    if (len > 450) container?.classList.add('near-limit');
    if (len > 500) container?.classList.add('over-limit');
  }

  async handleCommentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.comment-submit-btn');
    const text = document.getElementById('commentText').value.trim();
    if (!this.validateComment(text)) return;

    try {
      this.setLoadingState(btn, true);
      const res = await fetch(`/api/fundraiser/${this.fundraiserId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundraiser_id: this.fundraiserId, comment_text: text })
      });
      const data = await res.json();
      if (data.success) {
        this.resetForm();
        if (data.is_blocked) this.showNotification(data.message, 'warning');
        else {
          this.showNotification('Comment added successfully!', 'success');
          await this.loadComments(1);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Comment submit error:', err);
      this.showNotification('Error submitting comment. Please try again.', 'error');
    } finally {
      this.setLoadingState(btn, false);
    }
  }

  validateComment(text) {
    if (!text) { this.showNotification('Please enter a comment', 'error'); return false; }
    if (text.length > 500) { this.showNotification('Comment exceeds 500 character limit', 'error'); return false; }
    return true;
  }

  setLoadingState(button, loading) {
    this.isLoading = loading;
    button.classList.toggle('loading', loading);
    button.disabled = loading;
  }

  resetForm() {
    document.getElementById('commentText').value = '';
    document.querySelector('.current-count').textContent = '0';
    document.querySelector('.character-counter')?.classList.remove('near-limit', 'over-limit');
  }

  async loadComments(page = 1) {
    if (this.isLoading) return;
    try {
      this.setCommentsLoading(true);
      const res = await fetch(`/api/fundraiser/${this.fundraiserId}/comments?page=${page}&limit=10`);
      const data = await res.json();
      if (data.success) {
        this.displayComments(data.comments, page);
        this.updateCommentsCount(data.pagination?.total || data.comments.length);
        this.updateLoadMoreButton(data.pagination);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Load comments error:', err);
      this.showNotification('Error loading comments', 'error');
    } finally {
      this.setCommentsLoading(false);
    }
  }

  setCommentsLoading(loading) {
    const el = document.getElementById('commentsLoading');
    const container = document.getElementById('commentsContainer');
    if (!el) return;
    el.style.display = loading ? 'flex' : 'none';
    if (loading && this.currentPage === 1) container.style.display = 'none';
  }

  displayComments(comments, page) {
    const container = document.getElementById('commentsContainer');
    const empty = document.getElementById('emptyState');
    if (page === 1) container.innerHTML = '';
    if (comments.length === 0 && page === 1) {
      empty.style.display = 'block';
      container.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    container.style.display = 'block';
    comments.forEach(c => container.appendChild(this.createCommentElement(c)));
  }

  createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment';
    div.innerHTML = this.getCommentHTML(comment);
    this.bindCommentEvents(div, comment);
    return div;
  }

  getCommentHTML(comment) {
    return `
      <div class="comment-header">
        <img class="user-avatar" src="${comment.user.user_image}" alt="${comment.user.full_name}"
          data-fallback-src="/assets/image/Fundraiser-Page/header-sec/girl-profile.png">
        <div class="user-info">
          <h3 class="user-name">${this.escapeHtml(comment.user.full_name)}</h3>
          <span class="comment-time">${this.formatTimeAgo(comment.created_at)}</span>
        </div>
      </div>
      <div class="comment-content">${this.escapeHtml(comment.comment_text)}</div>
      <div class="comment-actions">
        <button class="action-btn reply-btn" data-comment-id="${comment.comment_id}"><span>Reply</span></button>
        <span class="comment-time">${this.formatTimeAgo(comment.created_at)}</span>
      </div>
      <div class="reply-form" id="replyForm-${comment.comment_id}" style="display: none;">
        <textarea class="reply-input" placeholder="Write your reply..." maxlength="300"></textarea>
        <div class="reply-actions">
          <button class="btn-primary submit-reply" data-comment-id="${comment.comment_id}">Post Reply</button>
          <button class="btn-secondary cancel-reply" data-comment-id="${comment.comment_id}">Cancel</button>
        </div>
      </div>
      ${comment.replies?.length ? `<div class="replies-container"><div class="replies-list" id="replies-${comment.comment_id}">${comment.replies.map(r => this.getReplyHTML(r)).join('')}</div></div>` : ''}
    `;
  }

  getReplyHTML(reply) {
    return `
      <div class="comment reply">
        <div class="comment-header">
          <img class="user-avatar" src="${reply.user.user_image}" alt="${reply.user.full_name}"
            data-fallback-src="/assets/image/Fundraiser-Page/header-sec/girl-profile.png">
          <div class="user-info">
            <h3 class="user-name">${this.escapeHtml(reply.user.full_name)}</h3>
            <span class="comment-time">${this.formatTimeAgo(reply.created_at)}</span>
          </div>
        </div>
        <div class="comment-content">${this.escapeHtml(reply.comment_text)}</div>
        <div class="comment-actions">
          <span class="comment-time">${this.formatTimeAgo(reply.created_at)}</span>
        </div>
      </div>
    `;
  }

  bindCommentEvents(div, comment) {
    div.querySelector('.reply-btn')?.addEventListener('click', () => this.showReplyForm(comment.comment_id));
    div.querySelector('.submit-reply')?.addEventListener('click', () => this.submitReply(comment.comment_id));
    div.querySelector('.cancel-reply')?.addEventListener('click', () => this.hideReplyForm(comment.comment_id));
  }

  showReplyForm(id) {
    const form = document.getElementById(`replyForm-${id}`);
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }

  hideReplyForm(id) {
    const form = document.getElementById(`replyForm-${id}`);
    const input = document.querySelector(`#replyForm-${id} .reply-input`);
    if (form) form.style.display = 'none';
    if (input) input.value = '';
  }

  async submitReply(commentId) {
    const input = document.querySelector(`#replyForm-${commentId} .reply-input`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) { this.showNotification('Please enter a reply', 'error'); return; }

    try {
      const res = await fetch(`/api/fundraiser/${this.fundraiserId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundraiser_id: this.fundraiserId, comment_text: text, parent_comment_id: commentId })
      });
      const data = await res.json();
      if (data.success) {
        this.hideReplyForm(commentId);
        if (data.is_blocked) this.showNotification(data.message, 'warning');
        else {
          this.showNotification('Reply added successfully!', 'success');
          await this.loadComments(1);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Reply error:', err);
      this.showNotification('Error submitting reply', 'error');
    }
  }

  updateCommentsCount(total) {
    const el = document.getElementById('commentsCount');
    if (el) el.textContent = `(${total})`;
  }

  updateLoadMoreButton(pagination) {
    const container = document.getElementById('loadMoreContainer');
    const btn = document.getElementById('loadMoreBtn');
    if (pagination?.hasMore) {
      container.style.display = 'block';
      btn.onclick = () => { this.currentPage++; this.loadComments(this.currentPage); };
    } else {
      container.style.display = 'none';
    }
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  showNotification(message, type = 'info') {
    showFlashMessage(message);
  }
}

/* ── 14. Global Event Delegation ───────────────────────────────────────────── */

function initGlobalDelegation() {
  document.addEventListener('click', async function(e) {
    const saveBtn = e.target.closest('.save-fundraiser-btn');
    if (saveBtn) {
      e.preventDefault();
      await toggleSaveFundraiser(saveBtn);
    }
  });
}

/* ── Owner Donations Table ─────────────────────────────────────────────────── */

function initOwnerDonationsTable() {
  const ownerData = document.getElementById('owner-data');
  if (!ownerData) return;
  
  const isOwner = ownerData.dataset.isOwner === 'true';
  if (!isOwner) return;

  const fundraiserId = ownerData.dataset.fundraiserId;
  let currentPage = 1;
  const limit = 10;

  async function loadDonations(page = 1) {
    const loadingEl = document.getElementById('donationsTableLoading');
    const wrapperEl = document.getElementById('donationsTableWrapper');
    const tbody = document.getElementById('donationsTableBody');
    const pagination = document.getElementById('donationsPagination');
    const noMsg = document.getElementById('noDonationsMsg');

    if (!loadingEl || !wrapperEl) return; // Safety check

    loadingEl.style.display = 'block';
    wrapperEl.style.display = 'none';
    noMsg.style.display = 'none';

    try {
      const res = await fetch(`/api/payments/fundraiser/${fundraiserId}/donations?page=${page}&limit=${limit}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      const donations = data.donations || [];
      const pages = data.pagination?.pages || 1;

      loadingEl.style.display = 'none';

      if (donations.length === 0) {
        noMsg.style.display = 'block';
        return;
      }

      wrapperEl.style.display = 'block';

      tbody.innerHTML = donations.map(inv => {
        const donor = inv.donor || {};
        const paidDate = inv.paid_at 
          ? new Date(inv.paid_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) 
          : 'N/A';
        return `
          <tr>
            <td>
              <div class="table-donor">
                <img src="${donor.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png'}" 
                     alt="${donor.full_name || 'Anonymous'}" 
                     class="table-donor-avatar"
                     onerror="this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'">
                <span>${donor.full_name || 'Anonymous'}</span>
              </div>
            </td>
            <td class="amount-cell">$${parseFloat(inv.gross_amount).toFixed(2)}</td>
            <td>${inv.currency}</td>
            <td>${paidDate}</td>
            <td class="net-cell">$${parseFloat(inv.net_amount).toFixed(2)}</td>
            <td class="fee-cell">$${parseFloat(inv.processing_fee).toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      // Pagination
      if (pages > 1) {
        let pagHTML = '';
        if (page > 1) {
          pagHTML += `<button class="pag-btn" data-page="${page - 1}">← Prev</button>`;
        }
        pagHTML += `<span class="pag-info">Page ${page} of ${pages}</span>`;
        if (page < pages) {
          pagHTML += `<button class="pag-btn" data-page="${page + 1}">Next →</button>`;
        }
        pagination.innerHTML = pagHTML;
        pagination.style.display = 'flex';
        
        // Bind click events to pagination buttons (no inline onclick)
        pagination.querySelectorAll('.pag-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            loadDonations(parseInt(btn.dataset.page));
          });
        });
      } else {
        pagination.style.display = 'none';
      }

      currentPage = page;

    } catch (err) {
      console.error('Error loading donations:', err);
      loadingEl.textContent = 'Failed to load donations. Please refresh.';
    }
  }

  // Initial load
  loadDonations(1);
}

/* ── 15. Initialization ──────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  initImageFallbacks();
  initNavigation();
  initInputBoxes();
  initFundraiserAnimations();
  initLanguageSwitcher();
  initI18n();
  initSaveButtons();
  initComplaintForm();
  initControlPanelRouting();
  initDonateButton();
  initFundraiserAccountClick();
  initOwlCarousel();
  initGlobalDelegation();
  initOwnerDonationsTable();   // <-- ADD THIS LINE
  
  new CommentsManager();
});