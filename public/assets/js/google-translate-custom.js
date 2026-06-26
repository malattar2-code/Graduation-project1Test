/**
 * google-translate-custom.js
 * Translates visible page text while preserving i18next elements
 * and skipping h1.account-name.
 * 
 * FIXES:
 * 1. Added original text storage to enable reverting before re-translating
 * 2. Added bidirectional translation support (can switch back and forth)
 * 3. Added proper cleanup when switching languages
 * 4. Fixed race condition with isTranslating lock
 */
(function () {
  'use strict';

  let currentLang = 'en';
  window.currentLang = currentLang;   // <-- expose globally
  const cache = new Map();           // targetLang|original → translated
  const originalCache = new Map();   // element → original text (for reverting)
  let isTranslating = false;         // lock to prevent concurrent fetches

  // ------------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------------
  function hasI18nAttribute(node) {
    return node.closest && node.closest('[data-i18n]') !== null;
  }

  const EXCLUDED_CLASSES = [
    
    'account-name',
    'donation-money-number',
    'small-font',
    'user-name',
    'comment-content',
    'name-box',
    'birthday-box',
    'main-title',
    'title',
    'fundraiser-des',
    'fundraiser-desc',
    'name-and-points',
    'hashtagInput',
    'suggested-tags',
    'tagify'
  ];

  function isInsideExcludedClass(node) {
      let current = node;
      while (current && current !== document.body && current !== document.documentElement) {
          if (current.nodeType === Node.ELEMENT_NODE && current.classList) {
              for (const cls of EXCLUDED_CLASSES) {
                  if (current.classList.contains(cls)) {
                      return true;
                  }
              }
          }
          current = current.parentNode;
      }
      return false;
  }

  function isAlreadyTranslated(node) {
    const parent = node.parentNode;
    return parent && parent.hasAttribute && parent.hasAttribute('data-gtranslated');
  }

  // ------------------------------------------------------------------------
  // Collect text nodes
  // ------------------------------------------------------------------------
  function collectTextNodes(container) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      container || document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;

          const parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;

          if (['SCRIPT','STYLE','TEXTAREA','CODE','NOSCRIPT'].includes(parent.nodeName))
            return NodeFilter.FILTER_REJECT;

          if (hasI18nAttribute(parent)) return NodeFilter.FILTER_REJECT;
          if (isInsideExcludedClass(parent)) return NodeFilter.FILTER_REJECT;
          // Reject pure numbers / numeric values
          if (isNumericOnly(node.textContent)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    return textNodes;
  }

  // ------------------------------------------------------------------------
  // Store original text before first translation
  // ------------------------------------------------------------------------
  function storeOriginalText(textNodes) {
    textNodes.forEach(node => {
      const parent = node.parentNode;
      if (parent && parent.setAttribute && !parent.hasAttribute('data-original-text')) {
        parent.setAttribute('data-original-text', node.textContent);
      }
    });
  }

  // ------------------------------------------------------------------------
  // Revert all translated elements back to original
  // ------------------------------------------------------------------------
  function revertToOriginal() {
    document.querySelectorAll('[data-gtranslated]').forEach(el => {
      const original = el.getAttribute('data-original-text');
      if (original) {
        // Find the text node and restore it
        const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = original;
        }
        el.removeAttribute('data-gtranslated');
      }
    });
  }

  // ------------------------------------------------------------------------
  // Apply translations
  // ------------------------------------------------------------------------
  function applyCachedTranslations(textNodes, targetLang) {
    textNodes.forEach(node => {
      const parent = node.parentNode;
      if (!parent || !parent.getAttribute) return;
      const original = parent.getAttribute('data-original-text') || node.textContent.trim();
      const translated = cache.get(`${targetLang}|${original}`);
      if (translated && translated !== node.textContent) {
        node.textContent = translated;
        // Mark parent so we know it's translated
        if (parent.setAttribute) {
          parent.setAttribute('data-gtranslated', 'true');
        }
      }
    });
  }

  // ------------------------------------------------------------------------
  // Fetch translations
  // ------------------------------------------------------------------------
  async function translateTexts(textNodes, targetLang) {
    if (isTranslating) {
      console.log('Translation already in progress, skipping...');
      return;
    }
    isTranslating = true;

    try {
      // Store original texts on first run
      storeOriginalText(textNodes);

      // Get original texts (from data attribute if available)
      const textsToTranslate = textNodes.map(node => {
        return (node.parentNode && node.parentNode.getAttribute)
          ? (node.parentNode.getAttribute('data-original-text') || node.textContent.trim())
          : node.textContent.trim();
      });

      const uniqueTexts = [...new Set(textsToTranslate)];

      // Filter out texts already cached for this target language
      const needTranslation = uniqueTexts.filter(t => !cache.has(`${targetLang}|${t}`));

      if (needTranslation.length === 0) {
        applyCachedTranslations(textNodes, targetLang);
        return;
      }

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: needTranslation, from: 'auto', to: targetLang })
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn('Translation endpoint error:', response.status, text.slice(0, 200));
        throw new Error('Server responded with status ' + response.status);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      needTranslation.forEach((text, i) => {
        cache.set(`${targetLang}|${text}`, data.translations[i]);
      });

      applyCachedTranslations(textNodes, targetLang);
    } catch (err) {
      console.warn('Translation request failed:', err.message);
    } finally {
      isTranslating = false;
    }
  }

  // ------------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------------
  window.translatePage = async function (targetLang) {
    if (targetLang === currentLang) return;

    // If switching back to English (or original language), revert first
    if (targetLang === 'en') {
      revertToOriginal();
      currentLang = targetLang;
      return;
    }

    currentLang = targetLang;
    window.currentLang = currentLang;   // <-- keep global reference synced
    const textNodes = collectTextNodes();
    await translateTexts(textNodes, targetLang);
  };

  // ------------------------------------------------------------------------
  // Auto-detect browser language
  // ------------------------------------------------------------------------
  function autoDetect() {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang && browserLang !== currentLang && browserLang === 'ar') {
      window.translatePage(browserLang);
    }
  }

  // ------------------------------------------------------------------------
  // Bind to language buttons
  // ------------------------------------------------------------------------
  function bindButtons() {
    const enBtn = document.getElementById('en-btn');
    const arBtn = document.getElementById('ar-btn');
    if (enBtn) enBtn.addEventListener('click', () => window.translatePage('en'));
    if (arBtn) arBtn.addEventListener('click', () => window.translatePage('ar'));
  }

  // ------------------------------------------------------------------------
  // Initialise
  // ------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    bindButtons();
    // Small delay to let i18next finish its initial render
    setTimeout(autoDetect, 500);
  });
  // ═════════════════════════════════════════════════════════════════
  // Dynamic content translation (Flash messages, modals, etc.)
  // ═════════════════════════════════════════════════════════════════
  window.translateElement = async function (element) {
    if (!element || currentLang === 'en') return;

    const textNodes = collectTextNodes(element);
    if (textNodes.length === 0) return;

    storeOriginalText(textNodes);

    const textsToTranslate = textNodes
      .map(node => node.parentNode.getAttribute('data-original-text') || node.textContent.trim())
      .filter(text => !isNumericOnly(text)); // <-- ADD THIS

    const uniqueTexts = [...new Set(textsToTranslate)];
    const needTranslation = uniqueTexts.filter(t => !cache.has(`${currentLang}|${t}`));

    // Apply anything we already have in cache immediately
    applyCachedTranslations(textNodes, currentLang);

    // Fetch missing strings in background and re-apply if node still exists
    if (needTranslation.length > 0) {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: needTranslation, from: 'auto', to: currentLang })
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.error) return;

        needTranslation.forEach((text, i) => {
          cache.set(`${currentLang}|${text}`, data.translations[i]);
        });

        if (document.contains(element)) {
          applyCachedTranslations(collectTextNodes(element), currentLang);
        }
      } catch (err) {
        console.warn('Dynamic translation failed:', err.message);
      }
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // Universal dynamic translation (comments, modals, lists, etc.)
  // ═════════════════════════════════════════════════════════════════
  const dynamicObserver = new MutationObserver((mutations) => {
    if (currentLang === 'en') return;

    const roots = new Set();

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tag = node.nodeName;
        if (['SCRIPT','STYLE','TEXTAREA','CODE','NOSCRIPT','META','LINK','HEAD'].includes(tag)) return;

        // Skip elements managed by i18next
        if (node.hasAttribute && node.hasAttribute('data-i18n')) return;

        // Skip excluded classes (including the node itself)
        if (isInsideExcludedClass(node)) return;

        // Skip nodes that contain no visible text
        if (!node.textContent || !node.textContent.trim()) return;

        roots.add(node);
      });
    });

    if (roots.size === 0) return;

    // Debounce: let the DOM finish rendering before translating
    clearTimeout(window._dynamicTranslateDebounce);
    window._dynamicTranslateDebounce = setTimeout(() => {
      roots.forEach(root => {
        if (document.contains(root)) {
          window.translateElement(root);
        }
      });
    }, 80);
  });

  if (document.body) {
    dynamicObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      dynamicObserver.observe(document.body, { childList: true, subtree: true });
    });
  }
  function isNumericOnly(text) {
    // Matches: pure numbers, numbers with commas, decimals, percentages, currency
    // Examples: "1,234", "99.9%", "$50", "€100", "1.5K", "2nd", "3rd"
    return /^[\d\s\.,\-%$€£¥#@&+=/]+$/.test(text.trim());
  }
})();