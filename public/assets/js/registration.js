// registration.js — UI panel switching + i18n + misc interactions
// Works with the separated Donor/Indigent & Charity forms in registration.ejs
// ── Translation helper ───────────────────────────────────────────────────────
function t(key, fallback, options = {}) {
  if (typeof i18next !== 'undefined' && i18next.t) {
    const translated = i18next.t(key, { ...options, defaultValue: fallback });
    return translated === key ? fallback : translated;
  }
  // Fallback: manual interpolation
  let result = fallback;
  Object.keys(options).forEach(optKey => {
    result = result.replace(new RegExp(`{{\\s*${optKey}\\s*}}`, 'g'), options[optKey]);
  });
  return result;
}
// ─── Sign In / Sign Up panel toggle ─────────────────────────────────────────
// ─── Sign In / Sign Up panel toggle ─────────────────────────────────────────
const sign_in_btn  = document.querySelector('.sign-in-btn');
const sign_up_btn  = document.querySelector('.sign-up-btn');
const main_content = document.querySelector('.main-content');
const sign_up_box  = document.querySelector('.sign-up-form-box');
const sign_in_box  = document.querySelector('.sign-in-form-box');
const TRANSITION_DURATION = 1800; // matches CSS transition (1.8s)

// Helper: fade out then hide
function fadeOutThenHide(element, duration) {
  element.style.opacity = '0';
  element.style.pointerEvents = 'none';
  setTimeout(() => {
    element.style.display = 'none';
  }, duration);
}

// Helper: show then fade in
function showThenFadeIn(element, duration) {
  element.style.display = 'flex';
  // Force reflow so browser registers the display change before opacity
  void element.offsetWidth;
  element.style.opacity = '1';
  element.style.pointerEvents = 'auto';
}

// Initial state
if (!main_content.classList.contains('sign-up-mode')) {
  sign_up_box.style.opacity = '0';
  sign_up_box.style.display = 'none';
  sign_up_box.style.pointerEvents = 'none';
  sign_in_box.style.opacity = '1';
  sign_in_box.style.display = 'flex';
  sign_in_box.style.pointerEvents = 'auto';
} else {
  sign_in_box.style.opacity = '0';
  sign_in_box.style.display = 'none';
  sign_in_box.style.pointerEvents = 'none';
  sign_up_box.style.opacity = '1';
  sign_up_box.style.display = 'flex';
  sign_up_box.style.pointerEvents = 'auto';
}

// Prevent double-click issues with a lock
let isTransitioning = false;

sign_up_btn?.addEventListener('click', () => {
  if (isTransitioning || main_content.classList.contains('sign-up-mode')) return;
  isTransitioning = true;
  
  sign_up_box.style.display = 'flex';
  void sign_up_box.offsetWidth; // reflow
  sign_up_box.style.opacity = '1';
  sign_up_box.style.pointerEvents = 'auto';
  
  main_content.classList.add('sign-up-mode');
  
  // Fade out sign-in, fade in sign-up
  fadeOutThenHide(sign_in_box, TRANSITION_DURATION);
  
  setTimeout(() => {
    isTransitioning = false;
  }, TRANSITION_DURATION);
});

sign_in_btn?.addEventListener('click', () => {
  if (isTransitioning || !main_content.classList.contains('sign-up-mode')) return;
  isTransitioning = true;
  
  sign_in_box.style.display = 'flex';
  void sign_in_box.offsetWidth; // reflow
  sign_in_box.style.opacity = '1';
  sign_in_box.style.pointerEvents = 'auto';
  
  main_content.classList.remove('sign-up-mode');
  
  // Fade out sign-up, fade in sign-in
  fadeOutThenHide(sign_up_box, TRANSITION_DURATION);
  
  setTimeout(() => {
    isTransitioning = false;
  }, TRANSITION_DURATION);
});

// ─── Input box focus / fill effects (sign-in form) ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sign-in-form-box .input-box').forEach(box => {
    const field = box.querySelector('input') || box.querySelector('textarea');
    if (!field) return;

    if (field.value !== '') box.classList.add('field-is-filled');
    else box.classList.remove('field-is-filled');

    field.addEventListener('focus', () => box.classList.add('input-box-active'));
    field.addEventListener('blur',  () => setTimeout(() => box.classList.remove('input-box-active'), 300));
    field.addEventListener('input', () => {
      if (field.value === '') box.classList.remove('field-is-filled');
      else box.classList.add('field-is-filled');
    });
  });
});

