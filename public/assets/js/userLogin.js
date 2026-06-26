// public/assets/js/userLogin.js
// Session-based login using Passport.js — Firebase client SDK fully removed

// ── Flash message ──────────────────────────────────────────────────────────────
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
    animation: slideDown 0.3s ease-out;
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
      flashDiv.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => flashDiv.remove(), 300);
    }
  }, 5000);
}

// ── Field error helpers ────────────────────────────────────────────────────────
// REPLACE the existing showFieldError function
function showFieldError(fieldId, message) {
  const fieldElement = document.getElementById(fieldId);
  if (!fieldElement) return;

  const inputBox = fieldElement.closest('.input-box');
  let errorDiv = null;
  
  if (inputBox) {
    let nextSibling = inputBox.nextElementSibling;
    while (nextSibling) {
      if (nextSibling.classList.contains('validation-error1')) {
        errorDiv = nextSibling;
        break;
      }
      nextSibling = nextSibling.nextElementSibling;
    }
  }
  
  if (!errorDiv) {
    const errorDivId = fieldId === 'loginEmail' ? 'login-email-error' : 'login-password-error';
    errorDiv = document.getElementById(errorDivId);
  }

  if (errorDiv) {
    const p = errorDiv.querySelector('.error-message');
    if (p) {
      p.textContent = message;
      p.style.cssText = 'display:block;visibility:visible;opacity:1;color:#e74c3c;font-size:14px;margin:0;padding:0;line-height:1.4;';
    }
    errorDiv.style.display    = 'flex';
    errorDiv.style.visibility = 'visible';
    errorDiv.style.opacity    = '1';
    
    // ADD: Auto-dismiss after 4 seconds (match sign-up behavior)
    errorDiv.dataset.autoHide = setTimeout(() => {
      hideFieldError(fieldId);
    }, 4000);
  }
  
  fieldElement.classList.add('error-field');
}

function hideFieldError(fieldId) {
  const fieldElement = document.getElementById(fieldId);
  if (!fieldElement) return;
  fieldElement.classList.remove('error-field');

  // Try sibling traversal
  const inputBox = fieldElement.closest('.input-box');
  let found = false;
  if (inputBox) {
    let next = inputBox.nextElementSibling;
    while (next) {
      if (next.classList.contains('validation-error1')) {
        if (next.dataset.autoHide) {
          clearTimeout(parseInt(next.dataset.autoHide));
          delete next.dataset.autoHide;
        }
        next.style.display = 'none';
        found = true;
        break;
      }
      next = next.nextElementSibling;
    }
  }

  // Fallback: hide by known ID
  if (!found) {
    const errorDivId = fieldId === 'loginEmail' ? 'login-email-error' : 'login-password-error';
    const errorDiv = document.getElementById(errorDivId);
    if (errorDiv) {
      if (errorDiv.dataset.autoHide) {
        clearTimeout(parseInt(errorDiv.dataset.autoHide));
        delete errorDiv.dataset.autoHide;
      }
      errorDiv.style.display = 'none';
    }
  }
}

function clearAllErrors() {
  document.querySelectorAll('.validation-error1').forEach(el => { el.style.display = 'none'; });
  document.querySelectorAll('.error-field').forEach(el => { el.classList.remove('error-field'); });
}

