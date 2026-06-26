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

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (flashDiv.parentElement) {
      flashDiv.style.animation = 'slideUpFlashMessage 0.3s ease-out';
      setTimeout(() => flashDiv.remove(), 300);
    }
  }, 5000);
}

function showFlashConfirm(message, type = 'warning') {
  return new Promise((resolve) => {
    // Dismiss any existing flash message first
    document.querySelectorAll('.flash-message, .flash-overlay').forEach(el => el.remove());

    // Backdrop overlay to block page interaction
    const overlay = document.createElement('div');
    overlay.className = 'flash-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.35);
      z-index: 9999; backdrop-filter: blur(2px);
    `;

    const flashDiv = document.createElement('div');
    flashDiv.className = `flash-message flash-${type}`;
    flashDiv.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10000; padding: 15px 20px; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; gap: 14px;
      min-width: 300px; max-width: 90%;
      animation: slideDownFlashMessage 0.3s ease-out;
      ${type === 'success'
        ? 'background: #e8f5e8; border: 2px solid #4caf50; color: #2e7d32;'
        : type === 'warning'
        ? 'background: #fffbf0; border: 2px solid #ffc107; color: #856404;'
        : 'background: #ffebee; border: 2px solid #f44336; color: #c62828;'}
    `;

    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'display: flex; align-items: center; gap: 10px;';
    contentDiv.innerHTML = `
      <span style="font-size: 18px;">${icon}</span>
      <span style="flex: 1; font-size: 14px; font-weight: 500;">${message}</span>
    `;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px;';

    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = `
      padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer;
      font-weight: 600; font-size: 13px;
      background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ffc107' : '#f44336'};
      color: ${type === 'warning' ? '#333' : '#fff'};
      transition: opacity 0.2s;
    `;
    okBtn.onmouseenter = () => okBtn.style.opacity = '0.85';
    okBtn.onmouseleave = () => okBtn.style.opacity = '1';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 6px 14px; border-radius: 6px; border: 1px solid currentColor;
      cursor: pointer; font-weight: 600; font-size: 13px;
      background: transparent; color: inherit; transition: background 0.2s;
    `;
    cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(0,0,0,0.06)';
    cancelBtn.onmouseleave = () => cancelBtn.style.background = 'transparent';

    function cleanup() {
      flashDiv.style.animation = 'slideUpFlashMessage 0.3s ease-out';
      setTimeout(() => { flashDiv.remove(); overlay.remove(); }, 300);
    }

    okBtn.addEventListener('click', () => { cleanup(); resolve(true); });
    cancelBtn.addEventListener('click', () => { cleanup(); resolve(false); });

    // Keyboard support: Enter = OK, Escape = Cancel
    const keyHandler = (e) => {
      if (e.key === 'Enter') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(); resolve(true);
      }
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(); resolve(false);
      }
    };
    document.addEventListener('keydown', keyHandler);

    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(okBtn);
    flashDiv.appendChild(contentDiv);
    flashDiv.appendChild(buttonsDiv);

    document.body.appendChild(overlay);
    document.body.appendChild(flashDiv);
  });
}
//_________________________________________________________________________________________________

// Get all link items
const linkItems = document.querySelectorAll('.links li');

// Define the mapping between menu items and their corresponding content sections
const contentMap = [
{ menuClass: 'link-content-d-one', contentClass: 'dashboard-d-sec' },
{ menuClass: 'link-content-d-two', contentClass: 'account-settings-d-sec' },
];

// Add click event listeners to each link item
linkItems.forEach((item, index) => {
    const btn = item.querySelector('a');
    btn.addEventListener('click', () => {
        // Remove active class from all menu items
        linkItems.forEach(menuItem => {
            menuItem.classList.remove('active-li');
        });
        
        // Hide all content sections
        contentMap.forEach(content => {
            const section = document.querySelector(`.${content.contentClass}`);
            if (section) section.style.display = 'none';
        });
        
        // Add active class to the clicked menu item
        item.classList.add('active-li');
        
        // Show the corresponding content section
        const activeContent = document.querySelector(`.${contentMap[index].contentClass}`);
        if (activeContent) activeContent.style.display = 'block';
        
        // Close the mobile menu after clicking a link
        closeMobileMenu();
    });
});

// Initialize first tab as active and show its content
if (linkItems.length > 0) {
    const firstContent = document.querySelector(`.${contentMap[0].contentClass}`);
    if (firstContent) firstContent.style.display = 'block';
}

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

// Close menu when clicking outside
if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
}

// Prevent closing when clicking inside the menu
if (mobileMenu) {
    mobileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Close menu when pressing Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 480 && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

//__________________________________________________________________________

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

//________________________________________________________________________

document.addEventListener("DOMContentLoaded", function() {
    // Initialize all custom select components
    const customSelects = document.querySelectorAll(".custom-select");
    const selectBoxes = document.querySelectorAll(".select-box");

    // Main function to update the selected options display
    function updateSelectedOptions(customSelect) {
      const selectedOptions = Array.from(customSelect.querySelectorAll(".option.active"))
          .filter(option => option !== customSelect.querySelector(".option.all-tags"))
          .map(option => ({
              value: option.getAttribute("data-value"),
              text: option.textContent.trim()
          }));

      const selectedValues = selectedOptions.map(option => option.value);
      customSelect.querySelector(".tags_input").value = selectedValues.join(', ');

      const selectedOptionsContainer = customSelect.querySelector(".selected-options");
      let tagsHTML = "";

      if (selectedOptions.length === 0) {
          tagsHTML = '<span class="placeholder">Select The Categories</span>';
      } else {
          // Show maximum 4 tags, then "+X" for remaining
          const maxVisibleTags = 4;
          const visibleTags = selectedOptions.slice(0, maxVisibleTags);
          const remainingCount = selectedOptions.length - maxVisibleTags;

          visibleTags.forEach(option => {
              tagsHTML += `
                  <div class="tag">
                      ${option.text}
                      <span class="remove-tag" data-value="${option.value}">×</span>
                  </div>
              `;
          });

          if (remainingCount > 0) {
              tagsHTML += `
                  <div class="tag remaining-count">
                      +${remainingCount}
                  </div>
              `;
          }
      }

      selectedOptionsContainer.innerHTML = tagsHTML;
  }

    // Initialize each custom select component
    customSelects.forEach(function(customSelect) {
        const searchInput = customSelect.querySelector(".search-tags");
        const optionsContainer = customSelect.querySelector(".options");
        const noResultMessage = customSelect.querySelector(".no-result-message");
        const options = customSelect.querySelectorAll(".option");
        const allTagsOption = customSelect.querySelector(".option.all-tags");
        const clearButton = customSelect.querySelector(".clear");

        // Initially hide options container
        optionsContainer.style.display = "none";

        // Select all/none functionality
        allTagsOption.addEventListener("click", function() {
            const isActive = allTagsOption.classList.contains("active");
            options.forEach(option => {
                if (option !== allTagsOption) {
                    option.classList.toggle("active", !isActive);
                }
            });
            allTagsOption.classList.toggle("active", !isActive);
            updateSelectedOptions(customSelect);
        });

        // Clear search functionality
        clearButton.addEventListener("click", function() {
            searchInput.value = "";
            options.forEach(option => option.style.display = "block");
            noResultMessage.style.display = "none";
            optionsContainer.classList.remove("option-search-active");
        });

        // Search functionality
        searchInput.addEventListener("input", function() {
            const searchTerm = searchInput.value.toLowerCase();
            options.forEach(option => {
                if (option === allTagsOption) return;
                const optionText = option.textContent.trim().toLowerCase();
                option.style.display = optionText.includes(searchTerm) ? "block" : "none";
            });

            const anyOptionsMatch = Array.from(options).some(option => 
                option.style.display === "block" && option !== allTagsOption
            );
            noResultMessage.style.display = anyOptionsMatch ? "none" : "block";
            optionsContainer.classList.toggle("option-search-active", !!searchTerm);
        });

        // Individual option selection
        options.forEach(option => {
            option.addEventListener("click", function(e) {
                e.stopPropagation();
                if (option === allTagsOption) return;
                option.classList.toggle("active");
                updateSelectedOptions(customSelect);
            });
        });
    });

    // Tag removal functionality
    document.addEventListener("click", function(event) {
        const removeTag = event.target.closest(".remove-tag");
        if (removeTag) {
            event.stopPropagation();
            const customSelect = removeTag.closest(".custom-select");
            const valueToRemove = removeTag.getAttribute("data-value");
            const optionToRemove = customSelect.querySelector(`.option[data-value="${valueToRemove}"]`);
            
            if (optionToRemove) {
                optionToRemove.classList.remove("active");
                const otherSelectedOptions = customSelect.querySelectorAll(".option.active:not(.all-tags)");
                const allTagsOption = customSelect.querySelector(".option.all-tags");
                
                if (otherSelectedOptions.length === 0) {
                    allTagsOption.classList.remove("active");
                }
                
                updateSelectedOptions(customSelect);
            }
        }
    });

    // Toggle select box open/close
    selectBoxes.forEach(selectBox => {
        selectBox.addEventListener("click", function(event) {
            if (!event.target.closest(".tag") && !event.target.closest(".options")) {
                const optionsContainer = selectBox.querySelector(".options");
                const isOpen = selectBox.parentNode.classList.contains("open");
                
                // Close all other selects first
                customSelects.forEach(cs => {
                    cs.classList.remove("open");
                    cs.querySelector(".options").style.display = "none";
                });
                
                // Toggle this one
                if (!isOpen) {
                    selectBox.parentNode.classList.add("open");
                    optionsContainer.style.display = "block";
                }
            }
        });
    });

    // Close select boxes when clicking outside
    document.addEventListener("click", function(event) {
        if (!event.target.closest(".custom-select") && !event.target.classList.contains("remove-tag")) {
            customSelects.forEach(customSelect => {
                customSelect.classList.remove("open");
                customSelect.querySelector(".options").style.display = "none";
            });
        }
    });

    // Reset all selects
    function resetCustomSelects() {
        customSelects.forEach(customSelect => {
            customSelect.querySelectorAll(".option.active").forEach(option => {
                option.classList.remove("active");
            });
            customSelect.querySelector(".option.all-tags").classList.add("active");
            updateSelectedOptions(customSelect);
        });
    }
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
      showFlashMessage('Please select an image file (JPG/PNG)', 'error');
      target.value = '';
      return;
    }

    // Change to uploading state
    uploadIcon.outerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="currentColor" class="bi bi-cloud-arrow-up-fill" viewBox="0 0 16 16">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="#4BB543" class="bi bi-cloud-check-fill" viewBox="0 0 16 16">
          <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 4.854-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
        </svg>`;
      uploadText.textContent = 'Image Uploaded Successfully';
      uploadText.style.color = '#4BB543';
      
      // Add success class to wrapper
      wrapper.classList.add('upload-success');
    }
  }, 100);
}

