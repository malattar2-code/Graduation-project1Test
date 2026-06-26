// استيراد Firebase من CDN
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
  import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

  // إعدادات Firebase الخاصة فيك (من مشروعك)
  const firebaseConfig = {
  apiKey: "AIzaSyCBuNxXgjKIDyQ3rpJNvm4L1_FJVy8-7iU",
  authDomain: "najdah-17dba.firebaseapp.com",
  projectId: "najdah-17dba",
  storageBucket: "najdah-17dba.appspot.com",
  messagingSenderId: "255557910899",
  appId: "1:255557910899:web:cfbf98699d2bbd2f804506",
  measurementId: "G-MVXDB90JK4"
};

  // تهيئة Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn");

    if (!loginForm || !loginBtn) return;

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      loginBtn.disabled = true;
      loginBtn.textContent = "Logging in...";

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) {
        alert("❌ Please enter both email and password.");
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
        return;
      }

      try {
        // تسجيل الدخول بـ Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // جلب ID Token
        const idToken = await user.getIdToken();

        // إرسال التوكين للسيرفر
        const response = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken })
        });

        const data = await response.json();
        if (response.ok) {
          console.log("✅ Server Response:", data);
          alert("Login successful!");
          window.location.href = "/admin"; // غيّرها للمكان المناسب
        } else {
          alert("❌ Login failed: " + data.error);
        }
      } catch (err) {
        let errorMessage = "An unknown error occurred.";
        if (err.code) {
          switch (err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              errorMessage = "Invalid email or password.";
              break;
          }
        }
        alert(`❌ Error: ${errorMessage}`);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
      }
    });
  });