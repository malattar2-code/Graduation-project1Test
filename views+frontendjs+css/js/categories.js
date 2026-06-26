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
                            "categorieTitleTgt": "Categories",
                            "categorieDescriptionTgt": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Culpa quas accusamus placeat at voluptatem id assumenda numquam cupiditate ab, molestiae quae tempore consectetur reiciendis voluptatum repellat corporis nesciunt soluta perferendis!",
                            //________________________________________
                            "categorieBoxTitleOneTgt": "Disabilities",
                            "categorieBoxTitleTwoTgt": "Education",
                            "categorieBoxTitleThreeTgt": "Health Care",
                            //________________________________________
                            "mostViewedCategorieTitleTgt": "Most Viewed Categories",
                            "mostViewedCategorieOneTitleTgt": "Disabilities",
                            "mostViewedCategorieTwoTitleTgt": "Education",
                            "mostViewedCategorieThreeTitleTgt": "Poverty",
                            "mostViewedCategorieFourTitleTgt": "Health Care",
                            //________________________________________
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
                            "categorieTitleTgt": "التصنيفات",
                            "categorieDescriptionTgt": "إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.",
                            //________________________________________
                            "categorieBoxTitleOneTgt": "ذوي الاحتياجات",
                            "categorieBoxTitleTwoTgt": "التعليم",
                            "categorieBoxTitleThreeTgt": "الرعاية الصحية",
                            //________________________________________
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

//_________________________________________________________________________________________________________________________
 // public/js/categories-display.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('Categories Display script loaded');
    
    // This page only displays categories, no form handling needed
    const categoriesContainer = document.getElementById('categoriesContainer');
    
    if (categoriesContainer) {
        console.log('Categories container found');
        // You can add any display-specific JavaScript here
        // For example: filtering, sorting, etc.
    }
});

//_________________________________________________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
    console.log('Categories Display script loaded');
    
    const categoriesContainer = document.getElementById('categoriesContainer');
    
    if (categoriesContainer) {
        // Add click event listeners to all category boxes
        const categoryBoxes = categoriesContainer.querySelectorAll('.categorie-box');
        
        categoryBoxes.forEach(box => {
            box.style.cursor = 'pointer'; // Show it's clickable
            box.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-category-id');
                const categoryName = this.querySelector('h2').textContent;
                
                console.log('Category clicked:', categoryName, 'ID:', categoryId);
                
                // Navigate to category details page
                window.location.href = `/category/${categoryId}`;
            });
        });

        // Optional: Add hover effects
        categoryBoxes.forEach(box => {
            box.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            box.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }
});

//_______________________________________________________________________________________

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