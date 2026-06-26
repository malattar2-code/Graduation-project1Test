// Get all link items
const linkItems = document.querySelectorAll('.links li');

// Define the mapping between menu items and their corresponding content sections
const contentMap = [
  { menuClass: 'link-content-one', contentClass: 'users-dashboard-sec' },
  { menuClass: 'link-content-two', contentClass: 'fundraisers-dashboard-sec' },
  { menuClass: 'link-content-three', contentClass: 'categories-dashboard-sec' },
  { menuClass: 'link-content-four', contentClass: 'statistics-dashboard-sec' },
  { menuClass: 'link-content-five', contentClass: 'reports-dashboard-sec' },
  { menuClass: 'link-content-six', contentClass: 'balances-dashboard-sec' },
  { menuClass: 'link-content-seven', contentClass: 'ranks-and-rewards-sec' },
  { menuClass: 'link-content-eight', contentClass: 'admin-settings-sec' },
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
        Math.max(d.donors, d.requesters)
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

        // Month label
        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = data.month;

        // Append bars to container
        barsContainer.appendChild(donorBar);
        barsContainer.appendChild(requesterBar);
        monthGroup.appendChild(barsContainer);
        monthGroup.appendChild(monthLabel);
        chartUsers.appendChild(monthGroup);
    });
}

// Fallback function in case API fails
function renderFallbackChart() {
    const fallbackData = [
        { month: 'Aug 2025', donors: 0, requesters: 0 },
        { month: 'Sep 2025', donors: 0, requesters: 0 },
        { month: 'Oct 2025', donors: 0, requesters: 0 },
        { month: 'Nov 2025', donors: 0, requesters: 0 },
        { month: 'Dec 2025', donors: 0, requesters: 0 },
        { month: 'Jan 2026', donors: 0, requesters: 0 },
        { month: 'Feb 2026', donors: 0, requesters: 0 },
        { month: 'Mar 2026', donors: 0, requesters: 0 },
        { month: 'Apr 2026', donors: 0, requesters: 0 },
        { month: 'May 2026', donors: 0, requesters: 0 },
        { month: 'Jun 2026', donors: 0, requesters: 0 },
        { month: 'Jul 2026', donors: 0, requesters: 0 },
        { month: 'Aug 2026', donors: 0, requesters: 0 }
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
//__________________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
      // Sample data - replace with your actual numbers
      const totalDonors = 750;
      const totalNeedy = 250;
      const totalUsers = totalDonors + totalNeedy;
      
      const ctxUsers = document.getElementById('userChart').getContext('2d');
      
      new Chart(ctxUsers, {
        type: 'doughnut',
        data: {
          labels: ['Donors', 'Indigents'],
          datasets: [{
            data: [
              Math.round((totalDonors/totalUsers)*100),
              Math.round((totalNeedy/totalUsers)*100)
            ],
            backgroundColor: ['#ff9a17', '#14213d'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw;
                  const count = label === 'Donors' ? totalDonors : totalNeedy;
                  return `${label}: ${value}% (${count} users)`;
                }
              }
            }
          },
          cutout: '70%'
        }
      });
    });

//__________________________________________________________________________________________

//__________________________________________________________________________________________
document.addEventListener('DOMContentLoaded', function() {
      // Sample data - replace with your actual numbers
      const totalCompleted = 250;
      const totalUncompleted = 750;
      const totalFundraisers = totalCompleted + totalUncompleted;
      
      const ctxFundraisers = document.getElementById('fundraisersChart').getContext('2d');
      
      new Chart(ctxFundraisers, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Uncompleted'],
          datasets: [{
            data: [
              Math.round((totalCompleted/totalFundraisers)*100),
              Math.round((totalUncompleted/totalFundraisers)*100)
            ],
            backgroundColor: ['#ff9a17', '#14213d'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw;
                  const count = label === 'Completed' ? totalCompleted : totalUncompleted;
                  return `${label}: ${value}% (${count} Fundraiser)`;
                }
              }
            }
          },
          cutout: '70%'
        }
      });
    });

//__________________________________________________________________________________________