//__________________________________________________________________________
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

//__________________________________________________________________________
// let visa_btn = document.querySelector(".visa-btn");
// let mastercard_btn = document.querySelector(".mastercard-btn");
// let paypal_btn = document.querySelector(".paypal-btn");
// let googlepay_btn = document.querySelector(".googlepay-btn");
// let payment_methods_boxes = document.querySelector(".payment-methods-boxes");
// let triangle = document.querySelector(".triangle");
// visa_btn.addEventListener("click", () => {
//     triangle.style.top = "15px";
//     payment_methods_boxes.style.setProperty('--before-top', '0px');
// });

// mastercard_btn.addEventListener("click", () => {
//     triangle.style.top = "85px";
//     payment_methods_boxes.style.setProperty('--before-top', '70px');
// });

// paypal_btn.addEventListener("click", () => {
//     triangle.style.top = "155px";
//     payment_methods_boxes.style.setProperty('--before-top', '140px');
// });

// googlepay_btn.addEventListener("click", () => {
//     triangle.style.top = "225px";
//     payment_methods_boxes.style.setProperty('--before-top', '210px');
// });
// //__________________________________________________________________________
// // Function to check screen width and initialize event listeners
// function initializePaymentMethods() {
//     let visa_btn = document.querySelector(".visa-btn");
//     let mastercard_btn = document.querySelector(".mastercard-btn");
//     let paypal_btn = document.querySelector(".paypal-btn");
//     let googlepay_btn = document.querySelector(".googlepay-btn");
//     let payment_methods_boxes = document.querySelector(".payment-methods-boxes");
//     // Check if screen width is 480px or less
//     if (window.innerWidth <= 480) {
//         // Add event listeners only for mobile screens
//         visa_btn.addEventListener("click", () => {
//             payment_methods_boxes.style.setProperty('--before-top', '0px');
//             payment_methods_boxes.style.setProperty('--before-left', '0px');
//         });

//         mastercard_btn.addEventListener("click", () => {
//             payment_methods_boxes.style.setProperty('--before-top', '0px');
//             payment_methods_boxes.style.setProperty('--before-left', '198px');
//         });

//         paypal_btn.addEventListener("click", () => {
//             payment_methods_boxes.style.setProperty('--before-top', '70px');
//             payment_methods_boxes.style.setProperty('--before-left', '0px');
//         });

//         googlepay_btn.addEventListener("click", () => {
//             payment_methods_boxes.style.setProperty('--before-top', '70px');
//             payment_methods_boxes.style.setProperty('--before-left', '198px');
//         });
//     }
// }

// // Initialize on page load
// document.addEventListener('DOMContentLoaded', initializePaymentMethods);

// // Optional: Re-initialize on window resize to handle screen size changes
// window.addEventListener('resize', function() {
//     // You might want to add debouncing here for performance
//     initializePaymentMethods();
// });
// //__________________________________________________________________________
// let visa_btn_two = document.querySelector(".payment-two .payment-methods-boxes .visa-btn");
// let mastercard_btn_two = document.querySelector(".payment-two .payment-methods-boxes .mastercard-btn");
// let paypal_btn_two = document.querySelector(".payment-two .payment-methods-boxes .paypal-btn");
// let googlepay_btn_two = document.querySelector(".payment-two .payment-methods-boxes .googlepay-btn");
// let payment_methods_boxes_two = document.querySelector(".payment-two .payment-methods-boxes");
// let triangle_two = document.querySelector(".payment-two .payment-methods-boxes .triangle");
// visa_btn_two.addEventListener("click", () => {
//     triangle_two.style.top = "15px";
//     payment_methods_boxes_two.style.setProperty('--before-top', '0px');
// });

// mastercard_btn_two.addEventListener("click", () => {
//     triangle_two.style.top = "85px";
//     payment_methods_boxes_two.style.setProperty('--before-top', '70px');
// });

// paypal_btn_two.addEventListener("click", () => {
//     triangle_two.style.top = "155px";
//     payment_methods_boxes_two.style.setProperty('--before-top', '140px');
// });

// googlepay_btn_two.addEventListener("click", () => {
//     triangle_two.style.top = "225px";
//     payment_methods_boxes_two.style.setProperty('--before-top', '210px');
// });
// //__________________________________________________________________________
// // Function to check screen width and initialize event listeners
// function initializePaymentMethodsTwo() {
//     let visa_btn_two = document.querySelector(".payment-two .visa-btn");
//     let mastercard_btn_two = document.querySelector(".payment-two .mastercard-btn");
//     let paypal_btn_two = document.querySelector(".payment-two .paypal-btn");
//     let googlepay_btn_two = document.querySelector(".payment-two .googlepay-btn");
//     let payment_methods_boxes_two = document.querySelector(".payment-two .payment-methods-boxes");
//     // Check if screen width is 480px or less
//     if (window.innerWidth <= 480) {
//         // Add event listeners only for mobile screens
//         visa_btn_two.addEventListener("click", () => {
//             payment_methods_boxes_two.style.setProperty('--before-top', '0px');
//             payment_methods_boxes_two.style.setProperty('--before-left', '0px');
//         });

//         mastercard_btn_two.addEventListener("click", () => {
//             payment_methods_boxes_two.style.setProperty('--before-top', '0px');
//             payment_methods_boxes_two.style.setProperty('--before-left', '198px');
//         });

//         paypal_btn_two.addEventListener("click", () => {
//             payment_methods_boxes_two.style.setProperty('--before-top', '70px');
//             payment_methods_boxes_two.style.setProperty('--before-left', '0px');
//         });

