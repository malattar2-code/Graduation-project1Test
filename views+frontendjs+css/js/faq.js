// // Get all link items
// const linkItems = document.querySelectorAll('.list li');

// // Define the mapping between menu items and their corresponding content sections
// const contentMap = [
//   { menuClass: 'li-headline-about-site', contentClass: 'about-site-faq' },
//   { menuClass: 'li-headline-registration', contentClass: 'registration-faq' },
//   { menuClass: 'li-headline-donations', contentClass: 'add-fundraiser-sec' },
//   { menuClass: 'li-headline-fundraisers', contentClass: 'account-settings-sec' },
//   { menuClass: 'li-headline-receiving-donations', contentClass: 'payment-methods-settings-sec' },
//   { menuClass: 'li-headline-rewards-&-ranks', contentClass: 'payment-methods-settings-sec' },
//   { menuClass: 'li-headline-search', contentClass: 'payment-methods-settings-sec' },

// ];

// // Add click event listeners to each link item
// linkItems.forEach((item, index) => {
//   const btn = item.querySelector('a');
//   btn.addEventListener('click', () => {
//     // Remove active class from all menu items
//     linkItems.forEach(menuItem => {
//       menuItem.classList.remove('active-li');
//     });
    
//     // Hide all content sections
//     contentMap.forEach(content => {
//       const section = document.querySelector(`.${content.contentClass}`);
//       if (section) section.style.display = 'none';
//     });
    
//     // Add active class to the clicked menu item
//     item.classList.add('active-li');
    
//     // Show the corresponding content section
//     const activeContent = document.querySelector(`.${contentMap[index].contentClass}`);
//     if (activeContent) activeContent.style.display = 'block';
//   });
// });

// // Initialize first tab as active and show its content
// if (linkItems.length > 0) {
//   const firstContent = document.querySelector(`.${contentMap[0].contentClass}`);
//   if (firstContent) firstContent.style.display = 'block';
// }

//________________________________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
            const contact_btn = document.getElementById('contactBtn');
            const submit_complaint = document.getElementById('submitComplaint');
            
            // Toggle dropdown when button is clickedF
            contact_btn.addEventListener('click', function(e) {
                e.preventDefault();
                submit_complaint.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!contact_btn.contains(e.target) && !submit_complaint.contains(e.target)) {
                    submit_complaint.classList.remove('show');
                }
            });
        });

//______________________________________________________________________________________________________
document.addEventListener("DOMContentLoaded", () => {
  let inputBoxes = document.querySelectorAll(".input-box");

  inputBoxes.forEach((box) => {
    let inputField = box.querySelector("input");
    let textareaField = box.querySelector("textarea");
    let field = inputField || textareaField;

    if (field) {
      // Initialize field state
      if (field.value === '') {
        box.classList.remove('field-is-filled');
      } else {
        box.classList.add('field-is-filled');
      }

      // Focus event
      field.addEventListener("focus", () => {
        box.classList.add("input-box-active");
      });

      // Blur event
      field.addEventListener("blur", () => {
        setTimeout(() => {
          box.classList.remove("input-box-active");
        }, 300);
      });

      // Input event
      field.addEventListener("input", () => {
        if (field.value === '') {
          box.classList.remove('field-is-filled');
        } else {
          box.classList.add('field-is-filled');
        }
      });
    }

    // Special handling for textarea with character counter
    if (textareaField) {
      let signalNum = box.querySelector(".signal_num");
      
      textareaField.addEventListener("keyup", () => {
        let valLength = textareaField.value.length;
        signalNum.innerText = valLength;
        
        // Toggle active class
        if (valLength > 0) {
          box.classList.add("input-box-active");
        } else {
          box.classList.remove("input-box-active");
        }
        
        // Toggle error class
        if (valLength > 100) {
          box.classList.add("error");
        } else {
          box.classList.remove("error");
        }
      });
    }
  });
});

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
                            "faqTitleTgt": "Frequently Asked Questions(FAQ)",
                            "faqDescriptionTgt": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Culpa quas accusamus placeat at voluptatem id assumenda numquam cupiditate ab, molestiae quae tempore consectetur reiciendis voluptatum repellat corporis nesciunt soluta perferendis!",
                            "faqBtnTgt": "Contact Us",
                            //________________________________________
                            "complaintTitleTgt": "Enter the problem you are facing",
                            "complaintLabelTgt": "Enter A Problem",
                            "complaintBtnTgt": "Send",
                            //________________________________________
                            "faqHeadlineTitleOneTgt": "About Site",
                            "faqHeadlineTitleTwoTgt": "Registration",
                            "faqHeadlineTitleThreeTgt": "Donations",
                            "faqHeadlineTitleFourTgt": "Fundraisers",
                            "faqHeadlineTitleFiveTgt": "Receiving Donations",
                            "faqHeadlineTitleSixTgt": "Rewards & Ranks",
                            "faqHeadlineTitleSevenTgt": "Search",
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
                            "faqTitleTgt": "الأسئلة الشائعة والمتكررة",
                            "faqDescriptionTgt": "إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.",
                            "faqBtnTgt": "تواصل معنا",
                            //________________________________________
                            "complaintTitleTgt": "أدخل المشكلة التي تواجهك",
                            "complaintLabelTgt": "أدخل المشكلة",
                            "complaintBtnTgt": "أرسل",
                            //________________________________________
                            "faqHeadlineTitleOneTgt": "حول الموقع",
                            "faqHeadlineTitleTwoTgt": "التسجيل",
                            "faqHeadlineTitleThreeTgt": "التبرع",
                            "faqHeadlineTitleFourTgt": "حملات التبرع",
                            "faqHeadlineTitleFiveTgt": "استلام التبرعات",
                            "faqHeadlineTitleSixTgt": "المكافئات والرتب",
                            "faqHeadlineTitleSevenTgt": "البحث",
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

