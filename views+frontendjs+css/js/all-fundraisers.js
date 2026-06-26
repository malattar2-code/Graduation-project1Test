const linkItems = document.querySelectorAll('.links li');

// Define the mapping between menu items and their corresponding content sections
const contentMap = [
    { menuClass: 'link-content-one', contentClass: 'lastest-fundraiser-content-box' },
    { menuClass: 'link-content-two', contentClass: 'popular-fundraiser-content-box' },
    { menuClass: 'link-content-three', contentClass: 'fundraiser-in-your-area-content-box' },
    { menuClass: 'link-content-four', contentClass: 'saved-fundraisers-content-box' },
    { menuClass: 'link-content-five', contentClass: 'almost-done-fundraisers-content-box' },
];

// Function to hide all content sections
function hideAllContent() {
    contentMap.forEach(content => {
        const section = document.querySelector(`.${content.contentClass}`);
        if (section) section.style.display = 'none';
    });
    // Also hide search results if it exists
    const searchResults = document.querySelector('.search-results-content-box');
    if (searchResults) searchResults.style.display = 'none';
}

// Function to show specific content
function showContent(contentClass) {
    hideAllContent();
    const section = document.querySelector(`.${contentClass}`);
    if (section) section.style.display = 'block';
}

// Add click event listeners to each link item
linkItems.forEach((item, index) => {
    const btn = item.querySelector('a');
    btn.addEventListener('click', () => {
        // Remove active class from all menu items
        linkItems.forEach(menuItem => {
            menuItem.classList.remove('active-li');
        });
        
        // Hide all content and show the clicked one
        hideAllContent();
        
        // Add active class to the clicked menu item
        item.classList.add('active-li');
        
        // Show the corresponding content section
        const activeContent = document.querySelector(`.${contentMap[index].contentClass}`);
        if (activeContent) activeContent.style.display = 'block';
        
        // Close the mobile menu after clicking a link
        closeMobileMenu();
    });
});

// Initialize - show appropriate content based on search/category or default to latest
function initializeContent() {
    // Check if we have search query or category filter
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const categoryFilter = urlParams.get('category');
    
    if (searchQuery || categoryFilter) {
        // Show search results
        hideAllContent();
        const searchResults = document.querySelector('.search-results-content-box');
        if (searchResults) searchResults.style.display = 'block';
        
        // Remove active class from all menu items when showing search results
        linkItems.forEach(menuItem => {
            menuItem.classList.remove('active-li');
        });
    } else {
        // Show latest fundraiser content by default
        hideAllContent();
        const latestFundraiser = document.querySelector('.lastest-fundraiser-content-box');
        if (latestFundraiser) latestFundraiser.style.display = 'block';
        
        // Set the first menu item as active (assuming it corresponds to latest fundraiser)
        if (linkItems.length > 0) {
            linkItems[0].classList.add('active-li');
        }
    }
}

// Call initialization on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeContent();
    
    // Initialize show more buttons
    initializeShowMoreButtons();
});

// Mobile menu functionality
const menuButton = document.querySelector('.access-links-btn');
const mobileMenu = document.querySelector('.access-links');
const overlay = document.querySelector('.overlay');

// Function to open mobile menu
function openMobileMenu() {
    mobileMenu.classList.add('active');
    overlay.classList.add('active');
    menuButton.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
}

// Function to close mobile menu
function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    menuButton.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
}

// Toggle menu on button click
if (menuButton) {
    menuButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
}

//___________________________________________________________________________________________________
// document.addEventListener('DOMContentLoaded', function() {
//     const notification_btn = document.getElementById('notificationBtn');
//     const notifications_Window = document.getElementById('notificationsWindow');
    
//     // Toggle dropdown when button is clicked
//     notification_btn.addEventListener('click', function(e) {
//         e.preventDefault();
//         notifications_Window.classList.toggle('show');
//     });
    
//     // Close dropdown when clicking outside
//     document.addEventListener('click', function(e) {
//         if (!notification_btn.contains(e.target) && !notifications_Window.contains(e.target)) {
//             notifications_Window.classList.remove('show');
//         }
//     });
    
