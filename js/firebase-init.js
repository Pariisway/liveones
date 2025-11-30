// Firebase Initialization - MUST BE LOADED FIRST
const firebaseConfig = {
    apiKey: "AIzaSyBU2tbinWSOw-N8ce6zMQ9AMKXt-5fj23g",
    authDomain: "house-of-whispers.firebaseapp.com",
    projectId: "house-of-whispers",
    storageBucket: "house-of-whispers.firebasestorage.app",
    messagingSenderId: "1063333130646",
    appId: "1:1063333130646:web:9f0d6ddc2927692aaaadb7",
    measurementId: "G-06QR5LFKJ9"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} else {
    console.log('✅ Firebase already initialized');
}

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log('✅ Firebase services loaded');