//         googlepay_btn_two.addEventListener("click", () => {
//             payment_methods_boxes_two.style.setProperty('--before-top', '70px');
//             payment_methods_boxes_two.style.setProperty('--before-left', '198px');
//         });
//     }
// }

// // Initialize on page load
// document.addEventListener('DOMContentLoaded', initializePaymentMethodsTwo);

// // Optional: Re-initialize on window resize to handle screen size changes
// window.addEventListener('resize', function() {
//     // You might want to add debouncing here for performance
//     initializePaymentMethodsTwo();
// });
//__________________________________________________________________________
//__________________________________________________________________________
// let add_credit_card_box = document.querySelector(".add-credit-card-box");
// let add_credit_card_btn = document.querySelector(".add-credit-card-btn");
// let close_btn = document.querySelector(".close-btn");
// let payment_two = document.querySelector(".payment-two");
// add_credit_card_btn.addEventListener("click", () => {
//   payment_two.style.display = "flex"
//   add_credit_card_box.style.display = "none"
// });
// close_btn.addEventListener("click", () => {
//   payment_two.style.display = "none"
//   add_credit_card_box.style.display = "flex"
// });
//__________________________________________________________________________


//__________________________________________________________________________
// Load Google Charts library
// google.charts.load('current', {packages: ['corechart']});
// google.charts.setOnLoadCallback(drawCharts);

// function drawCharts() {
//   // Bar chart data
//   var barData = google.visualization.arrayToDataTable([
//     ['Day', 'Page Views', 'Unique Views'],
//     ['Sun', 1050, 600],
//     ['Mon', 1370, 910],
//     ['Tue', 660, 400],
//     ['Wed', 1030, 540],
//     ['Thu', 1000, 480],
//     ['Fri', 1170, 960],
//     ['Sat', 660, 320]
//   ]);

//   // Bar chart options
//   var barOptions = {
//     focusTarget: 'category',
//     backgroundColor: 'transparent',
//     colors: ['cornflowerblue', 'tomato'],
//     fontName: 'Open Sans',
//     chartArea: {
//       left: 50,
//       top: 10,
//       width: '100%',
//       height: '70%'
//     },
//     bar: {
//       groupWidth: '80%'
//     },
//     hAxis: {
//       textStyle: {
//         fontSize: 11
//       }
//     },
//     vAxis: {
//       minValue: 0,
//       maxValue: 1500,
//       baselineColor: '#DDD',
//       gridlines: {
//         color: '#DDD',
//         count: 4
//       },
//       textStyle: {
//         fontSize: 11
//       }
//     },
//     legend: {
//       position: 'bottom',
//       textStyle: {
//         fontSize: 12
//       }
//     },
//     animation: {
//       duration: 1200,
//       easing: 'out',
//       startup: true
//     }
//   };

//   // Draw bar chart
//   var barChart = new google.visualization.ColumnChart(document.getElementById('bar-chart'));
//   barChart.draw(barData, barOptions);
// }

// // Your progress circle code (unrelated to Google Charts)
// const progressCircle = document.querySelector('.circle-progress');
// const percentageText = document.querySelector('.percentage');
// const statusText = document.querySelector('.status');
// let progress = 0;

// const interval = setInterval(() => {
//   if (progress < 100) {
//     progress += 1;
//     const offset = 339.292 - (339.292 * progress) / 100;
    
//     if (progressCircle) progressCircle.style.strokeDashoffset = offset;
//     if (percentageText) percentageText.textContent = `${progress}%`;
//   } else {
//     clearInterval(interval);
//   }
// }, 60);


//______________________________________________________________________________________________

//________________________________________________________________________________________________________
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

//__________________________________________________________________________________________________________
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
//__________________________________________________________________________________________________________
// // Add some interactivity
// document.addEventListener('DOMContentLoaded', function() {
//     const paymentMethods = document.querySelectorAll('.payment-method');
//     const radioInputs = document.querySelectorAll('input[type="radio"]');
    
//     // Make entire payment method clickable
//     paymentMethods.forEach(method => {
//         method.addEventListener('click', function(e) {
//             // Don't trigger if user clicked on delete button
//             if (e.target.closest('.delete-payment-method-btn')) {
//                 return;
//             }
            
//             const radioInput = this.querySelector('input[type="radio"]');
//             if (radioInput) {
//                 radioInput.checked = true;
                
//                 // Update visual selection state
//                 paymentMethods.forEach(m => m.style.borderColor = '#e6e6e6');
//                 this.style.borderColor = '#ff9a17';
//             }
//         });
//     });
    
//     // Update border color when selection changes
//     radioInputs.forEach(input => {
//         input.addEventListener('change', function() {
//             paymentMethods.forEach(method => {
//                 method.style.borderColor = '#e6e6e6';
//             });
            
//             if (this.checked) {
//                 this.closest('.payment-method').style.borderColor = '#ff9a17';
//             }
//         });
//     });
    
//     // Set initial border color for selected method
//     document.querySelector('input[type="radio"]:checked')
//         .closest('.payment-method').style.borderColor = '#ff9a17';
        
