// Get all link items
const linkItems = document.querySelectorAll('.links li');

// Define the mapping between menu items and their corresponding content sections
const contentMap = [
  { menuClass: 'link-content-one', contentClass: 'dashboard-sec' },
  { menuClass: 'link-content-two', contentClass: 'my-fundraisers-sec' },
  { menuClass: 'link-content-three', contentClass: 'add-fundraiser-sec' },
  { menuClass: 'link-content-four', contentClass: 'account-settings-sec' },
  { menuClass: 'link-content-five', contentClass: 'payment-methods-settings-sec' }
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
let visa_btn = document.querySelector(".visa-btn");
let mastercard_btn = document.querySelector(".mastercard-btn");
let paypal_btn = document.querySelector(".paypal-btn");
let googlepay_btn = document.querySelector(".googlepay-btn");
let payment_methods_boxes = document.querySelector(".payment-methods-boxes");
let triangle = document.querySelector(".triangle");
visa_btn.addEventListener("click", () => {
    triangle.style.top = "15px";
    payment_methods_boxes.style.setProperty('--before-top', '0px');
});

mastercard_btn.addEventListener("click", () => {
    triangle.style.top = "85px";
    payment_methods_boxes.style.setProperty('--before-top', '70px');
});

paypal_btn.addEventListener("click", () => {
    triangle.style.top = "155px";
    payment_methods_boxes.style.setProperty('--before-top', '140px');
});

googlepay_btn.addEventListener("click", () => {
    triangle.style.top = "225px";
    payment_methods_boxes.style.setProperty('--before-top', '210px');
});

//__________________________________________________________________________
let add_credit_card_box = document.querySelector(".add-credit-card-box");
let add_credit_card_btn = document.querySelector(".add-credit-card-btn");
let close_btn = document.querySelector(".close-btn");
let payment_two = document.querySelector(".payment-two");
add_credit_card_btn.addEventListener("click", () => {
  payment_two.style.display = "flex"
  add_credit_card_box.style.display = "none"
});
close_btn.addEventListener("click", () => {
  payment_two.style.display = "none"
  add_credit_card_box.style.display = "flex"
});
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
document.addEventListener('DOMContentLoaded', function() {
  // Default donation amounts for each day of the month (1-31)
  const defaultDonations = {
    1: 80,   2: 50,   3: 100,  4: 15,   5: 1,
    6: 90,   7: 120,  8: 75,   9: 60,   10: 110,
    11: 45,  12: 85,  13: 95,  14: 30,  15: 65,
    16: 40,  17: 55,  18: 70,  19: 25,  20: 80,
    21: 105, 22: 90,  23: 115, 24: 50,  25: 35,
    26: 75,  27: 60,  28: 95,  29: 40,  30: 85,
    31: 65   // For months with 31 days
  };

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
      donations[dateStr] = defaultDonations[day] || 0;
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
});

//______________________________________________________________________________________________
// Force animation restart on page load
        document.addEventListener('DOMContentLoaded', function() {
            const pie = document.querySelector('.pie');
            
            // Clone and replace to restart animations
            const newPie = pie.cloneNode(true);
            pie.parentNode.replaceChild(newPie, pie);
        });

//______________________________________________________________________________________________
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

function updateProgressBars(currentPoints) {
  const progressPercentage = getPercentageForPoints(currentPoints);
  
  // Reset the widths to 0 for new animation
  document.getElementById('rank-bar').style.width = '0%';
  document.getElementById('rank-value').textContent = '0';
  
  // Animate to new values
  setTimeout(() => {
    document.getElementById('rank-bar').style.width = progressPercentage + '%';
    animateValue(document.getElementById('rank-value'), 0, currentPoints, 1500);
  }, 300);
}

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

// Initial load with 1200 points
window.addEventListener('load', function() {
  updateProgressBars(7000);
});

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