/**
 * Single Achievement Page - Consolidated Frontend Logic
 * Handles: likes, comments, sharing, scroll arrow, complaint form, i18n
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

  const icon = type === 'success' ? '\u2705' : type === 'warning' ? '\u26A0\uFE0F' : '\u274C';
  flashDiv.innerHTML = `
    <span style="font-size: 18px;">${icon}</span>
    <span style="flex: 1; font-size: 14px; font-weight: 500;">${message}</span>
    <button class="flash-close" style="
      background: none; border: none; font-size: 20px; cursor: pointer;
      color: inherit; opacity: 0.7; padding: 0; width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
    " onclick="this.parentElement.remove()">&times;</button>
  `;

  document.body.appendChild(flashDiv);

  setTimeout(() => {
    if (flashDiv.parentElement) {
      flashDiv.style.animation = 'slideUpFlashMessage 0.3s ease-out';
      setTimeout(() => flashDiv.remove(), 300);
    }
  }, 5000);
}

/* ── 2. Navigation & Dropdowns ───────────────────────────────────────────── */

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

/* ── 3. Image Fallbacks ──────────────────────────────────────────────────── */

function initImageFallbacks() {
  document.querySelectorAll('img[data-fallback-src]').forEach(img => {
    img.addEventListener('error', function() {
      this.src = this.dataset.fallbackSrc;
    });
  });
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

/* ── 5. Scroll Down Arrow ────────────────────────────────────────────────── */

function initScrollArrow() {
  const arrow = document.getElementById('scrollDownArrow');
  if (!arrow) return;

  arrow.addEventListener('click', function() {
    const achievementSection = document.getElementById('achievementDetailSection');
    if (achievementSection) {
      achievementSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Hide arrow when user scrolls down
  // window.addEventListener('scroll', function() {
  //   if (window.scrollY > 100) {
  //     arrow.style.opacity = '0';
  //     arrow.style.pointerEvents = 'none';
  //   } else {
  //     arrow.style.opacity = '1';
  //     arrow.style.pointerEvents = 'auto';
  //   }
  // });
}

/* ── 6. Like Button ──────────────────────────────────────────────────────── */

async function initLikeButton() {
  const likeBtn = document.getElementById('achievementLikeBtn');
  if (!likeBtn) return;

  const achievementId = likeBtn.dataset.achievementId;
  if (!achievementId) return;

  // Check initial like status
    // Check initial like status
  try {
    const res = await fetch(`/api/achievement/${achievementId}/like-status`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      // Handle both response formats
      const liked = data.liked !== undefined ? data.liked : data.isLiked;
      const count = data.likeCount !== undefined ? data.likeCount : data.likesCount;
      updateLikeButtonUI(likeBtn, liked, count);
    }
  } catch (e) {
    console.error('Like status check error:', e);
  }

  // Click handler
  likeBtn.addEventListener('click', async function() {
    try {
      const res = await fetch(`/api/achievement/${achievementId}/like`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (data.success) {
        updateLikeButtonUI(likeBtn, data.liked, data.likeCount);
        showFlashMessage(data.liked ? 'Liked!' : 'Unliked', 'success');
      } else {
        if (res.status === 401) {
          showFlashMessage('Please log in to like', 'warning');
        } else {
          showFlashMessage(data.message || 'Failed to update like', 'error');
        }
      }
    } catch (err) {
      console.error('Like toggle error:', err);
      showFlashMessage('Failed to update like', 'error');
    }
  });
}

function updateLikeButtonUI(btn, liked, likeCount) {
  const svg = btn.querySelector('svg');
  const countDisplay = document.getElementById('likeCountDisplay');

  if (liked) {
    btn.classList.add('liked');
    btn.style.background = '#e74c3c';
    btn.style.color = '#fff';
    btn.style.borderColor = '#e74c3c';
    if (svg) {
      svg.innerHTML = '<path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>';
    }
  } else {
    btn.classList.remove('liked');
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
    if (svg) {
      svg.innerHTML = '<path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"/>';
    }
  }

  if (countDisplay) countDisplay.textContent = likeCount;
}

/* ── 7. Share Button ─────────────────────────────────────────────────────── */

function initShareButton() {
  const shareBtn = document.getElementById('achievementShareBtn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', function() {
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        showFlashMessage('Link copied to clipboard!', 'success');
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showFlashMessage('Link copied to clipboard!', 'success');
      });
    }
  });
}

/* ── 8. Fundraiser Account Click ─────────────────────────────────────────── */

function initFundraiserAccountClick() {
  document.querySelectorAll('.fundraiser-account[data-user-id]').forEach(account => {
    account.addEventListener('click', () => {
      const userId = account.dataset.userId;
      if (userId) window.location.href = `/indigent-account/${userId}`;
    });
  });
}

/* ── 9. i18n ─────────────────────────────────────────────────────────────── */

function initI18n() {
  if (typeof i18next === 'undefined') {
    console.error('i18next not available');
    return;
  }

  const resources = {
    en: { translation: {
      dropdownHomeTgt: "Home",
      dropdownDashboardTgt: "Dashboard",
      dropdownFundraisersTgt: "Fundraisers",
      dropdownAchievementsTgt: "Achievements",
      dropdownCategoriesTgt: "Categories",
      dropdownContactTgt: "Contact Us",
      dropdownLanguageTgt: "Language",
      complaintTitleTgt: "Enter the problem you are facing",
      complaintLabelTgt: "Enter A Problem",
      complaintBtnTgt: "Send",
      achievementCommentTitleTgt: "Add a comment",
      achievementCommentDescriptionTgt: "Share your thoughts on this achievement.",
      achievementCommentBtnTgt: "Submit",
      achievementCommentSubTitleTgt: "Comments",
      loadMoreCommentsTgt: "Load More Comments"
    }},
    ar: { translation: {
      dropdownHomeTgt: "الرئيسية",
      dropdownDashboardTgt: "لوحة التحكم",
      dropdownFundraisersTgt: "حملات التبرع",
      dropdownAchievementsTgt: "الإنجازات",
      dropdownCategoriesTgt: "التصنيفات",
      dropdownContactTgt: "تواصل معنا",
      dropdownLanguageTgt: "اللغة",
      complaintTitleTgt: "أدخل المشكلة التي تواجهك",
      complaintLabelTgt: "أدخل المشكلة",
      complaintBtnTgt: "أرسل",
      achievementCommentTitleTgt: "أضف تعليقاً",
      achievementCommentDescriptionTgt: "شاركنا رأيك في هذا الإنجاز.",
      achievementCommentBtnTgt: "أرسل",
      achievementCommentSubTitleTgt: "التعليقات",
      loadMoreCommentsTgt: "تحميل المزيد من التعليقات"
    }}
  };

  i18next
    .use(window.i18nextHttpBackend)
    .use(window.i18nextBrowserLanguageDetector)
    .init({
      fallbackLng: 'en',
      debug: false,
      resources
    }, (err) => {
      if (!err) updateContent();
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
    });
  });
}

