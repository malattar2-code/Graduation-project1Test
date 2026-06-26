// Get authentication data from data attributes and immediately remove the element
const authDataElement = document.getElementById('auth-data');
let isAuthenticated = false;
let currentUser = null;
let isLogoutRedirect = false;
let isLogoutError = false;

if (authDataElement) {
    isAuthenticated = authDataElement.getAttribute('data-is-authenticated') === 'true';
    currentUser = JSON.parse(authDataElement.getAttribute('data-user') || 'null');
    isLogoutRedirect = authDataElement.getAttribute('data-is-logout-redirect') === 'true';
    isLogoutError = authDataElement.getAttribute('data-is-logout-error') === 'true';
    
    // Immediately remove the element from DOM
    authDataElement.remove();
}

// The rest of your code remains the same...
// Store in sessionStorage for client-side access
if (isAuthenticated && currentUser) {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userType', currentUser.user_type || '');
    sessionStorage.setItem('userImage', currentUser.user_image || '');
    sessionStorage.setItem('uid', currentUser.uid || '');
} else {
    // Clear session storage when not authenticated
    sessionStorage.setItem('isAuthenticated', 'false');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('userImage');
    sessionStorage.removeItem('uid');
}

// ✅ NEW: Global variable to track if we should allow button interactions
let allowButtonInteractions = true;

function handleButtonClick(event, actionUrl) {
    // ✅ Check if we should allow this interaction (false after logout)
    if (!allowButtonInteractions) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    
    if (!isAuthenticated) {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = '/register';
        return false;
    }
    return true;
}

// Function to handle fundraiser interactions
function handleFundraiserAction(event, fundraiserId, actionType) {
    // ✅ Check if we should allow this interaction
    if (!allowButtonInteractions) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    
    if (!isAuthenticated) {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = '/register';
        return false;
    }
    return true;
}

// Function to handle fundraiser account clicks
function handleFundraiserAccountClick(event, userId) {
    event.stopPropagation(); // Prevent event bubbling
    
    // ✅ Check if we should allow this interaction
    if (!allowButtonInteractions) {
        event.preventDefault();
        return false;
    }
    
    if (!isAuthenticated) {
        event.preventDefault();
        window.location.href = '/register';
        return false;
    }
    
    // If authenticated, proceed to the user account page
    window.location.href = `/indigent-account/${userId}`;
    return true;
}

// Function to handle save fundraiser clicks
function handleSaveFundraiser(event, fundraiserId) {
    event.preventDefault();
    event.stopPropagation();
    
    // ✅ Check if we should allow this interaction
    if (!allowButtonInteractions) {
        return false;
    }
    
    if (!isAuthenticated) {
        window.location.href = '/register';
        return false;
    }
    
    // If authenticated, the existing save fundraiser logic will handle it
    return true;
}

