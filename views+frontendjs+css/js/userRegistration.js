//____________________________________________________________________________________________________________________________

// public/js/userRegistration.js - FIXED VERSION
document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const unifiedForm = document.getElementById('unifiedRegisterForm');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const progress_bar_step_one = document.querySelector('.step-one');
  const progress_bar_step_two = document.querySelector('.step-two');
  const progress_bar_step_three = document.querySelector('.step-three');
  const formthree = document.querySelector('.form-three');
  const nextBtnOne = document.querySelector('.next-btn-one');
  const prevBtnOne = document.querySelector('.prev-btn-one');
  const getLocationBtn = document.getElementById('getLocationBtn');
  const locationDisplay = document.getElementById('locationDisplay');
  const imageInput = document.getElementById('image');
  const imageBox = document.querySelector('.image-box');
  const verificationWindow = document.getElementById("verificationWindow");
  const verifyBtn = document.querySelector('#verifyBtn');
  const errorMsg = document.getElementById("errorMsg");
  const successMsg = document.getElementById("successMsg");
  const inputs = document.querySelectorAll(".code-input");

  // State variables
  let userType = 'requester';
  let location = null;
  let iti = null; // Declare iti globally

  // Phone code elements
  const phoneInput = document.querySelector("#phoneNumber");
  const phoneCodeInput = document.querySelector("#phoneCode");
  const fullPhoneInput = document.querySelector("#fullPhoneNumber");
  const phoneError = document.querySelector("#phoneError");
  const phoneContainer = document.querySelector("#phoneContainer");

  // Initialize phone functionality
  function initializePhoneInput() {
    console.log('📞 Initializing phone input...');
    
    // Check if elements exist
    if (!phoneInput) {
      console.error('❌ phoneInput not found');
      return;
    }
    if (!phoneCodeInput) {
      console.error('❌ phoneCodeInput not found');
      return;
    }
    
    // Check if intlTelInput is available
    if (typeof window.intlTelInput === 'undefined') {
      console.error('❌ intlTelInput not loaded. Check script loading order.');
      return;
    }

    try {
      iti = window.intlTelInput(phoneInput, {
        initialCountry: "auto",
        geoIpLookup: function(callback) {
          fetch('https://ipapi.co/json')
            .then(res => res.json())
            .then(data => callback(data.country_code))
            .catch(() => callback('us'));
        },
        customPlaceholder: function(selectedCountryPlaceholder, selectedCountryData) {
          return "e.g. " + selectedCountryPlaceholder.replace(/\+[\d]+/, '').trim();
        },
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js", // Match version
        separateDialCode: true,
      });

      console.log('✅ intlTelInput initialized successfully');

      // Update country code when country changes
      phoneInput.addEventListener('countrychange', function() {
        const countryData = iti.getSelectedCountryData();
        phoneCodeInput.value = "+" + countryData.dialCode;
        updateFullPhoneNumber();
      });

      // Initialize with current values
      const initCountryData = iti.getSelectedCountryData();
      phoneCodeInput.value = "+" + initCountryData.dialCode;
      
      // Set up event listeners
      setupPhoneEventListeners();
      
    } catch (error) {
      console.error('❌ Error initializing intlTelInput:', error);
    }
  }

  // Set up phone event listeners
  function setupPhoneEventListeners() {
    if (!phoneInput || !iti) {
      console.log('⚠️ Cannot setup phone listeners - phoneInput or iti not available');
      return;
    }

    // Real-time validation on input
    phoneInput.addEventListener('input', function() {
      // Allow only numbers and common phone characters
      this.value = this.value.replace(/[^\d\-\s\(\)]/g, '');
      updateFullPhoneNumber();
      validatePhoneNumber();
    });

    // Validate on blur
    phoneInput.addEventListener('blur', function() {
      updateFullPhoneNumber();
      validatePhoneNumber();
    });

    // Prevent non-numeric input
    phoneInput.addEventListener('keydown', function(e) {
      // Allow: backspace, delete, tab, escape, enter, arrows
      if ([8, 9, 13, 27, 46].includes(e.keyCode) || 
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey === true) || 
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true) ||
          // Allow: home, end, left, right
          (e.keyCode >= 35 && e.keyCode <= 39)) {
        return;
      }
      
      // Ensure it's a number or allowed character
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
          (e.keyCode < 96 || e.keyCode > 105) &&
          !['-', '(', ')', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  // Function to update the full phone number
  function updateFullPhoneNumber() {
    if (!iti || !fullPhoneInput) return;
    
    const countryData = iti.getSelectedCountryData();
    const countryCode = '+' + countryData.dialCode;
    const phoneNumber = phoneInput.value.trim();
    
    // Store the complete number in the hidden field
    if (phoneNumber) {
      fullPhoneInput.value = countryCode + phoneNumber;
    } else {
      fullPhoneInput.value = '';
    }
  }

  // Phone number validation function
  function validatePhoneNumber(isSubmit = false) {
    if (!phoneInput || !iti) {
      console.log('⚠️ Cannot validate - phoneInput or iti not available');
      return false;
    }

    const phoneNumber = phoneInput.value.trim();
    const countryData = iti.getSelectedCountryData();
    
    // Reset styles and messages
    if (phoneContainer) phoneContainer.classList.remove('valid-number', 'invalid-number');
    if (phoneError) phoneError.style.display = 'none';

    // Check if empty
    if (!phoneNumber) {
      if (isSubmit) {
        if (phoneError) {
          phoneError.textContent = 'Phone number is required.';
          phoneError.style.display = 'block';
        }
        if (phoneContainer) phoneContainer.classList.add('invalid-number');
        showFieldError('phone', 'Phone number is required.');
      }
      return false;
    }

    // Validate phone number
    const isValid = iti.isValidNumber();
    const validationError = iti.getValidationError();

    if (isValid) {
      // Valid number
      if (phoneContainer) {
        phoneContainer.classList.add('valid-number');
        phoneContainer.classList.remove('invalid-number');
      }
      if (phoneError) phoneError.style.display = 'none';
      hideFieldError('phone');
      return true;
    } else {
      // Invalid number
      if (isSubmit) {
        if (phoneContainer) phoneContainer.classList.add('invalid-number');
        let errorMessage = 'Please enter a valid phone number.';
        
        // Specific error messages based on validation error
        switch(validationError) {
          case 1:
            errorMessage = 'Invalid country code.';
            break;
          case 2:
            errorMessage = 'Phone number is too short for ' + countryData.name + '.';
            break;
          case 3:
            errorMessage = 'Phone number is too long for ' + countryData.name + '.';
            break;
          case 4:
            errorMessage = 'Invalid phone number format for ' + countryData.name + '.';
            break;
          default:
            errorMessage = 'Please enter a valid phone number for ' + countryData.name + '.';
        }
        
        if (phoneError) {
          phoneError.textContent = errorMessage;
          phoneError.style.display = 'block';
        }
        showFieldError('phone', errorMessage);
      }
      return false;
    }
  }

  // Initialize phone input
  initializePhoneInput();

// Account type selection
  document.querySelector('#donor-btn')?.addEventListener('click', function () {
    userType = 'donor';
    this.classList.add('active');
    document.querySelector('#indigent-btn')?.classList.remove('active');
  });

  document.querySelector('#indigent-btn')?.addEventListener('click', function () {
    userType = 'requester';
    this.classList.add('active');
    document.querySelector('#donor-btn')?.classList.remove('active');
  });

  // Location handling
  getLocationBtn?.addEventListener('click', function () {
    if (navigator.geolocation) {
      // Show loading state
      getLocationBtn.textContent = 'Getting Location...';
      getLocationBtn.disabled = true;
      
      navigator.geolocation.getCurrentPosition((pos) => {
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        
        if (latInput && lngInput) {
          latInput.value = location.latitude;
          lngInput.value = location.longitude;
          
          console.log('📍 Hidden inputs set:', {
            latitude: latInput.value,
            longitude: lngInput.value
          });
        } else {
          console.error('❌ Location input elements not found');
        }
        
        locationDisplay.textContent = `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`;
        getLocationBtn.textContent = '✓';
        
        // Re-enable button after a delay
        // setTimeout(() => {
        //   getLocationBtn.disabled = false;
        //   getLocationBtn.textContent = 'Get Current Location';
        // }, 2000);
        
      }, (err) => {
        console.error('❌ Geolocation error:', err);
        showFieldError('location', 'Unable to get location: ' + err.message);
        getLocationBtn.textContent = 'Get Current Location';
        getLocationBtn.disabled = false;
      });
    } else {
      showFieldError('location', 'Geolocation not supported by your browser');
    }
  });

  // Image preview
  imageInput?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📸 Selected image:', file.name);
    showImagePreview(file);
  });

  // Form navigation
  nextBtnOne?.addEventListener('click', function (e) {
    e.preventDefault();
    if (validateFormOne()) {
      step1.style.display = 'none';
      step2.style.display = 'block';
      progress_bar_step_one.classList.add('step-one-active');
    }
  });

  prevBtnOne?.addEventListener('click', function (e) {
    e.preventDefault();
    step2.style.display = 'none';
    step1.style.display = 'block';
    progress_bar_step_one.classList.remove('step-one-active');
    progress_bar_step_two.classList.remove('step-two-active');
  });

  // Main form submission
  unifiedForm?.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    if (!validateFormTwo()) return;

    // Validate phone number on form submission
    if (!validatePhoneNumber(true)) {
      e.preventDefault();
      showErrorMessage('Please fix the phone number errors');
      return;
    }

    try {
      console.log('🔄 Starting registration...');

      // Add userType as hidden input
      const userTypeInput = document.createElement('input');
      userTypeInput.type = 'hidden';
      userTypeInput.name = 'userType';
      userTypeInput.value = userType;
      unifiedForm.appendChild(userTypeInput);

      // Update full phone number before submission
      updateFullPhoneNumber();

      // Create FormData from actual form
      const formData = new FormData(unifiedForm);
      
      console.log('📋 Form data prepared');
      console.log('📞 Phone data:', {
        phone_code: phoneCodeInput?.value,
        phone_number: phoneInput?.value,
        full_phone: fullPhoneInput?.value
      });
      
      // Show loading state
      showLoadingState(true);

      const response = await fetch('/user-auth/register', {
        method: 'POST',
        body: formData
      });

      const responseText = await response.text();
      console.log('📨 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Server returned invalid response');
      }

      // Handle ban response
      if (data.banned) {
        showBanMessage(data);
        showLoadingState(false);
        return;
      }

      // Handle warnings
      if (data.warnings) {
        showWarningMessage(data);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Registration failed (${response.status})`);
      }

      // Success
      unifiedForm.removeChild(userTypeInput);
      localStorage.setItem("userEmail", document.getElementById('email').value);
      progress_bar_step_two.classList.add('step-two-active');
      
      if (data.warnings) {
        console.log('⚠️ Registration success with warnings:', data.message);
      } else {
        console.log('✅ Registration success:', data.message);
        showSuccessMessage(data.message);
      }
      
      verificationWindow.style.display = "block";
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      showErrorMessage(err.message);
    
      // Clean up
      const tempInput = unifiedForm.querySelector('input[name="userType"]');
      if (tempInput) unifiedForm.removeChild(tempInput);
    } finally {
      showLoadingState(false);
    }
  });
  // Add these new helper functions:

  function showBanMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'registration-message banned';
    messageDiv.style.cssText = `
      padding: 10px;
      background: #fff3f3;
      border: 2px solid #ff4444;
      border-radius: 8px;
      margin: 20px 0;
      color: #d32f2f;
      text-align: center;
    `;
    
    let violationsHTML = '';
    if (data.violations && data.violations.length > 0) {
      violationsHTML = `
        <div style="margin-top: 15px; text-align: left;">
          <strong style="font-size: 13px;">Violations detected:</strong>
          <ul style="margin: 5px 0; padding-left: 10px;">
            ${data.violations.map(v => `<li style="font-size: 12px;">${v.message}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    messageDiv.innerHTML = `
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">
        🚫 Account Suspended
      </div>
      <div>${data.message}</div>
      ${violationsHTML}
      <div style="margin-top: 10px; font-size: 10px;">
        If you believe this is a mistake, please contact 
        <strong style="font-size: 11px;">${data.supportContact || 'njdanjda57@gmail.com'}</strong>
      </div>
    `;
    
    step2?.insertBefore(messageDiv, step2.firstChild);
    
    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth' });
  }

  function showWarningMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'registration-message warning';
    messageDiv.style.cssText = `
      padding: 15px;
      background: #fffbf0;
      border: 1px solid #ffc107;
      border-radius: 5px;
      margin: 15px 0;
      color: #856404;
    `;
    
    let warningsHTML = '';
    if (data.warningsList && data.warningsList.length > 0) {
      warningsHTML = `
        <div style="margin-top: 10px;">
          <strong>Content warnings:</strong>
          <ul style="margin: 5px 0; padding-left: 20px;">
            ${data.warningsList.map(w => `<li>${w.message}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    messageDiv.innerHTML = `
      <div>⚠️ ${data.message}</div>
      ${warningsHTML}
      <div style="margin-top: 10px; font-size: 12px;">
        Please ensure all content follows our community guidelines.
      </div>
    `;
    
    step2?.insertBefore(messageDiv, step2.firstChild);
  }
  // Email verification
  verifyBtn?.addEventListener("click", async () => {
    errorMsg.style.display = "none";
    successMsg.style.display = "none";

    const verifyCode = Array.from(inputs).map(i => i.value.trim()).join("");
    const email = localStorage.getItem("userEmail");

    if (!email) {
      showError("Email not found. Please register again.");
      return;
    }

    if (verifyCode.length !== 6) {
      showError("Please enter the 6-digit code.");
      return;
    }

    try {
      const response = await fetch("/user-auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verifyCode })
      });

      const data = await response.json();

      if (response.ok) {
        progress_bar_step_three.classList.add('step-three-active');
        showSuccess(data.message);
        setTimeout(() => {
          window.location.href = '/register'; // Redirect to login
        }, 2000);
      } else {
        showError(data.error || "Invalid verification code");
      }
    } catch (err) {
      showError(err.message);
    }
  });

  // Helper functions
  function showImagePreview(file) {
    if (!imageBox) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const existingPreview = imageBox.querySelector('.image-preview');
      if (existingPreview) existingPreview.remove();
      
      const preview = document.createElement('div');
      preview.className = 'image-preview';
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview" 
             style="max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 8px; margin-top: 10px;">
        <p style="margin: 5px 0; color: green; font-size: 12px;">✅ Ready for upload</p>
      `;
      imageBox.appendChild(preview);
    };
    reader.readAsDataURL(file);
  }

  function showLoadingState(show) {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
      if (show) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        submitBtn.style.opacity = '0.7';
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        submitBtn.style.opacity = '1';
      }
    }
  }

  function showSuccessMessage(message) {
    showMessage(message, 'success');
  }

  function showErrorMessage(message) {
    showMessage(message, 'error');
  }

  function showMessage(message, type) {
    // Remove existing messages
    const existingMsg = document.querySelector('.registration-message');
    if (existingMsg) existingMsg.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `registration-message ${type}`;
    messageDiv.style.cssText = type === 'success' 
      ? 'padding: 15px; background: #e8f5e8; border: 1px solid #4caf50; border-radius: 5px; margin: 15px 0; color: #2e7d32;'
      : 'padding: 15px; background: #ffebee; border: 1px solid #f44336; border-radius: 5px; margin: 15px 0; color: #c62828;';
    
    messageDiv.innerHTML = `type === 'success' ? ✅ ${message} : ❌ ${message}`;
    step2?.insertBefore(messageDiv, step2.firstChild);
    
    if (type === 'error') {
      setTimeout(() => messageDiv.remove(), 5000);
    }
  }

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
  }

  function showSuccess(message) {
    successMsg.textContent = message;
    successMsg.style.display = "block";
  }

  // Function to show field-specific error messages
  function showFieldError(fieldId, message) {
    console.log('🔄 Showing error for ${fieldId}: ${message}');
    
    // For Step 2 fields (individual validation errors)
    if (fieldId === 'email' || fieldId === 'password' || fieldId === 'confirmPassword') {
      const fieldElement = document.getElementById(fieldId);
      if (!fieldElement) return;
      
      const inputBox = fieldElement.closest('.input-box');
      let validationError = null;
      
      // Look for the next sibling that is a validation-error
      let nextSibling = inputBox.nextElementSibling;
      while (nextSibling) {
        if (nextSibling.classList.contains('validation-error')) {
          validationError = nextSibling;
          break;
        }
        nextSibling = nextSibling.nextElementSibling;
      }
      
      if (validationError) {
        // Update the error message
        const errorMessage = validationError.querySelector('.error-message');
        if (errorMessage) {
          errorMessage.textContent = message;
        }
        
        // Show the validation error
        validationError.style.display = 'flex';
        console.log('✅ Error displayed for ${fieldId}');
        
        // Add error styling to input field
        fieldElement.classList.add('error-field');
      }
      return;
    }
    
    // For Step 1 fields (grouped validation errors)
    const validationErrors = document.querySelectorAll('.validation-error');
    let targetError = null;
    
    // Find the correct validation error based on the field group
    validationErrors.forEach(error => {
      const previousElement = error.previousElementSibling;
      
      if (fieldId === 'name') {
        // For name fields group (first name + last name)
        if (previousElement && previousElement.classList.contains('full-name')) {
          targetError = error;
        }
      } 
      else if (fieldId === 'birthday-gender') {
        // For birthday/gender fields group
        if (previousElement && previousElement.classList.contains('birthday-and-gender')) {
          targetError = error;
        }
      }
      else if (fieldId === 'phone') {
        // For phone fields group
        if (previousElement && previousElement.classList.contains('whatsapp')) {
          targetError = error;
        }
      }
      else if (fieldId === 'location') {
        // For location - find the location container
        const locationContainer = document.querySelector('.location-container');
        if (locationContainer) {
          // Create or find location error
          let locationError = document.querySelector('.location-validation-error');
          if (!locationError) {
            locationError = document.createElement('div');
            locationError.className = 'validation-error location-validation-error';
            locationError.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
              </svg>
              <p class="error-message">${message}</p>
            `;
            document.querySelector('.location')?.appendChild(locationError);
          }
          locationError.style.display = 'flex';
          locationError.querySelector('.error-message').textContent = message;
          return;
        }
      }
    });
    
    if (targetError) {
      // Update the error message
      const errorMessage = targetError.querySelector('.error-message');
      if (errorMessage) {
        errorMessage.textContent = message;
      }
      
      // Show the validation error
      targetError.style.display = 'flex';
      console.log('✅ Error displayed for ${fieldId}');
      
      // Add error styling to relevant input fields
      addErrorStyling(fieldId);
    } else {
      console.log('❌ Could not find error container for ${fieldId}');
    }
  }

  // Function to add error styling to input fields in a group
  function addErrorStyling(fieldGroup) {
    if (fieldGroup === 'name') {
      document.getElementById('firstName')?.classList.add('error-field');
      document.getElementById('lastName')?.classList.add('error-field');
    } else if (fieldGroup === 'birthday-gender') {
      document.getElementById('birthDate')?.classList.add('error-field');
      document.getElementById('gender')?.classList.add('error-field');
    } else if (fieldGroup === 'phone') {
      document.getElementById('phoneNumber')?.classList.add('error-field');
      document.getElementById('phoneCode')?.classList.add('error-field');
    }
  }

  // Function to remove error styling from input fields
  function removeErrorStyling(fieldId) {
    if (fieldId === 'email' || fieldId === 'password' || fieldId === 'confirmPassword') {
      document.getElementById(fieldId)?.classList.remove('error-field');
      
      // Hide the validation error
      const fieldElement = document.getElementById(fieldId);
      if (!fieldElement) return;
      
      const inputBox = fieldElement.closest('.input-box');
      let validationError = null;
      
      // Look for the next sibling that is a validation-error
      let nextSibling = inputBox.nextElementSibling;
      while (nextSibling) {
        if (nextSibling.classList.contains('validation-error')) {
          validationError = nextSibling;
          break;
        }
        nextSibling = nextSibling.nextElementSibling;
      }
      
      if (validationError) {
        validationError.style.display = 'none';
      }
      return;
    }
    
    // For Step 1 grouped fields
    if (fieldId === 'name') {
      document.getElementById('firstName')?.classList.remove('error-field');
      document.getElementById('lastName')?.classList.remove('error-field');
    } else if (fieldId === 'birthday-gender') {
      document.getElementById('birthDate')?.classList.remove('error-field');
      document.getElementById('gender')?.classList.remove('error-field');
    } else if (fieldId === 'phone') {
      document.getElementById('phoneNumber')?.classList.remove('error-field');
      document.getElementById('phoneCode')?.classList.remove('error-field');
    } else if (fieldId === 'location') {
      const locationError = document.querySelector('.location-validation-error');
      if (locationError) {
        locationError.style.display = 'none';
      }
    }
  }

  // Function to hide field-specific error messages
  function hideFieldError(fieldId) {
    console.log(`🔄 Hiding error for ${fieldId}`);
    
    // For Step 2 individual fields
    if (fieldId === 'email' || fieldId === 'password' || fieldId === 'confirmPassword') {
      removeErrorStyling(fieldId);
      return;
    }
    
    // For Step 1 grouped fields
    const validationErrors = document.querySelectorAll('.validation-error');
    
    validationErrors.forEach(error => {
      const previousElement = error.previousElementSibling;
      
      if (fieldId === 'name') {
        if (previousElement && previousElement.classList.contains('full-name')) {
          error.style.display = 'none';
        }
      } 
      else if (fieldId === 'birthday-gender') {
        if (previousElement && previousElement.classList.contains('birthday-and-gender')) {
          error.style.display = 'none';
        }
      }
      else if (fieldId === 'phone') {
        if (previousElement && previousElement.classList.contains('whatsapp')) {
          error.style.display = 'none';
        }
      }
    });
    
    // Remove error styling
    removeErrorStyling(fieldId);
  }

  // Validation functions - UPDATED with Step 2 individual field validation
// Add form validation for phone in Step 1
  function validateFormOne() {
    let valid = true;
    
    // Clear all previous errors first
    document.querySelectorAll('.validation-error').forEach(error => {
      error.style.display = 'none';
    });
    document.querySelectorAll('.error-field').forEach(field => {
      field.classList.remove('error-field');
    });
    
    // Validate Name Group (First Name + Last Name)
    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    let nameErrors = [];
    
    if (!firstName) nameErrors.push('first name');
    if (!lastName) nameErrors.push('last name');
    
    if (nameErrors.length > 0) {
      const errorMessage = nameErrors.length === 2 
        ? 'First name and last name are required'
        : `${nameErrors.join(' and ')} is required`;
      showFieldError('name', errorMessage);
      valid = false;
    }
    
    // Validate Birthday & Gender Group
    const birthDate = document.getElementById('birthDate')?.value;
    const gender = document.getElementById('gender')?.value;
    let birthdayGenderErrors = [];
    
    if (!birthDate) birthdayGenderErrors.push('birth date');
    if (!gender) birthdayGenderErrors.push('gender');
    
    if (birthdayGenderErrors.length > 0) {
      const errorMessage = birthdayGenderErrors.length === 2
        ? 'Birth date and gender are required'
        : `${birthdayGenderErrors.join(' and ')} is required`;
      showFieldError('birthday-gender', errorMessage);
      valid = false;
    }
    
    // Validate Phone Group - Use our phone validation function
    const phoneValid = validatePhoneNumber(true);
    if (!phoneValid) {
      showFieldError('phone', 'Please enter a valid phone number');
      valid = false;
    }
    
    // Validate location
    if (!location) {
      showFieldError('location', 'Please get your current location');
      valid = false;
    }
    
    if (!valid) {
      showErrorMessage('Please fix the errors in Step 1');
    } else {
      console.log('✅ Step 1 validation passed');
      // Hide all errors if validation passed
      hideFieldError('name');
      hideFieldError('birthday-gender');
      hideFieldError('phone');
      hideFieldError('location');
    }
    
    return valid;
  }

  function validateFormTwo() {
    let valid = true;
    
    // Clear all previous errors first in Step 2
    document.querySelectorAll('#step2 .validation-error').forEach(error => {
      error.style.display = 'none';
    });
    document.querySelectorAll('#step2 .error-field').forEach(field => {
      field.classList.remove('error-field');
    });
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    // Validate Email
    if (!email) {
      showFieldError('email', 'Email is required');
      valid = false;
    } else if (!validateEmail(email)) {
      showFieldError('email', 'Please enter a valid email address');
      valid = false;
    }
    
    // Validate Password
    if (!password) {
      showFieldError('password', 'Password is required');
      valid = false;
    } else if (password.length < 6) {
      showFieldError('password', 'Password must be at least 6 characters');
      valid = false;
    }
    
    // Validate Confirm Password
    if (!confirmPassword) {
      showFieldError('confirmPassword', 'Please confirm your password');
      valid = false;
    } else if (password !== confirmPassword) {
      showFieldError('confirmPassword', 'Passwords do not match');
      valid = false;
    }
    
    if (!valid) {
      showErrorMessage('Please fix the errors in Step 2');
    } else {
      console.log('✅ Step 2 validation passed');
      // Hide all errors if validation passed
      hideFieldError('email');
      hideFieldError('password');
      hideFieldError('confirmPassword');
    }
    
    return valid;
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Auto-focus for verification code inputs
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
  });

  // Clear errors when user starts typing in fields
  const allInputs = document.querySelectorAll('input, select');
  allInputs.forEach(input => {
    input.addEventListener('input', () => {
      // When user starts typing in a field, clear the error
      if (input.id === 'firstName' || input.id === 'lastName') {
        hideFieldError('name');
      } else if (input.id === 'birthDate' || input.id === 'gender') {
        hideFieldError('birthday-gender');
      } else if (input.id === 'phoneNumber') {
        hideFieldError('phone');
      } else if (input.id === 'email' || input.id === 'password' || input.id === 'confirmPassword') {
        hideFieldError(input.id);
      }
    });
  });

  // Add CSS for error fields
  const style = document.createElement('style');
  style.textContent = `
    .error-field {
      border-color: #e74c3c !important;
      border-width: 2px !important;
    }
    .validation-error {
      display: none;
      align-items: center;
      gap: 8px;
      color: #e74c3c;
      margin-top: 5px;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  console.log('✅ User registration script loaded successfully');
});

//_________________________________________________________________________________________________________
// Add this to your frontend JavaScript - UPDATED VERSION
document.addEventListener('DOMContentLoaded', function() {
    const showEmailWindowBtn = document.getElementById('showEmailWindowBtn');
    const emailWindow = document.getElementById('emailWindow');
    const verificationWindow = document.getElementById('verificationWindowForForgetPassword');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const verifyBtnForForgetPassword = document.getElementById('verifyBtnForForgetPassword');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    const forgetPasswordMessage = document.getElementById('forgetPasswordMessage');
    const codeInputs = document.querySelectorAll('.verification-container .code-input');
    
    let currentEmail = '';

    // Toggle email window
    showEmailWindowBtn.addEventListener('click', function(e) {
        e.preventDefault();
        emailWindow.classList.toggle('show');
        verificationWindow.classList.remove('show');
        
        // Reset form when showing
        if (emailWindow.classList.contains('show')) {
            forgotPasswordForm.reset();
            forgetPasswordMessage.style.display = 'none';
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!showEmailWindowBtn.contains(e.target) && 
            !emailWindow.contains(e.target) && 
            !verificationWindow.contains(e.target)) {
            emailWindow.classList.remove('show');
            verificationWindow.classList.remove('show');
        }
    });

    // Send verification code - FORM SUBMISSION
    forgotPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('forgetPasswordEmail').value.trim();
        
        if (!email) {
            showMessage('Please enter your email', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        await sendVerificationCode(email);
    });

    // Resend code functionality
    resendCodeBtn?.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!currentEmail) {
            showVerificationError('No email found. Please start the process again.');
            return;
        }

        await sendVerificationCode(currentEmail, true);
    });

    async function sendVerificationCode(email, isResend = false) {
        const submitBtn = document.getElementById('forgetPasswordEmailBtn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const response = await fetch('/user-auth/send-password-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                currentEmail = email;
                showMessage(
                    isResend ? 'Verification code resent to your email' : 'Verification code sent to your email', 
                    'success'
                );
                
                // Switch to verification window after 2 seconds
                setTimeout(() => {
                    emailWindow.classList.remove('show');
                    verificationWindow.classList.add('show');
                    resetCodeInputs();
                    codeInputs[0].focus();
                }, 2000);
            } else {
                showMessage(data.error || 'Failed to send verification code', 'error');
            }

        } catch (error) {
            console.error('Error sending verification code:', error);
            showMessage('Network error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send';
        }
    }

    // Auto-focus and input handling for verification code
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
            
            // Update styling
            if (e.target.value) {
                e.target.classList.add('filled');
            } else {
                e.target.classList.remove('filled');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });

    // Verify code and reset password - UPDATED WITH CODE VERIFICATION
    verifyBtnForForgetPassword.addEventListener('click', async function() {
        const code = Array.from(codeInputs).map(input => input.value).join('');
        
        if (code.length !== 6) {
            showVerificationError('Please enter the 6-digit code');
            return;
        }

        // First verify the code before showing password reset
        try {
            verifyBtnForForgetPassword.disabled = true;
            verifyBtnForForgetPassword.textContent = 'Verifying...';

            const response = await fetch('/user-auth/verify-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: currentEmail,
                    code: code
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Code is valid, show password reset modal
                showPasswordResetModal(code);
                hideVerificationError();
            } else {
                showVerificationError(data.error || 'Invalid verification code');
            }

        } catch (error) {
            console.error('Error verifying code:', error);
            showVerificationError('Network error. Please try again.');
        } finally {
            verifyBtnForForgetPassword.disabled = false;
            verifyBtnForForgetPassword.textContent = 'Verify';
        }
    });

    function showPasswordResetModal(code) {
      console.log('🎯 Showing password reset modal with code:', code);
      
      // Create modal for new password input
      const modalHTML = `
          <div class="password-reset-modal" style="
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.5);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
          ">
              <div style="
                  background: white;
                  padding: 30px;
                  border-radius: 12px;
                  width: 90%;
                  max-width: 400px;
                  text-align: center;
              ">
                  <h3 style="margin-bottom: 20px; color: #14213d;">Set New Password</h3>
                  <form id="passwordResetForm">
                      <div class="input-box" style="margin-bottom: 20px;">
                          <label style="display: block; text-align: left; margin-bottom: 5px; color: #495057;">New Password</label>
                          <input type="password" id="newPassword" name="newPassword" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px;" 
                                placeholder="Enter new password (min. 6 characters)" required>
                      </div>
                      <div class="input-box" style="margin-bottom: 25px;">
                          <label style="display: block; text-align: left; margin-bottom: 5px; color: #495057;">Confirm Password</label>
                          <input type="password" id="confirmNewPassword" name="confirmNewPassword" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px;" 
                                placeholder="Confirm your new password" required>
                      </div>
                      <div style="display: flex; gap: 10px;">
                          <button type="button" id="cancelReset" class="btn-website" style="flex: 1; background: #6c757d;">Cancel</button>
                          <button type="submit" id="confirmReset" class="btn-website" style="flex: 1;">Reset Password</button>
                      </div>
                  </form>
                  <div id="resetPasswordMessage" style="margin-top: 15px; display: none;"></div>
              </div>
          </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      const modal = document.querySelector('.password-reset-modal');
      const passwordResetForm = document.getElementById('passwordResetForm');
      const confirmBtn = document.getElementById('confirmReset');
      const cancelBtn = document.getElementById('cancelReset');
      const newPasswordInput = document.getElementById('newPassword');
      const confirmPasswordInput = document.getElementById('confirmNewPassword');
      const messageDiv = document.getElementById('resetPasswordMessage');

      console.log('✅ Modal elements created:', {
          modal: !!modal,
          form: !!passwordResetForm,
          confirmBtn: !!confirmBtn,
          cancelBtn: !!cancelBtn,
          newPasswordInput: !!newPasswordInput,
          confirmPasswordInput: !!confirmPasswordInput
      });

      cancelBtn.addEventListener('click', () => {
          console.log('❌ Password reset cancelled');
          modal.remove();
      });

      passwordResetForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          console.log('📤 Password reset form submitted');
          
          // Get values AFTER form submission to ensure we have the latest
          const newPassword = newPasswordInput.value;
          const confirmNewPassword = confirmPasswordInput.value;

          console.log('🔍 Password values:', {
              newPassword: newPassword ? '***' : 'empty',
              confirmNewPassword: confirmNewPassword ? '***' : 'empty',
              newPasswordLength: newPassword.length,
              confirmNewPasswordLength: confirmNewPassword.length
          });

          // Enhanced validation with better debugging
          if (!newPassword || !confirmNewPassword) {
              console.log('❌ Validation failed: Empty fields');
              console.log('   - newPassword empty:', !newPassword);
              console.log('   - confirmNewPassword empty:', !confirmNewPassword);
              showResetMessage('Please fill in all fields', 'error');
              return;
          }

          if (newPassword.length < 6) {
              console.log('❌ Validation failed: Password too short');
              showResetMessage('Password must be at least 6 characters', 'error');
              return;
          }

          if (newPassword !== confirmNewPassword) {
              console.log('❌ Validation failed: Passwords do not match');
              console.log('   - newPassword:', newPassword);
              console.log('   - confirmNewPassword:', confirmNewPassword);
              showResetMessage('Passwords do not match', 'error');
              return;
          }

          console.log('✅ All validation passed, proceeding with password reset');

          try {
              confirmBtn.disabled = true;
              confirmBtn.textContent = 'Resetting...';

              console.log('🔄 Sending password reset request to server...', {
                  email: currentEmail,
                  codeLength: code.length,
                  newPasswordLength: newPassword.length
              });

              const response = await fetch('/user-auth/verify-reset-password', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      email: currentEmail,
                      code: code,
                      newPassword: newPassword
                  })
              });

              console.log('📥 Server response status:', response.status);
              
              const data = await response.json();
              console.log('📊 Server response data:', data);

              if (response.ok) {
                  console.log('✅ Password reset successful');
                  showResetMessage('Password reset successfully! Redirecting to login...', 'success');
                  
                  setTimeout(() => {
                      modal.remove();
                      verificationWindow.classList.remove('show');
                      // Redirect to login page
                      window.location.href = '/login';
                  }, 2000);
              } else {
                  console.log('❌ Password reset failed:', data.error);
                  showResetMessage(data.error || 'Failed to reset password', 'error');
                  confirmBtn.disabled = false;
                  confirmBtn.textContent = 'Reset Password';
              }

          } catch (error) {
              console.error('🚨 Network error during password reset:', error);
              showResetMessage('Network error. Please try again.', 'error');
              confirmBtn.disabled = false;
              confirmBtn.textContent = 'Reset Password';
          }
      });

      function showResetMessage(message, type) {
          console.log('💬 Showing reset message:', { message, type });
          messageDiv.textContent = message;
          messageDiv.style.display = 'block';
          messageDiv.style.color = type === 'success' ? '#38a169' : '#e53e3e';
          messageDiv.style.padding = '10px';
          messageDiv.style.borderRadius = '5px';
          messageDiv.style.backgroundColor = type === 'success' ? '#f0fff4' : '#fff5f5';
      }

      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
          if (e.target === modal) {
              console.log('❌ Modal closed by clicking outside');
              modal.remove();
          }
      });

      // Focus on first input and add input listeners for debugging
      newPasswordInput.focus();
      
      // Add input listeners to see what's being typed
      newPasswordInput.addEventListener('input', (e) => {
          console.log('📝 New password input:', e.target.value ? '***' : 'empty');
      });
      
      confirmPasswordInput.addEventListener('input', (e) => {
          console.log('📝 Confirm password input:', e.target.value ? '***' : 'empty');
      });
    }

    function showMessage(message, type) {
        forgetPasswordMessage.textContent = message;
        forgetPasswordMessage.style.display = 'block';
        forgetPasswordMessage.style.color = type === 'success' ? '#38a169' : '#e53e3e';
        forgetPasswordMessage.style.backgroundColor = type === 'success' ? '#f0fff4' : '#fff5f5';
        forgetPasswordMessage.style.padding = '10px';
        forgetPasswordMessage.style.borderRadius = '5px';
        forgetPasswordMessage.style.border = `1px solid ${type === 'success' ? '#38a169' : '#e53e3e'}`;
    }

    function showVerificationError(message) {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        
        // Hide success message if shown
        document.getElementById('successMsg').style.display = 'none';
    }

    function hideVerificationError() {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.style.display = 'none';
    }

    function resetCodeInputs() {
        codeInputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled');
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});