//     // Add delete confirmation
//     document.querySelectorAll('.delete-payment-method-btn').forEach(btn => {
//         btn.addEventListener('click', function(e) {
//             e.stopPropagation();
//             if (confirm('Are you sure you want to delete this payment method?')) {
//                 this.closest('.payment-method').style.display = 'none';
//             }
//         });
//     });
// });
//__________________________________________________________________________________________________________
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
                            "complaintTitleTgt": "Enter the problem you are facing",
                            "complaintLabelTgt": "Enter A Problem",
                            "complaintBtnTgt": "Send",
                            //________________________________________
                            "userPanelLinkOneTgt": "Dashboard",
                            "userPanelLinkTwoTgt": "Account Settings",
                            "userPanelLinkThreeTgt": "Payment Settings",
                            "userPanelLinkLogoutTgt": "Logout",
                            // "userPanelLinkFourTgt": "Saved Fundraisers",
                            // "userPanelLinkFiveTgt": "Almost Done Fundraisers",
                            //________________________________________
                            "userPanelDashboardTitleTgt": "Dashboard",
                            "userPanelDashboardLastDonationsTitleTgt": "My Last Donations",
                            "userPanelDashboardAchievementsTitleTgt": "My Achievements",
                            "userPanelDashboardRewardsBoardTitleTgt": "Rewards Board",
                            "userPanelDashboardAchievementsCurrentPointsTgt": "Current Points",
                            "userPanelDashboardAchievementsGreatfulTableImageTgt": "User Image",
                            "userPanelDashboardAchievementsGreatfulTableNameTgt": "User Name",
                            "userPanelDashboardAchievementsGreatfulTablePointsTgt": "Points",
                            "userPanelDashbordNotificationBarTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit.Quisqu Inventore, vitae? Voluptatum voluptas!",
                            "userPanelDashboardRanksRewardsTitleTgt": "Ranks Rewards",
                            "userPanelDashboardRanksRewardsTitleRewarksTgt": "Rewards",
                            "userPanelDashboardDonationsTableFundraiserTitleTgt": "Fundraiser Title",
                            "userPanelDashboardDonationsTablePaymentMethodTgt": "Payment Method",
                            "userPanelDashboardDonationsTableImageStatusTgt": "Status",
                            "userPanelDashboardDonationsTableImagePaidAt": "Donated At",
                            "userPanelDashboardDonationsTableAmount": "Amount",
                            //________________________________________
                            "userPanelAccountSettingsTitleTgt": "Account Settings",
                            "userPanelAccountInformationTitleTgt": "Account Information :",
                            "userPanelAccountInformationNameTitleTgt": "Name :",
                            "userPanelAccountInformationBirthDayTitleTgt": "BirthDay :",
                            "userPanelAccountInformationGenderTitleTgt": "Gender :",
                            "userPanelAccountInformationWhatsAppNumberTitleTgt": "WhatsApp Number :",
                            "userPanelAccountInformationAddressTitleTgt": "Address :",
                            "userPanelAccountInformationEmailTitleTgt": "Email :",
                            //________________________________________
                            "userPanelAccountChangeTitleTgt": "Change Account Settings :",
                            "userPanelAccountChangePasswordTitleTgt": "Change Your Password",
                            "userPanelAccountChangePasswordLabelTgt": "Old Password",
                            "userPanelAccountChangeNewPasswordLabelTgt": "New Password",
                            "userPanelAccountChangeConfirmNewPasswordLabelTgt": "Confirm New Password",
                            "userPanelAccountChangeImageTitleTgt": "Change Your Profile Image",
                            "userPanelAccountChangeImageLabelTgt": "Change Your Image",
                            "userPanelAccountChangeBtnTgt": "Save Changes",
                            //_________________________________________
                            "userPanelPaymentSettingsTitleTgt": "Payment Settings",
                            "userPanelPaymentSettingsSelectTitleTgt": "Select Your Payment Method :",
                            "userPanelPaymentSettingsTypeInformationTitleTgt": "Type Credit Card Information :",
                            "userPanelPaymentSettingsCardNumberLabelTgt": "Card Number",
                            "userPanelPaymentSettingsNameOnCardLabelTgt": "Name On Card",
                            "userPanelPaymentSettingsDayLabelTgt": "day",
                            "userPanelPaymentSettingsYearLabelTgt": "year",
                            "userPanelPaymentSettingsSaveBtnTgt": "Save",
                            "userPanelPaymentSettingsAddAnotherTitleTgt": "Add Another Credit Card",
                            //__________________________________________
                            "userPanelPaymentSettingsChangeTitleTgt": "Change Payment Method :",
                            "userPanelPaymentSettingsChangeBtnTgt": "Confirm",
                            //__________________________________________
                            'validation.required': 'This field is required.',
                            'validation.minLength': 'Must be at least {{min}} characters.',
                            'validation.maxLength': 'Must not exceed {{max}} characters.',
                            'validation.invalidFormat': 'Invalid format.',
                            'validation.passwordMin': 'Password must be at least 6 characters.',
                            'validation.passwordMax': 'Password must not exceed 128 characters.',
                            'validation.passwordMatch': 'Passwords do not match.',
                            'validation.passwordSame': 'New password cannot be the same as old password.',
                            'validation.imageType': 'Please select a valid image file (JPG, PNG, GIF).',
                            'validation.imageSize': 'Image size must not exceed 5MB.',
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
                            "notificationsTitleTgt": "الإشعارات",
                            //________________________________________
                            "complaintTitleTgt": "أدخل المشكلة التي تواجهك",
                            "complaintLabelTgt": "أدخل المشكلة",
                            "complaintBtnTgt": "أرسل",
                            //________________________________________
                            "userPanelLinkOneTgt": "لوحة التحكم",
                            "userPanelLinkTwoTgt": "إعدادات الحساب",
                            "userPanelLinkThreeTgt": "إعدادات التبرع",
                            "userPanelLinkLogoutTgt": "تسجيل الخروج",
                            //________________________________________
                            "userPanelDashboardTitleTgt": "لوحة التحكم",
                            "userPanelDashboardLastDonationsTitleTgt": "تبرعاتي الأخيرة",
                            "userPanelDashboardAchievementsTitleTgt": "إنجازاتي",
                            "userPanelDashboardRewardsBoardTitleTgt": "لوحة المكافئات",
                            "userPanelDashboardAchievementsCurrentPointsTgt": "النقاط الحالية",
                            "userPanelDashboardAchievementsGreatfulTableImageTgt": "صورة الشاكر",
                            "userPanelDashboardAchievementsGreatfulTableNameTgt": "إسم الشاكر",
                            "userPanelDashboardAchievementsGreatfulTablePointsTgt": "النقاط",
                            "userPanelDashbordNotificationBarTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى.",
                            "userPanelDashboardRanksRewardsTitleTgt": "مكافئات الرتب",
                            "userPanelDashboardRanksRewardsTitleRewarksTgt": "المكافئات",
                            "userPanelDashboardDonationsTableFundraiserTitleTgt": "عنوان الحملة",
                            "userPanelDashboardDonationsTablePaymentMethodTgt": "طريقة الدفع",
                            "userPanelDashboardDonationsTableImageStatusTgt": "الحالة",
                            "userPanelDashboardDonationsTableImagePaidAt": "تُبرعت في",
                            "userPanelDashboardDonationsTableAmount": "المبلغ",
                            //________________________________________
                            "userPanelAccountSettingsTitleTgt": "إعدادات الحساب",
                            "userPanelAccountInformationTitleTgt": "تفاصيل الحساب :",
                            "userPanelAccountInformationNameTitleTgt": "الإسم :",
                            "userPanelAccountInformationBirthDayTitleTgt": "تاريخ الميلاد :",
                            "userPanelAccountInformationGenderTitleTgt": "الجنس :",
                            "userPanelAccountInformationWhatsAppNumberTitleTgt": "رقم الواتساب :",
                            "userPanelAccountInformationAddressTitleTgt": "العنوان :",
                            "userPanelAccountInformationEmailTitleTgt": "الإيميل :",
                            //________________________________________
                            "userPanelAccountChangeTitleTgt": "تغيير إعدادات الحساب :",
                            "userPanelAccountChangePasswordTitleTgt": "تغيير كلمة المرور",
                            "userPanelAccountChangePasswordLabelTgt": "كلمة المرور القديمة",
                            "userPanelAccountChangeNewPasswordLabelTgt": "كلمة المرور الجديدة",
                            "userPanelAccountChangeConfirmNewPasswordLabelTgt": "تأكيد كلمة المرور",
                            "userPanelAccountChangeImageTitleTgt": "تغيير صورة الحساب",
                            "userPanelAccountChangeImageLabelTgt": "تغيير صورتك",
                            "userPanelAccountChangeBtnTgt": "حفظ التغييرات",
                            //_________________________________________
                            "userPanelPaymentSettingsTitleTgt": "إعدادات الدفع",
                            "userPanelPaymentSettingsSelectTitleTgt": "إختر طريقتك للدفع :",
                            "userPanelPaymentSettingsTypeInformationTitleTgt": "أكتب بيانات بطاقة الإئتمان",
                            "userPanelPaymentSettingsCardNumberLabelTgt": "رقم البطاقة",
                            "userPanelPaymentSettingsNameOnCardLabelTgt": "الاسم على البطاقة",
                            "userPanelPaymentSettingsDayLabelTgt": "يوم",
                            "userPanelPaymentSettingsYearLabelTgt": "سنة",
                            "userPanelPaymentSettingsSaveBtnTgt": "حفظ",
                            "userPanelPaymentSettingsAddAnotherTitleTgt": "إضافة بطاقة إئتمان أخرى",
                            //__________________________________________
                            "userPanelPaymentSettingsChangeTitleTgt": "تغيير طريقة الدفع :",
                            "userPanelPaymentSettingsChangeBtnTgt": "تأكيد",
                            //__________________________________________
                            'validation.required': 'هذا الحقل مطلوب.',
                            'validation.minLength': 'يجب أن يكون على الأقل {{min}} أحرف.',
                            'validation.maxLength': 'يجب ألا يتجاوز {{max}} أحرف.',
                            'validation.invalidFormat': 'تنسيق غير صالح.',
                            'validation.passwordMin': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
                            'validation.passwordMax': 'يجب ألا تتجاوز كلمة المرور 128 حرفاً.',
                            'validation.passwordMatch': 'كلمتا المرور غير متطابقتين.',
                            'validation.passwordSame': 'لا يمكن أن تكون كلمة المرور الجديدة مطابقة للقديمة.',
                            'validation.imageType': 'يرجى اختيار ملف صورة صالح (JPG أو PNG أو GIF).',
                            'validation.imageSize': 'يجب ألا يتجاوز حجم الصورة 5 ميجابايت.',
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
    //     let visa_btn = document.querySelector(".visa-btn");
    // let mastercard_btn = document.querySelector(".mastercard-btn");
    // let paypal_btn = document.querySelector(".paypal-btn");
    // let googlepay_btn = document.querySelector(".googlepay-btn");
    // let payment_methods_boxes = document.querySelector(".payment-methods-boxes");
    // let triangle = document.querySelector(".triangle");
    
    // if (visa_btn && mastercard_btn && paypal_btn && googlepay_btn && payment_methods_boxes && triangle) {
    //     visa_btn.addEventListener("click", () => {
    //         triangle.style.top = "15px";
    //         payment_methods_boxes.style.setProperty('--before-top', '0px');
    //     });

    //     mastercard_btn.addEventListener("click", () => {
    //         triangle.style.top = "85px";
    //         payment_methods_boxes.style.setProperty('--before-top', '70px');
    //     });

    //     paypal_btn.addEventListener("click", () => {
    //         triangle.style.top = "155px";
    //         payment_methods_boxes.style.setProperty('--before-top', '140px');
    //     });

    //     googlepay_btn.addEventListener("click", () => {
    //         triangle.style.top = "225px";
    //         payment_methods_boxes.style.setProperty('--before-top', '210px');
    //     });
    // }
    // //__________________________________________________________________________
    // // Function to check screen width and initialize event listeners
    // function initializePaymentMethods() {
    //     let visa_btn = document.querySelector(".visa-btn");
    //     let mastercard_btn = document.querySelector(".mastercard-btn");
    //     let paypal_btn = document.querySelector(".paypal-btn");
    //     let googlepay_btn = document.querySelector(".googlepay-btn");
    //     let payment_methods_boxes = document.querySelector(".payment-methods-boxes");
        
    //     if (visa_btn && mastercard_btn && paypal_btn && googlepay_btn && payment_methods_boxes) {
    //         // Check if screen width is 480px or less
    //         if (window.innerWidth <= 480) {
    //             // Add event listeners only for mobile screens
    //             visa_btn.addEventListener("click", () => {
    //                 payment_methods_boxes.style.setProperty('--before-top', '0px');
    //                 payment_methods_boxes.style.setProperty('--before-left', '198px');
    //             });

    //             mastercard_btn.addEventListener("click", () => {
    //                 payment_methods_boxes.style.setProperty('--before-top', '0px');
    //                 payment_methods_boxes.style.setProperty('--before-left', '0px');
    //             });

    //             paypal_btn.addEventListener("click", () => {
    //                 payment_methods_boxes.style.setProperty('--before-top', '70px');
    //                 payment_methods_boxes.style.setProperty('--before-left', '198px');
    //             });

    //             googlepay_btn.addEventListener("click", () => {
    //                 payment_methods_boxes.style.setProperty('--before-top', '70px');
    //                 payment_methods_boxes.style.setProperty('--before-left', '0px');
    //             });
    //         }
    //     }
    // }

    // // Initialize on page load
    // document.addEventListener('DOMContentLoaded', initializePaymentMethods);

    // // Optional: Re-initialize on window resize to handle screen size changes
    // window.addEventListener('resize', function() {
    //     // You might want to add debouncing here for performance
    //     initializePaymentMethods();
    // });
    // //__________________________________________________________________________
    // let visa_btn_two = document.querySelector(".payment-two .payment-methods-boxes .visa-btn");
    // let mastercard_btn_two = document.querySelector(".payment-two .payment-methods-boxes .mastercard-btn");
    // let paypal_btn_two = document.querySelector(".payment-two .payment-methods-boxes .paypal-btn");
    // let googlepay_btn_two = document.querySelector(".payment-two .payment-methods-boxes .googlepay-btn");
    // let payment_methods_boxes_two = document.querySelector(".payment-two .payment-methods-boxes");
    // let triangle_two = document.querySelector(".payment-two .payment-methods-boxes .triangle");
    
    // if (visa_btn_two && mastercard_btn_two && paypal_btn_two && googlepay_btn_two && payment_methods_boxes_two && triangle_two) {
    //     visa_btn_two.addEventListener("click", () => {
    //         triangle_two.style.top = "15px";
    //         payment_methods_boxes_two.style.setProperty('--before-top', '0px');
    //     });

    //     mastercard_btn_two.addEventListener("click", () => {
    //         triangle_two.style.top = "85px";
    //         payment_methods_boxes_two.style.setProperty('--before-top', '70px');
    //     });

    //     paypal_btn_two.addEventListener("click", () => {
    //         triangle_two.style.top = "155px";
    //         payment_methods_boxes_two.style.setProperty('--before-top', '140px');
    //     });

    //     googlepay_btn_two.addEventListener("click", () => {
    //         triangle_two.style.top = "225px";
    //         payment_methods_boxes_two.style.setProperty('--before-top', '210px');
    //     });
    // }
    // //__________________________________________________________________________
    // // Function to check screen width and initialize event listeners
    // function initializePaymentMethodsTwo() {
    //     let visa_btn_two = document.querySelector(".payment-two .visa-btn");
    //     let mastercard_btn_two = document.querySelector(".payment-two .mastercard-btn");
    //     let paypal_btn_two = document.querySelector(".payment-two .paypal-btn");
    //     let googlepay_btn_two = document.querySelector(".payment-two .googlepay-btn");
    //     let payment_methods_boxes_two = document.querySelector(".payment-two .payment-methods-boxes");
        
    //     if (visa_btn_two && mastercard_btn_two && paypal_btn_two && googlepay_btn_two && payment_methods_boxes_two) {
    //         // Check if screen width is 480px or less
    //         if (window.innerWidth <= 480) {
    //             // Add event listeners only for mobile screens
    //             visa_btn_two.addEventListener("click", () => {
    //                 payment_methods_boxes_two.style.setProperty('--before-top', '0px');
    //                 payment_methods_boxes_two.style.setProperty('--before-left', '198px');
    //             });

    //             mastercard_btn_two.addEventListener("click", () => {
    //                 payment_methods_boxes_two.style.setProperty('--before-top', '0px');
    //                 payment_methods_boxes_two.style.setProperty('--before-left', '0px');
    //             });

    //             paypal_btn_two.addEventListener("click", () => {
    //                 payment_methods_boxes_two.style.setProperty('--before-top', '70px');
    //                 payment_methods_boxes_two.style.setProperty('--before-left', '198px');
    //             });

    //             googlepay_btn_two.addEventListener("click", () => {
    //                 payment_methods_boxes_two.style.setProperty('--before-top', '70px');
    //                 payment_methods_boxes_two.style.setProperty('--before-left', '0px');
    //             });
    //         }
    //     }
    // }

    // // Initialize on page load
    // document.addEventListener('DOMContentLoaded', initializePaymentMethodsTwo);

    // // Optional: Re-initialize on window resize to handle screen size changes
    // window.addEventListener('resize', function() {
    //     // You might want to add debouncing here for performance
    //     initializePaymentMethodsTwo();
    // });
    
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
//___________________________________________________________________________________________
// Function to fetch and display invoices
async function loadUserInvoices() {
  try {
    console.log('🔄 Starting to load user invoices...');
    
    const response = await fetch('/api/invoices/my-invoices', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 API Response status:', response.status);
    
    const result = await response.json();
    console.log('📊 API Response data:', result);

    if (result.success) {
      console.log(`✅ Found ${result.data.length} invoices`);
      // Sort by payment date (newest first), fallback to creation date
      const sortedData = result.data.sort((a, b) => {
        // Paid donations first, then sort by date within each group
        const aIsPaid = a.status === 'paid' || a.displayStatus === 'Successful';
        const bIsPaid = b.status === 'paid' || b.displayStatus === 'Successful';
        
        if (aIsPaid && !bIsPaid) return -1;
        if (!aIsPaid && bIsPaid) return 1;
        
        // Same status group — sort by date (newest first)
        const dateA = new Date(a.paid_at || a.created_at || a.createdAt || 0);
        const dateB = new Date(b.paid_at || b.created_at || b.createdAt || 0);
        return dateB - dateA;
      });
      TablePagination.storeData('donations', sortedData);
    } else {
      console.error('❌ Failed to load invoices:', result.error);
      showErrorMessage('Failed to load donations: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('💥 Error loading invoices:', error);
    showErrorMessage('Error loading donations. Please check console for details.');
  }
}

// Helper function to get cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function displayInvoices(invoices) {
  const tbody = document.querySelector('.my-donations-table tbody');
  
  if (!tbody) {
    console.error('❌ Could not find table body element');
    showErrorMessage('Table element not found');
    return;
  }
  
  tbody.innerHTML = '';

  console.log(`🎯 Displaying ${invoices.length} invoices in table`);

  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
          No donations found. Make your first donation to see it here!
        </td>
      </tr>
    `;
    return;
  }

  // Show message if there are more than 10 donations
  if (invoices.length === 10) {
    console.log('ℹ️ Showing last 10 donations - there might be more in your history');
  }

  invoices.forEach((invoice, index) => {
    console.log(`📝 Processing invoice ${index + 1}:`, invoice);
    
    const row = document.createElement('tr');
    const statusClass = invoice.displayStatus === 'Successful' ? 'status-success' : 'status-failed';
    
    // Sanitize data to prevent XSS and handle missing values
    const fundraiserTitle = escapeHtml(invoice.fundraiserTitle || 'Unknown Fundraiser');
    const paymentMethod = escapeHtml(invoice.paymentMethod || 'N/A');
    const formattedPaidAt = invoice.formattedPaidAt 
      || (invoice.paid_at ? new Date(invoice.paid_at).toLocaleString() : 'N/A');
    const formattedAmount = invoice.formattedAmount 
      || (invoice.gross_amount ? '$' + parseFloat(invoice.gross_amount).toFixed(2) : '$0.00');
    
    row.innerHTML = `
      <td>${fundraiserTitle}</td>
      <td>${paymentMethod}</td>
      <td>
        <span class="status-badge ${statusClass}">
          ${invoice.displayStatus}
        </span>
      </td>
      <td>${formattedPaidAt}</td>
      <td>${formattedAmount}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  console.log('✅ Table populated successfully with last 10 donations');
}

async function deleteInvoice(invoiceId) {
  if (!await showFlashConfirm('Are you sure you want to delete this donation record?')) {
    return;
  }

  try {
    const response = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      showSuccessMessage('Donation record deleted successfully');
      loadUserInvoices(); // Reload the list
    } else {
      showErrorMessage(result.error || 'Failed to delete donation record');
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    showErrorMessage('Error deleting donation record');
  }
}

// Enhanced utility functions
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== VALIDATION HELPERS ====================

function t(key, fallback, options = {}) {
  if (typeof i18next !== 'undefined' && i18next.t) {
    const translated = i18next.t(key, { ...options, defaultValue: fallback });
    return translated === key ? fallback : translated;
  }
  let result = fallback;
  Object.keys(options).forEach(optKey => {
    result = result.replace(new RegExp(`{{\\s*${optKey}\\s*}}`, 'g'), options[optKey]);
  });
  return result;
}

function showFieldError(fieldId, message, i18nKey = null, interpolationVars = {}) {
  const errorDiv = document.getElementById(`${fieldId}-error`);
  if (!errorDiv) {
    console.warn(`Validation error div not found: #${fieldId}-error`);
    return;
  }
  const msgEl = errorDiv.querySelector('.error-message');
  const displayMessage = i18nKey ? t(i18nKey, message, interpolationVars) : message;
  if (msgEl) msgEl.textContent = displayMessage;
  errorDiv.style.display = 'flex';
  errorDiv.classList.add('auto-dismiss');
  setTimeout(() => {
    hideFieldError(fieldId);
  }, 4000);
}

function hideFieldError(fieldId) {
  const errorDiv = document.getElementById(`${fieldId}-error`);
  if (!errorDiv) return;
  errorDiv.style.display = 'none';
  errorDiv.classList.remove('auto-dismiss');
}

function clearAllFieldErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.validation-error').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('auto-dismiss');
  });
}