// Enhanced global click handler for all interactive elements
function setupGlobalAuthHandlers() {
    console.log('Setting up global auth handlers...');
    
    // ✅ If this is a logout redirect, disable button interactions temporarily
    if (isLogoutRedirect && !isAuthenticated) {
        console.log('🔄 Logout detected - temporarily disabling button redirects');
        allowButtonInteractions = false;
        
        // Re-enable interactions after a short delay
        setTimeout(() => {
            allowButtonInteractions = true;
            console.log('✅ Button interactions re-enabled');
        }, 1000);
    }
    
    // Handle control panel button specifically
    const controlPanelBtn = document.getElementById('controlPanelBtn');
    if (controlPanelBtn) {
        controlPanelBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // ✅ Check if we should allow this interaction
            if (!allowButtonInteractions) {
                return;
            }

            // Get userType from sessionStorage
            const userType = sessionStorage.getItem('userType');

            if (!userType) {
                window.location.href = "/register";
                return;
            }

            // Redirect based on userType
            if (userType === "superadmin") {
                window.location.href = "/admin";
            } else if (userType === "requester") {
                window.location.href = "/userPanelIndigent";
            } else if (userType === "donor") {
                window.location.href = "/UserPanelDonor";
            } else {
                console.log('User type not recognized:', userType);
                window.location.href = "/register";
            }
        });
    }
    
    // Handle all buttons with btn-website class
    document.querySelectorAll('.btn-website').forEach(button => {
        if (!button.hasAttribute('data-no-auth')) {
            button.addEventListener('click', function(e) {
                if (e.defaultPrevented) return;
                
                // ✅ Check if we should allow this interaction
                if (!allowButtonInteractions) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                const href = this.getAttribute('href');
                const requiresAuth = href && (
                    href.includes('/fundraiser/') || 
                    href.includes('/donate') ||
                    href.includes('/indigent-account/') ||
                    href.includes('/userPanelIndigent') ||
                    href.includes('/create-fundraiser') ||
                    this.classList.contains('save-fundraiser-btn') ||
                    this.classList.contains('donate-btn') ||
                    this.classList.contains('main-donate-btn')
                );
                
                if (requiresAuth && !isAuthenticated) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = '/register';
                    return false;
                }
            });
        }
    });

    // Handle fundraiser box clicks
    document.querySelectorAll('[data-fundraiser-id]').forEach(box => {
        if (!box.hasAttribute('data-auth-handled')) {
            box.setAttribute('data-auth-handled', 'true');
            box.style.cursor = 'pointer';
            box.addEventListener('click', function(e) {
                // Don't intercept if clicking on interactive elements inside the box
                if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.fundraiser-account')) {
                    return;
                }
                
                // ✅ Check if we should allow this interaction
                if (!allowButtonInteractions) {
                    e.preventDefault();
                    return;
                }
                
                if (!isAuthenticated) {
                    e.preventDefault();
                    window.location.href = '/register';
                    return;
                }
                
                const fundraiserId = this.getAttribute('data-fundraiser-id');
                if (fundraiserId && isAuthenticated) {
                    window.location.href = `/fundraiser/${fundraiserId}`;
                }
            });
        }
    });

    // Handle specific fundraiser account elements
    document.querySelectorAll('.fundraiser-account').forEach(accountElement => {
        if (!accountElement.hasAttribute('data-auth-handled')) {
            accountElement.setAttribute('data-auth-handled', 'true');
            accountElement.addEventListener('click', function(e) {
                // If this element doesn't have an onclick handler, add default behavior
                if (!this.getAttribute('onclick')) {
                    // ✅ Check if we should allow this interaction
                    if (!allowButtonInteractions) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    
                    const userId = this.closest('[data-fundraiser-id]')?.dataset.fundraiserId;
                    if (userId && !isAuthenticated) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = '/register';
                    }
                }
            });
        }
    });
}

