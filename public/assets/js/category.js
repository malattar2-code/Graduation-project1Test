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
                            "categoryTitleTgt": "Education",
                            "categoryDescriptionTgt": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Culpa quas accusamus placeat at voluptatem id assumenda numquam cupiditate ab, molestiae quae tempore consectetur reiciendis voluptatum repellat corporis nesciunt soluta perferendis!",
                            //________________________________________
                            "categoryFundraisersShowMoreBtnTgt": "Show More ",
                            //________________________________________
                            "categoryDonateBtnTgt": "Donate",
                            //________________________________________
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
                            //________________________________________
                            "categoryTitleTgt": "التعليم",
                            "categoryDescriptionTgt": "إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.",
                            //________________________________________
                            "categoryFundraisersShowMoreBtnTgt": "عرض المزيد",
                            //________________________________________
                            "categoryDonateBtnTgt": "تبرع",
                            //________________________________________
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

        // تحديث المحتوى بناءً على اللغة المحددة
        function updateContent() {
            document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.innerHTML = i18next.t(key);
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

//_________________________________________________________________________________________________________
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

//________________________________________________________________________________________________________________-

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

//______________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
    console.log('Category page loaded');
    
    // You can add interactive features here
    // Example: Load related content via AJAX, etc.
});

//__________________________________________________________________________________________________-

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

//__________________________________________________________________________________________________

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
//____________________________________________________________________________________________________
// ===== AUTHENTICATION STATE FOR CATEGORY PAGE =====
// Get authentication status from sessionStorage (set by index page or after login)
let isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
let allowButtonInteractions = true; // Default to true, adjust if needed
function handleFundraiserAccountClick(event, userId) {
    event.stopPropagation();
    if (!allowButtonInteractions) {
        event.preventDefault();
        return false;
    }
    if (!isAuthenticated) {
        event.preventDefault();
        window.location.href = '/register';
        return false;
    }
    window.location.href = `/indigent-account/${userId}`;
    return true;
}
//____________________________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
            const help_btn = document.getElementById('helpBtn');
            const submit_complaint = document.getElementById('submitComplaint');
            
            // Toggle dropdown when button is clicked
            help_btn.addEventListener('click', function(e) {
                e.preventDefault();
                submit_complaint.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!help_btn.contains(e.target) && !submit_complaint.contains(e.target)) {
                    submit_complaint.classList.remove('show');
                }
            });
        });
//_______________________________________________________________________________________________________

// ======================== PAGINATION FOR CATEGORY PAGE ========================

/**
 * Get container ID – for category page, the fundraisers container
 */
function getCategoryContainerId() {
    return '.fundraisers-boxes'; // The container where fundraisers are displayed
}

/**
 * Render fundraiser cards HTML from data array
 * (Matches the structure in your EJS template)
 */