//_________________________________________________________________________________________

// public/js/faq.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('FAQ page loaded');
    
    // Initialize with the first active type
    const initialType = document.querySelector('.active-li')?.getAttribute('data-faq-type') || 'about';
    loadFAQsByType(initialType);
    
    // Add click event listeners to all FAQ type links
    const faqTypeLinks = document.querySelectorAll('.faq-headlines li');
    
    faqTypeLinks.forEach(li => {
        li.addEventListener('click', function() {
            const faqType = this.getAttribute('data-faq-type');
            
            // Update active state
            faqTypeLinks.forEach(item => item.classList.remove('active-li'));
            this.classList.add('active-li');
            
            // Load FAQs for selected type
            loadFAQsByType(faqType);
        });
    });
});

async function loadFAQsByType(type) {
    console.log('Loading FAQs for type:', type);
    
    const faqContent = document.getElementById('faqContent');
    if (!faqContent) return;
    
    // Show loading state
    faqContent.innerHTML = '<div class="loading-message"><p>Loading FAQs...</p></div>';
    
    try {
        const response = await fetch(`/faqs/type/${type}`);
        const result = await response.json();
        
        if (result.success) {
            displayFAQs(result.data, type);
        } else {
            throw new Error(result.message || 'Failed to load FAQs');
        }
    } catch (error) {
        console.error('Error loading FAQs:', error);
        faqContent.innerHTML = `
            <div class="error-message">
                <p>Error loading FAQs. Please try again later.</p>
            </div>
        `;
    }
}

function displayFAQs(faqs, type) {
    const faqContent = document.getElementById('faqContent');
    if (!faqContent) return;
    
    if (!faqs || faqs.length === 0) {
        faqContent.innerHTML = `
            <div class="no-faqs-message">
                <p>No FAQs found for this category.</p>
            </div>
        `;
        return;
    }
    
    // Generate FAQ HTML using your specific structure
    let faqHTML = '';
    
    faqs.forEach((faq, index) => {
        faqHTML += `
            <!-- Start Question -->
            <div class="question-box">
                <div class="question">
                    <h1>Q.${index + 1}</h1>
                    <h2>${faq.faq_question}</h2>
                </div>
                <div class="answer">
                    <h1>A.</h1>
                    <p>${faq.faq_answer}</p>
                </div>
            </div>
            <!-- End Question -->
        `;
        
        // Add split line except after the last question
        if (index < faqs.length - 1) {
            faqHTML += `<div class="split-line-sub"></div>`;
        }
    });
    
    faqContent.innerHTML = faqHTML;
}

// Optional: Add keyboard navigation
document.addEventListener('keydown', function(e) {
    const activeLi = document.querySelector('.active-li');
    if (!activeLi) return;
    
    const allItems = document.querySelectorAll('.faq-headlines li');
    const currentIndex = Array.from(allItems).indexOf(activeLi);
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % allItems.length;
        allItems[nextIndex].click();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + allItems.length) % allItems.length;
        allItems[prevIndex].click();
    }
});


//__________________________________________________________________________________________________________

// public/js/complaint.js
document.addEventListener('DOMContentLoaded', function() {
    const complaintForm = document.getElementById('complaintForm');
    const complaintContent = document.getElementById('complaint_content');
    const signalNum = document.querySelector('.signal_num');
    const complaintMessage = document.getElementById('complaintMessage');

    if (!complaintForm) return;

    // Character counter
    if (complaintContent && signalNum) {
        complaintContent.addEventListener('input', function() {
            const currentLength = this.value.length;
            signalNum.textContent = currentLength;
            
            // Optional: Change color when approaching limit
            if (currentLength > 900) {
                signalNum.style.color = '#ff6b6b';
            } else {
                signalNum.style.color = '';
            }
        });
    }

    // Form submission
    complaintForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        // Hide previous messages
        if (complaintMessage) {
            complaintMessage.style.display = 'none';
            complaintMessage.className = '';
        }

        try {
            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    complaint_content: complaintContent.value.trim()
                })
            });

            const result = await response.json();

            if (complaintMessage) {
                complaintMessage.style.display = 'block';
                complaintMessage.textContent = result.message;
                
                if (result.success) {
                    complaintMessage.className = 'success-message';
                    complaintForm.reset();
                    signalNum.textContent = '0';
                } else {
                    complaintMessage.className = 'error-message';
                }
            }

            if (result.success) {
                console.log('Complaint submitted successfully:', result.data);
            }

        } catch (error) {
            console.error('Error submitting complaint:', error);
            if (complaintMessage) {
                complaintMessage.style.display = 'block';
                complaintMessage.className = 'error-message';
                complaintMessage.textContent = 'Failed to submit complaint. Please try again.';
            }
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});

//_________________________________________________________________________________________________________________

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