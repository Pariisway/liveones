// Unified Firebase Initializer
console.log('🔥 Loading unified Firebase initializer');

window.firebaseInitialized = window.firebaseInitialized || false;

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyALbIJSI2C-p6IyMtj_F0ZqGyN1i79jOd4",
  authDomain: "whisper-chat-live.firebaseapp.com",
  databaseURL: "https://whisper-chat-live-default-rtdb.firebaseio.com",
  projectId: "whisper-chat-live",
  storageBucket: "whisper-chat-live.firebasestorage.app",
  messagingSenderId: "302894848452",
  appId: "1:302894848452:web:61a7ab21a269533c426c91"
};

function initializeFirebase() {
  if (window.firebaseInitialized) {
    console.log('Firebase already initialized');
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    try {
      if (typeof firebase === 'undefined') {
        reject(new Error('Firebase SDK not loaded'));
        return;
      }
      
      if (firebase.apps.length === 0) {
        firebase.initializeApp(FIREBASE_CONFIG);
        console.log('✅ Firebase app initialized');
      }
      
      window.firebaseInitialized = true;
      resolve();
      
    } catch (error) {
      console.error('Firebase initialization error:', error);
      reject(error);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
  setTimeout(initializeFirebase, 100);
}
