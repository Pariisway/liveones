// Firebase Authentication Manager - Updated
class FirebaseAuth {
    constructor() {
        this.user = null;
        this.isInitialized = false;
        
        // Firebase configuration
        this.firebaseConfig = {
            apiKey: "AIzaSyBU2tbinWSOw-N8ce6zMQ9AMKXt-5fj23g",
            authDomain: "house-of-whispers.firebaseapp.com",
            projectId: "house-of-whispers",
            storageBucket: "house-of-whispers.firebasestorage.app",
            messagingSenderId: "1063333130646",
            appId: "1:1063333130646:web:9f0d6ddc2927692aaaadb7",
            measurementId: "G-06QR5LFKJ9"
        };

        this.init();
    }

    init() {
        try {
            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.setupAuthListener();
            this.isInitialized = true;
            console.log('✅ Firebase Auth initialized');
        } catch (error) {
            console.error('❌ Firebase Auth initialization error:', error);
        }
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged((user) => {
            this.user = user;
            this.onAuthStateChange(user);
            
            if (user) {
                console.log('👤 User signed in:', user.email);
                this.updateUIForLoggedInUser(user);
            } else {
                console.log('👤 User signed out');
                this.updateUIForLoggedOutUser();
            }
        });
    }

    onAuthStateChange(user) {
        // Override this in pages to handle auth changes
        console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
    }

    // Email/Password Sign Up
    async signUp(email, password, userData = {}) {
        try {
            console.log('📝 Creating account for:', email);
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Try to save additional user data to Firestore, but don't fail if permissions are missing
            if (Object.keys(userData).length > 0) {
                try {
                    await this.db.collection('users').doc(user.uid).set({
                        email: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        ...userData
                    });
                    console.log('✅ User data saved to Firestore');
                } catch (firestoreError) {
                    console.warn('⚠️ Could not save user data to Firestore (permissions issue):', firestoreError.message);
                    // Continue anyway - the user account was created successfully
                }
            }
            
            console.log('✅ Account created successfully');
            return { success: true, user };
        } catch (error) {
            console.error('❌ Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    // Email/Password Sign In
    async signIn(email, password) {
        try {
            console.log('🔐 Signing in:', email);
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Signed in successfully');
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Google Sign In
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const userCredential = await this.auth.signInWithPopup(provider);
            const user = userCredential.user;
            
            // Try to save/update user data in Firestore, but don't fail if permissions are missing
            try {
                await this.db.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                console.log('✅ Google user data saved to Firestore');
            } catch (firestoreError) {
                console.warn('⚠️ Could not save Google user data to Firestore (permissions issue):', firestoreError.message);
                // Continue anyway - the user is signed in successfully
            }
            
            console.log('✅ Google sign in successful');
            return { success: true, user };
        } catch (error) {
            console.error('❌ Google sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign Out
    async signOut() {
        try {
            await this.auth.signOut();
            console.log('✅ Signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.user !== null;
    }

    // Update UI for logged in user
    updateUIForLoggedInUser(user) {
        // Update navigation to show user menu
        const authElements = document.querySelectorAll('.auth-element');
        authElements.forEach(element => {
            if (element.classList.contains('logged-out')) {
                element.style.display = 'none';
            }
            if (element.classList.contains('logged-in')) {
                element.style.display = 'block';
            }
        });

        // Update user info in UI
        const userDisplayElements = document.querySelectorAll('.user-display');
        userDisplayElements.forEach(element => {
            if (element.classList.contains('user-email')) {
                element.textContent = user.email;
            }
            if (element.classList.contains('user-name')) {
                element.textContent = user.displayName || user.email;
            }
        });
    }

    // Update UI for logged out user
    updateUIForLoggedOutUser() {
        const authElements = document.querySelectorAll('.auth-element');
        authElements.forEach(element => {
            if (element.classList.contains('logged-out')) {
                element.style.display = 'block';
            }
            if (element.classList.contains('logged-in')) {
                element.style.display = 'none';
            }
        });
    }
}

// Global auth instance
let authManager;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    authManager = new FirebaseAuth();
});

// Global functions for HTML onclick
async function signUpWithEmail(email, password, userData) {
    if (!authManager) return { success: false, error: 'Auth not initialized' };
    return await authManager.signUp(email, password, userData);
}

async function signInWithEmail(email, password) {
    if (!authManager) return { success: false, error: 'Auth not initialized' };
    return await authManager.signIn(email, password);
}

async function signInWithGoogle() {
    if (!authManager) return { success: false, error: 'Auth not initialized' };
    return await authManager.signInWithGoogle();
}

async function signOutUser() {
    if (!authManager) return { success: false, error: 'Auth not initialized' };
    return await authManager.signOut();
}
