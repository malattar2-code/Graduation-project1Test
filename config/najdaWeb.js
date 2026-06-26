// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBuNxXgjKIDyQ3rpJNvm4L1_FJVy8-7iU",
  authDomain: "najdah-17dba.firebaseapp.com",
  projectId: "najdah-17dba",
  storageBucket: "najdah-17dba.firebasestorage.app",
  messagingSenderId: "255557910899",
  appId: "1:255557910899:web:cfbf98699d2bbd2f804506",
  measurementId: "G-MVXDB90JK4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
