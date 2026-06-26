$(document).ready(function(){
    $(".owl-carousel").owlCarousel({
        loop: true,
        items: 1,
        responsive: {
            768: {
                items: 3
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

// ── Flash message ──────────────────────────────────────────────────────────────
function showFlashMessage(message, type = 'success') {
  const existingFlash = document.querySelector('.flash-message');
  if (existingFlash) existingFlash.remove();

  const flashDiv = document.createElement('div');
  flashDiv.className = `flash-message flash-${type}`;
  flashDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 300px;
    max-width: 90%;
    animation: slideDownFlashMessage 0.3s ease-out;
    ${type === 'success'
      ? 'background: #e8f5e8; border: 2px solid #4caf50; color: #2e7d32;'
      : type === 'warning'
      ? 'background: #fffbf0; border: 2px solid #ffc107; color: #856404;'
      : 'background: #ffebee; border: 2px solid #f44336; color: #c62828;'}
  `;

  const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
  flashDiv.innerHTML = `
    <span style="font-size: 18px;">${icon}</span>
    <span style="flex: 1; font-size: 14px; font-weight: 500;">${message}</span>
    <button class="flash-close" style="
      background: none; border: none; font-size: 20px; cursor: pointer;
      color: inherit; opacity: 0.7; padding: 0; width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
    " onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(flashDiv);

  setTimeout(() => {
    if (flashDiv.parentElement) {
      flashDiv.style.animation = 'slideUpFlashMessage 0.3s ease-out';
      setTimeout(() => flashDiv.remove(), 300);
    }
  }, 5000);
}

//_________________________________________________________________________________________________
//_______________________________________________________________________________________
// fundraiser.js - Updated for dynamic data
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initImageFallbacks();
    initFundraiserAccountClick();
    initHelpDropdown();
    initInputBoxes();
    initMenuDropdown();
    initLanguageSwitcher();
    initSaveButtons();
    initComplaintForm();
    initControlPanelRouting();
});


function parseFundraiserAmount(amountText) {
    if (!amountText) return 0;
    let cleanedText = amountText.trim().replace(/\s+/g, '');
    cleanedText = convertArabicNumerals(cleanedText);
    cleanedText = cleanedText.replace(/[^\d.]/g, '');
    const parsed = parseFloat(cleanedText);
    return isNaN(parsed) ? 0 : parsed;
}

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
    if (goal >= 0 && goal <= 1000) return 3;
    else if (goal >= 1001 && goal <= 3000) return 5;
    else if (goal >= 3001 && goal <= 5000) return 8;
    else if (goal >= 5001 && goal <= 10000) return 12;
    else return 15;
}

function startCountAnimation(el, currentAmount, goal) {
    if (currentAmount >= goal) {
        el.textContent = goal.toLocaleString();
        return;
    }
    let increment = determineIncrement(goal);
    let count = setInterval(() => {
        let currentValue = parseInt(el.textContent.replace(/,/g, '')) || 0;
        let newValue = currentValue + increment;
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
    let progressPercentage = (currentAmount / maxGoal) * 100;
    progressPercentage = Math.min(progressPercentage, 100);
    progressPercentage = Math.max(progressPercentage, 0);

    console.log('📊 Progress update:', { currentAmount, maxGoal, progressPercentage });

    if (progressBar) {
        progressBar.style.height = `${progressPercentage}%`;
        console.log('✅ Progress bar height set to:', progressBar.style.height);
    } else {
        console.error('❌ Progress bar element not found');
    }

    if (donationMoneyNumber) {
        updateMoneyNumberPosition(progressPercentage, donationMoneyNumber);
    }
}

function updateMoneyNumberPosition(progressPercentage, donationMoneyNumber) {
    const startTop = 230;
    const endTop = -20;
    const newTop = startTop + (endTop - startTop) * (progressPercentage / 100);
    donationMoneyNumber.style.top = `${newTop}px`;
}

function setupProgressObserver(currentAmount, maxGoal, progressBar, donationMoneyNumber) {
    const moneyElement = document.querySelector(".money");
    if (!moneyElement) return;

    let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                let newAmount = parseInt(moneyElement.textContent.replace(/,/g, '')) || 0;
                updateProgressBar(newAmount, maxGoal, progressBar, donationMoneyNumber);
            }
        });
    });

    observer.observe(moneyElement, { 
        childList: true, 
        subtree: true,
        characterData: true 
    });
}

