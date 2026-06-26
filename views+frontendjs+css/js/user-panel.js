// Get all link items
const linkItems = document.querySelectorAll('.links li');

// Define the mapping between menu items and their corresponding content sections
const contentMap = [
{ menuClass: 'link-content-one', contentClass: 'dashboard-sec' },
{ menuClass: 'link-content-two', contentClass: 'my-fundraisers-sec' },
{ menuClass: 'link-content-three', contentClass: 'add-fundraiser-sec' },
{ menuClass: 'link-content-four', contentClass: 'account-settings-sec' },
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
          const maxVisibleTags = window.innerWidth < 480 ? 2 : 3;
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
      alert('Please select an image file (JPG/PNG)');
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

//_____________________________________________________________________________
// =============================================
// UTILITY FUNCTIONS (DEFINE ONCE AT THE TOP)
// =============================================

// Global variables
let donationStats = {
  monthlyTotal: 0,
  allTimeTotal: 0,
  dailyDonations: {}
};
let donorsList = [];

// Debug function to check if functions are loaded
function debugFunctionAvailability() {
  console.log('🔍 DEBUG: Checking function availability:');
  console.log('- escapeHtml:', typeof escapeHtml);
  console.log('- showSuccessMessage:', typeof showSuccessMessage);
  console.log('- showErrorMessage:', typeof showErrorMessage);
  console.log('- getCurrentUserToken:', typeof getCurrentUserToken);
  console.log('- formatCurrency:', typeof formatCurrency);
  console.log('- loadDonationStats:', typeof loadDonationStats);
  console.log('- loadDonors:', typeof loadDonors);
}

// Utility functions (define once)
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccessMessage(message) {
  console.log('✅ Success:', message);
  // You can replace this with your preferred notification system
  alert('Success: ' + message);
}

function showErrorMessage(message) {
  console.error('❌ Error:', message);
  // You can replace this with your preferred notification system
  alert('Error: ' + message);
}

async function getCurrentUserToken() {
  try {
    console.log('🔍 Searching for authentication token...');
    
    // Method 1: Check server-provided token (from EJS)
    if (window.serverData && window.serverData.firebaseToken) {
      console.log('✅ Token found from server (EJS)');
      return window.serverData.firebaseToken;
    }

    // Method 2: Check Firebase Auth (if using Firebase Web SDK)
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        console.log('🔥 Firebase token retrieved via SDK');
        return token;
      }
    }

    // Method 3: Check localStorage
    const storedToken = localStorage.getItem('firebaseToken') || 
                        localStorage.getItem('idToken') || 
                        localStorage.getItem('token');
    
    if (storedToken) {
      console.log('💾 Token retrieved from localStorage');
      return storedToken;
    }

    // Method 4: Check cookies (for server-side rendering scenarios)
    const cookieToken = getCookie('firebaseToken') || 
                        getCookie('idToken') || 
                        getCookie('token');
    
    if (cookieToken) {
      console.log('🍪 Token retrieved from cookies');
      return cookieToken;
    }

    console.log('❌ No authentication token found in any storage location');
    return null;

  } catch (error) {
    console.error('💥 Error retrieving token:', error);
    return null;
  }
}

// Helper function to get cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function formatCurrency(amount) {
  return `$${parseFloat(amount || 0).toFixed(2)}`;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// =============================================
// DONATION STATISTICS FUNCTIONS
// =============================================

