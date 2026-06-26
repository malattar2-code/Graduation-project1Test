import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function requireAuthClient() {
  const auth = getAuth();

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // المستخدم غير مسجل دخول → إعادة توجيه للصفحة Login
      alert("⚠️ يجب تسجيل الدخول أولاً!");
      window.location.href = "/login"; // ضع مسار صفحة تسجيل الدخول
      return;
    }

    // المستخدم مسجل دخول → يمكن متابعة الصفحة
    console.log("✅ المستخدم مسجل دخول:", user.email);

    // حفظ الـ ID Token في sessionStorage لاستخدامه لاحقاً
    user.getIdToken().then((idToken) => {
      sessionStorage.setItem("idToken", idToken);
    });
  });
}
