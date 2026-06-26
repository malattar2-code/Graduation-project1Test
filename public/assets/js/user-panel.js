/**
 * user-panel.js
 * All client-side logic extracted from user-panel-indigent.ejs
 */

// ==================== CONFIG & STATE ====================
const AppConfig = {
  userType: document.body.dataset.userType || '',
  categories: []
};

let donationStats = { monthlyTotal: 0, allTimeTotal: 0, dailyDonations: {} };
let donorsList = [];
let fundraiserStats = {
  completedDonationsTotal: 0,
  completedFundraisersPercentage: 0,
  totalProgressPercentage: 0
};

// ==================== UTILITIES ====================
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
// ==================== VALIDATION HELPERS ====================
/**
 * Translate a server error message by checking common patterns
 * @param {string} errorMsg - The English error from server
 * @returns {string} - Translated or original message
 */
function translateServerError(errorMsg) {
  if (!errorMsg) return '';
  const lower = errorMsg.toLowerCase();
  
  // Map common error patterns to i18n keys
  const errorMap = [
    { pattern: /current password.*incorrect|old password.*wrong|invalid.*current password/i, key: 'validation.currentPasswordWrong', fallback: 'Current password is incorrect.' },
    { pattern: /email.*already.*exists|email.*taken/i, key: 'validation.emailExists', fallback: 'Email already exists.' },
    { pattern: /invalid.*email/i, key: 'validation.invalidFormat', fallback: 'Invalid email format.' },
    { pattern: /password.*too.*short|password.*at least/i, key: 'validation.passwordMin', fallback: 'Password must be at least 6 characters.' },
    { pattern: /server error|internal error/i, key: 'validation.serverError', fallback: 'Server error. Please try again.' },
  ];
  
  for (const mapping of errorMap) {
    if (mapping.pattern.test(errorMsg)) {
      return t(mapping.key, mapping.fallback);
    }
  }
  
  return errorMsg; // Return original if no match
}
/**
 * Get translated text using i18next with English fallback
 * @param {string} key - i18next key
 * @param {string} fallback - English fallback text
 * @param {object} options - i18next interpolation options
 * @returns {string}
 */
function t(key, fallback, options = {}) {
  if (typeof i18next !== 'undefined' && i18next.t) {
    const translated = i18next.t(key, { ...options, defaultValue: fallback });
    return translated === key ? fallback : translated;
  }
  // Fallback: manual interpolation for when i18next is not loaded
  let result = fallback;
  Object.keys(options).forEach(optKey => {
    result = result.replace(new RegExp(`{{\\s*${optKey}\\s*}}`, 'g'), options[optKey]);
  });
  return result;
}

/**
 * Show a field-specific validation error (floating tooltip style)
 * @param {string} fieldId - The input element ID
 * @param {string} message - Error message to display (English fallback)
 * @param {string} i18nKey - Optional i18next key for translation
 */
function showFieldError(fieldId, message, i18nKey = null, interpolationVars = {}) {
  const errorDiv = document.getElementById(`${fieldId}-error`);
  if (!errorDiv) {
    console.warn(`Validation error div not found: #${fieldId}-error`);
    return;
  }
  const msgEl = errorDiv.querySelector('.error-message');
  const displayMessage = i18nKey ? t(i18nKey, message, interpolationVars) : message;
  if (msgEl) msgEl.textContent = displayMessage;

  // Force display with inline style + class
  errorDiv.style.display = 'flex';
  errorDiv.classList.add('auto-dismiss');

  // Auto-hide after 4 seconds
  setTimeout(() => {
    hideFieldError(fieldId);
  }, 4000);
}

/**
 * Hide a field-specific validation error
 * @param {string} fieldId - The input element ID
 */
function hideFieldError(fieldId) {
  const errorDiv = document.getElementById(`${fieldId}-error`);
  if (!errorDiv) return;
  errorDiv.style.display = 'none';
  errorDiv.classList.remove('auto-dismiss');
}

/**
 * Validate a text field for min/max length
 * @param {string} fieldId
 * @param {object} rules - { min, max, required, pattern, message, i18nKey }
 * @returns {boolean}
 */
function validateTextField(fieldId, rules = {}) {
  const field = document.getElementById(fieldId);
  if (!field) return true;

  const value = field.value.trim();
  const { min = 0, max = Infinity, required = false, pattern = null, message = null, i18nKey = null } = rules;

  hideFieldError(fieldId);

  if (required && !value) {
    showFieldError(fieldId, message || 'This field is required.', i18nKey || 'validation.required');
    return false;
  }

  if (value && value.length < min) {
    const fallback = `Must be at least ${min} characters.`;
    showFieldError(fieldId, message || fallback, i18nKey || 'validation.minLength', { min: rules.min });
    return false;
  }

  if (value && value.length > max) {
    const fallback = `Must not exceed ${max} characters.`;
    showFieldError(fieldId, message || fallback, i18nKey || 'validation.maxLength', { max: rules.max });
    return false;
  }

  if (pattern && value && !pattern.test(value)) {
    showFieldError(fieldId, message || 'Invalid format.', i18nKey || 'validation.invalidFormat');
    return false;
  }

  return true;
}

/**
 * Validate a number field
 * @param {string} fieldId
 * @param {object} rules - { min, max, required, integer, message, i18nKey }
 * @returns {boolean}
 */
function validateNumberField(fieldId, rules = {}) {
  const field = document.getElementById(fieldId);
  if (!field) return true;

  const value = field.value.trim();
  const { min = -Infinity, max = Infinity, required = false, integer = false, message = null, i18nKey = null } = rules;

  hideFieldError(fieldId);

  if (required && !value) {
    showFieldError(fieldId, message || 'This field is required.', i18nKey || 'validation.required');
    return false;
  }

  if (!value) return true;

  const num = parseFloat(value);
  if (isNaN(num)) {
    showFieldError(fieldId, message || 'Must be a valid number.', i18nKey || 'validation.invalidNumber');
    return false;
  }

  if (integer && !Number.isInteger(num)) {
    showFieldError(fieldId, message || 'Must be a whole number.', i18nKey || 'validation.wholeNumber');
    return false;
  }

  if (num < min) {
    const fallback = `Must be at least ${min}.`;
    showFieldError(fieldId, message || fallback, i18nKey || 'validation.minValue', { min: rules.min });
    return false;
  }

  if (num > max) {
    const fallback = `Must not exceed ${max}.`;
    showFieldError(fieldId, message || fallback, i18nKey || 'validation.maxValue', { max: rules.max });
    return false;
  }

  return true;
}

/**
 * Validate a select field
 * @param {string} fieldId
 * @param {object} rules - { required, message, i18nKey }
 * @returns {boolean}
 */
function validateSelectField(fieldId, rules = {}) {
  const field = document.getElementById(fieldId);
  if (!field) return true;

  const value = field.value;
  const { required = false, message = null, i18nKey = null } = rules;

  hideFieldError(fieldId);

  if (required && !value) {
    showFieldError(fieldId, message || 'Please select an option.', i18nKey || 'validation.selectOption');
    return false;
  }

  return true;
}

/**
 * Clear all field errors in a form
 * @param {string} formId
 */
function clearAllFieldErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.validation-error').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('auto-dismiss');
  });
}

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
  `;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'flash-close';
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = 'background:none;border:none;font-size:20px;cursor:pointer;color:inherit;opacity:0.7;padding:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;';
  closeBtn.addEventListener('click', () => flashDiv.remove());
  flashDiv.appendChild(closeBtn);

  document.body.appendChild(flashDiv);

  setTimeout(() => {
    if (flashDiv.parentElement) {
      flashDiv.style.animation = 'slideUpFlashMessage 0.3s ease-out';
      setTimeout(() => flashDiv.remove(), 300);
    }
  }, 5000);
}
// ==================== CUSTOM CONFIRM & PROMPT ====================

/**
 * Styled confirm dialog matching showFlashMessage aesthetics.
 * Returns a Promise<boolean>: true = OK, false = Cancel/Escape.
 * 
 * Usage (inside an async function):
 *   if (await showFlashConfirm('Are you sure?')) { ... }
 */
function showFlashConfirm(message, type = 'warning') {
  return new Promise((resolve) => {
    // Dismiss any existing flash message first
    document.querySelectorAll('.flash-message, .flash-overlay').forEach(el => el.remove());

    // Backdrop overlay to block page interaction
    const overlay = document.createElement('div');
    overlay.className = 'flash-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.35);
      z-index: 9999; backdrop-filter: blur(2px);
    `;

    const flashDiv = document.createElement('div');
    flashDiv.className = `flash-message flash-${type}`;
    flashDiv.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10000; padding: 15px 20px; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; gap: 14px;
      min-width: 300px; max-width: 90%;
      animation: slideDownFlashMessage 0.3s ease-out;
      ${type === 'success'
        ? 'background: #e8f5e8; border: 2px solid #4caf50; color: #2e7d32;'
        : type === 'warning'
        ? 'background: #fffbf0; border: 2px solid #ffc107; color: #856404;'
        : 'background: #ffebee; border: 2px solid #f44336; color: #c62828;'}
    `;

    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'display: flex; align-items: center; gap: 10px;';
    contentDiv.innerHTML = `
      <span style="font-size: 18px;">${icon}</span>
      <span style="flex: 1; font-size: 14px; font-weight: 500;">${message}</span>
    `;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px;';

    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = `
      padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer;
      font-weight: 600; font-size: 13px;
      background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ffc107' : '#f44336'};
      color: ${type === 'warning' ? '#333' : '#fff'};
      transition: opacity 0.2s;
    `;
    okBtn.onmouseenter = () => okBtn.style.opacity = '0.85';
    okBtn.onmouseleave = () => okBtn.style.opacity = '1';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 6px 14px; border-radius: 6px; border: 1px solid currentColor;
      cursor: pointer; font-weight: 600; font-size: 13px;
      background: transparent; color: inherit; transition: background 0.2s;
    `;
    cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(0,0,0,0.06)';
    cancelBtn.onmouseleave = () => cancelBtn.style.background = 'transparent';

    function cleanup() {
      flashDiv.style.animation = 'slideUpFlashMessage 0.3s ease-out';
      setTimeout(() => { flashDiv.remove(); overlay.remove(); }, 300);
    }

    okBtn.addEventListener('click', () => { cleanup(); resolve(true); });
    cancelBtn.addEventListener('click', () => { cleanup(); resolve(false); });

    // Keyboard support: Enter = OK, Escape = Cancel
    const keyHandler = (e) => {
      if (e.key === 'Enter') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(); resolve(true);
      }
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(); resolve(false);
      }
    };
    document.addEventListener('keydown', keyHandler);

    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(okBtn);
    flashDiv.appendChild(contentDiv);
    flashDiv.appendChild(buttonsDiv);

    document.body.appendChild(overlay);
    document.body.appendChild(flashDiv);
  });
}
function showSuccessMessage(message) {
  showFlashMessage(message, 'success');
}

function formatCurrency(amount) {
  return `$${parseFloat(amount || 0).toFixed(2)}`;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function getCurrentUserToken() {
  console.log('🔍 Searching for authentication token...');
  return 'session';
}

function scrollToAddForm() {
  document.querySelector('.add-fundraiser-sec')?.scrollIntoView({ behavior: 'smooth' });
}

// ==================== MASTER INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  const catEl = document.getElementById('categories-data');
  if (catEl) {
    try { AppConfig.categories = JSON.parse(catEl.dataset.categories || '[]'); } catch(e) {}
  }

  initNavigation();
  initMobileMenu();
  initInputBoxes();
  initFundraiserTypeToggle();
  initCustomSelect();
  initFileUploads();
  initHashtagSystem();
  initDonationStats();
  initDonors();
  initFundraiserStats();
  initComplaintForm();
  initHelpDropdown();
  initMenuDropdown();
  initLanguageSwitcher();
  initLogout();
  initAccountSettings();
  initDeleteFundraiser();
  initFundraiserImageClicks();
  initCategorySystem();
  initFundraiserForm();
  initVerificationButton();
  initControlPanelBtn();
  initAppLibraries();
  debugFunctionAvailability();
  initAchievementSystem();
});

// ==================== NAVIGATION & TABS ====================
function initNavigation() {
  const linkItems = document.querySelectorAll('.links li');
  const contentMap = [
    { menuClass: 'link-content-one', contentClass: 'dashboard-sec' },
    { menuClass: 'link-content-two', contentClass: 'my-fundraisers-sec' },
    { menuClass: 'link-content-three', contentClass: 'add-fundraiser-sec' },
    { menuClass: 'link-content-four', contentClass: 'account-settings-sec' },
  ];

  linkItems.forEach((item, index) => {
    const btn = item.querySelector('a');
    if (!btn) return;
    btn.addEventListener('click', () => {
      linkItems.forEach(mi => mi.classList.remove('active-li'));
      contentMap.forEach(content => {
        const section = document.querySelector(`.${content.contentClass}`);
        if (section) section.style.display = 'none';
      });
      item.classList.add('active-li');
      const activeContent = document.querySelector(`.${contentMap[index].contentClass}`);
      if (activeContent) activeContent.style.display = 'block';
      closeMobileMenu();
    });
  });

  if (linkItems.length > 0) {
    const firstContent = document.querySelector(`.${contentMap[0].contentClass}`);
    if (firstContent) firstContent.style.display = 'block';
  }
}

// ==================== MOBILE MENU ====================
function initMobileMenu() {
  const menuButton = document.querySelector('.access-links-btn');
  const mobileMenu = document.querySelector('.access-links');
  const overlay = document.querySelector('.overlay');

  function openMobileMenu() {
    mobileMenu?.classList.add('active');
    overlay?.classList.add('active');
    menuButton?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window.closeMobileMenu = function() {
    mobileMenu?.classList.remove('active');
    overlay?.classList.remove('active');
    menuButton?.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (menuButton) {
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mobileMenu?.classList.contains('active')) closeMobileMenu();
      else openMobileMenu();
    });
  }

  overlay?.addEventListener('click', closeMobileMenu);
  mobileMenu?.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu?.classList.contains('active')) closeMobileMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 480 && mobileMenu?.classList.contains('active')) closeMobileMenu();
  });
}

// ==================== INPUT BOXES ====================
function initInputBoxes() {
  const inputBoxes = document.querySelectorAll('.input-box');

  inputBoxes.forEach((box) => {
    const inputField = box.querySelector('input');
    const textareaField = box.querySelector('textarea');
    const field = inputField || textareaField;

    if (!field) return;

    const updateState = () => {
      box.classList.toggle('field-is-filled', field.value !== '');
    };

    updateState();

    field.addEventListener('focus', () => box.classList.add('input-box-active'));
    field.addEventListener('blur', () => {
      setTimeout(() => box.classList.remove('input-box-active'), 300);
    });
    field.addEventListener('input', updateState);

    if (textareaField) {
      const signalNum = box.querySelector('.signal_num');
      const limitNum = box.querySelector('.limit_num');
      const maxChars = textareaField.id === 'fundraiserDescription' ? 500 : 100;
      if (limitNum && textareaField.id === 'fundraiserDescription') limitNum.textContent = `/${maxChars}`;
      textareaField.addEventListener('keyup', () => {
        const len = textareaField.value.length;
        if (signalNum) signalNum.textContent = len;
        box.classList.toggle('input-box-active', len > 0);
        box.classList.toggle('error', len > maxChars);
      });
    }
  });
}

