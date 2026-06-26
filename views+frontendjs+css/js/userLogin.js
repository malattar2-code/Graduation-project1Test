import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBuNxXgjKIDyQ3rpJNvm4L1_FJVy8-7iU",
  authDomain: "najdah-17dba.firebaseapp.com",
  projectId: "najdah-17dba",
  storageBucket: "najdah-17dba.appspot.com",
  messagingSenderId: "255557910899",
  appId: "1:255557910899:web:cfbf98699d2bbd2f804506",
  measurementId: "G-MVXDB90JK4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

//   document.getElementById("loginForm").addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const email = document.getElementById("loginEmail").value;
//     const password = document.getElementById("loginPassword").value;

//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       const idToken = await user.getIdToken();

//       // إرسال التوكن للسيرفر
//       const response = await fetch("http://localhost:3000/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ idToken }),
//       });

//       const data = await response.json();
//       console.log("Login response:", data);

//       if (response.ok) {
//         alert("✅ تم تسجيل الدخول بنجاح!");
//         window.location.href = "/admin"; // غيرها لصفحتك
//       } else {
//         alert("⚠️ فشل تسجيل الدخول: " + (data.error || "حاول مرة أخرى"));
//       }

//     } catch (err) {
//       console.error("Login error:", err.message);
//       alert("❌ خطأ في تسجيل الدخول: " + err.message);
//     }
//   });
/////////////////////////////////////////////////////////////////////
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // جلب الـ ID Token
    const idToken = await user.getIdToken();

    // حفظ الـ Token في sessionStorage (يتم حذفه عند غلق المتصفح)
    sessionStorage.setItem("idToken", idToken);

    // إرسال التوكن للسيرفر
    const response = await fetch("/user-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (response.ok) {
      localStorage.setItem("userId", user.uid);
      localStorage.setItem("userEmail", user.email);
      sessionStorage.setItem("idToken", idToken);
      sessionStorage.setItem("userType", data.userType);
      const userType = sessionStorage.getItem("userType");

      document.cookie = `token=${idToken}; path=/; secure; samesite=strict`;

      alert("✅ تم تسجيل الدخول بنجاح!");

      if (userType === "superadmin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/"
      }
      // غيرها لصفحتك
    } else {
      alert("⚠️ فشل تسجيل الدخول: " + (data.error || "حاول مرة أخرى"));
    }

  } catch (err) {
    console.error("Login error:", err.message);
    alert("❌ خطأ في تسجيل الدخول: ");
  }
});
async function submitRegistrationForm(formData) {
  try {
      const response = await fetch('/register', {
          method: 'POST',
          body: formData // This should include the image file
      });
      
      const result = await response.json();
      
      if (response.ok) {
          console.log('Registration successful');
          if (result.userImage) {
              console.log('User image uploaded:', result.userImage);
          }
          // Proceed to verification
      } else {
          console.error('Registration failed:', result.error);
      }
  } catch (error) {
      console.error('Error during registration:', error);
  }
}

// Frontend JavaScript for user registration (following categories pattern)

// Store the uploaded image URL