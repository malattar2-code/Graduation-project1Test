const sign_in_btn = document.querySelector(".sign-in-btn");
const sign_up_btn = document.querySelector(".sign-up-btn");
const main_content = document.querySelector(".main-content");

sign_up_btn.addEventListener("click", () => {
  main_content.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  main_content.classList.remove("sign-up-mode");
  sign_up_box.classList.remove("active-form-three");
  sign_up_box.classList.remove("active-form-confirm");
  sign_up_box.classList.remove("active-form-two");
});

//_________________________________________________________________________________________________
let donor_btn = document.querySelector(".donor-btn");
let indigent_btn = document.querySelector(".indigent-btn");
let account_type = document.querySelector(".account-type");

donor_btn.addEventListener("click", () => {
  account_type.classList.add("donor-mode");
  account_type.classList.remove("indigent-mode");
});

indigent_btn.addEventListener("click", () => {
  account_type.classList.add("indigent-mode");
  account_type.classList.remove("donor-mode");
});

//_________________________________________________________________________________________________
document.addEventListener("DOMContentLoaded", () => {
    let inputBoxes = document.querySelectorAll(".input-box");

    inputBoxes.forEach((box) => {
        let inputField = box.querySelector("input");

        if (inputField) {
            // تعديل هذه الجزئية بحيث يتم التعامل مع `box` وليس `inputBoxes`
            if (inputField.value === '') {
                box.classList.remove('field-is-filled');
} else {
                box.classList.add('field-is-filled');
}

            inputField.addEventListener("focus", () => {
                box.classList.add("input-box-active");
});

            inputField.addEventListener("blur", () => {
                setTimeout(() => {
                    box.classList.remove("input-box-active");
}, 300); // تأخير الإزالة بمقدار 300 ميلي ثانية
});

            inputField.addEventListener("input", () => {
                if (inputField.value === '') {
                    box.classList.remove('field-is-filled');
} else {
                    box.classList.add('field-is-filled');
}
});
}
});
});

//_________________________________________________________________________________________________

let sign_up_box = document.querySelector(".sign-up-box");
let next_btn_one = document.querySelector(".next-btn-one");
let next_btn_three = document.querySelector(".next-btn-three");
let prev_btn_one = document.querySelector(".prev-btn-one");
let prev_btn_two = document.querySelector(".prev-btn-two");


prev_btn_one.addEventListener("click", () => {
  sign_up_box.classList.remove("active-form-two");
});


//_________________________________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
            const problem_btn = document.getElementById('problemBtn');
            const submit_complaint = document.getElementById('submitComplaint');
            
            // Toggle dropdown when button is clicked
            problem_btn.addEventListener('click', function(e) {
                e.preventDefault();
                submit_complaint.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!problem_btn.contains(e.target) && !submit_complaint.contains(e.target)) {
                    submit_complaint.classList.remove('show');
                }
            });
        });
//__________________________________________________________________________________________________________
//__________________________________________________________________________________________________________
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
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.code-input');
    const verifyButton = document.querySelector('.verify-button');
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');
    
    // Focus management for input fields
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const index = parseInt(this.getAttribute('data-index'));
            
            if (this.value.length === 1) {
                this.classList.add('filled');
                
                // Move to next input if available
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            } else {
                this.classList.remove('filled');
            }
            
            // Check if all fields are filled
            checkVerificationCode();
        });
        
        input.addEventListener('keydown', function(e) {
            const index = parseInt(this.getAttribute('data-index'));
            
            // Handle backspace key
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
    
    // Check if all code digits are entered
    function checkVerificationCode() {
        const allFilled = Array.from(inputs).every(input => input.value.length === 1);
        
        if (allFilled) {
            verifyButton.disabled = false;
        } else {
            verifyButton.disabled = true;
        }
    }
    
    // Verify button functionality
    verifyButton.addEventListener('click', function() {
        const code = Array.from(inputs).map(input => input.value).join('');
        
        // Simple validation - in a real app, this would check against a server
        if (code.length === 6 && /^\d+$/.test(code)) {
            // Simulate successful verification
            errorMsg.style.display = 'none';
            successMsg.style.display = 'block';
            verifyButton.disabled = true;
            
            // Simulate redirect after delay
            setTimeout(function() {
                alert('Verification successful! In a real application, you would be redirected now.');
            }, 1500);
        } else {
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
        }
    });
    
    // Initially disable verify button
    verifyButton.disabled = true;
});

//_____________________________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
    const next_btn_two = document.getElementById("verifyBtn");
    const verification_window = document.getElementById('verificationWindow');
    
    // Toggle dropdown when button is clicked
    next_btn_two.addEventListener('click', function(e) {
        e.preventDefault();
        verification_window.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!next_btn_two.contains(e.target) && !verification_window.contains(e.target)) {
            verification_window.classList.remove('show');
        }
    });
});

