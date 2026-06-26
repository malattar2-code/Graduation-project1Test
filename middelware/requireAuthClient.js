// requireAuthClient.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function requireAuthClient(redirectUrl = "/login.html") {
  const auth = getAuth();

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("⚠️ يجب تسجيل الدخول أولاً!");
      window.location.href = redirectUrl;
    }
  });
}