// Function to fetch donation statistics
async function loadDonationStats() {
  try {
    console.log('🔄 [DONATION STATS] Loading donation statistics...');
    debugFunctionAvailability();
    
    const token = await getCurrentUserToken();
    
    if (!token) {
      console.error('❌ [DONATION STATS] No token available for authentication');
      showErrorMessage('Please log in to view donation statistics');
      return;
    }

    console.log('🔑 [DONATION STATS] Using token for API request');
    
    const response = await fetch('/api/invoices/donation-stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 [DONATION STATS] Response status:', response.status);
    
    if (response.status === 401) {
      console.error('❌ [DONATION STATS] Authentication failed');
      showErrorMessage('Authentication failed. Please log in again.');
      return;
    }
    
    if (response.status === 404) {
      console.error('❌ [DONATION STATS] User not found in database');
      showErrorMessage('User profile not found. Please contact support.');
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 [DONATION STATS] Result:', result);

    if (result.success) {
      donationStats = result.data;
      console.log('✅ [DONATION STATS] Successfully loaded:', {
        monthlyTotal: donationStats.monthlyTotal,
        allTimeTotal: donationStats.allTimeTotal,
        dailyDonationsCount: Object.keys(donationStats.dailyDonations).length
      });
      updateDonationTemplates();
      initializeDonationChart();
    } else {
      console.error('❌ [DONATION STATS] API returned error:', result.error);
      showErrorMessage('Failed to load donation statistics: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('💥 [DONATION STATS] Error:', error);
    showErrorMessage('Error loading donation statistics. Please check console for details.');
  }
}

// Function to update the first two templates
function updateDonationTemplates() {
  console.log('🎨 [DONATION STATS] Updating donation templates...');
  
  // Update Monthly Donations template
  const monthlyElement = document.querySelector('.progress-in-month h2');
  if (monthlyElement) {
    const monthlyAmount = formatCurrency(donationStats.monthlyTotal);
    monthlyElement.textContent = monthlyAmount;
    console.log('✅ [DONATION STATS] Updated monthly donations:', monthlyAmount);
  } else {
    console.log('❌ [DONATION STATS] Monthly donations element not found');
  }

  // Update Total Donations template
  const totalElement = document.querySelector('.total-donations h2');
  if (totalElement) {
    const totalAmount = formatCurrency(donationStats.allTimeTotal);
    totalElement.textContent = totalAmount;
    console.log('✅ [DONATION STATS] Updated total donations:', totalAmount);
  } else {
    console.log('❌ [DONATION STATS] Total donations element not found');
  }
}

// Enhanced donation chart with real data
function initializeDonationChart() {
  console.log('📊 [DONATION STATS] Initializing donation chart...');
  
  const chartEl = document.querySelector('.donation-chart');
  if (!chartEl) {
    console.error('❌ [DONATION STATS] Chart container not found');
    return;
  }

  // Get chart elements
  const chartTitle = document.getElementById('chart-title');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const minLabel = document.querySelector('.scale-labels .min');
  const maxLabel = document.querySelector('.scale-labels .max');

  // Generate donation data for the current month from real data
  function generateMonthlyData() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Update chart title with month and year
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    if (chartTitle) {
      chartTitle.textContent = `${monthNames[currentMonth]} ${currentYear} Donations`;
    }
    
    const donations = {};
    
    // Fill with real data from the API
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatDate(date);
      donations[dateStr] = donationStats.dailyDonations[dateStr] || 0;
    }
    
    console.log('📅 [DONATION STATS] Generated monthly data with', Object.keys(donations).length, 'days');
    return { donations, today };
  }

  // Get the generated data
  const { donations: donationsData, today } = generateMonthlyData();

  // Convert to array of {date, amount} objects and sort by date
  const donations = Object.entries(donationsData)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Initialize with today in the center
  let currentCenterDate = new Date(today);
  
  // Render the chart
  function renderChart() {
    // Clear existing bars
    chartEl.innerHTML = '';
    
    // Get the 7-day window (3 before, today, 3 after)
    const datesToShow = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(currentCenterDate);
      date.setDate(date.getDate() + i);
      datesToShow.push(date);
    }
    
    // Find amounts for these dates
    const barsData = datesToShow.map(date => {
      const dateStr = formatDate(date);
      const donation = donations.find(d => d.date === dateStr);
      return {
        date,
        amount: donation ? donation.amount : 0,
        isToday: isSameDay(date, today)
      };
    });
    
    // Calculate max amount for scaling
    const amounts = barsData.map(b => b.amount);
    const maxAmount = Math.max(...amounts, 10);
    const minAmount = Math.min(...amounts);
    
    if (maxLabel) maxLabel.textContent = `$${maxAmount}`;
    if (minLabel) minLabel.textContent = `$${minAmount}`;
    
    console.log('📊 [DONATION STATS] Chart data:', { barsData, maxAmount, minAmount });
    
    // Create bars
    barsData.forEach((bar, index) => {
      const barEl = document.createElement('div');
      barEl.className = `donation-bar ${bar.isToday ? 'today' : ''}`;
      
      // Calculate height (0 if no data)
      const heightPercentage = maxAmount > 0 ? (bar.amount / maxAmount) * 100 : 0;
      barEl.style.height = `${heightPercentage}%`;
      
      // Add label (day of month)
      const labelEl = document.createElement('div');
      labelEl.className = 'bar-label';
      labelEl.textContent = bar.date.getDate();
      barEl.appendChild(labelEl);
      
      // Add value (amount)
      if (bar.amount > 0) {
        const valueEl = document.createElement('div');
        valueEl.className = 'bar-value';
        valueEl.textContent = `$${bar.amount}`;
        barEl.appendChild(valueEl);
      }
      
      chartEl.appendChild(barEl);
    });

    console.log('✅ [DONATION STATS] Chart rendered with', barsData.length, 'bars');
  }
  
  // Navigation handlers
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentCenterDate.setDate(currentCenterDate.getDate() - 7);
      updateChartTitle(currentCenterDate);
      renderChart();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentCenterDate.setDate(currentCenterDate.getDate() + 7);
      updateChartTitle(currentCenterDate);
      renderChart();
    });
  }
  
  // Update chart title when navigating
  function updateChartTitle(date) {
    if (!chartTitle) return;
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    chartTitle.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()} Donations`;
  }
  
  // Initial render
  renderChart();
}

// =============================================
// DONORS THANKS FUNCTIONS
// =============================================

// Function to fetch and display donors
async function loadDonors() {
  try {
    console.log('🔄 [DONORS] Loading donors list...');
    debugFunctionAvailability();
    
    const token = await getCurrentUserToken();
    
    if (!token) {
      showErrorMessage('Please log in to view donors');
      return;
    }

    const response = await fetch('/api/donors/my-donors', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 [DONORS] Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 [DONORS] Result:', result);

    if (result.success) {
      donorsList = result.data;
      displayDonorsTable();
    } else {
      console.error('❌ [DONORS] Failed to load donors:', result.error);
      showErrorMessage('Failed to load donors: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('💥 [DONORS] Error:', error);
    showErrorMessage('Error loading donors. Please check console for details.');
  }
}

// Function to display donors in the table
function displayDonorsTable() {
  const tbody = document.querySelector('.thanks-table tbody');
  
  if (!tbody) {
    console.error('❌ [DONORS] Could not find thanks table body');
    return;
  }
  
  tbody.innerHTML = '';

  console.log(`🎯 [DONORS] Displaying ${donorsList.length} donors in table (last 15 donors)`);

  if (donorsList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 20px; color: #666;">
          No donors found yet. Share your fundraisers to receive donations!
        </td>
      </tr>
    `;
    return;
  }

  // Show message if there are more than 15 donors
  if (donorsList.length === 15) {
    console.log('ℹ️ Showing last 15 donors - there might be more in your history');
  }

  donorsList.forEach((donor, index) => {
    console.log(`👤 [DONORS] Processing donor ${index + 1}:`, donor);
    
    const row = document.createElement('tr');
    
    // Handle user image
    const userImage = donor.user_image 
      ? `<img src="${donor.user_image}" alt="${donor.full_name}" class="user-avatar">`
      : '<div class="default-avatar">👤</div>';
    
    // Handle thank button state
    const thankButton = donor.already_thanked 
      ? `<button class="btn-thanked" disabled title="Already thanked">
           <i class="fas fa-check-circle"></i> Thanked
         </button>`
      : `<button class="btn-thank" onclick="thankDonor('${donor.donor_postgres_id}')" 
           title="Say thank you to ${donor.full_name}">
           <i class="fas fa-heart"></i> Thank
         </button>`;
    
    row.innerHTML = `
      <td class="user-image-cell">
        ${userImage}
      </td>
      <td class="user-name-cell">
        ${escapeHtml(donor.full_name || 'Anonymous Donor')}
      </td>
      <td class="th-btn">
        ${thankButton}
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  console.log('✅ [DONORS] Table populated successfully with last 15 donors');
}

// Function to thank a donor
async function thankDonor(donorPostgresId) {
  try {
    console.log('🙏 [DONORS] Thanking donor with ID:', donorPostgresId);
    
    const token = await getCurrentUserToken();
    
    if (!token) {
      showErrorMessage('Please log in to thank donors');
      return;
    }

    // Show confirmation dialog
    if (!confirm('Are you sure you want to send a thank you to this donor? They will receive 5 points.')) {
      return;
    }

    const response = await fetch('/api/donors/thank-donor', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        donor_postgres_id: donorPostgresId
      })
    });

    const result = await response.json();
    console.log('📨 [DONORS] Thank response:', result);

    if (result.success) {
      showSuccessMessage(result.message);
      // Reload the donors list to update the button states
      loadDonors();
    } else {
      showErrorMessage(result.error || 'Failed to send thank you');
    }
  } catch (error) {
    console.error('💥 [DONORS] Error thanking donor:', error);
    showErrorMessage('Error sending thank you. Please check console for details.');
  }
}
// =============================================
// FUNDRAISER STATISTICS FUNCTIONS
// =============================================

// Global variable to store fundraiser stats
let fundraiserStats = {
  completedDonationsTotal: 0,
  completedFundraisersPercentage: 0,
  totalProgressPercentage: 0
};

// Function to fetch fundraiser statistics
async function loadFundraiserStats() {
  try {
    console.log('🔄 [FUNDRAISER STATS] Loading fundraiser statistics...');
    
    const token = await getCurrentUserToken();
    
    if (!token) {
      console.error('❌ [FUNDRAISER STATS] No token available for authentication');
      showErrorMessage('Please log in to view fundraiser statistics');
      return;
    }

    const response = await fetch('/api/invoices/fundraiser-stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 [FUNDRAISER STATS] Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 [FUNDRAISER STATS] Result:', result);

    if (result.success) {
      fundraiserStats = result.data;
      console.log('✅ [FUNDRAISER STATS] Successfully loaded:', fundraiserStats);
      updateFundraiserTemplates();
      updatePieCharts();
    } else {
      console.error('❌ [FUNDRAISER STATS] API returned error:', result.error);
      showErrorMessage('Failed to load fundraiser statistics: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('💥 [FUNDRAISER STATS] Error:', error);
    showErrorMessage('Error loading fundraiser statistics. Please check console for details.');
  }
}

// Function to update the three fundraiser templates
function updateFundraiserTemplates() {
  console.log('🎨 [FUNDRAISER STATS] Updating fundraiser templates...');
  
  // Template 1: Update Completed Donations Total
  const completedDonationsElement = document.querySelector('.completed-donations h2');
  if (completedDonationsElement) {
    const completedAmount = formatCurrency(fundraiserStats.completedDonationsTotal);
    completedDonationsElement.textContent = completedAmount;
    console.log('✅ [FUNDRAISER STATS] Updated completed donations:', completedAmount);
  } else {
    console.log('❌ [FUNDRAISER STATS] Completed donations element not found');
  }

  // Templates 2 & 3 are updated via updatePieCharts()
}

// Function to update pie charts with animation
function updatePieCharts() {
  console.log('📊 [FUNDRAISER STATS] Updating pie charts...');
  
  // Template 2: Completed Fundraisers Percentage Pie Chart
  const completedPieElement = document.querySelector('.total-completed-statistics-box .pie');
  if (completedPieElement) {
    const completedPercentage = fundraiserStats.completedFundraisersPercentage;
    completedPieElement.style.setProperty('--p', completedPercentage);
    completedPieElement.textContent = `${completedPercentage}%`;
    console.log('✅ [FUNDRAISER STATS] Updated completed fundraisers pie:', completedPercentage + '%');
  } else {
    console.log('❌ [FUNDRAISER STATS] Completed fundraisers pie element not found');
  }

  // Template 3: Total Progress Percentage Pie Chart
  const totalPieElement = document.querySelector('.total-statistics-box .pie');
  if (totalPieElement) {
    const totalPercentage = fundraiserStats.totalProgressPercentage;
    totalPieElement.style.setProperty('--p', totalPercentage);
    totalPieElement.textContent = `${totalPercentage}%`;
    console.log('✅ [FUNDRAISER STATS] Updated total progress pie:', totalPercentage + '%');
  } else {
    console.log('❌ [FUNDRAISER STATS] Total progress pie element not found');
  }

  // Restart animations by cloning and replacing
  restartPieAnimations();
}

// Function to restart pie chart animations
function restartPieAnimations() {
  const pieCharts = document.querySelectorAll('.pie');
  
  pieCharts.forEach(pie => {
    const newPie = pie.cloneNode(true);
    pie.parentNode.replaceChild(newPie, pie);
  });
  
  console.log('🔄 [FUNDRAISER STATS] Pie chart animations restarted');
}
// =============================================
// PAGE INITIALIZATION
// =============================================

// Load everything when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing all features...');
  debugFunctionAvailability();
  
  // Load donation statistics
  loadDonationStats();
  
  // Load donors table
  loadDonors();

    // Load fundraiser statistics for the three templates
  loadFundraiserStats();
});
//______________________________________________________________________________________________

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

//__________________________s________________________________________________________________________________
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
                            "userPanelLinkTwoTgt": "My Fundraisers",
                            "userPanelLinkThreeTgt": "Add Fundraiser",
                            "userPanelLinkFourTgt": "Account Settings",
                            "userPanelLinkFiveTgt": "Payment Settings",
                            "userPanelLinkLogoutTgt": "Logout",
                            //________________________________________
                            "userPanelDashboardTitleTgt": "Dashboard",
                            "userPanelDashboardDonationCompleteTitleTgt": "Completed Donation",
                            "userPanelDashboardDonationInMonthTitleTgt": "Donation In Month",
                            "userPanelDashboardTotalDonationsTitleTgt": "Total Donations",
                            "userPanelDashbordNotificationBarTgt": "Lorem ipsum dolor sit amet consectetur adipisicing elit.Quisqu Inventore, vitae? Voluptatum voluptas!",
                            "userPanelDashboardMonthlyDonationTitleTgt": "Monthly donation progress",
                            "userPanelDashboardTotalCompleteDonationsProgressTitleTgt": "Total Completed Fundraisers",
                            "userPanelDashboardTotalDonationsProgressTitleTgt": "Total donations progress",
                            "userPanelDashboardThanksTableImage": "Donor Image",
                            "userPanelDashboardThanksTableName": "Donor Name",
                            "userPanelDashboardThanksTableSayThanks": "Send Thanks",
                            //________________________________________
                            "userPanelMyFundraisersTitleTgt": "My Fundraisers :",
                            "userPanelMyFundraisersReceiveBtnTgt": "Receive",
                            "userPanelMyFundraisersDeleteBtnTgt": "Delete",
                            //________________________________________
                            "userPanelAddFundraiserTitleTgt": "Add Fundraiser",
                            "userPanelAddFundraiserFundraiserTitleTgt": "Type Fundraiser Title :",
                            "userPanelAddFundraiserFundraiserTitleLabelTgt": "Fundraiser Title",
                            "userPanelAddFundraiserSelectCategoriesTgt": "Select Your Categories :",
                            "userPanelAddFundraiserSelectAllCategoriesTgt": "Select All",
                            "userPanelAddFundraiserCategorieOneTgt": "Education",
                            "userPanelAddFundraiserCategorieTwoTgt": "Disabilities",
                            "userPanelAddFundraiserCategorieThreeTgt": "Health Care",
                            "userPanelAddFundraiserCategorieFourTgt": "Orphans",
                            "userPanelAddFundraiserCategorieFiveTgt": "Environment",
                            "userPanelAddFundraiserCategorieSixTgt": "Poverty",
                            "userPanelAddFundraiserCategorieSevenTgt": "Gaza",
                            "userPanelAddFundraiserCategorieEigthTgt": "Help",
                            "userPanelAddFundraiserCategorieNineTgt": "Palestine",
                            "userPanelAddFundraiserCategorieNoResultTgt": "No result match",
                            "userPanelAddFundraiserAmountTgt": "Amount To Be Collected :",
                            "userPanelAddFundraiserAmountLabelTgt": "Amount",
                            "userPanelAddFundraiserUploadImagesTgt": "Upload Fundraiser Images :",
                            "userPanelAddFundraiserMainImageTgt": "Add Fundraiser Main Image",
                            "userPanelAddFundraiserSubImageTgt": "Add Fundraiser Sub Image",
                            "userPanelAddFundraiserDescriptionTgt": "Type Fundraiser Description :",
                            "userPanelAddFundraiserDescriptionLabelTgt": "Fundraiser Description",
                            "userPanelAddFundraiserAddBtnTgt": "Add",
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
                            "complaintTitleTgt": "أدخل المشكلة التي تواجهك",
                            "complaintLabelTgt": "أدخل المشكلة",
                            "complaintBtnTgt": "أرسل",
                            //________________________________________
                            "userPanelLinkOneTgt": "لوحة التحكم",
                            "userPanelLinkTwoTgt": "حملات التبرع الخاصة بي",
                            "userPanelLinkThreeTgt": "إضافة حملة تبرع",
                            "userPanelLinkFourTgt": "إعدادات الحساب",
                            "userPanelLinkFiveTgt": "إعدادات التبرع",
                            "userPanelLinkLogoutTgt": "تسجيل الخروج",
                            //________________________________________
                            "userPanelDashboardTitleTgt": "لوحة التحكم",
                            "userPanelDashboardDonationCompleteTitleTgt": "التبرعات المكتملة",
                            "userPanelDashboardDonationInMonthTitleTgt": "التبرعات الشهرية",
                            "userPanelDashboardTotalDonationsTitleTgt": "مجموع التبرعات",
                            "userPanelDashbordNotificationBarTgt": "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى.",
                            "userPanelDashboardMonthlyDonationTitleTgt": "التقدم الشهري في التبرعات",
                            "userPanelDashboardTotalCompleteDonationsProgressTitleTgt": "مجموع الحملات المكتملة",
                            "userPanelDashboardTotalDonationsProgressTitleTgt": "مجموع التقدم الكلي للتبرعات",
                            "userPanelDashboardThanksTableImage": "صورة المتبرع",
                            "userPanelDashboardThanksTableName": "اسم المتبرع",
                            "userPanelDashboardThanksTableSayThanks": "إرسال شكر",
                            //________________________________________
                            "userPanelMyFundraisersTitleTgt": "حملات التبرع الخاصة بي :",
                            "userPanelMyFundraisersReceiveBtnTgt": "إستلم",
                            "userPanelMyFundraisersDeleteBtnTgt": "حذف",
                            //________________________________________
                            "userPanelAddFundraiserTitleTgt": "إضافة حملة تبرع",
                            "userPanelAddFundraiserFundraiserTitleTgt": "أدخل عنوان حملة التبرع :",
                            "userPanelAddFundraiserFundraiserTitleLabelTgt": "عنوان حملة التبرع",
                            "userPanelAddFundraiserSelectCategoriesTgt": "حدد التصنيفات لحملة التبرع :",
                            "userPanelAddFundraiserSelectAllCategoriesTgt": "حدد الكل",
                            "userPanelAddFundraiserCategorieOneTgt": "التعليم",
                            "userPanelAddFundraiserCategorieTwoTgt": "ذوي الاحتياجات الخاصة",
                            "userPanelAddFundraiserCategorieThreeTgt": "الرعاية الصحية",
                            "userPanelAddFundraiserCategorieFourTgt": "الأيتام",
                            "userPanelAddFundraiserCategorieFiveTgt": "البيئة",
                            "userPanelAddFundraiserCategorieSixTgt": "الفقر",
                            "userPanelAddFundraiserCategorieSevenTgt": "غزة",
                            "userPanelAddFundraiserCategorieEigthTgt": "مساعدة",
                            "userPanelAddFundraiserCategorieNineTgt": "فلسطين",
                            "userPanelAddFundraiserCategorieNoResultTgt": "لا توجد نتيجة مطابقة",
                            "userPanelAddFundraiserAmountTgt": "المبلغ المراد جمعه :",
                            "userPanelAddFundraiserAmountLabelTgt": "المبلغ",
                            "userPanelAddFundraiserUploadImagesTgt": "أرفع لصوراً لحملة التبرع :",
                            "userPanelAddFundraiserMainImageTgt": "أضف الصورة الرئيسية لحملة التبرع",
                            "userPanelAddFundraiserSubImageTgt": "أضف الصورة الفرعية لحملة التبرع",
                            "userPanelAddFundraiserDescriptionTgt": "أدخل الوصف لحملة التبرع",
                            "userPanelAddFundraiserDescriptionLabelTgt": "وصف حملة التبرع",
                            "userPanelAddFundraiserAddBtnTgt": "إضافة",
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
    //     let mastercard_btn = document.querySelector(".mastercard-btn");
    //     let paypal_btn = document.querySelector(".paypal-btn");
    //     let googlepay_btn = document.querySelector(".googlepay-btn");
    //     let payment_methods_boxes = document.querySelector(".payment-methods-boxes");
    //     let triangle = document.querySelector(".triangle");
    
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
    //__________________________________________________________________________
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

    // Initialize on page load
    // document.addEventListener('DOMContentLoaded', initializePaymentMethodsTwo);

    // Optional: Re-initialize on window resize to handle screen size changes
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

//__________________________________________________________________________________________________________
// Delete fundraiser function - UPDATED
function deleteFundraiser(fundraiserId) {
    if (confirm('Are you sure you want to delete this fundraiser? This action cannot be undone.')) {
        // Show loading state
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = 'Deleting...';
        button.disabled = true;
        
        // Create a form to submit the delete request
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/userPanelIndigent/delete-fundraiser/${fundraiserId}`;
        
        // Add CSRF token if you're using it
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_csrf';
            csrfInput.value = csrfToken.getAttribute('content');
            form.appendChild(csrfInput);
        }
        
        document.body.appendChild(form);
        form.submit();
    }
}