// Initialize when DOM is loaded - WITH ERROR HANDLING
document.addEventListener('DOMContentLoaded', function() {
    try {
        setupGlobalAuthHandlers();
    } catch (error) {
        console.error('Error setting up auth handlers:', error);
    }
});
//__________________________________________________________________________________________________________________________________
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
        // تأكد من وجود العنصر قبل تهيئة Owl Carousel
        if ($(".owl-carousel").length) {
            $(".owl-carousel").owlCarousel({
                loop: true,
                items: 1,
                responsive: {
                    768: {
                        items: 3
                    }
                },
                autoplay: true,
                autoplayTimeout: 5000,
                autoplayHoverPause: true
            });
            console.log('Owl Carousel initialized successfully');
        } else {
            console.warn('Owl Carousel element not found');
        }
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
                            //____________________________________
                            "donateWindowTitleTgt": "Choose your payment method and specify the amount you intend to donate.",
                            "donateWindowAmountTgt": "Amount",
                            "donateWindowConfirmBtnTgt": "Confirm Donate",
                            //____________________________________
                            "mostFundraisersTitleTgt": "The Most Interactions Fundraisers",
                            "mostFundraisersMoreBtnTgt": "More Fundraisers",
                            "mostFundraisersDonateBtnTgt": "Donate Now",
                            "addFundraiserBtnTgt": "Add Fundraisers",
                            //____________________________________
                            "almostCompleteFundraisersTitleTgt": "Almost Complete Fundraisers",
                            "almostCompleteFundraisersDonateBtnTgt": "Donate",
                            //_____________________________________
                            "applicationFundraisersTitleTgt": "Fundraisers In The Application",
                            "applicationFundraisersDetailsBtnTgt": "More Details",
                            "applicationFundraisersUrgentTgt": "Urgent",
                            //_____________________________________
                            "topDonorTitleTgt": "Our Top",
                            "topDonorTitleSpanTgt": "Donors",
                            "topDonorContentTitleTgt": "Donate And Get",
                            "topDonorContenTitleSpanTgt": "Valuable Rewards",
                            //_____________________________________
                            "topCategoriesOneTgt": "Education",
                            "topCategoriesTwoTgt": "Disabilities",
                            "topCategoriesThreeTgt": "Health Care",
                            "topCategoriesFourTgt": "Poverty",
                            "topCategoriesFiveTgt": "Environment",
                            "topCategoriesSixTgt": "Orphans",
                            "topCategoriesTitleTgt": "Our Top",
                            "topCategoriesTitleSpanTgt": "Categories",
                            "topCategoriesDescriptionOneTgt": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quaerat dolores placeat laboriosam esse culpa. Minus, consequuntur nam! Blanditiis deserunt vel illo doloribus iure.",
                            "topCategoriesDescriptionTwoTgt": "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Recusandae maiores tempora magnam eveniet similique, rem ipsum delectus laboriosam ad quo esse soluta cum quidem iusto aspernatur, vero, iste odio alias!",
                            "topCategoriesBtnTgt": "See All Categories",
                            //______________________________________
                            "mobileAppTitleTgt": "Mobile App",
                            "mobileAppSubTitleTgt": "To find fundraisers near you and suitable for you",
                            "mobileAppDescriptionTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Amet eligendi doloribus optio reiciendis quaerat quidem deleniti aliquid voluptas assumenda incidunt Amet eligendi doloribus optio reiciendis quaerat quidem deleniti aliquid.",
                            "mobileAppDescriptionOneTgt": "Download the App and Make",
                            "mobileAppDescriptionTwoTgt": "Someone Happy",
                            //______________________________________
                            "aboutAndFaqTitleOneTgt": "An",
                            "aboutAndFaqTitleTwoTgt": "Overview",
                            "aboutAndFaqTitleThreeTgt": "Of Our Website And",
                            "aboutAndFaqTitleFourTgt": "FAQ",
                            "aboutAndFaqTitleFiveTgt": "About It",
                            "aboutTitleTgt": "About Us",
                            "aboutDescriptionTgt": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quaerat dolores placeat laboriosam esse culpa. Minus, consequuntur nam! Blanditiis deserunt vel illo doloribus iure consectetur adipisicing elit. Quaerat dolores placeat laboriosam esse culpa Minus.",
                            "aboutBtnTgt": "Start Now",
                            "faqTitleTgt": "Most Frequently Asked Questions",
                            "faqBtnTgt": "More FAQ",
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
                            //_____________________________________
                            "donateWindowTitleTgt": "اختر طريقة الدفع الخاصة بك وحدد المبلغ الذي تنوي التبرع به.",
                            "donateWindowAmountTgt": "المبلغ",
                            "donateWindowConfirmBtnTgt": "تأكيد التبرع",
                            //_____________________________________
                            "mostFundraisersTitleTgt": "أكثر حملات جمع التبرعات تفاعلاً",
                            "mostFundraisersMoreBtnTgt": "المزيد من الحملات",
                            "mostFundraisersDonateBtnTgt": "تبرع الآن",
                            "addFundraiserBtnTgt": "إضافة حملات تبرع",
                            //_____________________________________
                            "almostCompleteFundraisersTitleTgt": "حملات جمع التبرع شبه المكتملة",
                            "almostCompleteFundraisersDonateBtnTgt": "التبرع",
                            //_____________________________________
                            "applicationFundraisersTitleTgt": "حملات جمع التبرع على التطبيق",
                            "applicationFundraisersDetailsBtnTgt": "التفاصيل",
                            "applicationFundraisersUrgentTgt": "عاجل",
                            //_____________________________________
                            "topDonorTitleTgt": "أفضل",
                            "topDonorTitleSpanTgt": "المتبرعين",
                            "topDonorContentTitleTgt": "تبرع واحصل على ",
                            "topDonorContenTitleSpanTgt": "مكافئات قيّمة",
                            //_____________________________________
                            "topCategoriesOneTgt": "التعليم",
                            "topCategoriesTwoTgt": "الإحتياجات الخاصة",
                            "topCategoriesThreeTgt": "الرعاية الصحية",
                            "topCategoriesFourTgt": "الفقر",
                            "topCategoriesFiveTgt": "البيئة",
                            "topCategoriesSixTgt": "الأيتام",
                            "topCategoriesTitleTgt": "الاكثر تفاعلا من",
                            "topCategoriesTitleSpanTgt": "تصنيفاتنا",
                            "topCategoriesDescriptionOneTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف",
                            "topCategoriesDescriptionTwoTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.",
                            "topCategoriesBtnTgt": "المزيد من التصنيفات",
                            //______________________________________
                            "mobileAppTitleTgt": "تطبيق الهاتف",
                            "mobileAppSubTitleTgt": "للعثور على حملات التبرع القريبة منك والمناسبة لك",
                            "mobileAppDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.",
                            "mobileAppDescriptionOneTgt": "قم بتنزيل التطبيق",
                            "mobileAppDescriptionTwoTgt": "وأسعد شخصًا ما",
                            //______________________________________
                            "aboutAndFaqTitleOneTgt": "فكرة",
                            "aboutAndFaqTitleTwoTgt": "وماهية",
                            "aboutAndFaqTitleThreeTgt": "الموقع وبعض",
                            "aboutAndFaqTitleFourTgt": "الأسئلة الشائعة",
                            "aboutAndFaqTitleFiveTgt": "حوله",
                            "aboutTitleTgt": "نبذة عنا",
                            "aboutDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف.",
                            "aboutBtnTgt": "أبدأ الآن",
                            "faqTitleTgt": "أكثر الأسئلة الشائعة المتكررة",
                            "faqBtnTgt": "المزيد من الأسئلة",
                            //______________________________________
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