function showSuccessMessage(message) {
  // You can replace this with a better notification system
  showFlashMessage(message, 'success');
}

function showErrorMessage(message) {
  // You can replace this with a better notification system
  showFlashMessage(message, 'error');
}

// Add this function to check if user is authenticated on page load
function checkAuthStatus() {
  console.log('🔍 Checking authentication status...');
  loadUserInvoices();
}

// Load invoices when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing donation history...');
  checkAuthStatus();
});


//__________________________________________________________________________________________________

// =============================================
// GRATEFUL USERS FUNCTIONS
// =============================================

// Global variable to store grateful users data
let gratefulUsersList = [];

// Function to fetch and display grateful users
async function loadGratefulUsers() {
  try {
    console.log('🔄 [GRATEFUL USERS] Loading users who thanked you...');
    
    const response = await fetch('/api/donors/my-thankers', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 [GRATEFUL USERS] Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 [GRATEFUL USERS] Result:', result);

    if (result.success) {
      gratefulUsersList = result.data;
      TablePagination.storeData('thankers', gratefulUsersList);
    } else {
      console.error('❌ [GRATEFUL USERS] Failed to load grateful users:', result.error);
      showErrorMessage('Failed to load grateful users: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('💥 [GRATEFUL USERS] Error:', error);
    showErrorMessage('Error loading grateful users. Please check console for details.');
  }
}

// Function to display grateful users in the table
// Function to display grateful users in the table
function displayGratefulUsersTable(usersData) {
  const tbody = document.querySelector('.greatful-users-table tbody');
  
  if (!tbody) {
    console.error('❌ [GRATEFUL USERS] Could not find grateful users table body');
    return;
  }
  
  tbody.innerHTML = '';

  const displayList = usersData || gratefulUsersList;
  console.log(`🎯 [GRATEFUL USERS] Displaying ${displayList.length} grateful users in table`);

  if (displayList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 20px; color: #666;">
          No one has thanked you yet. Keep helping others to receive thanks!
        </td>
      </tr>
    `;
    return;
  }

  // Show message if there are more than 5 thank-you
  if (displayList.length === 5) {
    console.log('ℹ️ Showing last 5 thank-you - there might be more in your history');
  }

  displayList.forEach((user, index) => {
    console.log(`🙏 [GRATEFUL USERS] Processing grateful user ${index + 1}:`, user);
    
    const row = document.createElement('tr');
    
    // Handle user image
    const userImage = user.user_image 
      ? `<img src="${user.user_image}" alt="${user.full_name}" class="user-avatar">`
      : '<div class="default-avatar">👤</div>';
    
    // FIXED: Use user_grateful_id instead of userId or id
    const userGratefulId = user.user_grateful_id;
    
    if (!userGratefulId) {
      console.error('❌ [GRATEFUL USERS] No user_grateful_id found for user:', user);
    }
    
    row.innerHTML = `
      <td class="user-image-cell" data-user-grateful-id="${userGratefulId}" style="cursor: pointer;">
        ${userImage}
      </td>
      <td class="user-name-cell">
        ${escapeHtml(user.full_name || 'Anonymous User')}
      </td>
      <td class="points-cell">
        <span class="points-badge">${user.points}</span>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add event listeners after creating the table
  addUserImageClickListeners();
  
  console.log('✅ [GRATEFUL USERS] Grateful users table populated successfully with last 5 thank-you');
}

// Function to add click event listeners to user images
function addUserImageClickListeners() {
  const userImageCells = document.querySelectorAll('.user-image-cell');
  
  userImageCells.forEach(cell => {
    cell.addEventListener('click', function(event) {
      // FIXED: Use user_grateful_id instead of user ID
      const userGratefulId = this.getAttribute('data-user-grateful-id');
      
      if (!userGratefulId) {
        console.error('❌ No user_grateful_id found for clicked user');
        return;
      }
      
      handleFundraiserAccountClick(event, userGratefulId);
    });
  });
}

// Function to handle fundraiser account clicks
function handleFundraiserAccountClick(event, userGratefulId) {
    event.stopPropagation(); // Prevent event bubbling
    
    console.log('👆 [GRATEFUL USERS] User image clicked for user_grateful_id:', userGratefulId);
    
    // Validate user_grateful_id
    if (!userGratefulId || userGratefulId === 'null' || userGratefulId === 'undefined') {
        console.error('❌ Invalid user_grateful_id:', userGratefulId);
        showErrorMessage('Cannot open user profile: Invalid user ID');
        return false;
    }
    
    // If authenticated, proceed to the user account page using user_grateful_id
    window.location.href = `/indigent-account/${userGratefulId}`;
    return true;
}

// =============================================
// PAGE INITIALIZATION
// =============================================

// Load everything when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing all features...');
//   debugFunctionAvailability();
  
//   // Load donation statistics
//   loadDonationStats();
  
//   // Load donors table
//   loadDonors();

  // Load grateful users table
  loadGratefulUsers();
});


//_____________________________________________________________________________________________________


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

//______________________________________________________________________________________________________

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

//_________________________________________________________________________________________________________________-
document.addEventListener("DOMContentLoaded", () => {
  // ═══════════════════════════════════════════════════════════════════════════
  //  ACCOUNT SETTINGS - VALIDATION & IMAGE PREVIEW (from user-panel-indigent)
  // ═══════════════════════════════════════════════════════════════════════════

  function initAccountSettings() {
    const form = document.getElementById('changeSettingsForm');
    if (!form) return;

    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');
    const imageInput = document.getElementById('changeUserImage');
    const uploadArea = document.getElementById('userImageUploadArea');
    const previewContainer = document.getElementById('userImagePreview');
    const previewImg = document.getElementById('userImagePreviewImg');
    const removeBtn = document.getElementById('removeUserImage');
    const changeBtn = form.querySelector('.change-btn');

    // ── Image Upload Preview ──
    if (imageInput && uploadArea) {
      uploadArea.addEventListener('click', () => imageInput.click());
      
      imageInput.addEventListener('change', function() {
        const file = this.files[0];
        hideFieldError('change-user-image-error');
        hideFieldError('change-image-error');
        uploadArea.classList.remove('has-error');

        if (!file) return;

        // Validate file type
        if (!file.type.match('image.*')) {
          showFieldError('change-user-image-error', 'Please select a valid image file (JPG, PNG, GIF).', 'validation.imageType');
          uploadArea.classList.add('has-error');
          this.value = '';
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showFieldError('change-user-image-error', 'Image size must not exceed 5MB.', 'validation.imageSize');
          uploadArea.classList.add('has-error');
          this.value = '';
          return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
          previewImg.src = e.target.result;
          previewContainer.style.display = 'block';
          uploadArea.classList.add('input-box-active');
        };
        reader.readAsDataURL(file);
      });

      // Remove image
      removeBtn?.addEventListener('click', function(e) {
        e.stopPropagation();
        imageInput.value = '';
        previewContainer.style.display = 'none';
        previewImg.src = '';
        uploadArea.classList.remove('input-box-active');
      });
    }

    // ── Input focus effects ──
    [oldPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
      if (!input) return;
      input.addEventListener('focus', () => {
        input.closest('.input-box')?.classList.add('input-box-active');
      });
      input.addEventListener('blur', () => {
        setTimeout(() => input.closest('.input-box')?.classList.remove('input-box-active'), 300);
      });
      input.addEventListener('input', () => {
        hideFieldError(input.id + '-error');
        input.classList.remove('error-field');
      });
    });

    // ── Form Submit with Validation ──
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearAllFieldErrors('changeSettingsForm');
      
      let isValid = true;
      let hasChanges = false;

      const oldPass = oldPasswordInput?.value.trim() || '';
      const newPass = newPasswordInput?.value.trim() || '';
      const confirmPass = confirmPasswordInput?.value.trim() || '';
      const newImage = imageInput?.files[0] || null;

      // Check if any changes were made
      if (!oldPass && !newPass && !confirmPass && !newImage) {
        showFieldError('old-password-error', 'Please update password or image.', 'validation.required');
        isValid = false;
      }

      // ── Password Validation ──
      if (oldPass || newPass || confirmPass) {
        hasChanges = true;

        if (!oldPass) {
          showFieldError('old-password-error', 'Current password is required to change password.', 'validation.required');
          oldPasswordInput?.classList.add('error-field');
          isValid = false;
        }

        if (!newPass) {
          showFieldError('new-password-error', 'New password is required.', 'validation.required');
          newPasswordInput?.classList.add('error-field');
          isValid = false;
        } else if (newPass.length < 6) {
          showFieldError('new-password-error', 'New password must be at least 6 characters.', 'validation.passwordMin');
          newPasswordInput?.classList.add('error-field');
          isValid = false;
        } else if (newPass.length > 128) {
          showFieldError('new-password-error', 'New password must not exceed 128 characters.', 'validation.passwordMax');
          newPasswordInput?.classList.add('error-field');
          isValid = false;
        }

        if (!confirmPass) {
          showFieldError('confirm-new-password-error', 'Please confirm your new password.', 'validation.required');
          confirmPasswordInput?.classList.add('error-field');
          isValid = false;
        } else if (newPass !== confirmPass) {
          showFieldError('confirm-new-password-error', 'Passwords do not match.', 'validation.passwordMatch');
          confirmPasswordInput?.classList.add('error-field');
          isValid = false;
        }

        if (oldPass && newPass && oldPass === newPass) {
          showFieldError('new-password-error', 'New password cannot be the same as old password.', 'validation.passwordSame');
          newPasswordInput?.classList.add('error-field');
          isValid = false;
        }
      }

      // ── Image Validation ──
      if (newImage) {
        hasChanges = true;
        if (!newImage.type.match('image.*')) {
          showFieldError('change-image-error', 'Please select a valid image file.', 'validation.imageType');
          uploadArea?.classList.add('has-error');
          isValid = false;
        }
      }

      if (!isValid || !hasChanges) return;

      // ── Loading State ──
      if (changeBtn) {
        changeBtn.disabled = true;
        changeBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
      }

      try {
        // Handle password update
        if (oldPass && newPass) {
          const response = await fetch('/user-auth/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass })
          });
          const data = await response.json();
          
          if (!response.ok || !data.success) {
            const errorMsg = data.error || 'Failed to update password.';
            const translatedError = t(data.i18nKey || '', errorMsg);
            if (errorMsg.toLowerCase().includes('old') || errorMsg.toLowerCase().includes('current')) {
              showFieldError('old-password-error', translatedError);
              oldPasswordInput?.classList.add('error-field');
            } else if (errorMsg.toLowerCase().includes('new') || errorMsg.toLowerCase().includes('password')) {
              showFieldError('new-password-error', errorMsg);
              newPasswordInput?.classList.add('error-field');
            } else {
              showFlashMessage(errorMsg, 'error');
            }
            throw new Error(errorMsg);
          }
          
          showFlashMessage(data.message || 'Password updated successfully!', 'success');
          oldPasswordInput.value = '';
          newPasswordInput.value = '';
          confirmPasswordInput.value = '';
        }

        // Handle image update
        if (newImage) {
          const formData = new FormData();
          formData.append('image', newImage);
          
          const response = await fetch('/user-auth/update-image', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          
          if (!response.ok || !data.success) {
            showFieldError('change-image-error', data.error || 'Failed to update image.');
            throw new Error(data.error || 'Image update failed');
          }
          
          showFlashMessage(data.message || 'Profile image updated successfully!', 'success');
        }

        // Reload after short delay if anything succeeded
        setTimeout(() => location.reload(), 1500);

      } catch (err) {
        console.error('Account settings error:', err);
      } finally {
        if (changeBtn) {
          changeBtn.disabled = false;
          changeBtn.innerHTML = 'Save Changes';
        }
      }
    });
  }

  // ==============================
  // 🔔 دالة فلاش ميسج بسيطة وأنيقة
  // ==============================
  function showFlashMessage(message, type = "success") {
    const existing = document.querySelector(".flash-message");
    if (existing) existing.remove();

    const msg = document.createElement("div");
    msg.className = `flash-message ${type}`;
    msg.textContent = message;

    Object.assign(msg.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 20px",
      borderRadius: "6px",
      color: "#fff",
      backgroundColor: type === "success" ? "#4caf50" : "#f44336",
      fontSize: "15px",
      zIndex: 9999,
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      textAlign: "center",
    });

    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
  }
});