function initExpiryDatePicker() {
  const expiryInput = document.getElementById('fundraiserExpiryDate');
  if (!expiryInput) return;

  // Read user type reliably
  const userType = window.appConfig?.userType || 
                   document.body.dataset.userType || 
                   'requester';
  const isCharity = userType === 'Charity';

  const minDays = 7;
  const maxDays = isCharity ? 180 : 90;

  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + minDays);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);

  function applyPicker() {
    if (typeof flatpickr === 'undefined') return;

    // Destroy previous instance if exists
    if (expiryInput._flatpickr) {
      expiryInput._flatpickr.destroy();
    }

    flatpickr(expiryInput, {
      dateFormat: 'Y-m-d',
      minDate: minDate,
      maxDate: maxDate,
      disableMobile: true,
      placeholder: 'Select expiry date...',
      onReady: function() {
        console.log(`✅ Flatpickr initialized for ${isCharity ? 'Charity' : 'Requester'} | Max: ${maxDays} days`);
      }
    });
  }

  // Try immediately
  if (typeof flatpickr !== 'undefined') {
    applyPicker();
  } else {
    // Wait for flatpickr script
    const checkInterval = setInterval(() => {
      if (typeof flatpickr !== 'undefined') {
        clearInterval(checkInterval);
        applyPicker();
      }
    }, 100);

    // Safety timeout
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
}

function initVideoValidation() {
  const videoInput = document.getElementById('fundraiserVideo');
  const videoPreview = document.getElementById('videoPreview');
  if (!videoInput) return;
  videoInput.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) { if (videoPreview) videoPreview.style.display = 'none'; return; }
    if (!file.type.match('video/mp4')) {
        showFieldError('fundraiserVideo', 'Video must be in MP4 format.', 'validation.videoFormat');
        this.value = '';
        if (videoPreview) videoPreview.style.display = 'none';
        return;
    }
    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = function() {
      URL.revokeObjectURL(url);
      const duration = tempVideo.duration;
      if (duration < 30) { showFieldError('fundraiserVideo', 'Video must be at least 30 seconds.', 'validation.videoDuration'); videoInput.value = ''; return; }
      if (duration > 120) { showFieldError('fundraiserVideo', 'Video must not exceed 2 minutes.', 'validation.videoDuration'); videoInput.value = ''; return; }
      if (videoPreview) { videoPreview.src = URL.createObjectURL(file); videoPreview.style.display = 'block'; }
      hideFieldError('fundraiserVideo');
    };
    tempVideo.src = url;
  });
}

function initFundAllocationUI() {
  const addBtn = document.getElementById('addAllocationBtn');
  const pctRow3 = document.getElementById('pctRow3');
  const pctRow4 = document.getElementById('pctRow4');
  const totalEl = document.getElementById('fundAllocationTotal');
  if (!addBtn) return;
  let visibleRows = 2;

  function updateTotal() {
    let total = 0;
    let hasNegative = false;
    document.querySelectorAll('.pct-input').forEach(input => {
      const val = parseFloat(input.value) || 0;
      if (val < 0) hasNegative = true;
      total += val;
    });
    if (totalEl) {
      totalEl.textContent = `Total: ${total.toFixed(2)}%`;
      if (hasNegative) {
        totalEl.textContent += ' (Negative values not allowed)';
        totalEl.style.color = '#f44336';
      } else {
        totalEl.style.color = Math.abs(total - 100) < 0.01 ? '#4caf50' : (total > 100 ? '#f44336' : '#ff9800');
      }
    }
  }

  // ── Reject negative input on type ──
  document.querySelectorAll('.pct-input').forEach(input => {
    input.addEventListener('input', () => {
      if (parseFloat(input.value) < 0) input.value = '';
      updateTotal();
    });
  });

  addBtn.addEventListener('click', function() {
    if (visibleRows >= 4) {
      showFlashMessage('Maximum 4 allocations allowed.', 'warning');
      return;
    }
    visibleRows++;
    if (visibleRows === 3 && pctRow3) {
      pctRow3.style.display = 'flex';
    } else if (visibleRows === 4 && pctRow4) {
      pctRow4.style.display = 'flex';
      addBtn.style.display = 'none';
    }
  });

  document.querySelectorAll('.remove-pct-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = document.getElementById(`pctRow${this.dataset.row}`);
      if (row) {
        row.style.display = 'none';
        row.querySelectorAll('input').forEach(i => i.value = '');
        visibleRows--;
        addBtn.style.display = 'inline-block';
        updateTotal();
      }
    });
  });
}

// ==================== FUNDRAISER TYPE TOGGLE ====================
function initFundraiserTypeToggle() {
  const selector = document.getElementById('fundraiser-type-selector');
  if (!selector) return;

  const fundraiserBtn = document.getElementById('fundraiser-type-btn');
  const donationBtn   = document.getElementById('donation-type-btn');
  const typeInput     = document.getElementById('fundraiserTypeInput');
  const moneyReqBox   = document.getElementById('money-req-box');
  const descHeading   = document.getElementById('description-heading');
  const targetInput   = document.getElementById('targetAmount');

  const FUNDRAISER_DESC = '<h1 data-i18n="userPanelAddFundraiserDescriptionTgt">Type Fundraiser Description :</h1>';
  const DONATION_DESC   = '<h1 data-i18n="userPanelAddFundraiserCharityDescriptionTgt">Enter a description of the donation :</h1>';

  const userType = window.appConfig?.userType || '';
  const isCharity = userType === 'Charity';

  const expiryNote = document.getElementById('expiryNote');
  const expiryNoteText = expiryNote?.querySelector('p');
  const donationItemBox = document.getElementById('donationItemBox');
  const fundAllocationBox = document.getElementById('fundAllocationBox');
  const donatedItemType = document.getElementById('donatedItemType');

  function updateExpiryNote() {
    if (!expiryNoteText) return;
    const isDonation = typeInput?.value === 'Donation';
    const noteKey = isCharity
      ? 'userPanelAddFundraiserExpiryNoteCharityTgt'
      : 'userPanelAddFundraiserExpiryNoteRequesterTgt';
    const charityNote = 'We recommend entering a near expiration date for urgent campaigns, and the campaign duration should be between 7 and 180 days.';
    const requesterNote = 'We recommend entering a near expiration date for urgent campaigns, and the campaign duration should be between 7 and 90 days.';
    expiryNoteText.textContent = isCharity ? charityNote : requesterNote;
    expiryNoteText.setAttribute('data-i18n', noteKey);
    if (typeof i18next !== 'undefined' && i18next.t) {
      expiryNoteText.textContent = i18next.t(noteKey);
    }
  }

  function toggleDonationItemFields(show) {
    if (donationItemBox) donationItemBox.style.display = show ? 'block' : 'none';
  }

  function toggleFundAllocationFields(show) {
    if (fundAllocationBox) fundAllocationBox.style.display = show ? 'block' : 'none';
  }

  function setFundraiserMode() {
    selector.classList.remove('donation-mode');
    selector.classList.add('fundraiser-mode');
    fundraiserBtn.classList.add('active-type');
    donationBtn.classList.remove('active-type');
    moneyReqBox.style.display = '';
    if (targetInput) { targetInput.value = ''; }
    descHeading.innerHTML = FUNDRAISER_DESC;
    const h1 = descHeading.querySelector('h1');
    if (h1 && typeof i18next !== 'undefined' && i18next.t) {
      const key = h1.getAttribute('data-i18n');
      if (key) h1.innerHTML = i18next.t(key);
    }
    if (typeInput) typeInput.value = 'Fundraiser';

    updateExpiryNote();
    if (isCharity) {
      toggleDonationItemFields(false);
      toggleFundAllocationFields(true);
    }
  }

  function setDonationMode() {
    selector.classList.remove('fundraiser-mode');
    selector.classList.add('donation-mode');
    donationBtn.classList.add('active-type');
    fundraiserBtn.classList.remove('active-type');
    moneyReqBox.style.display = 'none';
    if (targetInput) {
      targetInput.value = '';
    }
    descHeading.innerHTML = DONATION_DESC;
    const h1 = descHeading.querySelector('h1');
    if (h1 && typeof i18next !== 'undefined' && i18next.t) {
      const key = h1.getAttribute('data-i18n');
      if (key) h1.innerHTML = i18next.t(key);
    }
    if (typeInput) typeInput.value = 'Donation';

    updateExpiryNote();
    if (isCharity) {
      toggleDonationItemFields(true);
      const selectedType = donatedItemType?.value;
      toggleFundAllocationFields(selectedType === 'Money');
    }
  }

  donatedItemType?.addEventListener('change', function() {
    const isMoney = this.value === 'Money';
    const otherField = document.getElementById('otherDonationTypeField');
    if (otherField) {
      otherField.style.display = this.value === 'Other' ? 'block' : 'none';
    }
    if (isCharity && typeInput?.value === 'Donation') {
      toggleFundAllocationFields(isMoney);
    }
  });

  fundraiserBtn?.addEventListener('click', (e) => { e.preventDefault(); setFundraiserMode(); });
  donationBtn?.addEventListener('click', (e) => { e.preventDefault(); setDonationMode(); });

  initExpiryDatePicker();
  initVideoValidation();
  initFundAllocationUI();

  setFundraiserMode();

}

  // ── Ensure expiry picker runs for ALL user types (Requester + Charity) ──
initExpiryDatePicker();
// ==================== CUSTOM SELECT (CATEGORIES) ====================
function initCustomSelect() {
  const customSelects = document.querySelectorAll('.custom-select');
  const selectBoxes = document.querySelectorAll('.select-box');

  function updateSelectedOptions(customSelect) {
    const selectedOptions = Array.from(customSelect.querySelectorAll('.option.active'))
      .filter(option => option !== customSelect.querySelector('.option.all-tags'))
      .map(option => ({
        value: option.getAttribute('data-value'),
        text: option.textContent.trim()
      }));

    const selectedValues = selectedOptions.map(option => option.value);
    const tagsInput = customSelect.querySelector('.tags_input');
    if (tagsInput) tagsInput.value = selectedValues.join(', ');

    const selectedOptionsContainer = customSelect.querySelector('.selected-options');
    if (!selectedOptionsContainer) return;

    let tagsHTML = '';
    if (selectedOptions.length === 0) {
      tagsHTML = '<span class="placeholder">Select The Categories</span>';
    } else {
      const maxVisibleTags = window.innerWidth < 480 ? 2 : 3;
      const visibleTags = selectedOptions.slice(0, maxVisibleTags);
      const remainingCount = selectedOptions.length - maxVisibleTags;

      visibleTags.forEach(option => {
        tagsHTML += `<div class="tag">${option.text}<span class="remove-tag" data-value="${option.value}">×</span></div>`;
      });

      if (remainingCount > 0) {
        tagsHTML += `<div class="tag remaining-count">+${remainingCount}</div>`;
      }
    }
    selectedOptionsContainer.innerHTML = tagsHTML;
  }

  customSelects.forEach(function(customSelect) {
    const searchInput = customSelect.querySelector('.search-tags');
    const optionsContainer = customSelect.querySelector('.options');
    const noResultMessage = customSelect.querySelector('.no-result-message');
    const options = customSelect.querySelectorAll('.option');
    const allTagsOption = customSelect.querySelector('.option.all-tags');
    const clearButton = customSelect.querySelector('.clear');

    if (optionsContainer) optionsContainer.style.display = 'none';

    allTagsOption?.addEventListener('click', function() {
      const isActive = allTagsOption.classList.contains('active');
      options.forEach(option => {
        if (option !== allTagsOption) option.classList.toggle('active', !isActive);
      });
      allTagsOption.classList.toggle('active', !isActive);
      updateSelectedOptions(customSelect);
    });

    clearButton?.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      options.forEach(option => option.style.display = 'block');
      if (noResultMessage) noResultMessage.style.display = 'none';
      optionsContainer?.classList.remove('option-search-active');
    });

    searchInput?.addEventListener('input', function() {
      const searchTerm = searchInput.value.toLowerCase();
      options.forEach(option => {
        if (option === allTagsOption) return;
        const optionText = option.textContent.trim().toLowerCase();
        option.style.display = optionText.includes(searchTerm) ? 'block' : 'none';
      });

      const anyOptionsMatch = Array.from(options).some(option => option.style.display === 'block' && option !== allTagsOption);
      if (noResultMessage) noResultMessage.style.display = anyOptionsMatch ? 'none' : 'block';
      optionsContainer?.classList.toggle('option-search-active', !!searchInput.value);
    });

    options.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        if (option === allTagsOption) return;
        option.classList.toggle('active');
        updateSelectedOptions(customSelect);
      });
    });
  });

  document.addEventListener('click', function(event) {
    const removeTag = event.target.closest('.remove-tag');
    if (removeTag) {
      event.stopPropagation();
      const customSelect = removeTag.closest('.custom-select');
      const valueToRemove = removeTag.getAttribute('data-value');
      const optionToRemove = customSelect?.querySelector(`.option[data-value="${valueToRemove}"]`);
      if (optionToRemove) {
        optionToRemove.classList.remove('active');
        const otherSelectedOptions = customSelect.querySelectorAll('.option.active:not(.all-tags)');
        const allTagsOption = customSelect.querySelector('.option.all-tags');
        if (otherSelectedOptions.length === 0) allTagsOption?.classList.remove('active');
        updateSelectedOptions(customSelect);
      }
    }
  });

  selectBoxes.forEach(selectBox => {
    selectBox.addEventListener('click', function(event) {
      if (event.target.closest('.tag') || event.target.closest('.options')) return;
      const optionsContainer = selectBox.querySelector('.options');
      const isOpen = selectBox.parentNode.classList.contains('open');

      customSelects.forEach(cs => {
        cs.classList.remove('open');
        const opts = cs.querySelector('.options');
        if (opts) opts.style.display = 'none';
      });

      if (!isOpen) {
        selectBox.parentNode.classList.add('open');
        if (optionsContainer) optionsContainer.style.display = 'block';
      }
    });
  });

  document.addEventListener('click', function(event) {
    if (!event.target.closest('.custom-select') && !event.target.classList.contains('remove-tag')) {
      customSelects.forEach(customSelect => {
        customSelect.classList.remove('open');
        const opts = customSelect.querySelector('.options');
        if (opts) opts.style.display = 'none';
      });
    }
  });
}