function startRealTimeUpdates(fundraiserId) {
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
    }, 30000);
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

        if (Math.abs(newAmount - currentAmount) > 1) {
            moneyElement.textContent = newAmount.toLocaleString();
            updateProgressBar(newAmount, maxGoal, progressBar, donationMoneyNumber);
        }
    }
}

window.fundraiserAnimations = {
    updateProgress: updateProgressBar,
    startRealTimeUpdates: startRealTimeUpdates
};

//____________________________________________________________________________________________________
function initHelpDropdown() {
    const help_btn = document.getElementById('helpBtn');
    const submit_complaint = document.getElementById('submitComplaint');
    
    if (!help_btn || !submit_complaint) return;
    
    help_btn.addEventListener('click', function(e) {
        e.preventDefault();
        submit_complaint.classList.toggle('show');
    });
    
    document.addEventListener('click', function(e) {
        if (!help_btn.contains(e.target) && !submit_complaint.contains(e.target)) {
            submit_complaint.classList.remove('show');
        }
    });
}

//______________________________________________________________________________________________________
function initInputBoxes() {
    let inputBoxes = document.querySelectorAll(".input-box");

    inputBoxes.forEach((box) => {
        let inputField = box.querySelector("input");
        let textareaField = box.querySelector("textarea");
        let field = inputField || textareaField;

        if (field) {
            if (field.value === '') {
                box.classList.remove('field-is-filled');
            } else {
                box.classList.add('field-is-filled');
            }

            field.addEventListener("focus", () => {
                box.classList.add("input-box-active");
            });

            field.addEventListener("blur", () => {
                setTimeout(() => {
                    box.classList.remove("input-box-active");
                }, 300);
            });

            field.addEventListener("input", () => {
                if (field.value === '') {
                    box.classList.remove('field-is-filled');
                } else {
                    box.classList.add('field-is-filled');
                }
            });
        }

        if (textareaField) {
            let signalNum = box.querySelector(".signal_num");
            
            textareaField.addEventListener("keyup", () => {
                let valLength = textareaField.value.length;
                if (signalNum) signalNum.innerText = valLength;
                
                if (valLength > 0) {
                    box.classList.add("input-box-active");
                } else {
                    box.classList.remove("input-box-active");
                }
                
                if (valLength > 100) {
                    box.classList.add("error");
                } else {
                    box.classList.remove("error");
                }
            });
        }
    });
}

