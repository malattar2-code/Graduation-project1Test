// Corrected registration frontend code for unified form
document.addEventListener('DOMContentLoaded', function () {
  // عناصر DOM - UPDATED for unified form
  const unifiedForm = document.getElementById('unifiedRegisterForm');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const formthree = document.querySelector('.form-three');
  const nextBtnOne = document.querySelector('.next-btn-one');
  const prevBtnOne = document.querySelector('.prev-btn-one');
  const submitBtn = document.querySelector('.submit-btn');
  const donorBtn = document.querySelector('#donor-btn');
  const indigentBtn = document.querySelector('#indigent-btn');
  const getLocationBtn = document.getElementById('getLocationBtn');
  const locationDisplay = document.getElementById('locationDisplay');
  
  // Image upload elements
  const imageInput = document.getElementById('image');
  const imageBox = document.querySelector('.image-box');
  
  // Verification elements
  const verificationWindow = document.getElementById("verificationWindow");
  const verifyBtn = document.querySelector('#verifyBtn');
  const errorMsg = document.getElementById("errorMsg");
  const successMsg = document.getElementById("successMsg");
  const inputs = document.querySelectorAll(".code-input");

  let userType = 'requester';
  let location = null;
  let registeredEmail = null;

  // اختيار نوع الحساب
  donorBtn.addEventListener('click', function () {
    userType = 'donor';
    donorBtn.classList.add('active');
    indigentBtn.classList.remove('active');
  });

  indigentBtn.addEventListener('click', function () {
    userType = 'requester';
    indigentBtn.classList.add('active');
    donorBtn.classList.remove('active');
  });

  // الحصول على الموقع
  getLocationBtn.addEventListener('click', function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        locationDisplay.textContent = `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`;
        
        // Update hidden fields in the actual form
        document.getElementById('latitude').value = location.latitude;
        document.getElementById('longitude').value = location.longitude;
      }, (err) => {
        alert('Unable to get location');
      });
    } else {
      alert('Geolocation not supported');
    }
  });

  // IMAGE PREVIEW
  if (imageInput) {
    imageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      console.log('📸 User selected image:', file.name);
      
      // Show image preview
      showImagePreview(file);
    });
  }