// ==================== FILE UPLOAD HELPERS ====================
function truncateFilename(name, maxLen) {
  if (name.length <= maxLen) return name;
  const ext = name.lastIndexOf('.');
  const extension = ext > -1 ? name.slice(ext) : '';
  return name.slice(0, maxLen - extension.length - 3) + '...' + extension;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ==================== FILE UPLOADS ====================
function initFileUploads() {
  document.querySelectorAll('.file-input').forEach(fileInput => {
    const wrapper = fileInput.closest('.wrapper');
    const imageBox = wrapper?.querySelector('.image-box');
    if (!imageBox) return;

    const uploadPlaceholder = imageBox.querySelector('.upload-placeholder');
    const uploadInfo = imageBox.querySelector('.upload-info');
    const uploadSuccess = imageBox.querySelector('.upload-success-state');

    // Only bind click to the placeholder (not the whole imageBox)
    // This prevents double-triggering when clicking the hidden file input
    if (uploadPlaceholder) {
      uploadPlaceholder.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    fileInput.addEventListener('change', ({target}) => {
      const file = target.files[0];
      if (!file) return;

      // Prevent re-processing if already handled
      if (wrapper.classList.contains('upload-success') || wrapper.dataset.processing === 'true') {
        return;
      }

      const uploadType = wrapper.dataset.uploadType;
      const fieldName = target.name || 'mainImage';
      let isValid = true;

      // ── Validation ──
      if (uploadType === 'image' && !file.type.match('image.*')) {
        showFieldError(fieldName, 'Please select an image file (JPG/PNG).', 'validation.imageType');
        isValid = false;
      } else if (uploadType === 'video' && !file.type.match('video/mp4')) {
        showFieldError(fieldName, 'Video must be in MP4 format.', 'validation.videoFormat');
        isValid = false;
      } else if (uploadType === 'document') {
        if (file.type !== 'application/pdf') {
          showFieldError(fieldName, 'Please select a PDF file.', 'validation.invalidFormat');
          isValid = false;
        } else if (file.size > 10 * 1024 * 1024) {
          showFieldError(fieldName, 'File size must not exceed 10MB.', 'validation.maxValue');
          isValid = false;
        }
      }

      if (!isValid) {
        target.value = '';
        return;
      }

      // Mark as processing to prevent duplicate runs
      wrapper.dataset.processing = 'true';

      // ── Show file info + progress ──
      if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
      if (uploadInfo) {
        uploadInfo.style.display = 'flex';
        const nameEl = uploadInfo.querySelector('.file-name');
        const typeEl = uploadInfo.querySelector('.file-type');
        const sizeEl = uploadInfo.querySelector('.file-size');
        if (nameEl) nameEl.textContent = truncateFilename(file.name, 25);
        if (typeEl) typeEl.textContent = file.type.split('/')[1]?.toUpperCase() || file.name.split('.').pop().toUpperCase();
        if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
      }

      // ── Image preview ──
      if (uploadType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          let preview = imageBox.querySelector('.image-preview');
          if (!preview) {
            preview = document.createElement('img');
            preview.className = 'image-preview';
            preview.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:5px;position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;';
            imageBox.appendChild(preview);
          }
          preview.src = e.target.result;
          imageBox.classList.add('has-preview');
        };
        reader.readAsDataURL(file);
      }

      simulateUpload(file, wrapper, imageBox);
    });
  });
}

function simulateUpload(file, wrapper, imageBox) {
  const uploadInfo = imageBox.querySelector('.upload-info');
  const uploadSuccess = imageBox.querySelector('.upload-success-state');
  const uploadPlaceholder = imageBox.querySelector('.upload-placeholder');
  const progressFill = uploadInfo?.querySelector('.progress-fill');
  const progressPercent = uploadInfo?.querySelector('.progress-percent');

  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    if (progress > 100) progress = 100;

    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressPercent) progressPercent.textContent = `${progress}%`;

    if (progress === 100) {
      clearInterval(interval);
      // Switch to success state
      if (uploadInfo) uploadInfo.style.display = 'none';
      if (uploadSuccess) {
        uploadSuccess.style.display = 'flex';
        const nameEl = uploadSuccess.querySelector('.file-name');
        const typeEl = uploadSuccess.querySelector('.file-type');
        const sizeEl = uploadSuccess.querySelector('.file-size');
        if (nameEl) nameEl.textContent = truncateFilename(file.name, 25);
        if (typeEl) typeEl.textContent = file.type.split('/')[1]?.toUpperCase() || file.name.split('.').pop().toUpperCase();
        if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
      }
      wrapper?.classList.add('upload-success');
      // Clear processing flag so user can re-select if needed
      if (wrapper) wrapper.dataset.processing = '';
    }
  }, 100);
}

// ==================== HASHTAG SYSTEM ====================
function initHashtagSystem() {
  const hashtagInput = document.getElementById('hashtagInput');
  if (!hashtagInput || typeof Tagify === 'undefined') return;

  const tagify = new Tagify(hashtagInput, {
    maxTags: 10,
    pattern: /^[a-zA-Z0-9_\u0600-\u06FF]{2,30}$/,
    dropdown: { enabled: 1, maxItems: 10, closeOnSelect: false, highlightFirst: true },
    originalInputValueFormat: valuesArr => JSON.stringify(valuesArr.map(item => item.value))
  });

  fetch('/api/hashtags/popular')
    .then(r => r.json())
    .then(data => {
      const whitelist = data.map(h => h.tag_name);
      tagify.settings.whitelist = whitelist;
    })
    .catch(() => {});

  const titleInput = document.getElementById('fundraiserTitle');
  const suggestedContainer = document.getElementById('autoSuggestedTags');

  titleInput?.addEventListener('blur', () => {
    const title = titleInput.value.trim();
    if (!title || tagify.value.length > 0) return;

    fetch('/api/hashtags/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    .then(r => r.json())
    .then(data => {
      if (data.suggested && data.suggested.length > 0) {
        suggestedContainer.innerHTML = '<p>💡 Suggested hashtags from title:</p>' +
          data.suggested.map(tag => `<button type="button" class="suggested-tag-btn" data-tag="${tag}">#${tag}</button>`).join('');

        suggestedContainer.querySelectorAll('.suggested-tag-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            tagify.addTags([btn.dataset.tag]);
            btn.style.display = 'none';
          });
        });
      }
    })
    .catch(() => {});
  });
}

// ==================== DONATION STATISTICS ====================
function initDonationStats() {
  loadDonationStats();
}

async function loadDonationStats() {
  try {
    const response = await fetch('/api/invoices/donation-stats', {
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.status === 401 || response.status === 404) return;
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (result.success) {
      donationStats = result.data;
      updateDonationTemplates();
      initializeDonationChart();
    }
  } catch (error) {
    console.error('💥 [DONATION STATS] Error:', error);
  }
}

function updateDonationTemplates() {
  const monthlyElement = document.querySelector('.progress-in-month h2');
  if (monthlyElement) monthlyElement.textContent = formatCurrency(donationStats.monthlyTotal);

  const totalElement = document.querySelector('.total-donations h2');
  if (totalElement) totalElement.textContent = formatCurrency(donationStats.allTimeTotal);
}

function initializeDonationChart() {
  const chartEl = document.querySelector('.donation-chart');
  if (!chartEl) return;

  const chartTitle = document.getElementById('chart-title');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const minLabel = document.querySelector('.scale-labels .min');
  const maxLabel = document.querySelector('.scale-labels .max');

  function generateMonthlyData() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if (chartTitle) chartTitle.textContent = `${monthNames[currentMonth]} ${currentYear} Donations`;

    const donations = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatDate(date);
      donations[dateStr] = donationStats.dailyDonations[dateStr] || 0;
    }
    return { donations, today };
  }

  const { donations: donationsData, today } = generateMonthlyData();
  const donations = Object.entries(donationsData)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let currentCenterDate = new Date(today);

  function renderChart() {
    chartEl.innerHTML = '';
    const datesToShow = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(currentCenterDate);
      date.setDate(date.getDate() + i);
      datesToShow.push(date);
    }

    const barsData = datesToShow.map(date => {
      const dateStr = formatDate(date);
      const donation = donations.find(d => d.date === dateStr);
      return { date, amount: donation ? donation.amount : 0, isToday: isSameDay(date, today) };
    });

    const amounts = barsData.map(b => b.amount);
    const maxAmount = Math.max(...amounts, 10);
    const minAmount = Math.min(...amounts);

    if (maxLabel) maxLabel.textContent = `$${maxAmount}`;
    if (minLabel) minLabel.textContent = `$${minAmount}`;

    barsData.forEach((bar) => {
      const barEl = document.createElement('div');
      barEl.className = `donation-bar ${bar.isToday ? 'today' : ''}`;
      const heightPercentage = maxAmount > 0 ? (bar.amount / maxAmount) * 100 : 0;
      barEl.style.height = `${heightPercentage}%`;

      const labelEl = document.createElement('div');
      labelEl.className = 'bar-label';
      labelEl.textContent = bar.date.getDate();
      barEl.appendChild(labelEl);

      if (bar.amount > 0) {
        const valueEl = document.createElement('div');
        valueEl.className = 'bar-value';
        valueEl.textContent = `$${bar.amount}`;
        barEl.appendChild(valueEl);
      }
      chartEl.appendChild(barEl);
    });
  }

  prevBtn?.addEventListener('click', () => {
    currentCenterDate.setDate(currentCenterDate.getDate() - 7);
    updateChartTitle(currentCenterDate);
    renderChart();
  });

  nextBtn?.addEventListener('click', () => {
    currentCenterDate.setDate(currentCenterDate.getDate() + 7);
    updateChartTitle(currentCenterDate);
    renderChart();
  });

  function updateChartTitle(date) {
    if (!chartTitle) return;
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    chartTitle.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()} Donations`;
  }

  renderChart();
}

// ==================== DONORS TABLE ====================
function initDonors() {
  loadDonors();

  // Event delegation for thank buttons (replaces inline onclick)
  const tbody = document.querySelector('.thanks-table tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const thankBtn = e.target.closest('.btn-thank');
      if (thankBtn) {
        const donorId = thankBtn.dataset.donorId;
        if (donorId) thankDonor(donorId);
      }

      const imgCell = e.target.closest('.user-image-cell');
      if (imgCell) {
        const userThankedId = imgCell.dataset.userThankedId;
        if (userThankedId) {
          window.location.href = `/donor-account/${userThankedId}`;
        }
      }
    });
  }
}

async function loadDonors() {
  try {
    const response = await fetch('/api/donors/my-donors', {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (result.success) {
      donorsList = result.data;
      displayDonorsTable();
    }
  } catch (error) {
    console.error('💥 [DONORS] Error:', error);
  }
}

function displayDonorsTable() {
  const tbody = document.querySelector('.thanks-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (donorsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">No donors found yet. Share your fundraisers to receive donations!</td></tr>`;
    return;
  }

  donorsList.forEach((donor) => {
    const row = document.createElement('tr');

    const userImage = donor.user_image
      ? `<img src="${donor.user_image}" alt="${escapeHtml(donor.full_name)}" class="user-avatar">`
      : '<div class="default-avatar">👤</div>';

    const thankButton = donor.already_thanked
      ? `<button class="btn-thanked" disabled title="Already thanked"><i class="fas fa-check-circle"></i> Thanked</button>`
      : `<button class="btn-thank" data-donor-id="${donor.donor_postgres_id}" title="Say thank you to ${escapeHtml(donor.full_name)}"><i class="fas fa-heart"></i> Thank</button>`;

    const userThankedId = donor.donor_postgres_id;

    row.innerHTML = `
      <td class="user-image-cell" data-user-thanked-id="${userThankedId}" style="cursor: pointer;">
        ${userImage}
      </td>
      <td class="user-name-cell">${escapeHtml(donor.full_name || 'Anonymous Donor')}</td>
      <td class="th-btn">${thankButton}</td>
    `;
    tbody.appendChild(row);
  });
}

async function thankDonor(donorPostgresId) {
  try {
    if (!await showFlashConfirm('Are you sure you want to send a thank you to this donor? They will receive 5 points.')) return;

    const response = await fetch('/api/donors/thank-donor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donor_postgres_id: donorPostgresId })
    });

    const result = await response.json();
    if (result.success) {
      showSuccessMessage(result.message);
      loadDonors();
    }
  } catch (error) {
    console.error('💥 [DONORS] Error thanking donor:', error);
  }
}

// ==================== FUNDRAISER STATISTICS ====================
function initFundraiserStats() {
  loadFundraiserStats();
}

async function loadFundraiserStats() {
  try {
    const response = await fetch('/api/invoices/fundraiser-stats', {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (result.success) {
      fundraiserStats = result.data;
      updateFundraiserTemplates();
      updatePieCharts();
    }
  } catch (error) {
    console.error('💥 [FUNDRAISER STATS] Error:', error);
  }
}

function updateFundraiserTemplates() {
  const completedDonationsElement = document.querySelector('.completed-donations h2');
  if (completedDonationsElement) completedDonationsElement.textContent = formatCurrency(fundraiserStats.completedDonationsTotal);
}

function updatePieCharts() {
  const completedPieElement = document.querySelector('.total-completed-statistics-box .pie');
  if (completedPieElement) {
    completedPieElement.style.setProperty('--p', fundraiserStats.completedFundraisersPercentage);
    completedPieElement.textContent = `${fundraiserStats.completedFundraisersPercentage}%`;
  }

  const totalPieElement = document.querySelector('.total-statistics-box .pie');
  if (totalPieElement) {
    totalPieElement.style.setProperty('--p', fundraiserStats.totalProgressPercentage);
    totalPieElement.textContent = `${fundraiserStats.totalProgressPercentage}%`;
  }

  restartPieAnimations();
}

function restartPieAnimations() {
  document.querySelectorAll('.pie').forEach(pie => {
    const newPie = pie.cloneNode(true);
    pie.parentNode.replaceChild(newPie, pie);
  });
}

// ==================== COMPLAINT FORM ====================
function initComplaintForm() {
  const complaintForm = document.getElementById('complaintForm');
  const complaintContent = document.getElementById('complaint_content');
  const signalNum = document.querySelector('.signal_num');
  const complaintMessage = document.getElementById('complaintMessage');

  if (!complaintForm) return;

  if (complaintContent && signalNum) {
    complaintContent.addEventListener('input', function() {
      signalNum.textContent = this.value.length;
      signalNum.style.color = this.value.length > 900 ? '#ff6b6b' : '';
    });
  }

  complaintForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent || 'Send';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    if (complaintMessage) complaintMessage.style.display = 'none';

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint_content: complaintContent.value.trim() })
      });

      const result = await response.json();
      if (complaintMessage) {
        complaintMessage.style.display = 'block';
        complaintMessage.textContent = result.message;
        complaintMessage.className = result.success ? 'success-message' : 'error-message';
      }

      if (result.success) {
        complaintForm.reset();
        if (signalNum) signalNum.textContent = '0';
      }
    } catch (error) {
      if (complaintMessage) {
        complaintMessage.style.display = 'block';
        complaintMessage.className = 'error-message';
        complaintMessage.textContent = 'Failed to submit complaint. Please try again.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

// ==================== HELP DROPDOWN ====================
function initHelpDropdown() {
  const helpBtn = document.getElementById('helpBtn');
  const submitComplaint = document.getElementById('submitComplaint');

  helpBtn?.addEventListener('click', function(e) {
    e.preventDefault();
    submitComplaint?.classList.toggle('show');
  });

  document.addEventListener('click', function(e) {
    if (!helpBtn?.contains(e.target) && !submitComplaint?.contains(e.target)) {
      submitComplaint?.classList.remove('show');
    }
  });
}

// ==================== MENU DROPDOWN ====================
function initMenuDropdown() {
  const menuButton = document.getElementById('menuButton');
  const dropdownMenu = document.getElementById('dropdownMenu');

  menuButton?.addEventListener('click', function(e) {
    e.preventDefault();
    dropdownMenu?.classList.toggle('show');
  });

  document.addEventListener('click', function(e) {
    if (!menuButton?.contains(e.target) && !dropdownMenu?.contains(e.target)) {
      dropdownMenu?.classList.remove('show');
    }
  });
}

// ==================== LANGUAGE SWITCHER ====================
function initLanguageSwitcher() {
  const languageMenu = document.getElementById('languageMenu');
  const languageSwitcher = document.getElementById('languageSwitcher');
  const dropdownMenu = document.getElementById('dropdownMenu');

  languageMenu?.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    languageSwitcher?.classList.toggle('show');
    languageSwitcher?.classList.toggle('flex');
  });

  document.addEventListener('click', function(e) {
    if (!dropdownMenu?.contains(e.target)) {
      languageSwitcher?.classList.remove('show');
      languageSwitcher?.classList.remove('flex');
    }
  });

  languageSwitcher?.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(button => {
    button.addEventListener('click', function() {
      langButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      languageSwitcher?.classList.remove('show');
      languageSwitcher?.classList.remove('flex');
    });
  });
}