//_________________________________________________________________________________________________________________
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
            alert('Please select a valid image file');
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
            alert('Upload failed: ' + error.message);
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
            alert('Category name is required!');
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
                alert('Category added successfully!');
                form.reset();
                resetImageInput();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add category: ' + error.message);
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
            alert('Please fill in both question and answer fields');
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
                alert('FAQ added successfully!');
                faqForm.reset();
                // Optional: Refresh FAQ list
                loadFAQs();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add FAQ. Please try again.');
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
            displayFAQsInTable(result.data);
        } else {
            throw new Error(result.message || 'Failed to load FAQs');
        }
    } catch (error) {
        console.error('Error loading FAQs:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-text">Error loading FAQs. Please try again later.</td>
            </tr>
        `;
    }
}

function displayFAQsInTable(faqs) {
    const tableBody = document.getElementById('faqTableBody');
    
    if (!faqs || faqs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-text">No FAQs found.</td>
            </tr>
        `;
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
      alert('Rank added successfully!');
      this.reset();
      // Reset image previews if you have them
      resetImagePreviews();
    } else {
      throw new Error(result.message || 'Unknown error occurred');
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error adding rank: ' + error.message);
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
        
        // Update percentages
        document.getElementById('completedFundraisersValue').textContent = stats.completedPercentage + '%';
        document.getElementById('incompletedFundraisersValue').textContent = stats.incompletedPercentage + '%';
        
        // Update progress bars
        document.getElementById('completedFundraisersbar').style.width = stats.completedPercentage + '%';
        document.getElementById('incompletedFundraisersbar').style.width = stats.incompletedPercentage + '%';
        
    } catch (error) {
        console.error('Error updating fundraiser stats:', error);
    }
}

// Update stats every 30 seconds for real-time feel
setInterval(updateFundraiserStats, 30000);

// Initial update
document.addEventListener('DOMContentLoaded', updateFundraiserStats);

//____________________________________________________________________________________________________
// Function to delete a fundraiser
async function deleteFundraiser(fundraiserId) {
    if (!confirm('Are you sure you want to delete this fundraiser? This action cannot be undone.')) {
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
            // Remove the row from the table
            const row = document.querySelector(`tr[data-fundraiser-id="${fundraiserId}"]`);
            if (row) {
                row.remove();
            }
            
            // Show success message
            alert('Fundraiser deleted successfully!');
            // Refresh the page to update statistics
            location.reload();
        } else {
            const error = await response.json();
            alert('Error deleting fundraiser: ' + error.message);
        }
    } catch (error) {
        console.error('Error deleting fundraiser:', error);
        alert('Error deleting fundraiser. Please try again.');
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
            
            alert('"trend" category added successfully!');
        } else {
            const error = await response.json();
            alert('Error adding trend category: ' + error.message);
        }
    } catch (error) {
        console.error('Error adding trend category:', error);
        alert('Error adding trend category. Please try again.');
    }
}

// Function to format currency
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toLocaleString();
}