//________________________________________________________________________________________________________

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

//_________________________________________________________________________________________________________________
// Get categories from data attributes
function getCategoriesFromServer() {
    const categoriesElement = document.getElementById('categories-data');
    if (!categoriesElement) {
        console.log('⚠️ No categories data element found');
        return [];
    }
    
    try {
        const categoriesJson = categoriesElement.dataset.categories;
        return categoriesJson ? JSON.parse(categoriesJson) : [];
    } catch (error) {
        console.error('Error parsing categories data:', error);
        return [];
    }
}

// Category selection functionality
function toggleCategorySelection(e) {
    const option = e.target;
    const value = option.getAttribute('data-value');
    
    if (value === 'all') {
        const allOptions = document.querySelectorAll('.option:not(.all-tags)');
        const currentlySelected = document.querySelectorAll('.option.selected:not(.all-tags)');
        
        if (currentlySelected.length === allOptions.length) {
            allOptions.forEach(opt => opt.classList.remove('selected'));
        } else {
            allOptions.forEach((opt, index) => {
                if (index < 4) opt.classList.add('selected');
                else opt.classList.remove('selected');
            });
        }
    } else {
        if (option.classList.contains('selected')) {
            option.classList.remove('selected');
        } else {
            const selectedCount = document.querySelectorAll('.option.selected:not(.all-tags)').length;
            if (selectedCount >= 4) {
                alert('Maximum 4 categories allowed per fundraiser');
                return;
            }
            option.classList.add('selected');
        }
    }
    updateSelectedCategoriesDisplay();
}