//     // Close dropdown when clicking on close button
//     const closeButtons = document.querySelectorAll('.notifications-close-btn');
//     closeButtons.forEach(button => {
//         button.addEventListener('click', function(e) {
//             e.preventDefault();
//             notifications_Window.classList.remove('show');
//         });
//     });
// });

//__________________________________________________________________________________________________________________________________________________
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
//___________________________________________________________________________________________________________
// تحميل آمن للمكتبات مع وجود بدائل
function loadScript(src, onLoad) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = onLoad;
    script.onerror = function() {
        console.warn('Failed to load script: ' + src);
    };
    document.head.appendChild(script);
}

// تحميل المكتبات بالترتيب الصحيح
if (typeof jQuery === 'undefined') {
    console.warn('jQuery is not loaded, loading from CDN');
    loadScript('https://code.jquery.com/jquery-3.6.0.min.js', function() {
        // بعد تحميل jQuery، تحميل Owl Carousel
        if (typeof $.fn.owlCarousel === 'undefined') {
            console.warn('Owl Carousel is not loaded, loading from CDN');
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js', initApp);
        } else {
            initApp();
        }
    });
} else {
    initApp();
}

function initApp() {
    // تهيئة Owl Carousel بعد تحميل الصفحة
    $(document).ready(function(){
        $(".owl-carousel").owlCarousel({
            loop: true,
            items: 1, // Show only 1 item on mobile
            responsive: {
                768: {
                    items: 3 // Show 3 items on larger screens
                }
            },
            autoplay:false,
            dots:true,
            nav:true,
            margin:10,
            autoplayTimeout:5000,
            autoplayHoverPause:true,
        });
    });

    // باقي الكود الخاص بك...
    // تأكد من أن i18next محمل قبل استخدامه
    if (typeof i18next !== 'undefined') {
        // كود i18next الحالي الخاص بك هنا...
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
                            //________________________________________
                            "notificationsTitleTgt": "Notifications",
                            //________________________________________
                            "allFundraisersLinkOneTgt": "Lastest Fundraiser",
                            "allFundraisersLinkTwoTgt": "Popular Fundraiser",
                            "allFundraisersLinkThreeTgt": "Fundraiser In Your Area",
                            "allFundraisersLinkFourTgt": "Saved Fundraisers",
                            "allFundraisersLinkFiveTgt": "Almost Done Fundraisers",
                            "allFundraisersLinkSixTgt": "Categories",
                            //________________________________________
                            "searchPlaceholder": "Search..",
                            "searchRecentSearchesTgt": "Recent Searches",
                            "searchRecentSearchesClearBtnTgt": "Clear all",
                            "searchContainerSuggestTitleTgt": "Suggested searches :",
                            //________________________________________
                            "allFundraisersCategoriesOneTgt": "environment",
                            "allFundraisersCategoriesTwoTgt": "poverty",
                            "allFundraisersCategoriesThreeTgt": "Education",
                            "allFundraisersCategoriesFourTgt": "gaza",
                            "allFundraisersCategoriesFiveTgt": "Orphans",
                            "allFundraisersCategoriesSixTgt": "disabilities",
                            "allFundraisersCategoriesSevenTgt": "health care",
                            //________________________________________
                            "allFundraisersDonateBtnTgt": "Donate",
                            "allFundraisersShowMoreBtnTgt": "Show More ",
                        }
                    },
                    ar: {
                        translation: {
                            "dropdownHomeTgt": "الرئيسية",
                            "dropdownDashboardTgt": "لوحة التحكم",
                            "dropdownFundraisersTgt": "طلبات التبرع",
                            "dropdownCategoriesTgt": "التصنيفات",
                            "dropdownContactTgt": "تواصل معنا",
                            "dropdownLanguageTgt": "اللغة",
                            //________________________________________
                            "notificationsTitleTgt": "الإشعارات",
                            
                            //________________________________________
                            "allFundraisersLinkOneTgt": "أحدث حملات التبرع",
                            "allFundraisersLinkTwoTgt": "حملات التبرع الأكثر تفاعلاً",
                            "allFundraisersLinkThreeTgt": "حملات التبرع في منطقتك",
                            "allFundraisersLinkFourTgt": "حملات التبرع التي تم حفظها",
                            "allFundraisersLinkFiveTgt": "حملات التبرع شبه المكتملة",
                            "allFundraisersLinkSixTgt": "التصنيفات",
                            //________________________________________
                            "searchPlaceholder": "ابحث..",
                            "searchRecentSearchesTgt": "عمليات البحث الأخيرة",
                            "searchRecentSearchesClearBtnTgt": "مسح الكل",
                            "searchContainerSuggestTitleTgt": "اقتراحات البحث :",
                            //________________________________________
                            "allFundraisersCategoriesOneTgt": "البيئة",
                            "allFundraisersCategoriesTwoTgt": "الفقر",
                            "allFundraisersCategoriesThreeTgt": "التعليم",
                            "allFundraisersCategoriesFourTgt": "غزة",
                            "allFundraisersCategoriesFiveTgt": "أيتام",
                            "allFundraisersCategoriesSixTgt": "ذوي الإحتياجات",
                            "allFundraisersCategoriesSevenTgt": "الرعاية الصحية",
                            //_________________________________________
                            "allFundraisersDonateBtnTgt": "تبرع الآن",
                            "allFundraisersShowMoreBtnTgt": "عرض المزيد",
                        }
                    }
                }
            }, function(err, t) {
                if (err) {
                    console.error('Error initializing i18next:', err);
                } else {
                    updateContent();
                }
            });

        // تغيير اللغة إلى الإنجليزية
        document.getElementById('en-btn').addEventListener('click', () => {
            i18next.changeLanguage('en');
            updateButtonState('en');
        });

        // تغيير اللغة إلى العربية
        document.getElementById('ar-btn').addEventListener('click', () => {
            i18next.changeLanguage('ar');
            updateButtonState('ar');
        });

        // تحديث حالة أزرار اللغة
        function updateButtonState(lang) {
            document.getElementById('en-btn').classList.toggle('active', lang === 'en');
            document.getElementById('ar-btn').classList.toggle('active', lang === 'ar');
        }

        // تحديث المحتوى بناءً على اللغة المحددة - FIXED VERSION
        function updateContent() {
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                
                // Handle input placeholders differently
                if (element.placeholder !== undefined) {
                    // This is an input element with a placeholder
                    element.placeholder = i18next.t(key);
                } else {
                    // This is a regular element with text content
                    element.innerHTML = i18next.t(key);
                }
            });
            
            // تغيير اتجاه الصفحة للغة العربية
            if (i18next.language === 'ar') {
                document.body.classList.add('rtl');
                document.body.setAttribute('dir', 'rtl');
            } else {
                document.body.classList.remove('rtl');
                document.body.setAttribute('dir', 'ltr');
            }
        }

        // تحديث المحتوى عند تغيير اللغة
        i18next.on('languageChanged', () => {
            updateContent();
        });

        // الكشف التلقائي عن لغة المتصفح وتطبيقها
        if (navigator.language.startsWith('ar')) {
            i18next.changeLanguage('ar');
            updateButtonState('ar');
        }
    } else {
        console.error('i18next is not available');
        // تحميل i18next من CDN إذا لم يكن متاحاً
        loadScript('https://unpkg.com/i18next@21.9.2/dist/umd/i18next.min.js', function() {
            loadScript('https://unpkg.com/i18next-http-backend@1.4.1/i18nextHttpBackend.min.js', function() {
                loadScript('https://unpkg.com/i18next-browser-languagedetector@7.0.1/i18nextBrowserLanguageDetector.min.js', function() {
                    console.log('i18next loaded from CDN');
                    // إعادة تهيئة التطبيق بعد تحميل i18next
                    location.reload();
                });
            });
        });
    }
}
//________________________________________________________________________________________________________________________________-
// The rest of your JavaScript code remains unchanged
document.addEventListener('DOMContentLoaded', function() {
    const languageMenu = document.getElementById('languageMenu');
    const languageSwitcher = document.getElementById('languageSwitcher');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    // Toggle language switcher when Language menu is clicked
    if (languageMenu) {
        languageMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            languageSwitcher.classList.toggle('show');
            languageSwitcher.classList.toggle('flex');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (dropdownMenu && !dropdownMenu.contains(e.target)) {
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
            if (languageSwitcher) {
                languageSwitcher.classList.remove('show');
                languageSwitcher.classList.remove('flex');
            }
            
            // Here you would typically call your language change function
            console.log('Selected language: ' + this.textContent);
        });
    });
    
    // Prevent language switcher from closing when clicking inside it
    if (languageSwitcher) {
        languageSwitcher.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});