//____________________________________________________________________________________________________________________________________________________
// Logout handler: calls server /logout endpoint and clears client session
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.querySelector('.logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (ev) => {
    ev.preventDefault();
    if (!await showFlashConfirm('Are you sure you want to logout?')) return;

    try {
      const logoutResponse = await fetch('/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      });

      // Always clear client-side storage regardless of server response
      sessionStorage.clear();
      localStorage.clear();

      // Force clear all cookies by setting them to expire
      document.cookie.split(';').forEach(function(c) {
        const cookieName = c.split('=')[0].trim();
        document.cookie = cookieName + '=;expires=' + new Date(0).toUTCString() + ';path=/';
      });

      // Small delay to ensure cookie clear is processed, then force hard redirect
      setTimeout(() => {
        window.location.replace('/?logout=true&t=' + new Date().getTime());
      }, 100);

    } catch (err) {
      console.error('Logout error:', err);
      // Even on error, clear everything and redirect
      sessionStorage.clear();
      localStorage.clear();
      document.cookie.split(';').forEach(function(c) {
        const cookieName = c.split('=')[0].trim();
        document.cookie = cookieName + '=;expires=' + new Date(0).toUTCString() + ';path=/';
      });
      window.location.replace('/?logout=true&t=' + new Date().getTime());
    }
  });
});

