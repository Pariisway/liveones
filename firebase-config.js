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
try {
  firebase.initializeApp(firebaseConfig);
} catch (error) {
  console.log("Firebase already initialized or error:", error);
}

// Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Export Firebase services
window.firebaseAuth = auth;
window.firebaseDatabase = database;
window.firebaseStorage = storage;
window.firebaseConfig = firebaseConfig;
