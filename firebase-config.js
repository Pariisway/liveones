// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyALbIJSI2C-p6IyMtj_F0ZqGyN1i79jOd4",
  authDomain: "whisper-chat-live.firebaseapp.com",
  databaseURL: "https://whisper-chat-live-default-rtdb.firebaseio.com",
  projectId: "whisper-chat-live",
  storageBucket: "whisper-chat-live.firebasestorage.app",
  messagingSenderId: "302894848452",
  appId: "1:302894848452:web:61a7ab21a269533c426c91"
};

// Initialize Firebase
let firebaseApp, firebaseAuth, firebaseDatabase, firebaseStorage;

try {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  firebaseAuth = firebase.auth();
  firebaseDatabase = firebase.database();
  firebaseStorage = firebase.storage(); // Fixed: using firebase.storage() instead of firebase.storage
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  
  // If already initialized, get the existing app
  if (error.code === 'app/duplicate-app') {
    firebaseApp = firebase.app();
    firebaseAuth = firebase.auth();
    firebaseDatabase = firebase.database();
    firebaseStorage = firebase.storage();
  }
}

// Export Firebase services
window.firebaseApp = firebaseApp;
window.firebaseAuth = firebaseAuth;
window.firebaseDatabase = firebaseDatabase;
window.firebaseStorage = firebaseStorage;
window.firebaseConfig = firebaseConfig;