// ✅ FIXED: Use the actual form submission with better error handling
unifiedForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  
  if (!validateFormTwo()) {
    return; // Stop if validation fails
  }

  try {
    console.log('🔄 Starting form submission...');

    // Add userType to the form dynamically
    const userTypeInput = document.createElement('input');
    userTypeInput.type = 'hidden';
    userTypeInput.name = 'userType';
    userTypeInput.value = userType;
    unifiedForm.appendChild(userTypeInput);

    // Create FormData from the ACTUAL FORM
    const formData = new FormData(unifiedForm);
    
    console.log('📋 FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (key === 'image') {
        console.log(`  ${key}:`, value.name, value.size, value.type);
      } else {
        console.log(`  ${key}:`, value);
      }
    }

    // Send the actual form data with better error handling
    const response = await fetch('/auth/register', {
      method: 'POST',
      body: formData
    });

    // ✅ FIXED: Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, get the text and see what's wrong
      const text = await response.text();
      console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Registration failed: ${response.status}`);
    }
    
    // Remove the temporary input
    unifiedForm.removeChild(userTypeInput);
    
    localStorage.setItem("userEmail", document.getElementById('email').value);
    console.log('✅ Registration successful:', data.message);
    
    showRegistrationSuccess(data.message);
    verificationWindow.style.display = "block";
    
  } catch (err) {
    console.error('❌ Registration error:', err);
    
    // Remove the temporary input if it exists
    const tempInput = unifiedForm.querySelector('input[name="userType"]');
    if (tempInput) {
      unifiedForm.removeChild(tempInput);
    }
    
    // ✅ FIXED: Better error message handling
    let errorMessage = err.message;
    
    // Handle specific error cases
    if (err.message.includes('Unexpected token') || err.message.includes('JSON')) {
      errorMessage = 'Server error: Please try again or contact support';
    }
    
    showRegistrationError(errorMessage);
  }
});

  // 2️⃣ التنقل بين الحقول تلقائياً
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
  });

  // التحقق
  verifyBtn.addEventListener("click", async () => {
    errorMsg.style.display = "none";
    successMsg.style.display = "none";

    const verifyUrl = Array.from(inputs).map(i => i.value.trim()).join("");
    const email = localStorage.getItem("userEmail");

    if (!email) {
      errorMsg.textContent = "Email not found. Please register again.";
      errorMsg.style.display = "block";
      return;
    }

    if (verifyUrl.length !== 6) {
      errorMsg.textContent = "Please enter the 6-digit code.";
      errorMsg.style.display = "block";
      return;
    }

    try {
      const response = await fetch("/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verifyUrl })
      });

      const data = await response.json();

      if (response.ok) {
        successMsg.textContent = data.message;
        successMsg.style.display = "block";

        setTimeout(() => {
          verificationWindow.style.display = "none";
          step1.style.display = 'none';
          step2.style.display = 'none';
          formthree.style.display = "block";
        }, 2000);
      } else {
        errorMsg.textContent = data.error || "Invalid verification code";
        errorMsg.style.display = "block";
      }
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.style.display = "block";
    }
  });

  // IMAGE PREVIEW FUNCTION
  function showImagePreview(file) {
    if (imageBox) {
      const existingPreview = imageBox.querySelector('.image-preview');
      if (existingPreview) {
        existingPreview.remove();
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `
          <img src="${e.target.result}" alt="Image Preview" 
               style="max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 8px; margin-top: 10px;">
          <p style="margin: 5px 0; color: green;">✅ Image ready for upload</p>
        `;
        imageBox.appendChild(preview);
      };
      reader.readAsDataURL(file);
    }
  }

  // SUCCESS/ERROR MESSAGE FUNCTIONS
  function showRegistrationSuccess(message) {
    // Create or show success message
    let successDiv = document.querySelector('.registration-success');
    if (!successDiv) {
      successDiv = document.createElement('div');
      successDiv.className = 'registration-success';
      successDiv.style.cssText = 'padding: 15px; background: #e8f5e8; border: 1px solid #4caf50; border-radius: 5px; margin: 15px 0; color: #2e7d32;';
      step2.insertBefore(successDiv, step2.firstChild);
    }
    successDiv.innerHTML = `✅ ${message}`;
    successDiv.style.display = 'block';
  }

  function showRegistrationError(message) {
    // Create or show error message
    let errorDiv = document.querySelector('.registration-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'registration-error';
      errorDiv.style.cssText = 'padding: 15px; background: #ffebee; border: 1px solid #f44336; border-radius: 5px; margin: 15px 0; color: #c62828;';
      step2.insertBefore(errorDiv, step2.firstChild);
    }
    errorDiv.innerHTML = `❌ ${message}`;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  // Validation functions
  function validateFormOne() {
    const required = ['firstName', 'lastName', 'birthDate', 'phoneNumber'];
    let valid = true;
    required.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor = 'red';
        valid = false;
      } else {
        el.style.borderColor = '';
      }
    });
    if (!valid) {
      alert('Please fill all required fields in Step 1');
    }
    return valid;
  }

  function validateFormTwo() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email || !password || !confirmPassword) {
      alert('Please fill all required fields in Step 2');
      return false;
    }
    
    if (!validateEmail(email)) { 
      alert('Please enter a valid email address'); 
      return false; 
    }
    
    if (password.length < 6) { 
      alert('Password must be at least 6 characters'); 
      return false; 
    }
    
    if (password !== confirmPassword) { 
      alert('Passwords do not match'); 
      return false; 
    }
    
    return true;
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
});