// Function to remove "trend" category from a fundraiser
async function removeTrendCategory(fundraiserId) {
    if (!confirm('Are you sure you want to remove the "trend" category from this fundraiser?')) {
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
            
            alert('"trend" category removed successfully!');
        } else {
            const error = await response.json();
            alert('Error removing trend category: ' + error.message);
        }
    } catch (error) {
        console.error('Error removing trend category:', error);
        alert('Error removing trend category. Please try again.');
    }
}
//__________________________________________________________________________________________
// Function to delete a category
// Function to delete a category
async function deleteCategory(categoryId, categoryName) {
    // Show enhanced confirmation message
    const confirmationMessage = `Are you sure you want to delete the category "${categoryName}"?\n\nThis will:\n• Permanently delete the category\n• Remove this category from any fundraisers using it\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmationMessage)) {
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

// Optional: Add a function to show a more detailed confirmation modal
function showDeleteConfirmationModal(categoryId, categoryName, fundraisersCount = 0) {
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
    return confirm(`Delete category "${categoryName}"?${fundraisersCount > 0 ? ` This will affect ${fundraisersCount} fundraiser(s).` : ''}`);
}// Function to delete a category
async function deleteCategory(categoryId, categoryName) {
    // Show enhanced confirmation message
    const confirmationMessage = `Are you sure you want to delete the category "${categoryName}"?\n\nThis will:\n• Permanently delete the category\n• Remove this category from any fundraisers using it\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmationMessage)) {
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

// Optional: Add a function to show a more detailed confirmation modal
function showDeleteConfirmationModal(categoryId, categoryName, fundraisersCount = 0) {
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
    return confirm(`Delete category "${categoryName}"?${fundraisersCount > 0 ? ` This will affect ${fundraisersCount} fundraiser(s).` : ''}`);
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
    if (!confirm('Are you sure you want to mark this complaint as resolved?')) {
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
    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
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

    if (result.success) {
      displayInvoices(result.data);
    } else {
      console.error('❌ Failed to load invoices:', result.error);
      alert('Failed to load invoices: ' + result.error);
    }
  } catch (error) {
    console.error('💥 Error loading invoices:', error);
    alert('Error loading invoices: ' + error.message);
  }
}

// Display invoices in the table
function displayInvoices(invoices) {
  const tbody = document.getElementById('invoicesTableBody');
  
  if (invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align: center;">No invoices found</td></tr>';
    return;
  }

  tbody.innerHTML = invoices.map(invoice => `
    <tr data-invoice-id="${invoice.id}">
      <td>${invoice.invoice_id || 'N/A'}</td>
      <td>${invoice.donor_id || 'N/A'}</td>
      <td>${invoice.donor_name || 'N/A'}</td>
      <td>${invoice.fundraiser_id || 'N/A'}</td>
      <td>${invoice.fundraiser_title || 'N/A'}</td>
      <td>${invoice.amount || '0.00'}</td>
      <td>${invoice.currency || 'N/A'}</td>
      <td>
        <span class="status-badge status-${invoice.status}">
          ${invoice.status || 'N/A'}
        </span>
      </td>
      <td>${invoice.payment_method || 'N/A'}</td>
      <td>${invoice.stripe_payment_id || 'N/A'}</td>
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

// Delete invoice function
async function deleteInvoice(invoiceId) {
  if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
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
      alert('Invoice deleted successfully!');
    } else {
      console.error('❌ Failed to delete invoice:', result.error);
      alert('Failed to delete invoice: ' + result.error);
    }
  } catch (error) {
    console.error('💥 Error deleting invoice:', error);
    alert('Error deleting invoice: ' + error.message);
  }
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
    const reason = prompt('Enter block reason (optional):') || 'Manual block by administrator';
    
    if (reason === null) return; // User cancelled
    
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
            
            alert('Fundraiser blocked successfully!');
        } else {
            const error = await response.json();
            alert('Error blocking fundraiser: ' + error.error);
        }
    } catch (error) {
        console.error('Error blocking fundraiser:', error);
        alert('Error blocking fundraiser. Please try again.');
    }
}

// 🔓 Unblock fundraiser
async function unblockFundraiser(fundraiserId) {
    if (!confirm('Are you sure you want to unblock this fundraiser?')) {
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
            
            alert('Fundraiser unblocked successfully!');
        } else {
            const error = await response.json();
            alert('Error unblocking fundraiser: ' + error.error);
        }
    } catch (error) {
        console.error('Error unblocking fundraiser:', error);
        alert('Error unblocking fundraiser. Please try again.');
    }
}

//____________________________________________________________________________________________________________

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

//________________________________________________________________________________________________

const allowedTypes = ["superadmin"];
const userType = sessionStorage.getItem("userType");

if (!userType) {
  window.location.href = "/register";
} else if (!allowedTypes.includes(userType)) {
  window.location.href = "/";
  alert("🚫 لا تملك صلاحية الوصول لهذه الصفحة");
}

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

//_________________________________________________________________________________________________________
// Get chart data from data attributes
function getFundraisersDataMonthly() {
  const chartDataElement = document.getElementById('chart-data');
  if (!chartDataElement) {
      console.log('⚠️ No chart data element found');
      return null;
  }
  
  try {
      const dataJson = chartDataElement.dataset.fundraisersMonthly;
      return dataJson ? JSON.parse(dataJson) : null;
  } catch (error) {
      console.error('Error parsing chart data:', error);
      return null;
  }
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing admin panel charts...');
  
  // Get chart data from data attributes
  const fundraisersDataMonthly = getFundraisersDataMonthly();
  const chartFundraisers = document.getElementById('chart-fundraisers');
  
  if (!chartFundraisers) {
      console.error('Chart element not found');
      return;
  }
  
  // Create chart with the data
  if (fundraisersDataMonthly && fundraisersDataMonthly.length > 0) {
      createFundraisersChart(fundraisersDataMonthly, chartFundraisers);
  } else {
      // Show message if no data
      chartFundraisers.innerHTML = '<div class="no-data">No fundraiser data available</div>';
  }
});

// Chart creation function
function createFundraisersChart(fundraisersDataMonthly, chartElement) {
  console.log('📊 Creating fundraisers chart with data:', fundraisersDataMonthly);
  
  const maxValueFundraisers = Math.max(...fundraisersDataMonthly.map(d => Math.max(d.completed, d.incompleted))) * 1.1; // Add 10% padding

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

      // Month label
      const monthLabel = document.createElement('div');
      monthLabel.className = 'month-label';
      monthLabel.textContent = data.month;

      // Append bars to container
      barsContainer.appendChild(completedBar);
      barsContainer.appendChild(uncompletedBar);
      monthGroup.appendChild(barsContainer);
      monthGroup.appendChild(monthLabel);
      chartElement.appendChild(monthGroup);
  });
}