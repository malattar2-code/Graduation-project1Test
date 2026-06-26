// Get all link items
const linkItems = document.querySelectorAll('.links li');

// Define the mapping between menu items and their corresponding content sections
const contentMap = [
  { menuClass: 'link-content-one', contentClass: 'users-dashboard-sec' },
  { menuClass: 'link-content-two', contentClass: 'fundraisers-dashboard-sec' },
  { menuClass: 'link-content-three', contentClass: 'categories-dashboard-sec' },
  { menuClass: 'link-content-forms', contentClass: 'forms-and-requests-dashboard-sec' },  // <-- ADD THIS
  { menuClass: 'link-content-four', contentClass: 'statistics-dashboard-sec' },
  { menuClass: 'link-content-five', contentClass: 'reports-dashboard-sec' },
  { menuClass: 'link-content-six', contentClass: 'balances-dashboard-sec' },
  { menuClass: 'link-content-seven', contentClass: 'ranks-and-rewards-sec' },
  { menuClass: 'link-content-eight', contentClass: 'admin-settings-sec' },
];

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

// ==================== CUSTOM CONFIRM & PROMPT ====================

/**
 * Styled confirm dialog matching showFlashMessage aesthetics.
 * Returns a Promise<boolean>: true = OK, false = Cancel/Escape.
 * 
 * Usage (inside an async function):
 *   if (await showFlashConfirm('Are you sure?')) { ... }
 */
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

/**
 * Styled prompt dialog matching showFlashMessage aesthetics.
 * Returns a Promise<string | null>: string = OK value, null = Cancel/Escape.
 * 
 * Usage (inside an async function):
 *   const name = await showFlashPrompt('Enter your name:', 'John');
 */
function showFlashPrompt(message, defaultValue = '', type = 'warning') {
  return new Promise((resolve) => {
    document.querySelectorAll('.flash-message, .flash-overlay').forEach(el => el.remove());

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
      display: flex; flex-direction: column; gap: 12px;
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

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.style.cssText = `
      padding: 10px 12px; border-radius: 6px;
      border: 1px solid ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ffc107' : '#f44336'};
      background: rgba(255,255,255,0.95); color: #333; font-size: 14px;
      outline: none; width: 100%; box-sizing: border-box;
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

    okBtn.addEventListener('click', () => { cleanup(); resolve(input.value); });
    cancelBtn.addEventListener('click', () => { cleanup(); resolve(null); });

    const keyHandler = (e) => {
      if (e.key === 'Enter') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(); resolve(input.value);
      }
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(); resolve(null);
      }
    };
    document.addEventListener('keydown', keyHandler);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.stopPropagation(); okBtn.click(); }
    });

    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(okBtn);
    flashDiv.appendChild(contentDiv);
    flashDiv.appendChild(input);
    flashDiv.appendChild(buttonsDiv);

    document.body.appendChild(overlay);
    document.body.appendChild(flashDiv);

    requestAnimationFrame(() => input.focus());
  });
}
//_________________________________________________________________________________________________
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
  });
});

// Initialize first tab as active and show its content
if (linkItems.length > 0) {
  const firstContent = document.querySelector(`.${contentMap[0].contentClass}`);
  if (firstContent) firstContent.style.display = 'block';
}
//_____________________________________________________________________________________
function toggleFilter(element) {
  const parent = element.parentElement;
  const options = parent.querySelector('.filter-options');
  const arrow = element.querySelector('.arrow');
  
  if (options.style.display === 'none' || !options.style.display) {
    options.style.display = 'flex';
    arrow.textContent = '▲';
  } else {
    options.style.display = 'none';
    arrow.textContent = '▼';
  }
}
//____________________________________________________________________________________
// Function to update progress bars with new values
// function updateProgressBars(completedPercent, incompletePercent) {
//   // Reset the widths to 0 for new animation
//   document.getElementById('completed-bar').style.width = '0%';
//   document.getElementById('incomplete-bar').style.width = '0%';
//   document.getElementById('completed-value').textContent = '0%';
//   document.getElementById('incomplete-value').textContent = '0%';
  
//   // Animate to new values
//   setTimeout(() => {
//     document.getElementById('completed-bar').style.width = completedPercent + '%';
//     animateValue(document.getElementById('completed-value'), 0, completedPercent, 1500);
//   }, 300);
  
//   setTimeout(() => {
//     document.getElementById('incomplete-bar').style.width = incompletePercent + '%';
//     animateValue(document.getElementById('incomplete-value'), 0, incompletePercent, 1500);
//   }, 600);
// }

// Animation function (keep this the same)
// function animateValue(element, start, end, duration) {
//   let startTimestamp = null;
//   const step = (timestamp) => {
//     if (!startTimestamp) startTimestamp = timestamp;
//     const progress = Math.min((timestamp - startTimestamp) / duration, 1);
//     const value = Math.floor(progress * (end - start) + start);
//     element.textContent = value + '%';
//     if (progress < 1) {
//       window.requestAnimationFrame(step);
//     }
//   };
//   window.requestAnimationFrame(step);
// }

// // Initial load (set your default values here)
// window.addEventListener('load', function() {
//   updateProgressBars(75, 25); // Default values
// });

// Example of how to update later (call this whenever you need to change values)
// updateProgressBars(70, 30); // New values

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

//__________________________________________________________________________________________
// Frontend JavaScript - Updated with debug information
async function loadUserStatisticsChart() {
    try {
        // Show loading state
        const chartLoading = document.getElementById('chart-loading');
        const chartUsers = document.getElementById('chart-users');
        
        chartLoading.style.display = 'block';
        chartUsers.innerHTML = '';

        const apiUrl = '/api/statistics/users/monthly';
        console.log('🔍 Fetching from URL:', apiUrl);

        // Fetch real data from API with debug info
        const response = await fetch(apiUrl);
        
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response OK:', response.ok);
        console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Check if response is HTML (error page)
        const contentType = response.headers.get('content-type');
        console.log('🔍 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            // Get the text to see what's actually returned
            const textResponse = await response.text();
            console.error('❌ Expected JSON but got:', textResponse.substring(0, 200));
            throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('🔍 API Response:', result);

        if (result.success && result.data) {
            renderUserChart(result.data);
            chartLoading.style.display = 'none';
        } else {
            throw new Error(result.message || 'Failed to load chart data');
        }

    } catch (error) {
        console.error('❌ Error loading user statistics:', error);
        const chartLoading = document.getElementById('chart-loading');
        chartLoading.innerHTML = `Error: ${error.message}. <br>Check console for details.`;
        chartLoading.style.color = 'red';
        
        // Show fallback data
        renderFallbackChart();
    }
}

// ... rest of your functions remain the same
function renderUserChart(userDataMonthly) {
    const chartUsers = document.getElementById('chart-users');
    chartUsers.innerHTML = '';

    // Calculate max value for scaling
    const maxValueUsers = Math.max(...userDataMonthly.map(d => 
        Math.max(d.donors, d.requesters, d.charities || 0)
    )) * 1.1; // Add 10% padding

    userDataMonthly.forEach(data => {
        const monthGroup = document.createElement('div');
        monthGroup.className = 'month-group';

        // Container for side-by-side bars
        const barsContainer = document.createElement('div');
        barsContainer.className = 'bars-container';

        // Donors bar
        const donorBar = document.createElement('div');
        donorBar.className = 'bar donors';
        donorBar.style.height = `${(data.donors / maxValueUsers) * 300}px`;
        
        const donorLabel = document.createElement('div');
        donorLabel.className = 'value-label';
        donorLabel.textContent = data.donors;
        donorBar.appendChild(donorLabel);

        // Requesters bar
        const requesterBar = document.createElement('div');
        requesterBar.className = 'bar requesters';
        requesterBar.style.height = `${(data.requesters / maxValueUsers) * 300}px`;
        
        const requesterLabel = document.createElement('div');
        requesterLabel.className = 'value-label';
        requesterLabel.textContent = data.requesters;
        requesterBar.appendChild(requesterLabel);
        
        // Charities bar
        const charityBar = document.createElement('div');
        charityBar.className = 'bar charities';
        charityBar.style.height = `${((data.charities || 0) / maxValueUsers) * 300}px`;
        
        const charityLabel = document.createElement('div');
        charityLabel.className = 'value-label';
        charityLabel.textContent = data.charities || 0;
        charityBar.appendChild(charityLabel);


        // Month label
        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = data.month;

        // Append bars to container
        barsContainer.appendChild(donorBar);
        barsContainer.appendChild(requesterBar);
        barsContainer.appendChild(charityBar);
        monthGroup.appendChild(barsContainer);
        monthGroup.appendChild(monthLabel);
        chartUsers.appendChild(monthGroup);
    });
}

// Fallback function in case API fails
function renderFallbackChart() {
    const fallbackData = [
        { month: 'Aug 2025', donors: 0, requesters: 0, charities: 0 },
        { month: 'Sep 2025', donors: 0, requesters: 0, charities: 0 },
        { month: 'Oct 2025', donors: 0, requesters: 0, charities: 0 },
        { month: 'Nov 2025', donors: 0, requesters: 0, charities: 0 },
        { month: 'Dec 2025', donors: 0, requesters: 0, charities: 0 },
        { month: 'Jan 2026', donors: 0, requesters: 0, charities: 0 },
        { month: 'Feb 2026', donors: 0, requesters: 0, charities: 0 },
        { month: 'Mar 2026', donors: 0, requesters: 0, charities: 0 },
        { month: 'Apr 2026', donors: 0, requesters: 0, charities: 0 },
        { month: 'May 2026', donors: 0, requesters: 0, charities: 0 },
        { month: 'Jun 2026', donors: 0, requesters: 0, charities: 0 },
        { month: 'Jul 2026', donors: 0, requesters: 0, charities: 0 },
        { month: 'Aug 2026', donors: 0, requesters: 0, charities: 0 }
    ];
    renderUserChart(fallbackData);
}

// Load chart when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing chart...');
    loadUserStatisticsChart();
    
    // Optional: Add refresh button
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Chart';
    refreshButton.className = 'refresh-chart-btn';
    refreshButton.onclick = loadUserStatisticsChart;
    document.querySelector('.chart-container').appendChild(refreshButton);
});
//________________________________________________________________________________________________________
// public/js/admin-categories.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Categories script loaded');
    
    const form = document.getElementById('addCategoryForm');
    const imageInput = document.getElementById('categoryImage');
    const imageBox = document.querySelector('.image-box');
    
    if (!form || !imageBox) {
        console.log('Admin categories form not found on this page');
        return;
    }

    // Create hidden input for image URL
    let uploadedImageUrlInput = document.getElementById('uploadedImageUrl');
    if (!uploadedImageUrlInput) {
        uploadedImageUrlInput = document.createElement('input');
        uploadedImageUrlInput.type = 'hidden';
        uploadedImageUrlInput.name = 'imageUrl';
        uploadedImageUrlInput.id = 'uploadedImageUrl';
        form.appendChild(uploadedImageUrlInput);
    }

    // Image upload functionality
    imageBox.addEventListener('click', () => {
        if (imageInput) imageInput.click();
    });

    if (imageInput) {
        imageInput.addEventListener('change', async function(e) {
            if (this.files.length > 0) {
                await uploadImageFile(this.files[0]); // Fixed: files[0] not files(t)
            }
        });
    }

    async function uploadImageFile(file) {
        // Fixed: file.type.startsWith not title.type.startswith
        if (!file.type.startsWith('image/')) {
            showFlashMessage('Please select a valid image file', 'error');
            return;
        }

        imageBox.innerHTML = '<p>Uploading...</p>';
        
        // Fixed: FormData not formats
        const formData = new FormData();
        formData.append('categoryImage', file);

        try {
            const response = await fetch('/upload-image', {
                method: 'POST',
                body: formData  // Fixed: proper syntax
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Fixed: uploadedImageUrlInput.value not uploadImageInfoView(value)
                uploadedImageUrlInput.value = result.imageUrl;
                
                // Fixed: proper template literal syntax
                imageBox.innerHTML = `
                    <img src="${result.imageUrl}" alt="Preview" style="max-width: 100px;">
                    <p>Image uploaded!</p>
                `;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            showFlashMessage('Upload failed: ' + error.message, 'error');
            resetImageInput();
        }
    }

    function resetImageInput() {
        if (imageInput) imageInput.value = '';
        if (uploadedImageUrlInput) uploadedImageUrlInput.value = '';
        imageBox.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m.5 4v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 1 0"/>
            </svg>
            <p>Upload Category Image</p>
        `;
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const categoryName = document.getElementById('categoryName')?.value;
        const categoryDescription = document.getElementById('categoryDescription')?.value;
        const imageUrl = uploadedImageUrlInput.value;

        if (!categoryName) {
            showFlashMessage('Category name is required!', 'error');
            return;
        }

        const categoryData = {
            categoryName: categoryName,
            categoryDescription: categoryDescription,
            imageUrl: imageUrl
        };

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoryData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                showFlashMessage('Category added successfully!', 'success');
                form.reset();
                resetImageInput();
            } else {
                showFlashMessage('Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showFlashMessage('Failed to add category: ' + error.message, 'error');
        }
    });

    resetImageInput();
});

//________________________________________________________________________________________________________
// public/js/admin-faq.js
document.addEventListener('DOMContentLoaded', function() {
    const faqForm = document.getElementById('addFaqForm');
    
    if (!faqForm) {
        console.log('FAQ form not found on this page');
        return;
    }

    // Handle form submission
    faqForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const faqData = {
            faq_question: document.getElementById('faq_question').value,
            faq_answer: document.getElementById('faq_answer').value,
            faq_type: document.getElementById('faq_type').value
        };

        // Validation
        if (!faqData.faq_question.trim() || !faqData.faq_answer.trim()) {
            showFlashMessage('Please fill in both question and answer fields', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/faqs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(faqData)
            });

            const result = await response.json();

            if (result.success) {
                showFlashMessage('FAQ added successfully!', 'success');
                faqForm.reset();
                // Optional: Refresh FAQ list
                loadFAQs();
            } else {
                showFlashMessage('Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showFlashMessage('Failed to add FAQ. Please try again.', 'error');
        }
    });
});

//_______________________________________________________________________________________________

