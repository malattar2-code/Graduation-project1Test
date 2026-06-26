/**
 * Donation Modal JavaScript
 * =========================
 * Handles the donation modal UI and Stripe payment flow.
 * 
 * Prerequisites:
 *   - Stripe.js loaded: <script src="https://js.stripe.com/v3/"></script>
 *   - window.fundraiserId must be set
 *   - User must be logged in (user type stored in sessionStorage)
 * 
 * Flow:
 *   1. User clicks donate button -> modal opens
 *   2. User selects amount -> clicks Continue
 *   3. Frontend calls /api/payments/create-intent -> gets clientSecret
 *   4. Stripe Elements mounts -> user enters card details
 *   5. Frontend calls stripe.confirmPayment -> redirects or resolves
 *   6. On success -> show success screen
 *   7. On failure -> show error screen with retry
 */

(function () {
  'use strict';

  // ── Configuration ─────────────────────────────────────────────────────────
  const STRIPE_PUBLIC_KEY = window.STRIPE_PUBLIC_KEY || '<%= process.env.STRIPE_PUBLISHABLE_KEY %>';
  const API_BASE = window.location.origin;

  // ── State ─────────────────────────────────────────────────────────────────
  let stripe = null;
  let elements = null;
  let cardElement = null;
  let currentInvoiceId = null;
  let currentClientSecret = null;
  let selectedAmount = 0;
  let isProcessing = false;

  // ── DOM References ────────────────────────────────────────────────────────
  const modal = document.getElementById('donationModal');
  const closeBtn = document.getElementById('donationModalClose');
  const step1 = document.getElementById('donationStep1');
  const step2 = document.getElementById('donationStep2');
  const step3 = document.getElementById('donationStep3');
  const step4 = document.getElementById('donationStep4');

  // Step 1 elements
  const presetBtns = document.querySelectorAll('.donation-modal__preset-btn');
  const customAmountInput = document.getElementById('customDonationAmount');
  const feeInfo = document.getElementById('donationFeeInfo');
  const feeGross = document.getElementById('feeGrossAmount');
  const feeProcessing = document.getElementById('feeProcessingFee');
  const feeNet = document.getElementById('feeNetAmount');
  const continueBtn = document.getElementById('donationContinueBtn');
  const step1Error = document.getElementById('donationStep1Error');

  // Step 2 elements
  const summaryAmount = document.getElementById('donationSummaryAmount');
  const cardContainer = document.getElementById('stripeCardElement');
  const cardErrors = document.getElementById('stripeCardErrors');
  const donorNameInput = document.getElementById('donorName');
  const messageInput = document.getElementById('donationMessage');
  const charCount = document.getElementById('donationCharCount');
  const backBtn = document.getElementById('donationBackBtn');
  const submitBtn = document.getElementById('donationSubmitBtn');
  const submitBtnText = submitBtn.querySelector('.donation-modal__btn-text');
  const submitBtnLoading = submitBtn.querySelector('.donation-modal__btn-loading');
  const step2Error = document.getElementById('donationStep2Error');

  // Step 3/4 elements
  const successAmount = document.getElementById('successDonationAmount');
  const failureMessage = document.getElementById('donationFailureMessage');
  const successCloseBtn = document.getElementById('donationSuccessClose');
  const retryBtn = document.getElementById('donationRetryBtn');
  const failCloseBtn = document.getElementById('donationFailClose');

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    // Wait for donate button to exist (may be created by initDonateButton)
    observeDonateButton();

    // Setup close handlers
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isModalOpen()) closeModal();
    });

    // Step 1 handlers
    setupPresetButtons();
    customAmountInput?.addEventListener('input', handleCustomAmountInput);
    continueBtn?.addEventListener('click', goToStep2);

    // Step 2 handlers
    backBtn?.addEventListener('click', goToStep1);
    submitBtn?.addEventListener('click', submitPayment);
    messageInput?.addEventListener('input', updateCharCount);

    // Result handlers
    successCloseBtn?.addEventListener('click', closeModal);
    retryBtn?.addEventListener('click', goToStep2);
    failCloseBtn?.addEventListener('click', closeModal);
  }

  // ── Observe donate button creation ────────────────────────────────────────
  function observeDonateButton() {
    // Try immediately first
    attachDonateButtonListener();

    // Also observe DOM changes
    const observer = new MutationObserver(() => {
      attachDonateButtonListener();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Fallback: check periodically
    const checkInterval = setInterval(() => {
      attachDonateButtonListener();
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  let donateListenerAttached = false;
  function attachDonateButtonListener() {
    if (donateListenerAttached) return;
    const donateBtn = document.getElementById('donateButton');
    if (donateBtn) {
      donateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Read remaining from data attribute
        window.campaignRemainingAmount = parseFloat(donateBtn.dataset.remaining) || 0;
        openModal();
      });
      donateListenerAttached = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  function isModalOpen() {
    return modal && modal.style.display === 'flex';
  }

  function openModal() {
    if (!modal) return;

    // Check authentication
    const userType = sessionStorage.getItem('userType');
    if (!userType || userType === 'requester') {
      showNotification(
        userType === 'requester'
          ? 'Requesters cannot make donations'
          : 'Please log in to make a donation',
        'error'
      );
      if (!userType) {
        setTimeout(() => window.location.href = '/login', 1500);
      }
      return;
    }
    
    resetModal();
    // If remaining < $1, show the required gross hint immediately
    const remaining = parseFloat((window.campaignRemainingAmount || 0).toFixed(2));
    if (remaining > 0 && remaining < 1) {
      const requiredGross = parseFloat(((remaining + 0.30) / (1 - 0.029)).toFixed(2));
      const hintEl = document.querySelector('.donation-modal__hint');
      if (hintEl) {
        hintEl.innerHTML = `Minimum donation: $1.00 &nbsp;|&nbsp; <span style="color:#ff9a17; font-weight:600;">To complete this campaign, donate exactly <strong>$${requiredGross.toFixed(2)}</strong> so the campaign receives the remaining <strong>$${remaining.toFixed(2)}</strong> after fees.</span>`;
      }
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';

    // Cleanup Stripe elements
    if (cardElement) {
      cardElement.destroy();
      cardElement = null;
    }
    elements = null;
  }

  function resetModal() {
    // Reset state
    selectedAmount = 0;
    currentInvoiceId = null;
    currentClientSecret = null;
    isProcessing = false;

    // Reset step 1
    presetBtns.forEach(btn => btn.classList.remove('donation-modal__preset-btn--selected'));
    customAmountInput.value = '';
    feeInfo.style.display = 'none';
    continueBtn.disabled = true;
    hideError(step1Error);

    // Reset step 2
    cardContainer.innerHTML = `
      <div class="donation-modal__card-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
        <span>Loading secure payment form...</span>
      </div>
    `;
    cardErrors.textContent = '';
    donorNameInput.value = '';
    messageInput.value = '';
    charCount.textContent = '0';
    setSubmitLoading(false);
    hideError(step2Error);

    // Show step 1
    showStep(1);
  }

  function showStep(stepNum) {
    [step1, step2, step3, step4].forEach((el, i) => {
      if (el) el.style.display = (i + 1 === stepNum) ? 'block' : 'none';
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: AMOUNT SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  function setupPresetButtons() {
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Deselect all
        presetBtns.forEach(b => b.classList.remove('donation-modal__preset-btn--selected'));
        // Select clicked
        btn.classList.add('donation-modal__preset-btn--selected');
        // Clear custom input
        customAmountInput.value = '';
        // Set amount
        selectedAmount = parseFloat(btn.dataset.amount);
        updateFeeDisplay();
        continueBtn.disabled = false;
        hideError(step1Error);
      });
    });
  }

  function handleCustomAmountInput() {
    const val = parseFloat(customAmountInput.value);

    // Deselect preset buttons
    presetBtns.forEach(b => b.classList.remove('donation-modal__preset-btn--selected'));

    const remaining = parseFloat((window.campaignRemainingAmount || 0).toFixed(2));

    // If remaining < $1, calculate the gross amount needed so campaign receives exactly `remaining` after fee
    // Formula: gross = (net + 0.30) / (1 - 0.029)
    const requiredGross = remaining > 0 && remaining < 1
      ? parseFloat(((remaining + 0.30) / (1 - 0.029)).toFixed(2))
      : 0;

    const isExactRemaining = requiredGross > 0 && val > 0 && Math.abs(val - requiredGross) < 0.005;

    // Show a hint to the user about the required gross amount
    const hintEl = document.querySelector('.donation-modal__hint');
    if (remaining > 0 && remaining < 1 && hintEl) {
      hintEl.innerHTML = `Minimum donation: $1.00 &nbsp;|&nbsp; <span style="color:#ff9a17; font-weight:600;">To complete this campaign, donate exactly <strong>$${requiredGross.toFixed(2)}</strong> so the campaign receives the remaining <strong>$${remaining.toFixed(2)}</strong> after fees.</span>`;
    } else if (hintEl) {
      hintEl.textContent = 'Minimum donation: $1.00';
    }

    if (val && val > 0 && (val >= 1 || isExactRemaining)) {
      selectedAmount = val;
      updateFeeDisplay();
      continueBtn.disabled = false;
      hideError(step1Error);
    } else {
      selectedAmount = 0;
      feeInfo.style.display = 'none';
      continueBtn.disabled = true;

      if (remaining > 0 && remaining < 1 && val > 0 && val !== requiredGross) {
        showError(step1Error, `To complete this campaign, please enter exactly $${requiredGross.toFixed(2)} (so the campaign receives the remaining $${remaining.toFixed(2)} after the processing fee).`);
      }
    }
  }

  function updateFeeDisplay() {
    const gross = selectedAmount;
    const fee = calculateFee(gross);
    const net = gross - fee;

    feeGross.textContent = `$${gross.toFixed(2)}`;
    feeProcessing.textContent = `$${fee.toFixed(2)}`;
    feeNet.textContent = `$${net.toFixed(2)}`;
    feeInfo.style.display = 'block';
  }

  function calculateFee(grossDollars) {
    return parseFloat((grossDollars * 0.029 + 0.30).toFixed(2));
  }

  function goToStep1() {
    // Cleanup stripe
    if (cardElement) {
      cardElement.destroy();
      cardElement = null;
    }
    elements = null;
    showStep(1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: PAYMENT DETAILS (STRIPE)
  // ═══════════════════════════════════════════════════════════════════════════

  async function goToStep2() {
    const remaining = parseFloat((window.campaignRemainingAmount || 0).toFixed(2));
    const requiredGross = remaining > 0 && remaining < 1
      ? parseFloat(((remaining + 0.30) / (1 - 0.029)).toFixed(2))
      : 0;
    const isExactRemaining = requiredGross > 0 && selectedAmount > 0 && Math.abs(selectedAmount - requiredGross) < 0.005;

    if (selectedAmount <= 0 || (selectedAmount < 1 && !isExactRemaining)) {
      const msg = requiredGross > 0
        ? `To complete this campaign, please enter exactly $${requiredGross.toFixed(2)} (so the campaign receives $${remaining.toFixed(2)} after fees).`
        : 'Please select or enter a valid donation amount (minimum $1.00)';
      showError(step1Error, msg);
      return;
    }

    const fundraiserId = window.fundraiserId;
    if (!fundraiserId) {
      showError(step1Error, 'Fundraiser information not available. Please refresh the page.');
      return;
    }

    showStep(2);
    summaryAmount.textContent = `$${selectedAmount.toFixed(2)}`;

    try {
      // Initialize Stripe if needed
      if (!stripe) {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
      }

      // Create payment intent on backend
      const response = await fetch(`${API_BASE}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fundraiserId: String(fundraiserId),
          amount: selectedAmount,
          currency: 'usd',
          message: messageInput?.value || ''
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize payment');
      }

      currentInvoiceId = data.invoiceId;
      currentClientSecret = data.clientSecret;

      // Mount Stripe Elements
      await mountStripeElements();

    } catch (error) {
      console.error('Error initializing payment:', error);
      showError(step2Error, error.message || 'Failed to initialize payment. Please try again.');
      // Go back to step 1 after a delay
      setTimeout(goToStep1, 3000);
    }
  }

  async function mountStripeElements() {
    // Clear placeholder
    cardContainer.innerHTML = '';

    elements = stripe.elements({
      clientSecret: currentClientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#ff9a17',
          colorBackground: '#ffffff',
          colorText: '#14213d',
          colorDanger: '#e74c3c',
          borderRadius: '10px',
          spacingUnit: '4px'
        }
      }
    });

    // Create and mount Payment Element (newer Stripe API)
    cardElement = elements.create('payment', {
      layout: {
        type: 'tabs',
        defaultCollapsed: false
      }
    });

    cardElement.mount(cardContainer);

    // Handle validation errors
    cardElement.on('change', (event) => {
      if (event.error) {
        cardErrors.textContent = event.error.message;
      } else {
        cardErrors.textContent = '';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBMIT PAYMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async function submitPayment() {
    if (isProcessing) return;

    // Validate card holder name
    const cardHolderName = donorNameInput.value.trim();
    if (!cardHolderName) {
      showError(step2Error, 'Please enter the name on your card');
      donorNameInput.focus();
      return;
    }

    // Check for element errors
    if (cardErrors.textContent) {
      showError(step2Error, 'Please fix the card information errors');
      return;
    }

    isProcessing = true;
    setSubmitLoading(true);
    hideError(step2Error);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: cardHolderName
            }
          }
        },
        redirect: 'if_required'
      });

      if (error) {
        // Payment failed
        console.error('Payment error:', error);
        failureMessage.textContent = error.message || 'Payment failed. Please try again.';
        showStep(4);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded!
        successAmount.textContent = `$${selectedAmount.toFixed(2)}`;

        // Confirm with backend
        try {
          await fetch(`${API_BASE}/api/payments/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              invoiceId: currentInvoiceId,
              paymentIntentId: paymentIntent.id
            })
          });
        } catch (e) {
          // Backend confirmation failed but payment went through
          console.warn('Backend confirmation failed, but payment succeeded:', e);
        }

        showStep(3);

        // Refresh the page after a delay to show updated amounts
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } else {
        // Requires additional action or other status
        failureMessage.textContent = 'Payment requires additional verification. Please check your email or try again.';
        showStep(4);
      }

    } catch (error) {
      console.error('Payment submission error:', error);
      failureMessage.textContent = error.message || 'An unexpected error occurred. Please try again.';
      showStep(4);
    } finally {
      isProcessing = false;
      setSubmitLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function updateCharCount() {
    const len = messageInput.value.length;
    charCount.textContent = len;
  }

  function setSubmitLoading(loading) {
    submitBtn.disabled = loading;
    submitBtnText.style.display = loading ? 'none' : 'inline';
    submitBtnLoading.style.display = loading ? 'inline-flex' : 'none';
  }

  function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
  }

  function hideError(element) {
    if (!element) return;
    element.textContent = '';
    element.style.display = 'none';
  }

  function showNotification(message, type = 'info') {
    // Use the existing showNotification if available
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // Fallback notification
    const n = document.createElement('div');
    n.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 12px 20px;
      border-radius: 4px; color: white; font-weight: bold; z-index: 10001;
      transition: opacity 0.3s;
      background-color: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545'};
    `;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => {
      n.style.opacity = '0';
      setTimeout(() => n.remove(), 300);
    }, 3000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE
  // ═══════════════════════════════════════════════════════════════════════════

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