// ==================== LOGOUT ====================
function initLogout() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (ev) => {
    ev.preventDefault();
    if (!await showFlashConfirm('Are you sure you want to logout?')) return;

    try {
      const logoutResponse = await fetch('/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      });

      // Always clear client-side storage regardless of server response
      sessionStorage.clear();
      localStorage.clear();

      // Force clear all cookies by setting them to expire
      document.cookie.split(';').forEach(function(c) {
        const cookieName = c.split('=')[0].trim();
        document.cookie = cookieName + '=;expires=' + new Date(0).toUTCString() + ';path=/';
      });

      // Small delay to ensure cookie clear is processed, then force hard redirect
      setTimeout(() => {
        window.location.replace('/?logout=true&t=' + new Date().getTime());
      }, 100);

    } catch (err) {
      console.error('Logout error:', err);
      // Even on error, clear everything and redirect
      sessionStorage.clear();
      localStorage.clear();
      document.cookie.split(';').forEach(function(c) {
        const cookieName = c.split('=')[0].trim();
        document.cookie = cookieName + '=;expires=' + new Date(0).toUTCString() + ';path=/';
      });
      window.location.replace('/?logout=true&t=' + new Date().getTime());
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  ACCOUNT SETTINGS - VALIDATION & IMAGE PREVIEW
// ═══════════════════════════════════════════════════════════════════════════

function initAccountSettings() {
  const form = document.getElementById('changeSettingsForm');
  if (!form) return;

  const oldPasswordInput = document.getElementById('oldPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmNewPassword');
  const imageInput = document.getElementById('changeUserImage');
  const uploadArea = document.getElementById('userImageUploadArea');
  const previewContainer = document.getElementById('userImagePreview');
  const previewImg = document.getElementById('userImagePreviewImg');
  const removeBtn = document.getElementById('removeUserImage');
  const changeBtn = form.querySelector('.change-btn');

  // ── Image Upload Preview ──
  if (imageInput && uploadArea) {
    uploadArea.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', function() {
      const file = this.files[0];
      hideFieldError('change-user-image-error');
      hideFieldError('change-image-error');
      uploadArea.classList.remove('has-error');

      if (!file) return;

      // Validate file type
      if (!file.type.match('image.*')) {
        showFieldError('change-user-image-error', 'Please select a valid image file (JPG, PNG, GIF).', 'validation.imageType');
        uploadArea.classList.add('has-error');
        this.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showFieldError('change-user-image-error', 'Image size must not exceed 5MB.', 'validation.imageSize');
        uploadArea.classList.add('has-error');
        this.value = '';
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewContainer.style.display = 'block';
        uploadArea.classList.add('input-box-active');
      };
      reader.readAsDataURL(file);
    });

    // Remove image
    removeBtn?.addEventListener('click', function(e) {
      e.stopPropagation();
      imageInput.value = '';
      previewContainer.style.display = 'none';
      previewImg.src = '';
      uploadArea.classList.remove('input-box-active');
    });
  }

  // ── Input focus effects ──
  [oldPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
    if (!input) return;
    input.addEventListener('focus', () => {
      input.closest('.input-box')?.classList.add('input-box-active');
    });
    input.addEventListener('blur', () => {
      setTimeout(() => input.closest('.input-box')?.classList.remove('input-box-active'), 300);
    });
    input.addEventListener('input', () => {
      hideFieldError(input.id + '-error');
      input.classList.remove('error-field');
    });
  });

  // ── Form Submit with Validation ──
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllFieldErrors('changeSettingsForm');
    
    let isValid = true;
    let hasChanges = false;

    const oldPass = oldPasswordInput?.value.trim() || '';
    const newPass = newPasswordInput?.value.trim() || '';
    const confirmPass = confirmPasswordInput?.value.trim() || '';
    const newImage = imageInput?.files[0] || null;

    // Check if any changes were made
    if (!oldPass && !newPass && !confirmPass && !newImage) {
              showFieldError('old-password-error', 'Please update password or image.', 'validation.required');
      isValid = false;
    }

    // ── Password Validation ──
    if (oldPass || newPass || confirmPass) {
      hasChanges = true;

      // Old password required if changing password
      if (!oldPass) {
        showFieldError('old-password-error', 'Current password is required to change password.', 'validation.required');
        oldPasswordInput?.classList.add('error-field');
        isValid = false;
      }

      // New password validation
      if (!newPass) {
        showFieldError('new-password-error', 'New password is required.', 'validation.required');
        newPasswordInput?.classList.add('error-field');
        isValid = false;
      } else if (newPass.length < 6) {
        showFieldError('new-password-error', 'New password must be at least 6 characters.', 'validation.passwordMin');
        newPasswordInput?.classList.add('error-field');
        isValid = false;
      } else if (newPass.length > 128) {
        showFieldError('new-password-error', 'New password must not exceed 128 characters.', 'validation.passwordMax');
        newPasswordInput?.classList.add('error-field');
        isValid = false;
      }

      // Confirm password validation
      if (!confirmPass) {
        showFieldError('confirm-new-password-error', 'Please confirm your new password.', 'validation.required');
        confirmPasswordInput?.classList.add('error-field');
        isValid = false;
      } else if (newPass !== confirmPass) {
        showFieldError('confirm-new-password-error', 'Passwords do not match.', 'validation.passwordMatch');
        confirmPasswordInput?.classList.add('error-field');
        isValid = false;
      }

      // Cannot use old password as new password
      if (oldPass && newPass && oldPass === newPass) {
        showFieldError('new-password-error', 'New password cannot be the same as old password.', 'validation.passwordSame');
        newPasswordInput?.classList.add('error-field');
        isValid = false;
      }
    }

    // ── Image Validation ──
    if (newImage) {
      hasChanges = true;
      if (!newImage.type.match('image.*')) {
        showFieldError('change-image-error', 'Please select a valid image file.', 'validation.imageType');
        uploadArea?.classList.add('has-error');
        isValid = false;
      }
    }

    if (!isValid || !hasChanges) return;

    // ── Loading State ──
    if (changeBtn) {
      changeBtn.disabled = true;
      changeBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
    }

    try {
      // Handle password update
      if (oldPass && newPass) {
        const response = await fetch('/user-auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass })
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          // Handle specific server errors
          const errorMsg = data.error || 'Failed to update password.';
          // Map common server errors to i18n keys
          const translatedError = t(data.i18nKey || '', errorMsg);
          if (errorMsg.toLowerCase().includes('old') || errorMsg.toLowerCase().includes('current')) {
            showFieldError('old-password-error', translatedError);
            oldPasswordInput?.classList.add('error-field');
          } else if (errorMsg.toLowerCase().includes('new') || errorMsg.toLowerCase().includes('password')) {
            showFieldError('new-password-error', errorMsg);
            newPasswordInput?.classList.add('error-field');
          } else {
            showFlashMessage(errorMsg, 'error');
          }
          throw new Error(errorMsg);
        }
        
        showFlashMessage(data.message || 'Password updated successfully!', 'success');
        // Clear password fields
        oldPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
      }

      // Handle image update
      if (newImage) {
        const formData = new FormData();
        formData.append('image', newImage);
        
        const response = await fetch('/user-auth/update-image', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          showFieldError('change-image-error', data.error || 'Failed to update image.');
          throw new Error(data.error || 'Image update failed');
        }
        
        showFlashMessage(data.message || 'Profile image updated successfully!', 'success');
      }

      // Reload after short delay if anything succeeded
      setTimeout(() => location.reload(), 1500);

    } catch (err) {
      console.error('Account settings error:', err);
      // Error already shown above
    } finally {
      if (changeBtn) {
        changeBtn.disabled = false;
        changeBtn.innerHTML = 'Save Changes';
      }
    }
  });
}