function renderCategoryFundraiserCards(fundraisers) {
    return fundraisers.map(fundraiser => `
        <div class="fundraiser-box" data-fundraiser-id="${fundraiser.fundraiser_id}">
            <div class="fundraiser-account">
                ${fundraiser.user && fundraiser.user.user_image ? 
                    `<img src="${fundraiser.user.user_image}" alt="${fundraiser.user.full_name || 'User'}" onerror="this.src='/images/default-profile.png'">` :
                    `<img src="/images/default-profile.png" alt="Default Profile">`
                }
                <h1 class="account-name">${escapeHtml(fundraiser.user ? fundraiser.user.full_name : 'Unknown User')}</h1>
            </div>
            <div class="fundraiser-img" style="background: url('${fundraiser.fundraiser_main_image}'); background-size: cover; background-position: center;"
                onclick="window.location.href='/fundraiser/${fundraiser.fundraiser_id}'">
            </div>
            <div class="fundraiser-title">
                <h2 class="main-title">${escapeHtml(fundraiser.fundraiser_title)}</h2>
                <span>${escapeHtml(fundraiser.user ? fundraiser.user.locationString : 'Location not specified')}</span>
            </div>
            <p class="fundraiser-des">
                ${fundraiser.fundraiser_description.length > 150 ? 
                    fundraiser.fundraiser_description.substring(0, 150) + '...' : 
                    fundraiser.fundraiser_description}
            </p>
            <div class="fundraiser-btns">
                <div class="flex-btns">
                    <button class="save-fundraiser-btn donate-later-btn btn-website">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-bookmark-plus" viewBox="0 0 16 16">
                            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4"/>
                        </svg>
                    </button>
                    <div class="donation-bar">
                        <div class="donation-scale">
                            <div class="donation-progress" style="width: ${fundraiser.progress_percentage || 0}%;"></div>
                        </div>
                        <div class="donation-money-number">
                            <div class="money" data-goal="${fundraiser.fundraiser_target_amount || fundraiser.target_amount}">
                                $${(fundraiser.fundraiser_collected_amount || 0).toLocaleString()} / $${(fundraiser.fundraiser_target_amount || fundraiser.target_amount || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
                <a class="donate-btn btn-website" href="/fundraiser/${fundraiser.fundraiser_id}" data-i18n="categoryDonateBtnTgt">Donate</a>
            </div>
        </div>
    `).join('');
}

// Helper to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

/**
 * Update pagination UI for category
 */
function updateCategoryPaginationUI(currentPage, totalPages) {
    const paginationDiv = document.querySelector('.category-pagination');
    if (!paginationDiv) return;

    const prevBtn = paginationDiv.querySelector('.prev-page-btn');
    const nextBtn = paginationDiv.querySelector('.next-page-btn');
    const pageInfo = paginationDiv.querySelector('.page-info');

    if (prevBtn) {
        prevBtn.disabled = (currentPage <= 1);
        prevBtn.dataset.page = currentPage - 1;
    }
    if (nextBtn) {
        nextBtn.disabled = (currentPage >= totalPages);
        nextBtn.dataset.page = currentPage + 1;
    }
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

/**
 * Load a specific page for the category and replace the fundraisers container
 */
async function loadCategoryPage(page) {
    const paginationDiv = document.querySelector('.category-pagination');
    const prevBtn = paginationDiv?.querySelector('.prev-page-btn');
    const nextBtn = paginationDiv?.querySelector('.next-page-btn');
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;

    try {
        const categoryId = paginationDiv?.dataset.categoryId;
        if (!categoryId) throw new Error('Category ID not found');

        const url = `/categories/${categoryId}/load-more?page=${page}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const container = document.querySelector('.fundraisers-boxes');
        
        if (container && data.fundraisers) {
            // Replace content
            container.innerHTML = renderCategoryFundraiserCards(data.fundraisers);
            // Re-attach any event listeners if needed (save buttons are delegated)
        }

        // Update pagination UI
        updateCategoryPaginationUI(data.currentPage, data.totalPages);

    } catch (error) {
        console.error('Error loading category page:', error);
        // Optionally show an error message
    } finally {
        if (prevBtn && !prevBtn.disabled) prevBtn.disabled = false;
        if (nextBtn && !nextBtn.disabled) nextBtn.disabled = false;
    }
}

/**
 * Initialize pagination event listeners for category page
 */
function initializeCategoryPagination() {
    const prevNextButtons = document.querySelectorAll('.category-pagination .prev-page-btn, .category-pagination .next-page-btn');
    prevNextButtons.forEach(btn => {
        btn.removeEventListener('click', categoryPaginationHandler);
        btn.addEventListener('click', categoryPaginationHandler);
    });
}

function categoryPaginationHandler(e) {
    const btn = e.currentTarget;
    const page = parseInt(btn.dataset.page);
    if (isNaN(page)) return;
    loadCategoryPage(page);
}

// Modify DOMContentLoaded to include pagination initialization
// Find your existing DOMContentLoaded (the one that sets up help button, etc.) and add:
// initializeCategoryPagination();

document.addEventListener('DOMContentLoaded', function() {
    initializeCategoryPagination();
});