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
//_______________________________________________________________________________________
// fundraiser.js - Updated for dynamic data
document.addEventListener('DOMContentLoaded', function() {
    // Initialize fundraiser animations
    initFundraiserAnimations();
});

function initFundraiserAnimations() {
    console.log('🎯 Initializing fundraiser animations...');
    
    const moneyElement = document.querySelector(".money");
    const maxGoalElement = document.querySelector(".max-goal");
    const progressBar = document.querySelector(".donation-progress");
    const donationMoneyNumber = document.querySelector(".donation-money-number");

    // Debug: Log all elements and their values
    console.log('🔍 Element Debug:', {
        moneyElement: {
            exists: !!moneyElement,
            text: moneyElement?.textContent,
            parsed: moneyElement ? parseFloat(moneyElement.textContent.replace(/,/g, '')) : 'N/A'
        },
        maxGoalElement: {
            exists: !!maxGoalElement,
            dataset: maxGoalElement?.dataset,
            max: maxGoalElement ? parseFloat(maxGoalElement.dataset.max) : 'N/A'
        },
        progressBar: {
            exists: !!progressBar,
            currentStyle: progressBar ? progressBar.style.height : 'N/A'
        },
        donationMoneyNumber: {
            exists: !!donationMoneyNumber
        }
    });

    if (!moneyElement || !maxGoalElement || !progressBar) {
        console.error('❌ Required elements missing');
        return;
    }

    // FIX: Handle Arabic numerals and clean the text
    const initialCollected = parseFundraiserAmount(moneyElement.textContent);
    const maxGoal = parseFloat(maxGoalElement.dataset.max) || 0;

    console.log('📊 Progress Calculation:', {
        collected: initialCollected,
        goal: maxGoal,
        percentage: maxGoal > 0 ? (initialCollected / maxGoal) * 100 : 0
    });

    // Force update progress bar
    setTimeout(() => {
        updateProgressBar(initialCollected, maxGoal, progressBar, donationMoneyNumber);
    }, 100);
}

// NEW FUNCTION: Parse fundraiser amount with Arabic numeral support
function parseFundraiserAmount(amountText) {
    if (!amountText) return 0;
    
    // Clean the text: remove whitespace, newlines, and normalize
    let cleanedText = amountText.trim().replace(/\s+/g, '');
    
    // Convert Arabic numerals to Western numerals
    cleanedText = convertArabicNumerals(cleanedText);
    
    // Remove any non-numeric characters except decimal point
    cleanedText = cleanedText.replace(/[^\d.]/g, '');
    
    const parsed = parseFloat(cleanedText);
    return isNaN(parsed) ? 0 : parsed;
}

// NEW FUNCTION: Convert Arabic numerals to Western numerals
function convertArabicNumerals(text) {
    const arabicToWestern = {
        '٠': '0', '۰': '0',
        '١': '1', '۱': '1', 
        '٢': '2', '۲': '2',
        '٣': '3', '۳': '3',
        '٤': '4', '۴': '4',
        '٥': '5', '۵': '5',
        '٦': '6', '۶': '6',
        '٧': '7', '۷': '7',
        '٨': '8', '۸': '8',
        '٩': '9', '۹': '9'
    };
    
    return text.split('').map(char => arabicToWestern[char] || char).join('');
}
function determineIncrement(goal) {
    if (goal >= 0 && goal <= 1000) {
        return 3;
    } else if (goal >= 1001 && goal <= 3000) {
        return 5;
    } else if (goal >= 3001 && goal <= 5000) {
        return 8;
    } else if (goal >= 5001 && goal <= 10000) {
        return 12;
    } else {
        return 15;
    }
}

function startCountAnimation(el, currentAmount, goal) {
    // If already at or above goal, no need to animate
    if (currentAmount >= goal) {
        el.textContent = goal.toLocaleString();
        return;
    }

    let increment = determineIncrement(goal);
    let count = setInterval(() => {
        let currentValue = parseInt(el.textContent.replace(/,/g, '')) || 0;
        let newValue = currentValue + increment;
        
        // Format number with commas for thousands
        el.textContent = newValue.toLocaleString();
        
        if (newValue >= goal) {
            el.textContent = goal.toLocaleString();
            clearInterval(count);
        }
    }, 100 / (goal / increment));
}

