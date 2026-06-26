// 🟢 دالة لتعبئة جدول الطلبات المكتملة
async function loadCompleteRequests() {
    try {
        const res = await fetch("/requests/completed");
        const data = await res.json();

        const tbody = document.getElementById("complete-tbody");
        tbody.innerHTML = "";

        console.log('🔍 Complete requests data received:', data);
        
        data.requests.forEach((req, index) => {
            // UPDATED: Use userImage from the request data
            const userImageSrc = `data:image/jpeg;base64,${req.userImage}`;
            console.log(`🖼️ Complete Request ${index} Image:`, userImageSrc.substring(0, 100) + '...');
            
            const row = `
        <tr>
          <td>${req.id}</td>
          <td class="td-img">
            <img src="${userImageSrc}" 
                 width="40" 
                 height="40" 
                 style="border-radius: 50%; object-fit: cover; border: 1px solid #ccc;"
                 alt="User Profile" 
                 onerror="this.onerror=null; this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'; console.log('❌ Image fallback triggered for request ${req.id}')"
                 onload="console.log('✅ Image loaded for request ${req.id}')">
          </td>
          <td>${req.description || "-"}</td>
          <td>${req.isDelivered ? "Yes" : "No"}</td>
          <td>${req.isPickedUp ? "Yes" : "No"}</td>
          <td>${req.location || "-"}</td>
          <td>${req.rating || 0}</td>
          <td>${req.type || "-"}</td>
          <td>${req.urgent ? "Yes" : "No"}</td>
          <td>${req.donorRating || 0} ⭐</td> 
        </tr>
      `;
            tbody.innerHTML += row;
        });
        
        console.log(`✅ Loaded ${data.requests.length} complete requests`);
    } catch (err) {
        console.error("خطأ في complete:", err);
    }
}

// 🟢 دالة لتعبئة جدول الطلبات غير المكتملة
async function loadIncompleteRequests() {
    try {
        const res = await fetch("/requests/incomplete");
        const data = await res.json();

        const tbody = document.getElementById("incomplete-tbody");
        tbody.innerHTML = "";

        console.log('🔍 Incomplete requests data received:', data);
        
        data.requests.forEach((req, index) => {
            // UPDATED: Use userImage from the request data
            const userImageSrc = `data:image/jpeg;base64,${req.userImage}`;
            console.log(`🖼️ Incomplete Request ${index} Image:`, userImageSrc.substring(0, 100) + '...');
            
            // 🔹 شرط عرض الزر المناسب حسب حالة activation
            let actionButton = "";
            if (req.activation === "active") {
                actionButton = `
                  <button onclick="updateActivation('${req.id}', 'unactivate')" class="btn-website btn-deactivate">Unactive</button>
                `;
            } else {
                actionButton = `
                  <button onclick="updateActivation('${req.id}', 'activate')" class="btn-website btn-activate">Activate</button>
                `;
            }

            const row = `
        <tr>
          <td>${req.id}</td>
          <td class="td-img">
            <img src="${userImageSrc}" 
                 width="40" 
                 height="40" 
                 style="border-radius: 50%; object-fit: cover; border: 1px solid #ccc;"
                 alt="User Profile" 
                 onerror="this.onerror=null; this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'; console.log('❌ Image fallback triggered for request ${req.id}')"
                 onload="console.log('✅ Image loaded for request ${req.id}')">
          </td>
          <td>${req.description || "-"}</td>
          <td>${req.isDelivered ? "Yes" : "No"}</td>
          <td>${req.isPickedUp ? "Yes" : "No"}</td>
          <td>${req.location || "-"}</td>
          <td>${req.rating || 0}</td>
          <td>${req.type || "-"}</td>
          <td>${req.urgent ? "Yes" : "No"}</td>
          <td>${actionButton}</td>
        </tr>
      `;
            tbody.innerHTML += row;
        });
        
        console.log(`✅ Loaded ${data.requests.length} incomplete requests`);
    } catch (err) {
        console.error("خطأ في incomplete:", err);
    }
}

// 🟢 دالة لتعبئة جدول الطلبات قيد التنفيذ
async function loadInProgressRequests() {
    try {
        const res = await fetch("/requests/in-progress");
        const data = await res.json();

        const tbody = document.getElementById("inprogress-tbody");
        tbody.innerHTML = "";

        console.log('🔍 In-progress requests data received:', data);
        
        data.requests.forEach((req, index) => {
            // UPDATED: Use userImage from the request data
            const userImageSrc = req.userImage || '/assets/image/Fundraiser-Page/header-sec/man-profile.png';
            console.log(`🖼️ In Progress Request ${index} Image:`, userImageSrc.substring(0, 100) + '...');
            
            const row = `
        <tr>
          <td>${req.id}</td>
          <td class="td-img">
            <img src="${userImageSrc}" 
                 width="40" 
                 height="40" 
                 style="border-radius: 50%; object-fit: cover; border: 1px solid #ccc;"
                 alt="User Profile" 
                 onerror="this.onerror=null; this.src='/assets/image/Fundraiser-Page/header-sec/man-profile.png'; console.log('❌ Image fallback triggered for request ${req.id}')"
                 onload="console.log('✅ Image loaded for request ${req.id}')">
          </td>
          <td>${req.description || "-"}</td>
          <td>${req.isDelivered ? "Yes" : "No"}</td>
          <td>${req.isPickedUp ? "Yes" : "No"}</td>
          <td>${req.location || "-"}</td>
          <td>${req.rating || 0}</td>
          <td>${req.type || "-"}</td>
          <td>${req.urgent ? "Yes" : "No"}</td>
          <td>${req.donorRating || 0}</td>
          <td>
            <button onclick="resetStatus('${req.id}')" class="btn-website btn-reset">Set Pending</button>
          </td>
        </tr>
      `;
            tbody.innerHTML += row;
        });
        
        console.log(`✅ Loaded ${data.requests.length} in-progress requests`);
    } catch (err) {
        console.error("خطأ في inprogress:", err);
    }
}

// 🟢 تحديث التفعيل
async function updateActivation(id, action) {
    try {
        const res = await fetch(`/requests/${id}/${action}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        let data = {};
        try {
            data = await res.json();
        } catch (e) {
            console.warn("الرد ما فيه JSON، مكمل ✅");
        }

        alert(data.message || "تم تحديث التفعيل بنجاح ✅");
        window.location.href = "/admin";
    } catch (err) {
        console.error("خطأ:", err);
        alert("حدث خطأ أثناء التحديث ❌");
        console.log(err.message);
    }
}

// 🟢 إعادة الحالة من in-progress → pending
async function resetStatus(id) {
    try {
        const res = await fetch(`/requests/${id}/reset-status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        let data = {};
        try {
            data = await res.json();
        } catch (e) {
            console.warn("الرد ما فيه JSON، مكمل ✅");
        }

        alert(data.message || "تمت إعادة الحالة إلى Pending ✅");
        window.location.reload();
    } catch (err) {
        console.error("خطأ:", err);
        alert("حدث خطأ أثناء إعادة الحالة ❌");
    }
}

// 🟢 تشغيل عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    console.log('🚀 Loading requests tables...');
    loadIncompleteRequests();
    loadInProgressRequests();
    loadCompleteRequests();
    
    // Debug after tables load
    setTimeout(() => {
        debugTableImages();
    }, 3000);
});