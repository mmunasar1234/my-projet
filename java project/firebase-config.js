// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBKBcjwyfmFzP3QQ5mLrKR7jFJqSfDGaLQ",
    authDomain: "my-project1-7ff19.firebaseapp.com",
    projectId: "my-project1-7ff19",
    storageBucket: "my-project1-7ff19.firebasestorage.app",
    messagingSenderId: "1034599626108",
    appId: "1:1034599626108:web:d4d749edc1eb8bcdcea0f9",
    measurementId: "G-BE3D0JWWM2"
};

// Initialize Firebase (Compat)
// This file is loaded as a standard script, so 'firebase' global is available from the CDN scripts
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("Firebase Initialized ✅");