// 🔹 اختيار الفورم
const bannerForm = document.querySelector(".add-event-box");
const bannersList = document.getElementById("bannersList");

// 🔹 تحميل جميع البنرات وعرضها في الجدول
async function loadBanners() {
  try {
    const res = await fetch("/banners"); // الراوت الخاص بالـ API
    const data = await res.json();

    bannersList.innerHTML = "";

    data.banners.forEach(banner => {
      const row = `
        <tr>
          <td>${banner.id}</td>
          <td><img src="/uploadsBanares/${banner.image || "/assets/image/Fundraiser-Page/header-sec/man-profile.png"}" width="50"></td>
          <td>${banner.title}</td>
          <td>${banner.description}</td>
          <td>${banner.region}</td>
          <td>${banner.date}</td>
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
    console.error("خطأ في تحميل البنرات:", err);
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

    if (!res.ok) throw new Error("فشل إنشاء البنر");

    const data = await res.json();
    alert(data.message || "تم إنشاء البنر بنجاح ✅");

    bannerForm.reset(); // إعادة ضبط الفورم
    loadBanners();      // تحديث الجدول تلقائيًا
  } catch (err) {
    console.error("خطأ عند الإنشاء:", err);
    alert("حدث خطأ أثناء إنشاء البنر ❌");
  }
});

// 🔹 حذف Banner
async function deleteBanner(id) {
  if (!confirm("هل أنت متأكد من حذف هذا البنر؟")) return;

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
    alert("حدث خطأ أثناء الحذف ❌");
  }
}

// 🔹 تحميل البنرات عند فتح الصفحة
loadBanners();
