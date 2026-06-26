async function loadRequestsStatistics() {
  try {
    const response = await fetch('/requests'); // راوت findAllRequest
    if (!response.ok) throw new Error('فشل في جلب البيانات');

    const data = await response.json();

    // تحديث الأرقام داخل الـ HTML
    document.getElementById('all-fundraisers-count').textContent = data.total || 0;
    document.getElementById('completed-fundraisers-count').textContent = data.completed || 0;
    document.getElementById('incomplete-fundraisers-count').textContent = data.incomplete || 0;

  } catch (err) {
    console.error('خطأ:', err);
  }
}
async function loadProgressStatistics() {
  try {
    const response = await fetch('/requests'); // راوت findAllRequest
    if (!response.ok) throw new Error('فشل في جلب البيانات');

    const data = await response.json();

    // القيم المئوية
    const completedPercent = parseFloat(data.completedPercent) || 0;
    const incompletePercent = parseFloat(data.incompletePercent) || 0;

    // عرض النسبة كنص
    document.getElementById('completed-value').textContent = data.completedPercent;
    document.getElementById('incomplete-value').textContent = data.incompletePercent;

    // تحديث عرض progress bar
    document.getElementById('completed-bar').style.width = completedPercent + '%';
    document.getElementById('incomplete-bar').style.width = incompletePercent + '%';

  } catch (err) {
    console.error('خطأ في تحميل progress:', err);
  }
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
  loadRequestsStatistics();
  loadProgressStatistics();
});