// ==================== DELETE FUNDRAISER ====================
function initDeleteFundraiser() {
  // Use event delegation on the fundraisers container
  const container = document.querySelector('.my-fundraisers-boxes');
  if (!container) return;

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const fundraiserId = btn.dataset.fundraiserId;
    if (!fundraiserId) return;

    if (await showFlashConfirm('Are you sure you want to delete this fundraiser? This action cannot be undone.', 'error')) {
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Deleting...';
      btn.disabled = true;

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/userPanelIndigent/delete-fundraiser/${fundraiserId}`;

      const csrfToken = document.querySelector('meta[name="csrf-token"]');
      if (csrfToken) {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_csrf';
        csrfInput.value = csrfToken.getAttribute('content');
        form.appendChild(csrfInput);
      }

      document.body.appendChild(form);
      form.submit();
    }
  });
}



// ==================== FUNDRAISER IMAGE CLICKS ====================
function initFundraiserImageClicks() {
  document.querySelectorAll('.js-fundraiser-img').forEach(el => {
    el.addEventListener('click', () => {
      const status = el.dataset.status;
      const id = el.dataset.id;
      // Do not navigate if campaign is awaiting verification
      if (status === 'waiting_verification') {
        showFlashMessage('This campaign is awaiting verification. Donations will be activated after verification is complete.', 'warning');
        return;
      }
      let targetUrl;
      switch(status) {
        case 'incompleted': targetUrl = `/fundraiser/${id}`; break;
        case 'create_form': targetUrl = `/fundraiser-form/${id}`; break;
        case 'Waiting_requesters': targetUrl = `/fundraiser-requesters/${id}`; break;
        default: targetUrl = `/fundraiser/${id}`;
      }
      window.location.href = targetUrl;
    });
  });

  // Empty state scroll button
  document.querySelector('.js-scroll-to-add')?.addEventListener('click', scrollToAddForm);
}

// ==================== CATEGORY SYSTEM ====================
function initCategorySystem() {
  loadCategories();
}

function getCategoriesFromServer() {
  const categoriesElement = document.getElementById('categories-data');
  if (!categoriesElement) return [];
  try {
    return JSON.parse(categoriesElement.dataset.categories || '[]');
  } catch (error) {
    return [];
  }
}

function loadCategories() {
  try {
    const optionsContainer = document.querySelector('.options');
    if (!optionsContainer) return;

    const selectAllOption = optionsContainer.querySelector('.all-tags');
    optionsContainer.innerHTML = '';
    if (selectAllOption) optionsContainer.appendChild(selectAllOption);

    const categories = getCategoriesFromServer();
    if (categories && categories.length > 0) {
      populateCategories(categories);
    } else {
      populateCategories([
        { category_name: 'Education' },
        { category_name: 'Healthcare' },
        { category_name: 'Emergency Relief' },
        { category_name: 'Community Development' }
      ]);
    }
    setupCategorySearch();
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function populateCategories(categories) {
  const optionsContainer = document.querySelector('.options');
  if (!optionsContainer) return;
  categories.forEach(category => {
    const option = document.createElement('div');
    option.className = 'option';
    option.textContent = category.category_name || category.name || category;
    option.setAttribute('data-value', category.category_name || category.name || category);
    option.addEventListener('click', toggleCategorySelection);
    optionsContainer.appendChild(option);
  });
}

function toggleCategorySelection(e) {
  const option = e.target;
  const value = option.getAttribute('data-value');

  if (value === 'all') {
    const allOptions = document.querySelectorAll('.option:not(.all-tags)');
    const currentlySelected = document.querySelectorAll('.option.selected:not(.all-tags)');
    const selectAll = document.querySelector('.option.all-tags');
    if (currentlySelected.length === allOptions.length) {
      allOptions.forEach(opt => opt.classList.remove('selected'));
      selectAll?.classList.remove('active');
    } else {
      allOptions.forEach((opt, index) => {
        if (index < 4) opt.classList.add('selected');
        else opt.classList.remove('selected');
      });
      selectAll?.classList.add('active');
    }
  } else {
    if (option.classList.contains('selected')) {
      option.classList.remove('selected');
    } else {
      const selectedCount = document.querySelectorAll('.option.selected:not(.all-tags)').length;
      if (selectedCount >= 4) {
        showFlashMessage('Maximum 4 categories allowed per fundraiser', 'warning');
        return;
      }
      option.classList.add('selected');
    }
  }
  updateSelectedCategoriesDisplay();
}

function updateSelectedCategoriesDisplay() {
  const selectedOptions = document.querySelectorAll('.option.selected:not(.all-tags)');
  const selectedOptionsContainer = document.querySelector('.selected-options');
  if (!selectedOptionsContainer) return;

  selectedOptionsContainer.innerHTML = '';
  selectedOptions.forEach(option => {
    const value = option.getAttribute('data-value');
    const text = option.textContent;
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `<span>${text}</span><button type="button" class="remove-tag" data-value="${value}">×</button>`;
    selectedOptionsContainer.appendChild(tag);
  });

  selectedOptionsContainer.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      const optionToDeselect = document.querySelector(`.option[data-value="${value}"]`);
      if (optionToDeselect) {
        optionToDeselect.classList.remove('selected');
        updateSelectedCategoriesDisplay();
      }
    });
  });
}

function getSelectedCategories() {
  return Array.from(document.querySelectorAll('.option.selected:not(.all-tags)')).map(opt => opt.getAttribute('data-value'));
}

function setupCategorySearch() {
  const searchInput = document.querySelector('.search-tags');
  if (!searchInput) return;
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const options = document.querySelectorAll('.option:not(.all-tags)');
    const noResultMsg = document.querySelector('.no-result-message');
    let visibleCount = 0;
    options.forEach(option => {
      const text = option.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        option.style.display = 'block';
        visibleCount++;
      } else {
        option.style.display = 'none';
      }
    });
    if (noResultMsg) noResultMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  });
}

// ==================== FUNDRAISER FORM ====================

// ==================== FUNDRAISER FORM ====================

function initFundraiserForm() {
  const fundraiserForm = document.getElementById('fundraiserForm');
  if (!fundraiserForm) return;

  // ── Real-time validation on blur ──
  const titleInput = document.getElementById('fundraiserTitle');
  if (titleInput) {
    titleInput.addEventListener('blur', () => {
      validateTextField('fundraiserTitle', { required: true, min: 5, max: 100, message: 'Title must be 5-100 characters.', i18nKey: 'validation.titleLength' });
    });
    titleInput.addEventListener('input', () => hideFieldError('fundraiserTitle'));
  }

  const targetInput = document.getElementById('targetAmount');
  if (targetInput) {
    targetInput.addEventListener('blur', () => {
      const campaignType = document.getElementById('fundraiserTypeInput')?.value || 'Fundraiser';
      if (campaignType === 'Fundraiser') {
        validateNumberField('targetAmount', { required: true, min: 1, max: 99999, message: 'Amount must be between $1 and $99,999.', i18nKey: 'validation.amountRange' });
      }
    });
    targetInput.addEventListener('input', () => hideFieldError('targetAmount'));
  }

  const descInput = document.getElementById('fundraiserDescription');
  if (descInput) {
    descInput.addEventListener('blur', () => {
      validateTextField('fundraiserDescription', { required: true, min: 10, max: 500, message: 'Description must be 10-500 characters.' });
    });
    descInput.addEventListener('input', () => hideFieldError('fundraiserDescription'));
  }

  const expiryInput = document.getElementById('fundraiserExpiryDate');
  if (expiryInput) {
    expiryInput.addEventListener('blur', () => {
      if (!expiryInput.value) {
        showFieldError('fundraiserExpiryDate', 'Please select an expiry date.', 'validation.expiryRequired');
      } else {
        hideFieldError('fundraiserExpiryDate');
      }
    });
  }

  const donatedItemType = document.getElementById('donatedItemType');
  if (donatedItemType) {
    donatedItemType.addEventListener('change', () => {
      hideFieldError('donatedItemType');
      if (donatedItemType.value === 'Other') {
        const otherInput = document.getElementById('otherDonationType');
        if (otherInput && !otherInput.value.trim()) {
          showFieldError('otherDonationType', 'Please specify the donation type.');
        }
      }
    });
  }

  const otherDonationType = document.getElementById('otherDonationType');
  if (otherDonationType) {
    otherDonationType.addEventListener('blur', () => {
      if (document.getElementById('donatedItemType')?.value === 'Other') {
        validateTextField('otherDonationType', { required: true, min: 2, max: 100, message: 'Please specify the donation type (2-100 chars).', i18nKey: 'validation.otherDonationType' });
      }
    });
    otherDonationType.addEventListener('input', () => hideFieldError('otherDonationType'));
  }

  const donatedItemQty = document.getElementById('donatedItemQuantity');
  if (donatedItemQty) {
    donatedItemQty.addEventListener('blur', () => {
      validateNumberField('donatedItemQuantity', { required: true, min: 1, max: 999999, integer: true, message: 'Quantity must be a whole number (1-999,999).', i18nKey: 'validation.quantityRange' });
    });
    donatedItemQty.addEventListener('input', () => hideFieldError('donatedItemQuantity'));
  }

  const donatedItemCond = document.getElementById('donatedItemCondition');
  if (donatedItemCond) {
    donatedItemCond.addEventListener('change', () => {
      validateSelectField('donatedItemCondition', { required: true, message: 'Please select the item condition.', i18nKey: 'validation.conditionRequired' });
    });
  }

  // Hashtag blur validation
  const hashtagInputBlur = document.getElementById('hashtagInput');
  if (hashtagInputBlur) {
    hashtagInputBlur.addEventListener('blur', () => {
      const tagifyInstance = hashtagInputBlur._tagify || (window.Tagify && hashtagInputBlur.tagify);
      let tagCount = 0;
      if (tagifyInstance && tagifyInstance.value) {
        tagCount = tagifyInstance.value.length;
      } else {
        try {
          const tags = JSON.parse(hashtagInputBlur.value || '[]');
          tagCount = Array.isArray(tags) ? tags.length : 0;
        } catch (_) {
          tagCount = hashtagInputBlur.value ? hashtagInputBlur.value.split(',').filter(t => t.trim()).length : 0;
        }
      }
      if (tagCount === 0) {
        showFieldError('hashtags', 'Please add at least one hashtag.');
      } else if (tagCount > 10) {
        showFieldError('hashtags', 'Maximum 10 hashtags allowed.');
      } else {
        hideFieldError('hashtags');
      }
    });
    hashtagInputBlur.addEventListener('input', () => hideFieldError('hashtags'));
  }

  // Fund allocation validation
  for (let i = 1; i <= 4; i++) {
    const labelInput = document.getElementById(`fundAllocationLabel${i}`);
    const pctInput = document.getElementById(`fundAllocationPct${i}`);
    
    if (labelInput) {
      labelInput.addEventListener('blur', () => {
        const row = document.getElementById(`pctRow${i}`);
        if (row && row.style.display !== 'none' && pctInput && pctInput.value) {
          validateTextField(`fundAllocationLabel${i}`, { required: true, min: 1, max: 100, message: 'Label is required (1-100 chars).' });
        }
      });
      labelInput.addEventListener('input', () => hideFieldError(`fundAllocationLabel${i}`));
    }
    
    if (pctInput) {
      pctInput.addEventListener('blur', () => {
        const row = document.getElementById(`pctRow${i}`);
        if (row && row.style.display !== 'none' && pctInput.value) {
          validateNumberField(`fundAllocationPct${i}`, { min: 0, max: 100, message: 'Percentage must be 0-100.' });
        }
      });
      pctInput.addEventListener('input', () => hideFieldError(`fundAllocationPct${i}`));
    }
  }

  // ── Form submit validation ──
  fundraiserForm.addEventListener('submit', function(e) {
    clearAllFieldErrors('fundraiserForm');
    let isValid = true;

    const selectedCategories = getSelectedCategories();
    const categoriesInput = document.getElementById('categoriesInput');
    if (categoriesInput) categoriesInput.value = JSON.stringify(selectedCategories);

    if (selectedCategories.length === 0) {
      e.preventDefault();
      showFieldError('categories', 'Please select at least one category.', 'validation.categoriesRequired');
      isValid = false;
    } else if (selectedCategories.length > 4) {
      e.preventDefault();
      showFieldError('categories', 'Maximum 4 categories allowed.', 'validation.categoriesMax');
      isValid = false;
    }

    // Validate title
    if (!validateTextField('fundraiserTitle', { required: true, min: 5, max: 100, message: 'Title must be 5-100 characters.' })) {
      e.preventDefault();
      isValid = false;
    }

    const userType = window.appConfig?.userType || '';
    const isCharity = userType === 'Charity';
    const campaignType = document.getElementById('fundraiserTypeInput')?.value || 'Fundraiser';

    // Validate target amount (only for Fundraiser type)
    if (campaignType === 'Fundraiser') {
      if (!validateNumberField('targetAmount', { required: true, min: 1, max: 99999, message: 'Amount must be between $1 and $99,999.' })) {
        e.preventDefault();
        isValid = false;
      }
    }

    // Validate description
    if (!validateTextField('fundraiserDescription', { required: true, min: 10, max: 500, message: 'Description must be 10-500 characters.' })) {
      e.preventDefault();
      isValid = false;
    }

    // Validate expiry date
    const expiryInput = document.getElementById('fundraiserExpiryDate');
    if (expiryInput && !expiryInput.value) {
      e.preventDefault();
      showFieldError('fundraiserExpiryDate', 'Please select an expiry date.', 'validation.expiryRequired');
      isValid = false;
    }

    // Validate main + sub images
    const mainImageInput = document.querySelector('input[name="mainImage"]');
    if (mainImageInput && !mainImageInput.files.length) {
      e.preventDefault();
      showFieldError('mainImage', 'Please select a main image.', 'validation.mainImageRequired');
      isValid = false;
    }

        // Validate sub-images (mandatory — same as main image)
    const subImage1 = document.querySelector('input[name="subImage1"]');
    const subImage2 = document.querySelector('input[name="subImage2"]');
    const subImage3 = document.querySelector('input[name="subImage3"]');

    if (!subImage1 || !subImage1.files.length) {
      e.preventDefault();
      showFieldError('subImage1', 'Please select sub image 1.', 'validation.subImage1Required');
      isValid = false;
    } else {
      const file = subImage1.files[0];
      if (!file.type.match('image.*')) {
        e.preventDefault();
        showFieldError('subImage1', 'Please select a valid image file (JPG/PNG).');
        isValid = false;
      }
    }

    if (!subImage2 || !subImage2.files.length) {
      e.preventDefault();
      showFieldError('subImage2', 'Please select sub image 2.', 'validation.subImage2Required');
      isValid = false;
    } else {
      const file = subImage2.files[0];
      if (!file.type.match('image.*')) {
        e.preventDefault();
        showFieldError('subImage2', 'Please select a valid image file (JPG/PNG).');
        isValid = false;
      }
    }

    if (!subImage3 || !subImage3.files.length) {
      e.preventDefault();
      showFieldError('subImage3', 'Please select sub image 3.', 'validation.subImage3Required');
      isValid = false;
    } else {
      const file = subImage3.files[0];
      if (!file.type.match('image.*')) {
        e.preventDefault();
        showFieldError('subImage3', 'Please select a valid image file (JPG/PNG).');
        isValid = false;
      }
    }


  // Validate hashtags
  const hashtagInput = document.getElementById('hashtagInput');
  if (hashtagInput) {
    const tagifyInstance = hashtagInput._tagify || (window.Tagify && hashtagInput.tagify);
    let tagCount = 0;
    if (tagifyInstance && tagifyInstance.value) {
      tagCount = tagifyInstance.value.length;
    } else {
      // Fallback: count comma-separated or check Tagify's DOM
      try {
        const tags = JSON.parse(hashtagInput.value || '[]');
        tagCount = Array.isArray(tags) ? tags.length : 0;
      } catch (_) {
        tagCount = hashtagInput.value ? hashtagInput.value.split(',').filter(t => t.trim()).length : 0;
      }
    }
    if (tagCount === 0) {
      e.preventDefault();
      showFieldError('hashtags', 'Please add at least one hashtag.', 'validation.hashtagsRequired');
      isValid = false;
    } else if (tagCount > 10) {
      e.preventDefault();
      showFieldError('hashtags', 'Maximum 10 hashtags allowed.', 'validation.hashtagsMax');
      isValid = false;
    }
  }

  const videoInput = document.getElementById('fundraiserVideo');
  if (videoInput && videoInput.files[0]) {
    const file = videoInput.files[0];
    if (!file.type.match('video/mp4')) {
      e.preventDefault();
      showFieldError('fundraiserVideo', 'Video must be in MP4 format.', 'validation.videoFormat');
      isValid = false;
    }
  }

    // Charity + Donation validations
    if (isCharity && campaignType === 'Donation') {
      if (!validateSelectField('donatedItemType', { required: true, message: 'Please select a donation item type.', i18nKey: 'validation.donationType' })) {
        e.preventDefault();
        isValid = false;
      }
      
      if (donatedItemType?.value === 'Other') {
        if (!validateTextField('otherDonationType', { required: true, min: 2, max: 100, message: 'Please specify the donation type (2-100 chars).' })) {
          e.preventDefault();
          isValid = false;
        }
      }
      
      if (!validateNumberField('donatedItemQuantity', { required: true, min: 1, max: 999999, integer: true, message: 'Quantity must be a whole number (1-999,999).' })) {
        e.preventDefault();
        isValid = false;
      }
      
      if (!validateSelectField('donatedItemCondition', { required: true, message: 'Please select the donated item condition.' })) {
        e.preventDefault();
        isValid = false;
      }
    }

    // Fund allocation validation
    if (isCharity) {
      const shouldValidatePct =
        (campaignType === 'Fundraiser') ||
        (campaignType === 'Donation' && document.getElementById('donatedItemType')?.value === 'Money');

      if (shouldValidatePct && document.getElementById('fundAllocationBox')?.style.display !== 'none') {
        const pct1 = parseFloat(document.getElementById('fundAllocationPct1')?.value) || 0;
        const pct2 = parseFloat(document.getElementById('fundAllocationPct2')?.value) || 0;
        const pct3Val = document.getElementById('fundAllocationPct3')?.value;
        const pct4Val = document.getElementById('fundAllocationPct4')?.value;
        const pct3 = pct3Val !== '' ? (parseFloat(pct3Val) || 0) : 0;
        const pct4 = pct4Val !== '' ? (parseFloat(pct4Val) || 0) : 0;

        const percentages = [pct1].filter(p => p > 0);
        if (pct2 > 0) percentages.push(pct2);
        const labels = [];
        if (pct1 > 0) labels.push(document.getElementById('fundAllocationLabel1')?.value.trim());
        if (pct2 > 0) labels.push(document.getElementById('fundAllocationLabel2')?.value.trim());
        
        if (pct3Val !== '') {
          percentages.push(pct3);
          labels.push(document.getElementById('fundAllocationLabel3')?.value.trim());
        }
        if (pct4Val !== '') {
          percentages.push(pct4);
          labels.push(document.getElementById('fundAllocationLabel4')?.value.trim());
        }

        // Validate labels for active rows
        let hasLabelError = false;
        percentages.forEach((pct, idx) => {
          if (pct > 0 && !labels[idx]) {
            e.preventDefault();
            showFieldError(`fundAllocationLabel${idx + 1}`, 'Label is required when percentage is set.', 'validation.required');
            hasLabelError = true;
          }
        });

        if (hasLabelError) isValid = false;

        if (percentages.length < 1) {
          e.preventDefault();
          showFieldError('fundAllocationPct1', 'At least 1 allocation is required.', 'validation.allocationRequired');
          isValid = false;
        }

        if (percentages.some(p => p < 0)) {
          e.preventDefault();
          showFieldError('fundAllocationPct1', 'Percentages cannot be negative.', 'validation.allocationNegative');
          isValid = false;
        }

        const total = percentages.reduce((sum, p) => sum + p, 0);
        if (Math.abs(total - 100) > 0.01) {
          e.preventDefault();
          showFieldError('fundAllocationPct1', `Total must equal 100%. Current: ${total.toFixed(2)}%`, 'validation.allocationTotal', { total: total.toFixed(2) });
          isValid = false;
        }
      }
    }

    if (!isValid) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating...';
    }
    return true;
  });
}

function resetUploadUI(wrapper) {
  if (!wrapper) return;
  const imageBox = wrapper.querySelector('.image-box');
  if (!imageBox) return;
  const placeholder = imageBox.querySelector('.upload-placeholder');
  const info = imageBox.querySelector('.upload-info');
  const success = imageBox.querySelector('.upload-success-state');
  if (placeholder) placeholder.style.display = 'flex';
  if (info) info.style.display = 'none';
  if (success) success.style.display = 'none';
  wrapper.classList.remove('upload-success');
}
// ==================== CAMPAIGN VERIFICATION BUTTON ====================
function initVerificationButton() {
  const modal = document.getElementById('verifyCampaignModal');
  const closeBtn = document.getElementById('verifyModalClose');
  const form = document.getElementById('verifyCampaignForm');

  if (!modal || !form) return;

  // Open modal when verify button is clicked (event delegation)
  document.querySelector('.my-fundraisers-boxes')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.verify-campaign-btn');
    if (!btn) return;

    // Check if button is already replaced/hidden (previously submitted)
    if (btn.style.display === 'none') return;

    const fundraiserId = btn.dataset.fundraiserId;
    const userType = btn.dataset.userType;

    document.getElementById('verifyFundraiserId').value = fundraiserId;
    document.getElementById('verifyUserType').value = userType;

    // Show/hide fields based on user type
    if (userType === 'Charity') {
      document.getElementById('charityFields').style.display = 'block';
      document.getElementById('requesterFields').style.display = 'none';
      document.querySelectorAll('#requesterFields input:not([type="file"]), #requesterFields textarea').forEach(f => f.value = '');
      // Reset requester file upload
      const needDoc = document.getElementById('needDocument');
      if (needDoc) { needDoc.value = ''; resetUploadUI(needDoc.closest('.wrapper')); }
    } else {
      document.getElementById('requesterFields').style.display = 'block';
      document.getElementById('charityFields').style.display = 'none';
      document.querySelectorAll('#charityFields input:not([type="file"]), #charityFields textarea').forEach(f => f.value = '');
      // Reset charity file upload
      const licCert = document.getElementById('charityLicenseCertificate');
      if (licCert) { licCert.value = ''; resetUploadUI(licCert.closest('.wrapper')); }
    }

    modal.style.display = 'block';
  });

  // Close modal
  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
    form.reset();
  });
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      form.reset();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitVerifyForm');
    const fundraiserId = document.getElementById('verifyFundraiserId').value;
    const userType = document.getElementById('verifyUserType').value;

    clearAllFieldErrors('verifyCampaignForm');
    let isValid = true;

    // ── Build FormData for file upload support ──
    const formData = new FormData();
    formData.append('fundraiserId', fundraiserId);
    formData.append('userType', userType);

    if (userType === 'Charity') {
      const charityFullName = document.getElementById('charFullName').value.trim();
      const licenseNumber = document.getElementById('charLicenseNumber').value.trim();
      const charityHeadquarters = document.getElementById('charHeadquarters').value.trim();

      if (!validateTextField('charFullName', { required: true, min: 2, max: 100, message: 'Charity name must be 2-100 characters.', i18nKey: 'validation.minLength' })) isValid = false;
      if (!validateNumberField('charLicenseNumber', { required: true, min: 1, max: 999999999999, message: 'License number is required.', i18nKey: 'validation.required' })) isValid = false;
      if (!validateTextField('charHeadquarters', { required: true, min: 5, max: 300, message: 'Headquarters must be 5-300 characters.', i18nKey: 'validation.minLength' })) isValid = false;
      
      const licenseCertInput = document.getElementById('charityLicenseCertificate');
      if (!licenseCertInput || !licenseCertInput.files[0]) {
        showFieldError('charityLicenseCertificate', 'License certificate is required.', 'validation.required');
        isValid = false;
      }

      if (!isValid) return;
      formData.append('charityFullName', charityFullName);
      formData.append('licenseNumber', licenseNumber);
      formData.append('charityHeadquarters', charityHeadquarters);

      if (isValid && licenseCertInput && licenseCertInput.files[0]) {
        formData.append('charityLicenseCertificate', licenseCertInput.files[0]);
      }
    } else {
      const fullName = document.getElementById('reqFullName').value.trim();
      const idNumber = document.getElementById('reqIdNumber').value.trim();
      const currentAddress = document.getElementById('reqCurrentAddress').value.trim();

      if (!validateTextField('reqFullName', { required: true, min: 2, max: 100, message: 'Full name must be 2-100 characters.', i18nKey: 'validation.minLength' })) isValid = false;
      if (!validateNumberField('reqIdNumber', { required: true, min: 1, max: 999999999999, message: 'ID number is required.', i18nKey: 'validation.required' })) isValid = false;
      if (!validateTextField('reqCurrentAddress', { required: true, min: 5, max: 500, message: 'Address must be 5-500 characters.', i18nKey: 'validation.minLength' })) isValid = false;

      const needDocInput = document.getElementById('needDocument');
      if (!needDocInput || !needDocInput.files[0]) {
        showFieldError('needDocument', 'Document to prove need is required.', 'validation.required');
        isValid = false;
      }
      if (!isValid) return;
      formData.append('fullName', fullName);
      formData.append('idNumber', idNumber);
      formData.append('currentAddress', currentAddress);

      if (isValid && needDocInput && needDocInput.files[0]) {
        formData.append('needDocument', needDocInput.files[0]);
      }
    }

    if (!isValid) return;

    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    try {
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        modal.style.display = 'none';
        const verifyBtn = document.querySelector(`.verify-campaign-btn[data-fundraiser-id="${fundraiserId}"]`);
        const pendingMsg = document.getElementById(`verifyMsg-${fundraiserId}`);
        if (verifyBtn) verifyBtn.style.display = 'none';
        if (pendingMsg) pendingMsg.style.display = 'inline-block';

        showFlashMessage('Interview notification will be sent within 24 hours.', 'success');
        form.reset();
      } else if (response.status === 409) {
        showFlashMessage(result.message || 'A verification request has already been submitted for this campaign.', 'warning');
        const verifyBtn = document.querySelector(`.verify-campaign-btn[data-fundraiser-id="${fundraiserId}"]`);
        const pendingMsg = document.getElementById(`verifyMsg-${fundraiserId}`);
        if (verifyBtn) verifyBtn.style.display = 'none';
        if (pendingMsg) pendingMsg.style.display = 'inline-block';
        modal.style.display = 'none';
      } else {
        showFlashMessage(result.message || 'Failed to submit verification form.', 'error');
      }
    } catch (error) {
      console.error('Verification submit error:', error);
      showFlashMessage('Server error. Please try again later.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Form';
      }
    }
  });
  // Check existing verification status on page load
  document.querySelectorAll('.verify-campaign-btn').forEach(btn => {
    const fundraiserId = btn.dataset.fundraiserId;
    fetch(`/api/verification/status/${fundraiserId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // A request exists - hide button, show pending message
          const pendingMsg = document.getElementById(`verifyMsg-${fundraiserId}`);
          btn.style.display = 'none';
          if (pendingMsg) pendingMsg.style.display = 'inline-block';
        }
      })
      .catch(() => {});
  });

  // ── Real-time validation for verify form fields ──
  const reqFullName = document.getElementById('reqFullName');
  if (reqFullName) {
    reqFullName.addEventListener('blur', () => {
      validateTextField('reqFullName', { required: true, min: 2, max: 100, message: 'Full name must be 2-100 characters.' });
    });
    reqFullName.addEventListener('input', () => hideFieldError('reqFullName'));
  }

  const reqIdNumber = document.getElementById('reqIdNumber');
  if (reqIdNumber) {
    reqIdNumber.addEventListener('blur', () => {
      validateNumberField('reqIdNumber', { required: true, min: 1, max: 999999999999, message: 'ID number is required.' });
    });
    reqIdNumber.addEventListener('input', () => hideFieldError('reqIdNumber'));
  }

  const reqCurrentAddress = document.getElementById('reqCurrentAddress');
  if (reqCurrentAddress) {
    reqCurrentAddress.addEventListener('blur', () => {
      validateTextField('reqCurrentAddress', { required: true, min: 5, max: 500, message: 'Address must be 5-500 characters.' });
    });
    reqCurrentAddress.addEventListener('input', () => hideFieldError('reqCurrentAddress'));
  }

  const charFullName = document.getElementById('charFullName');
  if (charFullName) {
    charFullName.addEventListener('blur', () => {
      validateTextField('charFullName', { required: true, min: 2, max: 100, message: 'Charity name must be 2-100 characters.' });
    });
    charFullName.addEventListener('input', () => hideFieldError('charFullName'));
  }

  const charLicenseNumber = document.getElementById('charLicenseNumber');
  if (charLicenseNumber) {
    charLicenseNumber.addEventListener('blur', () => {
      validateNumberField('charLicenseNumber', { required: true, min: 1, max: 999999999999, message: 'License number is required.' });
    });
    charLicenseNumber.addEventListener('input', () => hideFieldError('charLicenseNumber'));
  }

  const charHeadquarters = document.getElementById('charHeadquarters');
  if (charHeadquarters) {
    charHeadquarters.addEventListener('blur', () => {
      validateTextField('charHeadquarters', { required: true, min: 5, max: 300, message: 'Headquarters must be 5-300 characters.' });
    });
    charHeadquarters.addEventListener('input', () => hideFieldError('charHeadquarters'));
  }
}