function updateProgressBar(currentAmount, maxGoal, progressBar, donationMoneyNumber) {
    if (!maxGoal || maxGoal === 0) {
        console.warn('Max goal is zero or undefined');
        return;
    }

    // Calculate progress percentage
    let progressPercentage = (currentAmount / maxGoal) * 100;
    
    // Ensure progress doesn't exceed 100%
    progressPercentage = Math.min(progressPercentage, 100);
    
    // Ensure progress is at least 0%
    progressPercentage = Math.max(progressPercentage, 0);

    console.log('📊 Progress update:', {
        currentAmount,
        maxGoal,
        progressPercentage
    });

    // Update progress bar height
    if (progressBar) {
        progressBar.style.height = `${progressPercentage}%`;
        console.log('✅ Progress bar height set to:', progressBar.style.height);
    } else {
        console.error('❌ Progress bar element not found');
    }

    // Update donation money number position
    if (donationMoneyNumber) {
        updateMoneyNumberPosition(progressPercentage, donationMoneyNumber);
    }
}

function updateMoneyNumberPosition(progressPercentage, donationMoneyNumber) {
    // Calculate vertical position based on progress
    // Adjust these values based on your design
    const startTop = 230;  // Starting position (adjust as needed)
    const endTop = -20;    // Ending position (adjust as needed)
    const newTop = startTop + (endTop - startTop) * (progressPercentage / 100);

    donationMoneyNumber.style.top = `${newTop}px`;
}

function setupProgressObserver(currentAmount, maxGoal, progressBar, donationMoneyNumber) {
    const moneyElement = document.querySelector(".money");
    
    if (!moneyElement) return;

    // Observer for manual updates to money element
    let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                let newAmount = parseInt(moneyElement.textContent.replace(/,/g, '')) || 0;
                updateProgressBar(newAmount, maxGoal, progressBar, donationMoneyNumber);
            }
        });
    });

    // Start observing
    observer.observe(moneyElement, { 
        childList: true, 
        subtree: true,
        characterData: true 
    });
}