document.addEventListener('DOMContentLoaded', function() {
    console.log('FAQ Management page loaded');
    
    // Load all FAQs into the table
    loadAllFAQs();
    
    // Modal elements
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    
    let currentFaqIdToDelete = null;
    
    // Modal event listeners
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

async function loadAllFAQs() {
    const tableBody = document.getElementById('faqTableBody');
    
    try {
        const response = await fetch('/api/faqs');
        const result = await response.json();
        
        if (result.success) {
            // Use unified pagination system
            storeTableData('faqs', result.data);
        } else {
            throw new Error(result.message || 'Failed to load FAQs');
        }
    } catch (error) {
        console.error('Error loading FAQs:', error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="error-text">Error loading FAQs. Please try again later.</td></tr>`;
        }
    }
}

function displayFAQsInTable(faqs) {
    const tableBody = document.getElementById('faqTableBody');
    if (!tableBody) return;
    
    if (!faqs || faqs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="no-data-text">No FAQs found.</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = faqs.map(faq => `
        <tr data-faq-id="${faq.faq_id}">
            <td>${faq.faq_id}</td>
            <td class="question-cell">
                <div class="question-preview">${truncateText(faq.faq_question, 50)}</div>
                <div class="full-question" style="display: none;">${faq.faq_question}</div>
            </td>
            <td class="answer-cell">
                <div class="answer-preview">${truncateText(faq.faq_answer, 70)}</div>
                <div class="full-answer" style="display: none;">${faq.faq_answer}</div>
                <button class="toggle-answer-btn" onclick="toggleFullText(this)">View More</button>
            </td>
            <td>
                <span class="faq-type-badge ${faq.faq_type}">${faq.faq_type}</span>
            </td>
            <td>${formatDate(faq.created_at)}</td>
            <td class="td-btn">
                <button class="delete-btn btn-website" onclick="openDeleteModal(${faq.faq_id})" title="Delete FAQ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                  </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function openDeleteModal(faqId) {
    currentFaqIdToDelete = faqId;
    const deleteModal = document.getElementById('deleteModal');
    deleteModal.style.display = 'block';
    
    // Add animation class
    setTimeout(() => {
        deleteModal.classList.add('show');
    }, 10);
}

function closeModal() {
    const deleteModal = document.getElementById('deleteModal');
    deleteModal.classList.remove('show');
    
    setTimeout(() => {
        deleteModal.style.display = 'none';
        currentFaqIdToDelete = null;
    }, 300);
}

async function confirmDelete() {
    if (!currentFaqIdToDelete) return;
    
    try {
        const response = await fetch(`/api/faqs/${currentFaqIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove the row from the table
            const row = document.querySelector(`tr[data-faq-id="${currentFaqIdToDelete}"]`);
            if (row) {
                row.style.backgroundColor = '#ffebee';
                setTimeout(() => {
                    row.remove();
                    // Check if table is empty
                    const remainingRows = document.querySelectorAll('#faqTableBody tr');
                    if (remainingRows.length === 0) {
                        document.getElementById('faqTableBody').innerHTML = `
                            <tr>
                                <td colspan="6" class="no-data-text">No FAQs found.</td>
                            </tr>
                        `;
                    }
                }, 500);
            }
            
            showNotification('FAQ deleted successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to delete FAQ');
        }
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        showNotification('Error deleting FAQ: ' + error.message, 'error');
    } finally {
        closeModal();
    }
}

function editFAQ(faqId) {
    // Implement edit functionality
    console.log('Edit FAQ:', faqId);
    // You can redirect to an edit page or open a modal
    // window.location.href = `/admin/faq/edit/${faqId}`;
}

function toggleFullText(button) {
    const cell = button.closest('td');
    const preview = cell.querySelector('.answer-preview, .question-preview');
    const fullText = cell.querySelector('.full-answer, .full-question');
    
    if (preview.style.display === 'none') {
        preview.style.display = 'block';
        fullText.style.display = 'none';
        button.textContent = 'View More';
    } else {
        preview.style.display = 'none';
        fullText.style.display = 'block';
        button.textContent = 'View Less';
    }
}

// Utility functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}



function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        transition: all 0.3s ease;
        ${type === 'success' ? 'background-color: #4CAF50;' : ''}
        ${type === 'error' ? 'background-color: #f44336;' : ''}
        ${type === 'info' ? 'background-color: #2196F3;' : ''}
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
//_______________________________________________________________________________________
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
//_________________________________________________________________________________________
document.getElementById('addRankForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const submitButton = this.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  
  try {
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = 'Adding...';
    
    const response = await fetch('/admin/ranks', {
      method: 'POST',
      body: formData
    });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // If not JSON, get the text and try to parse it
      const text = await response.text();
      console.error('Non-JSON response:', text);
      
      // Check if it's an HTML error page
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('Server returned an HTML error page. Check server logs.');
      }
      
      // Try to parse as JSON anyway (in case content-type was wrong)
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    if (result.success) {
      showFlashMessage('Rank added successfully!', 'success');
      this.reset();
      // Reset image previews if you have them
      resetImagePreviews();
    } else {
      throw new Error(result.message || 'Unknown error occurred');
    }
    
  } catch (error) {
    console.error('Error:', error);
    showFlashMessage('Error adding rank: ' + error.message, 'error');
  } finally {
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
});

// Function to reset image previews (if you have them)
function resetImagePreviews() {
  const imagePreviews = document.querySelectorAll('.image-preview');
  imagePreviews.forEach(preview => preview.remove());
  
  const fileInputs = document.querySelectorAll('.file-input');
  fileInputs.forEach(input => input.value = '');
  
  const uploadTexts = document.querySelectorAll('.image-box p');
  uploadTexts.forEach(text => text.style.display = 'block');
  
  const uploadIcons = document.querySelectorAll('.image-box svg');
  uploadIcons.forEach(icon => icon.style.display = 'block');
}

//______________________________________________________________________________________________

// Function to update fundraiser statistics
async function updateFundraiserStats() {
    try {
        const response = await fetch('/api/fundraiser-stats');
        const stats = await response.json();
        
        // Update counters
        document.getElementById('allWebsiteFundraisersCount').textContent = stats.total;
        document.getElementById('completeWebsiteFundraisersCount').textContent = stats.completed;
        document.getElementById('incompleteWebsiteFundraisersCount').textContent = stats.incompleted;
        document.getElementById('waitingRequestersWebsiteFundraisersCount').textContent = stats.waiting_requesters;
        document.getElementById('createFormWebsiteFundraisersCount').textContent = stats.create_form;
        document.getElementById('transferredWebsiteFundraisersCount').textContent = stats.transferred;
        // Update percentages
        document.getElementById('completedFundraisersValue').textContent = stats.completedPercentage + '%';
        document.getElementById('incompletedFundraisersValue').textContent = stats.incompletedPercentage + '%';
        document.getElementById('waitingRequestersFundraisersValue').textContent = stats.waitingRequestersPercentage + '%';
        document.getElementById('createFormFundraisersValue').textContent = stats.createFormPercentage + '%';
        document.getElementById('transferredFundraisersValue').textContent = stats.transferredPercentage + '%';

        // Update progress bars
        document.getElementById('completedFundraisersbar').style.width = stats.completedPercentage + '%';
        document.getElementById('incompletedFundraisersbar').style.width = stats.incompletedPercentage + '%';
        document.getElementById('waitingRequestersFundraisersbar').style.width = stats.waitingRequestersPercentage + '%';
        document.getElementById('createFormFundraisersbar').style.width = stats.createFormPercentage + '%';
        document.getElementById('transferredFundraisersbar').style.width = stats.transferredPercentage + '%';
        
    } catch (error) {
        console.error('Error updating fundraiser stats:', error);
    }
}

// // Update stats every 30 seconds for real-time feel
// setInterval(updateFundraiserStats, 30000);

// Initial update
document.addEventListener('DOMContentLoaded', updateFundraiserStats);

//____________________________________________________________________________________________________
// Function to delete a fundraiser
async function deleteFundraiser(fundraiserId) {
    if (!await showFlashConfirm('Are you sure you want to delete this fundraiser? This action cannot be undone and will also delete any associated forms, requests, and verification requests.', 'error')) {
        return;
    }

    try {
        const response = await fetch(`/api/fundraisers/${fundraiserId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();
            const row = document.querySelector(`tr[data-fundraiser-id="${fundraiserId}"]`);
            if (row) {
                row.remove();
            }
            showFlashMessage(
                `Fundraiser deleted successfully! (${result.deletedFormsCount || 0} form(s) and related requests also removed)`,
                'success'
            );
            // Refresh stats and related tables
            updateFundraiserStats();
            loadFormsTable();
            loadRequestsTable();
        } else {
            const error = await response.json();
            showFlashMessage('Error deleting fundraiser: ' + (error.error || error.message), 'error');
        }
    } catch (error) {
        console.error('Error deleting fundraiser:', error);
        showFlashMessage('Error deleting fundraiser: ' + error.message, 'error');
    }
}

// Function to add "trend" category to a fundraiser
async function addTrendCategory(fundraiserId) {
    try {
        const response = await fetch(`/api/fundraisers/${fundraiserId}/categories/trend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const updatedFundraiser = await response.json();
            
            // Update the categories display for this row
            const row = document.querySelector(`tr[data-fundraiser-id="${fundraiserId}"]`);
            if (row) {
                const categoriesCell = row.querySelector('.categories');
                categoriesCell.innerHTML = updatedFundraiser.categories.map(cat => 
                    `<span class="category-tag">${cat}</span>`
                ).join(', ');
            }
            
            showFlashMessage('"trend" category added successfully!', 'success');
        } else {
            const error = await response.json();
            showFlashMessage('Error adding trend category: ' + error.message, 'error');
        }
    } catch (error) {
        console.error('Error adding trend category:', error);
        showFlashMessage('Error adding trend category. Please try again.');
    }
}

// Function to format currency
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toLocaleString();
}

// Function to remove "trend" category from a fundraiser
async function removeTrendCategory(fundraiserId) {
    if (!await showFlashConfirm('Are you sure you want to remove the "trend" category from this fundraiser?', 'warning')) {
        return;
    }

    try {
        const response = await fetch(`/api/fundraisers/${fundraiserId}/categories/trend`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const updatedFundraiser = await response.json();
            
            // Update the categories display for this row
            const row = document.querySelector(`tr[data-fundraiser-id="${fundraiserId}"]`);
            if (row) {
                const categoriesCell = row.querySelector('.categories');
                categoriesCell.innerHTML = updatedFundraiser.categories && updatedFundraiser.categories.length > 0 
                    ? updatedFundraiser.categories.map(cat => 
                        `<span class="category-tag">${cat}</span>`
                    ).join(', ')
                    : '<span class="no-categories">No categories</span>';
                
                // Hide the remove trend button since trend is removed
                const removeTrendBtn = row.querySelector('.remove-trend-btn');
                if (removeTrendBtn) {
                    removeTrendBtn.parentElement.innerHTML = '<span class="no-action">-</span>';
                }
            }
            
            showFlashMessage('"trend" category removed successfully!', 'success');
        } else {
            const error = await response.json();
            	showFlashMessage('Error removing trend category: ' + error.message, 'error');
        }
    } catch (error) {
        console.error('Error removing trend category:', error);
        showFlashMessage('Error removing trend category. Please try again.');
    }
}
//__________________________________________________________________________________________

// Function to delete a category
async function deleteCategory(categoryId, categoryName) {
    // Show enhanced confirmation message
    const confirmationMessage = `Are you sure you want to delete the category "${categoryName}"?\n\nThis will:\n• Permanently delete the category\n• Remove this category from any fundraisers using it\n\nThis action cannot be undone.`;
    
    if (!await showFlashConfirm(confirmationMessage, 'error')) {
        return;
    }

    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Remove the row from the table
            const row = document.querySelector(`tr[data-category-id="${categoryId}"]`);
            if (row) {
                row.remove();
            }
            
            // Show enhanced success message with affected fundraisers info
            let successMessage = result.message || 'Category deleted successfully!';
            
            // Add more details if fundraisers were affected
            if (result.data && result.data.affectedFundraisers > 0) {
                successMessage += `\n\n• Category was removed from ${result.data.affectedFundraisers} fundraiser(s)`;
                successMessage += `\n• Category name: ${result.data.categoryName}`;
            }
            
            // Use custom alert style or enhanced alert
            showEnhancedAlert('success', successMessage);
            
            // If no categories left, show the "No categories found" row
            const tableBody = document.querySelector('.all-categories-table tbody');
            const remainingRows = tableBody.querySelectorAll('tr[data-category-id]');
            if (remainingRows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No categories found</td></tr>';
            }
            
            // Optional: Refresh the page or update any category-dependent components
            updateCategoryDependentComponents();
            
        } else {
            // Enhanced error message
            const errorMessage = result.message || 'Unknown error occurred while deleting category';
            showEnhancedAlert('error', `Error deleting category: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showEnhancedAlert('error', 'Network error deleting category. Please check your connection and try again.');
    }
}

// Enhanced alert function for better user experience
function showEnhancedAlert(type, message) {
    // You can replace this with a custom modal or toast notification
    // For now, using enhanced alert with emojis
    showFlashMessage(message, type);
}

// Function to update any components that depend on categories
function updateCategoryDependentComponents() {
    // If you have dropdowns, filters, or other components that use categories,
    // you can update them here after a category is deleted
    
    // Example: Refresh category dropdowns
    const categoryDropdowns = document.querySelectorAll('select[data-category-dropdown]');
    categoryDropdowns.forEach(dropdown => {
        // You might want to refresh these dropdowns from the server
        // or remove the deleted category option
        const optionToRemove = dropdown.querySelector(`option[value="${categoryId}"]`);
        if (optionToRemove) {
            optionToRemove.remove();
        }
    });
    
    // Log for debugging
    console.log('Category-dependent components updated');
}

// Optional: Add a function to show a more detailed confirmation modal
async function showDeleteConfirmationModal(categoryId, categoryName, fundraisersCount = 0) {
    // You can implement a custom modal here for better UX
    const modalHtml = `
        <div class="delete-confirmation-modal">
            <h3>Delete Category</h3>
            <p>Are you sure you want to delete the category <strong>"${categoryName}"</strong>?</p>
            ${fundraisersCount > 0 ? 
                `<div class="warning-message">
                    ⚠️ This category is currently used by <strong>${fundraisersCount}</strong> fundraiser(s). 
                    It will be removed from all these fundraisers.
                </div>` : ''
            }
            <div class="modal-actions">
                <button class="btn-cancel">Cancel</button>
                <button class="btn-confirm-delete">Delete Category</button>
            </div>
        </div>
    `;
    
    // Implementation of custom modal would go here
    // For now, fall back to standard confirm
    return await showFlashConfirm(`Delete category "${categoryName}"?${fundraisersCount > 0 ? ` This will affect ${fundraisersCount} fundraiser(s).` : ''}`);
}

// Enhanced alert function for better user experience
function showEnhancedAlert(type, message) {
    // You can replace this with a custom modal or toast notification
    // For now, using enhanced alert with emojis
    const icon = type === 'success' ? '✅' : '❌';
    alert(`${icon} ${message}`);
}

// Function to update any components that depend on categories
function updateCategoryDependentComponents() {
    // If you have dropdowns, filters, or other components that use categories,
    // you can update them here after a category is deleted
    
    // Example: Refresh category dropdowns
    const categoryDropdowns = document.querySelectorAll('select[data-category-dropdown]');
    categoryDropdowns.forEach(dropdown => {
        // You might want to refresh these dropdowns from the server
        // or remove the deleted category option
        const optionToRemove = dropdown.querySelector(`option[value="${categoryId}"]`);
        if (optionToRemove) {
            optionToRemove.remove();
        }
    });
    
    // Log for debugging
    console.log('Category-dependent components updated');
}

// Function to handle image loading errors
document.addEventListener('DOMContentLoaded', function() {
    // Add error handling for category images
    const categoryImages = document.querySelectorAll('.category-img');
    categoryImages.forEach(img => {
        img.onerror = function() {
            this.style.display = 'none';
            const noImageSpan = this.nextElementSibling;
            if (noImageSpan && noImageSpan.classList.contains('no-image')) {
                noImageSpan.style.display = 'inline';
            }
        };
    });
});

//__________________________________________________________________________________________________________________
// public/js/admin-complaints.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin complaints management loaded');
});

// Toggle complaint content view
function toggleComplaintContent(complaintId) {
    const preview = document.querySelector(`#complaint-${complaintId} .content-preview`);
    const fullContent = document.getElementById(`full-content-${complaintId}`);
    const button = document.querySelector(`#complaint-${complaintId} .view-more-btn`);

    if (fullContent.style.display === 'none') {
        preview.style.display = 'none';
        fullContent.style.display = 'block';
        button.textContent = 'View Less';
    } else {
        preview.style.display = 'block';
        fullContent.style.display = 'none';
        button.textContent = 'View More';
    }
}

// Resolve complaint
async function resolveComplaint(complaintId) {
    if (!await showFlashConfirm('Are you sure you want to mark this complaint as resolved?', 'warning')) {
        return;
    }

    const button = document.querySelector(`#complaint-${complaintId} .resolve-btn`);
    const originalText = button.innerHTML;

    try {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Resolving...';

        const response = await fetch(`/api/admin/complaints/${complaintId}/resolve`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (result.success) {
            // Update the row
            const row = document.getElementById(`complaint-${complaintId}`);
            const statusCell = row.querySelector('.status-badge');
            const actionCell = row.querySelector('.td-btn:first-child');

            // Update status
            statusCell.textContent = 'resolved';
            statusCell.className = 'status-badge status-resolved';

            // Update action button
            actionCell.innerHTML = '<span class="resolved-text">Resolved</span>';

            // Show success message
            showNotification('Complaint marked as resolved successfully!', 'success');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Error resolving complaint:', error);
        showNotification('Failed to resolve complaint: ' + error.message, 'error');
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Delete complaint
async function deleteComplaint(complaintId) {
    if (!await showFlashConfirm('Are you sure you want to delete this complaint? This action cannot be undone.', 'error')) {
        return;
    }

    const button = document.querySelector(`#complaint-${complaintId} .delete-btn`);
    const originalText = button.innerHTML;

    try {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Deleting...';

        const response = await fetch(`/api/admin/complaints/${complaintId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (result.success) {
            // Remove the row from table
            const row = document.getElementById(`complaint-${complaintId}`);
            row.style.opacity = '0.5';
            setTimeout(() => {
                row.remove();
                
                // Check if table is empty
                const tbody = document.getElementById('complaintsTableBody');
                if (tbody.children.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" class="no-data">No complaints found</td></tr>';
                }
            }, 500);

            showNotification('Complaint deleted successfully!', 'success');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Error deleting complaint:', error);
        showNotification('Failed to delete complaint: ' + error.message, 'error');
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Notification function
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

//________________________________________________________________________________________________
async function loadComplaintsTable() {
    try {
        const response = await fetch('/api/admin/complaints');
        const result = await response.json();
        
        if (result.success && result.data) {
            storeTableData('complaints', result.data);
        } else {
            storeTableData('complaints', []);
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
        storeTableData('complaints', []);
    }
}

//___________________________________________________________________________________________
// Fetch and display all invoices
async function loadAllInvoices() {
  try {
    console.log('🔄 Loading all invoices...');
    
    const response = await fetch('/api/invoices/admin/all-invoices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    });

    const result = await response.json();

    if (result.success && result.data) {
        storeTableData('invoices', result.data);
    } else {
        storeTableData('invoices', []);
    }
  } catch (error) {
    console.error('💥 Error loading invoices:', error);
    showFlashMessage('Error loading invoices: ' + error.message, 'error');
  }
}
// Delete invoice function
async function deleteInvoice(invoiceId) {
  	if (!await showFlashConfirm('Are you sure you want to delete this invoice? This action cannot be undone.', 'error')) {
    return;
  }

  try {
    console.log(`🗑️ Deleting invoice: ${invoiceId}`);
    
    const response = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Invoice deleted successfully');
      // Remove the row from the table
      const row = document.querySelector(`tr[data-invoice-id="${invoiceId}"]`);
      if (row) {
        row.remove();
      }
      showFlashMessage('Invoice deleted successfully!', 'success');
    } else {
      console.error('❌ Failed to delete invoice:', result.error);
      showFlashMessage('Failed to delete invoice: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('💥 Error deleting invoice:', error);
    showFlashMessage('Error deleting invoice: ' + error.message, 'error');
  }
}

// Display invoices in the table
function displayInvoices(invoices) {
  const tbody = document.getElementById('invoicesTableBody');
  
  if (invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="16" style="text-align: center;">No invoices found</td></tr>';
    return;
  }

  tbody.innerHTML = invoices.map(invoice => `
    <tr data-invoice-id="${invoice.id}">
      <td>${invoice.provider_transaction_id || 'N/A'}</td>
      <td>${invoice.donor_id || 'N/A'}</td>
      <td>${invoice.donor_name || 'N/A'}</td>
      <td>${invoice.fundraiser_id || 'N/A'}</td>
      <td>${invoice.fundraiser_title || 'N/A'}</td>
      <td>$${parseFloat(invoice.gross_amount || 0).toFixed(2)}</td>
      <td>$${parseFloat(invoice.net_amount || 0).toFixed(2)}</td>
      <td>$${parseFloat(invoice.processing_fee || 0).toFixed(2)}</td>
      <td>${invoice.currency || 'N/A'}</td>
      <td>
        <span class="status-badge status-${invoice.status}">
          ${invoice.status || 'N/A'}
        </span>
      </td>
      <td>${invoice.payment_provider || 'N/A'}</td>
      <td>${invoice.provider_transaction_id || 'N/A'}</td>
      <td>${invoice.paid_at || 'N/A'}</td>
      <td>
        <span class="status-badge status-${invoice.raw_points_processed ? 'processed' : 'pending'}">
          ${invoice.points_processed}
        </span>
      </td>
      <td>${invoice.points_processed_at || 'N/A'}</td>
      <td class="td-btn">
        <button 
          class="btn-delete" 
          onclick="deleteInvoice(${invoice.id})"
          title="Delete Invoice"
        >
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

// Load invoices when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadAllInvoices();
});
//_______________________________________________________________________________________________________________
// Chart data and rendering functions
let financialDonations = []; // Will be populated with real data
let dailyDonationsData = {}; // Will be populated with real data

// Load all statistics
async function loadStatistics() {
  try {
    console.log('📊 Loading invoice statistics...');
    
    const response = await fetch('/api/invoices/admin/statistics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    });

    const result = await response.json();

    if (result.success) {
      displayTransactionStats(result.data.status_totals);
      
      // Use real data for monthly chart
      if (result.data.monthly_totals && result.data.monthly_totals.length > 0) {
        displayMonthlyChart(result.data.monthly_totals);
      } else {
        // Fallback to dummy data
        console.log('📊 No monthly data, using dummy data');
        setupMonthlyChartWithDummyData();
      }
      
      // Use real data for daily chart
      if (result.data.daily_totals && result.data.daily_totals.length > 0) {
        displayDailyChart(result.data.daily_totals);
      } else {
        // Fallback to dummy data
        console.log('📊 No daily data, using dummy data');
        setupDailyChartWithDummyData();
      }
    } else {
      console.error('❌ Failed to load statistics:', result.error);
      // Fallback to dummy data if API fails
      setupMonthlyChartWithDummyData();
      setupDailyChartWithDummyData();
    }
  } catch (error) {
    console.error('💥 Error loading statistics:', error);
    // Fallback to dummy data on error
    setupMonthlyChartWithDummyData();
    setupDailyChartWithDummyData();
  }
}

// Display transaction amounts in the first template
function displayTransactionStats(stats) {
  // Successful Transactions (paid)
  const successfulElement = document.querySelector('.successful-transactions-number-box h2');
  if (successfulElement) {
    successfulElement.textContent = `$${stats.paid.total_amount.toFixed(2)}`;
    successfulElement.title = `${stats.paid.invoice_count} successful transactions`;
  }

  // Failed Transactions (not paid)
  const failedElement = document.querySelector('.failed-transactions-number-box h2');
  if (failedElement) {
    failedElement.textContent = `$${stats.not_paid.total_amount.toFixed(2)}`;
    failedElement.title = `${stats.not_paid.invoice_count} failed transactions`;
  }

  console.log('✅ Transaction stats displayed');
}

// Display monthly chart in the second template (with real data)
function displayMonthlyChart(monthlyData) {
  const chartContainer = document.getElementById('chart-donations');
  if (!chartContainer) return;

  // Transform API data to match your chart format
  financialDonations = monthlyData.map(month => ({
    month: month.month,
    amount: month.total_amount
  }));

  renderMonthlyChart();
}

// Setup monthly chart with dummy data (fallback)
function setupMonthlyChartWithDummyData() {
  // Sample data - monthly financial donations in dollars
  financialDonations = [
    { month: 'Aug 2025', amount: 12500 },
    { month: 'Sep 2025', amount: 15300 },
    { month: 'Oct 2025', amount: 18200 },
    { month: 'Nov 2025', amount: 20500 },
    { month: 'Dec 2025', amount: 28400 },
    { month: 'Jan 2026', amount: 19800 },
    { month: 'Feb 2026', amount: 21600 },
    { month: 'Mar 2026', amount: 29600 },
    { month: 'Apr 2026', amount: 19800 },
    { month: 'Jun 2026', amount: 19800 },
    { month: 'Jul 2026', amount: 20500 },
    { month: 'Aug 2026', amount: 22400 }
  ];

  renderMonthlyChart();
}

// Render monthly chart (works with both real and dummy data)
function renderMonthlyChart() {
  const chartDonations = document.getElementById('chart-donations');
  if (!chartDonations) return;

  // Clear existing content
  chartDonations.innerHTML = '';

  const amounts = financialDonations.map(d => d.amount);
  const maxAmount = Math.max(...amounts);
  const maxIndex = amounts.indexOf(maxAmount);

  financialDonations.forEach((data, index) => {
    const monthGroup = document.createElement('div');
    monthGroup.className = 'month-group';

    // Create container for value label and bar
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
    
    // Add value label above the bar
    const label = document.createElement('div');
    label.className = 'value-label';
    label.textContent = `$${data.amount.toLocaleString()}`;
    barContainer.appendChild(label);

    // Create donation amount bar
    const bar = document.createElement('div');
    bar.className = 'bar';
    if (index === maxIndex) {
      bar.classList.add('highest');
    }
    bar.style.height = `${(data.amount / maxAmount) * 350}px`;
    barContainer.appendChild(bar);

    // Add month label
    const monthLabel = document.createElement('div');
    monthLabel.className = 'month-label';
    monthLabel.textContent = data.month;

    monthGroup.appendChild(barContainer);
    monthGroup.appendChild(monthLabel);
    chartDonations.appendChild(monthGroup);
  });

  console.log('✅ Monthly chart rendered with', financialDonations.length, 'months');
}

// Display daily chart in the third template (with real data)
function displayDailyChart(dailyData) {
  // Transform API data to match your daily chart format
  dailyDonationsData = {};
  dailyData.forEach(day => {
    const date = new Date(day.raw_date);
    const dayOfMonth = date.getDate();
    dailyDonationsData[dayOfMonth] = day.total_amount;
  });

  initializeDailyChart();
}

// Setup daily chart with dummy data (fallback)
function setupDailyChartWithDummyData() {
  // Default donation amounts for each day of the month (1-31)
  dailyDonationsData = {
    1: 80,   2: 50,   3: 100,  4: 15,   5: 1,
    6: 90,   7: 120,  8: 75,   9: 60,   10: 110,
    11: 45,  12: 85,  13: 95,  14: 30,  15: 65,
    16: 40,  17: 55,  18: 70,  19: 25,  20: 80,
    21: 105, 22: 90,  23: 115, 24: 50,  25: 35,
    26: 75,  27: 60,  28: 95,  29: 40,  30: 85,
    31: 65
  };

  initializeDailyChart();
}

// Initialize daily chart (works with both real and dummy data)
function initializeDailyChart() {
  // Get chart title element
  const chartTitle = document.getElementById('chart-title');

  // Generate donation data for the current month
  function generateMonthlyData() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Update chart title with month and year
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    chartTitle.textContent = `${monthNames[currentMonth]} ${currentYear} Donations`;
    
    const donations = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatDate(date);
      // Use data from dailyDonationsData if available, otherwise use default
      donations[dateStr] = dailyDonationsData[day] || 0;
    }
    
    return { donations, today };
  }

  // Get the generated data
  const { donations: donationsData, today } = generateMonthlyData();

  // Convert to array of {date, amount} objects and sort by date
  const donations = Object.entries(donationsData)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Chart elements
  const chartEl = document.querySelector('.donation-chart');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const minLabel = document.querySelector('.scale-labels .min');
  const maxLabel = document.querySelector('.scale-labels .max');

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
    const maxAmount = Math.max(...barsData.map(b => b.amount), 10);
    maxLabel.textContent = `$${maxAmount}`;
    
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
  }
  
  // Navigation handlers
  prevBtn.addEventListener('click', () => {
    currentCenterDate.setDate(currentCenterDate.getDate() - 7);
    updateChartTitle(currentCenterDate);
    renderChart();
  });
  
  nextBtn.addEventListener('click', () => {
    currentCenterDate.setDate(currentCenterDate.getDate() + 7);
    updateChartTitle(currentCenterDate);
    renderChart();
  });
  
  // Update chart title when navigating
  function updateChartTitle(date) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    chartTitle.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()} Donations`;
  }
  
  // Helper functions
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  // Initial render
  renderChart();
  console.log('✅ Daily chart initialized');
}

// Load everything when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadAllInvoices(); // Your existing function
  loadStatistics(); // New statistics function
});

//____________________________________________________________________________________________________________________

// 🔒 Block fundraiser
async function blockFundraiser(fundraiserId) {
// AFTER:
const reason = await showFlashPrompt('Enter block reason (optional):', 'Manual block by administrator');
if (reason === null) return; // User cancelled
// If user clicks OK with empty input, reason will be '' (empty string)
// So you may want:
const finalReason = reason || 'Manual block by administrator';
    
    try {
        const response = await fetch(`/api/fundraisers/${fundraiserId}/block`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason: reason })
        });

        if (response.ok) {
            const result = await response.json();
            
            // Reload the page to reflect changes
            location.reload();
            
            showFlashMessage('Fundraiser blocked successfully!');
        } else {
            const error = await response.json();
            showFlashMessage('Error blocking fundraiser: ' + error.error);
        }
    } catch (error) {
        console.error('Error blocking fundraiser:', error);
        showFlashMessage('Error blocking fundraiser. Please try again.');
    }
}

// 🔓 Unblock fundraiser
async function unblockFundraiser(fundraiserId) {
    if (!await showFlashConfirm('Are you sure you want to unblock this fundraiser?', 'warning')) {
        return;
    }

    try {
        const response = await fetch(`/api/fundraisers/${fundraiserId}/unblock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();
            
            // Reload the page to reflect changes
            location.reload();
            
            showFlashMessage('Fundraiser unblocked successfully!');
        } else {
            const error = await response.json();
            showFlashMessage('Error unblocking fundraiser: ' + error.error);
        }
    } catch (error) {
        console.error('Error unblocking fundraiser:', error);
        showFlashMessage('Error unblocking fundraiser. Please try again.');
    }
}


async function markUrgent(fundraiserId) {
    if (!await showFlashConfirm('Mark this fundraiser as urgent?', 'warning')) return;

    try {
        const response = await fetch(`/api/fundraisers/${fundraiserId}/urgent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            showFlashMessage('Fundraiser marked as urgent!', 'success');
            loadFundraisersTable();
        } else {
            const error = await response.json();
            showFlashMessage('Error: ' + (error.error || error.message), 'error');
        }
    } catch (error) {
        console.error('Error marking urgent:', error);
        showFlashMessage('Error marking fundraiser as urgent.', 'error');
    }
}

async function unmarkUrgent(fundraiserId) {
    if (!await showFlashConfirm('Remove urgent status from this fundraiser?', 'warning')) return;

    try {
        const response = await fetch(`/api/fundraisers/${fundraiserId}/unurgent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            showFlashMessage('Fundraiser unmarked as urgent!', 'success');
            loadFundraisersTable();
        } else {
            const error = await response.json();
            showFlashMessage('Error: ' + (error.error || error.message), 'error');
        }
    } catch (error) {
        console.error('Error unmarking urgent:', error);
        showFlashMessage('Error removing urgent status.', 'error');
    }
}
//____________________________________________________________________________________________________________

document.getElementById("controlPanelBtn").addEventListener("click", async (e) => {
    e.preventDefault();

    try {
        // Check session on the server — works for both admins and regular users
        const res = await fetch('/admin/me', { credentials: 'same-origin' });
        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                window.location.href = "/admin";
                return;
            }
        }

        // Not an admin — check /me for regular users
        const meRes = await fetch('/me', { credentials: 'same-origin' });
        if (meRes.ok) {
            const me = await meRes.json();
            if (me.id) {
                const userType = me.user_type || me.userType || '';
                if (userType.toLowerCase().includes('requester')) {
                    window.location.href = "/userPanelIndigent";
                } else if (userType.toLowerCase().includes('donor')) {
                    window.location.href = "/UserPanelDonor";
                } else {
                    window.location.href = "/";
                }
                return;
            }
        }

        // Not logged in
        window.location.href = "/register";
    } catch (err) {
        console.error('Navigation error:', err);
        window.location.href = "/register";
    }
});

//________________________________________________________________________________________________

// ── Admin page access guard ───────────────────────────────────────────────────
// Verify admin session on the SERVER (not sessionStorage which is never set
// for admins). If /admin/me returns success:false or a non-2xx status, the
// server-side requireAuth middleware will have already redirected — this is
// just a safety net for XHR-based navigation.
(async () => {
  try {
    const res = await fetch('/admin/me', { credentials: 'same-origin' });
    if (!res.ok) {
      // Server already redirected for page loads; nothing extra needed here.
      return;
    }
    const data = await res.json();
    if (!data.success) {
      window.location.href = '/register';
    }
  } catch (e) {
    // Network error — leave the server redirect to handle it.
    console.warn('Access check failed:', e.message);
  }
})();

//_________________________________________________________________________________________________

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Use the new admin-specific endpoint
    const res = await fetch("/admin/me");
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to fetch admin data");
    }

    const admin = await res.json();
    console.log("Admin data received:", admin); // Debug log

    // Check if the request was successful
    if (!admin.success) {
      throw new Error(admin.message || "Admin data not available");
    }

    // ✅ Update admin name
    const accountName = document.querySelector(".account-name");
    if (accountName) {
      accountName.textContent = admin.name || "Administrator";
    }

    // ✅ Update admin image
    const accountImage = document.querySelector(".account-image");
    if (accountImage) {
      if (admin.userImage && admin.userImage.trim() !== "") {
        console.log("Setting admin image to:", admin.userImage);
        accountImage.src = admin.userImage;
        
        // Add error handling for broken images
        accountImage.onerror = function() {
          console.log("Admin image failed to load, using default");
          this.src = "/assets/image/Fundraiser-Page/header-sec/man-profile.png";
        };
      } else {
        console.log("Using default admin image");
        accountImage.src = "/assets/image/Fundraiser-Page/header-sec/man-profile.png";
      }
    } else {
      console.error("Element with class 'account-image' not found!");
    }

    // ✅ Optional: Log admin role for debugging
    console.log("Admin role:", admin.role);

  } catch (err) {
    console.error("Error fetching admin data:", err);
    
    // Fallback to guest/admin display
    const accountName = document.querySelector(".account-name");
    if (accountName) {
      accountName.textContent = "Administrator";
    }
    
    const accountImage = document.querySelector(".account-image");
    if (accountImage) {
      accountImage.src = "/assets/image/Fundraiser-Page/header-sec/man-profile.png";
    }
  }
});