//_________________________________________________________________________________________________________________________________________________________________


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


//_________________________________________________________________________________________________________________________________________________________________
let carouselItem = document.getElementById("div.carousel-item");
let headerBg = document.getElementById("header-sec");
let pos;
document.addEventListener("mousemove", ({pageX, pageY}) => {
    pos = `(${pageX}, ${pageY})`;
    
});

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header.header-sec');
    const carousel = document.querySelector('.owl-carousel');
    
    if (!header || !carousel) return;
    
    // Update header background based on active carousel item
    function updateHeaderBackground() {
        const activeItem = document.querySelector('.carousel-item.active');
        if (!activeItem) return;
        
        // Get background from active item
        const bgImage = activeItem.style.backgroundImage;
        const bgColor = activeItem.style.backgroundColor;
        
        // Apply to header
        if (bgImage) {
            header.style.backgroundImage = bgImage;
            header.style.backgroundColor = '';
        } else if (bgColor) {
            header.style.backgroundColor = bgColor;
            header.style.backgroundImage = '';
        }
    }
    
    // Update pagination indicators based on active carousel item
    function updatePagination() {
        // First remove ALL active classes from ALL pagination elements
        document.querySelectorAll('.p-three, .p-four, .p-five, .p-six').forEach(el => {
            el.classList.remove('active');
        });
    
        const activeItem = document.querySelector('.carousel-item.active');
        if (!activeItem) return;
    
        // Determine which pagination elements should be active
        let targetPaginationClass;
        if (activeItem.classList.contains('item-three')) {
            targetPaginationClass = 'p-three';
        } else if (activeItem.classList.contains('item-four')) {
            targetPaginationClass = 'p-four';
        } else if (activeItem.classList.contains('item-five')) {
            targetPaginationClass = 'p-five';
        } else if (activeItem.classList.contains('item-six')) {
            targetPaginationClass = 'p-six';
        }
    
        // Add active class to ALL matching pagination elements
        if (targetPaginationClass) {
            document.querySelectorAll(`.${targetPaginationClass}`).forEach(el => {
                el.classList.add('active');
            });
        }
    }
    
    // Detect active carousel item
    function checkActiveItem() {
        const containerRect = carousel.getBoundingClientRect();
        const targetPosition = containerRect.left + containerRect.width / 2;
        
        document.querySelectorAll('.carousel-item').forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            
            if (Math.abs(itemCenter - targetPosition) < 10) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update both header and pagination
        updateHeaderBackground();
        updatePagination();
    }
    
    // Debounce function for performance
    const debounce = (func, delay) => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(func, delay);
        };
    };
    
    // Initial setup
    checkActiveItem();
    
    // Event listeners
    const debouncedCheck = debounce(checkActiveItem, 500);
    window.addEventListener('scroll', debouncedCheck);
    window.addEventListener('resize', debouncedCheck);
    
    // MutationObserver for carousel changes
    new MutationObserver(debouncedCheck)
        .observe(carousel, { attributes: true, childList: true, subtree: true });
    
    // Optional: Click handlers for pagination elements
    document.querySelectorAll('[class^="p-"]').forEach(pagination => {
        pagination.addEventListener('click', function() {
            const targetClass = this.className.match(/p-(\w+)/)[1];
            const targetItem = document.querySelector(`.item-${targetClass}`);
            if (targetItem) {
                // Scroll to the target item
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });
    });
});


