async function loadDonorsTable() {
  try {
    const res = await fetch("/users/donors");
    const data = await res.json();

    console.log('DEBUG - Donors API response:', data);

    const tbody = document.getElementById("donorsTableBody");
    tbody.innerHTML = "";

    data.users.forEach(user => {
      // UPDATED: Handle both userImage (URL) and photoBase64 (base64)
      let userImageSrc = '/assets/image/Fundraiser-Page/header-sec/man-profile.png'; // Default fallback
      
      if (user.photoBase64) {
        // Mobile app users: Use base64 image
        userImageSrc = `data:image/jpeg;base64,${user.photoBase64}`;
      } else if (user.userImage || user.user_image) {
        // Web users: Use regular image URL
        userImageSrc = user.userImage || user.user_image;
      }
      
      // Determine status badge - handle multiple possible field names
      let statusBadge = '';
      const isBanned = user.is_banned !== undefined ? user.is_banned : user.isBanned !== undefined ? user.isBanned :
                      user.banned !== undefined ? user.banned : false;
      const isVerified = user.isVerified !== undefined ? user.isVerified : 
                        user.is_verified !== undefined ? user.is_verified : false;

      if (isBanned) {
        statusBadge = '<span class="badge banned">🚫 Banned</span>';
      } else {
        statusBadge = '<span class="badge verified">✔️ Verified</span>';
      }

      const firebaseUid = user.firebase_uid || user.firebaseUid || user.uid || user.id;
      
      if (!firebaseUid) {
        console.error('User missing firebase_uid:', user);
        return; // Skip users without firebase_uid
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.id}</td>
        <td class="td-img">
          <img class="user-img" src="${userImageSrc}" alt="${user.fullName || user.full_name || 'User'}" 
               onerror="this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'">
        </td>
        <td>${user.fullName || user.full_name || ""}</td>
        <td>${user.email || ""}</td>
        <td>${isVerified ? "✔️" : "❌"}</td>
        <td>${statusBadge}</td>
        <td>${user.banReason || "User is Not Banned"}</td>
        <td>${user.location || ""}</td>
        <td>${user.userType || user.user_type || ""}</td>
        <td class="td-btn">
          ${isBanned ? 
            `<button onclick="unbanUser('${firebaseUid}')" class="btn-website unban-btn" title="Unban User">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M3.5 7.5a.5.5 0 0 1 0-1h9a.5.5 0 0 1 0 1z"/>
              </svg>
            </button>` :
            `<button onclick="banUser('${firebaseUid}')" class="btn-website ban-btn" title="Ban User">
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
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading donors:", err);
  }
}

async function loadRequesterUsers() {
  try {
    const res = await fetch("/users/requesters");
    const data = await res.json();

    console.log('DEBUG - Requesters API response:', data);

    const tbody = document.getElementById("requesterList");
    tbody.innerHTML = "";

    data.users.forEach(user => {
      // UPDATED: Handle both userImage (URL) and photoBase64 (base64)
      let userImageSrc = '/assets/image/Fundraiser-Page/header-sec/man-profile.png'; // Default fallback
      
      if (user.photoBase64) {
        // Mobile app users: Use base64 image
        userImageSrc = `data:image/jpeg;base64,${user.photoBase64}`;
      } else if (user.userImage || user.user_image) {
        // Web users: Use regular image URL
        userImageSrc = user.userImage || user.user_image;
      }

      // Determine status badge - handle multiple possible field names
      let statusBadge = '';
      const isBanned = user.is_banned !== undefined ? user.is_banned : user.isBanned !== undefined ? user.isBanned :
                      user.banned !== undefined ? user.banned : false;
      const isVerified = user.isVerified !== undefined ? user.isVerified : 
                        user.is_verified !== undefined ? user.is_verified : false;

      if (isBanned) {
        statusBadge = '<span class="badge banned">🚫 Banned</span>';
      } else {
        statusBadge = '<span class="badge verified">✔️ Verified</span>';
      }

      const firebaseUid = user.firebase_uid || user.firebaseUid || user.uid;
      
      if (!firebaseUid) {
        console.error('User missing firebase_uid:', user);
        return; // Skip users without firebase_uid
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.id}</td>
        <td class="td-img">
          <img class="user-img" src="${userImageSrc}" alt="${user.fullName || user.full_name || 'User'}" 
               onerror="this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'">
        </td>
        <td>${user.fullName || user.full_name || ""}</td>
        <td>${user.email || ""}</td>
        <td>${isVerified ? "✔️" : "❌"}</td>
        <td>${statusBadge}</td>
        <td>${user.banReason || "User is Not Banned"}</td>
        <td>${user.location || ""}</td>
        <td>${user.userType || user.user_type || ""}</td>
        <td class="td-btn">
          ${isBanned ? 
            `<button onclick="unbanUser('${firebaseUid}')" class="btn-website unban-btn" title="Unban User">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M3.5 7.5a.5.5 0 0 1 0-1h9a.5.5 0 0 1 0 1z"/>
              </svg>
            </button>` :
            `<button onclick="banUser('${firebaseUid}')" class="btn-website ban-btn" title="Ban User">
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
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading requesters:", err);
  }
}

// Helper function to get user image source (optional - for code reuse)
function getUserImageSource(user) {
  if (user.photoBase64) {
    return `data:image/jpeg;base64,${user.photoBase64}`;
  } else if (user.userImage || user.user_image) {
    return user.userImage || user.user_image;
  } else {
    return '/assets/image/Fundraiser-Page/header-sec/man-profile.png';
  }
}

// If you want to use the helper function, replace the image logic with:
// let userImageSrc = getUserImageSource(user);

// Improved ban/unban functions with better error handling
async function banUser(firebaseUid) {
  if (!confirm('Are you sure you want to ban this user?')) return;
  
  try {
    console.log(`🔄 Attempting to ban user: ${firebaseUid}`);
    
    const response = await fetch(`/users/${firebaseUid}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Manual ban by administrator' })
    });

    console.log('📨 Ban API response status:', response.status);
    
    // Check if response is JSON
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
      alert('User banned successfully');
      // Reload both tables
      await loadDonorsTable();
      await loadRequesterUsers();
    } else {
      alert(result.error || 'Error banning user');
    }
  } catch (error) {
    console.error('❌ Error banning user:', error);
    alert('Error banning user: ' + error.message);
  }
}

async function unbanUser(firebaseUid) {
  if (!confirm('Are you sure you want to unban this user?')) return;
  
  try {
    const response = await fetch(`/users/${firebaseUid}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert('User unbanned successfully');
      // Reload both tables
      await loadDonorsTable();
      await loadRequesterUsers();
    } else {
      alert(result.error || 'Error unbanning user');
    }
  } catch (error) {
    console.error('Error unbanning user:', error);
    alert('Error unbanning user: ' + error.message);
  }
}

// دالة حذف مستخدم
async function deleteUser(userId) {
  if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

  try {
    const response = await fetch(`/users/delete/${userId}`, { method: 'DELETE' });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    // إعادة تحميل الجداول أولاً
    await loadDonorsTable();
    await loadRequesterUsers();

    // ثم رسالة نجاح
    alert('تم حذف المستخدم بنجاح');
  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء حذف المستخدم: ' + err.message);
  }
}

// تحميل الجدولين عند فتح الصفحة
document.addEventListener("DOMContentLoaded", () => {
  loadDonorsTable();
  loadRequesterUsers();
});