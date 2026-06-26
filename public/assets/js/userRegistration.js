// userRegistration.js — fully separated Donor/Indigent vs Charity forms
// Global translation helper — accessible in all DOMContentLoaded blocks
function _t(key, fallback, opts = {}) {
  return (typeof t === 'function') ? t(key, fallback, opts) : fallback;
}

// ── RESEND TIMER SYSTEM (global) ──────────────────────────────────────────
const RESEND_DELAY_MS = 60000;
const MAX_RESEND_ATTEMPTS = 3;

const resendState = {
    di: { attempts: 0, timerId: null, canResend: false },
    ch: { attempts: 0, timerId: null, canResend: false },
    fp: { attempts: 0, timerId: null, canResend: false }
};

// REPLACE startResendTimer function with this:
function startResendTimer(prefix) {
    const resendSection = document.getElementById(`${prefix}-resend-section`);
    const resendBtn = document.getElementById(`${prefix}-resendCodeBtn`);
    
    if (!resendSection || !resendBtn) {
        console.warn(`Resend elements not found for prefix: ${prefix}`);
        return;
    }
    
    // Hide resend button initially
    resendSection.style.cssText = 'display: none !important;';
    resendBtn.disabled = true;
    resendBtn.textContent = (typeof _t === 'function') 
        ? _t('verificationWindowSendCodeAgainTgt', 'Send it again') 
        : 'Send it again';
    
    // Clear any existing timer
    if (resendState[prefix].timerId) {
        clearTimeout(resendState[prefix].timerId);
    }
    
    resendState[prefix].canResend = false;
    
    // Show resend section after delay
    resendState[prefix].timerId = setTimeout(() => {
        console.log(`Resend timer fired for ${prefix}, attempts: ${resendState[prefix].attempts}`);
        if (resendState[prefix].attempts < MAX_RESEND_ATTEMPTS) {
            resendSection.style.cssText = 'display: block !important;';
            resendBtn.disabled = false;
            resendState[prefix].canResend = true;
            
            const remaining = MAX_RESEND_ATTEMPTS - resendState[prefix].attempts;
            const attemptsText = remaining === 1 
                ? ' (1 attempt remaining)' 
                : ` (${remaining} attempts remaining)`;
            const btnText = (typeof _t === 'function') 
                ? _t('verificationWindowSendCodeAgainTgt', 'Send it again') 
                : 'Send it again';
            resendBtn.textContent = btnText + attemptsText;
        } else {
            resendSection.style.cssText = 'display: block !important;';
            resendBtn.disabled = true;
            resendBtn.textContent = (typeof _t === 'function') 
                ? _t('verificationWindowMaxAttemptsTgt', 'Maximum resend attempts reached') 
                : 'Maximum resend attempts reached';
        }
    }, RESEND_DELAY_MS);
}

function incrementResendAttempt(prefix) {
    resendState[prefix].attempts++;
    return resendState[prefix].attempts < MAX_RESEND_ATTEMPTS;
}

function resetResendState(prefix) {
    if (resendState[prefix].timerId) {
        clearTimeout(resendState[prefix].timerId);
    }
    resendState[prefix] = { attempts: 0, timerId: null, canResend: false };
}