//________________________________________________________________________________________________________________________-
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

//______________________________________________________________________________________________________________________
// بيانات المستخدم (يجب استبدالها بالبيانات الفعلية)
  // يمكن أن يكون: "donor", "requester", أو غير معرّف
  const userType = sessionStorage.getItem("userType");
  const buttonsContainer = document.getElementById('buttons-container');

  if (!userType || userType === "donor" || userType === "superadmin") {
      // عرض زر التبرع إذا لم يكن UserType معرّف أو إذا كان donor
      buttonsContainer.innerHTML = '<a href="/all-fundraisers" class="btn-website" data-i18n="mostFundraisersDonateBtnTgt" id="donate">Donate Now</a>' 
  } else if (userType === "requester") {
      // عرض زر إضافة صندوق إذا كان requester
      buttonsContainer.innerHTML = '<a href="/userPanelIndigent" class="btn-website" data-i18n="addFundraiserBtnTgt" id="AddNewRequest">Add Fundraisers</a>';
  }

//_______________________________________________________________________________________________________________________
// Simple toast notification function
function showToast(message, type = 'info') {
const toast = document.createElement('div');
toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    transition: opacity 0.3s;
    background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
`;
toast.textContent = message;
document.body.appendChild(toast);

setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
}, 3000);
}

// Show logout success message
if (isLogoutRedirect && !isAuthenticated) {
showToast('You have been logged out successfully', 'success');
}

//__________________________________________________________________________________________
document.getElementById("FundraisersDrop").addEventListener("click", (e) => {
    e.preventDefault();

    // نجرب نجيب userType من sessionStorage
    const userType = sessionStorage.getItem("userType");

    if (!userType) {
        // 👈 إذا ما في userType => مش مسجل دخول
        window.location.href = "/register";
        return;
    }

    // ✅ إذا مسجل دخول، نوجه حسب userType
    
        window.location.href = "/all-fundraisers";
});

//______________________________________________________________________________________________

document.getElementById("CategoriesDrop").addEventListener("click", (e) => {
    e.preventDefault();

    // نجرب نجيب userType من sessionStorage
    const userType = sessionStorage.getItem("userType");

    if (!userType) {
        // 👈 إذا ما في userType => مش مسجل دخول
        window.location.href = "/register";
        return;
    }

    // ✅ إذا مسجل دخول، نوجه حسب userType
    
        window.location.href = "/categories";

});

//______________________________________________________________________________________________

document.getElementById("Contact_UsDrop").addEventListener("click", (e) => {
    e.preventDefault();

    // نجرب نجيب userType من sessionStorage
    const userType = sessionStorage.getItem("userType");

    if (!userType) {
        // 👈 إذا ما في userType => مش مسجل دخول
        window.location.href = "/register";
        return;
    }

    // ✅ إذا مسجل دخول، نوجه حسب userType
    
        window.location.href = "/faq ";
    
});