//_____________________________________________________________________________________________________________________________________________
    // public/js/saveFundraiser.js
    document.addEventListener('DOMContentLoaded', function() {
      // Add click handlers to all save buttons
      document.addEventListener('click', async function(e) {
        if (e.target.closest('.save-fundraiser-btn')) {
          e.preventDefault();
          const button = e.target.closest('.save-fundraiser-btn');
          await toggleSaveFundraiser(button);
        }
      });

      // Check and update save status on page load
      initializeSaveButtons();
    });

    // Get fundraiser ID from different possible locations
    function getFundraiserId(button) {
      // Try to find fundraiser ID from parent elements
      const fundraiserBox = button.closest('[data-fundraiser-id]');
      if (fundraiserBox) {
        return fundraiserBox.dataset.fundraiserId;
      }
      
      // Try to find from URL in donate button
      const donateBtn = button.closest('.fundraiser-btns')?.querySelector('.donate-btn, .main-donate-btn');
      if (donateBtn && donateBtn.href) {
        const match = donateBtn.href.match(/\/fundraiser\/(\d+)/);
        if (match) return match[1];
      }
      
      console.error('Could not find fundraiser ID');
      return null;
    }

    async function initializeSaveButtons() {
      const saveButtons = document.querySelectorAll('.save-fundraiser-btn');
      
      for (const button of saveButtons) {
        const fundraiserId = getFundraiserId(button);
        
        if (fundraiserId) {
          const isSaved = await checkSaveStatus(fundraiserId);
          updateButtonAppearance(button, isSaved);
        }
      }
    }

    async function checkSaveStatus(fundraiserId) {
      try {
        const response = await fetch(`/saved-fundraisers/check/${fundraiserId}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.isSaved;
      } catch (error) {
        console.error('Error checking save status:', error);
        return false;
      }
    }

    async function toggleSaveFundraiser(button) {
      try {
        const fundraiserId = getFundraiserId(button);
        if (!fundraiserId) return;

        const isCurrentlySaved = await checkSaveStatus(fundraiserId);
        
        if (isCurrentlySaved) {
          // Unsave
          const response = await fetch(`/saved-fundraisers/unsave/${fundraiserId}`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            updateButtonAppearance(button, false);
            showNotification(result.message || 'Fundraiser removed from saved items', 'success');
          } else {
            throw new Error('Failed to unsave fundraiser');
          }
        } else {
          // Save
          const response = await fetch(`/saved-fundraisers/save/${fundraiserId}`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            updateButtonAppearance(button, true);
            showNotification(result.message || 'Fundraiser saved successfully', 'success');
          } else {
            throw new Error('Failed to save fundraiser');
          }
        }
      } catch (error) {
        console.error('Error toggling save status:', error);
        showNotification('Failed to update saved status', 'error');
      }
    }

    function updateButtonAppearance(button, isSaved) {
      const icon = button.querySelector('svg');
      
      if (isSaved) {
        button.classList.add('saved');
        button.title = 'Remove from saved';
        // Change to filled bookmark icon
        icon.innerHTML = `<path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>`;
      } else {
        button.classList.remove('saved');
        button.title = 'Save fundraiser';
        // Change to outline bookmark icon with plus
        icon.innerHTML = `<path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                        <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4"/>`;
      }
    }

    function showNotification(message, type) {
      // Simple notification implementation - you can replace with your preferred method
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        transition: opacity 0.3s;
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

//___________________________________________________________________________________________________________

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