//_________________________________________________________________________________________________________
function initMenuDropdown() {
    const menuButton = document.getElementById('menuButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (!menuButton || !dropdownMenu) return;
    
    menuButton.addEventListener('click', function(e) {
        e.preventDefault();
        dropdownMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', function(e) {
        if (!menuButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}

//____________________________________________________________________________________________________________
function loadScript(src, onLoad) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = onLoad;
    script.onerror = function() {
        console.warn('Failed to load script: ' + src);
    };
    document.head.appendChild(script);
}

if (typeof jQuery === 'undefined') {
    console.warn('jQuery is not loaded, loading from CDN');
    loadScript('https://code.jquery.com/jquery-3.6.0.min.js', function() {
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
    $(document).ready(function(){
        $(".owl-carousel").owlCarousel({
            loop: true,
            items: 1,
            responsive: {
                768: {
                    items: 3
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

    if (typeof i18next !== 'undefined') {
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
                            "complaintTitleTgt": "Enter the problem you are facing",
                            "complaintLabelTgt": "Enter A Problem",
                            "complaintBtnTgt": "Send",
                            "fundraiserCategoriesOneTgt": "environment",
                            "fundraiserCategoriesTwoTgt": "poverty",
                            "fundraiserCategoriesThreeTgt": "gaza",
                            "fundraiserCategoriesFourTgt": "health care",
                            "fundraiserGoalTitleTgt": "Fundraiser Goal :",
                            "fundraiserDonateBtnTgt": "Donate Now",
                            "fundraiserDonateBtnIndigentTgt": "Indigent Does Not Donate",
                            "fundraiserDescriptionTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores quibusdam unde accusantium minima vitae similique a. Enim eum saepe consequuntur error, beatae veritatis ipsum quo, amet, nulla nobis facilis corporis Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus numquam accusantium fugiat? Cumque voluptatibus aliquid voluptates harum animi illum in sit, possimus, facere consequatur maiores numquam assumenda ducimus ex repellat? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Enim ullam blanditiis est praesentium quod odit, dolores inventore alias beatae laborum labore fugiat adipisci et sequi.",
                            "fundraiserCommentTitleTgt": "Add a comment",
                            "fundraiserCommentDescriptionTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            "fundraiserCommentLabelTgt": "Type A comment",
                            "fundraiserCommentBtnTgt": "Submit",
                            "fundraiserCommentSubTitleTgt": "Comments",
                            "fundraiserCommentLikeTgt": "Like",
                            "fundraiserCommentReplyTgt": "Reply",
                            "fundraiserCommentTimeTgt": "4d",
                            "fundraiserCommentReplyBtnTgt": "Post Reply",
                            "fundraiserMoreFundraisersTitleTgt": "More Fundraisers From AbOoD1",
                            "fundraiserSimilarFundraisersTitleTgt": "Similar Fundraisers Requests",
                            "fundraiserSameAreaFundraisersTitleTgt": "Fundraisers From The Same Area",
                            "fundraiserCreateFormTitleTgt": "Donation Campaign Form",
                            "fundraiserCreateFormDescriptionTgt": "Create a donation campaign form by setting up input fields based on the information that the person in need must enter to ensure the goal of the fundraising campaign is achieved.",
                            "fundraiserRequestersTableTitleTgt": "Donation Campaign Requesters Table",
                            //_______________________________________________________________
                            "fundraiserRequesterFormTitleTgt":"Filling Out The Donation Campaign Form",
                            "fundraiserRequesterFormDescriptionTgt":"You must fill out this form with accurate information in order to be accepted into this campaign.",
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
                            "complaintTitleTgt": "أدخل المشكلة التي تواجهك",
                            "complaintLabelTgt": "أدخل المشكلة",
                            "complaintBtnTgt": "أرسل",
                            "fundraiserCategoriesOneTgt": "البيئة",
                            "fundraiserCategoriesTwoTgt": "الفقر",
                            "fundraiserCategoriesThreeTgt": "غزة",
                            "fundraiserCategoriesFourTgt": "الرعاية الصحية",
                            "fundraiserGoalTitleTgt": "هدف حملة التبرع :",
                            "fundraiserDonateBtnTgt": "تبرع الآن",
                            "fundraiserDonateBtnIndigentTgt": "المحتاج لا يتبرع",
                            "fundraiserDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربى مفيد لمصممي المواقع على وجه الخصوص، حيث يحتاج العميل فى كثير من الأحيان أن يطلع على صورة حقيقية لتصميم الموقع.",
                            "fundraiserCommentTitleTgt": "أضف تعليقاً",
                            "fundraiserCommentDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى.",
                            "fundraiserCommentLabelTgt": "أكتب تعليقاً",
                            "fundraiserCommentBtnTgt": "أرسل",
                            "fundraiserCommentSubTitleTgt": "التعليقات",
                            "fundraiserCommentLikeTgt": "إعجاب",
                            "fundraiserCommentReplyTgt": "رد",
                            "fundraiserCommentTimeTgt": "4ي",
                            "fundraiserCommentReplyBtnTgt": "الرد",
                            "fundraiserMoreFundraisersTitleTgt": "AbOod1 المزيد من حملات التبرع من",
                            "fundraiserSimilarFundraisersTitleTgt": "حملات التبرع المشابهة",
                            "fundraiserSameAreaFundraisersTitleTgt": "حملات التبرع من نفس المنطقة",
                            "fundraiserCreateFormTitleTgt": "إنشاء نموذج حملة التبرع",
                            "fundraiserCreateFormDescriptionTgt": "انشئ نموذج حملة التبرع من خلال انشاء حقول الادخال حسب المعلومات التي يجب على المحتاج ادخالها لضمان هدف تحقيق هدف حملة جمع التبرع.",
                            "fundraiserRequestersTableTitleTgt": "جدول الطلبات لحملة التبرعات",
                            //___________________________________________________________
                            "fundraiserRequesterFormTitleTgt":"تعبئة نموذج حملة التبرعات",
                            "fundraiserRequesterFormDescriptionTgt":"يجب عليك تعبئة هذا النموذج بمعلومات دقيقة ليتم قبولك في هذه الحملة.",

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

        document.getElementById('en-btn').addEventListener('click', () => {
            i18next.changeLanguage('en');
            updateButtonState('en');
        });

        document.getElementById('ar-btn').addEventListener('click', () => {
            i18next.changeLanguage('ar');
            updateButtonState('ar');
        });

        function updateButtonState(lang) {
            document.getElementById('en-btn').classList.toggle('active', lang === 'en');
            document.getElementById('ar-btn').classList.toggle('active', lang === 'ar');
        }

        function updateContent() {
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                element.innerHTML = i18next.t(key);
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

        if (navigator.language.startsWith('ar')) {
            i18next.changeLanguage('ar');
            updateButtonState('ar');
        }
    } else {
        console.error('i18next is not available');
        loadScript('https://unpkg.com/i18next@21.9.2/dist/umd/i18next.min.js', function() {
            loadScript('https://unpkg.com/i18next-http-backend@1.4.1/i18nextHttpBackend.min.js', function() {
                loadScript('https://unpkg.com/i18next-browser-languagedetector@7.0.1/i18nextBrowserLanguageDetector.min.js', function() {
                    console.log('i18next loaded from CDN');
                    location.reload();
                });
            });
        });
    }
}

//________________________________________________________________________________________________________________-
function initLanguageSwitcher() {
    const languageMenu = document.getElementById('languageMenu');
    const languageSwitcher = document.getElementById('languageSwitcher');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (!languageMenu || !languageSwitcher) return;
    
    languageMenu.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        languageSwitcher.classList.toggle('show');
        languageSwitcher.classList.toggle('flex');
    });
    
    document.addEventListener('click', function(e) {
        if (!dropdownMenu?.contains(e.target)) {
            languageSwitcher.classList.remove('show');
            languageSwitcher.classList.remove('flex');
        }
    });
    
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(button => {
        button.addEventListener('click', function() {
            langButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            languageSwitcher.classList.remove('show');
            languageSwitcher.classList.remove('flex');
            console.log('Selected language: ' + this.textContent);
        });
    });
    
    languageSwitcher.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

//_______________________________________________________________________________________________________
function initSaveButtons() {
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.save-fundraiser-btn')) {
            e.preventDefault();
            const button = e.target.closest('.save-fundraiser-btn');
            await toggleSaveFundraiser(button);
        }
    });

    initializeSaveButtons();
}

function getFundraiserId(button) {
    console.log('🔍 Looking for fundraiser ID...');
    
    const fundraiserBox = button.closest('[data-fundraiser-id]');
    if (fundraiserBox && fundraiserBox.dataset.fundraiserId) {
        console.log('✅ Found fundraiser ID from data attribute:', fundraiserBox.dataset.fundraiserId);
        return fundraiserBox.dataset.fundraiserId;
    }
    
    const currentUrl = window.location.href;
    const urlMatch = currentUrl.match(/\/fundraiser\/(\d+)/);
    if (urlMatch) {
        console.log('✅ Found fundraiser ID from URL:', urlMatch[1]);
        return urlMatch[1];
    }
    
    const metaFundraiserId = document.querySelector('meta[name="fundraiser-id"]');
    if (metaFundraiserId && metaFundraiserId.content) {
        console.log('✅ Found fundraiser ID from meta tag:', metaFundraiserId.content);
        return metaFundraiserId.content;
    }
    
    const hiddenFundraiserId = document.querySelector('input[name="fundraiser-id"]');
    if (hiddenFundraiserId && hiddenFundraiserId.value) {
        console.log('✅ Found fundraiser ID from hidden input:', hiddenFundraiserId.value);
        return hiddenFundraiserId.value;
    }
    
    const donateBtn = button.closest('.fundraiser-btns')?.querySelector('.donate-btn, .main-donate-btn');
    if (donateBtn && donateBtn.href) {
        const match = donateBtn.href.match(/\/fundraiser\/(\d+)/);
        if (match) {
            console.log('✅ Found fundraiser ID from donate button:', match[1]);
            return match[1];
        }
    }
    
    const fundraiserContainer = button.closest('.fundraiser-container, .fundraiser-box, [id*="fundraiser"]');
    if (fundraiserContainer) {
        const idElement = fundraiserContainer.querySelector('[data-fundraiser-id]');
        if (idElement) {
            console.log('✅ Found fundraiser ID from container:', idElement.dataset.fundraiserId);
            return idElement.dataset.fundraiserId;
        }
    }
    
    console.error('❌ Could not find fundraiser ID for button:', button);
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
        icon.innerHTML = `<path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>`;
    } else {
        button.classList.remove('saved');
        button.title = 'Save fundraiser';
        icon.innerHTML = `<path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                        <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4"/>`;
    }
}

function showNotification(message, type) {
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
function initComplaintForm() {
    const complaintForm = document.getElementById('complaintForm');
    const complaintContent = document.getElementById('complaint_content');
    const signalNum = document.querySelector('.signal_num');
    const complaintMessage = document.getElementById('complaintMessage');

    if (!complaintForm) return;

    if (complaintContent && signalNum) {
        complaintContent.addEventListener('input', function() {
            const currentLength = this.value.length;
            signalNum.textContent = currentLength;
            if (currentLength > 900) {
                signalNum.style.color = '#ff6b6b';
            } else {
                signalNum.style.color = '';
            }
        });
    }

    complaintForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
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
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

//__________________________________________________________________________________________________
function initControlPanelRouting() {
    const controlPanelBtn = document.getElementById("controlPanelBtn");
    if (!controlPanelBtn) return;
    
    controlPanelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const userType = sessionStorage.getItem("userType");

        if (!userType) {
            window.location.href = "/register";
            return;
        }

        if (userType === "superadmin") {
            window.location.href = "/admin";
        } else if (userType === "requester") {
            window.location.href = "/userPanelIndigent";
        } else if (userType === "donor") {
            window.location.href = "/UserPanelDonor";
        } else {
            console.log('الرجاء تحديد تصنيف ناجح');
        }
    });
}

//________________________________________________________________________________________________________________________________________
/* ── Image Fallbacks (replaces inline onerror) ─────────────────────────── */
function initImageFallbacks() {
    document.querySelectorAll('img[data-fallback-src]').forEach(img => {
        img.addEventListener('error', function() {
            this.src = this.dataset.fallbackSrc;
        });
    });
}

/* ── Fundraiser Account Click (replaces inline onclick) ───────────────── */
function initFundraiserAccountClick() {
    document.querySelectorAll('.fundraiser-account[data-user-id]').forEach(acc => {
        acc.style.cursor = 'pointer';
        acc.addEventListener('click', () => {
            const userId = acc.dataset.userId;
            if (userId) window.location.href = `/indigent-account/${userId}`;
        });
    });
}