/* ── 10. Complaint Form ──────────────────────────────────────────────────── */

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

/* ── 11. Achievement Comments System ─────────────────────────────────────── */

class AchievementCommentsManager {
  constructor() {
    this.currentPage = 1;
    const el = document.getElementById('achievement-data');
    this.achievementId = el ? el.dataset.achievementId : null;
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
      const res = await fetch(`/api/achievement/${this.achievementId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievement_id: this.achievementId, comment_text: text })
      });
      const data = await res.json();
      if (data.success) {
        this.resetForm();
        if (data.is_blocked) showFlashMessage(data.message, 'warning');
        else {
          showFlashMessage('Comment added successfully!', 'success');
          await this.loadComments(1);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Comment submit error:', err);
      showFlashMessage('Error submitting comment. Please try again.', 'error');
    } finally {
      this.setLoadingState(btn, false);
    }
  }

  validateComment(text) {
    if (!text) { showFlashMessage('Please enter a comment', 'error'); return false; }
    if (text.length > 500) { showFlashMessage('Comment exceeds 500 character limit', 'error'); return false; }
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
      const res = await fetch(`/api/achievement/${this.achievementId}/comments?page=${page}&limit=10`);
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
      showFlashMessage('Error loading comments', 'error');
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
    if (!text) { showFlashMessage('Please enter a reply', 'error'); return; }

    try {
      const res = await fetch(`/api/achievement/${this.achievementId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievement_id: this.achievementId, comment_text: text, parent_comment_id: commentId })
      });
      const data = await res.json();
      if (data.success) {
        this.hideReplyForm(commentId);
        if (data.is_blocked) showFlashMessage(data.message, 'warning');
        else {
          showFlashMessage('Reply added successfully!', 'success');
          await this.loadComments(1);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Reply error:', err);
      showFlashMessage('Error submitting reply', 'error');
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
}

/* ── 12. Initialization ──────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  initImageFallbacks();
  initNavigation();
  initInputBoxes();
  initScrollArrow();
  initLikeButton();
  initShareButton();
  initFundraiserAccountClick();
  initLanguageSwitcher();
  initI18n();
  initComplaintForm();

  new AchievementCommentsManager();
});