// ─── "Any Problem?" dropdown ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const problem_btn      = document.getElementById('problemBtn');
  const submit_complaint = document.getElementById('submitComplaint');
  if (!problem_btn || !submit_complaint) return;

  problem_btn.addEventListener('click', function (e) {
    e.preventDefault();
    submit_complaint.classList.toggle('show');
  });

});

//_____________________________________________________________________________________________________________________________________________________________________________________

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
                            "registrationSignUpPanelTitleTgt": "New here ?",
                            "registrationSignUpPanelDescriptionTgt": "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis,ex ratione. Aliquid!",
                            "registrationSignUpPanelBtnTgt": "Sign Up",
                            "registrationSignInBoxTitleTgt": "Sign In!",
                            "registrationSignInBoxProblemBtnTgt": "Any Problem?",
                            "registrationSignInBoxDescriptionTgt": "Lorem ipsum dolor sit amet consectetur adipisicing.",
                            "registrationSignInBoxEmailLabelTgt": "Email",
                            "registrationSignInBoxPasswordLabelTgt": "Password",
                            "registrationSignInBoxLoginBtnTgt": "Login",
                            "registrationSignInBoxForgetPasswordBtnTgt": "Forget the Password ?",
                            //________________________________________
                            "emailwindowTitleTgt": "Enter your email to receive the verification code.",
                            "emailBtnTgt": "Send",
                            //________________________________________
                            "complaintTitleTgt": "Contact us on WhatsApp",
                            "complaintLabelTgt": "Enter A Problem",
                            "complaintBtnTgt": "Send",
                            //________________________________________
                            "registrationSignInPanelTitleTgt": "Have Account ?",
                            "registrationSignInPanelDescriptionTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrumlaboriosam ad deleniti.",
                            "registrationSignInPanelBtnTgt": "Sign In",
                            "registrationSignUpBoxDonorBtnTgt": "Donor",
                            "registrationSignUpBoxIndigentBtnTgt": "Indigent",
                            "registrationSignUpBoxCharityBtnTgt": "Charity",
                            "registrationSignUpBoxTitleTgt": "Sign Up",
                            //________________________________________
                            "registrationSignUpBoxFormOneTitleTgt": "Tell Us About Yourself!",
                            "registrationSignUpBoxFormOneLabelFirstNameTgt": "First Name",
                            "registrationSignUpBoxFormBirthDateLabelTgt": "Last Name",
                            "registrationSignUpBoxFormCharityDateLabelTgt": "Your Birthday",
                            "registrationSignUpBoxFormOneOptionOneTgt": "Male",
                            "registrationSignUpBoxFormOneOptionTwoTgt": "Female",
                            "registrationSignUpBoxFormOneLabelNumberTgt": "Your Number",
                            "registrationSignUpBoxFormOneLocationTgt": "Allow access to your location.",
                            "registrationSignUpBoxFormOneLocationBtnTgt": "Location",
                            "registrationSignUpBoxNextBtnTgt": "Next",
                            "registrationSignUpBoxSubmitBtnTgt": "Submit",
                            //________________________________________
                            "registrationSignUpBoxFormCharityNameLabelTgt" : "Name Of The Charity",
                            "registrationSignUpBoxFormCharityDescriptionLabelTgt" : "Describe The Charity And Its Achievements",
                            "registrationSignUpBoxFormCharityDateLabelTgt": "Date of establishment of the charity",
                            "registrationSignUpBoxFormCharityTypeLabelTgt" : "Choose the Type of Charity",
                            "registrationSignUpBoxFormCharityTypeOneTgt" : "Disaster Relief and Humanitarian Aid",
                            "registrationSignUpBoxFormCharityTypeTwoTgt" : "Health and Medical Care",
                            "registrationSignUpBoxFormCharityTypeThreeTgt" : "Education and Skill Development",
                            "registrationSignUpBoxFormCharityTypeFourTgt" : "Orphan Care and Family Support",
                            "registrationSignUpBoxFormCharityTypeFiveTgt" : "Housing and Urban Development",
                            "registrationSignUpBoxFormCharityTypeSixTgt" : "Environment and Animal Protection",
                            "registrationSignUpBoxFormCharityTypeSevenTgt" : "Religious and Da'wah Affairs",
                            "registrationSignUpBoxFormCharityTypeEigthTgt" : "People with Disabilities",
                            "registrationSignUpBoxFormCharityTypeNineTgt" : "Sustainable Development and Microfinance",
                            "registrationSignUpBoxFormCharityLocationLabelTgt" : "Allow Access To Charity Location.",
                            //________________________________________
                            "registrationSignUpBoxFormTwoTitleTgt": "Make Your Account!",
                            "registrationSignUpBoxFormTwoLabelEmailTgt": "Email",
                            "registrationSignUpBoxFormTwoLabelPasswordTgt": "Password",
                            "registrationSignUpBoxFormTwoLabelConfirmPasswordTgt": "Confirm Password",
                            "registrationSignUpBoxFormTwoLabelUploadImageTgt": "Upload Your Image",
                            //________________________________________
                            "verificationWindowTitleTgt": "Email Verification",
                            "verificationWindowDescriptionTgt": "Please enter the code we sent to your email.",
                            "verificationWindowVerifyBtnTgt": "Verify",
                            "verificationWindowDidntReceiveCodeTgt": "Didn't receive your code?",
                            "verificationWindowSendCodeAgainTgt": "Send it again",
                            "verificationWindowErrorMsgTgt": "Please enter a valid 6-digit code.",
                            "verificationWindowSuccessMsgTgt": "Verification successful!",
                            "verificationWindowResendSuccessTgt": "New code sent! Check your email.",
                            "verificationWindowMaxAttemptsTgt": "Maximum resend attempts reached",
                            //_________________________________________
                            "registrationSignUpBoxFormThreeTitleTgt": "Your Credit Card Information!",
                            "registrationSignUpBoxFormThreeLabelCardNumberTgt": "Card Number",
                            "registrationSignUpBoxFormThreeLabelNameOnCardTgt": "Name On Card",
                            "registrationSignUpBoxFormThreeLabelDayTgt": "day",
                            "registrationSignUpBoxFormThreeLabelYearTgt": "year",
                            "registrationSignUpBoxSkipBtnTgt": "Skip This Step",
                            // ─── General Validation ────────────────────────────────────
                            'validation.required': 'This field is required.',
                            'validation.minLength': 'Must be at least {{min}} characters.',
                            'validation.maxLength': 'Must not exceed {{max}} characters.',
                            'validation.invalidFormat': 'Invalid format.',
                            'validation.invalidNumber': 'Must be a valid number.',
                            'validation.wholeNumber': 'Must be a whole number.',
                            'validation.minValue': 'Must be at least {{min}}.',
                            'validation.maxValue': 'Must not exceed {{max}}.',
                            'validation.selectOption': 'Please select an option.',
                            'validation.passwordMin': 'Password must be at least 6 characters.',
                            'validation.passwordMax': 'Password must not exceed 128 characters.',
                            'validation.passwordMatch': 'Passwords do not match.',
                            'validation.passwordSame': 'New password cannot be the same as old password.',
                            'validation.imageType': 'Please select a valid image file (JPG, PNG, GIF).',
                            'validation.imageSize': 'Image size must not exceed 5MB.',
                            'validation.imageRequired': 'Profile image is required.',
                            
                            // ─── Donor/Indigent Specific Validation ─────────────────────
                            'validation.diNameRequired': 'First and last name are required.',
                            'validation.diBirthdayRequired': 'Birth date and gender are required.',
                            'validation.diAgeMin': 'You must be at least 16 years old to register.',
                            'validation.phoneInvalid': 'Please enter a valid phone number.',
                            'validation.locationRequired': 'Please allow access to your location.',
                            
                            // ─── Charity Specific Validation ───────────────────────────
                            'validation.chNameDescRequired': 'Charity name and description are required.',
                            'validation.chNameRequired': 'Charity name is required.',
                            'validation.chDescRequired': 'Description is required.',
                            'validation.chDescMax': 'Description cannot exceed 500 characters.',
                            'validation.chDateTypeRequired': 'Establishment date and type are required.',
                            'validation.chDateRequired': 'Establishment date is required.',
                            'validation.chTypeRequired': 'Charity type is required.',
                            'validation.chLocationRequired': 'Please allow access to your charity location.',
                            
                            // ─── URL / Links Validation ─────────────────────────────────
                            'validation.urlInvalid': 'Please enter a valid URL (e.g., https://example.com)',
                            
                            // ─── Email Validation ───────────────────────────────────────
                            'validation.emailInvalid': 'Please enter a valid email address.',
                            'validation.emailRequired': 'Please enter your email address.',
                            'validation.emailNotFound': 'Email not found. Please register again.',
                            
                            // ─── Password Reset Validation ──────────────────────────────
                            'validation.passwordRequired': 'Please enter a new password.',
                            'validation.confirmRequired': 'Please confirm your new password.',
                            'validation.resetFailed': 'Failed to reset password',
                            
                            // ─── Verification Code Validation ───────────────────────────
                            'validation.codeLength': 'Please enter the 6-digit code.',
                            'validation.codeInvalid': 'Invalid verification code',
                            'validation.networkError': 'Network error. Please try again.',
                            
                            // ─── CAPTCHA ────────────────────────────────────────────────
                            'validation.captchaRequired': 'Please complete the CAPTCHA challenge.',
                            
                            // ─── Server / General Errors ────────────────────────────────
                            'validation.serverError': '{{msg}}',
                            'validation.bannedTitle': '🚫 Account Suspended',
                            
                            // ─── Registration Success ─────────────────────────────────
                            'registration.success': 'Registration successful! Please verify your email.'
                        }
                    },
                    ar: {
                        translation: {
                            "registrationSignUpPanelTitleTgt": "جديد على موقعنا؟",
                            "registrationSignUpPanelDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من التطبيق.",
                            "registrationSignUpPanelTitleTgt": "تسجيل حساب جديد",
                            "registrationSignUpPanelBtnTgt": "حساب جديد",
                            "registrationSignInBoxProblemBtnTgt": "تواجه مشكلة؟",
                            "registrationSignInBoxTitleTgt": "تسجيل الدخول!",
                            "registrationSignInBoxDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة.",
                            "registrationSignInBoxEmailLabelTgt": "البريد الإلكتروني",
                            "registrationSignInBoxPasswordLabelTgt": "كلمة المرور",
                            "registrationSignInBoxLoginBtnTgt": "تسجيل",
                            "registrationSignInBoxForgetPasswordBtnTgt": "نسيت كلمة المرور ؟",
                            //________________________________________
                            "emailwindowTitleTgt": "أدخل بريدك الالكتروني لتلقي رمز التحقق.",
                            "emailBtnTgt": "أرسل",
                            //________________________________________
                            "complaintTitleTgt": "تواصل معنا على الواتساب ",
                            "complaintLabelTgt": "أدخل المشكلة",
                            "complaintBtnTgt": "أرسل",
                            //________________________________________
                            "registrationSignInPanelTitleTgt": "لديك حساب ؟",
                            "registrationSignInPanelDescriptionTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من التطبيق.",
                            "registrationSignInPanelBtnTgt": "تسجيل الدخول",
                            "registrationSignUpBoxDonorBtnTgt": "متبرع",
                            "registrationSignUpBoxIndigentBtnTgt": "محتاج",
                            "registrationSignUpBoxCharityBtnTgt": "جمعية خيرية",
                            "registrationSignUpBoxTitleTgt": "تسجيل حساب جديد",
                            //________________________________________
                            "registrationSignUpBoxFormOneTitleTgt": "حدثنا عن نفسك!",
                            "registrationSignUpBoxFormOneLabelFirstNameTgt": "الإسم الأول",
                            "registrationSignUpBoxFormOneLabelLastNameTgt": "الإسم الأخير",
                            "registrationSignUpBoxFormBirthDateLabelTgt": "تاريخ ميلادك",
                            "registrationSignUpBoxFormOneOptionOneTgt": "ذكر",
                            "registrationSignUpBoxFormOneOptionTwoTgt": "أنثى",
                            "registrationSignUpBoxFormOneLabelNumberTgt": "الرقم الخاص بك",
                            "registrationSignUpBoxFormOneLocationTgt": "السماح بالوصول لموقعك الجغرافي",
                            "registrationSignUpBoxFormOneLocationBtnTgt": "الموقع",
                            "registrationSignUpBoxNextBtnTgt": "التالي",
                            "registrationSignUpBoxSubmitBtnTgt": "تسجيل",
                            //________________________________________
                            "registrationSignUpBoxFormCharityNameLabelTgt" : "اسم الجمعية الخيرية",
                            "registrationSignUpBoxFormCharityDescriptionLabelTgt" : "وصف الجمعية الخيرية وإنجازاتها",
                            "registrationSignUpBoxFormCharityDateLabelTgt": "تاريخ تأسيس الجمعية الخيرية",
                            "registrationSignUpBoxFormCharityTypeLabelTgt" : "اختيار نوع الجمعية الخيرية",
                            "registrationSignUpBoxFormCharityTypeOneTgt" : "الإغاثة في حالات الكوارث والمساعدات الإنسانية",
                            "registrationSignUpBoxFormCharityTypeTwoTgt" : "الرعاية الصحية والطبية",
                            "registrationSignUpBoxFormCharityTypeThreeTgt" : "التعليم وتنمية المهارات",
                            "registrationSignUpBoxFormCharityTypeFourTgt" : "رعاية الأيتام ودعم الأسر",
                            "registrationSignUpBoxFormCharityTypeFiveTgt" : "الإسكان والتنمية الحضرية",
                            "registrationSignUpBoxFormCharityTypeSixTgt" : "حماية البيئة والحيوان",
                            "registrationSignUpBoxFormCharityTypeSevenTgt" : "الشؤون الدينية والدعوة",
                            "registrationSignUpBoxFormCharityTypeEigthTgt" : "ذوي الاحتياجات الخاصة",
                            "registrationSignUpBoxFormCharityTypeNineTgt" : "التنمية المستدامة والتمويل الأصغر",
                            "registrationSignUpBoxFormCharityLocationLabelTgt" : "السماح بالوصول الى موقع الجمعية الخيرية.",
                            //________________________________________
                            "registrationSignUpBoxFormTwoTitleTgt": "قم بإنشاء حسابك!",
                            "registrationSignUpBoxFormTwoLabelEmailTgt": "البريد الإلكتروني",
                            "registrationSignUpBoxFormTwoLabelPasswordTgt": "كلمة المرور",
                            "registrationSignUpBoxFormTwoLabelConfirmPasswordTgt": "تأكيد كلمة المرور",
                            "registrationSignUpBoxFormTwoLabelUploadImageTgt": "ارفع صورة لحسابك",
                            //________________________________________
                            "verificationWindowTitleTgt": "التحقق من البريد الإلكتروني",
                            "verificationWindowDescriptionTgt": "من فضلك أدخل الرمز الذي أرسلناه إلى بريدك الإلكتروني.",
                            "verificationWindowVerifyBtnTgt": "تحقق",
                            "verificationWindowDidntReceiveCodeTgt": "لم تستلم الرمز الخاص بك؟",
                            "verificationWindowSendCodeAgainTgt": "إرسال مرة أخرى",
                            "verificationWindowErrorMsgTgt": "الرجاء إدخال رمز صالح مكون من 6 أرقام.",
                            "verificationWindowSuccessMsgTgt": "تم التحقق بنجاح!",
                            "verificationWindowResendSuccessTgt": "تم إرسال رمز جديد! تحقق من بريدك الإلكتروني.",
                            "verificationWindowMaxAttemptsTgt": "تم الوصول إلى الحد الأقصى لمحاولات إعادة الإرسال",
                            //_________________________________________
                            "registrationSignUpBoxFormThreeTitleTgt": "معلومات بطاقة الإئتمان الخاصة بك",
                            "registrationSignUpBoxFormThreeLabelCardNumberTgt": "رقم البطاقة",
                            "registrationSignUpBoxFormThreeLabelNameOnCardTgt": "الاسم على البطاقة",
                            "registrationSignUpBoxFormThreeLabelDayTgt": "اليوم",
                            "registrationSignUpBoxFormThreeLabelYearTgt": "السنة",
                            "registrationSignUpBoxSkipBtnTgt": "تخطي هذه الخطوة",
                            // ─── General Validation ────────────────────────────────────
                            'validation.required': 'هذا الحقل مطلوب.',
                            'validation.minLength': 'يجب أن يكون على الأقل {{min}} حرفاً.',
                            'validation.maxLength': 'يجب ألا يتجاوز {{max}} حرفاً.',
                            'validation.invalidFormat': 'تنسيق غير صالح.',
                            'validation.invalidNumber': 'يجب أن يكون رقماً صالحاً.',
                            'validation.wholeNumber': 'يجب أن يكون عدداً صحيحاً.',
                            'validation.minValue': 'يجب أن يكون على الأقل {{min}}.',
                            'validation.maxValue': 'يجب ألا يتجاوز {{max}}.',
                            'validation.selectOption': 'الرجاء اختيار خيار.',
                            'validation.passwordMin': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
                            'validation.passwordMax': 'يجب ألا تتجاوز كلمة المرور 128 حرفاً.',
                            'validation.passwordMatch': 'كلمات المرور غير متطابقة.',
                            'validation.passwordSame': 'لا يمكن أن تكون كلمة المرور الجديدة مطابقة للقديمة.',
                            'validation.imageType': 'الرجاء اختيار ملف صورة صالح (JPG، PNG، GIF).',
                            'validation.imageSize': 'يجب ألا يتجاوز حجم الصورة 5 ميجابايت.',
                            'validation.imageRequired': 'الصورة الشخصية مطلوبة.',
                            
                            // ─── Donor/Indigent Specific Validation ─────────────────────
                            'validation.diNameRequired': 'الإسم الأول والأخير مطلوبان.',
                            'validation.diBirthdayRequired': 'تاريخ الميلاد والجنس مطلوبان.',
                            'validation.diAgeMin': 'يجب أن يكون عمرك 16 سنة على الأقل للتسجيل.',
                            'validation.phoneInvalid': 'الرجاء إدخال رقم هاتف صالح.',
                            'validation.locationRequired': 'الرجاء السماح بالوصول إلى موقعك.',
                            
                            // ─── Charity Specific Validation ───────────────────────────
                            'validation.chNameDescRequired': 'اسم الجمعية والوصف مطلوبان.',
                            'validation.chNameRequired': 'اسم الجمعية مطلوب.',
                            'validation.chDescRequired': 'الوصف مطلوب.',
                            'validation.chDescMax': 'لا يمكن أن يتجاوز الوصف 500 حرف.',
                            'validation.chDateTypeRequired': 'تاريخ التأسيس ونوع الجمعية مطلوبان.',
                            'validation.chDateRequired': 'تاريخ التأسيس مطلوب.',
                            'validation.chTypeRequired': 'نوع الجمعية مطلوب.',
                            'validation.chLocationRequired': 'الرجاء السماح بالوصول إلى موقع الجمعية.',
                            
                            // ─── URL / Links Validation ─────────────────────────────────
                            'validation.urlInvalid': 'الرجاء إدخال رابط صالح (مثال: https://example.com)',
                            
                            // ─── Email Validation ───────────────────────────────────────
                            'validation.emailInvalid': 'الرجاء إدخال عنوان بريد إلكتروني صالح.',
                            'validation.emailRequired': 'الرجاء إدخال بريدك الإلكتروني.',
                            'validation.emailNotFound': 'لم يتم العثور على البريد الإلكتروني. الرجاء التسجيل مرة أخرى.',
                            
                            // ─── Password Reset Validation ──────────────────────────────
                            'validation.passwordRequired': 'الرجاء إدخال كلمة مرور جديدة.',
                            'validation.confirmRequired': 'الرجاء تأكيد كلمة المرور الجديدة.',
                            'validation.resetFailed': 'فشل في إعادة تعيين كلمة المرور',
                            
                            // ─── Verification Code Validation ───────────────────────────
                            'validation.codeLength': 'الرجاء إدخال الرمز المكون من 6 أرقام.',
                            'validation.codeInvalid': 'رمز التحقق غير صالح',
                            'validation.networkError': 'خطأ في الشبكة. الرجاء المحاولة مرة أخرى.',
                            
                            // ─── CAPTCHA ────────────────────────────────────────────────
                            'validation.captchaRequired': 'الرجاء إكمال تحدي CAPTCHA.',
                            
                            // ─── Server / General Errors ────────────────────────────────
                            'validation.serverError': '{{msg}}',
                            'validation.bannedTitle': '🚫 الحساب موقوف',
                            
                            // ─── Registration Success ─────────────────────────────────
                            'registration.success': 'تم التسجيل بنجاح! الرجاء التحقق من بريدك الإلكتروني.'
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