//____________________________________________________________________________________________________________________

// const allowedTypes = ["superadmin", "Donor"];
// const userType = sessionStorage.getItem("userType");

// if (!userType) {
//   window.location.href = "/register";
// } else if (!allowedTypes.includes(userType)) {

//   window.location.href = "/";
//   showFlashMessage("🚫 لا تملك صلاحية الوصول لهذه الصفحة");
// }

//_________________________________________________________________________________________

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
  rankBar.style.width = '0';
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
    element.textContent = value;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Fetch and display user rank data dynamically
async function fetchUserRankData() {
  try {
    console.log('🔄 Fetching user rank data...');
    
    const response = await fetch('/api/user-rank-points-open/current-user');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      displayUserRankData(result.data);
    } else {
      console.error('Failed to fetch user rank data:', result.message);
      displayDefaultData();
    }
  } catch (error) {
    console.error('Error fetching user rank data:', error);
    displayDefaultData();
  }
}
// Display the fetched rank data in the template
function displayUserRankData(userRankData) {
    console.log('📊 Displaying user rank data:', userRankData);
    
    // Update rank image

    const rankImage = document.querySelector('.rank-image');
    if (rankImage && userRankData.rankImage) {
        rankImage.src = userRankData.rankImage;
        rankImage.alt = userRankData.rankName || 'User Rank';
    } else if (rankImage) {
        // Use default image if no rank image
        rankImage.src = '/assets/image/Account-Page/rank.png';
        rankImage.alt = 'Default Rank';
    }
    
    // Update rank name
    const rankName = document.querySelector('.rank-name');
    if (rankName) {
        rankName.textContent = userRankData.rankName || 'No Rank Assigned';
    }
    
    // UPDATE: Display reward data (with server fallback + defaults)
    const rewardImage = document.querySelector('.reward-image img');
    const rewardName = document.querySelector('.reward-name h1');
    
    // Use reward from server response; fallback to defaults
    const finalRewardImage = userRankData.rewardImage || '/assets/image/Home-Page/top-donor/king-of-donations-medal.png';
    const finalRewardName = userRankData.rewardName || 'Donation Medal';
    
    if (rewardImage) {
        rewardImage.src = finalRewardImage;
        rewardImage.alt = finalRewardName;
    }
    
    if (rewardName) {
        rewardName.textContent = finalRewardName;
    }
    
    // Update metric name
    const metricName = document.querySelector('.metric-name');
    if (metricName) {
        metricName.textContent = 'Current Points';
    }
    
    // Update user points and progress bar
    const userPoints = userRankData.userPoints || 0;
    updateProgressBars(userPoints);
    
    console.log('✅ User rank data displayed successfully');
}