// ==================== CONTROL PANEL BUTTON ====================
function initControlPanelBtn() {
  const controlPanelBtn = document.getElementById('controlPanelBtn');
  if (!controlPanelBtn) return;

  controlPanelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const userType = sessionStorage.getItem('userType');

    if (!userType) {
      window.location.href = '/register';
      return;
    }

    if (userType === 'superadmin') window.location.href = '/admin';
    else if (userType === 'requester') window.location.href = '/userPanelIndigent';
    else if (userType === 'donor') window.location.href = '/UserPanelDonor';
    else console.log('Please specify a valid user type');
  });
}

// ==================== APP LIBRARIES (i18next + Owl) ====================
function initAppLibraries() {
  if (typeof jQuery === 'undefined') {
    loadScript('https://code.jquery.com/jquery-3.6.0.min.js', function() {
      if (typeof jQuery.fn.owlCarousel === 'undefined') {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js', initI18n);
      } else {
        initI18n();
      }
    });
  } else {
    initI18n();
  }
}

function initI18n() {
  if (typeof i18next === 'undefined') {
    loadScript('https://unpkg.com/i18next@21.9.2/dist/umd/i18next.min.js', function() {
      loadScript('https://unpkg.com/i18next-http-backend@1.4.1/i18nextHttpBackend.min.js', function() {
        loadScript('https://unpkg.com/i18next-browser-languagedetector@7.0.1/i18nextBrowserLanguageDetector.min.js', function() {
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
            'dropdownHomeTgt': 'Home',
            'dropdownDashboardTgt': 'Dashboard',
            'dropdownFundraisersTgt': 'Fundraisers',
            'dropdownCategoriesTgt': 'Categories',
            'dropdownContactTgt': 'Contact Us',
            'dropdownLanguageTgt': 'Language',
            'notificationsTitleTgt': 'Notifications',
            'verifyCampaignModalTitleTgt':'Filling out the Campaign Verification Interview Form',
            'verifyCampaignModalNoteTgt':'You will receive a notification about the interview date and location, or a link to a video meeting, and other details to verify your campaign and activate donations.',
            'complaintTitleTgt': 'Enter the problem you are facing',
            'complaintLabelTgt': 'Enter A Problem',
            'complaintBtnTgt': 'Send',
            'userPanelLinkOneTgt': 'Dashboard',
            'userPanelLinkTwoTgt': 'My Fundraisers',
            'userPanelLinkThreeTgt': 'Add Fundraiser',
            'userPanelLinkFourTgt': 'Account Settings',
            'userPanelLinkFiveTgt': 'Payment Settings',
            'userPanelLinkLogoutTgt': 'Logout',
            'userPanelDashboardTitleTgt': 'Dashboard',
            'userPanelDashboardDonationCompleteTitleTgt': 'Completed Donation',
            'userPanelDashboardDonationInMonthTitleTgt': 'Donation In Month',
            'userPanelDashboardTotalDonationsTitleTgt': 'Total Donations',
            'userPanelDashbordNotificationBarTgt': 'Lorem ipsum dolor sit amet consectetur adipisicing elit.Quisqu Inventore, vitae? Voluptatum voluptas!',
            'userPanelDashboardMonthlyDonationTitleTgt': 'Monthly donation progress',
            'userPanelDashboardTotalCompleteDonationsProgressTitleTgt': 'Total Completed Fundraisers',
            'userPanelDashboardTotalDonationsProgressTitleTgt': 'Total donations progress',
            'userPanelDashboardThanksTableImage': 'Donor Image',
            'userPanelDashboardThanksTableName': 'Donor Name',
            'userPanelDashboardThanksTableSayThanks': 'Send Thanks',
            'userPanelMyFundraisersTitleTgt': 'My Fundraisers :',
            'userPanelMyFundraisersReceiveBtnTgt': 'Receive',
            'userPanelMyFundraisersReceiveDoneBtnTgt': '✅Done',
            'userPanelMyFundraisersDeleteBtnTgt': 'Delete',
            'userPanelMyFundraisersVerifyCampaignBtnTgt': 'Verify Campaign',
            'userPanelMyFundraisersWaitingBtnTgt':'Waiting...',
            'userPanelMyFundraisersAddFormBtnTgt':'Add Form',
            'userPanelNoFundraisersTitle':'No Fundraisers Yet',
            'userPanelNoFundraisersDesc':'You havent created any fundraisers yet go to the add fundraiser section.',
            'userPanelAddFundraiserTitleTgt': 'Add Fundraiser',
            'userPanelAddFundraiserTypeSelectorTitleTgt': 'Specify The Campaign Type :',
            'userPanelAddFundraiserTypeSelectorOneTgt': 'Fundraiser',
            'userPanelAddFundraiserTypeSelectorTwoTgt': 'Donation',
            'userPanelAddFundraiserFundraiserTitleTgt': 'Type Fundraiser Title :',
            'userPanelAddFundraiserFundraiserTitleLabelTgt': 'Fundraiser Title',
            'userPanelAddFundraiserSelectCategoriesTgt': 'Select Your Categories :',
            'userPanelAddFundraiserSelectAllCategoriesTgt': 'Select All',
            'userPanelAddFundraiserHashtagsTgt' : 'Add Hashtags :',
            'userPanelAddFundraiserHashtagsHintTgt' : 'Max 10 hashtags. Press Enter or comma to add. Example: help, fund',
            'userPanelAddFundraiserCategorieOneTgt': 'Education',
            'userPanelAddFundraiserCategorieTwoTgt': 'Disabilities',
            'userPanelAddFundraiserCategorieThreeTgt': 'Health Care',
            'userPanelAddFundraiserCategorieFourTgt': 'Orphans',
            'userPanelAddFundraiserCategorieFiveTgt': 'Environment',
            'userPanelAddFundraiserCategorieSixTgt': 'Poverty',
            'userPanelAddFundraiserCategorieSevenTgt': 'Gaza',
            'userPanelAddFundraiserCategorieEigthTgt': 'Help',
            'userPanelAddFundraiserCategorieNineTgt': 'Palestine',
            'userPanelAddFundraiserCategorieNoResultTgt': 'No result match',
            'userPanelAddFundraiserAmountTgt': 'Amount To Be Collected :',
            'userPanelAddFundraiserAmountLabelTgt': 'Amount',
            'userPanelAddFundraiserUploadImagesTgt': 'Upload Fundraiser Images :',
            'userPanelAddFundraiserMainImageTgt': 'Add Fundraiser Main Image',
            'userPanelAddFundraiserSubImageTgt': 'Add Fundraiser Sub Image',
            'userPanelAddFundraiserDescriptionTgt': 'Type Fundraiser Description :',
            'userPanelAddFundraiserCharityDescriptionTgt': 'Enter a description of the donation :',
            'userPanelAddFundraiserDescriptionLabelTgt': 'Fundraiser Description',
            'userPanelAddFundraiserAddBtnTgt': 'Add',
            'userPanelAccountSettingsTitleTgt': 'Account Settings',
            'userPanelAccountInformationTitleTgt': 'Account Information :',
            'userPanelAccountInformationNameTitleTgt': 'Name :',
            'userPanelAccountInformationBirthDayTitleTgt': 'BirthDay :',
            'userPanelAccountInformationGenderTitleTgt': 'Gender :',
            'userPanelAccountInformationWhatsAppNumberTitleTgt': 'WhatsApp Number :',
            'userPanelAccountInformationAddressTitleTgt': 'Address :',
            'userPanelAccountInformationEmailTitleTgt': 'Email :',
            'userPanelAccountInformationCharityNameTgt': 'Charity Name :',
            'userPanelAccountInformationDescriptionTgt': 'Charity Description :',
            'userPanelAccountInformationEstablishmentDateTgt': 'Establishment Date :',
            'userPanelAccountChangeTitleTgt': 'Change Account Settings :',
            'userPanelAccountChangePasswordTitleTgt': 'Change Your Password',
            'userPanelAccountChangePasswordLabelTgt': 'Old Password',
            'userPanelAccountChangeNewPasswordLabelTgt': 'New Password',
            'userPanelAccountChangeConfirmNewPasswordLabelTgt': 'Confirm New Password',
            'userPanelAccountChangeImageTitleTgt': 'Change Your Profile Image',
            'userPanelAccountChangeImageLabelTgt': 'Change Your Image',
            'userPanelAccountChangeBtnTgt': 'Save Changes',
            'userPanelPaymentSettingsTitleTgt': 'Payment Settings',
            'userPanelPaymentSettingsSelectTitleTgt': 'Select Your Payment Method :',
            'userPanelPaymentSettingsTypeInformationTitleTgt': 'Type Credit Card Information :',
            'userPanelPaymentSettingsCardNumberLabelTgt': 'Card Number',
            'userPanelPaymentSettingsNameOnCardLabelTgt': 'Name On Card',
            'userPanelPaymentSettingsDayLabelTgt': 'day',
            'userPanelPaymentSettingsYearLabelTgt': 'year',
            'userPanelPaymentSettingsSaveBtnTgt': 'Save',
            'userPanelPaymentSettingsAddAnotherTitleTgt': 'Add Another Credit Card',
            'userPanelPaymentSettingsChangeTitleTgt': 'Change Payment Method :',
            'userPanelPaymentSettingsChangeBtnTgt': 'Confirm',
            //_____________________________________________________________________
            'userPanelAddFundraiserExpiryDateTgt': 'Campaign Expiry Date :',
            'userPanelAddFundraiserExpiryDateLabelTgt': 'Expiry Date',
            'userPanelAddFundraiserExpiryNoteCharityTgt': 'We recommend entering a near expiration date for urgent campaigns, and the campaign duration should be between 7 and 180 days.',
            'userPanelAddFundraiserExpiryNoteRequesterTgt': 'We recommend entering a near expiration date for urgent campaigns, and the campaign duration should be between 7 and 90 days.',
            'userPanelAddFundraiserVideoTgt': 'Upload Campaign Video (Optional) :',
            'userPanelAddFundraiserVideoLabelTgt': 'Campaign Video',
            'userPanelAddFundraiserVideoNoteTgt': 'The video must be between 30 seconds and 2 minutes long and must be in MP4 format.',
            'userPanelAddFundraiserDonationItemTitleTgt': 'Donation Item Details :',
            'userPanelAddFundraiserDonationTypeLabelTgt': 'Type of Donated Item',
            'userPanelAddFundraiserOtherDonationTypeLabelTgt': 'Specify Other Donation Type',
            'userPanelAddFundraiserDonationQtyLabelTgt': 'Quantity of Donated Item',
            'userPanelAddFundraiserDonationConditionLabelTgt': 'Condition of Donated Item',
            'userPanelAddFundraiserFundAllocationTitleTgt': 'Fund Allocation Percentages :',
            'userPanelAddFundraiserFundAllocationDescTgt': 'Divide the raised funds into percentages (minimum 1, maximum 4). The total must equal 100%.',
            'userPanelAddFundraiserAddAllocationTgt': '+ Add Allocation',

            //__________________________________________________________________

            // Validation messages
            'validation.required': 'This field is required.',
            'validation.minLength': 'Must be at least {{min}} characters.',
            'validation.maxLength': 'Must not exceed {{max}} characters.',
            'validation.invalidFormat': 'Invalid format.',
            'validation.invalidNumber': 'Must be a valid number.',
            'validation.wholeNumber': 'Must be a whole number.',
            'validation.minValue': 'Must be at least {{min}}.',
            'validation.maxValue': 'Must not exceed {{max}}.',
            'validation.selectOption': 'Please select an option.',
            'validation.passwordMin': 'Password must be at least 6 characters.',
            'validation.passwordMax': 'Password must not exceed 128 characters.',
            'validation.passwordMatch': 'Passwords do not match.',
            'validation.passwordSame': 'New password cannot be the same as old password.',
            'validation.imageType': 'Please select a valid image file (JPG, PNG, GIF).',
            'validation.imageSize': 'Image size must not exceed 5MB.',
            'validation.categoriesRequired': 'Please select at least one category.',
            'validation.categoriesMax': 'Maximum 4 categories allowed.',
            'validation.titleLength': 'Title must be 5-100 characters.',
            'validation.descLength': 'Description must be 10-500 characters.',
            'validation.amountRange': 'Amount must be between $1 and $99,999.',
            'validation.expiryRequired': 'Please select an expiry date.',
            'validation.mainImageRequired': 'Please select a main image.',
            'validation.subImage1Required': 'Please select a sub image one.',
            'validation.subImage2Required': 'Please select a sub image two.',
            'validation.subImage3Required': 'Please select a sub image three.',
            'validation.videoFormat': 'Video must be in MP4 format.',
            'validation.videoDuration': 'Video must be between 30 seconds and 2 minutes.',
            'validation.hashtagsRequired': 'Please add at least one hashtag.',
            'validation.hashtagsMax': 'Maximum 10 hashtags allowed.',
            'validation.donationType': 'Please select a donation item type.',
            'validation.otherDonationType': 'Please specify the donation type (2-100 chars).',
            'validation.quantityRange': 'Quantity must be a whole number (1-999,999).',
            'validation.conditionRequired': 'Please select the donated item condition.',
            'validation.allocationRequired': 'At least 1 allocation is required.',
            'validation.allocationNegative': 'Percentages cannot be negative.',
            'validation.allocationTotal': 'Total must equal 100%. Current: {{total}}%',
            //____________________________________________________________________________
            // Achievement translations
            'achievementModalTitleTgt': 'Create Campaign Achievement',
            'achievementModalMilestoneTitleTgt': 'Create Campaign Milestone',
            'achievementModalFinalTitleTgt': 'Create Final Achievement for Campaign',
            'achievementNoteTgt': 'Creating an achievement for your campaign enhances credibility with donors and builds trust in your future campaigns.',
            'achievementTitleLabelTgt': 'Achievement Title',
            'achievementDescriptionLabelTgt': 'Achievement Description',
            'achievementDateLabelTgt': 'Achievement Date (Optional)',
            'achievementImagesTitleTgt': 'Campaign Images',
            'achievementVideoTitleTgt': 'Campaign Video (Optional)',
            'achievementMainImageTgt': 'Add Main Image',
            'achievementSubImageTgt': 'Sub Image',
            'achievementVideoLabelTgt': 'Upload Achievement Video',
            'achievementVideoNoteTgt': 'The video must be between 30 seconds and 2 minutes long and must be in MP4 format.',
            'achievementCancelBtnTgt': 'Cancel',
            'achievementSubmitBtnTgt': 'Create Achievement',
            'achievementCreatingTgt': 'Creating...',
            'achievementSuccessTgt': 'Achievement created successfully!',
            'achievementErrorTgt': 'Failed to create achievement.',
            'achievementDateLabelTgt': 'Achievement Date',
            'userPanelCreateMilestoneBtnTgt': 'Create Campaign Milestone',
            'userPanelCreateFinalAchievementBtnTgt': 'Create Final Achievement for Campaign',
          }
        },
        ar: {
          translation: {
            'dropdownHomeTgt': 'الرئيسية',
            'dropdownDashboardTgt': 'لوحة التحكم',
            'dropdownFundraisersTgt': 'حملات التبرع',
            'dropdownCategoriesTgt': 'التصنيفات',
            'dropdownContactTgt': 'تواصل معنا',
            'dropdownLanguageTgt': 'اللغة',
            'notificationsTitleTgt': 'الإشعارات',
            'verifyCampaignModalTitleTgt':'تعبئة نموذج مقابلة التحقق من الحملة',
            'verifyCampaignModalNoteTgt':'ستتلقى إشعارًا بموعد المقابلة ومكانها، أو رابطًا لاجتماع عبر الفيديو، وتفاصيل أخرى للتحقق من حملتك وتفعيل التبرعات.',
            'complaintTitleTgt': 'أدخل المشكلة التي تواجهك',
            'complaintLabelTgt': 'أدخل المشكلة',
            'complaintBtnTgt': 'أرسل',
            'userPanelLinkOneTgt': 'لوحة التحكم',
            'userPanelLinkTwoTgt': 'حملات التبرع الخاصة بي',
            'userPanelLinkThreeTgt': 'إضافة حملة تبرع',
            'userPanelLinkFourTgt': 'إعدادات الحساب',
            'userPanelLinkFiveTgt': 'إعدادات التبرع',
            'userPanelLinkLogoutTgt': 'تسجيل الخروج',
            'userPanelDashboardTitleTgt': 'لوحة التحكم',
            'userPanelDashboardDonationCompleteTitleTgt': 'التبرعات المكتملة',
            'userPanelDashboardDonationInMonthTitleTgt': 'التبرعات الشهرية',
            'userPanelDashboardTotalDonationsTitleTgt': 'مجموع التبرعات',
            'userPanelDashbordNotificationBarTgt': 'هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى.',
            'userPanelDashboardMonthlyDonationTitleTgt': 'التقدم الشهري في التبرعات',
            'userPanelDashboardTotalCompleteDonationsProgressTitleTgt': 'مجموع الحملات المكتملة',
            'userPanelDashboardTotalDonationsProgressTitleTgt': 'مجموع التقدم الكلي للتبرعات',
            'userPanelDashboardThanksTableImage': 'صورة المتبرع',
            'userPanelDashboardThanksTableName': 'اسم المتبرع',
            'userPanelDashboardThanksTableSayThanks': 'إرسال شكر',
            'userPanelMyFundraisersTitleTgt': 'حملات التبرع الخاصة بي :',
            'userPanelMyFundraisersReceiveBtnTgt': 'إستلم',
            'userPanelMyFundraisersDeleteBtnTgt': 'حذف',
            'userPanelMyFundraisersVerifyCampaignBtnTgt': 'التحقق من الحملة',
            'userPanelMyFundraisersWaitingBtnTgt':'في الإنتظار',
            'userPanelMyFundraisersAddFormBtnTgt':'إضافة نموذج',
            'userPanelNoFundraisersTitle':'لا يوجد حملات تبرع',
            'userPanelNoFundraisersDesc':'لم تقم بإنشاء حملة تبرع بعد إذهب الى قسم إضافة حملة تبرع.',
            'userPanelMyFundraisersReceiveDoneBtnTgt': '✅ تم التحويل',
            'userPanelAddFundraiserTitleTgt': 'إضافة حملة تبرع',
            'userPanelAddFundraiserTypeSelectorTitleTgt': 'حدد نوع الحملة :',
            'userPanelAddFundraiserTypeSelectorOneTgt': 'جمع للتبرع',
            'userPanelAddFundraiserTypeSelectorTwoTgt': 'للتبرع',
            'userPanelAddFundraiserFundraiserTitleTgt': 'أدخل عنوان حملة التبرع :',
            'userPanelAddFundraiserFundraiserTitleLabelTgt': 'عنوان حملة التبرع',
            'userPanelAddFundraiserSelectCategoriesTgt': 'حدد التصنيفات لحملة التبرع :',
            'userPanelAddFundraiserHashtagsTgt' : 'إضافة هاشتاغات :',
            'userPanelAddFundraiserHashtagsHintTgt' : 'الحد الأقصى 10 هاشتاغات. اضغط على زر Enter أو الفاصلة للإضافة. مثال: مساعدة، تمويل',
            'userPanelAddFundraiserSelectAllCategoriesTgt': 'حدد الكل',
            'userPanelAddFundraiserCategorieOneTgt': 'التعليم',
            'userPanelAddFundraiserCategorieTwoTgt': 'ذوي الاحتياجات الخاصة',
            'userPanelAddFundraiserCategorieThreeTgt': 'الرعاية الصحية',
            'userPanelAddFundraiserCategorieFourTgt': 'الأيتام',
            'userPanelAddFundraiserCategorieFiveTgt': 'البيئة',
            'userPanelAddFundraiserCategorieSixTgt': 'الفقر',
            'userPanelAddFundraiserCategorieSevenTgt': 'غزة',
            'userPanelAddFundraiserCategorieEigthTgt': 'مساعدة',
            'userPanelAddFundraiserCategorieNineTgt': 'فلسطين',
            'userPanelAddFundraiserCategorieNoResultTgt': 'لا توجد نتيجة مطابقة',
            'userPanelAddFundraiserAmountTgt': 'المبلغ المراد جمعه :',
            'userPanelAddFundraiserAmountLabelTgt': 'المبلغ',
            'userPanelAddFundraiserUploadImagesTgt': 'أرفع لصوراً لحملة التبرع :',
            'userPanelAddFundraiserMainImageTgt': 'أضف الصورة الرئيسية لحملة التبرع',
            'userPanelAddFundraiserSubImageTgt': 'أضف الصورة الفرعية لحملة التبرع',
            'userPanelAddFundraiserDescriptionTgt': 'أدخل الوصف لحملة جمع التبرع',
            'userPanelAddFundraiserCharityDescriptionTgt': 'أدخل وصفًا لحملة للتبرع:',
            'userPanelAddFundraiserDescriptionLabelTgt': 'وصف حملة التبرع',
            'userPanelAddFundraiserAddBtnTgt': 'إضافة',
            'userPanelAccountSettingsTitleTgt': 'إعدادات الحساب',
            'userPanelAccountInformationTitleTgt': 'تفاصيل الحساب :',
            'userPanelAccountInformationNameTitleTgt': 'الإسم :',
            'userPanelAccountInformationBirthDayTitleTgt': 'تاريخ الميلاد :',
            'userPanelAccountInformationGenderTitleTgt': 'الجنس :',
            'userPanelAccountInformationWhatsAppNumberTitleTgt': 'رقم الواتساب :',
            'userPanelAccountInformationAddressTitleTgt': 'العنوان :',
            'userPanelAccountInformationEmailTitleTgt': 'الإيميل :',
            'userPanelAccountInformationCharityNameTgt': 'إاسم الجمعية الخيرية :',
            'userPanelAccountInformationDescriptionTgt': 'وصف الجمعية الخيرية :',
            'userPanelAccountInformationEstablishmentDateTgt': 'تاريخ التأسيس :',
            'userPanelAccountChangeTitleTgt': 'تغيير إعدادات الحساب :',
            'userPanelAccountChangePasswordTitleTgt': 'تغيير كلمة المرور',
            'userPanelAccountChangePasswordLabelTgt': 'كلمة المرور القديمة',
            'userPanelAccountChangeNewPasswordLabelTgt': 'كلمة المرور الجديدة',
            'userPanelAccountChangeConfirmNewPasswordLabelTgt': 'تأكيد كلمة المرور',
            'userPanelAccountChangeImageTitleTgt': 'تغيير صورة الحساب',
            'userPanelAccountChangeImageLabelTgt': 'تغيير صورتك',
            'userPanelAccountChangeBtnTgt': 'حفظ التغييرات',
            'userPanelPaymentSettingsTitleTgt': 'إعدادات الدفع',
            'userPanelPaymentSettingsSelectTitleTgt': 'إختر طريقتك للدفع :',
            'userPanelPaymentSettingsTypeInformationTitleTgt': 'أكتب بيانات بطاقة الإئتمان',
            'userPanelPaymentSettingsCardNumberLabelTgt': 'رقم البطاقة',
            'userPanelPaymentSettingsNameOnCardLabelTgt': 'الاسم على البطاقة',
            'userPanelPaymentSettingsDayLabelTgt': 'يوم',
            'userPanelPaymentSettingsYearLabelTgt': 'سنة',
            'userPanelPaymentSettingsSaveBtnTgt': 'حفظ',
            'userPanelPaymentSettingsAddAnotherTitleTgt': 'إضافة بطاقة إئتمان أخرى',
            'userPanelPaymentSettingsChangeTitleTgt': 'تغيير طريقة الدفع :',
            'userPanelPaymentSettingsChangeBtnTgt': 'تأكيد',
            //______________________________________________________________
            'userPanelAddFundraiserExpiryDateTgt': 'تاريخ انتهاء الحملة :',
            'userPanelAddFundraiserExpiryDateLabelTgt': 'تاريخ الانتهاء',
            'userPanelAddFundraiserExpiryNoteCharityTgt': 'نوصي بإدخال تاريخ انتهاء قريب للحملات العاجلة، ويجب أن تكون مدة الحملة بين 7 و 180 يومًا.',
            'userPanelAddFundraiserExpiryNoteRequesterTgt': 'نوصي بإدخال تاريخ انتهاء قريب للحملات العاجلة، ويجب أن تكون مدة الحملة بين 7 و 90 يومًا.',
            'userPanelAddFundraiserVideoTgt': 'رفع فيديو الحملة (اختياري) :',
            'userPanelAddFundraiserVideoLabelTgt': 'فيديو الحملة',
            'userPanelAddFundraiserVideoNoteTgt': 'يجب أن يكون الفيديو بين 30 ثانية و 2 دقيقة ويجب أن يكون بتنسيق MP4.',
            'userPanelAddFundraiserDonationItemTitleTgt': 'تفاصيل العنصر المتبرع به :',
            'userPanelAddFundraiserDonationTypeLabelTgt': 'نوع العنصر المتبرع به',
            'userPanelAddFundraiserOtherDonationTypeLabelTgt': 'حدد نوع التبرع الآخر',
            'userPanelAddFundraiserDonationQtyLabelTgt': 'كمية العنصر المتبرع به',
            'userPanelAddFundraiserDonationConditionLabelTgt': 'حالة العنصر المتبرع به',
            'userPanelAddFundraiserFundAllocationTitleTgt': 'نسب توزيع الأموال :',
            'userPanelAddFundraiserFundAllocationDescTgt': 'قسّم الأموال المُجمَّعة إلى نسب (حد أدنى 1، حد أقصى 4). يجب أن يكون المجموع 100%.',
            'userPanelAddFundraiserAddAllocationTgt': '+ إضافة تخصيص',


            //__________________________________________________________________


                        // Validation messages
            'validation.required': 'هذا الحقل مطلوب.',
            'validation.minLength': 'يجب أن يكون على الأقل {{min}} أحرف.',
            'validation.maxLength': 'يجب ألا يتجاوز {{max}} أحرف.',
            'validation.invalidFormat': 'تنسيق غير صالح.',
            'validation.invalidNumber': 'يجب أن يكون رقماً صالحاً.',
            'validation.wholeNumber': 'يجب أن يكون رقماً صحيحاً.',
            'validation.minValue': 'يجب أن يكون على الأقل {{min}}.',
            'validation.maxValue': 'يجب ألا يتجاوز {{max}}.',
            'validation.selectOption': 'يرجى اختيار خيار.',
            'validation.passwordMin': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
            'validation.passwordMax': 'يجب ألا تتجاوز كلمة المرور 128 حرفاً.',
            'validation.passwordMatch': 'كلمتا المرور غير متطابقتين.',
            'validation.passwordSame': 'لا يمكن أن تكون كلمة المرور الجديدة مطابقة للقديمة.',
            'validation.imageType': 'يرجى اختيار ملف صورة صالح (JPG أو PNG أو GIF).',
            'validation.imageSize': 'يجب ألا يتجاوز حجم الصورة 5 ميجابايت.',
            'validation.categoriesRequired': 'يرجى اختيار تصنيف واحد على الأقل.',
            'validation.categoriesMax': 'الحد الأقصى 4 تصنيفات.',
            'validation.titleLength': 'يجب أن يكون العنوان بين 5 و 100 حرف.',
            'validation.descLength': 'يجب أن يكون الوصف بين 10 و 500 حرف.',
            'validation.amountRange': 'يجب أن يكون المبلغ بين 1 و 99,999 دولار.',
            'validation.expiryRequired': 'يرجى اختيار تاريخ الانتهاء.',
            'validation.mainImageRequired': 'يرجى اختيار الصورة الرئيسية.',
            'validation.subImage1Required': 'يرجى اختيار الصورة الفرعية الاولى.',
            'validation.subImage2Required': 'يرجى اختيار الصورة الفرعية الثانية.',
            'validation.subImage3Required': 'يرجى اختيار الصورة الفرعية الثالثة.',
            'validation.videoFormat': 'يجب أن يكون الفيديو بتنسيق MP4.',
            'validation.videoDuration': 'يجب أن يكون الفيديو بين 30 ثانية ودقيقتين.',
            'validation.hashtagsRequired': 'يرجى إضافة وسم واحد على الأقل.',
            'validation.hashtagsMax': 'الحد الأقصى 10 وسوم.',
            'validation.donationType': 'يرجى اختيار نوع العنصر المتبرع به.',
            'validation.otherDonationType': 'يرجى تحديد نوع التبرع (2-100 حرف).',
            'validation.quantityRange': 'يجب أن تكون الكمية رقماً صحيحاً (1-999,999).',
            'validation.conditionRequired': 'يرجى اختيار حالة العنصر المتبرع به.',
            'validation.allocationRequired': 'مطلوب تخصيص واحد على الأقل.',
            'validation.allocationNegative': 'لا يمكن أن تكون النسب سالبة.',
            'validation.allocationTotal': 'يجب أن يكون المجموع 100%. الحالي: {{total}}%',
            //_______________________________________________________________
            // Achievement translations (Arabic)
            'achievementModalTitleTgt': 'إنشاء إنجاز للحملة',
            'achievementModalMilestoneTitleTgt': 'إنشاء معلم للحملة',
            'achievementModalFinalTitleTgt': 'إنشاء إنجاز نهائي للحملة',
            'achievementNoteTgt': 'إنشاء إنجاز لحملتك يعزز المصداقية لدى المتبرعين ويبني الثقة في حملاتك المستقبلية.',
            'achievementTitleLabelTgt': 'عنوان الإنجاز',
            'achievementDescriptionLabelTgt': 'وصف الإنجاز',
            'achievementDateLabelTgt': 'تاريخ الإنجاز (اختياري)',
            'achievementImagesTitleTgt': 'صور الحملة',
            'achievementVideoTitleTgt': 'فيديو الحملة (اختياري)',
            'achievementMainImageTgt': 'إضافة الصورة الرئيسية',
            'achievementSubImageTgt': 'صورة فرعية',
            'achievementVideoLabelTgt': 'رفع فيديو الإنجاز',
            'achievementVideoNoteTgt': 'يجب أن يكون الفيديو بين 30 ثانية ودقيقتين ويجب أن يكون بتنسيق MP4.',
            'achievementCancelBtnTgt': 'إلغاء',
            'achievementSubmitBtnTgt': 'إنشاء الإنجاز',
            'achievementCreatingTgt': 'جاري الإنشاء...',
            'achievementSuccessTgt': 'تم إنشاء الإنجاز بنجاح!',
            'achievementErrorTgt': 'فشل في إنشاء الإنجاز.',
            'achievementDateLabelTgt': 'تاريخ الإنجاز',
            'userPanelCreateMilestoneBtnTgt': 'إنشاء معلم للحملة',
            'userPanelCreateFinalAchievementBtnTgt': 'إنشاء إنجاز نهائي للحملة',
          }
        }
      }
    }, function(err, t) {
      if (err) console.error('Error initializing i18next:', err);
      else updateContent();
    });

  function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.innerHTML = i18next.t(key);
    });
    if (i18next.language === 'ar') {
      document.body.classList.add('rtl');
      document.body.setAttribute('dir', 'rtl');
    } else {
      document.body.classList.remove('rtl');
      document.body.setAttribute('dir', 'ltr');
    }
  }

  function updateButtonState(lang) {
    document.getElementById('en-btn')?.classList.toggle('active', lang === 'en');
    document.getElementById('ar-btn')?.classList.toggle('active', lang === 'ar');
  }

  document.getElementById('en-btn')?.addEventListener('click', () => {
    i18next.changeLanguage('en');
    updateButtonState('en');
  });
  document.getElementById('ar-btn')?.addEventListener('click', () => {
    i18next.changeLanguage('ar');
    updateButtonState('ar');
  });

  i18next.on('languageChanged', () => updateContent());

  if (navigator.language.startsWith('ar')) {
    i18next.changeLanguage('ar');
    updateButtonState('ar');
  }

  // Owl Carousel init
  if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(function(){
      jQuery('.owl-carousel').owlCarousel({
        loop: true,
        items: 1,
        responsive: { 768: { items: 3 } },
        autoplay: false,
        dots: true,
        nav: true,
        margin: 10,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
      });
    });
  }
}

