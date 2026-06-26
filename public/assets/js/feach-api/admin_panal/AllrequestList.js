
// 🟢 دالة لتعبئة جدول الطلبات المكتملة
async function loadCompleteRequests() {
    try {
        const res = await fetch("/requests/completed"); // 🔹 متصل بـ exports.completeRequest
        const data = await res.json();

        const tbody = document.getElementById("complete-tbody");
        tbody.innerHTML = "";

        data.requests.forEach(req => {
            const row = `
        <tr>
          <td>${req.id}</td>
          <td><img src="${req.image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png"}" width="40"></td>
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
    } catch (err) {
        console.error("خطأ في complete:", err);
    }
}

// 🟢 دالة لتعبئة جدول الطلبات غير المكتملة
async function loadIncompleteRequests() {
    try {
        const res = await fetch("/requests/incomplete"); // 🔹 متصل بـ exports.IncompleteRequest
        const data = await res.json();

        const tbody = document.getElementById("incomplete-tbody");
        tbody.innerHTML = "";

        data.requests.forEach(req => {
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
          <td><img src="${req.image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png"}" width="40"></td>
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
    } catch (err) {
        console.error("خطأ في incomplete:", err);
    }
}

// 🟢 دالة لتعبئة جدول الطلبات قيد التنفيذ
async function loadInProgressRequests() {
    try {
        const res = await fetch("/requests/in-progress"); // 🔹 متصل بـ exports.InProgresRequest
        const data = await res.json();

        const tbody = document.getElementById("inprogress-tbody");
        tbody.innerHTML = "";

        data.requests.forEach(req => {
            const row = `
        <tr>
          <td>${req.id}</td>
          <td><img src="${req.image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png"}" width="40"></td>
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

        // تحقق أن الرد ناجح
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        // حاول قراءة JSON إذا موجود
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
        window.location.reload;
    } catch (err) {
        console.error("خطأ:", err);
        alert("حدث خطأ أثناء إعادة الحالة ❌");
    }
}



// 🟢 تشغيل عند تحميل الصفحة
// 🟢 تشغيل عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    loadIncompleteRequests();
    loadInProgressRequests();
    loadCompleteRequests(); // 🔹 استدعاء الجديد
});

