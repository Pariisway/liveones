// Firebase Configuration - Universal Initialization
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBU2tbinWSOw-N8ce6zMQ9AMKXt-5fj23g",
    authDomain: "house-of-whispers.firebaseapp.com",
    projectId: "house-of-whispers",
    storageBucket: "house-of-whispers.firebasestorage.app",
    messagingSenderId: "1063333130646",
    appId: "1:1063333130646:web:9f0d6ddc2927692aaaadb7",
    measurementId: "G-06QR5LFKJ9"
};

// Global Firebase instances
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

// Initialize Firebase with error handling
function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
            console.log('✅ Firebase initialized successfully');
        } else {
            firebaseApp = firebase.app();
            console.log('✅ Firebase already initialized');
        }
        
        // Initialize services
        firebaseAuth = firebase.auth();
        firebaseDb = firebase.firestore();
        
        console.log('✅ Firebase Auth and Firestore initialized');
        return true;
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        return false;
    }
}

// Get Firebase Auth instance
function getAuth() {
    if (!firebaseAuth) {
        initializeFirebase();
    }
    return firebaseAuth;
}

// Get Firestore instance
function getFirestore() {
    if (!firebaseDb) {
        initializeFirebase();
    }
    return firebaseDb;
}

// Check if Firebase is ready
function isFirebaseReady() {
    return firebaseApp !== null && firebaseAuth !== null && firebaseDb !== null;
}

// Wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        const check = () => {
            if (isFirebaseReady()) {
                resolve(true);
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
}

// Initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeFirebase, 100);
});

// Make functions globally available
window.initializeFirebase = initializeFirebase;
window.getAuth = getAuth;
window.getFirestore = getFirestore;
window.isFirebaseReady = isFirebaseReady;
window.waitForFirebase = waitForFirebase;
