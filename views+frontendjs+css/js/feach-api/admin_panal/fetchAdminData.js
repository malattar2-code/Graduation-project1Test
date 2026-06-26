// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// async function fetchAdminData() {
//   const auth = getAuth();
//   const user = auth.currentUser;

//   if (!user) {
//     alert("⚠️ يجب تسجيل الدخول أولاً!");
//     window.location.href = "/login.html";
//     return;
//   }

//   const idToken = await user.getIdToken();

//   const response = await fetch("/api/admin/admin", {
//     method: "GET",
//     headers: {
//       "Authorization": `Bearer ${idToken}`
//     }
//   });

//   const data = await response.json();
//   console.log(data);

//   // هنا تقدر تعبئ البيانات في الصفحة مثلاً
//   // document.getElementById("donorsTableBody").innerHTML = ...
// }

// export { fetchAdminData };