function updateSelectedCategoriesDisplay() {
    const selectedOptions = document.querySelectorAll('.option.selected:not(.all-tags)');
    const selectedOptionsContainer = document.querySelector('.selected-options');
    
    if (selectedOptionsContainer) {
        selectedOptionsContainer.innerHTML = '';
        
        selectedOptions.forEach(option => {
            const value = option.getAttribute('data-value');
            const text = option.textContent;
            
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `<span>${text}</span><button type="button" class="remove-tag" data-value="${value}">×</button>`;
            selectedOptionsContainer.appendChild(tag);
        });
        
        document.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const optionToDeselect = document.querySelector(`.option[data-value="${value}"]`);
                if (optionToDeselect) optionToDeselect.classList.remove('selected');
                updateSelectedCategoriesDisplay();
            });
        });
    }
}

function getSelectedCategories() {
    const selectedOptions = document.querySelectorAll('.option.selected:not(.all-tags)');
    return Array.from(selectedOptions).map(opt => opt.getAttribute('data-value'));
}

// Load categories for dropdown from data attributes
function loadCategories() {
    try {
        console.log('📋 Loading categories from data attributes...');
        
        const optionsContainer = document.querySelector('.options');
        if (!optionsContainer) {
            console.error('Options container not found');
            return;
        }
        
        // Clear existing options except "Select All"
        const selectAllOption = optionsContainer.querySelector('.all-tags');
        optionsContainer.innerHTML = '';
        if (selectAllOption) optionsContainer.appendChild(selectAllOption);
        
        // Get categories from data attributes
        const categories = getCategoriesFromServer();
        
        if (categories && categories.length > 0) {
            console.log('✅ Using categories from data:', categories.length);
            populateCategories(categories);
        } else {
            console.log('⚠️ Using fallback categories');
            const defaultCategories = [
                { category_name: 'Education' },
                { category_name: 'Healthcare' },
                { category_name: 'Emergency Relief' },
                { category_name: 'Community Development' }
            ];
            populateCategories(defaultCategories);
        }
        
        setupCategorySearch();
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function populateCategories(categories) {
    const optionsContainer = document.querySelector('.options');
    if (!optionsContainer) return;
    
    categories.forEach(category => {
        const option = document.createElement('div');
        option.className = 'option';
        option.textContent = category.category_name || category.name || category;
        option.setAttribute('data-value', category.category_name || category.name || category);
        option.addEventListener('click', toggleCategorySelection);
        optionsContainer.appendChild(option);
    });
}

function setupCategorySearch() {
    const searchInput = document.querySelector('.search-tags');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const options = document.querySelectorAll('.option:not(.all-tags)');
        const noResultMsg = document.querySelector('.no-result-message');
        
        let visibleCount = 0;
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                option.style.display = 'block';
                visibleCount++;
            } else {
                option.style.display = 'none';
            }
        });
        
        if (noResultMsg) noResultMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing fundraiser form...');
    
    // Load categories from data attributes
    loadCategories();
    
    // Form submission handling
    const fundraiserForm = document.getElementById('fundraiserForm');
    if (fundraiserForm) {
        fundraiserForm.addEventListener('submit', function(e) {
            const selectedCategories = getSelectedCategories();
            const categoriesInput = document.getElementById('categoriesInput');
            
            if (categoriesInput) categoriesInput.value = JSON.stringify(selectedCategories);
            
            // Basic validation
            if (selectedCategories.length === 0) {
                e.preventDefault();
                alert('Please select at least one category');
                return false;
            }
            
            if (selectedCategories.length > 4) {
                e.preventDefault();
                alert('Maximum 4 categories allowed');
                return false;
            }
            
            const mainImageInput = document.querySelector('input[name="mainImage"]');
            if (mainImageInput && !mainImageInput.files.length) {
                e.preventDefault();
                alert('Please select a main image');
                return false;
            }
            
            // Show loading state
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Creating...';
            }
            
            return true; // Allow form to submit to server
        });
    }
});

