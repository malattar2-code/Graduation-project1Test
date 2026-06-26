/**
 * fundraiser-requester-form.js
 * Handles intl-tel-input initialization, Flatpickr, and dynamic form submission.
 * Relies on shared fundraiser-form.js for showFlashMessage().
 */
(function() {
  'use strict';

  const phoneInstances = {};

  function initIntlPhoneInputs() {
    if (typeof window.intlTelInput === 'undefined') {
      console.error('intlTelInput not loaded');
      return;
    }

    document.querySelectorAll('.intl-phone-input').forEach(input => {
      if (input.dataset.phoneInitialized) return;

      const iti = window.intlTelInput(input, {
        initialCountry: 'auto',
        geoIpLookup: function(callback) {
          fetch('https://ipapi.co/json')
            .then(resp => resp.json())
            .then(data => callback(data.country_code))
            .catch(() => callback('us'));
        },
        separateDialCode: true,
        nationalMode: true,
        autoPlaceholder: 'polite',
        utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js'
      });

      phoneInstances[input.id] = iti;
      input.dataset.phoneInitialized = 'true';

      input.addEventListener('input', () => {
        const wrapper = document.getElementById('wrapper_' + input.id);
        if (!wrapper) return;
        wrapper.classList.remove('valid-number', 'invalid-number');
        if (input.value.trim() === '') return;
        if (iti.isValidNumber()) wrapper.classList.add('valid-number');
        else wrapper.classList.add('invalid-number');
      });
    });
  }

  function getPhoneInternational(inputId) {
    const iti = phoneInstances[inputId];
    const input = document.getElementById(inputId);
    if (!iti || !input) return input?.value || '';

    try {
      if (window.intlTelInputUtils && iti.isValidNumber()) {
        return iti.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
      }
    } catch (e) {
      console.warn('intlTelInputUtils error:', e.message);
    }

    try {
      const cd = iti.getSelectedCountryData();
      const dialCode = cd.dialCode ? '+' + cd.dialCode : '';
      const raw = (input.value || '').replace(/\D/g, '');
      return raw ? (dialCode + ' ' + raw) : input.value;
    } catch (e) {
      return input.value || '';
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Flatpickr
    document.querySelectorAll('.flatpickr-date').forEach(input => {
      if (!input._flatpickr) {
        flatpickr(input, { dateFormat: "Y-m-d", altInput: true, altFormat: "F j, Y", allowInput: true });
      }
    });
    document.querySelectorAll('.flatpickr-time').forEach(input => {
      if (!input._flatpickr) {
        flatpickr(input, { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, allowInput: true });
      }
    });

    initIntlPhoneInputs();

    const form = document.getElementById('fundraiserRequesterForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitBtn = document.getElementById('submitRequestBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      // Pre-submit validation: reject any file > 20MB
      let oversize = false;
      form.querySelectorAll('.requester-file-input').forEach(input => {
        const file = input.files[0];
        const maxSize = parseInt(input.dataset.maxSize) || 20971520;
        const errBox = input.closest('.wrapper')?.querySelector('.validation-error');
        const errMsg = errBox?.querySelector('.error-message');
        if (file && file.size > maxSize) {
          oversize = true;
          if (errBox) { errBox.style.display = 'flex'; errMsg.textContent = 'File exceeds 20MB'; }
        }
      });
      if (oversize) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
        showFlashMessage('One or more files exceed the 20MB limit', 'error');
        return;
      }
      const formId = document.getElementById('formId')?.value;
      const fundraiserId = document.getElementById('fundraiserId')?.value;
      const responses = {};

      const inputs = form.querySelectorAll('[data-form-input]');
      inputs.forEach(input => {
        const fieldName = input.dataset.fieldName;
        const fieldType = input.dataset.fieldType;
        if (!fieldName) return;

        if (fieldType === 'file') {
          responses[fieldName] = input.files[0] ? input.files[0].name : '';
        } else if (fieldType === 'tel' || fieldType === 'phone') {
          responses[fieldName] = getPhoneInternational(input.id);
        } else {
          responses[fieldName] = input.value;
        }
      });

      try {
        const res = await fetch(`/fundraiser-requester-form/${fundraiserId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId, responses })
        });
        const data = await res.json();

        if (data.success) {
          showFlashMessage('Request submitted successfully!', 'success');
          window.location.reload();
        } else {
          showFlashMessage(data.error || 'Failed to submit', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Request';
        }
      } catch (err) {
        console.error('Submit error:', err);
        showFlashMessage('Error submitting request', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
      }
    });
    /* ── Requester file upload UI + 20MB validation ── */
    document.querySelectorAll('.requester-file-input').forEach(fileInput => {
      const wrapper = fileInput.closest('.wrapper');
      const imageBox = wrapper.querySelector('.image-box');
      const uploadInfo = wrapper.querySelector('.upload-info');
      const uploadSuccess = wrapper.querySelector('.upload-success-state');
      const uploadPlaceholder = wrapper.querySelector('.upload-placeholder');
      const errorBox = wrapper.querySelector('.validation-error');
      const errorMessage = errorBox?.querySelector('.error-message');
      const maxSize = parseInt(fileInput.dataset.maxSize) || 20971520; // 20MB

      // Click box to open file dialog
      imageBox.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', function() {
        const file = this.files[0];
        uploadInfo.style.display = 'none';
        uploadSuccess.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
        errorBox.style.display = 'none';

        if (!file) return;

        // 20MB size check
        if (file.size > maxSize) {
          errorBox.style.display = 'flex';
          errorMessage.textContent = 'File size exceeds 20MB limit';
          this.value = '';
          return;
        }

        // Show file info + fake progress
        uploadPlaceholder.style.display = 'none';
        uploadInfo.style.display = 'flex';

        const fileNameEl = uploadInfo.querySelector('.file-name');
        const fileTypeEl = uploadInfo.querySelector('.file-type');
        const fileSizeEl = uploadInfo.querySelector('.file-size');
        const progressFill = uploadInfo.querySelector('.progress-fill');
        const progressPercent = uploadInfo.querySelector('.progress-percent');

        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileTypeEl) fileTypeEl.textContent = file.type || 'Unknown';
        if (fileSizeEl) fileSizeEl.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';

        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progressFill) progressFill.style.width = progress + '%';
          if (progressPercent) progressPercent.textContent = progress + '%';
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              uploadInfo.style.display = 'none';
              uploadSuccess.style.display = 'flex';
              const sName = uploadSuccess.querySelector('.file-name');
              const sType = uploadSuccess.querySelector('.file-type');
              const sSize = uploadSuccess.querySelector('.file-size');
              if (sName) sName.textContent = file.name;
              if (sType) sType.textContent = file.type || 'Unknown';
              if (sSize) sSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
            }, 300);
          }
        }, 50);
      });
    });
  });
})();