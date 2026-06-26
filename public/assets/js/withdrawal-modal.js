/**
 * Withdrawal Modal JavaScript
 * ===========================
 * Handles the withdrawal modal UI and API communication.
 * 
 * Prerequisites:
 *   - window.appConfig.userType must be set (or sessionStorage userType)
 *   - User must be authenticated
 * 
 * Flow:
 *   1. User clicks "Withdraw Funds" button on their fundraiser
 *   2. Modal opens, checks eligibility via /api/withdrawals/eligibility/:fundraiserId
 *   3. If eligible -> shows balance info and amount input
 *   4. User enters amount -> sees fee preview
 *   5. User selects withdrawal method and fills details
 *   6. Submit -> creates withdrawal request
 *   7. Show success (request is pending admin approval)
 */

(function () {
  'use strict';

  // ── Configuration ─────────────────────────────────────────────────────────
  const API_BASE = '';

  // ── State ─────────────────────────────────────────────────────────────────
  let currentFundraiserId = null;
  let currentCampaignStatus = null;
  let withdrawalType = null; // 'early' or 'final'
  let maxWithdrawAmount = 0;
  let selectedMethod = null;
  let isProcessing = false;
  let eligibilityData = null;

  // ── DOM References ────────────────────────────────────────────────────────
  const modal = document.getElementById('withdrawalModal');
  const closeBtn = document.getElementById('withdrawalModalClose');

  // Steps
  const loadingStep = document.getElementById('withdrawalLoading');
  const notEligibleStep = document.getElementById('withdrawalNotEligible');
  const step1 = document.getElementById('withdrawalStep1');
  const step2 = document.getElementById('withdrawalStep2');
  const step3 = document.getElementById('withdrawalStep3');
  const step4 = document.getElementById('withdrawalStep4');

  // Step 1 elements
  const totalBalanceEl = document.getElementById('withdrawTotalBalance');
  const availableBalanceEl = document.getElementById('withdrawAvailableBalance');
  const pendingBalanceEl = document.getElementById('withdrawPendingBalance');
  const totalWithdrawnEl = document.getElementById('withdrawTotalWithdrawn');
  const typeBadge = document.getElementById('withdrawalTypeBadge');
  const typeDesc = document.getElementById('withdrawalTypeDesc');
  const amountInput = document.getElementById('withdrawalAmount');
  const maxAmountEl = document.getElementById('withdrawMaxAmount');
  const feePreview = document.getElementById('withdrawalFeePreview');
  const feeGross = document.getElementById('withdrawFeeGross');
  const feeAmount = document.getElementById('withdrawFeeAmount');
  const feeNet = document.getElementById('withdrawFeeNet');
  const continueBtn = document.getElementById('withdrawalContinueBtn');
  const step1Error = document.getElementById('withdrawalStep1Error');

  // Step 2 elements
  const summaryAmount = document.getElementById('withdrawalSummaryAmount');
  const summaryNet = document.getElementById('withdrawalSummaryNet');
  const summaryNetWrap = document.getElementById('withdrawalSummaryNetWrap');
  const methodTabs = document.querySelectorAll('.withdrawal-modal__method-tab');
  const backBtn = document.getElementById('withdrawalBackBtn');
  const submitBtn = document.getElementById('withdrawalSubmitBtn');
  const submitBtnText = submitBtn.querySelector('.withdrawal-modal__btn-text');
  const submitBtnLoading = submitBtn.querySelector('.withdrawal-modal__btn-loading');
  const step2Error = document.getElementById('withdrawalStep2Error');

  // Method forms
  const methodForms = {
    bank_transfer: document.getElementById('form_bank_transfer'),
    paypal: document.getElementById('form_paypal'),
    palpay: document.getElementById('form_palpay'),
    stripe: document.getElementById('form_stripe')
  };

  // Method inputs
  const methodInputs = {
    bank_transfer: {
      account_holder_name: document.getElementById('bankAccountHolder'),
      account_number: document.getElementById('bankAccountNumber'),
      iban: document.getElementById('bankIban')
    },
    paypal: {
      paypal_email: document.getElementById('paypalEmail')
    },
    palpay: {
      mobile_number: document.getElementById('palpayMobile')
    },
    stripe: {
      stripe_account_id: document.getElementById('stripeAccountId')
    }
  };
  const notesInput = document.getElementById('withdrawalNotes');

  // Result elements
  const notEligibleMessage = document.getElementById('notEligibleMessage');
  const notEligibleClose = document.getElementById('notEligibleClose');
  const successAmount = document.getElementById('withdrawSuccessAmount');
  const successCloseBtn = document.getElementById('withdrawalSuccessClose');
  const errorMessage = document.getElementById('withdrawalErrorMessage');
  const errorRetryBtn = document.getElementById('withdrawalErrorRetry');
  const errorCloseBtn = document.getElementById('withdrawalErrorClose');

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    // Setup event delegation for withdraw buttons (early withdrawal)
    document.addEventListener('click', (e) => {
      const withdrawBtn = e.target.closest('.withdraw-btn');
      if (withdrawBtn) {
        e.preventDefault();
        const fundraiserId = withdrawBtn.dataset.fundraiserId;
        const campaignStatus = withdrawBtn.dataset.campaignStatus;
        if (fundraiserId) {
          openModal(fundraiserId, campaignStatus);
        }
      }
    });

    // Setup event delegation for receive buttons (final withdrawal)
    document.addEventListener('click', (e) => {
      const receiveBtn = e.target.closest('.receive-btn');
      if (receiveBtn) {
        e.preventDefault();
        const fundraiserId = receiveBtn.dataset.fundraiserId;
        const campaignStatus = receiveBtn.dataset.campaignStatus || 'completed';
        if (fundraiserId) {
          openModal(fundraiserId, campaignStatus);
        }
      }
    });

    // Close handlers
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isModalOpen()) closeModal();
    });
    notEligibleClose?.addEventListener('click', closeModal);
    successCloseBtn?.addEventListener('click', closeModal);
    errorCloseBtn?.addEventListener('click', closeModal);
    errorRetryBtn?.addEventListener('click', () => showStep(1));

    // Step 1 handlers
    amountInput?.addEventListener('input', handleAmountInput);
    continueBtn?.addEventListener('click', goToStep2);

    // Step 2 handlers
    methodTabs.forEach(tab => {
      tab.addEventListener('click', () => selectMethod(tab.dataset.method));
    });
    backBtn?.addEventListener('click', goToStep1);
    submitBtn?.addEventListener('click', submitWithdrawal);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  function isModalOpen() {
    return modal && modal.style.display === 'flex';
  }

  async function openModal(fundraiserId, campaignStatus) {
    if (!modal) return;

    // Check authentication
    const userType = sessionStorage.getItem('userType') || window.appConfig?.userType;
    if (!userType) {
      showNotification('Please log in to request a withdrawal', 'error');
      setTimeout(() => window.location.href = '/login', 1500);
      return;
    }

    currentFundraiserId = fundraiserId;
    currentCampaignStatus = campaignStatus;
    resetModal();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Check eligibility
    showStep('loading');
    await checkEligibility();
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentFundraiserId = null;
    currentCampaignStatus = null;
  }

  function resetModal() {
    selectedMethod = null;
    withdrawalType = null;
    maxWithdrawAmount = 0;
    isProcessing = false;
    eligibilityData = null;

    // Reset inputs
    amountInput.value = '';
    feePreview.style.display = 'none';
    continueBtn.disabled = true;
    hideError(step1Error);
    hideError(step2Error);

    // Reset method tabs
    methodTabs.forEach(tab => tab.classList.remove('withdrawal-modal__method-tab--active'));
    Object.values(methodForms).forEach(form => {
      if (form) form.style.display = 'none';
    });

    // Reset submit button
    setSubmitLoading(false);

    // Clear all method inputs
    Object.values(methodInputs).forEach(inputs => {
      Object.values(inputs).forEach(input => {
        if (input) input.value = '';
      });
    });
    if (notesInput) notesInput.value = '';
  }

  function showStep(step) {
    // Hide all steps
    loadingStep.style.display = 'none';
    notEligibleStep.style.display = 'none';
    step1.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'none';
    step4.style.display = 'none';

    // Show requested step
    switch (step) {
      case 'loading':
        loadingStep.style.display = 'block';
        break;
      case 'not-eligible':
        notEligibleStep.style.display = 'block';
        break;
      case 1:
        step1.style.display = 'block';
        break;
      case 2:
        step2.style.display = 'block';
        break;
      case 3:
        step3.style.display = 'block';
        break;
      case 4:
        step4.style.display = 'block';
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ELIGIBILITY CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  async function checkEligibility() {
    try {
      const response = await fetch(
        `${API_BASE}/api/payments/withdrawals/eligibility/${currentFundraiserId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Not JSON - likely HTML error page or redirect
        const text = await response.text();
        console.error('Non-JSON response from eligibility endpoint:', text.substring(0, 200));
        notEligibleMessage.textContent = 'Server returned an invalid response. Please check that you are logged in and the route is configured correctly.';
        showStep('not-eligible');
        return;
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to check eligibility');
      }

      eligibilityData = data;

      if (!data.eligible) {
        notEligibleMessage.textContent = data.reason || 'Withdrawal is not available for this campaign at this time.';
        showStep('not-eligible');
        return;
      }

      // Store data
      withdrawalType = data.withdrawal_type;
      maxWithdrawAmount = data.max_amount;

      // Populate balance info
      totalBalanceEl.textContent = `$${parseFloat(data.total_balance).toFixed(2)}`;
      availableBalanceEl.textContent = `$${parseFloat(data.available_balance).toFixed(2)}`;
      pendingBalanceEl.textContent = `$${parseFloat(data.pending_balance).toFixed(2)}`;
      totalWithdrawnEl.textContent = `$${parseFloat(data.total_withdrawn).toFixed(2)}`;

      // Set type info
      if (withdrawalType === 'early') {
        typeBadge.textContent = 'Early Withdrawal';
        typeDesc.textContent = 'You can withdraw up to 40% of your campaign target. This is a one-time early withdrawal available for urgent campaigns.';
      } else {
        typeBadge.textContent = 'Final Withdrawal';
        typeDesc.textContent = 'Your campaign is complete. You can withdraw all remaining funds.';
      }

      // Set max amount hint
      maxAmountEl.textContent = `$${parseFloat(maxWithdrawAmount).toFixed(2)}`;

      showStep(1);

    } catch (error) {
      console.error('Eligibility check error:', error);
      notEligibleMessage.textContent = error.message || 'Failed to check withdrawal eligibility. Please try again.';
      showStep('not-eligible');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: AMOUNT INPUT
  // ═══════════════════════════════════════════════════════════════════════════

  function handleAmountInput() {
    const val = parseFloat(amountInput.value);
    hideError(step1Error);

    if (val && val >= 1 && val <= maxWithdrawAmount) {
      continueBtn.disabled = false;
      updateFeePreview(val);
    } else {
      continueBtn.disabled = true;
      feePreview.style.display = 'none';

      if (val > maxWithdrawAmount) {
        showError(step1Error, `Maximum withdrawal amount is $${parseFloat(maxWithdrawAmount).toFixed(2)}`);
      }
    }
  }

  function updateFeePreview(amount) {
    const fee = parseFloat((amount * 0.03).toFixed(2));
    const net = parseFloat((amount - fee).toFixed(2));

    feeGross.textContent = `$${amount.toFixed(2)}`;
    feeAmount.textContent = `$${fee.toFixed(2)}`;
    feeNet.textContent = `$${net.toFixed(2)}`;
    feePreview.style.display = 'block';
  }

  function goToStep1() {
    showStep(1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: WITHDRAWAL METHOD
  // ═══════════════════════════════════════════════════════════════════════════

  function goToStep2() {
    const amount = parseFloat(amountInput.value);

    if (!amount || amount < 1) {
      showError(step1Error, 'Please enter a valid amount (minimum $1.00)');
      return;
    }

    if (amount > maxWithdrawAmount) {
      showError(step1Error, `Maximum withdrawal amount is $${parseFloat(maxWithdrawAmount).toFixed(2)}`);
      return;
    }

    // Update summary
    summaryAmount.textContent = `$${amount.toFixed(2)}`;
    const fee = parseFloat((amount * 0.03).toFixed(2));
    const net = parseFloat((amount - fee).toFixed(2));
    summaryNet.textContent = `$${net.toFixed(2)}`;

    showStep(2);

    // Auto-select first method
    if (!selectedMethod) {
      selectMethod('bank_transfer');
    }
  }

  function selectMethod(method) {
    selectedMethod = method;

    // Update tabs
    methodTabs.forEach(tab => {
      tab.classList.toggle('withdrawal-modal__method-tab--active', tab.dataset.method === method);
    });

    // Show/hide forms
    Object.entries(methodForms).forEach(([key, form]) => {
      if (form) form.style.display = key === method ? 'block' : 'none';
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBMIT WITHDRAWAL REQUEST
  // ═══════════════════════════════════════════════════════════════════════════

  async function submitWithdrawal() {
    if (isProcessing) return;

    // Validate method selection
    if (!selectedMethod) {
      showError(step2Error, 'Please select a withdrawal method');
      return;
    }

    // Validate method-specific inputs
    const inputs = methodInputs[selectedMethod];
    const details = {};
    for (const [key, input] of Object.entries(inputs)) {
      if (!input || !input.value.trim()) {
        showError(step2Error, `Please fill in all ${formatMethodName(selectedMethod)} fields`);
        input?.focus();
        return;
      }
      details[key] = input.value.trim();
    }

    // Additional validation
    if (selectedMethod === 'paypal' && details.paypal_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(details.paypal_email)) {
        showError(step2Error, 'Please enter a valid PayPal email address');
        return;
      }
    }

    if (selectedMethod === 'stripe' && details.stripe_account_id) {
      if (!details.stripe_account_id.startsWith('acct_')) {
        showError(step2Error, 'Stripe account ID must start with "acct_"');
        return;
      }
    }

    isProcessing = true;
    setSubmitLoading(true);
    hideError(step2Error);

    try {
      const amount = parseFloat(amountInput.value);
      const notes = notesInput?.value?.trim() || null;

      const response = await fetch(`${API_BASE}/api/payments/withdrawals/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          fundraiserId: String(currentFundraiserId),
          amount: amount,
          withdrawalMethod: selectedMethod,
          withdrawalDetails: details,
          notes: notes
        })
      });

      const data = await response.json();

      if (data.success) {
        // Success! Request is now pending admin approval
        const netAmount = data.withdrawal_request?.net_amount || (amount * 0.97).toFixed(2);
        successAmount.textContent = `$${parseFloat(netAmount).toFixed(2)}`;
        showStep(3);

        // Hide the withdraw button to prevent duplicate requests
        if (currentFundraiserId) {
          const btn = document.querySelector(`.withdraw-btn[data-fundraiser-id="${currentFundraiserId}"]`);
          if (btn) {
            btn.style.display = 'none';
          } else {
            const receiveBtn = document.querySelector(`.receive-btn[data-fundraiser-id="${currentFundraiserId}"]`);
            if (receiveBtn) receiveBtn.style.display = 'none';
          }
        }

        // Optionally reload after user sees success message
        setTimeout(() => {
          window.location.reload();
        }, 4000);

      } else {
        throw new Error(data.message || 'Failed to submit withdrawal request');
      }

    } catch (error) {
      console.error('Withdrawal submission error:', error);
      errorMessage.textContent = error.message || 'Failed to submit request. Please try again.';
      showStep(4);
    } finally {
      isProcessing = false;
      setSubmitLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function formatMethodName(method) {
    const names = {
      bank_transfer: 'Bank Transfer',
      paypal: 'PayPal',
      palpay: 'PalPay',
      stripe: 'Stripe'
    };
    return names[method] || method;
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
    if (typeof window.showNotification === 'function' && window.showNotification.length >= 2) {
      window.showNotification(message, type);
      return;
    }

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