document.addEventListener('DOMContentLoaded', function () {

  // ─── Active user type ───────────────────────────────────────────────────────
  let userType = 'requester'; // 'donor' | 'requester' | 'charity'

  // ─── DOM: type buttons ──────────────────────────────────────────────────────
  const donorBtn    = document.getElementById('donor-btn');
  const indigentBtn = document.getElementById('indigent-btn');
  const charityBtn  = document.getElementById('charity-btn');
  const accountTypeEl = document.getElementById('account-type-selector');

  // ─── DOM: Donor/Indigent form & steps ───────────────────────────────────────
  const diForm  = document.getElementById('donorIndigentForm');
  const diStep1 = document.getElementById('di-step1');
  const diStep2 = document.getElementById('di-step2');
  const diProgStep1 = document.getElementById('di-prog-step1');
  const diProgStep2 = document.getElementById('di-prog-step2');
  const diProgStep3 = document.getElementById('di-prog-step3');
  const diProgressBar = document.getElementById('progressBar-di');

  const diNextBtn = document.getElementById('di-nextBtn');
  const diPrevBtn = document.getElementById('di-prevBtn');

  const diLocationBtn     = document.getElementById('di-getLocationBtn');
  const diLocationDisplay = document.getElementById('di-locationDisplay');
  const diLatInput        = document.getElementById('di-latitude');
  const diLngInput        = document.getElementById('di-longitude');

  const diVerifyBtn = document.getElementById('di-verifyBtn');
  const diVerifWindow = document.getElementById('di-verificationWindow');
  const diErrorMsg   = document.getElementById('di-errorMsg');
  const diSuccessMsg = document.getElementById('di-successMsg');
  const diCodeInputs = diVerifWindow ? diVerifWindow.querySelectorAll('.code-input') : [];

  // ─── DOM: Charity form & steps ──────────────────────────────────────────────
  const chForm  = document.getElementById('charityForm');
  const chStep1 = document.getElementById('ch-step1');
  const chStep2 = document.getElementById('ch-step2');
  const chStep3 = document.getElementById('ch-step3');
  const chProgStep1 = document.getElementById('ch-prog-step1');
  const chProgStep2 = document.getElementById('ch-prog-step2');
  const chProgStep3 = document.getElementById('ch-prog-step3');
  const chProgressBar = document.getElementById('progressBar-charity');

  const chNextBtn = document.getElementById('ch-nextBtn');
  const chPrevBtn = document.getElementById('ch-prevBtn');
  const chNextBtnLinks = document.getElementById('ch-nextBtn-links');
  const chSkipBtnLinks = document.getElementById('ch-skipBtn-links');
  const chPrevBtnLinks = document.getElementById('ch-prevBtn-links');

  const chLocationBtn     = document.getElementById('ch-getLocationBtn');
  const chLocationDisplay = document.getElementById('ch-locationDisplay');
  const chLatInput        = document.getElementById('ch-latitude');
  const chLngInput        = document.getElementById('ch-longitude');

  const chVerifyBtn   = document.getElementById('ch-verifyBtn');
  const chVerifWindow = document.getElementById('ch-verificationWindow');
  const chErrorMsg    = document.getElementById('ch-errorMsg');
  const chSuccessMsg  = document.getElementById('ch-successMsg');
  const chCodeInputs  = chVerifWindow ? chVerifWindow.querySelectorAll('.code-input') : [];

  // ─── State ──────────────────────────────────────────────────────────────────
  let diLocation = null;
  let chLocation = null;
  let diIti = null;
  let chIti = null;
  let diItiInitialized = false;
  let chItiInitialized = false;
  let diRecaptchaWidget = null;
  let chRecaptchaWidget = null;

  // ════════════════════════════════════════════════════════════════════════════
  //  PHONE INPUT SETUP — Enhanced with proper country-based formatting
  // ════════════════════════════════════════════════════════════════════════════
  function setupPhoneInput(containerId, phoneInputId, codeInputId, fullInputId, errorId) {
    const container = document.getElementById(containerId);
    const phoneEl   = document.getElementById(phoneInputId);
    const codeEl    = document.getElementById(codeInputId);
    const fullEl    = document.getElementById(fullInputId);
    const errEl     = document.getElementById(errorId);

    if (!phoneEl || !codeEl || !fullEl || !errEl) {
      console.error('Missing phone elements for: ' + containerId);
      return null;
    }
    if (typeof window.intlTelInput === 'undefined') {
      console.error('intlTelInput not loaded');
      return null;
    }

    const itiInst = window.intlTelInput(phoneEl, {
      initialCountry: 'auto',
      geoIpLookup: cb => fetch('https://ipapi.co/json')
        .then(r => r.json())
        .then(d => cb(d.country_code))
        .catch(() => cb('us')),
      separateDialCode: true,
      // Enable national mode to format numbers according to country's standard
      nationalMode: true,
      // Auto format the number as user types according to country format
      autoFormat: true,
      // Show the placeholder in the country's number format
      autoPlaceholder: 'polite', // or 'aggressive' for always showing
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js'
    });

    // ── Country change: update code and reformat placeholder ──
    phoneEl.addEventListener('countrychange', () => {
      const cd = itiInst.getSelectedCountryData();
      codeEl.value = '+' + cd.dialCode;
      
      // Update the full number with proper international format
      updateFullNumber(itiInst, phoneEl, codeEl, fullEl);
      
      // Clear any previous error styling
      container.classList.remove('valid-number', 'invalid-number');
      errEl.style.display = 'none';
      
      console.log(`📞 Country changed to: ${cd.name} (+${cd.dialCode}), ISO: ${cd.iso2}`);
    });

    // ── Input handler: enforce digits only, auto-format, validate ──
    phoneEl.addEventListener('input', () => {
      // Remove any non-digit characters (intl-tel-input handles formatting visually)
      // But we let the library handle the display formatting
      
      const cd = itiInst.getSelectedCountryData();
      codeEl.value = '+' + cd.dialCode;
      
      // Store the number in multiple formats for flexibility
      updateFullNumber(itiInst, phoneEl, codeEl, fullEl);

      // Validation visual feedback
      if (phoneEl.value.trim() === '') {
        container.classList.remove('valid-number', 'invalid-number');
        errEl.style.display = 'none';
      } else if (itiInst.isValidNumber()) {
        container.classList.add('valid-number');
        container.classList.remove('invalid-number');
        errEl.style.display = 'none';
        
        // Log the formatted number for debugging
        const nationalFormat = itiInst.getNumber(intlTelInputUtils.numberFormat.NATIONAL);
        const intlFormat = itiInst.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
        const e164Format = itiInst.getNumber(intlTelInputUtils.numberFormat.E164);
        console.log(`✅ Valid number - National: ${nationalFormat}, International: ${intlFormat}, E.164: ${e164Format}`);
      } else {
        container.classList.remove('valid-number');
        container.classList.add('invalid-number');
        errEl.style.display = 'none';
      }
    });

    // ── Keydown: restrict to digits and formatting chars ──
    phoneEl.addEventListener('keydown', function (e) {
      // Allow control keys
      if ([8,9,13,27,46].includes(e.keyCode) ||
          (e.keyCode===65 && e.ctrlKey) || (e.keyCode===67 && e.ctrlKey) ||
          (e.keyCode===86 && e.ctrlKey) || (e.keyCode===88 && e.ctrlKey) ||
          (e.keyCode>=35 && e.keyCode<=39)) return;
      
      // Allow only digits, spaces, parentheses, hyphens (for formatting)
      if ((e.shiftKey || (e.keyCode<48||e.keyCode>57)) &&
          (e.keyCode<96||e.keyCode>105) &&
          !['-','(',')',' '].includes(e.key)) {
        e.preventDefault();
      }
    });

    // ── Blur: final formatting and validation ──
    phoneEl.addEventListener('blur', () => {
      if (itiInst.isValidNumber()) {
        // On blur, you can optionally reformat to national format
        const nationalNumber = itiInst.getNumber(intlTelInputUtils.numberFormat.NATIONAL);
        // Uncomment below if you want to replace input with national format on blur
        // phoneEl.value = nationalNumber.replace(/^\+\d+\s*/, ''); // Remove country code prefix
      }
      updateFullNumber(itiInst, phoneEl, codeEl, fullEl);
    });

    // ── Initialize with default country ──
    const init = itiInst.getSelectedCountryData();
    codeEl.value = '+' + init.dialCode;
    
    // Set initial placeholder based on country format
    console.log(`📞 Phone input initialized for: ${init.name} (+${init.dialCode})`);

    return itiInst;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  HELPER: Update full_phone_number with proper formatting
  // ════════════════════════════════════════════════════════════════════════════
  function updateFullNumber(itiInst, phoneEl, codeEl, fullEl) {
    const cd = itiInst.getSelectedCountryData();
    const rawInput = phoneEl.value.trim();
    
    if (!rawInput) {
      fullEl.value = '';
      return;
    }

    // Store multiple formats as JSON or choose your preferred one:
    // Option 1: E.164 format (standard international, no spaces)
    // +819012345678
    const e164 = itiInst.getNumber(intlTelInputUtils.numberFormat.E164);
    
    // Option 2: International format (with spaces for readability)
    // +81 90 1234 5678
    const international = itiInst.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    
    // Option 3: National format (country-specific)
    // 090-1234-5678 (Japan) or (555) 123-4567 (US)
    const national = itiInst.getNumber(intlTelInputUtils.numberFormat.NATIONAL);
    
    // Option 4: RFC3966 format (tel: URI)
    const rfc3966 = itiInst.getNumber(intlTelInputUtils.numberFormat.RFC3966);

    // Store the E.164 format in full_phone_number (most standard for storage)
    // You can change this to 'international' or 'national' based on your needs
    fullEl.value = e164 || (codeEl.value + rawInput.replace(/\D/g, ''));
    
    // Also store metadata for the backend to know the format
    fullEl.setAttribute('data-format', 'E.164');
    fullEl.setAttribute('data-national', national || '');
    fullEl.setAttribute('data-international', international || '');
    fullEl.setAttribute('data-country-iso', cd.iso2);
    fullEl.setAttribute('data-country-name', cd.name);

    const form = phoneEl.closest('form');
    if (form) updateAllPhoneFields(itiInst, form, form.id === 'donorIndigentForm' ? 'di' : 'ch');
  }
  // ════════════════════════════════════════════════════════════════════════════
  //  ACCOUNT TYPE SWITCHING
  // ════════════════════════════════════════════════════════════════════════════
  function setActiveType(type) {
    userType = type;

    // Update button highlight & CSS class on selector
    donorBtn?.classList.remove('active-type');
    indigentBtn?.classList.remove('active-type');
    charityBtn?.classList.remove('active-type');
    accountTypeEl?.classList.remove('donor-mode', 'indigent-mode', 'charity-mode');

    if (type === 'donor') {
      donorBtn?.classList.add('active-type');
      accountTypeEl?.classList.add('donor-mode');
    } else if (type === 'requester') {
      indigentBtn?.classList.add('active-type');
      accountTypeEl?.classList.add('indigent-mode');
    } else if (type === 'charity') {
      charityBtn?.classList.add('active-type');
      accountTypeEl?.classList.add('charity-mode');
    }

    if (type === 'charity') {
      // Show charity form + charity progress bar
      diForm.style.display        = 'none';
      diProgressBar.style.display = 'none';
      chForm.style.display        = 'block';
      chProgressBar.style.display = 'flex';

      // Reset charity form to step 1
      // Reset charity form to step 1
      chStep1.style.display = 'block';
      chStep2.style.display = 'none';
      chStep3.style.display = 'none';
      resetProgressBar('charity');

      // Initialize charity phone only once
      if (!chItiInitialized) {
        chIti = setupPhoneInput('ch-phoneContainer','ch-phoneNumber','ch-phoneCode','ch-fullPhoneNumber','ch-phoneError');
        chItiInitialized = true;
      }

      // Initialize flatpickr for charity date
      if (typeof flatpickr !== 'undefined') {
        flatpickr('#ch-charityDate', { dateFormat: 'Y-m-d', maxDate: 'today', disableMobile: true });
      }
    } else {
      // Show donor/indigent form + its progress bar
      chForm.style.display        = 'none';
      chProgressBar.style.display = 'none';
      diForm.style.display        = 'block';
      diProgressBar.style.display = 'flex';

      // Reset to step 1
      diStep1.style.display = 'block';
      diStep2.style.display = 'none';
      resetProgressBar('di');

      // Initialize donor/indigent phone only once
      if (!diItiInitialized) {
        diIti = setupPhoneInput('di-phoneContainer','di-phoneNumber','di-phoneCode','di-fullPhoneNumber','di-phoneError');
        diItiInitialized = true;
        // Initialize flatpickr for birth date
        if (typeof flatpickr !== 'undefined') {
          const maxBirthDate = new Date();
          maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 16);
          flatpickr('#di-birthDate', {
            dateFormat: 'Y-m-d',
            maxDate: maxBirthDate,
            disableMobile: true
          });
        }
      }
    }
  }

  donorBtn?.addEventListener('click',   () => setActiveType('donor'));
  indigentBtn?.addEventListener('click', () => setActiveType('requester'));
  charityBtn?.addEventListener('click',  () => setActiveType('charity'));

  // Default
  setActiveType('requester');

  // ════════════════════════════════════════════════════════════════════════════
  //  PROGRESS BAR HELPERS
  // ════════════════════════════════════════════════════════════════════════════
  function resetProgressBar(prefix) {
    const s1 = document.getElementById(prefix === 'di' ? 'di-prog-step1' : 'ch-prog-step1');
    const s2 = document.getElementById(prefix === 'di' ? 'di-prog-step2' : 'ch-prog-step2');
    const s3 = document.getElementById(prefix === 'di' ? 'di-prog-step3' : 'ch-prog-step3');
    s1?.classList.remove('step-one-active');
    s2?.classList.remove('step-two-active');
    s3?.classList.remove('step-three-active');
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ERROR HELPERS (named error divs with explicit IDs)
  // ════════════════════════════════════════════════════════════════════════════
  let errorTimeouts = {};

  function showError(errorDivId, message) {
    const div = document.getElementById(errorDivId);
    if (!div) {
      console.error(`[showError] Element with id "${errorDivId}" not found. Falling back to flash message.`);
      showFlashMessage(message, 'error');
      return;
    }
    const p = div.querySelector('.error-message');
    if (p) p.textContent = message;
    
    // Clear any existing timeout for this error
    if (errorTimeouts[errorDivId]) {
      clearTimeout(errorTimeouts[errorDivId]);
      delete errorTimeouts[errorDivId];
    }
    
    div.classList.remove('auto-dismiss');
    void div.offsetWidth; // reflow to restart animation
    div.classList.add('auto-dismiss');
    div.style.display = 'flex';
    
    // Auto-hide after 4 seconds
    errorTimeouts[errorDivId] = setTimeout(() => {
      hideError(errorDivId);
      delete errorTimeouts[errorDivId];
    }, 4000);
  }

  function hideError(errorDivId) {
    const div = document.getElementById(errorDivId);
    if (div) {
      div.style.display = 'none';
      div.classList.remove('auto-dismiss');
    }
  }

  function clearErrors(prefix) {
    // 'di' or 'ch'
    const ids = prefix === 'di'
      ? ['di-name-error','di-birthday-error','di-phone-error','di-location-error',
         'di-email-error','di-password-error','di-confirmPassword-error']
      : ['ch-nameDesc-error','ch-dateType-error','ch-phone-error','ch-location-error',
        'ch-links-error','ch-email-error','ch-password-error','ch-confirmPassword-error'];
    ids.forEach(id => hideError(id));
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  LOCATION HANDLER
  // ════════════════════════════════════════════════════════════════════════════
  function handleGetLocation(btn, latEl, lngEl, displayEl, storeRef, errorId) {
    if (!navigator.geolocation) {
      showError(errorId, 'Geolocation not supported by your browser');
      return;
    }
    const origHTML = btn.innerHTML;
    btn.textContent = 'Getting Location...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      if (storeRef === 'di') diLocation = loc;
      else chLocation = loc;
      latEl.value = loc.latitude;
      lngEl.value = loc.longitude;
      displayEl.textContent = `Lat: ${loc.latitude.toFixed(5)}, Lng: ${loc.longitude.toFixed(5)}`;
      btn.innerHTML = '✓';
      hideError(errorId);
    }, err => {
      showError(errorId, 'Unable to get location: ' + err.message);
      btn.innerHTML = origHTML;
      btn.disabled = false;
    });
  }

  diLocationBtn?.addEventListener('click', () =>
    handleGetLocation(diLocationBtn, diLatInput, diLngInput, diLocationDisplay, 'di', 'di-location-error')
  );

  chLocationBtn?.addEventListener('click', () =>
    handleGetLocation(chLocationBtn, chLatInput, chLngInput, chLocationDisplay, 'ch', 'ch-location-error')
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  INPUT FOCUS / FILL EFFECTS
  // ════════════════════════════════════════════════════════════════════════════
  function initInputBoxEffects(containerEl) {
    if (!containerEl) return;
    containerEl.querySelectorAll('.input-box').forEach(box => {
      const field = box.querySelector('input') || box.querySelector('textarea');
      if (!field) return;

      if (field.value !== '') box.classList.add('field-is-filled');
      else box.classList.remove('field-is-filled');

      field.addEventListener('focus', () => box.classList.add('input-box-active'));
      field.addEventListener('blur',  () => setTimeout(() => box.classList.remove('input-box-active'), 300));
      field.addEventListener('input', () => {
        if (field.value === '') box.classList.remove('field-is-filled');
        else box.classList.add('field-is-filled');
        
        // Auto-hide validation when user types
        const errorDiv = box.querySelector('.validation-error, .validation-error1');
        if (errorDiv && errorDiv.style.display !== 'none') {
          const errorId = errorDiv.id;
          if (errorId) hideError(errorId);
        }
      });

      // textarea character counter
      if (field.tagName === 'TEXTAREA') {
        const signalNum = box.querySelector('.signal_num');
        field.addEventListener('keyup', () => {
          const len = field.value.length;
          if (signalNum) signalNum.textContent = len;
          if (len > 0) box.classList.add('input-box-active'); else box.classList.remove('input-box-active');
                if (len > 500) box.classList.add('error'); else box.classList.remove('error');
        });
      }
    });
  }

  initInputBoxEffects(diForm);
  initInputBoxEffects(chForm);

  // ════════════════════════════════════════════════════════════════════════════
  //  NEXT / PREV — DONOR / INDIGENT
  // ════════════════════════════════════════════════════════════════════════════
  diNextBtn?.addEventListener('click', function (e) {
  e.preventDefault();
  clearErrors('di');
  let valid = true;

  const firstName = document.getElementById('di-firstName')?.value.trim();
  const lastName  = document.getElementById('di-lastName')?.value.trim();
  if (!firstName || !lastName) {
    showError('di-name-error', _t('validation.diNameRequired', 'First and last name are required.'));
    valid = false;
  }

  const birthDateVal = document.getElementById('di-birthDate')?.value;
  const gender       = document.getElementById('di-gender')?.value;
  if (!birthDateVal || !gender) {
    showError('di-birthday-error', _t('validation.diBirthdayRequired', 'Birth date and gender are required.'));
    valid = false;
  } else {
    const birthDate = new Date(birthDateVal);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 16) {
      showError('di-birthday-error', _t('validation.diAgeMin', 'You must be at least 16 years old to register.'));
      valid = false;
    }
  }

  if (!diIti || !diIti.isValidNumber()) {
    showError('di-phone-error', _t('validation.phoneInvalid', 'Please enter a valid phone number.'));
    valid = false;
  }

  if (!diLocation) {
    showError('di-location-error', _t('validation.locationRequired', 'Please allow access to your location.'));
    valid = false;
  }

  if (valid) {
    diStep1.style.display = 'none';
    diStep2.style.display = 'block';
    if (!diRecaptchaWidget && typeof grecaptcha !== 'undefined') {
      diRecaptchaWidget = grecaptcha.render('di-recaptcha', {
        sitekey: window.recaptchaSiteKey || 'YOUR_FALLBACK_SITE_KEY',
        theme: 'light'
      });
    }
    diProgStep1?.classList.add('step-one-active');
  }
});

  diPrevBtn?.addEventListener('click', function (e) {
    e.preventDefault();
    diStep2.style.display = 'none';
    diStep1.style.display = 'block';
    diProgStep1?.classList.remove('step-one-active');
    diProgStep2?.classList.remove('step-two-active');
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  NEXT / PREV — CHARITY
  // ════════════════════════════════════════════════════════════════════════════
  chNextBtn?.addEventListener('click', function (e) {
    e.preventDefault();
    clearErrors('ch');
    let valid = true;

    const charityName = document.getElementById('ch-charityName')?.value.trim();
    const charityDesc = document.getElementById('ch-charityDescription')?.value.trim();
    if (!charityName || !charityDesc) {
      const msg = !charityName && !charityDesc 
        ? _t('validation.chNameDescRequired', 'Charity name and description are required.')
        : !charityName 
          ? _t('validation.chNameRequired', 'Charity name is required.')
          : _t('validation.chDescRequired', 'Description is required.');
      showError('ch-nameDesc-error', msg);
      valid = false;
    } else if (charityDesc.length > 500) {
      showError('ch-nameDesc-error', _t('validation.chDescMax', 'Description cannot exceed 500 characters.'));
      valid = false;
    }

    const charityDate = document.getElementById('ch-charityDate')?.value;
    const charityType = document.getElementById('ch-charityType')?.value;
    if (!charityDate || !charityType) {
      const msg = !charityDate && !charityType
        ? _t('validation.chDateTypeRequired', 'Establishment date and type are required.')
        : !charityDate
          ? _t('validation.chDateRequired', 'Establishment date is required.')
          : _t('validation.chTypeRequired', 'Charity type is required.');
      showError('ch-dateType-error', msg);
      valid = false;
    }

    if (!chIti || !chIti.isValidNumber()) {
      showError('ch-phone-error', _t('validation.phoneInvalid', 'Please enter a valid phone number.'));
      valid = false;
    }

    if (!chLocation) {
      showError('ch-location-error', _t('validation.chLocationRequired', 'Please allow access to your charity location.'));
      valid = false;
    }

    if (valid) {
      chStep1.style.display = 'none';
      chStep2.style.display = 'block';
      chProgStep1?.classList.add('step-one-active');
    }
  });

  chPrevBtn?.addEventListener('click', function (e) {
    e.preventDefault(); 
    chStep3.style.display = 'none';
    chStep2.style.display = 'block';
    chProgStep2?.classList.remove('step-two-active');
    // When going back from account to links
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  NEXT / PREV / SKIP — CHARITY LINKS (Optional Step 2)
  // ════════════════════════════════════════════════════════════════════════════
  chNextBtnLinks?.addEventListener('click', function (e) {
    e.preventDefault();
    clearErrors('ch');
    
    // Validate URLs if any are filled
    const urlFields = [
      { id: 'ch-website', name: 'Website' },
      { id: 'ch-facebook', name: 'Facebook' },
      { id: 'ch-instagram', name: 'Instagram' },
      { id: 'ch-linkedin', name: 'LinkedIn' },
      { id: 'ch-x', name: 'X platform' }
    ];
    
    let invalidUrl = null;
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    for (const field of urlFields) {
      const el = document.getElementById(field.id);
      const val = el?.value.trim();
      if (val && !urlPattern.test(val)) {
        invalidUrl = `${field.name}: ${_t('validation.urlInvalid', 'Please enter a valid URL (e.g., https://example.com)')}`;
        break;
      }
    }
    
    if (invalidUrl) {
      showError('ch-links-error', invalidUrl);
      return;
    }
    
    chStep2.style.display = 'none';
    chStep3.style.display = 'block';
    chProgStep2?.classList.add('step-two-active');
    if (!chRecaptchaWidget && typeof grecaptcha !== 'undefined') {
      chRecaptchaWidget = grecaptcha.render('ch-recaptcha', {
        sitekey: window.recaptchaSiteKey || 'YOUR_FALLBACK_SITE_KEY',
        theme: 'light'
      });
    }
  });

  chSkipBtnLinks?.addEventListener('click', function (e) {
    e.preventDefault();
    chStep2.style.display = 'none';
    chStep3.style.display = 'block';
    chProgStep2?.classList.add('step-two-active');
    if (!chRecaptchaWidget && typeof grecaptcha !== 'undefined') {
      chRecaptchaWidget = grecaptcha.render('ch-recaptcha', {
        sitekey: window.recaptchaSiteKey || 'YOUR_FALLBACK_SITE_KEY',
        theme: 'light'
      });
    }
  });

  chPrevBtnLinks?.addEventListener('click', function (e) {
    e.preventDefault();
    chStep2.style.display = 'none';
    chStep1.style.display = 'block';
  });
  // ════════════════════════════════════════════════════════════════════════════
  //  FORM SUBMIT — Enhanced with guaranteed phone formatting
  // ════════════════════════════════════════════════════════════════════════════
  function handleFormSubmit(form, prefix, itiRefGetter, verifyWindowEl, progStep2, progStep3) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearErrors(prefix);
      // ── Client-side validation for Step 2/3 fields ─────────────────────────
      let clientValid = true;
      
      if (prefix === 'di') {
        const email = form.querySelector('#di-email')?.value.trim();
        const pwd   = form.querySelector('#di-password')?.value;
        const cpwd  = form.querySelector('#di-confirmPassword')?.value;
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showError('di-email-error', _t('validation.emailInvalid', 'Please enter a valid email address.'));
          clientValid = false;
        }
        if (!pwd || pwd.length < 6) {
          showError('di-password-error', _t('validation.passwordMin', 'Password must be at least 6 characters.'));
          clientValid = false;
        }
        if (pwd !== cpwd) {
          showError('di-confirmPassword-error', _t('validation.passwordMatch', 'Passwords do not match.'));
          clientValid = false;
        }
      } else if (prefix === 'ch') {
        const email = form.querySelector('#ch-email')?.value.trim();
        const pwd   = form.querySelector('#ch-password')?.value;
        const cpwd  = form.querySelector('#ch-confirmPassword')?.value;
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showError('ch-email-error', _t('validation.emailInvalid', 'Please enter a valid email address.'));
          clientValid = false;
        }
        if (!pwd || pwd.length < 6) {
          showError('ch-password-error', _t('validation.passwordMin', 'Password must be at least 6 characters.'));
          clientValid = false;
        }
        if (pwd !== cpwd) {
          showError('ch-confirmPassword-error', _t('validation.passwordMatch', 'Passwords do not match.'));
          clientValid = false;
        }
      }
      
      if (!clientValid) {
        showLoadingState(false, form);
        return;
      }
      // ── End client-side validation ──────────────────────────────────────────
      // ── Image validation ────────────────────────────────────────────────
      const imageInput = form.querySelector(`#${prefix}-image`);
      const imageErrorDiv = document.getElementById(`${prefix}-image-error`);
      if (imageInput) {
        if (!imageInput.files || imageInput.files.length === 0) {
          showError(`${prefix}-image-error`, 'Profile image is required.');
          showLoadingState(false, form);
          return;
        }
        const file = imageInput.files[0];
        if (!file.type.match('image.*')) {
          showError(`${prefix}-image-error`, 'Please select a valid image file (JPG, PNG, GIF).');
          showLoadingState(false, form);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          showError(`${prefix}-image-error`, 'Image size must not exceed 5MB.');
          showLoadingState(false, form);
          return;
        }
      }
      // ── Collect reCAPTCHA token ───────────────────────────────────────────
      const widgetId = prefix === 'di' ? diRecaptchaWidget : chRecaptchaWidget;
      let recaptchaToken = '';
      if (widgetId !== null && typeof grecaptcha !== 'undefined') {
        recaptchaToken = grecaptcha.getResponse(widgetId);
      }
      if (!recaptchaToken) {
        showFlashMessage(_t('validation.captchaRequired', 'Please complete the CAPTCHA challenge.'), 'error');
        showLoadingState(false, form);
        return;
      }
      const itiInst = typeof itiRefGetter === 'function' ? itiRefGetter() : itiRefGetter;

      if (itiInst) {
        updateAllPhoneFields(itiInst, form, prefix);   // ← Ensure latest values
      }
      
      // ── CRITICAL: Final phone formatting before submission ──
      const phoneEl   = form.querySelector(`#${prefix}-phoneNumber`);
      const codeEl    = form.querySelector(`#${prefix}-phoneCode`);
      const fullEl    = form.querySelector(`#${prefix}-fullPhoneNumber`);
      
      if (itiInst && phoneEl && codeEl && fullEl) {
        const cd = itiInst.getSelectedCountryData();
        
        // Force reformat to ensure latest data
        const e164 = itiInst.getNumber(intlTelInputUtils.numberFormat.E164);
        const international = itiInst.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
        const national = itiInst.getNumber(intlTelInputUtils.numberFormat.NATIONAL);
        
        // Store primary format (E.164 recommended for database storage)
        fullEl.value = e164 || (codeEl.value + phoneEl.value.replace(/\D/g, ''));
        // ══════════════════════════════════════════════════════════════════
        // ADD THE LOGGING CODE HERE - Right before the try block
        // ══════════════════════════════════════════════════════════════════
        console.log('📤 Phone fields being submitted:');
        console.log('  - Form prefix:', prefix);
        console.log('  - phone_number (E.164):', fullEl?.value);
        console.log('  - phone_national:', form.querySelector('input[name="phone_national"]')?.value);
        console.log('  - phone_international:', form.querySelector('input[name="phone_international"]')?.value);
        console.log('  - phone_country_iso:', form.querySelector('input[name="phone_country_iso"]')?.value);
        console.log('  - phone_country_name:', form.querySelector('input[name="phone_country_name"]')?.value);
        console.log('  - Country:', cd.name, '(ISO:', cd.iso2, ')');
        
        console.log(`📤 Submitting phone: ${fullEl.value} (${cd.name}, ISO: ${cd.iso2})`);
      }

      try {
        showLoadingState(true, form);

        // Inject userType hidden field
        const typeInput = document.createElement('input');
        typeInput.type  = 'hidden';
        typeInput.name  = 'userType';
        typeInput.value = userType;
        form.appendChild(typeInput);

        const formData = new FormData(form);
        formData.append('g-recaptcha-response', recaptchaToken);
        const response = await fetch('/user-auth/register', {
          method: 'POST',
          body: formData
        });

        const responseText = await response.text();
        let data;
        try { data = JSON.parse(responseText); }
        catch { throw new Error('Server returned invalid response'); }

        // Clean up injected inputs
        form.removeChild(typeInput);

        if (data.banned) {
          showBanMessage(data, form);
          showLoadingState(false, form);
          return;
        }

        if (!response.ok) {
          if (data.errors && Array.isArray(data.errors)) {
            handleServerValidationErrors(data.errors, prefix);
          } else {
            showFlashMessage(data.error || `Registration failed (${response.status})`, 'error');
          }
          showLoadingState(false, form);
          return;
        }

        // Success
        const emailEl = form.querySelector('[name="email"]');
        if (emailEl) localStorage.setItem('userEmail', emailEl.value);
        // For charity form, after successful submit, mark step 3 and 4:
        if (prefix === 'ch') {
          chProgStep3?.classList.add('step-three-active');
        }
        showFlashMessage(data.message || _t('registration.success', 'Registration successful! Please verify your email.'), 'success');
        if (verifyWindowEl) {
          verifyWindowEl.style.display = 'block';
          startResendTimer(prefix);
        }

      } catch (err) {
        console.error('Registration error:', err);
        showFlashMessage(err.message || 'An error occurred. Please try again.', 'error');
        const typeInput = form.querySelector('input[name="userType"]');
        if (typeInput) form.removeChild(typeInput);
        // Reset reCAPTCHA on error so user can retry
        const resetId = prefix === 'di' ? diRecaptchaWidget : chRecaptchaWidget;
        if (resetId !== null && typeof grecaptcha !== 'undefined') {
          grecaptcha.reset(resetId);
        }
      } finally {
        showLoadingState(false, form);
      }
    });
  }
  // ════════════════════════════════════════════════════════════════════════════
  //  HELPER: Update ALL phone fields (live + on submit)
  // ════════════════════════════════════════════════════════════════════════════
  function updateAllPhoneFields(itiInst, form, prefix) {
    if (!itiInst) return;

    const phoneEl = form.querySelector(`#${prefix}-phoneNumber`);
    if (!phoneEl || !itiInst.isValidNumber()) return;

    const national      = itiInst.getNumber(intlTelInputUtils.numberFormat.NATIONAL);
    const international = itiInst.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
    const e164          = itiInst.getNumber(intlTelInputUtils.numberFormat.E164);
    const cd            = itiInst.getSelectedCountryData();

    // Consistent field names (no di/ch prefix) → much cleaner
    ensureHiddenField(form, 'phone_national', national || '');
    ensureHiddenField(form, 'phone_international', international || '');
    ensureHiddenField(form, 'phone_country_iso', cd.iso2 || '');
    ensureHiddenField(form, 'phone_country_name', cd.name || '');

    // Main field for database (E.164 is best practice)
    const fullEl = form.querySelector(`#${prefix}-fullPhoneNumber`);
    if (fullEl) fullEl.value = e164;
  }

  // Update ensureHiddenField to be more robust
  function ensureHiddenField(form, name, value) {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  }

  // With these (using getters to resolve the instances at submit time):
  handleFormSubmit(diForm, 'di', () => diIti,  diVerifWindow, diProgStep2, diProgStep3);
    handleFormSubmit(chForm, 'ch', () => chIti, chVerifWindow, chProgStep3, null);

  // Re-bind ITI on submit (iti might be initialized after handleFormSubmit is bound)
  // We pass live reference via closure; since diIti/chIti are assigned later, we read them at submit time:

  // ════════════════════════════════════════════════════════════════════════════
  //  EMAIL VERIFICATION — Donor/Indigent
  // ════════════════════════════════════════════════════════════════════════════
  setupVerification(diVerifyBtn, diCodeInputs, diErrorMsg, diSuccessMsg, diProgStep3, 'di');

  // ════════════════════════════════════════════════════════════════════════════
  //  EMAIL VERIFICATION — Charity
  // ════════════════════════════════════════════════════════════════════════════
  setupVerification(chVerifyBtn, chCodeInputs, chErrorMsg, chSuccessMsg, null, 'ch');

  // Function signature:
  function setupVerification(verifyBtn, codeInputs, errorMsgEl, successMsgEl, progStep3, prefix) {
    if (!verifyBtn) return;

    // Auto-move focus
    codeInputs.forEach((input, idx) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && idx < codeInputs.length - 1) {
                codeInputs[idx + 1].focus();
            }
            input.classList.toggle('filled', input.value.length === 1);
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                codeInputs[idx - 1].focus();
            }
        });
    });

    // REPLACE the verifyBtn click handler inside setupVerification with this corrected version:
    verifyBtn.addEventListener('click', async () => {
        if (errorMsgEl)   errorMsgEl.style.display   = 'none';
        if (successMsgEl) successMsgEl.style.display = 'none';

        const code  = Array.from(codeInputs).map(i => i.value.trim()).join('');
        const email = localStorage.getItem('userEmail');

        if (!email) { 
            showVerifError(errorMsgEl, 'validation.emailNotFound', 'Email not found. Please register again.'); 
            return; 
        }
        if (code.length !== 6) { 
            showVerifError(errorMsgEl, 'validation.codeLength', 'Please enter the 6-digit code.'); 
            return; 
        }

        try {
            const response = await fetch('/user-auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, verifyCode: code })
            });
            const data = await response.json();

            if (response.ok) {
                progStep3?.classList.add('step-three-active');
                if (successMsgEl) { 
                    successMsgEl.textContent = _t('verificationWindowSuccessMsgTgt', 'Verification successful! Redirecting...'); 
                    successMsgEl.style.display = 'block'; 
                }
                setTimeout(() => { window.location.href = '/register'; }, 2000);
            } else {
                showVerifError(errorMsgEl, 'validation.codeInvalid', 'Invalid verification code');
                // Force show resend button on invalid code
                const resendSection = document.getElementById(`${prefix}-resend-section`);
                const resendBtn = document.getElementById(`${prefix}-resendCodeBtn`);
                if (resendSection && resendBtn) {
                    resendSection.style.display = 'block';
                    resendBtn.disabled = false;
                    resendState[prefix].canResend = true;
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            showVerifError(errorMsgEl, 'validation.networkError', 'Network error. Please try again.');
        }
    });

    // Resend code button handler
    const resendBtn = document.getElementById(`${prefix}-resendCodeBtn`);
    if (resendBtn) {
      resendBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!resendState[prefix].canResend) return;
        if (resendState[prefix].attempts >= MAX_RESEND_ATTEMPTS) {
            showVerifError(errorMsgEl, 'validation.maxResendAttempts', 'Maximum resend attempts reached. Please register again.');
            return;
        }
        
        const email = localStorage.getItem('userEmail');
        if (!email) {
            showVerifError(errorMsgEl, 'validation.emailNotFound', 'Email not found. Please register again.');
            return;
        }
        
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';
        
        try {
            const response = await fetch('/user-auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            
            if (response.ok) {
                incrementResendAttempt(prefix);
                startResendTimer(prefix); // Restart timer
                if (successMsgEl) {
                    successMsgEl.textContent = _t('verificationWindowResendSuccessTgt', 'New code sent! Check your email.');
                    successMsgEl.style.display = 'block';
                }
                // Clear code inputs
                codeInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
                codeInputs[0]?.focus();
            } else {
                showVerifError(errorMsgEl, 'validation.resendFailed', 'Failed to resend code. Please try again.');
                resendBtn.disabled = false;
            }
        } catch (err) {
            showVerifError(errorMsgEl, 'validation.networkError', 'Network error. Please try again.');
            resendBtn.disabled = false;
        }
      });
    }
  }

  // WITH this translated version:
  function showVerifError(el, msgKey, fallbackMsg) {
        if (!el) return;
        const translatedMsg = _t(msgKey, fallbackMsg);
        // Support both plain text elements and elements with inner .error-message p
        const inner = el.querySelector('.error-message');
        if (inner) {
            inner.textContent = translatedMsg;
        } else {
            el.textContent = translatedMsg;
        }
        el.style.display = 'flex';
    }

  // ════════════════════════════════════════════════════════════════════════════
  //  SERVER VALIDATION ERROR MAPPING
  // ════════════════════════════════════════════════════════════════════════════
  function handleServerValidationErrors(errors, prefix) {
    errors.forEach(errorMessage => {
      const msg = typeof errorMessage === 'string' ? errorMessage : (errorMessage.message || JSON.stringify(errorMessage));

      if (prefix === 'di') {
        if (msg.includes('firstName') || msg.includes('first name') || msg.includes('الاسم الأول') ||
            msg.includes('lastName')  || msg.includes('last name')  || msg.includes('اسم العائلة')) {
          showError('di-name-error', msg);
        } else if (msg.includes('birthDate') || msg.includes('birth date') || msg.includes('تاريخ الميلاد') ||
                   msg.includes('gender')    || msg.includes('الجنس')) {
          showError('di-birthday-error', msg);
        } else if (msg.includes('phone') || msg.includes('الهاتف')) {
          showError('di-phone-error', msg);
        } else if (msg.includes('location') || msg.includes('الموقع')) {
          showError('di-location-error', msg);
        } else if (msg.includes('email') || msg.includes('البريد')) {
          showError('di-email-error', msg);
        } else if ((msg.includes('confirmPassword') || msg.includes('confirm password') || msg.includes('confirmation') || msg.includes('match')) && (msg.includes('password') || msg.includes('كلمة المرور') || msg.includes('كلمة السر'))) {
          showError('di-confirmPassword-error', msg);
        } else if (msg.includes('password') || msg.includes('كلمة المرور') || msg.includes('كلمة السر')) {
          showError('di-password-error', msg);
        } else if (msg.includes('image') || msg.includes('صورة') || msg.includes('الصورة')) {
          showError('di-image-error', msg);
        } else {
          showFlashMessage(_t('validation.serverError', msg), 'error');
        }
      } else { // charity
        if (msg.includes('charityName') || msg.includes('charity name') ||
            msg.includes('charityDescription') || msg.includes('description')) {
          showError('ch-nameDesc-error', msg);
        } else if (msg.includes('charityDate') || msg.includes('charityType') ||
                   msg.includes('establishment') || msg.includes('type')) {
          showError('ch-dateType-error', msg);
        } else if (msg.includes('phone') || msg.includes('الهاتف')) {
          showError('ch-phone-error', msg);
        } else if (msg.includes('location') || msg.includes('الموقع')) {
          showError('ch-location-error', msg);
        } else if (msg.includes('email') || msg.includes('البريد')) {
          showError('ch-email-error', msg);
        } else if ((msg.includes('confirmPassword') || msg.includes('confirm password') || msg.includes('confirmation') || msg.includes('match')) && (msg.includes('password') || msg.includes('كلمة المرور') || msg.includes('كلمة السر'))) {
          showError('ch-confirmPassword-error', msg);
        } else if (msg.includes('password') || msg.includes('كلمة المرور') || msg.includes('كلمة السر')) {
          showError('ch-password-error', msg);
        } else if (msg.includes('image') || msg.includes('صورة') || msg.includes('الصورة')) {
          showError('ch-image-error', msg);
        } else {
          showFlashMessage(_t('validation.serverError', msg), 'error');
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  UTILITY
  // ════════════════════════════════════════════════════════════════════════════
  function showLoadingState(show, form) {
    const btn = form?.querySelector('.submit-btn');
    if (!btn) return;
    if (show) {
      btn.disabled = true;
      btn.textContent = 'Registering...';
      btn.style.opacity = '0.7';
    } else {
      btn.disabled = false;
      btn.textContent = 'Submit';
      btn.style.opacity = '1';
    }
  }

  function showBanMessage(data, form) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = 'padding:10px;background:#fff3f3;border:2px solid #ff4444;border-radius:8px;margin:20px 0;color:#d32f2f;text-align:center;';
    messageDiv.innerHTML = `<strong>${_t('validation.bannedTitle', '🚫 Account Suspended')}</strong><br>${data.message}`;
    const step2 = form.querySelector('[id$="-step2"]');
    if (step2) step2.insertBefore(messageDiv, step2.firstChild);
  }

  function showFlashMessage(message, type = 'success') {
    const existing = document.querySelector('.flash-message');
    if (existing) existing.remove();

    const flashDiv = document.createElement('div');
    flashDiv.className = `flash-message flash-${type}`;
    const colors = {
      success: 'background:#e8f5e8;border:2px solid #4caf50;color:#2e7d32;',
      error:   'background:#ffebee;border:2px solid #f44336;color:#c62828;',
      warning: 'background:#fffbf0;border:2px solid #ffc107;color:#856404;'
    };
    flashDiv.style.cssText = `
      position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;
      padding:15px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);
      display:flex;align-items:center;gap:10px;min-width:300px;max-width:90%;
      animation:slideDown 0.3s ease-out;${colors[type] || colors.success}
    `;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    flashDiv.innerHTML = `
      <span style="font-size:18px;">${icon}</span>
      <span style="flex:1;font-size:14px;font-weight:500;">${message}</span>
      <button style="background:none;border:none;font-size:20px;cursor:pointer;color:inherit;opacity:.7;" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(flashDiv);
    setTimeout(() => { if (flashDiv.parentElement) flashDiv.remove(); }, 5000);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SIGN IN / SIGN UP PANEL TOGGLE (from registration.js via global)
  // ════════════════════════════════════════════════════════════════════════════
  // (handled in registration.js)

  // ════════════════════════════════════════════════════════════════════════════
  //  INJECT GLOBAL CSS
  // ════════════════════════════════════════════════════════════════════════════
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { opacity:0; transform:translateX(-50%) translateY(-20px); }
      to   { opacity:1; transform:translateX(-50%) translateY(0); }
    }
    .validation-error {
      display:none;align-items:center;gap:8px;color:#e74c3c;margin-top:5px;font-size:14px;
    }
    .validation-error p.error-message {
      display:block !important;visibility:visible !important;opacity:1 !important;
      color:#e74c3c !important;font-size:14px !important;margin:0 !important;
    }
    .error-field { border-color:#e74c3c !important; border-width:2px !important; }
    #progressBar-di, #progressBar-charity { display:flex; }
  `;
  document.head.appendChild(style);

  console.log('✅ userRegistration.js loaded');

  // ════════════════════════════════════════════════════════════════════════════
  //  IMAGE UPLOAD PREVIEW & VALIDATION
  // ════════════════════════════════════════════════════════════════════════════

  function initImageUploadPreview(prefix) {
    const uploadArea = document.getElementById(`${prefix}ImageUploadArea`);
    const fileInput = document.getElementById(`${prefix}-image`);
    const previewContainer = document.getElementById(`${prefix}ImagePreview`);
    const previewImg = document.getElementById(`${prefix}ImagePreviewImg`);
    const removeBtn = document.getElementById(`${prefix}RemoveImage`);
    const errorDiv = document.getElementById(`${prefix}-image-error`);

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', (e) => {
      if (e.target.closest('.remove-image-btn')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', function() {
      const file = this.files[0];
      hideImageError(prefix);

      if (!file) return;

      // Validate file type
      if (!file.type || !file.type.match('image.*')) {
        const msg = _t('validation.imageType', 'Please select a valid image file (JPG, PNG, GIF).');
        showImageError(prefix, msg);
        this.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const msg = _t('validation.imageSize', 'Image size must not exceed 5MB.');
        showImageError(prefix, msg);
        this.value = '';
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewContainer.style.display = 'block';
        uploadArea.classList.add('has-image');
      };
      reader.readAsDataURL(file);
    });

    removeBtn?.addEventListener('click', function(e) {
      e.stopPropagation();
      fileInput.value = '';
      previewContainer.style.display = 'none';
      previewImg.src = '';
      uploadArea.classList.remove('has-image');
      hideImageError(prefix);
    });
  }

  function showImageError(prefix, message) {
    const errorDiv = document.getElementById(`${prefix}-image-error`);
    if (!errorDiv) return;
    
    const msgEl = errorDiv.querySelector('.error-message');
    if (msgEl) msgEl.textContent = message;
    
    // Force visible with inline style + ensure parent wrapper is visible
    errorDiv.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
    errorDiv.classList.add('auto-dismiss');
    
    // Clear any pending hide timeout
    if (errorDiv.dataset.hideTimeout) {
      clearTimeout(parseInt(errorDiv.dataset.hideTimeout));
    }
    
    const timeoutId = setTimeout(() => hideImageError(prefix), 4000);
    errorDiv.dataset.hideTimeout = timeoutId;
  }

  function hideImageError(prefix) {
    const errorDiv = document.getElementById(`${prefix}-image-error`);
    if (!errorDiv) return;
    errorDiv.style.cssText = 'display: none !important;';
    errorDiv.classList.remove('auto-dismiss');
    if (errorDiv.dataset.hideTimeout) {
      delete errorDiv.dataset.hideTimeout;
    }
  }

  // Initialize for both forms
  initImageUploadPreview('di');
  initImageUploadPreview('ch');
});


// ════════════════════════════════════════════════════════════════════════════
//  FORGOT PASSWORD (unchanged from original — kept here for completeness)
// ════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
  const showEmailWindowBtn  = document.getElementById('showEmailWindowBtn');
  const emailWindow         = document.getElementById('emailWindow');
  const verificationWindow  = document.getElementById('verificationWindowForForgetPassword');
  const forgotPasswordForm  = document.getElementById('forgotPasswordForm');
  const verifyBtnForgot     = document.getElementById('verifyBtnForForgetPassword');
  const resendCodeBtn = document.getElementById('fp-resendCodeBtn');
  const forgetPasswordMsg   = document.getElementById('forgetPasswordMessage');
  const codeInputsForgot    = verificationWindow ? verificationWindow.querySelectorAll('.code-input') : [];
  // ADD after: const codeInputsForgot = ...
  const fpCodeErrorDiv = document.createElement('div');
  fpCodeErrorDiv.id = 'fp-code-error';
  fpCodeErrorDiv.className = 'validation-error1';
  fpCodeErrorDiv.style.cssText = 'display:none;justify-content:center;';
  fpCodeErrorDiv.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
    </svg>
    <p class="error-message"></p>
  `;
  // Insert before code-container in verificationWindow
  const codeContainer = verificationWindow?.querySelector('.code-container');
  if (codeContainer && codeContainer.parentNode) {
    codeContainer.parentNode.insertBefore(fpCodeErrorDiv, codeContainer);
  }
  let currentEmail = '';

  if (!showEmailWindowBtn) return; // Sign-in elements not present

  showEmailWindowBtn.addEventListener('click', function (e) {
    e.preventDefault();
    emailWindow.classList.toggle('show');
    verificationWindow.classList.remove('show');
    if (emailWindow.classList.contains('show')) {
      forgotPasswordForm.reset();
      forgetPasswordMsg.style.display = 'none';
    }
  });

  // REPLACE validation in forgotPasswordForm submit handler
  forgotPasswordForm?.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    // ADD: Clear previous error
    const existingFpError = document.getElementById('fp-email-error');
    if (existingFpError) existingFpError.style.display = 'none';
    
    const email = document.getElementById('forgetPasswordEmail').value.trim();
    
    // REPLACE with this validation:
    if (!email) {
      showFpEmailError(_t('validation.emailRequired', 'Please enter your email address.'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFpEmailError(_t('validation.emailInvalid', 'Please enter a valid email address.'));
      return;
    }
    
    await sendResetCode(email);
  });
    let errorTimeouts = {};

  function showError(errorDivId, message) {
    const div = document.getElementById(errorDivId);
    if (!div) {
      console.error(`[showError] Element with id "${errorDivId}" not found. Falling back to flash message.`);
      showFlashMessage(message, 'error');
      return;
    }
    const p = div.querySelector('.error-message');
    if (p) p.textContent = message;
    
    // Clear any existing timeout for this error
    if (errorTimeouts[errorDivId]) {
      clearTimeout(errorTimeouts[errorDivId]);
      delete errorTimeouts[errorDivId];
    }
    
    div.classList.remove('auto-dismiss');
    void div.offsetWidth; // reflow to restart animation
    div.classList.add('auto-dismiss');
    div.style.display = 'flex';
    
    // Auto-hide after 4 seconds
    errorTimeouts[errorDivId] = setTimeout(() => {
      hideError(errorDivId);
      delete errorTimeouts[errorDivId];
    }, 4000);
  }

  function hideError(errorDivId) {
    const div = document.getElementById(errorDivId);
    if (div) {
      div.style.display = 'none';
      div.classList.remove('auto-dismiss');
    }
  }
  // ADD this new helper function (after hideFieldError):
  function showFpEmailError(message) {
    let errorDiv = document.getElementById('fp-email-error');
    if (!errorDiv) {
      const emailInput = document.getElementById('forgetPasswordEmail');
      const inputBox = emailInput?.closest('.input-box');
      if (!inputBox) return;
      
      errorDiv = document.createElement('div');
      errorDiv.id = 'fp-email-error';
      errorDiv.className = 'validation-error1';
      errorDiv.style.cssText = 'display:none;margin-top:8px;';
      errorDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
        </svg>
        <p class="error-message"></p>
      `;
      inputBox.parentNode.insertBefore(errorDiv, inputBox.nextSibling);
    }
    
    const p = errorDiv.querySelector('.error-message');
    if (p) p.textContent = message;
    errorDiv.style.display = 'flex';
    
    // Auto-dismiss after 4 seconds
    if (errorDiv.dataset.autoHide) clearTimeout(parseInt(errorDiv.dataset.autoHide));
    errorDiv.dataset.autoHide = setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 4000);
  }

  // ADD auto-hide on input
  document.getElementById('forgetPasswordEmail')?.addEventListener('input', () => {
    const err = document.getElementById('fp-email-error');
    if (err) {
      err.style.display = 'none';
      if (err.dataset.autoHide) {
        clearTimeout(parseInt(err.dataset.autoHide));
        delete err.dataset.autoHide;
      }
    }
  });

  resendCodeBtn?.addEventListener('click', async function (e) {
      e.preventDefault();
      if (!currentEmail) { 
          showVerifErr('validation.emailNotFound', 'No email found. Please start the process again.'); 
          return; 
      }
      if (!resendState.fp.canResend) return;
      if (resendState.fp.attempts >= MAX_RESEND_ATTEMPTS) {
          showVerifErr('validation.maxResendAttempts', 'Maximum resend attempts reached. Please start again.');
          return;
      }
      await sendResetCode(currentEmail, true);
      incrementResendAttempt('fp');
      startResendTimer('fp');
  });