// Display default data if fetch fails or no data available
function displayDefaultData() {
    console.log('⚠️ Using default rank data');
    
    const rankImage = document.querySelector('.rank-image');
    const rankName = document.querySelector('.rank-name');
    const metricName = document.querySelector('.metric-name');
    // ADD REWARD ELEMENTS
    const rewardImage = document.querySelector('.reward-image img');
    const rewardName = document.querySelector('.reward-name h1');
    
    if (rankImage) {
        rankImage.src = '/assets/image/Account-Page/rank.png';
        rankImage.alt = 'Default Rank';
    }
    
    if (rankName) {
        rankName.textContent = 'No Rank Assigned';
    }
    
    if (metricName) {
        metricName.textContent = 'Current Points';
    }
    
    // SET DEFAULT REWARD DATA
    if (rewardImage) {
        rewardImage.src = '/assets/image/Home-Page/top-donor/king-of-donations-medal.png';
        rewardImage.alt = 'Donation Medal';
    }
    
    if (rewardName) {
        rewardName.textContent = 'Donation Medal';
    }
    
    updateProgressBars(0); // Default points
}
// Get server-side data from data attributes
function getServerSideData() {
    const serverDataElement = document.getElementById('server-data');
    if (!serverDataElement) return null;
    
    return {
        userPoints: parseInt(serverDataElement.dataset.userPoints) || 0,
        rankName: serverDataElement.dataset.rankName || '',
        rankImage: serverDataElement.dataset.rankImage || '',
        rewardImage: serverDataElement.dataset.rewardImage || '',
        rewardName: serverDataElement.dataset.rewardName || ''
    };
}

// Initialize when page loads
window.addEventListener('load', function() {
    console.log('🚀 Initializing user panel...');
    
    // Get server-side data from data attributes
    const serverSideData = getServerSideData();
    
    // If we have valid server-side data, use it; otherwise fetch from API
    if (serverSideData && (serverSideData.userPoints > 0 || serverSideData.rankName)) {
        console.log('📊 Using server-side rank data:', serverSideData);
        displayUserRankData(serverSideData);
    } else {
        console.log('🔄 Fetching rank data from API');
        fetchUserRankData();
    }
});

// Optional: Add refresh functionality
function refreshRankData() {
    console.log('🔄 Refreshing user rank data...');
    fetchUserRankData();
}

// Add this to make refresh available globally
window.refreshRankData = refreshRankData;

//_______________________________________________________________________________________

// =============================================
// UNIFIED PAGINATION SYSTEM FOR DONOR PANEL TABLES
// =============================================

const TablePagination = {
  pageSize: 10,
  currentPage: {},
  tableData: {},
  
  init(section) {
    this.currentPage[section] = 1;
    const container = document.querySelector(`.pagination-controls[data-section="${section}"]`);
    if (!container) return;
    
    const prevBtn = container.querySelector('.prev-page-btn');
    const nextBtn = container.querySelector('.next-page-btn');
    
    prevBtn?.addEventListener('click', () => this.goToPage(section, this.currentPage[section] - 1));
    nextBtn?.addEventListener('click', () => this.goToPage(section, this.currentPage[section] + 1));
  },
  
  storeData(section, data) {
    this.tableData[section] = data;
    this.currentPage[section] = 1;
    this.renderPage(section);
  },
  
  goToPage(section, page) {
    const data = this.tableData[section] || [];
    const totalPages = Math.ceil(data.length / this.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    this.currentPage[section] = page;
    this.renderPage(section);
  },
  
  renderPage(section) {
    const data = this.tableData[section] || [];
    const totalPages = Math.ceil(data.length / this.pageSize) || 1;
    const start = (this.currentPage[section] - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageData = data.slice(start, end);
    
    // Update table display
    if (section === 'donations') {
      displayInvoices(pageData);
    } else if (section === 'thankers') {
      displayGratefulUsersTable(pageData);
    }
    
    // Update pagination controls
    const container = document.querySelector(`.pagination-controls[data-section="${section}"]`);
    if (!container) return;
    
    const prevBtn = container.querySelector('.prev-page-btn');
    const nextBtn = container.querySelector('.next-page-btn');
    const pageInfo = container.querySelector('.page-info');
    
    if (prevBtn) prevBtn.disabled = this.currentPage[section] <= 1;
    if (nextBtn) nextBtn.disabled = this.currentPage[section] >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${this.currentPage[section]} of ${totalPages}`;
    
    if (prevBtn) prevBtn.dataset.page = this.currentPage[section] - 1;
    if (nextBtn) nextBtn.dataset.page = this.currentPage[section] + 1;
  }
};

// Initialize pagination for donor panel tables
document.addEventListener('DOMContentLoaded', () => {
  TablePagination.init('donations');
  TablePagination.init('thankers');
});