//____________________________________________________________________________________________________________________

const allowedTypes = ["superadmin", "requester"];
const userType = sessionStorage.getItem("userType");

if (!userType) {
  window.location.href = "/register";
} else if (!allowedTypes.includes(userType)) {

  window.location.href = "/";
  alert("🚫 لا تملك صلاحية الوصول لهذه الصفحة");
}

//______________________________________________________________________________________________________________________

// Logout handler: calls server /logout endpoint and clears client session
  document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('.logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      
      // Confirm logout
      const confirmLogout = confirm('Are you sure you want to logout?');
      if (!confirmLogout) return;

      try {
        // Get uid from sessionStorage
        let uid = sessionStorage.getItem('uid') || null;
        
        if (!uid) {
          try {
            const meRes = await fetch('/me');
            if (meRes.ok) {
              const me = await meRes.json();
              uid = me.uid || null;
            }
          } catch (e) {
            console.warn('Could not fetch /me before logout', e);
          }
        }

        // Send logout request to server
        const logoutResponse = await fetch('/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid })
        });

        const result = await logoutResponse.json();

        if (logoutResponse.ok) {
          // Clear ALL client-side storage
          sessionStorage.clear();
          localStorage.clear();
          
          // Clear any existing cookies manually (additional safety)
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });

          // ✅ Redirect to index page with logout parameter
          window.location.href = '/?logout=true&t=' + new Date().getTime();
        } else {
          throw new Error(result.message || 'Logout failed');
        }
      } catch (err) {
        console.error('Logout error', err);
        // Even if server logout fails, clear client-side data and redirect to index
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/?logout=error';
      }
    });
  });

//____________________________________________________________________________________________________

// console.log('🕵️‍♂️ Authentication Debug Information:');
//   console.log('1. Cookies available:', document.cookie);
//   console.log('2. localStorage tokens:', {
//     firebaseToken: localStorage.getItem('firebaseToken'),
//     idToken: localStorage.getItem('idToken'),
//     token: localStorage.getItem('token')
//   });
//   console.log('3. Firebase SDK available:', typeof firebase !== 'undefined');
//   console.log('4. Current Firebase user:', typeof firebase !== 'undefined' ? firebase.auth().currentUser : 'Firebase not loaded');
//   console.log('5. Server data:', window.serverData || 'Not set');
  
//   // Test token retrieval
//   async function testTokenRetrieval() {
//     const token = await getCurrentUserToken();
//     console.log('6. Token retrieval test:', token ? 'SUCCESS' : 'FAILED');
//   }
//   testTokenRetrieval();