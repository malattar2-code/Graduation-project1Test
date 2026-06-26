//firebase-client
const  { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const  { getFirestore } = require("firebase/firestore");
const { getMessaging, getToken, onMessage } = require("firebase/messaging");

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
const db = getFirestore(app);
// const messaging = getMessaging(app);
// // دالة جلب fcmToken بدون VAPID Key
// export const getFcmToken = async () => {
//   try {
//     const token = await getToken(messaging); // بدون VAPID Key
//     console.log("FCM Token:", token);
//     return token || null;
//   } catch (err) {
//     console.warn("FCM Token not available:", err);
//     return null;
//   }
// };

// onMessage(messaging, (payload) => {
//   console.log("Message received:", payload);
// });
module.exports = { auth, db, app };
