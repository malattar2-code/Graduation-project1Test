document.addEventListener('DOMContentLoaded', function() {
  // عناصر DOM
  const formOne = document.querySelector('.form-one');
  const formTwo = document.querySelector('.form-two');
  const nextBtnOne = document.querySelector('.next-btn-one');
  const nextBtnTwo = document.querySelector('.next-btn-two');
  const donorBtn = document.querySelector('#donor-btn');
  const indigentBtn = document.querySelector('#indigent-btn');
  const getLocationBtn = document.getElementById('getLocationBtn');
  const locationDisplay = document.getElementById('locationDisplay');

  let userType = 'requester'; // القيمة الافتراضية
  let location = null; // لتخزين GeoPoint

  // اختيار نوع الحساب
  donorBtn.addEventListener('click', function() {
    userType = 'donor';
    donorBtn.classList.add('active');
    indigentBtn.classList.remove('active');
  });

  indigentBtn.addEventListener('click', function() {
    userType = 'requester';
    indigentBtn.classList.add('active');
    donorBtn.classList.remove('active');
  });

  // الحصول على الموقع
  getLocationBtn.addEventListener('click', function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        locationDisplay.textContent = `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`;
      }, (err) => {
        alert('Unable to get location');
      });
    } else {
      alert('Geolocation not supported');
    }
  });

  // الانتقال للنموذج الثاني
  nextBtnOne.addEventListener('click', function(e) {
    e.preventDefault();
    if (validateFormOne()) {
      formOne.style.display = 'none';
      formTwo.style.display = 'block';
    }
  });

  // التسجيل
  nextBtnTwo.addEventListener('click', async function(e) {
    e.preventDefault();
    if (validateFormTwo()) {
      try {
        const formData = {
          firstName: document.getElementById('firstName').value,
          lastName: document.getElementById('lastName').value,
          birthDate: document.getElementById('birthDate').value,
          gender: document.getElementById('gender').value,
          phone: document.getElementById('phoneCode').value + document.getElementById('phoneNumber').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          confirmPassword: document.getElementById('confirmPassword').value,
          userType,
          location
        };

        const response = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');

        alert(data.message);
        window.location.href = '/verify-email';
      } catch (err) {
        console.error(err);
        alert(`Error: ${err.message}`);
      }
    }
  });

  // Validation
  function validateFormOne() {
    const required = ['firstName', 'lastName', 'birthDate', 'phoneNumber'];
    let valid = true;
    required.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor = 'red';
        valid = false;
      } else el.style.borderColor = '';
    });
    if (!valid) alert('Please fill all required fields');
    return valid;
  }

  function validateFormTwo() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (!email || !password || !confirmPassword) {
      alert('Please fill all required fields');
      return false;
    }
    if (!validateEmail(email)) { alert('Invalid email'); return false; }
    if (password.length < 6) { alert('Password must be at least 6 characters'); return false; }
    if (password !== confirmPassword) { alert('Passwords do not match'); return false; }
    return true;
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
});