// Real-time updates function (optional)
function startRealTimeUpdates(fundraiserId) {
    // Update every 30 seconds to get latest donation data
    setInterval(async () => {
        try {
            const response = await fetch(`/api/fundraiser-data/${fundraiserId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    updateFundraiserData(result.data);
                }
            }
        } catch (error) {
            console.error('Error fetching real-time data:', error);
        }
    }, 30000); // 30 seconds
}

function updateFundraiserData(data) {
    const moneyElement = document.querySelector(".money");
    const progressBar = document.querySelector(".donation-progress");
    const donationMoneyNumber = document.querySelector(".donation-money-number");
    const maxGoalElement = document.querySelector(".max-goal");

    if (moneyElement && maxGoalElement) {
        const currentAmount = parseInt(moneyElement.textContent.replace(/,/g, '')) || 0;
        const newAmount = data.collectedAmount;
        const maxGoal = parseInt(maxGoalElement.dataset.max);

        // Only update if amount changed significantly
        if (Math.abs(newAmount - currentAmount) > 1) {
            moneyElement.textContent = newAmount.toLocaleString();
            updateProgressBar(newAmount, maxGoal, progressBar, donationMoneyNumber);
        }
    }
}

// Export functions for global access (if needed)
window.fundraiserAnimations = {
    init: initFundraiserAnimations,
    updateProgress: updateProgressBar,
    startRealTimeUpdates: startRealTimeUpdates
};
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
//____________________________________________________________________________________________________________
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
                            "complaintTitleTgt": "Enter the problem you are facing",
                            "complaintLabelTgt": "Enter A Problem",
                            "complaintBtnTgt": "Send",
                            //________________________________________
                            "fundraiserCategoriesOneTgt": "environment",
                            "fundraiserCategoriesTwoTgt": "poverty",
                            "fundraiserCategoriesThreeTgt": "gaza",
                            "fundraiserCategoriesFourTgt": "health care",
                            "fundraiserGoalTitleTgt": "Fundraiser Goal :",
                            "fundraiserDonateBtnTgt": "Donate Now",
                            "fundraiserDonateBtnIndigentTgt": "Indigent Does Not Donate",
                            "fundraiserDescriptionTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores quibusdam unde accusantium minima vitae similique a. Enim eum saepe consequuntur error, beatae veritatis ipsum quo, amet, nulla nobis facilis corporis Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus numquam accusantium fugiat? Cumque voluptatibus aliquid voluptates harum animi illum in sit, possimus, facere consequatur maiores numquam assumenda ducimus ex repellat? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Enim ullam blanditiis est praesentium quod odit, dolores inventore alias beatae laborum labore fugiat adipisci et sequi.",
                            //________________________________________
                            "fundraiserCommentTitleTgt": "Add a comment",
                            "fundraiserCommentDescriptionTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            "fundraiserCommentLabelTgt": "Type A comment",
                            "fundraiserCommentBtnTgt": "Submit",
                            "fundraiserCommentSubTitleTgt": "Comments",
                            "fundraiserCommentLikeTgt": "Like",
                            "fundraiserCommentReplyTgt": "Reply",
                            "fundraiserCommentTimeTgt": "4d",
                            "fundraiserCommentReplyBtnTgt": "Post Reply",
                            //________________________________________
                            "fundraiserMoreFundraisersTitleTgt": "More Fundraisers From AbOoD1",
                            "fundraiserSimilarFundraisersTitleTgt": "Similar Fundraisers Requests",
                            "fundraiserSameAreaFundraisersTitleTgt": "Fundraisers From The Same Area",
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
                            "complaintTitleTgt": "أدخل المشكلة التي تواجهك",
                            "complaintLabelTgt": "أدخل المشكلة",
                            "complaintBtnTgt": "أرسل",
                            //________________________________________
                            "fundraiserCategoriesOneTgt": "البيئة",
                            "fundraiserCategoriesTwoTgt": "الفقر",
                            "fundraiserCategoriesThreeTgt": "غزة",
                            "fundraiserCategoriesFourTgt": "الرعاية الصحية",
                            "fundraiserGoalTitleTgt": "هدف حملة التبرع :",
                            "fundraiserDonateBtnTgt": "تبرع الآن",
                            "fundraiserDonateBtnIndigentTgt": "المحتاج لا يتبرع",
                            "fundraiserDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربى مفيد لمصممي المواقع على وجه الخصوص، حيث يحتاج العميل فى كثير من الأحيان أن يطلع على صورة حقيقية لتصميم الموقع.",
                            //________________________________________
                            "fundraiserCommentTitleTgt": "أضف تعليقاً",
                            "fundraiserCommentDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى.",
                            "fundraiserCommentLabelTgt": "أكتب تعليقاً",
                            "fundraiserCommentBtnTgt": "أرسل",
                            "fundraiserCommentSubTitleTgt": "التعليقات",
                            "fundraiserCommentLikeTgt": "إعجاب",
                            "fundraiserCommentReplyTgt": "رد",
                            "fundraiserCommentTimeTgt": "4ي",
                            "fundraiserCommentReplyBtnTgt": "الرد",
                            //_________________________________________
                            "fundraiserMoreFundraisersTitleTgt": "AbOod1 المزيد من حملات التبرع من",
                            "fundraiserSimilarFundraisersTitleTgt": "حملات التبرع المشابهة",
                            "fundraiserSameAreaFundraisersTitleTgt": "حملات التبرع من نفس المنطقة",
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

//_______________________________________________________________________________________________________
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
// Get fundraiser ID from different possible locations
function getFundraiserId(button) {
    console.log('🔍 Looking for fundraiser ID...');
    
    // 1. Try to find fundraiser ID from parent elements with data-fundraiser-id
    const fundraiserBox = button.closest('[data-fundraiser-id]');
    if (fundraiserBox && fundraiserBox.dataset.fundraiserId) {
        console.log('✅ Found fundraiser ID from data attribute:', fundraiserBox.dataset.fundraiserId);
        return fundraiserBox.dataset.fundraiserId;
    }
    
    // 2. Try to find from URL in current page (for fundraiser detail page)
    const currentUrl = window.location.href;
    const urlMatch = currentUrl.match(/\/fundraiser\/(\d+)/);
    if (urlMatch) {
        console.log('✅ Found fundraiser ID from URL:', urlMatch[1]);
        return urlMatch[1];
    }
    
    // 3. Try to find from meta tag (if present)
    const metaFundraiserId = document.querySelector('meta[name="fundraiser-id"]');
    if (metaFundraiserId && metaFundraiserId.content) {
        console.log('✅ Found fundraiser ID from meta tag:', metaFundraiserId.content);
        return metaFundraiserId.content;
    }
    
    // 4. Try to find from hidden input (if present)
    const hiddenFundraiserId = document.querySelector('input[name="fundraiser-id"]');
    if (hiddenFundraiserId && hiddenFundraiserId.value) {
        console.log('✅ Found fundraiser ID from hidden input:', hiddenFundraiserId.value);
        return hiddenFundraiserId.value;
    }
    
    // 5. Try to find from donate button in current fundraiser section
    const donateBtn = button.closest('.fundraiser-btns')?.querySelector('.donate-btn, .main-donate-btn');
    if (donateBtn && donateBtn.href) {
        const match = donateBtn.href.match(/\/fundraiser\/(\d+)/);
        if (match) {
            console.log('✅ Found fundraiser ID from donate button:', match[1]);
            return match[1];
        }
    }
    
    // 6. Try to find from the closest fundraiser container
    const fundraiserContainer = button.closest('.fundraiser-container, .fundraiser-box, [id*="fundraiser"]');
    if (fundraiserContainer) {
        // Look for any element with fundraiser ID in this container
        const idElement = fundraiserContainer.querySelector('[data-fundraiser-id]');
        if (idElement) {
            console.log('✅ Found fundraiser ID from container:', idElement.dataset.fundraiserId);
            return idElement.dataset.fundraiserId;
        }
    }
    
    console.error('❌ Could not find fundraiser ID for button:', button);
    console.log('🔍 Available data attributes on button:', button.dataset);
    console.log('🔍 Parent elements:', {
        parent: button.parentElement?.tagName,
        grandparent: button.parentElement?.parentElement?.tagName
    });
    
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

//____________________________________________________________________________________________________



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

//________________________________________________________________________________________________________________________________________
// JavaScript for Comments Section
class CommentsManager {
    constructor() {
    this.currentPage = 1;
    // Get fundraiserId from data attribute
    const fundraiserDataElement = document.getElementById('fundraiser-data');
    this.fundraiserId = fundraiserDataElement ? fundraiserDataElement.dataset.fundraiserId : null;
    this.isLoading = false;
    this.init();
    }

    init() {
    this.bindEvents();
    this.loadComments(1);
    }

    bindEvents() {
    // Character counter with visual feedback
    const commentText = document.getElementById('commentText');
    commentText.addEventListener('input', this.handleCharacterCount.bind(this));
    
    // Form submission
    document.getElementById('commentForm').addEventListener('submit', this.handleCommentSubmit.bind(this));
    }

    handleCharacterCount(e) {
    const length = e.target.value.length;
    const counter = document.querySelector('.current-count');
    const counterContainer = document.querySelector('.character-counter');
    
    counter.textContent = length;
    
    // Visual feedback for character limit
    counterContainer.classList.remove('near-limit', 'over-limit');
    if (length > 450) {
        counterContainer.classList.add('near-limit');
    }
    if (length > 500) {
        counterContainer.classList.add('over-limit');
    }
    }

    // In your frontend JavaScript - Update the handleCommentSubmit method
    async handleCommentSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.comment-submit-btn');
    const commentText = document.getElementById('commentText').value.trim();
    
    if (!this.validateComment(commentText)) return;
    
    try {
        this.setLoadingState(submitBtn, true);
        
        const response = await fetch(`/api/fundraiser/${this.fundraiserId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fundraiser_id: this.fundraiserId,
            comment_text: commentText
        })
        });

        const data = await response.json();
        
        if (data.success) {
        this.resetForm();
        
        // ✅ Handle blocked comments
        if (data.is_blocked) {
            this.showNotification(data.message, 'warning');
        } else {
            this.showNotification('Comment added successfully!', 'success');
            await this.loadComments(1);
        }
        } else {
        throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        this.showNotification('Error submitting comment. Please try again.', 'error');
    } finally {
        this.setLoadingState(submitBtn, false);
    }
    }

    validateComment(commentText) {
    if (!commentText) {
        this.showNotification('Please enter a comment', 'error');
        return false;
    }
    if (commentText.length > 500) {
        this.showNotification('Comment exceeds 500 character limit', 'error');
        return false;
    }
    return true;
    }

    setLoadingState(button, isLoading) {
    this.isLoading = isLoading;
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
    }

    resetForm() {
    document.getElementById('commentText').value = '';
    document.querySelector('.current-count').textContent = '0';
    document.querySelector('.character-counter').classList.remove('near-limit', 'over-limit');
    }

    async loadComments(page = 1) {
    if (this.isLoading) return;
    
    try {
        this.setCommentsLoading(true);
        
        const response = await fetch(`/api/fundraiser/${this.fundraiserId}/comments?page=${page}&limit=10`);
        const data = await response.json();
        
        if (data.success) {
        this.displayComments(data.comments, page);
        this.updateCommentsCount(data.pagination?.total || data.comments.length);
        this.updateLoadMoreButton(data.pagination);
        } else {
        throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        this.showNotification('Error loading comments', 'error');
    } finally {
        this.setCommentsLoading(false);
    }
    }

    setCommentsLoading(isLoading) {
    const loadingElement = document.getElementById('commentsLoading');
    const container = document.getElementById('commentsContainer');
    
    if (isLoading) {
        loadingElement.style.display = 'flex';
        if (this.currentPage === 1) {
        container.style.display = 'none';
        }
    } else {
        loadingElement.style.display = 'none';
    }
    }

    displayComments(comments, page) {
    const container = document.getElementById('commentsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (page === 1) {
        container.innerHTML = '';
    }

    if (comments.length === 0 && page === 1) {
        emptyState.style.display = 'block';
        container.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'block';

    comments.forEach(comment => {
        const commentElement = this.createCommentElement(comment);
        container.appendChild(commentElement);
    });
    }

    createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.innerHTML = this.getCommentHTML(comment);
    
    this.bindCommentEvents(commentDiv, comment);
    return commentDiv;
    }

    getCommentHTML(comment) {
    return `
        <div class="comment-header">
        <img class="user-avatar" src="${comment.user.user_image}" alt="${comment.user.full_name}" 
            onerror="this.src='/assets/image/Fundraiser-Page/header-sec/girl-profile.png'">
        <div class="user-info">
            <h3 class="user-name">${this.escapeHtml(comment.user.full_name)}</h3>
            <span class="comment-time">${this.formatTimeAgo(comment.created_at)}</span>
        </div>
        </div>
        <div class="comment-content">${this.escapeHtml(comment.comment_text)}</div>
        <div class="comment-actions">
        <button class="action-btn reply-btn" data-comment-id="${comment.comment_id}">
            <span>Reply</span>
        </button>
        <span class="comment-time">${this.formatTimeAgo(comment.created_at)}</span>
        </div>
        <div class="reply-form" id="replyForm-${comment.comment_id}" style="display: none;">
        <textarea class="reply-input" placeholder="Write your reply..." maxlength="300"></textarea>
        <div class="reply-actions">
            <button class="btn-primary submit-reply" data-comment-id="${comment.comment_id}">
            Post Reply
            </button>
            <button class="btn-secondary cancel-reply" data-comment-id="${comment.comment_id}">
            Cancel
            </button>
        </div>
        </div>
        ${comment.replies && comment.replies.length > 0 ? `
        <div class="replies-container">
            <div class="replies-list" id="replies-${comment.comment_id}">
            ${comment.replies.map(reply => this.getReplyHTML(reply)).join('')}
            </div>
        </div>
        ` : ''}
    `;
    }

    getReplyHTML(reply) {
    return `
        <div class="comment reply">
        <div class="comment-header">
            <img class="user-avatar" src="${reply.user.user_image}" alt="${reply.user.full_name}" 
                onerror="this.src='/assets/image/Fundraiser-Page/header-sec/girl-profile.png'">
            <div class="user-info">
            <h3 class="user-name">${this.escapeHtml(reply.user.full_name)}</h3>
            <span class="comment-time">${this.formatTimeAgo(reply.created_at)}</span>
            </div>
        </div>
        <div class="comment-content">${this.escapeHtml(reply.comment_text)}</div>
        <div class="comment-actions">
            <span class="comment-time">${this.formatTimeAgo(reply.created_at)}</span>
        </div>
        </div>
    `;
    }

    bindCommentEvents(commentDiv, comment) {
    const replyBtn = commentDiv.querySelector('.reply-btn');
    const submitReplyBtn = commentDiv.querySelector('.submit-reply');
    const cancelReplyBtn = commentDiv.querySelector('.cancel-reply');
    
    if (replyBtn) {
        replyBtn.addEventListener('click', () => this.showReplyForm(comment.comment_id));
    }
    
    if (submitReplyBtn) {
        submitReplyBtn.addEventListener('click', () => this.submitReply(comment.comment_id));
    }
    
    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', () => this.hideReplyForm(comment.comment_id));
    }
    
    }

    showReplyForm(commentId) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    if (replyForm) {
        replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
    }
    }

    hideReplyForm(commentId) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    const replyInput = document.querySelector(`#replyForm-${commentId} .reply-input`);
    
    if (replyForm) {
        replyForm.style.display = 'none';
    }
    if (replyInput) {
        replyInput.value = '';
    }
    }

    // Also update the submitReply method
    async submitReply(commentId) {
    const replyInput = document.querySelector(`#replyForm-${commentId} .reply-input`);
    if (!replyInput) return;
    
    const replyText = replyInput.value.trim();
    
    if (!replyText) {
        this.showNotification('Please enter a reply', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/fundraiser/${this.fundraiserId}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fundraiser_id: this.fundraiserId,
            comment_text: replyText,
            parent_comment_id: commentId
        })
        });

        const data = await response.json();
        
        if (data.success) {
        this.hideReplyForm(commentId);
        
        // ✅ Handle blocked replies
        if (data.is_blocked) {
            this.showNotification(data.message, 'warning');
        } else {
            this.showNotification('Reply added successfully!', 'success');
            await this.loadComments(1); // Reload to show the new reply
        }
        } else {
        throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error submitting reply:', error);
        this.showNotification('Error submitting reply', 'error');
    }
    }
    
    updateCommentsCount(total) {
    const countElement = document.getElementById('commentsCount');
    if (countElement) {
        countElement.textContent = `(${total})`;
    }
    }

    updateLoadMoreButton(pagination) {
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (pagination && pagination.hasMore) {
        loadMoreContainer.style.display = 'block';
        loadMoreBtn.onclick = () => {
        this.currentPage++;
        this.loadComments(this.currentPage);
        };
    } else {
        loadMoreContainer.style.display = 'none';
    }
    }

    formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
    }

    escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    showNotification(message, type = 'info') {
    // You can implement a proper notification system here
    // For now, using alert as a fallback
    alert(message);
    }
}

// Initialize comments manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CommentsManager();
});