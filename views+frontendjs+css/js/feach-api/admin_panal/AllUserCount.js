// دالة لجلب عدد الـ Requesters (Fundraisers)
async function loadFundraisers() {
  try {
    const res = await fetch("/users/requesters");
    const data = await res.json();
    document.getElementById("fundraisersCount").textContent = data.count;
  } catch (err) {
    console.error("Error fetching requesters:", err);
  }
}

// دالة لجلب عدد الـ Donors
async function loadDonors() {
  try {
    const res = await fetch("/users/donors");
    const data = await res.json();
    document.getElementById("donorsCount").textContent = data.count;
  } catch (err) {
    console.error("Error fetching donors:", err);
  }
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener("DOMContentLoaded", () => {
  loadFundraisers();
  loadDonors();
});