async function sendResetCode(email, isResend = false) {
  const submitBtn = document.getElementById('forgetPasswordEmailBtn');
  try {
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
    const response = await fetch('/user-auth/send-password-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        currentEmail = email;
        showMsg(isResend ? 'Code resent to your email' : 'Verification code sent to your email', 'success');
        startResendTimer('fp');
        setTimeout(() => {
          emailWindow.classList.remove('show');
          verificationWindow.classList.add('show');
          resetForgotInputs();
          codeInputsForgot[0]?.focus();
        }, 2000);
      } else {
        showMsg(data.error || 'Failed to send verification code', 'error');
      }
    } catch (err) {
      showMsg('Network error. Please try again.', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send'; }
    }
  }

  codeInputsForgot.forEach((input, idx) => {
    input.addEventListener('input', e => {
      if (e.target.value.length === 1 && idx < codeInputsForgot.length - 1) codeInputsForgot[idx + 1].focus();
      e.target.classList.toggle('filled', !!e.target.value);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) codeInputsForgot[idx - 1].focus();
    });
  });

  // REPLACE the validation in verifyBtnForgot click handler
  verifyBtnForgot?.addEventListener('click', async function () {
    // ADD: Clear previous code error
    fpCodeErrorDiv.style.display = 'none';
    hideVerifErr();
    
    const code = Array.from(codeInputsForgot).map(i => i.value).join('');
    
    // REPLACE the existing validation with this:
    if (code.length !== 6) {
      const p = fpCodeErrorDiv.querySelector('.error-message');
      if (p) p.textContent = _t('validation.codeLength', 'Please enter the 6-digit code.');
      fpCodeErrorDiv.style.display = 'flex';
      return;
    }
    try {
      verifyBtnForgot.disabled = true;
      verifyBtnForgot.textContent = 'Verifying...';
      const response = await fetch('/user-auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, code })
      });
      const data = await response.json();
      if (response.ok) {
        hideVerifErr();
        showPasswordResetModal(code);
      } else {
        showVerifErr('validation.codeInvalid', 'Invalid verification code');

        const p = fpCodeErrorDiv.querySelector('.error-message');
        if (p) p.textContent = data.error || 'Invalid verification code.';
        fpCodeErrorDiv.style.display = 'flex';
        document.getElementById('fp-resend-section').style.display = 'block';
      }
    } catch (err) {
      showVerifErr('validation.networkError', 'Network error. Please try again.');
      const p = fpCodeErrorDiv.querySelector('.error-message');
      if (p) p.textContent = 'Network error. Please try again.';
      fpCodeErrorDiv.style.display = 'flex';
    } finally {
      verifyBtnForgot.disabled = false;
      verifyBtnForgot.textContent = 'Verify';
    }
  });

  function showPasswordResetModal(code) {
    // REPLACE the modalHTML inside showPasswordResetModal function
    const modalHTML = `
    <div class="password-reset-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:1000;">
      <div style="background:white;padding:30px;border-radius:12px;width:90%;max-width:400px;text-align:center;position:relative;">
        <!-- CLOSE BUTTON -->
        <button type="button" class="close-modal-btn" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:24px;cursor:pointer;color:#767676;line-height:1;">&times;</button>
        
        <h3 style="margin-bottom:20px;color:#14213d;">Set New Password</h3>
        <form id="passwordResetForm">
          <div style="margin-bottom:15px;text-align:left;">
            <label style="display:block;margin-bottom:5px;color:#495057;">New Password</label>
            <input type="password" id="newPassword" style="width:100%;padding:10px;border:1px solid #ced4da;border-radius:4px;" placeholder="Min. 6 characters" required>
            <div class="validation-error" id="reset-password-error" style="display: none; margin-top: 6px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
              </svg>
              <p class="error-message" style="margin:0;font-size:12px;"></p>
            </div>
          </div>
          <div style="margin-bottom:25px;text-align:left;">
            <label style="display:block;margin-bottom:5px;color:#495057;">Confirm Password</label>
            <input type="password" id="confirmNewPassword" style="width:100%;padding:10px;border:1px solid #ced4da;border-radius:4px;" placeholder="Confirm new password" required>
            <div class="validation-error" id="reset-confirm-error" style="display: none; margin-top: 6px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
              </svg>
              <p class="error-message" style="margin:0;font-size:12px;"></p>
            </div>
          </div>
          <div style="display:flex;gap:10px;">
            <button type="button" id="cancelReset" class="btn-website" style="flex:1;background:#6c757d;">Cancel</button>
            <button type="submit" id="confirmReset" class="btn-website" style="flex:1;">Reset Password</button>
          </div>
        </form>
        <div id="resetPasswordMessage" style="margin-top:15px;display:none;"></div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.querySelector('.password-reset-modal');
    const form  = document.getElementById('passwordResetForm');
    const msgDiv = document.getElementById('resetPasswordMessage');

    document.getElementById('cancelReset').addEventListener('click', () => modal.remove());
    // ADD this instead:
    document.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());

    // REPLACE the form submit handler inside showPasswordResetModal
    form.addEventListener('submit', async e => {
      e.preventDefault();
      
      // ADD: Clear previous errors
      hideError('reset-password-error');
      hideError('reset-confirm-error');
      
      const newPwd  = document.getElementById('newPassword').value;
      const confPwd = document.getElementById('confirmNewPassword').value;
      
      // REPLACE validation with this:
      let hasError = false;
      if (!newPwd) {
        showError('reset-password-error', _t('validation.passwordRequired', 'Please enter a new password.'));
        hasError = true;
      } else if (newPwd.length < 6) {
        showError('reset-password-error', _t('validation.passwordMin', 'Password must be at least 6 characters.'));
        hasError = true;
      }
      
      if (!confPwd) {
        showError('reset-confirm-error', _t('validation.confirmRequired', 'Please confirm your new password.'));
        hasError = true;
      } else if (newPwd !== confPwd) {
        showError('reset-confirm-error', _t('validation.passwordMatch', 'Passwords do not match.'));
        hasError = true;
      }
      
      if (hasError) return;

      const confirmBtn = document.getElementById('confirmReset');
      try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Resetting...';
        const response = await fetch('/user-auth/verify-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentEmail, code, newPassword: newPwd })
        });
        const data = await response.json();
        if (response.ok) {
          showResetMsg('Password reset successfully! Redirecting...', 'success');
          setTimeout(() => { modal.remove(); verificationWindow.classList.remove('show'); window.location.href = '/login'; }, 2000);
        } else {
          showError('reset-password-error', data.error || _t('validation.resetFailed', 'Failed to reset password'));
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Reset Password';
        }
      } catch (err) {
        showError('reset-password-error', _t('validation.networkError', 'Network error. Please try again.'));
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Reset Password';
      }
    });

    // ADD: Auto-hide on input
    document.getElementById('newPassword')?.addEventListener('input', () => hideError('reset-password-error'));
    document.getElementById('confirmNewPassword')?.addEventListener('input', () => hideError('reset-confirm-error'));

    function showResetMsg(msg, type) {
      msgDiv.textContent = msg;
      msgDiv.style.display = 'block';
      msgDiv.style.color = type === 'success' ? '#38a169' : '#e53e3e';
      msgDiv.style.backgroundColor = type === 'success' ? '#f0fff4' : '#fff5f5';
    }

    document.getElementById('newPassword').focus();

    // ADD inside showPasswordResetModal (before form event listener)
    function showResetFieldError(errorId, message) {
      const errorDiv = document.getElementById(errorId);
      if (!errorDiv) return;
      const p = errorDiv.querySelector('.error-message');
      if (p) p.textContent = message;
      errorDiv.style.display = 'flex';
      
      // Auto-dismiss after 4 seconds
      if (errorDiv.dataset.autoHide) clearTimeout(parseInt(errorDiv.dataset.autoHide));
      errorDiv.dataset.autoHide = setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 4000);
    }

    // ADD after modal is created:
    document.getElementById('newPassword')?.addEventListener('input', () => {
      const err = document.getElementById('reset-password-error');
      if (err) {
        err.style.display = 'none';
        if (err.dataset.autoHide) {
          clearTimeout(parseInt(err.dataset.autoHide));
          delete err.dataset.autoHide;
        }
      }
    });
    document.getElementById('confirmNewPassword')?.addEventListener('input', () => {
      const err = document.getElementById('reset-confirm-error');
      if (err) {
        err.style.display = 'none';
        if (err.dataset.autoHide) {
          clearTimeout(parseInt(err.dataset.autoHide));
          delete err.dataset.autoHide;
        }
      }
    });
  }

  function showMsg(msg, type) {
    forgetPasswordMsg.textContent = msg;
    forgetPasswordMsg.style.display = 'block';
    forgetPasswordMsg.style.color = type === 'success' ? '#38a169' : '#e53e3e';
    forgetPasswordMsg.style.backgroundColor = type === 'success' ? '#f0fff4' : '#fff5f5';
    forgetPasswordMsg.style.padding = '10px';
    forgetPasswordMsg.style.borderRadius = '5px';
    forgetPasswordMsg.style.border = `1px solid ${type === 'success' ? '#38a169' : '#e53e3e'}`;
  }

  function showVerifErr(msgKey, fallbackMsg) {
      const el = document.getElementById('errorMsg');
      if (el) { 
          el.textContent = (typeof _t === 'function') ? _t(msgKey, fallbackMsg) : fallbackMsg; 
          el.style.display = 'block'; 
      }
      const suc = document.getElementById('successMsg');
      if (suc) suc.style.display = 'none';
  }

  function hideVerifErr() {
    const el = document.getElementById('errorMsg');
    if (el) el.style.display = 'none';
  }

  function resetForgotInputs() {
    codeInputsForgot.forEach(i => { i.value = ''; i.classList.remove('filled'); });
  }

  // ADD this at the end of the main DOMContentLoaded in userRegistration.js

  // Close buttons for verification windows
  document.getElementById('di-close-verification')?.addEventListener('click', () => {
    document.getElementById('di-verificationWindow').style.display = 'none';
    // Reset form if needed
    diCodeInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
    hideError('di-verify-code-error');
  });

  document.getElementById('ch-close-verification')?.addEventListener('click', () => {
    document.getElementById('ch-verificationWindow').style.display = 'none';
    chCodeInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
    hideError('ch-verify-code-error');
  });

  document.getElementById('fp-close-verification')?.addEventListener('click', () => {
    document.getElementById('verificationWindowForForgetPassword').classList.remove('show');
    codeInputsForgot.forEach(i => { i.value = ''; i.classList.remove('filled'); });
    hideError('fp-verify-code-error');
    document.getElementById('emailWindow').classList.remove('show');
  });
});
