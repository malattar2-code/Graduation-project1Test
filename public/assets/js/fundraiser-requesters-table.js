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

/**
 * fundraiser-requesters-table.js
 * Handles request acceptance, rejection, pagination, bulk actions, and campaign completion.
 * Relies on shared fundraiser-form.js for showFlashMessage().
 */
(function() {
  'use strict';

  const pageData = document.getElementById('page-data');
  const FORM_ID = pageData?.dataset.formId || '';
  const PENDING_COUNT = parseInt(pageData?.dataset.pendingCount || '0', 10);

  let currentRejectId = null;

  // ── Core Actions ──
  async function acceptRequest(requestId) {
    try {
      const res = await fetch('/fundraiser-request/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (data.success) window.location.reload();
      else showFlashMessage(data.error || 'Failed to accept', 'error');
    } catch (err) {
      showFlashMessage('Error accepting request', 'error');
    }
  }

  function showRejectModal(requestId) {
    currentRejectId = requestId;
    document.getElementById('rejectModal').style.display = 'block';
  }

  function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
    currentRejectId = null;
  }

  async function confirmReject() {
    const reason = document.getElementById('rejectReason').value;
    if (!reason.trim()) {
      showFlashMessage('Please enter a rejection reason', 'warning');
      return;
    }
    try {
      const res = await fetch('/fundraiser-request/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: currentRejectId, reason })
      });
      const data = await res.json();
      if (data.success) window.location.reload();
      else showFlashMessage(data.error || 'Failed to reject', 'error');
    } catch (err) {
      showFlashMessage('Error rejecting request', 'error');
    }
  }

  async function completeCampaign(formId) {
    if (!await showFlashConfirm('Are you sure you want to complete this campaign? This action cannot be undone.')) return;
    try {
      const res = await fetch('/fundraiser-request/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId })
      });
      const data = await res.json();
      if (data.success) {
        showFlashMessage('Campaign completed successfully!');
        window.location.href = '/userPanelIndigent';
      } else {
        showFlashMessage(data.error || 'Failed to complete campaign', 'error');
      }
    } catch (err) {
      showFlashMessage('Error completing campaign', 'error');
    }
  }

  // ── Accept All ──
  function initAcceptAll() {
    const btn = document.getElementById('acceptAllBtn');
    if (!btn) return;
    btn.addEventListener('click', async function() {
      if (!await showFlashConfirm('Are you sure you want to accept ALL pending requests?')) return;
      this.disabled = true;
      this.textContent = 'Accepting…';
      try {
        const res = await fetch('/fundraiser-request/accept-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId: FORM_ID })
        });
        const data = await res.json();
        if (data.success) {
          showFlashMessage(data.message);
          window.location.reload();
        } else {
          showFlashMessage(data.error || 'Failed to accept all', 'error');
          this.disabled = false;
          this.textContent = `Accept All Pending (${PENDING_COUNT})`;
        }
      } catch (err) {
        showFlashMessage('Error accepting all requests', 'error');
        this.disabled = false;
        this.textContent = `Accept All Pending (${PENDING_COUNT})`;
      }
    });
  }

  // ── Pagination ──
  function initPagination() {
    const rows = document.querySelectorAll('#table-body .table-row');
    if (!rows.length) return;
    const rowsPerPage = 10;
    let currentPage = 1;
    const totalPages = Math.ceil(rows.length / rowsPerPage);

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const indicator = document.getElementById('pageIndicator');
    const paginationContainer = document.getElementById('pagination');

    if (!paginationContainer) return;

    function showPage(page) {
      rows.forEach(r => r.style.display = 'none');
      const start = (page - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      for (let i = start; i < end && i < rows.length; i++) {
        rows[i].style.display = '';
      }
      if (prevBtn) prevBtn.disabled = page === 1;
      if (nextBtn) nextBtn.disabled = page === totalPages || totalPages === 0;
      if (indicator) indicator.textContent = `Page ${page} of ${totalPages}`;
    }

    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }

    showPage(currentPage);
    prevBtn?.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; showPage(currentPage); }
    });
    nextBtn?.addEventListener('click', () => {
      if (currentPage < totalPages) { currentPage++; showPage(currentPage); }
    });
  }

  // ── Message Modal ──
  const messageModal = document.getElementById('messageModal');
  const campaignMessageInput = document.getElementById('campaignMessage');
  const messageCharCount = document.getElementById('messageCharCount');

  function closeMessageModal() {
    if (messageModal) messageModal.style.display = 'none';
    if (campaignMessageInput) campaignMessageInput.value = '';
    if (messageCharCount) messageCharCount.textContent = '0';
  }

  function initMessageModal() {
    const showBtn = document.getElementById('showMessageFormBtn');
    const confirmBtn = document.getElementById('confirmCompleteBtn');

    campaignMessageInput?.addEventListener('input', function() {
      if (messageCharCount) messageCharCount.textContent = this.value.length;
    });

    showBtn?.addEventListener('click', function() {
      if (messageModal) {
        messageModal.style.display = 'block';
        campaignMessageInput?.focus();
      }
    });

    confirmBtn?.addEventListener('click', async function() {
      const message = campaignMessageInput?.value.trim();
      if (!message || message.length < 5) {
        showFlashMessage('Please enter a message of at least 5 characters', 'warning');
        return;
      }
      if (!await showFlashConfirm('Are you sure you want to complete this campaign? This action cannot be undone.')) return;

      this.disabled = true;
      this.textContent = 'Completing...';

      try {
        const res = await fetch('/fundraiser-request/complete-with-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId: FORM_ID, message })
        });
        const data = await res.json();
        if (data.success) {
          showFlashMessage(`Campaign completed! Notification sent to ${data.notifiedCount} applicant(s).`, 'success');
          window.location.href = '/userPanelIndigent';
        } else {
          showFlashMessage(data.error || 'Failed to complete campaign', 'error');
          this.disabled = false;
          this.textContent = 'Confirm & Complete';
        }
      } catch (err) {
        showFlashMessage('Error completing campaign', 'error');
        this.disabled = false;
        this.textContent = 'Confirm & Complete';
      }
    });
  }

  // ── Event Delegation ──
  function initTableActions() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    tableBody.addEventListener('click', function(e) {
      const acceptBtn = e.target.closest('.accept-btn');
      const rejectBtn = e.target.closest('.reject-btn');
      if (acceptBtn) {
        e.preventDefault();
        const id = acceptBtn.dataset.requestId;
        if (id) acceptRequest(id);
      }
      if (rejectBtn) {
        e.preventDefault();
        const id = rejectBtn.dataset.requestId;
        if (id) showRejectModal(id);
      }
    });
  }

  function initModalClosers() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', function() {
        const modalId = this.dataset.closeModal;
        if (modalId === 'rejectModal') closeRejectModal();
        if (modalId === 'messageModal') closeMessageModal();
      });
    });

    document.getElementById('confirmRejectBtn')?.addEventListener('click', confirmReject);

    window.addEventListener('click', function(e) {
      if (e.target === messageModal) closeMessageModal();
      const rejectModal = document.getElementById('rejectModal');
      if (e.target === rejectModal) closeRejectModal();
    });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', function() {
    initTableActions();
    initPagination();
    initAcceptAll();
    initMessageModal();
    initModalClosers();
  });
})();