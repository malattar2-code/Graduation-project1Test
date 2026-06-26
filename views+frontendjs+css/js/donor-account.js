// Updated JavaScript for donor-account.ejs page

// Function to calculate the position percentage for a given point value
function getPercentageForPoints(points) {
  // Define the scale breakpoints
  const scale = [
    { points: 0, percent: 0 },
    { points: 100, percent: 10 },
    { points: 500, percent: 15 },
    { points: 1000, percent: 20 },
    { points: 5000, percent: 60 },
    { points: 10000, percent: 100 }
  ];
  
  if (points <= 0) return 0;
  if (points >= 10000) return 100;
  
  // Find the appropriate segment
  for (let i = 1; i < scale.length; i++) {
    if (points <= scale[i].points) {
      const prev = scale[i-1];
      const curr = scale[i];
      const segmentPoints = curr.points - prev.points;
      const segmentPercent = curr.percent - prev.percent;
      const pointsInSegment = points - prev.points;
      return prev.percent + (pointsInSegment / segmentPoints) * segmentPercent;
    }
  }
  
  return 100;
}

// Update progress bars with animation
function updateProgressBars(currentPoints) {
  const progressPercentage = getPercentageForPoints(currentPoints);
  
  // Get elements
  const rankBar = document.getElementById('rank-bar');
  const rankValue = document.getElementById('rank-value');
  
  if (!rankBar || !rankValue) {
    console.error('Progress bar elements not found');
    return;
  }
  
  // Reset the widths to 0 for new animation
  rankBar.style.width = '0%';
  rankValue.textContent = '0';
  
  // Animate to new values
  setTimeout(() => {
    rankBar.style.width = progressPercentage + '%';
    animateValue(rankValue, 0, currentPoints, 1500);
  }, 300);
}

// Animate number counting
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value.toLocaleString(); // Add thousand separators
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Fetch user data from API (fallback if server-side data fails)
async function fetchUserData(userId) {
  try {
    console.log('🔄 Fetching user data for ID:', userId);
    
    const response = await fetch(`/api/donor-data/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      displayUserData(result.data);
    } else {
      console.error('Failed to fetch user data:', result.message);
      displayDefaultData();
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    displayDefaultData();
  }
}

// Display user data in the template
function displayUserData(userData) {
  console.log('📊 Displaying user data:', userData);
  
  // Update profile image
  const profileImg = document.querySelector('.account-img img');
  if (profileImg && userData.userImage) {
    profileImg.src = userData.userImage;
    profileImg.alt = `${userData.fullName} profile`;
  }
  
  // Update full name
  const accountName = document.querySelector('.account-name h1');
  if (accountName) {
    accountName.textContent = userData.fullName || 'Unknown User';
  }
  
  // Update user type
  const userType = document.querySelector('.account-type h1');
  if (userType) {
    userType.textContent = userData.userType ? 
      userData.userType.charAt(0).toUpperCase() + userData.userType.slice(1) : 'Donor';
  }
  
  // Update location
  const location = document.querySelector('.account-location h1');
  if (location) {
    location.textContent = userData.location || 'Not provided';
  }
  
  // Update phone number
  const phone = document.querySelector('.account-whatsapp h1');
  if (phone) {
    phone.textContent = userData.phoneNumber || 'Not provided';
  }
  
  // Update rank image
  const rankImg = document.querySelector('.donation-rank img');
  if (rankImg && userData.rankImage) {
    rankImg.src = userData.rankImage;
    rankImg.alt = userData.rankName || 'Rank';
  }
  
  // Update rank name
  const rankName = document.querySelector('.donation-rank h1');
  if (rankName) {
    rankName.textContent = userData.rankName || 'No Rank';
  }
  
  // Update metric name
  const metricName = document.querySelector('.metric-name');
  if (metricName) {
    metricName.textContent = 'Current Points';
  }
  
  // Update progress bars and points
  const userPoints = userData.userPoints || 0;
  updateProgressBars(userPoints);
  
  console.log('✅ User data displayed successfully');
}

// Display default data if loading fails
function displayDefaultData() {
  console.log('⚠️ Using default data');
  updateProgressBars(0);
}

// Get current page user ID from URL
function getCurrentUserId() {
  const pathArray = window.location.pathname.split('/');
  const userIdIndex = pathArray.indexOf('donor-account') + 1;
  return pathArray[userIdIndex] ? parseInt(pathArray[userIdIndex]) : null;
}

// Initialize when page loads
window.addEventListener('load', function() {
  console.log('🚀 Initializing donor account page...');
  
  // Check if we have server-side data first
  if (window.userData && window.userData.userPoints !== undefined) {
    console.log('📊 Using server-side data');
    updateProgressBars(window.userData.userPoints);
  } else {
    // Try to get user ID from URL and fetch data
    const userId = getCurrentUserId();
    if (userId) {
      console.log('🔄 Fetching data from API for user ID:', userId);
      fetchUserData(userId);
    } else {
      console.log('❌ No user ID found');
      displayDefaultData();
    }
  }
});

// Optional: Add refresh functionality
function refreshUserData() {
  const userId = getCurrentUserId();
  if (userId) {
    console.log('🔄 Refreshing user data...');
    fetchUserData(userId);
  }
}

// Add this to make refresh available globally
window.refreshUserData = refreshUserData;

//____________________________________________________________________________________________

document.getElementById("controlPanelBtn").addEventListener("click", (e) => {
    e.preventDefault();

    // نجرب نجيب userType من sessionStorage
    const userType = sessionStorage.getItem("userType");

    if (!userType) {
        // 👈 إذا ما في userType => مش مسجل دخول
        window.location.href = "/register";
        return;
    }

    // ✅ إذا مسجل دخول، نوجه حسب userType
    if (userType === "superadmin") {
        window.location.href = "/admin";
    } else if (userType === "requester") {
        window.location.href = "/userPanelIndigent";
    } else if (userType === "donor") {
        window.location.href = "/UserPanelDonor";
    } else {
        // fallback
        // window.location.href = "/index";
        console.log('الرجاء تحديد تصنيف ناجح')
    }
});