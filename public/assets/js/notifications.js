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

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (flashDiv.parentElement) {
      flashDiv.style.animation = 'slideUpFlashMessage 0.3s ease-out';
      setTimeout(() => flashDiv.remove(), 300);
    }
  }, 5000);
}

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
//_________________________________________________________________________________________________

// assets/js/notifications.js
document.addEventListener('DOMContentLoaded', function() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsWindow = document.getElementById('notificationsWindow');
    const notificationsCloseBtn = document.getElementById('notificationsCloseBtn');
    const notificationsList = document.getElementById('notificationsList');
    const notificationBadge = document.getElementById('notificationBadge');

    let notificationsData = [];
    // Truncation helpers
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function truncateTitle(title) {
        return truncateText(title, 25);
    }

    function truncateMessage(message) {
        return truncateText(message, 40);
    }

    function truncateSender(name) {
        return truncateText(name, 30);
    }
    // Toggle dropdown when button is clicked
    notificationBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isShowing = notificationsWindow.classList.contains('show');
        
        if (!isShowing) {
            loadNotifications();
        }
        
        notificationsWindow.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationBtn?.contains(e.target) && !notificationsWindow?.contains(e.target)) {
            notificationsWindow?.classList.remove('show');
        }
    });

    // Close dropdown when clicking close button
    notificationsCloseBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        notificationsWindow.classList.remove('show');
    });

    // Load notifications from API
    async function loadNotifications() {
        try {
            notificationsList.innerHTML = '<div class="no-notifications" style="text-align: center; padding: 20px; color: #767676;"><p>Loading...</p></div>';
            
            const response = await fetch('/api/notifications');
            const data = await response.json();
            
            if (data.success) {
                notificationsData = data.notifications;
                renderNotifications(notificationsData);
                updateBadge(data.unreadCount);
            } else {
                notificationsList.innerHTML = '<div class="no-notifications" style="text-align: center; padding: 20px; color: #767676;"><p>Failed to load notifications</p></div>';
            }
        } catch (err) {
            console.error('Error loading notifications:', err);
            notificationsList.innerHTML = '<div class="no-notifications" style="text-align: center; padding: 20px; color: #767676;"><p>Error loading notifications</p></div>';
        }
    }

        // Render notifications list (truncated)
    function renderNotifications(notifications) {
        if (!notifications || notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="no-notifications" style="text-align: center; padding: 30px; color: #767676;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-bell-slash" viewBox="0 0 16 16" style="margin-bottom: 10px; opacity: 0.5;">
                        <path d="M5.164 14H15c-.299-.199-.557-.553-.78-1-.72-1.189-1.24-2.78-1.24-4.114 0-2.597 1.834-4.907 4.256-5.05a.5.5 0 0 0 .47-.71l-.036-.081C16.36 1.846 14.373 0 12 0c-1.874 0-3.515.874-4.588 2.225-.67.89-1.076 1.948-1.076 3.087 0 .779-.123 1.528-.352 2.231-.203.614-.478 1.188-.81 1.708a.5.5 0 0 0 .416.822h-2.5a.5.5 0 0 0-.416.822c.332.52.607 1.094.81 1.708.229.703.352 1.452.352 2.231 0 1.139.406 2.197 1.076 3.087.234.312.497.599.786.857zM8 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-4.587-1.833c.25.112.527.174.815.174h7.544c.288 0 .565-.062.815-.174C11.99 12.916 12 12.458 12 12c0-2.42-1.72-4.44-4.005-4.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 2 12c0 .458.01.916.047 1.167z"/>
                    </svg>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        notificationsList.innerHTML = notifications.map(n => `
            <div class="notification ${n.isRead ? 'read' : 'unread'}" data-id="${n.id}" data-full-message="${escapeHtml(n.message).replace(/"/g, '&quot;')}" data-full-sender="${escapeHtml(n.sender.isAdmin ? 'Najdah Platform Admins' : n.sender.email).replace(/"/g, '&quot;')}" data-date="${n.createdAt}" data-type="${n.type || 'general'}">
                <div class="notification-title-and-sender-name">
                    <div class="notification-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell${n.isRead ? '' : '-fill'}" viewBox="0 0 16 16">
                            ${n.isRead 
                                ? '<path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/>'
                                : '<path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>'
                            }
                        </svg>
                        <h2 title="${escapeHtml(n.title)}">${truncateTitle(n.title)}</h2>
                    </div>
                    <div class="sender-name">
                        <h2 title="${escapeHtml(n.sender.isAdmin ? 'Najdah Platform Admins' : n.sender.email)}">${truncateSender(n.sender.isAdmin ? 'Najdah Platform Admins' : n.sender.email)}</h2>
                    </div>
                </div>
                <p class="notification-description" title="${escapeHtml(n.message)}" style="white-space: normal; word-wrap: break-word; line-height: 1.4;">${truncateMessage(n.message)}</p>
                <div class="go-and-delete-notification-box">
                    <span style="font-size: 11px; color: #999;">${formatDate(n.createdAt)}</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${!n.isRead ? `
                        <a class="notification-mark-read-btn" href="#" data-id="${n.id}" title="Mark as read" style="color: #4caf50; display: flex; align-items: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                            </svg>
                        </a>` : ''}
                        <a class="notification-delete-btn" href="#" data-id="${n.id}" title="Delete notification">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"></path>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach delete handlers
        document.querySelectorAll('.notification-delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });

        // Attach mark-as-read handlers
        document.querySelectorAll('.notification-mark-read-btn').forEach(btn => {
            btn.addEventListener('click', handleMarkAsRead);
        });

        // Attach click handlers for showing full details popup + marking as read
        document.querySelectorAll('.notification').forEach(notif => {
            notif.addEventListener('click', function(e) {
                if (!e.target.closest('.notification-delete-btn')) {
                    const id = this.dataset.id;
                    const fullTitle = decodeHtmlEntities(this.dataset.fullTitle);
                    const fullMessage = decodeHtmlEntities(this.dataset.fullMessage);
                    const fullSender = decodeHtmlEntities(this.dataset.fullSender);
                    const date = this.dataset.date;
                    const type = this.dataset.type;
                    showNotificationPopup({ id, fullTitle, fullMessage, fullSender, date, type });
                    if (this.classList.contains('unread')) {
                        markAsRead(id);
                    }
                }
            });
        });
    }

    // Show notification details popup
    function showNotificationPopup({ id, fullTitle, fullMessage, fullSender, date, type }) {
        // Remove existing popup if any
        const existingPopup = document.getElementById('notificationPopup');
        if (existingPopup) existingPopup.remove();

        const popup = document.createElement('div');
        popup.id = 'notificationPopup';
        popup.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 10001;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(3px);
        `;

        const typeLabels = {
            'donation_received': '💝 Donation',
            'donation_received_owner': '💰 New Donation',
            'withdrawal_requested': '⏳ Withdrawal Request',
            'withdrawal_transferred': '✅ Transfer Complete',
            'campaign_complete': '🎉 Campaign',
            'request_accepted': '✓ Request Accepted',
            'request_rejected': '✗ Request Rejected',
            'general': '📢 General'
        };

        popup.innerHTML = `
            <div style="
                background: #fff; border-radius: 12px; max-width: 450px; width: 90%;
                max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: popupFadeIn 0.2s ease-out;
            ">
                <div style="padding: 20px 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px; color: #14213d; font-weight: 600;">
                        ${typeLabels[type] || '📢 Notification'}
                    </h3>
                    <button id="closeNotificationPopup" style="
                        background: none; border: none; font-size: 22px; cursor: pointer;
                        color: #999; width: 32px; height: 32px; display: flex;
                        align-items: center; justify-content: center; border-radius: 6px;
                    " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">×</button>
                </div>
                <div style="padding: 24px;">
                    <div style="margin-bottom: 16px;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; letter-spacing: 0.5px;">Title</span>
                        <p style="margin: 4px 0 0 0; font-size: 15px; color: #14213d; font-weight: 500; line-height: 1.4;">${escapeHtml(fullTitle)}</p>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; letter-spacing: 0.5px;">From</span>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #ff9a17; font-weight: 500;">${escapeHtml(fullSender)}</p>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; letter-spacing: 0.5px;">Date</span>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #555;">${formatDate(date)}</p>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; letter-spacing: 0.5px;">Details</span>
                        <div style="
                            margin-top: 8px; padding: 14px; background: #f8f9fa;
                            border-radius: 8px; border-left: 3px solid #ff9a17;
                            font-size: 14px; color: #333; line-height: 1.6; 
                            white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;
                        ">${escapeHtml(fullMessage).replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
                <div style="padding: 16px 24px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="markReadPopupBtn" style="
                        padding: 8px 18px; border-radius: 6px; border: none;
                        background: #ff9a17; color: #fff; font-weight: 600;
                        font-size: 13px; cursor: pointer;
                    ">Mark as Read</button>
                    <button id="closePopupBtn" style="
                        padding: 8px 18px; border-radius: 6px; border: 1px solid #ddd;
                        background: #fff; color: #555; font-weight: 600;
                        font-size: 13px; cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        `;

        // Add animation styles if not present
        if (!document.getElementById('popupAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'popupAnimationStyles';
            style.textContent = `
                @keyframes popupFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(popup);

        // Close handlers
        document.getElementById('closeNotificationPopup').addEventListener('click', () => popup.remove());
        document.getElementById('closePopupBtn').addEventListener('click', () => popup.remove());
        document.getElementById('markReadPopupBtn').addEventListener('click', () => {
            markAsRead(id);
            popup.remove();
        });
        popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.remove();
        });
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                popup.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    // Handle delete notification
    async function handleDelete(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const notificationId = this.dataset.id;
        if (!await showFlashConfirm('Delete this notification?')) return;

        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove from DOM
                const notifEl = this.closest('.notification');
                notifEl.style.opacity = '0';
                setTimeout(() => {
                    notifEl.remove();
                    // Reload to update state
                    loadNotifications();
                }, 200);
            } else {
                showFlashMessage(data.error || 'Failed to delete', 'error');
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
            showFlashMessage('Error deleting notification');
        }
    }

    // Handle mark as read from list
    async function handleMarkAsRead(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const notificationId = this.dataset.id;
        const notifEl = this.closest('.notification');
        
        await markAsRead(notificationId);
        
        // Remove the mark-as-read button after marking
        this.remove();
        
        // Update visual state immediately
        if (notifEl) {
            notifEl.classList.remove('unread');
            notifEl.classList.add('read');
        }
    }

    // Mark notification as read
    async function markAsRead(notificationId) {
        try {
            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });
            
            // Update UI
            const notifEl = document.querySelector(`.notification[data-id="${notificationId}"]`);
            if (notifEl) {
                notifEl.classList.remove('unread');
                notifEl.classList.add('read');
            }
            
            // Refresh badge count
            const badgeResponse = await fetch('/api/notifications/unread-count');
            const badgeData = await badgeResponse.json();
            if (badgeData.success) {
                updateBadge(badgeData.count);
            }
            
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }

    // Update badge
    function updateBadge(count) {
        if (count > 0) {
            notificationBadge.textContent = count > 99 ? '99+' : count;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }

    // Initial badge load
    async function loadBadge() {
        try {
            const response = await fetch('/api/notifications/unread-count');
            const data = await response.json();
            if (data.success) {
                updateBadge(data.count);
            }
        } catch (err) {
            console.error('Error loading badge:', err);
        }
    }

    // Utility: Escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function decodeHtmlEntities(text) {
        if (!text) return '';
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    // Utility: Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    // Load badge on page load
    loadBadge();
    
    // Refresh badge every 30 seconds
    setInterval(loadBadge, 30000);
});