//_____________________________________________________________________________________________________________________

async function loadCounts() {
    try {
        console.log("Fetching counts from /counts...");
        const res = await fetch("/admin/counts");
        console.log("Response status:", res.status);
        
        if (!res.ok) {
            console.error("Response not OK:", res.status, res.statusText);
            throw new Error("Failed to fetch counts");
        }
        
        const counts = await res.json();
        console.log("Counts data received:", counts);

        // Update each count element
        document.getElementById("categories-count").textContent = counts.categories || 0;
        document.getElementById("ranks-count").textContent = counts.ranks || 0;
        document.getElementById("events-count").textContent = counts.events || 0;
        document.getElementById("faqs-count").textContent = counts.faqs || 0;
        document.getElementById("complaints-count").textContent = counts.complaints || 0;
        
    } catch (err) {
        console.error("Error loading counts:", err);
        // Set all counts to 0 on error
        const elements = [
            "categories-count", 
            "ranks-count", 
            "events-count", 
            "faqs-count", 
            "complaints-count"
        ];
        elements.forEach(id => {
            document.getElementById(id).textContent = 0;
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadCounts();
});

//____________________________________________________________________________________________________________

// Logout handler: calls server /logout endpoint and clears client session
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.querySelector('.logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (ev) => {
    ev.preventDefault();

    // Confirm logout
    const confirmLogout = await showFlashConfirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    try {
      const logoutResponse = await fetch('/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      });

      // Always clear client-side storage regardless of server response
      sessionStorage.clear();
      localStorage.clear();

      // Force clear ALL cookies by setting them to expire with path=/
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

//_________________________________________________________________________________________________________

// Chart creation function
function createFundraisersChart(fundraisersDataMonthly, chartElement) {
  console.log('📊 Creating fundraisers chart with data:', fundraisersDataMonthly);
  
  const maxValueFundraisers = Math.max(...fundraisersDataMonthly.map(d => 
      Math.max(d.completed, d.incompleted, d.waitingRequesters || 0, d.createForm || 0, d.transferred || 0)
  )) * 1.1; // Add 10% padding

  fundraisersDataMonthly.forEach(data => {
      const monthGroup = document.createElement('div');
      monthGroup.className = 'month-group';

      // Container for side-by-side bars
      const barsContainer = document.createElement('div');
      barsContainer.className = 'bars-container';

      // Completed fundraisers bar
      const completedBar = document.createElement('div');
      completedBar.className = 'bar completed';
      completedBar.style.height = `${(data.completed / maxValueFundraisers) * 300}px`;
      
      const completedLabel = document.createElement('div');
      completedLabel.className = 'value-label';
      completedLabel.textContent = data.completed;
      completedBar.appendChild(completedLabel);

      // Uncompleted fundraisers bar
      const uncompletedBar = document.createElement('div');
      uncompletedBar.className = 'bar uncompleted';
      uncompletedBar.style.height = `${(data.incompleted / maxValueFundraisers) * 300}px`;
      
      const uncompletedLabel = document.createElement('div');
      uncompletedLabel.className = 'value-label';
      uncompletedLabel.textContent = data.incompleted;
      uncompletedBar.appendChild(uncompletedLabel);
    
      // Waiting_requesters bar
      const waitingRequestersBar = document.createElement('div');
      waitingRequestersBar.className = 'bar waiting-requesters';
      waitingRequestersBar.style.height = `${((data.waitingRequesters || 0) / maxValueFundraisers) * 300}px`;
      
      const waitingRequestersLabel = document.createElement('div');
      waitingRequestersLabel.className = 'value-label';
      waitingRequestersLabel.textContent = data.waitingRequesters || 0;
      waitingRequestersBar.appendChild(waitingRequestersLabel);
      

      // Create_form bar
      const createFormBar = document.createElement('div');
      createFormBar.className = 'bar create-form';
      createFormBar.style.height = `${((data.createForm || 0) / maxValueFundraisers) * 300}px`;
      
      const createFormLabel = document.createElement('div');
      createFormLabel.className = 'value-label';
      createFormLabel.textContent = data.createForm || 0;
      createFormBar.appendChild(createFormLabel);
      

      // Transferred bar
      const transferredBar = document.createElement('div');
      transferredBar.className = 'bar transferred';
      transferredBar.style.height = `${((data.transferred || 0) / maxValueFundraisers) * 300}px`;
      
      const transferredLabel = document.createElement('div');
      transferredLabel.className = 'value-label';
      transferredLabel.textContent = data.transferred || 0;
      transferredBar.appendChild(transferredLabel);
      
      // Month label
      const monthLabel = document.createElement('div');
      monthLabel.className = 'month-label';
      monthLabel.textContent = data.month;

      // Append bars to container
      barsContainer.appendChild(completedBar);
      barsContainer.appendChild(uncompletedBar);
      barsContainer.appendChild(waitingRequestersBar);
      barsContainer.appendChild(createFormBar);
      barsContainer.appendChild(transferredBar);
      monthGroup.appendChild(barsContainer);
      monthGroup.appendChild(monthLabel);
      chartElement.appendChild(monthGroup);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATED USER MANAGEMENT FUNCTIONS
// Replaces: AllUserCount.js, AllUserList.js, AllRequestsCount.js, AllrequestList.js
// ═══════════════════════════════════════════════════════════════════════════════

// ── User Count Loading ─────────────────────────────────────────────────────────
async function loadUserCounts() {
    try {
        // Fetch requesters count
        const requestersRes = await fetch('/users/requesters');
        const requestersData = await requestersRes.json();
        document.getElementById('fundraisersCount').textContent = requestersData.count || 0;

        // Fetch donors count
        const donorsRes = await fetch('/users/donors');
        const donorsData = await donorsRes.json();
        document.getElementById('donorsCount').textContent = donorsData.count || 0;

        // Fetch charities count
        const charitiesRes = await fetch('/users/charities');
        const charitiesData = await charitiesRes.json();
        const charitiesEl = document.getElementById('charitiesCount');
        if (charitiesEl) charitiesEl.textContent = charitiesData.count || 0;
    } catch (err) {
        console.error('Error loading user counts:', err);
        document.getElementById('fundraisersCount').textContent = 0;
        document.getElementById('donorsCount').textContent = 0;
        const charitiesEl = document.getElementById('charitiesCount');
        if (charitiesEl) charitiesEl.textContent = 0;
    }
}

// ── Donors Table ───────────────────────────────────────────────────────────────
async function loadDonorsTable() {
    try {
        const res = await fetch('/users/donors');
        const data = await res.json();

        console.log('DEBUG - Donors API response:', data);

        const tbody = document.getElementById('donorsTableBody');
        if (!tbody) return;
        storeTableData('donor', data.users);

        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="no-data">No donors found</td></tr>';
            return;
        }

    } catch (err) {
        console.error('Error loading donors:', err);
        const tbody = document.getElementById('donorsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="11" class="no-data">Error loading donors</td></tr>';
    }
}

// ── Requesters Table ───────────────────────────────────────────────────────────
async function loadRequesterUsers() {
    try {
        const res = await fetch('/users/requesters');
        const data = await res.json();

        console.log('DEBUG - Requesters API response:', data);

        const tbody = document.getElementById('requesterList');
        if (!tbody) return;
        storeTableData('requester', data.users);

        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="no-data">No requesters found</td></tr>';
            return;
        }
    } catch (err) {
        console.error('Error loading requesters:', err);
        const tbody = document.getElementById('requesterList');
        if (tbody) tbody.innerHTML = '<tr><td colspan="11" class="no-data">Error loading requesters</td></tr>';
    }
}

// ── NEW: Charity Users Table ───────────────────────────────────────────────────
async function loadCharityUsers() {
    try {
        const res = await fetch('/users/charities');
        const data = await res.json();

        console.log('DEBUG - Charities API response:', data);

        const tbody = document.getElementById('charityList');
        if (!tbody) return;
        storeTableData('charity', data.users);

        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" class="no-data">No charities found</td></tr>';
            return;
        }
    } catch (err) {
        console.error('Error loading charities:', err);
        const tbody = document.getElementById('charityList');
        if (tbody) tbody.innerHTML = '<tr><td colspan="13" class="no-data">Error loading charities</td></tr>';
    }
}

async function loadFundraisersTable() {
    try {
        const response = await fetch('/api/fundraisers/admin/all');
        const result = await response.json();
        storeTableData('fundraisers', result.success ? result.data : []);
    } catch (error) {
        console.error('Error loading fundraisers:', error);
        storeTableData('fundraisers', []);
    }
}

// ═════════════════════════════════════════════════════════════════
// VERIFICATION REQUESTS MANAGEMENT
// ═════════════════════════════════════════════════════════════════

async function loadVerificationRequestsTable() {
    try {
        const response = await fetch('/api/fundraiser-verification-requests');
        const result = await response.json();
        storeTableData('verificationRequests', result.success ? result.data : []);
    } catch (error) {
        console.error('Error loading verification requests:', error);
        storeTableData('verificationRequests', []);
    }
}

function renderVerificationRequestsTable(requests) {
    const tbody = document.getElementById('verificationRequestsTableBody');
    if (!tbody) return;
    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No verification requests found</td></tr>';
        return;
    }
    tbody.innerHTML = requests.map(req => `
        <tr data-verification-request-id="${req.request_id}" data-fundraiser-id="${req.fundraiser_id}">
            <td>${req.request_id}</td>
            <td>${req.user_id}</td>
            <td>${req.user_full_name || req.charity_full_name || 'N/A'}</td>
            <td>${req.user_email}</td>
            <td>${req.user_type}</td>
            <td>${req.fundraiser_id}</td>
            <td>${req.fundraiser_type}</td>
            <td>${req.user_identity_number || req.charity_license_number || 'N/A'}</td>
            <td>${req.user_current_address || req.charity_current_address || 'N/A'}</td>
            <td><span class="status-badge status-${req.request_status}">${req.request_status}</span></td>
            <td>${req.created_at ? new Date(req.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td class="th-btn">
                ${req.request_status === 'pending' ? 
                    `<button class="btn-website accept-btn" onclick="acceptVerificationRequest(${req.request_id})" title="Accept">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
                        </svg>
                    </button>` : '<span class="no-action">-</span>'
                }
            </td>
            <td class="th-btn">
                ${req.request_status === 'pending' ? 
                    `<button class="btn-website reject-btn" onclick="rejectVerificationRequest(${req.request_id})" title="Reject">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                        </svg>
                    </button>` : '<span class="no-action">-</span>'
                }
            </td>
        </tr>
    `).join('');
}

async function acceptVerificationRequest(requestId) {
    if (!await showFlashConfirm('Accept this verification request? The campaign status will be updated.', 'warning')) return;
    try {
        const response = await fetch(`/api/fundraiser-verification-requests/${requestId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            showFlashMessage('Request accepted and campaign activated.', 'success');
            loadVerificationRequestsTable();
            loadFundraisersTable();
        } else {
            showFlashMessage(result.message || 'Error accepting request', 'error');
        }
    } catch (error) {
        console.error('Error accepting verification request:', error);
        showFlashMessage('Error accepting request: ' + error.message, 'error');
    }
}

async function rejectVerificationRequest(requestId) {
    if (!await showFlashConfirm('Reject this request? The user will be banned.', 'error')) return;
    try {
        const response = await fetch(`/api/fundraiser-verification-requests/${requestId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            showFlashMessage('Request rejected and user banned.', 'success');
            loadVerificationRequestsTable();
            reloadAllUserTables();
        } else {
            showFlashMessage(result.message || 'Error rejecting request', 'error');
        }
    } catch (error) {
        console.error('Error rejecting verification request:', error);
        showFlashMessage('Error rejecting request: ' + error.message, 'error');
    }
}

function applyVerificationRequestsFilter() {
    const form = document.getElementById('verificationRequestsFilterForm');
    const formData = new FormData(form);
    const statuses = formData.getAll('status[]');
    const types = formData.getAll('fundraiser_type[]');
    const search = formData.get('search')?.toLowerCase() || '';

    const allData = tableState.verificationRequests.allData;
    let filtered = allData.filter(req => {
        if (statuses.length > 0 && !statuses.includes(req.request_status)) return false;
        if (types.length > 0 && !types.includes(req.fundraiser_type)) return false;
        if (search) {
            const name = (req.user_full_name || req.charity_full_name || '').toLowerCase();
            const email = (req.user_email || '').toLowerCase();
            if (!name.includes(search) && !email.includes(search)) return false;
        }
        return true;
    });

    tableState.verificationRequests.filteredData = filtered;
    tableState.verificationRequests.page = 1;
    renderTablePage('verificationRequests', 1);
}

function resetVerificationRequestsFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('verificationRequestsFilterForm');
    if (form) form.reset();
    tableState.verificationRequests.filteredData = [];
    tableState.verificationRequests.page = 1;
    renderTablePage('verificationRequests', 1);
}

//_____________________________________________________________________________________
async function loadCategoriesTable() {
    try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        // Normalize field names from API
        const normalized = (result.data || []).map(cat => ({
            id: cat.category_id || cat.id,
            name: cat.category_name || cat.name,
            image: cat.category_image || cat.image,
            description: cat.category_description || cat.description
        }));
        storeTableData('categories', normalized);
    } catch (error) {
        console.error('Error loading categories:', error);
        storeTableData('categories', []);
    }
}

async function loadRanksTable() {
    try {
        const response = await fetch('/admin/ranks');
        const result = await response.json();
        const normalized = (result.data || []).map(rank => ({
            rankId: rank.rankId || rank.rank_id,
            rankName: rank.rankName || rank.rank_name,
            minimumPoints: rank.minimumPoints || rank.minimum_points,
            maximumPoints: rank.maximumPoints || rank.maximum_points,
            rankImage: rank.rankImage || rank.rank_image,
            rewardName: rank.rewardName || rank.reward_name,
            rewardImage: rank.rewardImage || rank.reward_image,
            numOfUsersInRank: rank.numOfUsersInRank || rank.num_of_users_in_rank || 0
        }));
        storeTableData('ranks', normalized);
    } catch (error) {
        console.error('Error loading ranks:', error);
        storeTableData('ranks', []);
    }
}

async function loadUserRanksTable() {
    try {
        const response = await fetch('/api/user-rank-points');
        const result = await response.json();
        const normalized = (result.data || []).map(urp => ({
            userRankPointId: urp.userRankPointId || urp.user_rank_point_id,
            userId: urp.userId || urp.user_id,
            fullName: urp.fullName || urp.full_name || 'N/A',
            userImage: urp.userImage || urp.user_image || '',
            userPoints: urp.userPoints || urp.user_points || 0,
            maximumPoints: urp.maximumPoints || urp.maximum_points || 0,
            rankImage: urp.rankImage || urp.rank_image || ''
        }));
        storeTableData('userRanks', normalized);
    } catch (error) {
        console.error('Error loading user ranks:', error);
        storeTableData('userRanks', []);
    }
}

// ── Ban/Unban/Delete Functions ─────────────────────────────────────────────────
async function banUser(userId) {
    	if (!await showFlashConfirm('Are you sure you want to ban this user?', 'error')) return;
    
    try {
        console.log(`🔄 Attempting to ban user: ${userId}`);
        
        const response = await fetch(`/users/${userId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Manual ban by administrator' })
        });

        console.log('📨 Ban API response status:', response.status);
        
        const responseText = await response.text();
        console.log('📨 Raw response:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Response is not JSON:', responseText);
            throw new Error('Server returned invalid response');
        }
        
        if (response.ok && result.success) {
            showFlashMessage('User banned successfully');
            await reloadAllUserTables();
        } else {
            showFlashMessage(result.error || 'Error banning user');
        }
    } catch (error) {
        console.error('❌ Error banning user:', error);
        showFlashMessage('Error banning user: ' + error.message);
    }
}

async function unbanUser(userId) {
    if (!await showFlashConfirm('Are you sure you want to unban this user?', 'warning')) return;
    
    try {
        const response = await fetch(`/users/${userId}/unban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showFlashMessage('User unbanned successfully');
            await reloadAllUserTables();
        } else {
            showFlashMessage(result.error || 'Error unbanning user');
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        showFlashMessage('Error unbanning user: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (!await showFlashConfirm('Are you sure you want to delete this user?', 'error')) return;

    try {
        const response = await fetch(`/users/delete/${userId}`, { method: 'DELETE' });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        await reloadAllUserTables();
        showFlashMessage('تم حذف المستخدم بنجاح');
    } catch (err) {
        console.error(err);
        showFlashMessage('حدث خطأ أثناء حذف المستخدم: ' + err.message);
    }
}

// Helper to reload all user tables
async function reloadAllUserTables() {
    await Promise.all([
        loadDonorsTable(),
        loadRequesterUsers(),
        loadCharityUsers()
    ]);
}

// ── Update DOMContentLoaded Event ──────────────────────────────────────────────
// Add this to your existing DOMContentLoaded listener or create one:
// ── Initialize on DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
    initPaginationListeners();
    initFilterListeners();
    
    loadUserCounts();
    loadRequesterUsers();
    loadDonorsTable();
    loadCharityUsers();
    loadFundraisersTable();    // ADD
    loadFormsTable();
    loadRequestsTable();
    loadAllInvoices();
    loadComplaintsTable();
    loadCategoriesTable();     // ADD
    loadRanksTable();          // ADD
    loadUserRanksTable();      // ADD
    loadVerificationRequestsTable();
    loadNotificationsTable();  // ← ADD THIS LINE
    loadLedgerTable();
    loadBalancesTable();
    loadWithdrawalsTable();
    loadTransfersTable();
    
    loadAllDashboardStatistics();
});

// ═════════════════════════════════════════════════════════════════
// ASYNC STATISTICS LOADER (loads after page mount)
// ═════════════════════════════════════════════════════════════════

async function loadAllDashboardStatistics() {
    // Fire all chart loaders concurrently; failures don't block siblings
    await Promise.allSettled([
        loadUserStatisticsChart(),          // monthly users bar (already async)
        loadUserDoughnutChart(),            // users doughnut → now async
        loadFundraiserMonthlyChart(),       // monthly fundraisers bar → now async
        loadFundraiserDoughnutChart(),      // fundraisers doughnut → now async
        loadFormsRequestsChart(),           // NEW: monthly forms/requests bar
        loadFormsRequestsDoughnut(),        // NEW: forms/requests doughnut
        loadRanksCharts(),                  // ranks bar + doughnut → now async
        loadStatistics()                    // donations (already async)
    ]);
}

// ── User Doughnut (async) ──
async function loadUserDoughnutChart() {
    try {
        const res = await fetch('/api/statistics/users/overview');
        const result = await res.json();
        if (!result.success) return;

        const { totals, percentages } = result.data;
        const ctx = document.getElementById('userChart').getContext('2d');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Donors', 'Indigents', 'Charities'],
                datasets: [{
                    data: [percentages.donors, percentages.requesters, percentages.charities],
                    backgroundColor: ['#ff9a17', '#14213d', '#28a745'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const count = label === 'Donors' ? totals.donors :
                                               label === 'Indigents' ? totals.requesters : totals.charities;
                                return `${label}: ${value}% (${count} users)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    } catch (e) { console.error('User doughnut error:', e); }
}

// ── Fundraiser Monthly Bar (async) ──
// ═════════════════════════════════════════════════════════════════
// FIXED: Fundraiser chart initialization - removed data-attributes check
// that was causing "No fundraiser data available" flash
// ═════════════════════════════════════════════════════════════════

// REMOVED: getFundraisersDataMonthly() function — no longer needed
// REMOVED: Old DOMContentLoaded that checked data-attributes

// ── Fundraiser Monthly Bar (async) ──
async function loadFundraiserMonthlyChart() {
    const chartFundraisers = document.getElementById('chart-fundraisers');
    if (!chartFundraisers) return;
    
    // Clear any "No data" message from old script
    chartFundraisers.innerHTML = '';
    
    try {
        const res = await fetch('/api/statistics/fundraisers/monthly');
        const result = await res.json();
        if (result.success && result.data && result.data.length > 0) {
            createFundraisersChart(result.data, chartFundraisers);
        } else {
            chartFundraisers.innerHTML = '<div class="no-data">No fundraiser data available</div>';
        }
    } catch (e) { 
        console.error('Fundraiser monthly error:', e); 
        chartFundraisers.innerHTML = '<div class="no-data">Error loading data</div>';
    }
}

// ── Fundraiser Doughnut (async) ──
async function loadFundraiserDoughnutChart() {
    try {
        const res = await fetch('/api/statistics/fundraisers/overview');
        const result = await res.json();
        if (!result.success) return;

        const { totals, percentages } = result.data;
        const ctx = document.getElementById('fundraisersChart').getContext('2d');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Uncompleted', 'Waiting Requesters', 'Create Form', 'Transferred'],
                datasets: [{
                    data: [
                        percentages.completed,
                        percentages.incompleted,
                        percentages.waitingRequesters,
                        percentages.createForm,
                        percentages.transferred,
                    ],
                    backgroundColor: ['#ff9a17', '#14213d', '#6f42c1', '#35a7dc', '#28a745'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const labels = ['Completed','Uncompleted','Waiting Requesters','Create Form','Transferred'];
                                const counts = [totals.completed, totals.incompleted, totals.waitingRequesters, totals.createForm, totals.transferred];
                                return `${labels[context.dataIndex]}: ${context.raw}% (${counts[context.dataIndex]} Fundraisers)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    } catch (e) { console.error('Fundraiser doughnut error:', e); }
}

// ── Forms & Requests Monthly Bar (NEW) ──
async function loadFormsRequestsChart() {
    const chartLoading = document.getElementById('chart-forms-requests-loading');
    const chartEl = document.getElementById('chart-forms-requests');
    if (!chartEl) return;

    chartLoading.style.display = 'block';
    chartEl.innerHTML = '';

    try {
        const res = await fetch('/api/statistics/forms-requests/monthly');
        const result = await res.json();
        if (result.success && result.data) {
            renderFormsRequestsChart(result.data);
            chartLoading.style.display = 'none';
        } else {
            throw new Error(result.message || 'Failed to load chart data');
        }
    } catch (error) {
        chartLoading.innerHTML = `Error: ${error.message}`;
        chartLoading.style.color = 'red';
    }
}

function renderFormsRequestsChart(data) {
    const chartEl = document.getElementById('chart-forms-requests');
    chartEl.innerHTML = '';
    const maxValue = Math.max(...data.map(d => Math.max(d.forms, d.requests))) * 1.1 || 1;

    data.forEach(item => {
        const monthGroup = document.createElement('div');
        monthGroup.className = 'month-group';

        const barsContainer = document.createElement('div');
        barsContainer.className = 'bars-container';

        // Forms bar
        const formsBar = document.createElement('div');
        formsBar.className = 'bar forms';
        formsBar.style.height = `${(item.forms / maxValue) * 300}px`;
        const formsLabel = document.createElement('div');
        formsLabel.className = 'value-label';
        formsLabel.textContent = item.forms;
        formsBar.appendChild(formsLabel);

        // Requests bar
        const requestsBar = document.createElement('div');
        requestsBar.className = 'bar requests';
        requestsBar.style.height = `${(item.requests / maxValue) * 300}px`;
        const requestsLabel = document.createElement('div');
        requestsLabel.className = 'value-label';
        requestsLabel.textContent = item.requests;
        requestsBar.appendChild(requestsLabel);

        barsContainer.appendChild(formsBar);
        barsContainer.appendChild(requestsBar);

        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = item.month;

        monthGroup.appendChild(barsContainer);
        monthGroup.appendChild(monthLabel);
        chartEl.appendChild(monthGroup);
    });
}

// ── Forms & Requests Doughnut (NEW) ──
async function loadFormsRequestsDoughnut() {
    try {
        const res = await fetch('/api/statistics/forms-requests/overview');
        const result = await res.json();
        if (!result.success) return;

        const { totals, percentages } = result.data;
        const loading = document.getElementById('forms-requests-doughnut-loading');
        if (loading) loading.style.display = 'none';

        const ctx = document.getElementById('formsRequestsChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Forms', 'Requests'],
                datasets: [{
                    data: [percentages.forms, percentages.requests],
                    backgroundColor: ['#ff9a17', '#14213d'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const count = label === 'Forms' ? totals.forms : totals.requests;
                                return `${label}: ${context.raw}% (${count})`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    } catch (e) { console.error('Forms/Requests doughnut error:', e); }
}

// ── Ranks Charts (async) ──
async function loadRanksCharts() {
    try {
        const res = await fetch('/api/statistics/ranks/overview');
        const result = await res.json();
        if (!result.success) return;

        const { userRanks, totalUsersInRanks, totalUsersInNoRank, totalAllUsers, inRankPercentage, noRankPercentage } = result.data;

        // Bar chart
        const chartRanks = document.getElementById('chart-ranks');
        if (chartRanks) {
            chartRanks.innerHTML = '';
            if (userRanks && userRanks.length > 0) {
                const counts = userRanks.map(r => r.count);
                const maxCount = Math.max(...counts) || 1;
                userRanks.forEach(data => {
                    const rankGroup = document.createElement('div');
                    rankGroup.className = 'rank-group';
                    const barContainer = document.createElement('div');
                    barContainer.className = 'bar-container';
                    const label = document.createElement('div');
                    label.className = 'value-label';
                    label.textContent = data.count;
                    barContainer.appendChild(label);
                    const bar = document.createElement('div');
                    bar.className = 'bar';
                    bar.style.height = `${(data.count / maxCount) * 350}px`;
                    bar.style.background = data.color;
                    barContainer.appendChild(bar);
                    const rankLabel = document.createElement('div');
                    rankLabel.className = 'rank-label';
                    rankLabel.textContent = data.rank;
                    rankGroup.appendChild(barContainer);
                    rankGroup.appendChild(rankLabel);
                    chartRanks.appendChild(rankGroup);
                });
            } else {
                chartRanks.innerHTML = '<div class="no-data">No rank data available</div>';
            }
        }

        // Doughnut chart
        const ctx = document.getElementById('users-in-ranksChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Has Rank', 'No Rank'],
                datasets: [{
                    data: [inRankPercentage, noRankPercentage],
                    backgroundColor: ['#ff9a17', '#14213d'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const count = label === 'Has Rank' ? totalUsersInRanks : totalUsersInNoRank;
                                return `${label}: ${context.raw}% (${count} Users)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    } catch (e) { console.error('Ranks charts error:', e); }
}

// ═════════════════════════════════════════════════════════════════
// SINGLE ENTRY POINT
// ═════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════════
// FORMS & REQUESTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════
// FIX: loadFormsTable - was storing as 'requests', should be 'forms'
// ═════════════════════════════════════════════════════════════════
async function loadFormsTable() {
    try {
        const response = await fetch('/api/fundraiser-forms', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });

        const result = await response.json();
        const tbody = document.getElementById('formsTableBody');
        if (!tbody) return;
        
        if (result.success && result.data && result.data.length > 0) {
            storeTableData('forms', result.data);  // ← FIXED: was 'requests'
        } else {
            storeTableData('forms', []);           // ← FIXED: was 'requests'
        }
    } catch (error) {
        console.error('Error loading forms:', error);
        const tbody = document.getElementById('formsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="no-data">Error loading forms</td></tr>';
    }
}

// ═════════════════════════════════════════════════════════════════
// FIX: loadRequestsTable - correct, but verify it's using 'requests'
// ═════════════════════════════════════════════════════════════════
async function loadRequestsTable() {
    try {
        const response = await fetch('/api/fundraiser-requests', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });

        const result = await response.json();
        const tbody = document.getElementById('requestsTableBody');
        if (!tbody) return;

        if (result.success && result.data && result.data.length > 0) {
            storeTableData('requests', result.data);  // ← This is correct
        } else {
            storeTableData('requests', []);           // ← This is correct
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        const tbody = document.getElementById('requestsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="no-data">Error loading requests</td></tr>';
    }
}

// ── Helper: Format JSONB data for table display ──
function formatJsonbForDisplay(data) {
    if (!data) return { preview: '-', full: '-', hasMore: false };

    let jsonString;
    try {
        jsonString = JSON.stringify(data, null, 2);
    } catch (e) {
        jsonString = String(data);
    }

    const maxPreviewLength = 80;
    const hasMore = jsonString.length > maxPreviewLength;
    const preview = hasMore
        ? escapeHtml(jsonString.substring(0, maxPreviewLength)) + '...'
        : escapeHtml(jsonString);

    const full = escapeHtml(jsonString)
        .replace(/\n/g, '<br>')
        .replace(/\s{2}/g, '&nbsp;&nbsp;');

    return { preview, full, hasMore };
}

// ── Helper: Escape HTML to prevent XSS ──
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ── Toggle JSONB full content ──
function toggleJsonbContent(button) {
    const cell = button.closest('.jsonb-cell');
    const preview = cell.querySelector('.jsonb-preview');
    const full = cell.querySelector('.jsonb-full');

    if (full.style.display === 'none') {
        preview.style.display = 'none';
        full.style.display = 'block';
        button.textContent = 'View Less';
    } else {
        preview.style.display = 'block';
        full.style.display = 'none';
        button.textContent = 'View More';
    }
}

// ── Delete a form (also deletes related requests) ──
async function deleteForm(formId) {
    if (!await showFlashConfirm('Are you sure you want to delete this form? This will also delete all related requests.', 'error')) {
        return;
    }

    try {
        const response = await fetch(`/api/fundraiser-forms/${formId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            const row = document.querySelector(`tr[data-form-id="${formId}"]`);
            if (row) {
                row.style.backgroundColor = '#ffebee';
                setTimeout(() => row.remove(), 500);
            }
            showFlashMessage(
                `Form deleted successfully! (${result.deletedRequestsCount || 0} related request(s) also removed)`,
                'success'
            );
            loadRequestsTable();
        } else {
            showFlashMessage('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting form:', error);
        showFlashMessage('Error deleting form: ' + error.message, 'error');
    }
}

// ── Delete a request ──
async function deleteRequest(requestId) {
    if (!await showFlashConfirm('Are you sure you want to delete this request? This action cannot be undone.', 'error')) {
        return;
    }

    try {
        const response = await fetch(`/api/fundraiser-requests/${requestId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            const row = document.querySelector(`tr[data-request-id="${requestId}"]`);
            if (row) {
                row.style.backgroundColor = '#ffebee';
                setTimeout(() => row.remove(), 500);
            }
            showFlashMessage('Request deleted successfully!', 'success');
        } else {
            showFlashMessage('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        showFlashMessage('Error deleting request: ' + error.message, 'error');
    }
}

// ── Render Functions (with pagination support) ──

function renderRequesterTable(users) {
    const tbody = document.getElementById('requesterList');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">No requesters found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const userImageSrc = user.photoBase64 ? `data:image/jpeg;base64,${user.photoBase64}` : 
                           (user.user_image || user.userImage || '/assets/image/Fundraiser-Page/header-sec/man-profile.png');
        const isBanned = user.is_banned || user.isBanned || false;
        const isVerified = user.is_verified || user.isVerified || false;
        
        return `
        <tr>
            <td>${user.id}</td>
            <td class="td-img">
                <img class="user-img" src="${userImageSrc}" alt="${user.full_name || user.fullName || 'User'}" 
                     onerror="this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'">
            </td>
            <td>${user.full_name || user.fullName || ''}</td>
            <td>${user.email || ''}</td>
            <td>${isVerified ? '✔️' : '❌'}</td>
            <td>${isBanned ? '🚫 Banned' : '✔️ Active'}</td>
            <td>${user.ban_reason || user.banReason || 'User is Not Banned'}</td>
            <td>${user.location || ''}</td>
            <td>${user.user_type || user.userType || 'requester'}</td>
            <td class="td-btn">
                ${isBanned ? 
                    `<button onclick="unbanUser('${user.id}')" class="btn-website unban-btn" title="Unban User">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M3.5 7.5a.5.5 0 0 1 0-1h9a.5.5 0 0 1 0 1z"/>
                        </svg>
                    </button>` :
                    `<button onclick="banUser('${user.id}')" class="btn-website ban-btn" title="Ban User">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M2.5 7.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1z"/>
                        </svg>
                    </button>`
                }
                <button onclick="deleteUser('${user.id}')" class="btn-website delete-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                    </svg>
                </button>
            </td>
            <td class="td-btn">
                <button onclick="openNotificationModal('${user.id}', '${(user.full_name || user.fullName || 'User').replace(/'/g, "\\'")}')" 
                        class="btn-website notify-btn" title="Send Notification">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                    </svg>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function renderDonorTable(users) {
    const tbody = document.getElementById('donorsTableBody');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">No donors found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const userImageSrc = user.photoBase64 ? `data:image/jpeg;base64,${user.photoBase64}` : 
                           (user.user_image || user.userImage || '/assets/image/Fundraiser-Page/header-sec/man-profile.png');
        const isBanned = user.is_banned || user.isBanned || false;
        const isVerified = user.is_verified || user.isVerified || false;
        
        return `
        <tr>
            <td>${user.id}</td>
            <td class="td-img">
                <img class="user-img" src="${userImageSrc}" alt="${user.full_name || user.fullName || 'User'}" 
                     onerror="this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'">
            </td>
            <td>${user.full_name || user.fullName || ''}</td>
            <td>${user.email || ''}</td>
            <td>${isVerified ? '✔️' : '❌'}</td>
            <td>${isBanned ? '🚫 Banned' : '✔️ Active'}</td>
            <td>${user.ban_reason || user.banReason || 'User is Not Banned'}</td>
            <td>${user.location || ''}</td>
            <td>${user.user_type || user.userType || 'donor'}</td>
            <td class="td-btn">
                ${isBanned ? 
                    `<button onclick="unbanUser('${user.id}')" class="btn-website unban-btn">Unban</button>` :
                    `<button onclick="banUser('${user.id}')" class="btn-website ban-btn">Ban</button>`
                }
                <button onclick="deleteUser('${user.id}')" class="btn-website delete-btn">Delete</button>
            </td>
            <td class="td-btn">
                <button onclick="openNotificationModal('${user.id}', '${(user.full_name || user.fullName || 'User').replace(/'/g, "\\'")}')" 
                        class="btn-website notify-btn" title="Send Notification">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                    </svg>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function renderCharityTable(users) {
    const tbody = document.getElementById('charityList');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No charities found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const userImageSrc = user.photoBase64 ? `data:image/jpeg;base64,${user.photoBase64}` : 
                           (user.user_image || user.userImage || '/assets/image/Fundraiser-Page/header-sec/man-profile.png');
        const isBanned = user.is_banned || user.isBanned || false;
        const isVerified = user.is_verified || user.isVerified || false;
        
        return `
        <tr>
            <td>${user.id}</td>
            <td class="td-img">
                <img class="user-img" src="${userImageSrc}" alt="${user.full_name || user.fullName || 'User'}" 
                     onerror="this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'">
            </td>
            <td>${user.full_name || user.fullName || ''}</td>
            <td>${user.email || ''}</td>
            <td>${isVerified ? '✔️' : '❌'}</td>
            <td>${isBanned ? '🚫 Banned' : '✔️ Active'}</td>
            <td>${user.ban_reason || user.banReason || 'User is Not Banned'}</td>
            <td>${user.location || ''}</td>
            <td>${user.user_type || user.userType || 'Charity'}</td>
            <td>${user.charity_name || user.charityName || 'N/A'}</td>
            <td>${user.charity_type || user.charityType || 'N/A'}</td>
            <td class="td-btn">
                ${isBanned ? 
                    `<button onclick="unbanUser('${user.id}')" class="btn-website unban-btn">Unban</button>` :
                    `<button onclick="banUser('${user.id}')" class="btn-website ban-btn">Ban</button>`
                }
                <button onclick="deleteUser('${user.id}')" class="btn-website delete-btn">Delete</button>
            </td>
            <td class="td-btn">
                <button onclick="openNotificationModal('${user.id}', '${(user.full_name || user.fullName || 'User').replace(/'/g, "\\'")}')" 
                        class="btn-website notify-btn" title="Send Notification">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                    </svg>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function renderFundraisersTable(fundraisers) {
    const tbody = document.getElementById('fundraisersTable');
    if (!tbody) return;
    
    if (!fundraisers || fundraisers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="16" class="no-data">No fundraisers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = fundraisers.map(fundraiser => `
        <tr data-fundraiser-id="${fundraiser.id}">
            <td>${fundraiser.id}</td>
            <td>
                ${fundraiser.main_image ? 
                    `<img src="${fundraiser.main_image}" alt="${fundraiser.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` :
                    '<span class="no-image">No Image</span>'
                }
            </td>
            <td>${fundraiser.title || ''}</td>
            <td>$${fundraiser.collected_amount ? fundraiser.collected_amount.toLocaleString() : '0'}</td>
            <td>$${fundraiser.target_amount ? fundraiser.target_amount.toLocaleString() : '0'}</td>
            <td>
                <span class="status-badge status-${fundraiser.status} ${fundraiser.is_blocked ? 'blocked' : ''}">
                    ${fundraiser.is_blocked ? 'BLOCKED' : fundraiser.status}
                </span>
            </td>
            <td>${fundraiser.user_id || ''}</td>
            <td>${fundraiser.type || ''}</td>
            <td>${(fundraiser.categories || []).join(', ') || 'No categories'}</td>
            <td>${fundraiser.is_urgent ? '🔥 Yes' : 'No'}</td>
            <td class="th-btn">
                <button class="btn-website delete-btn" onclick="deleteFundraiser(${fundraiser.id})" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                    </svg>
                </button>
            </td>
            <td class="th-btn">
                <button class="btn-website add-trend-btn" onclick="addTrendCategory(${fundraiser.id})" title="Add Trend">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-dotted" viewBox="0 0 16 16">
                        <path d="M8 0q-.264 0-.523.017l.064.998a7 7 0 0 1 .918 0l.064-.998A8 8 0 0 0 8 0M6.44.152q-.52.104-1.012.27l.321.948q.43-.147.884-.237L6.44.153zm4.132.271a8 8 0 0 0-1.011-.27l-.194.98q.453.09.884.237zm1.873.925a8 8 0 0 0-.906-.524l-.443.896q.413.205.793.459zM4.46.824q-.471.233-.905.524l.556.83a7 7 0 0 1 .793-.458zM2.725 1.985q-.394.346-.74.74l.752.66q.303-.345.648-.648zm11.29.74a8 8 0 0 0-.74-.74l-.66.752q.346.303.648.648zm1.161 1.735a8 8 0 0 0-.524-.905l-.83.556q.254.38.458.793l.896-.443zM1.348 3.555q-.292.433-.524.906l.896.443q.205-.413.459-.793zM.423 5.428a8 8 0 0 0-.27 1.011l.98.194q.09-.453.237-.884zM15.848 6.44a8 8 0 0 0-.27-1.012l-.948.321q.147.43.237.884zM.017 7.477a8 8 0 0 0 0 1.046l.998-.064a7 7 0 0 1 0-.918zM16 8a8 8 0 0 0-.017-.523l-.998.064a7 7 0 0 1 0 .918l.998.064A8 8 0 0 0 16 8M.152 9.56q.104.52.27 1.012l.948-.321a7 7 0 0 1-.237-.884l-.98.194zm15.425 1.012q.168-.493.27-1.011l-.98-.194q-.09.453-.237.884zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a7 7 0 0 1-.458-.793zm13.828.905q.292-.434.524-.906l-.896-.443q-.205.413-.459.793zm-12.667.83q.346.394.74.74l.66-.752a7 7 0 0 1-.648-.648zm11.29.74q.394-.346.74-.74l-.752-.66q-.302.346-.648.648zm-1.735 1.161q.471-.233.905-.524l-.556-.83a7 7 0 0 1-.793.458zm-7.985-.524q.434.292.906.524l.443-.896a7 7 0 0 1-.793-.459zm1.873.925q.493.168 1.011.27l.194-.98a7 7 0 0 1-.884-.237zm4.132.271a8 8 0 0 0 1.012-.27l-.321-.948a7 7 0 0 1-.884.237l.194.98zm-2.083.135a8 8 0 0 0 1.046 0l-.064-.998a7 7 0 0 1-.918 0zM4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
                    </svg>
                </button>
            </td>
            <td class="th-btn">
                ${(fundraiser.categories || []).includes('trend') ? 
                    `<button class="btn-website remove-trend-btn" onclick="removeTrendCategory(${fundraiser.id})" title="Remove Trend">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-circle-dotted" viewBox="0 0 16 16">
                            <path d="M8 0q-.264 0-.523.017l.064.998a7 7 0 0 1 .918 0l.064-.998A8 8 0 0 0 8 0M6.44.152q-.52.104-1.012.27l.321.948q.43-.147.884-.237L6.44.153zm4.132.271a8 8 0 0 0-1.011-.27l-.194.98q.453.09.884.237zm1.873.925a8 8 0 0 0-.906-.524l-.443.896q.413.205.793.459zM4.46.824q-.471.233-.905.524l.556.83a7 7 0 0 1 .793-.458zM2.725 1.985q-.394.346-.74.74l.752.66q.303-.345.648-.648zm11.29.74a8 8 0 0 0-.74-.74l-.66.752q.346.303.648.648zm1.161 1.735a8 8 0 0 0-.524-.905l-.83.556q.254.38.458.793l.896-.443zM1.348 3.555q-.292.433-.524.906l.896.443q.205-.413.459-.793zM.423 5.428a8 8 0 0 0-.27 1.011l.98.194q.09-.453.237-.884zM15.848 6.44a8 8 0 0 0-.27-1.012l-.948.321q.147.43.237.884zM.017 7.477a8 8 0 0 0 0 1.046l.998-.064a7 7 0 0 1 0-.918zM16 8a8 8 0 0 0-.017-.523l-.998.064a7 7 0 0 1 0 .918l.998.064A8 8 0 0 0 16 8M.152 9.56q.104.52.27 1.012l.948-.321a7 7 0 0 1-.237-.884l-.98.194zm15.425 1.012q.168-.493.27-1.011l-.98-.194q-.09.453-.237.884zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a7 7 0 0 1-.458-.793zm13.828.905q.292-.434.524-.906l-.896-.443q-.205.413-.459.793zm-12.667.83q.346.394.74.74l.66-.752a7 7 0 0 1-.648-.648zm11.29.74q.394-.346.74-.74l-.752-.66q-.302.346-.648.648zm-1.735 1.161q.471-.233.905-.524l-.556-.83a7 7 0 0 1-.793.458zm-7.985-.524q.434.292.906.524l.443-.896a7 7 0 0 1-.793-.459zm1.873.925q.493.168 1.011.27l.194-.98a7 7 0 0 1-.884-.237zm4.132.271a8 8 0 0 0 1.012-.27l-.321-.948a7 7 0 0 1-.884.237l.194.98zm-2.083.135a8 8 0 0 0 1.046 0l-.064-.998a7 7 0 0 1-.918 0zM4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
                        </svg>
                    </button>` : '<span class="no-action">-</span>'
                }
            </td>
            <td class="th-btn">
                ${!fundraiser.is_blocked ? 
                    `<button class="btn-website block-btn" onclick="blockFundraiser(${fundraiser.id})" title="Block">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M2.5 7.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1z"/>
                        </svg>
                    </button>` : '<span class="no-action">-</span>'
                }
            </td>
            <td class="th-btn">
                ${fundraiser.is_blocked ? 
                    `<button class="btn-website unblock-btn" onclick="unblockFundraiser(${fundraiser.id})" title="Unblock">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M3.5 7.5a.5.5 0 0 1 0-1h9a.5.5 0 0 1 0 1z"/>
                        </svg>
                    </button>` : '<span class="no-action">-</span>'
                }
            </td>
            <td class="th-btn">
                ${!fundraiser.is_urgent ? 
                    `<button class="btn-website urgent-btn" onclick="markUrgent(${fundraiser.id})" title="Mark as Urgent">🔥 Mark</button>` :
                    `<button class="btn-website unurgent-btn" onclick="unmarkUrgent(${fundraiser.id})" title="Unmark as Urgent">❄️ Unmark</button>`
                }
            </td>
        </tr>
    `).join('');
}

function renderFormsTable(forms) {
    const tbody = document.getElementById('formsTableBody');
    if (!tbody) return;
    if (!forms || forms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No forms found</td></tr>';
        return;
    }
    
    tbody.innerHTML = forms.map(form => {
        // Format schema with proper JSON indentation for display
        let schemaPreview = '-';
        let schemaFull = '-';
        let hasMore = false;
        
        if (form.schema) {
            try {
                // Parse if it's a string, otherwise use as-is
                const schemaData = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
                // Pretty-print JSON with 2-space indentation
                const formattedJson = JSON.stringify(schemaData, null, 2);
                // Escape HTML to prevent XSS
                const escapedJson = escapeHtml(formattedJson);
                
                schemaFull = escapedJson.replace(/\n/g, '<br>').replace(/  /g, '&nbsp;&nbsp;');
                
                // Create a readable preview (first 80 chars of the formatted JSON)
                const previewText = formattedJson.substring(0, 80);
                schemaPreview = escapeHtml(previewText) + (formattedJson.length > 80 ? '...' : '');
                hasMore = formattedJson.length > 80;
            } catch (e) {
                // If JSON parsing fails, display as plain text
                const text = String(form.schema);
                schemaPreview = escapeHtml(text.substring(0, 80)) + (text.length > 80 ? '...' : '');
                schemaFull = escapeHtml(text).replace(/\n/g, '<br>');
                hasMore = text.length > 80;
            }
        }
        
        return `
        <tr data-form-id="${form.id}">
            <td>${form.id}</td>
            <td>${form.fundraiser_id || 'N/A'}</td>
            <td>${form.user_id || 'N/A'}</td>
            <td>${form.target_requesters_number || 0}</td>
            <td>${form.current_requesters_number || 0}</td>
            <td class="jsonb-cell">
                <div class="jsonb-preview">${schemaPreview}</div>
                ${hasMore ? `<button class="view-more-btn" onclick="toggleJsonbContent(this)">View More</button>
                <div class="jsonb-full" style="display: none;">${schemaFull}</div>` : ''}
            </td>
            <td>${form.created_at ? new Date(form.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td class="td-btn"><button class="btn-website delete-btn" onclick="deleteForm(${form.id})">🗑️</button></td>
        </tr>`;
    }).join('');
}

function renderRequestsTable(requests) {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;
    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No requests found</td></tr>';
        return;
    }
    tbody.innerHTML = requests.map(req => {
        let jsonbPreview = '-';
        let jsonbFull = '-';
        let hasMore = false;
        if (req.requests) {
            try {
                const str = typeof req.requests === 'string' ? req.requests : JSON.stringify(req.requests, null, 2);
                const escaped = escapeHtml(str);
                hasMore = str.length > 80;
                jsonbPreview = hasMore ? escaped.substring(0, 80) + '...' : escaped;
                jsonbFull = escaped.replace(/\n/g, '<br>').replace(/\s{2}/g, '&nbsp;&nbsp;');
            } catch (e) {
                jsonbPreview = String(req.requests).substring(0, 80);
            }
        }
        return `
        <tr data-request-id="${req.id}">
            <td>${req.id}</td>
            <td>${req.form_id || 'N/A'}</td>
            <td>${req.fundraiser_id || 'N/A'}</td>
            <td>${req.user_id || 'N/A'}</td>
            <td class="jsonb-cell">
                <div class="jsonb-preview">${jsonbPreview}</div>
                ${hasMore ? `<button class="view-more-btn" onclick="toggleJsonbContent(this)">View More</button><div class="jsonb-full" style="display: none;">${jsonbFull}</div>` : ''}
            </td>
            <td><span class="status-badge status-${req.request_status || 'pending'}">${req.request_status || 'pending'}</span></td>
            <td>${req.request_rejected_reason || '-'}</td>
            <td>${req.created_at ? new Date(req.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td class="td-btn"><button class="btn-website delete-btn" onclick="deleteRequest(${req.id})">🗑️</button></td>
        </tr>`;
    }).join('');
}

function renderInvoicesTable(invoices) {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;
    
    if (!invoices || invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="16" class="no-data">No invoices found</td></tr>';
        return;
    }
    
    tbody.innerHTML = invoices.map(invoice => `
        <tr data-invoice-id="${invoice.id}">
            <td>${invoice.id}</td>
            <td>${invoice.donor_id || 'N/A'}</td>
            <td>${invoice.donor_name || 'N/A'}</td>
            <td>${invoice.fundraiser_id || 'N/A'}</td>
            <td>${invoice.fundraiser_title || 'N/A'}</td>
            <td>$${parseFloat(invoice.gross_amount || 0).toFixed(2)}</td>
            <td>$${parseFloat(invoice.net_amount || 0).toFixed(2)}</td>
            <td>$${parseFloat(invoice.processing_fee || 0).toFixed(2)}</td>
            <td>${invoice.currency || 'N/A'}</td>
            <td><span class="status-badge status-${invoice.status}">${invoice.status || 'N/A'}</span></td>
            <td>${invoice.payment_provider || 'N/A'}</td>
            <td>${invoice.provider_transaction_id || 'N/A'}</td>
            <td>${invoice.paid_at || 'N/A'}</td>
            <td><span class="status-badge status-${invoice.points_processed ? 'processed' : 'pending'}">${invoice.points_processed ? 'Yes' : 'No'}</span></td>
            <td>${invoice.points_processed_at || 'N/A'}</td>
            <td class="td-btn">
                <button class="btn-delete" onclick="deleteInvoice(${invoice.id})" title="Delete Invoice">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function renderComplaintsTable(complaints) {
    const tbody = document.getElementById('complaintsTableBody');
    if (!tbody) return;
    
    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No complaints found</td></tr>';
        return;
    }
    
    tbody.innerHTML = complaints.map(complaint => `
        <tr id="complaint-${complaint.complaint_id}">
            <td>${complaint.complaint_id}</td>
            <td class="complaint-content">
                <div class="content-preview">${complaint.complaint_content && complaint.complaint_content.length > 100 ? complaint.complaint_content.substring(0, 100) + '...' : (complaint.complaint_content || 'No content')}</div>
                ${complaint.complaint_content && complaint.complaint_content.length > 100 ? `
                    <button class="view-more-btn" onclick="toggleComplaintContent(${complaint.complaint_id})">View More</button>
                    <div class="full-content" id="full-content-${complaint.complaint_id}" style="display: none;">${complaint.complaint_content}</div>
                ` : ''}
            </td>
            <td>${complaint.user_id}</td>
            <td>${complaint.user_email}</td>
            <td>${complaint.user_full_name}</td>
            <td><span class="status-badge status-${complaint.status}">${complaint.status}</span></td>
            <td>${complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td class="td-btn">
                ${complaint.status !== 'resolved' ? 
                    `<button class="resolve-btn" onclick="resolveComplaint(${complaint.complaint_id})">Resolve</button>` :
                    '<span class="resolved-text">Resolved</span>'
                }
            </td>
            <td class="td-btn">
                <button class="delete-btn" onclick="deleteComplaint(${complaint.complaint_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderCategoriesTable(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;
    if (!categories || categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">No categories found</td></tr>';
        return;
    }
    tbody.innerHTML = categories.map(cat => `
        <tr data-category-id="${cat.id}">
            <td>${cat.id}</td>
            <td class="category-name">
                <span title="${cat.name}">${cat.name && cat.name.length > 30 ? cat.name.substring(0, 30) + '...' : cat.name || 'No Name'}</span>
            </td>
            <td class="category-image">
                ${cat.image ? 
                    `<img src="${cat.image}" alt="${cat.name || 'Category'}" class="category-img" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                     <span class="no-image" style="display: none;">No Image</span>` :
                    '<span class="no-image">No Image</span>'
                }
            </td>
            <td class="th-btn">
                <button class="delete-category-btn" onclick="deleteCategory(${cat.id}, '${(cat.name || '').replace(/'/g, "\\'")}')" title="Delete Category">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

async function confirmDeleteRank(rankId, rankName) {
    if (!await showFlashConfirm(`Are you sure you want to delete the rank ${rankName}?`, 'error')) {
        return;
    }

    try {
        const response = await fetch(`/ranks/${rankId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (result.success) {
            showFlashMessage(result.message || 'Rank deleted successfully', 'success');
            // Refresh the table so the row disappears without reloading the whole page
            await loadRanksTable();
        } else {
            showFlashMessage(result.message || 'Error deleting rank', 'error');
        }
    } catch (error) {
        console.error('Error deleting rank:', error);
        showFlashMessage('Error deleting rank: ' + error.message, 'error');
    }
}

function renderRanksTable(ranks) {
    const tbody = document.getElementById('ranksTableBody');
    if (!tbody) return;
    if (!ranks || ranks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No ranks found</td></tr>';
        return;
    }
    tbody.innerHTML = ranks.map(rank => `
        <tr>
            <td>${rank.rankId}</td>
            <td>${rank.rankName}</td>
            <td>${rank.minimumPoints}</td>
            <td>${rank.maximumPoints}</td>
            <td>${rank.rankImage ? `<img src="${rank.rankImage}" alt="Rank" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 'No Image'}</td>
            <td>${rank.rewardName || 'No Reward'}</td>
            <td>${rank.rewardImage ? `<img src="${rank.rewardImage}" alt="Reward" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 'No Image'}</td>
            <td>${rank.numOfUsersInRank}</td>
            <td class="th-btn">
                <button class="delete-rank-btn" onclick="confirmDeleteRank(${rank.rankId}, '${(rank.rankName || '').replace(/'/g, "\\'")}')" title="Delete Rank">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

function renderUserRanksTable(userRanks) {
    const tbody = document.getElementById('userRanksTableBody');
    if (!tbody) return;
    if (!userRanks || userRanks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No user rank points found</td></tr>';
        return;
    }
    tbody.innerHTML = userRanks.map(ur => `
        <tr>
            <td>${ur.userRankPointId}</td>
            <td>${ur.userId}</td>
            <td>${ur.fullName}</td>
            <td>${ur.userImage ? `<img src="${ur.userImage}" alt="User" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">` : 'No Image'}</td>
            <td>${ur.userPoints}</td>
            <td>${ur.maximumPoints}</td>
            <td>${ur.rankImage ? `<img src="${ur.rankImage}" alt="Rank" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 'No Image'}</td>
            <td class="th-btn">
                <form action="/user-rank-points/${ur.userRankPointId}/reset?_method=PUT" method="POST" style="display: inline;">
                    <button type="submit" class="reset-points-btn" onclick="return confirm('Are you sure you want to reset points to 0 for ${(ur.fullName || '').replace(/'/g, "\\'")}?')">Reset to 0</button>
                </form>
            </td>
            <td class="th-btn">
                <form action="/user-rank-points/${ur.userRankPointId}?_method=DELETE" method="POST" style="display: inline;">
                    <button type="submit" class="delete-user-rank-btn" onclick="return confirm('Are you sure you want to delete all rank points data for ${(ur.fullName || '').replace(/'/g, "\\'")}?')">🗑️</button>
                </form>
            </td>
        </tr>
    `).join('');
}
// ═════════════════════════════════════════════════════════════════
// UNIFIED PAGINATION & FILTERING SYSTEM FOR ADMIN PANEL TABLES
// ═════════════════════════════════════════════════════════════════

const tableState = {
    requester: { page: 1, filters: {}, allData: [], filteredData: [] },
    donor: { page: 1, filters: {}, allData: [], filteredData: [] },
    charity: { page: 1, filters: {}, allData: [], filteredData: [] },
    fundraisers: { page: 1, filters: {}, allData: [], filteredData: [] },
    forms: { page: 1, filters: {}, allData: [], filteredData: [] },
    requests: { page: 1, filters: {}, allData: [], filteredData: [] },
    invoices: { page: 1, filters: {}, allData: [], filteredData: [] },
    complaints: { page: 1, filters: {}, allData: [], filteredData: [] },
    categories: { page: 1, filters: {}, allData: [], filteredData: [] },
    ranks: { page: 1, filters: {}, allData: [], filteredData: [] },
    userRanks: { page: 1, filters: {}, allData: [], filteredData: [] },
    faqs: { page: 1, filters: {}, allData: [], filteredData: [] },
    verificationRequests: { page: 1, filters: {}, allData: [], filteredData: [] },
    notifications: { page: 1, filters: {}, allData: [], filteredData: [] },
    ledger: { page: 1, filters: {}, allData: [], filteredData: [] },
    balances: { page: 1, filters: {}, allData: [], filteredData: [] },
    withdrawals: { page: 1, filters: {}, allData: [], filteredData: [] },
    transfers: { page: 1, filters: {}, allData: [], filteredData: [] },
};
const ITEMS_PER_PAGE = 10;

// ── Initialize Pagination Event Listeners ──
function initPaginationListeners() {
    document.querySelectorAll('.pagination-controls').forEach(control => {
        control.addEventListener('click', async (e) => {
            const btn = e.target.closest('.prev-page-btn, .next-page-btn');
            if (!btn || btn.disabled) return;
            
            const section = control.dataset.section;
            const newPage = parseInt(btn.dataset.page);
            if (newPage < 1) return;
            
            await renderTablePage(section, newPage);
        });
    });
}

// ── Client-Side Pagination Render ──
async function renderTablePage(section, page) {
    const state = tableState[section];
    if (!state) return;
    
    state.page = page;
    const dataToRender = state.filteredData.length > 0 ? state.filteredData : state.allData;
    
    const totalPages = Math.ceil(dataToRender.length / ITEMS_PER_PAGE) || 1;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = dataToRender.slice(start, end);
    
    // Call the appropriate render function
    const renderFn = getRenderFunction(section);
    if (renderFn) {
        renderFn(pageData);
    }
    
    updatePaginationControls(section, page, totalPages, dataToRender.length);
}

function getRenderFunction(section) {
  const renderers = {
    requester: renderRequesterTable,
    donor: renderDonorTable,
    charity: renderCharityTable,
    fundraisers: renderFundraisersTable,
    forms: renderFormsTable,
    requests: renderRequestsTable,
    invoices: renderInvoicesTable,
    complaints: renderComplaintsTable,
    categories: renderCategoriesTable,
    ranks: renderRanksTable,
    userRanks: renderUserRanksTable,
    faqs: displayFAQsInTable,
    verificationRequests: renderVerificationRequestsTable,
    notifications: renderNotificationsTable,
    ledger: renderLedgerTable,
    balances: renderBalancesTable,
    withdrawals: renderWithdrawalsTable,
    transfers: renderTransfersTable,
  };
  return renderers[section];
}

// ── Update Pagination Controls ──
function updatePaginationControls(section, currentPage, totalPages, totalItems) {
    const control = document.querySelector(`.${section}-pagination`);
    if (!control) return;
    
    const prevBtn = control.querySelector('.prev-page-btn');
    const nextBtn = control.querySelector('.next-page-btn');
    const pageInfo = control.querySelector('.page-info');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.dataset.page = currentPage - 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.dataset.page = currentPage + 1;
    }
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalItems} items)`;
    }
}

// ── Store All Data for Client-Side Pagination ──
function storeTableData(section, allData) {
    tableState[section].allData = allData;
    tableState[section].filteredData = []; // Reset filters
    tableState[section].page = 1;
    renderTablePage(section, 1);
}

// ═════════════════════════════════════════════════════════════════
// FILTER SYSTEM
// ═════════════════════════════════════════════════════════════════

function initFilterListeners() {
    // Users filter
    const usersFilterForm = document.getElementById('usersFilterForm');
    if (usersFilterForm) {
        usersFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyUsersFilter();
        });
    }
    
    // Fundraisers filter
    const fundraisersFilterForm = document.getElementById('fundraisersFilterForm');
    if (fundraisersFilterForm) {
        fundraisersFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFundraisersFilter();
        });
    }
    
    // Forms filter
    const formsFilterForm = document.getElementById('formsFilterForm');
    if (formsFilterForm) {
        formsFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFormsFilter();
        });
    }
    
    // Requests filter
    const requestsFilterForm = document.getElementById('requestsFilterForm');
    if (requestsFilterForm) {
        requestsFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyRequestsFilter();
        });
    }
    
    // Invoices filter
    const invoicesFilterForm = document.getElementById('invoicesFilterForm');
    if (invoicesFilterForm) {
        invoicesFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyInvoicesFilter();
        });
    }
    
    // Complaints filter
    const complaintsFilterForm = document.getElementById('complaintsFilterForm');
    if (complaintsFilterForm) {
        complaintsFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyComplaintsFilter();
        });
    }
    // Verification requests filter
    const verificationRequestsFilterForm = document.getElementById('verificationRequestsFilterForm');
    if (verificationRequestsFilterForm) {
        verificationRequestsFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyVerificationRequestsFilter();
        });
    }
    // Notifications filter
    const notificationsFilterForm = document.getElementById('notificationsFilterForm');
    if (notificationsFilterForm) {
        notificationsFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyNotificationsFilter();
        });
    }
    // User ranks filter
    const userRanksFilterForm = document.getElementById('userRanksFilterForm');
    if (userRanksFilterForm) {
        userRanksFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyUserRanksFilter();
        });
    }

    // Ledger transactions filter
    const ledgerFilterForm = document.getElementById('ledgerFilterForm');
    if (ledgerFilterForm) {
        ledgerFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyLedgerFilter();
        });
    }
    
    // Fundraiser balances filter
    const balancesFilterForm = document.getElementById('balancesFilterForm');
    if (balancesFilterForm) {
        balancesFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyBalancesFilter();
        });
    }
    
    // Withdraw requests filter
    const withdrawalsFilterForm = document.getElementById('withdrawalsFilterForm');
    if (withdrawalsFilterForm) {
        withdrawalsFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyWithdrawalsFilter();
        });
    }
    
    // Transfer logs filter
    const transfersFilterForm = document.getElementById('transfersFilterForm');
    if (transfersFilterForm) {
        transfersFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyTransfersFilter();
        });
    }
}

// ── Users Filter ──
function applyUsersFilter() {
    const form = document.getElementById('usersFilterForm');
    const formData = new FormData(form);
    
    const userTypes = formData.getAll('user_type[]');
    const statuses = formData.getAll('status[]');
    const search = formData.get('search')?.toLowerCase() || '';
    
    ['requester', 'donor', 'charity'].forEach(section => {
        const allData = tableState[section].allData;
        
        let filtered = allData.filter(user => {
            // Type filter
            if (userTypes.length > 0) {
                const userType = (user.user_type || user.userType || '').toLowerCase();
                const matchesType = userTypes.some(type => userType.includes(type.toLowerCase()));
                if (!matchesType) return false;
            }
            
            // Status filter
            if (statuses.length > 0) {
                const isBanned = user.is_banned || user.isBanned || false;
                const isVerified = user.is_verified || user.isVerified || false;
                
                const matchesStatus = statuses.some(status => {
                    if (status === 'banned') return isBanned;
                    if (status === 'verified') return isVerified && !isBanned;
                    if (status === 'unverified') return !isVerified && !isBanned;
                    if (status === 'active') return !isBanned;
                    return false;
                });
                if (!matchesStatus) return false;
            }
            
            // Search filter
            if (search) {
                const fullName = (user.full_name || user.fullName || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                if (!fullName.includes(search) && !email.includes(search)) return false;
            }
            
            return true;
        });
        
        tableState[section].filteredData = filtered;
        tableState[section].page = 1;
        renderTablePage(section, 1);
    });
}

function resetUsersFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('usersFilterForm');
    if (form) form.reset();
    
    ['requester', 'donor', 'charity'].forEach(section => {
        tableState[section].filteredData = [];
        tableState[section].page = 1;
        renderTablePage(section, 1);
    });
}

// ── Fundraisers Filter ──
function applyFundraisersFilter() {
    const form = document.getElementById('fundraisersFilterForm');
    const formData = new FormData(form);
    
    const statuses = formData.getAll('status[]');
    const types = formData.getAll('type[]');
    const urgentOnly = formData.get('urgent');
    const search = formData.get('search')?.toLowerCase() || '';
    
    const allData = tableState.fundraisers.allData;
    
    let filtered = allData.filter(fundraiser => {
        if (statuses.length > 0 && !statuses.includes(fundraiser.status)) return false;
        if (types.length > 0 && !types.includes(fundraiser.type)) return false;
        if (urgentOnly && !fundraiser.is_urgent) return false;
        if (search) {
            const title = (fundraiser.title || '').toLowerCase();
            const userId = String(fundraiser.user_id || '');
            if (!title.includes(search) && !userId.includes(search)) return false;
        }
        return true;
    });
    
    tableState.fundraisers.filteredData = filtered;
    tableState.fundraisers.page = 1;
    renderTablePage('fundraisers', 1);
}

function resetFundraisersFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('fundraisersFilterForm');
    if (form) form.reset();
    tableState.fundraisers.filteredData = [];
    tableState.fundraisers.page = 1;
    renderTablePage('fundraisers', 1);
}

// ── Forms Filter ──
function applyFormsFilter() {
    const form = document.getElementById('formsFilterForm');
    const formData = new FormData(form);
    
    const fundraiserId = formData.get('fundraiser_id');
    const userId = formData.get('user_id');
    
    const allData = tableState.forms.allData;
    
    let filtered = allData.filter(form => {
        if (fundraiserId && String(form.fundraiser_id) !== String(fundraiserId)) return false;
        if (userId && String(form.user_id) !== String(userId)) return false;
        return true;
    });
    
    tableState.forms.filteredData = filtered;
    tableState.forms.page = 1;
    renderTablePage('forms', 1);
}

function resetFormsFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('formsFilterForm');
    if (form) form.reset();
    tableState.forms.filteredData = [];
    tableState.forms.page = 1;
    renderTablePage('forms', 1);
}

// ── Requests Filter ──
function applyRequestsFilter() {
    const form = document.getElementById('requestsFilterForm');
    const formData = new FormData(form);
    
    const statuses = formData.getAll('status[]');
    const fundraiserId = formData.get('fundraiser_id');
    
    const allData = tableState.requests.allData;
    
    let filtered = allData.filter(req => {
        if (statuses.length > 0 && !statuses.includes(req.request_status)) return false;
        if (fundraiserId && String(req.fundraiser_id) !== String(fundraiserId)) return false;
        return true;
    });
    
    tableState.requests.filteredData = filtered;
    tableState.requests.page = 1;
    renderTablePage('requests', 1);
}

function resetRequestsFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('requestsFilterForm');
    if (form) form.reset();
    tableState.requests.filteredData = [];
    tableState.requests.page = 1;
    renderTablePage('requests', 1);
}

// ── Invoices Filter ──
function applyInvoicesFilter() {
    const form = document.getElementById('invoicesFilterForm');
    const formData = new FormData(form);
    
    const statuses = formData.getAll('status[]');
    const paymentProviders = formData.getAll('payment_provider[]');
    const search = formData.get('search')?.toLowerCase() || '';
    
    const allData = tableState.invoices.allData;
    
    let filtered = allData.filter(invoice => {
        if (statuses.length > 0 && !statuses.includes(invoice.status)) return false;
        if (paymentProviders.length > 0 && !paymentProviders.includes(invoice.payment_provider)) return false;
        if (search) {
            const donorName = (invoice.donor_name || '').toLowerCase();
            const fundraiserTitle = (invoice.fundraiser_title || '').toLowerCase();
            if (!donorName.includes(search) && !fundraiserTitle.includes(search)) return false;
        }
        return true;
    });
    
    tableState.invoices.filteredData = filtered;
    tableState.invoices.page = 1;
    renderTablePage('invoices', 1);
}

function resetInvoicesFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('invoicesFilterForm');
    if (form) form.reset();
    tableState.invoices.filteredData = [];
    tableState.invoices.page = 1;
    renderTablePage('invoices', 1);
}

// ── Complaints Filter ──
function applyComplaintsFilter() {
    const form = document.getElementById('complaintsFilterForm');
    const formData = new FormData(form);
    
    const statuses = formData.getAll('status[]');
    const search = formData.get('search')?.toLowerCase() || '';
    
    const allData = tableState.complaints.allData;
    
    let filtered = allData.filter(complaint => {
        if (statuses.length > 0 && !statuses.includes(complaint.status)) return false;
        if (search) {
            const userName = (complaint.user_full_name || '').toLowerCase();
            const userEmail = (complaint.user_email || '').toLowerCase();
            const content = (complaint.complaint_content || '').toLowerCase();
            if (!userName.includes(search) && !userEmail.includes(search) && !content.includes(search)) return false;
        }
        return true;
    });
    
    tableState.complaints.filteredData = filtered;
    tableState.complaints.page = 1;
    renderTablePage('complaints', 1);
}

function resetComplaintsFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('complaintsFilterForm');
    if (form) form.reset();
    tableState.complaints.filteredData = [];
    tableState.complaints.page = 1;
    renderTablePage('complaints', 1);
}

// ── Notifications Filter ──
function applyNotificationsFilter() {
    const form = document.getElementById('notificationsFilterForm');
    const formData = new FormData(form);
    
    const types = formData.getAll('type[]');
    const isReadStatuses = formData.getAll('is_read[]');
    const senderTypes = formData.getAll('sender_type[]');
    const search = formData.get('search')?.toLowerCase() || '';
    
    const allData = tableState.notifications.allData;
    
    let filtered = allData.filter(n => {
        if (types.length > 0 && !types.includes(n.type)) return false;
        if (isReadStatuses.length > 0) {
            const readVal = n.is_read ? 'true' : 'false';
            if (!isReadStatuses.includes(readVal)) return false;
        }
        if (senderTypes.length > 0 && !senderTypes.includes(n.sender_type)) return false;
        if (search) {
            const title = (n.title || '').toLowerCase();
            const message = (n.message || '').toLowerCase();
            const userId = String(n.user_id || '');
            if (!title.includes(search) && !message.includes(search) && !userId.includes(search)) return false;
        }
        return true;
    });
    
    tableState.notifications.filteredData = filtered;
    tableState.notifications.page = 1;
    renderTablePage('notifications', 1);
}

function resetNotificationsFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('notificationsFilterForm');
    if (form) form.reset();
    tableState.notifications.filteredData = [];
    tableState.notifications.page = 1;
    renderTablePage('notifications', 1);
}

// ── User Ranks Filter ──
function applyUserRanksFilter() {
    const form = document.getElementById('userRanksFilterForm');
    const formData = new FormData(form);
    
    const minPoints = parseInt(formData.get('min_points')) || 0;
    const maxPoints = parseInt(formData.get('max_points')) || Infinity;
    const hasRanks = formData.getAll('has_rank[]');
    const search = formData.get('search')?.toLowerCase() || '';
    
    const allData = tableState.userRanks.allData;
    
    let filtered = allData.filter(ur => {
        const points = ur.userPoints || 0;
        if (points < minPoints || points > maxPoints) return false;
        
        if (hasRanks.length > 0) {
            const hasRank = ur.currentRankId ? 'true' : 'false';
            if (!hasRanks.includes(hasRank)) return false;
        }
        
        if (search) {
            const fullName = (ur.fullName || '').toLowerCase();
            const userId = String(ur.userId || '');
            if (!fullName.includes(search) && !userId.includes(search)) return false;
        }
        return true;
    });
    
    tableState.userRanks.filteredData = filtered;
    tableState.userRanks.page = 1;
    renderTablePage('userRanks', 1);
}

function resetUserRanksFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('userRanksFilterForm');
    if (form) form.reset();
    tableState.userRanks.filteredData = [];
    tableState.userRanks.page = 1;
    renderTablePage('userRanks', 1);
}


//____________________________________________________________________________________________________
// 🔹 اختيار الفورم
const bannerForm = document.querySelector(".add-event-box");
const bannersList = document.getElementById("bannersList");

// 🔹 تحميل جميع البنرات وعرضها في الجدول مع نظام التحديد
let selectedBannersCount = 0;

async function loadBanners() {
  try {
    // Fetch all banners with selection status
    const res = await fetch("/api/admin/banners/all");
    const result = await res.json();
    
    const banners = result.data || [];
    selectedBannersCount = banners.filter(b => b.selected_for_home).length;
    
    bannersList.innerHTML = "";

    banners.forEach(banner => {
      const isSelected = banner.selected_for_home;
      const canSelect = !isSelected && selectedBannersCount < 4;
      
      const row = `
        <tr data-banner-id="${banner.id}">
          <td>${banner.id}</td>
          <td><img src="/uploadsBanares/${banner.image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png"}" width="50"></td>
          <td>${banner.title}</td>
          <td>${banner.description}</td>
          <td>${banner.keyword || '-'}</td>
          <td>${banner.region}</td>
          <td>${banner.date ? new Date(banner.date).toLocaleDateString('en-GB') : 'N/A'}</td>
          <td class="td-btn">
            <button 
              onclick="toggleBannerSelection(${banner.id}, ${!isSelected})" 
              class="btn-website ${isSelected ? 'unselect-btn' : 'select-btn'}"
              ${!isSelected && !canSelect ? 'disabled' : ''}
              title="${isSelected ? 'Remove from home page' : (canSelect ? 'Show on home page' : 'Max 4 selected')}"
            >
              ${isSelected ? '✅ Selected' : (canSelect ? '⬜ Select' : '⛔ Full')}
            </button>
          </td>
          <td>
            <button onclick="deleteBanner('${banner.id}')" class="btn-website btn-delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
              </svg>
            </button>
          </td>
        </tr>
      `;
      bannersList.innerHTML += row;
    });
  } catch (err) {
    console.error("Error loading the Events", err);
  }
}

// 🔹 تبديل حالة اختيار البنر للصفحة الرئيسية
async function toggleBannerSelection(bannerId, select) {
  try {
    const res = await fetch(`/api/admin/banners/${bannerId}/select`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected: select })
    });

    const result = await res.json();

    if (result.success) {
      showFlashMessage(
        select ? 'Banner selected for home page!' : 'Banner removed from home page', 
        'success'
      );
      loadBanners(); // Refresh table
    } else {
      showFlashMessage(result.message || 'Failed to update selection', 'error');
    }
  } catch (err) {
    console.error("Error toggling banner selection:", err);
    showFlashMessage('Error updating banner selection', 'error');
  }
}

// 🔹 إنشاء Banner جديد
bannerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(bannerForm);

  try {
    const res = await fetch("/banners/create", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Failed to create event");

    const data = await res.json();
    alert(data.message || "Event created successfully");

    bannerForm.reset(); // إعادة ضبط الفورم
    loadBanners();      // تحديث الجدول تلقائيًا
  } catch (err) {
    showFlashMessage("An error occurred while creating the event");
  }
});

// 🔹 حذف Banner
async function deleteBanner(id) {
  if (!await showFlashConfirm('Are you sure you deleted this event?','error')) return;

  try {
    const res = await fetch(`/banners/delete/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("فشل الحذف");

    const data = await res.json();
    alert(data.message || "تم حذف البنر ✅");
    loadBanners(); // تحديث الجدول بعد الحذف
  } catch (err) {
    console.error("خطأ عند الحذف:", err);
    show("حدث خطأ أثناء الحذف ❌");
  }
}

// 🔹 تحميل البنرات عند فتح الصفحة
loadBanners();

// ── Notification Modal Functions ─────────────────────────────────────────────
function openNotificationModal(userId, userName) {
  document.getElementById('notificationRecipientId').value = userId;
  document.querySelector('#notificationRecipientName strong').textContent = userName;
  document.getElementById('notificationModal').style.display = 'block';
}

function closeNotificationModal() {
  document.getElementById('notificationModal').style.display = 'none';
  document.getElementById('sendNotificationForm').reset();
}

// ── Send Notification from Admin ─────────────────────────────────────────────
document.getElementById('sendNotificationForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const userId = document.getElementById('notificationRecipientId').value;
  const title = document.getElementById('notificationTitle').value;
  const message = document.getElementById('notificationMessage').value;
  const type = document.getElementById('notificationType').value;

  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds: [parseInt(userId)],
        title: title,
        message: message,
        type: type
        // sender_id and sender_type are handled server-side from req.user
      })
    });

    const result = await response.json();

    if (result.success) {
      showFlashMessage('Notification sent successfully!', 'success');
      closeNotificationModal();
      loadNotificationsTable(); // Refresh notifications table
    } else {
      throw new Error(result.message || 'Failed to send notification');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    showFlashMessage('Error sending notification: ' + error.message, 'error');
  }
});

// ── Load Notifications Table ─────────────────────────────────────────────────
async function loadNotificationsTable() {
    try {
        const response = await fetch('/api/admin/notifications/all');
        const result = await response.json();
        
        if (result.success && result.data) {
            storeTableData('notifications', result.data);
            document.getElementById('notifications-count').textContent = result.data.length;
        } else {
            storeTableData('notifications', []);
            document.getElementById('notifications-count').textContent = 0;
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        storeTableData('notifications', []);
    }
}

// ── Render Notifications Table ───────────────────────────────────────────────
function renderNotificationsTable(notifications) {
  const tbody = document.getElementById('notificationsTableBody');
  if (!tbody) return;
  
  if (!notifications || notifications.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="no-data">No notifications found</td></tr>';
    return;
  }
  
  tbody.innerHTML = notifications.map(n => `
    <tr data-notification-id="${n.id}">
      <td>${n.id}</td>
      <td>${n.user_id}</td>
      <td>${n.sender_id}</td>
      <td><span class="status-badge status-${n.sender_type || 'user'}">${n.sender_type || 'user'}</span></td>
      <td>${n.fundraiser_id || 'N/A'}</td>
      <td>${escapeHtml(n.title)}</td>
      <td>${escapeHtml(n.message && n.message.length > 50 ? n.message.substring(0, 50) + '...' : n.message)}</td>
      <td><span class="faq-type-badge ${n.type}">${n.type}</span></td>
      <td>${n.is_read ? '✅' : '❌'}</td>
      <td>${n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
      <td class="td-btn">
        <button class="btn-website delete-btn" onclick="deleteAdminNotification(${n.id})" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// ── Delete Notification (Admin) ──────────────────────────────────────────────
async function deleteAdminNotification(notificationId) {
  if (!await showFlashConfirm('Are you sure you want to delete this notification?', 'error')) {
    return;
  }

  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (result.success) {
      const row = document.querySelector(`tr[data-notification-id="${notificationId}"]`);
      if (row) {
        row.style.backgroundColor = '#ffebee';
        setTimeout(() => row.remove(), 500);
      }
      showFlashMessage('Notification deleted successfully!', 'success');
      loadNotificationsTable();
    } else {
      throw new Error(result.message || 'Failed to delete notification');
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    showFlashMessage('Error deleting notification: ' + error.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEDGER TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadLedgerTable() {
    try {
        const response = await fetch('/api/ledger-transactions', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        const result = await response.json();
        storeTableData('ledger', result.success ? result.data : []);
    } catch (error) {
        console.error('Error loading ledger transactions:', error);
        storeTableData('ledger', []);
    }
}

function renderLedgerTable(transactions) {
    const tbody = document.getElementById('ledgerTableBody');
    if (!tbody) return;
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data">No ledger transactions found</td></tr>';
        return;
    }
    tbody.innerHTML = transactions.map(t => `
        <tr data-ledger-id="${t.id}">
            <td>${t.id}</td>
            <td>${t.fundraiser_id}</td>
            <td>${t.user_id}</td>
            <td><span class="status-badge status-${t.type}">${t.type}</span></td>
            <td>$${t.amount}</td>
            <td>${t.currency}</td>
            <td>${t.reference_type}</td>
            <td>${t.reference_id}</td>
            <td>${escapeHtml(t.description || '').substring(0, 80)}${(t.description || '').length > 80 ? '...' : ''}</td>
            <td>${t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
        </tr>
    `).join('');
}

function applyLedgerFilter() {
    const form = document.getElementById('ledgerFilterForm');
    const formData = new FormData(form);
    const types = formData.getAll('type[]');
    const referenceTypes = formData.getAll('reference_type[]');
    const search = formData.get('search')?.toLowerCase() || '';

    const allData = tableState.ledger.allData;
    let filtered = allData.filter(t => {
        if (types.length > 0 && !types.includes(t.type)) return false;
        if (referenceTypes.length > 0 && !referenceTypes.includes(t.reference_type)) return false;
        if (search) {
            const desc = (t.description || '').toLowerCase();
            if (!desc.includes(search) && String(t.id) !== search && String(t.reference_id) !== search) return false;
        }
        return true;
    });

    tableState.ledger.filteredData = filtered;
    tableState.ledger.page = 1;
    renderTablePage('ledger', 1);
}

function resetLedgerFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('ledgerFilterForm');
    if (form) form.reset();
    tableState.ledger.filteredData = [];
    tableState.ledger.page = 1;
    renderTablePage('ledger', 1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNDRAISER BALANCES
// ═══════════════════════════════════════════════════════════════════════════════

async function loadBalancesTable() {
    try {
        const response = await fetch('/api/fundraiser-balances', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        const result = await response.json();
        storeTableData('balances', result.success ? result.data : []);
    } catch (error) {
        console.error('Error loading fundraiser balances:', error);
        storeTableData('balances', []);
    }
}

function renderBalancesTable(balances) {
    const tbody = document.getElementById('balancesTableBody');
    if (!tbody) return;
    if (!balances || balances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No fundraiser balances found</td></tr>';
        return;
    }
    tbody.innerHTML = balances.map(b => `
        <tr data-balance-fundraiser-id="${b.fundraiser_id}">
            <td>${b.fundraiser_id}</td>
            <td>$${b.total_balance}</td>
            <td>$${b.available_balance}</td>
            <td>$${b.pending_withdrawal_balance}</td>
            <td>$${b.total_withdrawn}</td>
            <td>${b.total_donors}</td>
            <td>$${b.total_fees}</td>
            <td>${b.last_donation_at ? new Date(b.last_donation_at).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td>${b.updated_at ? new Date(b.updated_at).toLocaleDateString('en-GB') : 'N/A'}</td>
        </tr>
    `).join('');
}

function applyBalancesFilter() {
    const form = document.getElementById('balancesFilterForm');
    const formData = new FormData(form);
    const minAvailable = parseFloat(formData.get('min_available')) || 0;
    const maxAvailable = parseFloat(formData.get('max_available')) || Infinity;
    const hasPending = formData.getAll('has_pending[]');
    const search = formData.get('search')?.toLowerCase() || '';

    const allData = tableState.balances.allData;
    let filtered = allData.filter(b => {
        const avail = parseFloat(b.available_balance) || 0;
        if (avail < minAvailable || avail > maxAvailable) return false;
        if (hasPending.length > 0) {
            const pending = parseFloat(b.pending_withdrawal_balance) || 0;
            const hasPendingBool = pending > 0;
            const match = hasPending.includes(hasPendingBool ? 'true' : 'false');
            if (!match) return false;
        }
        if (search && String(b.fundraiser_id) !== search) return false;
        return true;
    });

    tableState.balances.filteredData = filtered;
    tableState.balances.page = 1;
    renderTablePage('balances', 1);
}

function resetBalancesFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('balancesFilterForm');
    if (form) form.reset();
    tableState.balances.filteredData = [];
    tableState.balances.page = 1;
    renderTablePage('balances', 1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAW REQUESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadWithdrawalsTable() {
    try {
        const response = await fetch('/api/withdraw-requests', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        const result = await response.json();
        storeTableData('withdrawals', result.success ? result.data : []);
    } catch (error) {
        console.error('Error loading withdraw requests:', error);
        storeTableData('withdrawals', []);
    }
}

function renderWithdrawalsTable(requests) {
    const tbody = document.getElementById('withdrawalsTableBody');
    if (!tbody) return;
    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No withdraw requests found</td></tr>';
        return;
    }
    tbody.innerHTML = requests.map(wr => {
        // Determine which buttons to show based on status
        let actionButtons = '';
        if (wr.status === 'pending') {
            actionButtons = `
                <button class="btn-website approve-btn" onclick="approveWithdrawRequest(${wr.id})" title="Approve">✓ Approve</button>
                <button class="btn-website reject-btn" onclick="rejectWithdrawRequest(${wr.id})" title="Reject">✗ Reject</button>
            `;
        } else if (wr.status === 'approved') {
            // NEW: Open transfer modal with all request details
            const detailsJson = JSON.stringify(wr.withdrawal_details || {}).replace(/"/g, '&quot;');
            actionButtons = `
                <button class="btn-website execute-btn" onclick="openTransferModal(${wr.id}, ${parseFloat(wr.amount)}, '${wr.withdrawal_method}', ${detailsJson}, ${wr.fundraiser_id}, ${wr.user_id})" title="Execute Transfer">⚡ Execute Transfer</button>
            `;
        } else if (wr.status === 'processing') {
            actionButtons = `
                <span class="status-badge status-processing">Processing</span>
            `;
        } else if (wr.status === 'completed') {
            actionButtons = `
                <span class="status-badge status-completed">Completed</span>
            `;
        } else if (wr.status === 'rejected') {
            actionButtons = `
                <span class="status-badge status-rejected">Rejected</span>
            `;
        } else {
            actionButtons = '<span class="no-action">-</span>';
        }

        // Mask sensitive details
        let detailsPreview = '-';
        if (wr.withdrawal_details) {
            const masked = maskWithdrawalDetails(wr.withdrawal_details, wr.withdrawal_method);
            detailsPreview = Object.entries(masked).map(([k, v]) => `${k}: ${v}`).join(', ');
        }

        return `
        <tr data-withdrawal-id="${wr.id}">
            <td>${wr.id}</td>
            <td>${wr.fundraiser_id}</td>
            <td>${wr.user_id}${wr.user_name ? ` (${wr.user_name})` : ''}</td>
            <td>$${wr.amount}</td>
            <td>${wr.withdrawal_method}</td>
            <td>${escapeHtml(detailsPreview)}</td>
            <td><span class="status-badge status-${wr.status}">${wr.status}</span></td>
            <td>${wr.notes ? escapeHtml(wr.notes).substring(0, 50) : '-'}</td>
            <td>${wr.admin_notes ? escapeHtml(wr.admin_notes).substring(0, 50) : '-'}</td>
            <td>${wr.reviewer_name || (wr.reviewed_by || '-')}</td>
            <td>${wr.reviewed_at ? new Date(wr.reviewed_at).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td>${wr.created_at ? new Date(wr.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td class="td-btn">${actionButtons}</td>
        </tr>
    `}).join('');
}

function maskWithdrawalDetails(details, method) {
    if (!details || typeof details !== 'object') return {};
    const masked = { ...details };
    switch (method) {
        case 'bank_transfer':
            if (masked.account_number) masked.account_number = '****' + String(masked.account_number).slice(-4);
            if (masked.iban) masked.iban = String(masked.iban).substring(0, 8) + '****' + String(masked.iban).slice(-4);
            break;
        case 'paypal':
            if (masked.paypal_email) {
                const email = String(masked.paypal_email);
                const atIndex = email.indexOf('@');
                masked.paypal_email = email.substring(0, 2) + '***@' + email.substring(atIndex + 1);
            }
            break;
        case 'palpay':
            if (masked.mobile_number) masked.mobile_number = '****' + String(masked.mobile_number).slice(-4);
            break;
        case 'stripe':
            if (masked.stripe_account_id) masked.stripe_account_id = String(masked.stripe_account_id).substring(0, 8) + '...';
            break;
    }
    return masked;
}

async function approveWithdrawRequest(id) {
    if (!await showFlashConfirm('Approve this withdraw request? Funds will be reserved.', 'warning')) return;
    try {
        const response = await fetch(`/api/withdraw-requests/${id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        const result = await response.json();
        if (result.success) {
            showFlashMessage('Withdraw request approved!', 'success');
            loadWithdrawalsTable();
            loadBalancesTable(); // Refresh balances
            loadLedgerTable();   // Refresh ledger
        } else {
            showFlashMessage(result.message || 'Error approving request', 'error');
        }
    } catch (error) {
        console.error('Error approving withdraw request:', error);
        showFlashMessage('Error: ' + error.message, 'error');
    }
}

async function rejectWithdrawRequest(id) {
    const reason = await showFlashPrompt('Enter rejection reason (optional):', '');
    if (reason === null) return; // Cancelled
    
    if (!await showFlashConfirm('Reject this withdraw request?', 'error')) return;
    
    try {
        const response = await fetch(`/api/withdraw-requests/${id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason || undefined }),
            credentials: 'same-origin'
        });
        const result = await response.json();
        if (result.success) {
            showFlashMessage('Withdraw request rejected.', 'success');
            loadWithdrawalsTable();
        } else {
            showFlashMessage(result.message || 'Error rejecting request', 'error');
        }
    } catch (error) {
        console.error('Error rejecting withdraw request:', error);
        showFlashMessage('Error: ' + error.message, 'error');
    }
}

// DEPRECATED: Use openTransferModal instead for approved requests
async function executeTransfer(id) {
    // This function is now a fallback - the new modal handles this
    // Find the request data and open modal
    const allData = tableState.withdrawals.allData;
    const request = allData.find(r => r.id === id);
    if (request && request.status === 'approved') {
        openTransferModal(
            request.id, 
            parseFloat(request.amount), 
            request.withdrawal_method, 
            request.withdrawal_details, 
            request.fundraiser_id, 
            request.user_id
        );
    } else {
        showFlashMessage('Request must be approved before executing transfer', 'warning');
    }
}

async function retryTransfer(id) {
    if (!await showFlashConfirm('Retry this failed transfer?', 'warning')) return;
    try {
        const response = await fetch(`/api/withdraw-requests/${id}/retry-transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        const result = await response.json();
        if (result.success) {
            showFlashMessage('Transfer retry initiated!', 'success');
            loadWithdrawalsTable();
            loadTransfersTable();
        } else {
            showFlashMessage(result.message || 'Error retrying transfer', 'error');
        }
    } catch (error) {
        console.error('Error retrying transfer:', error);
        showFlashMessage('Error: ' + error.message, 'error');
    }
}

async function completeTransfer(id) {
    const providerTxId = await showFlashPrompt('Enter provider transaction ID (optional):', '');
    if (providerTxId === null) return; // Cancelled
    
    if (!await showFlashConfirm('Mark this transfer as complete?', 'warning')) return;
    
    try {
        const response = await fetch(`/api/withdraw-requests/${id}/complete-transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider_transfer_id: providerTxId || undefined }),
            credentials: 'same-origin'
        });
        const result = await response.json();
        if (result.success) {
            showFlashMessage('Transfer completed successfully!', 'success');
            loadWithdrawalsTable();
            loadTransfersTable();
            loadBalancesTable();
            loadLedgerTable();
        } else {
            showFlashMessage(result.message || 'Error completing transfer', 'error');
        }
    } catch (error) {
        console.error('Error completing transfer:', error);
        showFlashMessage('Error: ' + error.message, 'error');
    }
}

function applyWithdrawalsFilter() {
    const form = document.getElementById('withdrawalsFilterForm');
    const formData = new FormData(form);
    const statuses = formData.getAll('status[]');
    const methods = formData.getAll('method[]');
    const search = formData.get('search')?.toLowerCase() || '';

    const allData = tableState.withdrawals.allData;
    let filtered = allData.filter(wr => {
        if (statuses.length > 0 && !statuses.includes(wr.status)) return false;
        if (methods.length > 0 && !methods.includes(wr.withdrawal_method)) return false;
        if (search) {
            const userStr = String(wr.user_id || '');
            const fundStr = String(wr.fundraiser_id || '');
            if (!userStr.includes(search) && !fundStr.includes(search)) return false;
        }
        return true;
    });

    tableState.withdrawals.filteredData = filtered;
    tableState.withdrawals.page = 1;
    renderTablePage('withdrawals', 1);
}

function resetWithdrawalsFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('withdrawalsFilterForm');
    if (form) form.reset();
    tableState.withdrawals.filteredData = [];
    tableState.withdrawals.page = 1;
    renderTablePage('withdrawals', 1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFER LOGS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadTransfersTable() {
    try {
        const response = await fetch('/api/transfer-logs', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        const result = await response.json();
        storeTableData('transfers', result.success ? result.data : []);
    } catch (error) {
        console.error('Error loading transfer logs:', error);
        storeTableData('transfers', []);
    }
}

function renderTransfersTable(transfers) {
    const tbody = document.getElementById('transfersTableBody');
    if (!tbody) return;
    if (!transfers || transfers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="no-data">No transfer logs found</td></tr>';
        return;
    }
    tbody.innerHTML = transfers.map(tl => `
        <tr data-transfer-id="${tl.id}">
            <td>${tl.id}</td>
            <td>${tl.withdraw_request_id}</td>
            <td>${tl.fundraiser_id}</td>
            <td>${tl.user_id}${tl.user_name ? ` (${tl.user_name})` : ''}</td>
            <td>$${tl.amount}</td>
            <td>$${tl.fee}</td>
            <td>$${tl.net_amount}</td>
            <td>${tl.transfer_provider}</td>
            <td>${tl.provider_transfer_id || 'N/A'}</td>
            <td><span class="status-badge status-${tl.status}">${tl.status}</span></td>
            <td>${tl.transferred_at ? new Date(tl.transferred_at).toLocaleDateString('en-GB') : 'N/A'}</td>
            <td>${tl.created_at ? new Date(tl.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
        </tr>
    `).join('');
}

function applyTransfersFilter() {
    const form = document.getElementById('transfersFilterForm');
    const formData = new FormData(form);
    const statuses = formData.getAll('status[]');
    const providers = formData.getAll('provider[]');
    const search = formData.get('search')?.toLowerCase() || '';

    const allData = tableState.transfers.allData;
    let filtered = allData.filter(tl => {
        if (statuses.length > 0 && !statuses.includes(tl.status)) return false;
        if (providers.length > 0 && !providers.includes(tl.transfer_provider)) return false;
        if (search) {
            const providerTx = (tl.provider_transfer_id || '').toLowerCase();
            const fundId = String(tl.fundraiser_id || '');
            if (!providerTx.includes(search) && !fundId.includes(search)) return false;
        }
        return true;
    });

    tableState.transfers.filteredData = filtered;
    tableState.transfers.page = 1;
    renderTablePage('transfers', 1);
}

function resetTransfersFilter(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('transfersFilterForm');
    if (form) form.reset();
    tableState.transfers.filteredData = [];
    tableState.transfers.page = 1;
    renderTablePage('transfers', 1);
}


// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFER EXECUTION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

let currentTransferData = null;
let currentTransferStep = 1;

function openTransferModal(withdrawalId, amount, requestMethod, details, fundraiserId, userId, fee, netAmount) {
  currentTransferData = {
    withdrawalId: withdrawalId,
    amount: amount,
    requestMethod: requestMethod,     // Method user requested (for display only)
    transferMethod: requestMethod,    // Method admin will actually use (starts same, can change)
    details: details,
    fundraiserId: fundraiserId,
    userId: userId,
    fee: fee || (amount * 0.03).toFixed(2),
    netAmount: netAmount || (amount * 0.97).toFixed(2)
  };
  currentTransferStep = 1;

  // Populate modal info
  document.getElementById('transferWithdrawId').textContent = '#' + withdrawalId;
  document.getElementById('transferAmount').textContent = '$' + parseFloat(amount).toFixed(2);
  document.getElementById('transferFee').textContent = '$' + parseFloat(currentTransferData.fee).toFixed(2);
  document.getElementById('transferNetAmount').textContent = '$' + parseFloat(currentTransferData.netAmount).toFixed(2);
  
  // Show user's requested method
  document.getElementById('transferMethod').innerHTML = `
    <span style="color: #6b7280;">User requested:</span> 
    <strong>${requestMethod.toUpperCase()}</strong>
  `;

  // Populate recipient details (from user's withdrawal request)
  const container = document.getElementById('recipientDetailsContainer');
  let html = '';
  
  if (details) {
    html += `<div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #d1d5db;">
      <strong style="color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">User's Account (${requestMethod.toUpperCase()})</strong>
    </div>`;
    
    switch(requestMethod) {
      case 'stripe':
        html += `
          <div style="margin-bottom: 12px;"><strong style="color: #374151; font-size: 13px;">Stripe Account ID:</strong><div style="font-family: monospace; background: #fff; padding: 8px; border-radius: 4px; margin-top: 4px; font-size: 13px; word-break: break-all;">${escapeHtml(details.stripe_account_id || 'N/A')}</div></div>
        `;
        break;
      case 'bank_transfer':
        html += `
          <div style="margin-bottom: 12px;"><strong style="color: #374151; font-size: 13px;">Account Holder:</strong><div style="font-size: 13px; margin-top: 4px;">${escapeHtml(details.account_holder_name || 'N/A')}</div></div>
          <div style="margin-bottom: 12px;"><strong style="color: #374151; font-size: 13px;">Account Number:</strong><div style="font-family: monospace; background: #fff; padding: 8px; border-radius: 4px; margin-top: 4px; font-size: 13px;">${escapeHtml(details.account_number || 'N/A')}</div></div>
          <div style="margin-bottom: 12px;"><strong style="color: #374151; font-size: 13px;">IBAN:</strong><div style="font-family: monospace; background: #fff; padding: 8px; border-radius: 4px; margin-top: 4px; font-size: 13px; word-break: break-all;">${escapeHtml(details.iban || 'N/A')}</div></div>
        `;
        break;
      case 'paypal':
        html += `
          <div style="margin-bottom: 12px;"><strong style="color: #374151; font-size: 13px;">PayPal Email:</strong><div style="font-size: 13px; margin-top: 4px;">${escapeHtml(details.paypal_email || 'N/A')}</div></div>
        `;
        break;
      case 'palpay':
        html += `
          <div style="margin-bottom: 12px;"><strong style="color: #374151; font-size: 13px;">Mobile Number:</strong><div style="font-family: monospace; background: #fff; padding: 8px; border-radius: 4px; margin-top: 4px; font-size: 13px;">${escapeHtml(details.mobile_number || 'N/A')}</div></div>
        `;
        break;
      default:
        html += '<p style="color: #6b7280; font-size: 13px;">No details available</p>';
    }
  } else {
    html += '<p style="color: #6b7280; font-size: 13px;">No withdrawal details provided</p>';
  }
  container.innerHTML = html;

  // Reset UI
  document.getElementById('transferError').style.display = 'none';
  document.getElementById('transferSuccess').style.display = 'none';
  document.getElementById('transferNote').value = '';
  
  // Reset method selector
  document.querySelectorAll('.transfer-method-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.method === requestMethod) {
      tab.classList.add('active');
    }
  });
  
  // Show correct platform form based on selected method
  updatePlatformFormVisibility(requestMethod);

  // Show modal
  document.getElementById('transferModal').style.display = 'flex';
  transferGoToStep(1);
}

function updatePlatformFormVisibility(method) {
  currentTransferData.transferMethod = method;
  
  document.getElementById('platformStripe').style.display = method === 'stripe' ? 'block' : 'none';
  document.getElementById('platformBank').style.display = method === 'bank_transfer' ? 'block' : 'none';
  document.getElementById('platformPaypal').style.display = method === 'paypal' ? 'block' : 'none';
  document.getElementById('platformPalpay').style.display = method === 'palpay' ? 'block' : 'none';
  
  // Update tab styling
  document.querySelectorAll('.transfer-method-tab').forEach(tab => {
    if (tab.dataset.method === method) {
      tab.classList.add('active');
      tab.style.background = '#ff9a17';
      tab.style.color = '#fff';
      tab.style.borderColor = '#ff9a17';
    } else {
      tab.classList.remove('active');
      tab.style.background = '#f3f4f6';
      tab.style.color = '#374151';
      tab.style.borderColor = '#d1d5db';
    }
  });
}

function closeTransferModal() {
  document.getElementById('transferModal').style.display = 'none';
  currentTransferData = null;
  currentTransferStep = 1;
}

function transferGoToStep(step) {
  currentTransferStep = step;
  
  document.getElementById('transferStep1').style.display = step === 1 ? 'block' : 'none';
  document.getElementById('transferStep2').style.display = step === 2 ? 'block' : 'none';
  
  document.getElementById('transferModalStep').textContent = `Step ${step} of 2`;
  
  document.getElementById('transferNextBtn').style.display = step === 1 ? 'inline-block' : 'none';
  document.getElementById('transferBackBtn').style.display = step === 2 ? 'inline-block' : 'none';
  document.getElementById('transferExecuteBtn').style.display = step === 2 ? 'inline-block' : 'none';
  document.getElementById('transferCancelBtn').style.display = 'inline-block';
  
  document.getElementById('transferError').style.display = 'none';
}

async function executeTransferFromModal() {
  if (!currentTransferData) return;
  
  const btn = document.getElementById('transferExecuteBtn');
  const text = document.getElementById('transferExecuteText');
  const loading = document.getElementById('transferExecuteLoading');
  const errorDiv = document.getElementById('transferError');
  const successDiv = document.getElementById('transferSuccess');
  
  // Show loading
  btn.disabled = true;
  text.style.display = 'none';
  loading.style.display = 'inline';
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  try {
    // Get platform account info based on SELECTED transfer method (not request method)
    let platformInfo = {};
    const transferMethod = currentTransferData.transferMethod;
    
    switch(transferMethod) {
      case 'stripe':
        platformInfo = {
          stripe_account_id: document.getElementById('platformStripeAccountId').value.trim(),
          stripe_key: document.getElementById('platformStripeKey').value.trim() || undefined,
          recipient_account_id: document.getElementById('recipientStripeAccountId').value.trim() || undefined
        };
        if (!platformInfo.stripe_account_id) {
          throw new Error('Your Platform Stripe Account ID is required');
        }
        break;
      case 'bank_transfer':
        platformInfo = {
          account_number: document.getElementById('platformBankAccount').value.trim(),
          bank_name: document.getElementById('platformBankName').value.trim(),
          iban: document.getElementById('platformBankIban').value.trim()
        };
        break;
      case 'paypal':
        platformInfo = {
          paypal_email: document.getElementById('platformPaypalEmail').value.trim(),
          recipient_email: document.getElementById('recipientPaypalEmail').value.trim() || undefined
        };
        break;
      case 'palpay':
        platformInfo = {
          mobile_number: document.getElementById('platformPalpayMobile').value.trim(),
          recipient_mobile: document.getElementById('recipientPalpayMobile').value.trim() || undefined
        };
        break;
    }

    const note = document.getElementById('transferNote').value.trim();

    // Step 1: Create the transfer log (execute-transfer endpoint)
    const executeResponse = await fetch(`/api/withdraw-requests/${currentTransferData.withdrawalId}/execute-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        platform_info: platformInfo,
        note: note,
        transfer_method: transferMethod  // <-- Admin-chosen method, not user's method
      })
    });

    const executeResult = await executeResponse.json();

    if (!executeResult.success) {
      throw new Error(executeResult.message || 'Failed to initiate transfer');
    }

    // For non-Stripe methods (manual), show success immediately
    if (transferMethod !== 'stripe') {
      successDiv.innerHTML = `
        ✅ Transfer recorded successfully!<br>
        <strong>Method:</strong> ${transferMethod.toUpperCase()}<br>
        <strong>Note:</strong> Please complete this transfer manually through your ${transferMethod.toUpperCase()} portal.<br>
        <strong>Transfer ID:</strong> ${executeResult.data?.transfer_id || 'N/A'}
      `;
      successDiv.style.display = 'block';
      
      // Hide action buttons, show close
      document.getElementById('transferNextBtn').style.display = 'none';
      document.getElementById('transferBackBtn').style.display = 'none';
      document.getElementById('transferExecuteBtn').style.display = 'none';
      document.getElementById('transferCancelBtn').textContent = 'Close';
      
      // Refresh tables
      loadWithdrawalsTable();
      loadTransfersTable();
      loadBalancesTable();
      loadLedgerTable();
      return;
    }

    // For Stripe: Step 2 - Complete the transfer
    const completeResponse = await fetch(`/api/withdraw-requests/${currentTransferData.withdrawalId}/complete-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        provider_transfer_id: executeResult.data?.stripe_transfer?.id || executeResult.data?.transfer_id
      })
    });

    const completeResult = await completeResponse.json();

    if (!completeResult.success) {
      throw new Error(completeResult.message || 'Failed to complete transfer');
    }

    // Success for Stripe!
    successDiv.innerHTML = `
      ✅ Transfer completed successfully!<br>
      <strong>Stripe Transfer ID:</strong> ${executeResult.data?.stripe_transfer?.id || 'N/A'}<br>
      <strong>Amount:</strong> $${parseFloat(currentTransferData.netAmount).toFixed(2)}
    `;
    successDiv.style.display = 'block';
    
    // Hide action buttons, show close
    document.getElementById('transferNextBtn').style.display = 'none';
    document.getElementById('transferBackBtn').style.display = 'none';
    document.getElementById('transferExecuteBtn').style.display = 'none';
    document.getElementById('transferCancelBtn').textContent = 'Close';
    
    // Refresh tables
    loadWithdrawalsTable();
    loadTransfersTable();
    loadBalancesTable();
    loadLedgerTable();

  } catch (error) {
    console.error('Transfer execution error:', error);
    errorDiv.textContent = '❌ ' + error.message;
    errorDiv.style.display = 'block';
    
    // Refresh to show current status
    loadWithdrawalsTable();
    loadTransfersTable();
  } finally {
    btn.disabled = false;
    text.style.display = 'inline';
    loading.style.display = 'none';
  }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('transferModal').style.display === 'flex') {
    closeTransferModal();
  }
});

// Close modal on backdrop click
document.getElementById('transferModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('transferModal')) {
    closeTransferModal();
  }
});