//__________________________________________________________________________________________
document.querySelectorAll('.file-input').forEach(fileInput => {
  const wrapper = fileInput.closest('.wrapper');
  const imageBox = wrapper.querySelector('.image-box');
  const uploadIcon = imageBox.querySelector('svg');
  const uploadText = imageBox.querySelector('p');
  
  // Click handler for the image box
  imageBox.addEventListener('click', () => {
    fileInput.click();
  });

  // File input change handler
  fileInput.onchange = ({target}) => {
    const file = target.files[0];
    const progressArea = wrapper.querySelector('.progress-area');
    const uploadedArea = wrapper.querySelector('.uploaded-area');
    
    // Validate the file
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file (JPG/PNG)');
      target.value = '';
      return;
    }

    // Change to uploading state
    uploadIcon.outerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" class="bi bi-cloud-arrow-up-fill" viewBox="0 0 16 16">
        <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 5.146a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0z"/>
      </svg>`;
    uploadText.textContent = 'The image is being uploaded...';
    
    // Create preview while waiting for upload
    const reader = new FileReader();
    reader.onload = (e) => {
      // Create preview in the image box
      let preview = imageBox.querySelector('.image-preview');
      if (!preview) {
        preview = document.createElement('img');
        preview.className = 'image-preview';
        imageBox.insertBefore(preview, uploadText);
      }
      preview.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Simulate upload (since real upload fails due to CORS)
    simulateUpload(file, wrapper, imageBox);
  };
});

function simulateUpload(file, wrapper, imageBox) {
  const progressArea = wrapper.querySelector('.progress-area');
  const uploadedArea = wrapper.querySelector('.uploaded-area');
  const uploadIcon = imageBox.querySelector('svg');
  const uploadText = imageBox.querySelector('p');
  
  // Simulate progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    if (progress > 100) progress = 100;
    
    const fileSize = (file.size / 1024).toFixed(2) + ' KB';
    const progressHTML = `<li class="row">
      <i class="fa fa-file-alt"></i>
      <div class="content">
        <div class="details">
          <span class="name">${file.name} • Uploading</span>
          <span class="percent">${progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: ${progress}%"></div>
        </div>
      </div>
    </li>`;
    
    progressArea.innerHTML = progressHTML;
    
    if (progress === 100) {
      clearInterval(interval);
      progressArea.innerHTML = '';
      
      const uploadedHTML = `<li class="row">
        <div class="content upload">
          <i class="fa fa-file-alt"></i>
          <div class="details">
            <span class="name">${file.name} • Uploaded</span>
            <span class="size">${fileSize}</span>
          </div>
        </div>
        <i class="fa fa-check"></i>
      </li>`;
      
      uploadedArea.innerHTML = uploadedHTML;
      
      // Change to success state
      uploadIcon.outerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="#4BB543" class="bi bi-cloud-check-fill" viewBox="0 0 16 16">
          <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 4.854-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
        </svg>`;
      uploadText.textContent = 'Image Uploaded Successfully';
      uploadText.style.color = '#4BB543';
      
      // Add success class to wrapper
      wrapper.classList.add('upload-success');
    }
  }, 100);
}

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
                            "registrationSignUpBoxTitleTgt": "Sign Up",
                            //________________________________________
                            "registrationSignUpBoxFormOneTitleTgt": "Tell Us About Yourself!",
                            "registrationSignUpBoxFormOneLabelFirstNameTgt": "First Name",
                            "registrationSignUpBoxFormOneLabelLastNameTgt": "Last Name",
                            "registrationSignUpBoxFormOneOptionOneTgt": "Male",
                            "registrationSignUpBoxFormOneOptionTwoTgt": "Female",
                            "registrationSignUpBoxFormOneLabelNumberTgt": "Your Number",
                            "registrationSignUpBoxFormOneLocationTgt": "Allow access to your location.",
                            "registrationSignUpBoxFormOneLocationBtnTgt": "Location",
                            "registrationSignUpBoxNextBtnTgt": "Next",
                            "registrationSignUpBoxSubmitBtnTgt": "Submit",
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
                            //_________________________________________
                            "registrationSignUpBoxFormThreeTitleTgt": "Your Credit Card Information!",
                            "registrationSignUpBoxFormThreeLabelCardNumberTgt": "Card Number",
                            "registrationSignUpBoxFormThreeLabelNameOnCardTgt": "Name On Card",
                            "registrationSignUpBoxFormThreeLabelDayTgt": "day",
                            "registrationSignUpBoxFormThreeLabelYearTgt": "year",
                            "registrationSignUpBoxSkipBtnTgt": "Skip This Step",
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
                            "registrationSignUpBoxTitleTgt": "تسجيل حساب جديد",
                            //________________________________________
                            "registrationSignUpBoxFormOneTitleTgt": "حدثنا عن نفسك!",
                            "registrationSignUpBoxFormOneLabelFirstNameTgt": "الإسم الأول",
                            "registrationSignUpBoxFormOneLabelLastNameTgt": "الإسم الأخير",
                            "registrationSignUpBoxFormOneOptionOneTgt": "ذكر",
                            "registrationSignUpBoxFormOneOptionTwoTgt": "أنثى",
                            "registrationSignUpBoxFormOneLabelNumberTgt": "الرقم الخاص بك",
                            "registrationSignUpBoxFormOneLocationTgt": "السماح بالوصول لموقعك الجغرافي",
                            "registrationSignUpBoxFormOneLocationBtnTgt": "الموقع",
                            "registrationSignUpBoxNextBtnTgt": "التالي",
                            "registrationSignUpBoxSubmitBtnTgt": "تسجيل",
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
                            //_________________________________________
                            "registrationSignUpBoxFormThreeTitleTgt": "معلومات بطاقة الإئتمان الخاصة بك",
                            "registrationSignUpBoxFormThreeLabelCardNumberTgt": "رقم البطاقة",
                            "registrationSignUpBoxFormThreeLabelNameOnCardTgt": "الاسم على البطاقة",
                            "registrationSignUpBoxFormThreeLabelDayTgt": "اليوم",
                            "registrationSignUpBoxFormThreeLabelYearTgt": "السنة",
                            "registrationSignUpBoxSkipBtnTgt": "تخطي هذه الخطوة",
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

        // الكشف التلقائي عن لغة المتصفح وتطبيقها
        if (navigator.language.startsWith('ar')) {
            i18next.changeLanguage('ar');
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
