// SIMPLE FIREBASE INITIALIZATION - BULLETPROOF VERSION

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBU2tbinWSOw-N8ce6zMQ9AMKXt-5fj23g",
    authDomain: "house-of-whispers.firebaseapp.com",
    projectId: "house-of-whispers",
    storageBucket: "house-of-whispers.firebasestorage.app",
    messagingSenderId: "1063333130646",
    appId: "1:1063333130646:web:9f0d6ddc2927692aaaadb7",
    measurementId: "G-06QR5LFKJ9"
};

// Initialize Firebase immediately when this script loads
console.log('🚀 Initializing Firebase...');
try {
    // Check if Firebase is already initialized
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded!');
    } else if (!firebase.apps.length) {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully!');
    } else {
        // Use existing app
        console.log('✅ Firebase already initialized');
    }
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
}

// Simple auth functions that work directly with firebase
window.firebaseAuth = {
    // Sign up function
    signUp: async function(email, password, displayName) {
        try {
            console.log('📝 Creating account for:', email);
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            if (displayName) {
                await user.updateProfile({
                    displayName: displayName
                });
            }
            
            console.log('✅ User created successfully');
            return user;
            
        } catch (error) {
            console.error('❌ Sign up error:', error);
            let errorMessage = 'Error creating account. Please try again.';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            }
            
            throw new Error(errorMessage);
        }
    },

    // Sign in function
    signIn: async function(email, password) {
        try {
            console.log('🔐 Signing in:', email);
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            console.log('✅ User signed in successfully');
            return userCredential.user;
            
        } catch (error) {
            console.error('❌ Sign in error:', error);
            let errorMessage = 'Error signing in. Please try again.';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            }
            
            throw new Error(errorMessage);
        }
    },

    // Sign out function
    signOut: async function() {
        try {
            await firebase.auth().signOut();
            console.log('✅ User signed out');
        } catch (error) {
            console.error('❌ Sign out error:', error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser: function() {
        return firebase.auth().currentUser;
    },

    // Check if user is authenticated
    isAuthenticated: function() {
        return !!firebase.auth().currentUser;
    },

    // Auth state listener
    onAuthStateChanged: function(callback) {
        return firebase.auth().onAuthStateChanged(callback);
    }
};

console.log('✅ Firebase auth functions ready!');

// Update UI based on auth state
firebase.auth().onAuthStateChanged((user) => {
    console.log('🔄 Auth state changed:', user ? user.email : 'No user');
    updateAuthUI(user);
});

// Update auth UI elements
function updateAuthUI(user) {
    const authElements = document.querySelectorAll('.auth-element');
    const userElements = document.querySelectorAll('.user-element');
    
    if (user) {
        // User is signed in
        authElements.forEach(el => {
            if (el) el.style.display = 'none';
        });
        userElements.forEach(el => {
            if (el) el.style.display = 'block';
        });
        
        // Update user info
        document.querySelectorAll('.user-email').forEach(el => {
            if (el) el.textContent = user.email;
        });
        document.querySelectorAll('.user-name').forEach(el => {
            if (el) el.textContent = user.displayName || user.email;
        });
    } else {
        // User is signed out
        authElements.forEach(el => {
            if (el) el.style.display = 'block';
        });
        userElements.forEach(el => {
            if (el) el.style.display = 'none';
        });
    }
}

// Make functions globally available
window.signUpWithEmail = window.firebaseAuth.signUp;
window.signInWithEmail = window.firebaseAuth.signIn;
window.signOut = window.firebaseAuth.signOut;
window.getCurrentUser = window.firebaseAuth.getCurrentUser;
window.isAuthenticated = window.firebaseAuth.isAuthenticated;

console.log('✅ All auth functions are now globally available');