function loadScript(src, onLoad) {
  const script = document.createElement('script');
  script.src = src;
  script.onload = onLoad;
  script.onerror = function() { console.warn('Failed to load script: ' + src); };
  document.head.appendChild(script);
}

// ==================== DEBUG ====================
function debugFunctionAvailability() {
  console.log('🔍 DEBUG: Checking function availability:');
  console.log('- escapeHtml:', typeof escapeHtml);
  console.log('- showSuccessMessage:', typeof showSuccessMessage);
  console.log('- getCurrentUserToken:', typeof getCurrentUserToken);
  console.log('- formatCurrency:', typeof formatCurrency);
  console.log('- loadDonationStats:', typeof loadDonationStats);
  console.log('- loadDonors:', typeof loadDonors);
}


// ==================== ACHIEVEMENT SYSTEM ====================

function initAchievementSystem() {
  const modal = document.getElementById('achievementModal');
  const closeBtn = document.getElementById('achievementModalClose');
  const cancelBtn = document.getElementById('achievementCancelBtn');
  const form = document.getElementById('achievementForm');
  const submitBtn = document.getElementById('achievementSubmitBtn');
  const titleEl = document.getElementById('achievementModalTitle');

  if (!modal || !form) return;

  // Event delegation for achievement buttons
  document.querySelector('.my-fundraisers-boxes')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.create-achievement-btn');
    if (!btn) return;

    const fundraiserId = btn.dataset.fundraiserId;
    const achievementType = btn.dataset.achievementType;

    document.getElementById('achievementFundraiserId').value = fundraiserId;
    document.getElementById('achievementType').value = achievementType;

    // Set title based on type
    if (achievementType === 'milestone') {
      titleEl.textContent = t('achievementModalMilestoneTitleTgt', 'Create Campaign Milestone');
    } else {
      titleEl.textContent = t('achievementModalFinalTitleTgt', 'Create Final Achievement for Campaign');
    }

    // Initialize flatpickr for achievement date
    if (typeof flatpickr !== 'undefined') {
      flatpickr('#achievementDate', {
        dateFormat: 'Y-m-d',
        maxDate: 'today',
        disableMobile: true
      });
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  });

    function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    form.reset();
    clearAllFieldErrors('achievementForm');
    
    // Reset all file upload visuals in achievement modal
    document.querySelectorAll('#achievementModal .wrapper[data-upload-type]').forEach(wrapper => {
      const imageBox = wrapper.querySelector('.image-box');
      if (!imageBox) return;
      
      const placeholder = imageBox.querySelector('.upload-placeholder');
      const uploadInfo = imageBox.querySelector('.upload-info');
      const uploadSuccess = imageBox.querySelector('.upload-success-state');
      const preview = imageBox.querySelector('.image-preview');
      
      if (placeholder) placeholder.style.display = 'flex';
      if (uploadInfo) uploadInfo.style.display = 'none';
      if (uploadSuccess) uploadSuccess.style.display = 'none';
      if (preview) preview.remove();
      
      imageBox.classList.remove('upload-success');
      
      // Clear file input
      const fileInput = imageBox.querySelector('.file-input');
      if (fileInput) fileInput.value = '';
    });
  }  
  
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    form.reset();
    clearAllFieldErrors('achievementForm');
    
    // Reset file upload visuals
    document.querySelectorAll('#achievementModal .wrapper[data-upload-type]').forEach(wrapper => {
      const imageBox = wrapper.querySelector('.image-box');
      if (!imageBox) return;
      
      const placeholder = imageBox.querySelector('.upload-placeholder');
      const uploadInfo = imageBox.querySelector('.upload-info');
      const uploadSuccess = imageBox.querySelector('.upload-success-state');
      const preview = imageBox.querySelector('.image-preview');
      
      if (placeholder) placeholder.style.display = 'flex';
      if (uploadInfo) uploadInfo.style.display = 'none';
      if (uploadSuccess) uploadSuccess.style.display = 'none';
      if (preview) preview.remove();
      
      imageBox.classList.remove('has-preview', 'upload-success');
      wrapper.classList.remove('upload-success');
      wrapper.dataset.processing = '';
    });
  }

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
  });

  // Input box effects for achievement form
  const achievementInputs = form.querySelectorAll('.input-box input, .input-box textarea');
  achievementInputs.forEach(input => {
    const box = input.closest('.input-box');
    if (!box) return;

    const updateState = () => {
      box.classList.toggle('field-is-filled', input.value !== '');
    };
    updateState();

    input.addEventListener('focus', () => box.classList.add('input-box-active'));
    input.addEventListener('blur', () => {
      setTimeout(() => box.classList.remove('input-box-active'), 300);
    });
    input.addEventListener('input', updateState);

    // Character counter for description
    if (input.id === 'achievementDescription') {
      const signalNum = box.querySelector('.signal_num');
      input.addEventListener('keyup', () => {
        if (signalNum) signalNum.textContent = input.value.length;
      });
    }
  });

  // File upload handlers for achievement form
  // File upload handlers for achievement form
  // NOTE: initFileUploads() already handles these since they're .file-input inside .wrapper
  // We only need to add the has-preview class support for image previews
  const achievementFileInputs = form.querySelectorAll('.file-input');
  achievementFileInputs.forEach(fileInput => {
    fileInput.addEventListener('change', ({target}) => {
      const file = target.files[0];
      if (!file) return;

      const wrapper = target.closest('.wrapper');
      const imageBox = wrapper?.querySelector('.image-box');
      if (!imageBox) return;

      const uploadType = wrapper.dataset.uploadType;
      
      // Image preview is handled by initFileUploads, but we need to ensure
      // the achievement modal's specific styling works
      if (uploadType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          let preview = imageBox.querySelector('.image-preview');
          if (!preview) {
            preview = document.createElement('img');
            preview.className = 'image-preview';
            preview.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:5px;position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;';
            imageBox.appendChild(preview);
          }
          preview.src = e.target.result;
          imageBox.classList.add('has-preview');
        };
        reader.readAsDataURL(file);
      }

      hideFieldError(target.name);
    });
  });

  // Form submit
  submitBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    clearAllFieldErrors('achievementForm');

    const fundraiserId = document.getElementById('achievementFundraiserId').value;
    const achievementType = document.getElementById('achievementType').value;
    const title = document.getElementById('achievementTitle').value.trim();
    const description = document.getElementById('achievementDescription').value.trim();
    const achievementDate = document.getElementById('achievementDate').value;

    let isValid = true;

    // Validate title
    if (!title) {
      showFieldError('achievementTitle', 'Title is required.', 'validation.required');
      isValid = false;
    } else if (title.length < 5) {
      showFieldError('achievementTitle', 'Title must be at least 5 characters.', 'validation.minLength', { min: 5 });
      isValid = false;
    } else if (title.length > 100) {
      showFieldError('achievementTitle', 'Title must not exceed 100 characters.', 'validation.maxLength', { max: 100 });
      isValid = false;
    }

    // Validate achievement date (now required)
    if (!achievementDate) {
      showFieldError('achievementDate', 'Achievement date is required.', 'validation.required');
      isValid = false;
    }

    // Validate description
    if (!description) {
      showFieldError('achievementDescription', 'Description is required.', 'validation.required');
      isValid = false;
    } else if (description.length < 10) {
      showFieldError('achievementDescription', 'Description must be at least 10 characters.', 'validation.minLength', { min: 10 });
      isValid = false;
    } else if (description.length > 500) {
      showFieldError('achievementDescription', 'Description must not exceed 500 characters.', 'validation.maxLength', { max: 500 });
      isValid = false;
    }

    // Validate main image
    const mainImageInput = document.getElementById('achievementMainImage');
    if (!mainImageInput || !mainImageInput.files.length) {
      showFieldError('achievementMainImage', 'Main image is required.', 'validation.mainImageRequired');
      isValid = false;
    }

    // Validate video if provided
    const videoInput = document.getElementById('achievementVideo');
    if (videoInput && videoInput.files[0]) {
      const file = videoInput.files[0];
      if (!file.type.match('video/mp4')) {
        showFieldError('achievementVideo', 'Video must be in MP4 format.', 'validation.videoFormat');
        isValid = false;
      }
    }

    if (!isValid) return;

    // Build FormData
    const formData = new FormData();
    formData.append('fundraiserId', fundraiserId);
    formData.append('achievementType', achievementType);
    formData.append('title', title);
    formData.append('description', description);
    if (achievementDate) formData.append('achievementDate', achievementDate);
    if (mainImageInput?.files[0]) formData.append('achievementMainImage', mainImageInput.files[0]);

    const sub1 = document.getElementById('achievementSubImage1');
    const sub2 = document.getElementById('achievementSubImage2');
    const sub3 = document.getElementById('achievementSubImage3');
    if (sub1?.files[0]) formData.append('achievementSubImage1', sub1.files[0]);
    if (sub2?.files[0]) formData.append('achievementSubImage2', sub2.files[0]);
    if (sub3?.files[0]) formData.append('achievementSubImage3', sub3.files[0]);
    if (videoInput?.files[0]) formData.append('achievementVideo', videoInput.files[0]);

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> ' + t('achievementCreatingTgt', 'Creating...');

    try {
      const response = await fetch('/userPanelIndigent/api/achievements/create', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showFlashMessage(t('achievementSuccessTgt', 'Achievement created successfully!'), 'success');
        closeModal();
        // Hide the button to prevent duplicate creation
        const btn = document.querySelector(`.create-achievement-btn[data-fundraiser-id="${fundraiserId}"][data-achievement-type="${achievementType}"]`);
        if (btn) btn.style.display = 'none';
      } else {
        showFlashMessage(result.message || t('achievementErrorTgt', 'Failed to create achievement.'), 'error');
      }
    } catch (error) {
      console.error('Achievement creation error:', error);
      showFlashMessage(t('achievementErrorTgt', 'Server error. Please try again.'), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = t('achievementSubmitBtnTgt', 'Create Achievement');
    }
  });
}