// ── Client-side email validation ───────────────────────────────────────────────
function validateEmail(email) {
  if (!email || email.trim() === '') return { valid: false, message: 'البريد الإلكتروني مطلوب' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { valid: false, message: 'البريد الإلكتروني غير صحيح' };
  return { valid: true };
}

// ── Inject CSS ─────────────────────────────────────────────────────────────────
if (!document.querySelector('style[data-login-flash]')) {
  const style = document.createElement('style');
  style.setAttribute('data-login-flash', 'true');
  style.textContent = `
    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0);     }
    }
    @keyframes slideUp {
      from { opacity: 1; transform: translateX(-50%) translateY(0);     }
      to   { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    .flash-message .flash-close:hover { opacity: 1; }
    .error-field { border-color: #e74c3c !important; border-width: 2px !important; }
    .validation-error1 {
      display: none; align-items: center; gap: 8px;
      color: #e74c3c; margin-top: 5px; font-size: 14px;
    }
    .validation-error1 p.error-message {
      display: block !important; visibility: visible !important; opacity: 1 !important;
      color: #e74c3c !important; font-size: 14px !important;
      margin: 0 !important; padding: 0 !important; line-height: 1.4 !important;
    }
    .validation-error1[style*="display: flex"] { display: flex !important; }
  `;
  document.head.appendChild(style);
}

// ── Wire up inputs and form submit once DOM is ready ──────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // Clear field errors while the user types
  document.getElementById('loginEmail')?.addEventListener('input',    () => hideFieldError('loginEmail'));
  document.getElementById('loginPassword')?.addEventListener('input', () => hideFieldError('loginPassword'));

  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  // ── Submit ───────────────────────────────────────────────────────────────────
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors();

    const email    = document.getElementById('loginEmail')?.value.trim()  || '';
    const password = document.getElementById('loginPassword')?.value      || '';

    // Client-side validation
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      showFieldError('loginEmail', emailCheck.message);
      return;
    }
    if (!password) {
      showFieldError('loginPassword', 'كلمة المرور مطلوبة');
      return;
    }

    // Loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const origText  = submitBtn?.textContent || 'Login';
    if (submitBtn) {
      submitBtn.disabled      = true;
      submitBtn.textContent   = 'Logging in…';
      submitBtn.style.opacity = '0.7';
    }

    try {
      // ── POST credentials to Passport.js endpoint ─────────────────────────────
      // No Firebase SDK involved — server handles everything with sessions.
      const response = await fetch('/user-auth/login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',   // ← required so the browser stores the session cookie
        body:        JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Login response:', data);

       if (response.ok && data.success) {
        // Save minimal non-sensitive info for client-side use
        localStorage.setItem('userEmail', email);

        showFlashMessage('✅ تم تسجيل الدخول بنجاح!', 'success');

        // Redirect based on the URL returned by the server
        setTimeout(() => {
          window.location.href = data.redirectTo || '/';
        }, 1000);

      } else {
        // ── Failure cases ────────────────────────────────────────────────────────
        if (data.banned) {
          showFlashMessage('تم تعليق حسابك. يرجى التواصل مع الدعم.', 'error');

        } else if (data.unverified) {
          showFlashMessage(
            'لم يتم التحقق من بريدك الإلكتروني بعد. تحقق من صندوق الوارد.',
            'warning'
          );
          showResendOption(email);

        } else {
          const msg   = data.error || 'فشل تسجيل الدخول. تحقق من بياناتك.';
          const lower = msg.toLowerCase();
          showFlashMessage(msg, 'error');

          if (lower.includes('email') || lower.includes('account') ||
              lower.includes('found')  || lower.includes('البريد')) {
            showFieldError('loginEmail', msg);
          } else if (lower.includes('password') || lower.includes('incorrect') ||
                     lower.includes('كلمة')) {
            showFieldError('loginPassword', msg);
          }
        }

        // Reset button
        if (submitBtn) {
          submitBtn.disabled      = false;
          submitBtn.textContent   = origText;
          submitBtn.style.opacity = '1';
        }
      }

    } catch (err) {
      console.error('Login request failed:', err);
      showFlashMessage('خطأ في الشبكة. تحقق من اتصالك وحاول مرة أخرى.', 'error');
      if (submitBtn) {
        submitBtn.disabled      = false;
        submitBtn.textContent   = origText;
        submitBtn.style.opacity = '1';
      }
    }
  });
});

// ── "Resend verification" helper ──────────────────────────────────────────────
function showResendOption(email) {
  const existing = document.getElementById('resend-verify-box');
  if (existing) existing.remove();

  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  const box = document.createElement('div');
  box.id = 'resend-verify-box';
  box.style.cssText = `
    margin-top: 12px; text-align: center; font-size: 13px; color: #856404;
    padding: 10px; background: #fffbf0;
    border: 1px solid #ffc107; border-radius: 6px;
  `;
  box.innerHTML = `
    لم تستلم رمز التحقق؟
    <a href="#" id="resend-link"
       style="color:#ff9a17; font-weight:600; text-decoration:underline; margin-right:4px;">
      إعادة إرسال بريد التحقق
    </a>
  `;
  loginForm.appendChild(box);

  document.getElementById('resend-link')?.addEventListener('click', async function (e) {
    e.preventDefault();
    const link = this;
    link.textContent = 'جاري الإرسال…';
    try {
      const r = await fetch('/user-auth/resend-verification', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ email })
      });
      const d = await r.json();
      showFlashMessage(d.message || 'تم إرسال بريد التحقق!', r.ok ? 'success' : 'error');
    } catch {
      showFlashMessage('فشل الإرسال. حاول مرة أخرى.', 'error');
    }
    link.textContent = 'إعادة إرسال بريد التحقق';
  });
}