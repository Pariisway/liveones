// Simple Firebase Initialization
console.log("🚀 Loading Firebase...");

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

// Global promise that resolves when Firebase is ready
window.firebaseReady = new Promise((resolve, reject) => {
  // Load Firebase scripts synchronously
  const script1 = document.createElement('script');
  script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
  script1.onload = () => {
    console.log("✅ Firebase App loaded");
    
    const script2 = document.createElement('script');
    script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
    script2.onload = () => {
      console.log("✅ Firebase Database loaded");
      
      try {
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        
        // Store globally
        window.firebaseApp = app;
        window.firebaseDatabase = database;
        
        console.log("🎉 Firebase initialized successfully!");
        console.log("📊 Database:", database);
        
        // Resolve the promise
        resolve({ app, database });
        
        // Dispatch event for backward compatibility
        window.dispatchEvent(new CustomEvent('firebase-ready', {
          detail: { app, database }
        }));
        
      } catch (error) {
        console.error("❌ Firebase initialization error:", error);
        reject(error);
      }
    };
    
    script2.onerror = (error) => {
      console.error("❌ Failed to load Firebase Database:", error);
      reject(error);
    };
    
    document.head.appendChild(script2);
  };
  
  script1.onerror = (error) => {
    console.error("❌ Failed to load Firebase App:", error);
    reject(error);
  };
  
  document.head.appendChild(script1);
});

// Helper function to wait for Firebase
window.waitForFirebase = () => window.firebaseReady;

// Initialize immediately
console.log("⏳ Starting Firebase initialization...");
