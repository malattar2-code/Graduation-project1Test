// Updated JavaScript for donor-account.ejs page
// i18next initialization - FIXED VERSION (No automatic reload)
function initI18next() {
    if (typeof i18next !== 'undefined' && i18next.isInitialized) {
        // i18next is already initialized
        console.log('✅ i18next already initialized');
        return;
    }
    
    if (typeof i18next !== 'undefined') {
        console.log('🔄 Initializing i18next...');
        
        const i18nextHttpBackend = window.i18nextHttpBackend;
        const i18nextBrowserLanguageDetector = window.i18nextBrowserLanguageDetector;
        
        i18next
            .use(i18nextHttpBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                fallbackLng: 'en',
                debug: false,
                resources: {
                    en: {
                        translation: {
                            "dropdownHomeTgt": "Home",
                            "dropdownDashboardTgt": "Dashboard",
                            "dropdownFundraisersTgt": "Fundraisers",
                            "dropdownCategoriesTgt": "Categories",
                            "dropdownContactTgt": "Contact Us",
                            "dropdownLanguageTgt": "Language",
                            "accountDetailsRankTgt": "Generous Donor",
                            "accountDetailsTypeDonorTgt": "Donor",
                            "accountDetailsTypeIndigentTgt": "Donor",
                            "aboutAccountTitleTgt": "About Account",
                            "aboutAccountDescriptionTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            "achievementsTitleTgt": "Achievements",
                            "fundraisersTitleTgt": "Fundraisers :",
                            "accountFundraisersDonateBtnTgt": "Donate",
                            "accountFundraisersDetailsBtnTgt": "Details",
                            "complaintTitleTgt": "Enter the problem you are facing",
                            "complaintLabelTgt": "Enter A Problem",
                            "complaintBtnTgt": "Send",
                        }
                    },
                    ar: {
                        translation: {
                            "dropdownHomeTgt": "الرئيسية",
                            "dropdownDashboardTgt": "لوحة التحكم",
                            "dropdownFundraisersTgt": "حملات التبرع",
                            "dropdownCategoriesTgt": "التصنيفات",
                            "dropdownContactTgt": "تواصل معنا",
                            "dropdownLanguageTgt": "اللغة",       
                            "accountDetailsRankTgt": "متبرع كريم",
                            "accountDetailsTypeTgt": "المتبرع",
                            "aboutAccountTitleTgt": "حول الحساب",
                            "aboutAccountDescriptionTgt": "إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد",
                            "achievementsTitleTgt": "الإنجازات",
                            "fundraisersTitleTgt": "حملات التبرع :",
                            "accountFundraisersDonateBtnTgt": "تبرع",
                            "accountFundraisersDetailsBtnTgt": "التفاصيل",
                            "complaintTitleTgt": "أدخل المشكلة التي تواجهك",
                            "complaintLabelTgt": "أدخل المشكلة",
                            "complaintBtnTgt": "أرسل",
                        }
                    }
                }
            }, function(err, t) {
                if (err) {
                    console.error('Error initializing i18next:', err);
                } else {
                    console.log('✅ i18next initialized successfully');
                    updateContent();
                }
            });

        // Set up language change handlers
        const enBtn = document.getElementById('en-btn');
        const arBtn = document.getElementById('ar-btn');
        
        if (enBtn) {
            enBtn.addEventListener('click', () => {
                i18next.changeLanguage('en');
                updateButtonState('en');
            });
        }
        
        if (arBtn) {
            arBtn.addEventListener('click', () => {
                i18next.changeLanguage('ar');
                updateButtonState('ar');
            });
        }

        function updateButtonState(lang) {
            const enBtnEl = document.getElementById('en-btn');
            const arBtnEl = document.getElementById('ar-btn');
            if (enBtnEl) enBtnEl.classList.toggle('active', lang === 'en');
            if (arBtnEl) arBtnEl.classList.toggle('active', lang === 'ar');
        }

        function updateContent() {
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (key && i18next.exists(key)) {
                    element.innerHTML = i18next.t(key);
                }
            });
            
            if (i18next.language === 'ar') {
                document.body.classList.add('rtl');
                document.body.setAttribute('dir', 'rtl');
            } else {
                document.body.classList.remove('rtl');
                document.body.setAttribute('dir', 'ltr');
            }
        }

        i18next.on('languageChanged', () => {
            updateContent();
        });

        // Auto-detect browser language
        if (navigator.language.startsWith('ar')) {
            i18next.changeLanguage('ar');
            updateButtonState('ar');
        }
    } else {
        console.warn('⚠️ i18next not available, waiting for scripts to load...');
        // Don't reload! Just wait for scripts
        setTimeout(() => {
            if (typeof i18next !== 'undefined') {
                initI18next();
            } else {
                console.error('❌ i18next failed to load');
            }
        }, 1000);
    }
}

// Replace the old loadScript and initApp with this
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = function() {
        console.warn('Failed to load script: ' + src);
        if (callback) callback();
    };
    document.head.appendChild(script);
}

function initApp() {
    // Initialize Owl Carousel
    if (typeof $ !== 'undefined' && $.fn.owlCarousel) {
        $(document).ready(function(){
            $(".owl-carousel").owlCarousel({
                loop: true,
                items: 1,
                responsive: {
                    768: { items: 3 }
                },
                autoplay: false,
                dots: true,
                nav: true,
                margin: 10,
                autoplayTimeout: 5000,
                autoplayHoverPause: true,
            });
        });
    }
    
    // Initialize i18next (without reload)
    initI18next();
}

// Check if jQuery is loaded
if (typeof jQuery === 'undefined') {
    console.log('Loading jQuery...');
    loadScript('https://code.jquery.com/jquery-3.6.0.min.js', function() {
        if (typeof $.fn.owlCarousel === 'undefined') {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js', initApp);
        } else {
            initApp();
        }
    });
} else {
    initApp();
}
//________________________________________________________________________________________
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
        phone.textContent = userData.phoneInternational || 'Not provided';
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
    
    // Update reward data
    const rewardImg = document.querySelector('.reward-image img');
    const rewardName = document.querySelector('.reward-name h1');
    
    if (rewardImg && userData.rewardImage) {
        rewardImg.src = userData.rewardImage;
        rewardImg.alt = userData.rewardName || 'Reward';
    }
    
    if (rewardName && userData.rewardName) {
        rewardName.textContent = userData.rewardName;
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

//_________________________________________________________________________________________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
  const menuButton = document.getElementById('menuButton');
  const dropdownMenu = document.getElementById('dropdownMenu');
  
  // Toggle dropdown when button is clicked
  menuButton.addEventListener('click', function(e) {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
      if (!menuButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownMenu.classList.remove('show');
      }
  });
});

//_______________________________________________________________________________________________________________

document.addEventListener('DOMContentLoaded', function() {
    const languageMenu = document.getElementById('languageMenu');
    const languageSwitcher = document.getElementById('languageSwitcher');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    // Toggle language switcher when Language menu is clicked
    languageMenu.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        languageSwitcher.classList.toggle('show');
        languageSwitcher.classList.toggle('flex');
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdownMenu.contains(e.target)) {
            languageSwitcher.classList.remove('show');
            languageSwitcher.classList.remove('flex');
        }
    });
    
    // Language button functionality
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            langButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Close the language switcher after selection
            languageSwitcher.classList.remove('show');
            languageSwitcher.classList.remove('flex');
            
            // Here you would typically call your language change function
            console.log('Selected language: ' + this.textContent);
        });
    });
    
    // Prevent language switcher from closing when clicking inside it
    languageSwitcher.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});


//____________________________________________________________________________________________________
