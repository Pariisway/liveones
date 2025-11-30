// Firebase Authentication System - FIXED VERSION
// Make sure firebase-init.js is loaded first!

let auth; // Will be initialized after firebase-init

// Initialize auth after Firebase is loaded
function initializeAuth() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        auth = firebase.auth();
        console.log('✅ Firebase Auth initialized');
        
        // Set up auth state listener
        auth.onAuthStateChanged((user) => {
            console.log('✅ Firebase Auth state changed');
            if (user) {
                console.log('👤 User signed in:', user.email);
                updateAuthUI(user);
            } else {
                console.log('👤 No user signed in');
                updateAuthUI(null);
            }
        });
        
        return true;
    } else {
        console.error('❌ Firebase Auth not available');
        return false;
    }
}

// Enhanced sign up function with better error handling
async function signUpWithEmail(email, password, displayName) {
    // Ensure auth is initialized
    if (!auth && !initializeAuth()) {
        throw new Error('Firebase Auth not initialized');
    }
    
    try {
        console.log('📝 Creating account for:', email);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        if (displayName) {
            await user.updateProfile({
                displayName: displayName
            });
        }
        
        console.log('✅ User created:', user);
        return user;
        
    } catch (error) {
        console.error('❌ Sign up error:', error);
        
        // Handle specific error cases
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered. Please sign in instead.');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('Password should be at least 6 characters.');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address.');
        } else {
            throw new Error('Error creating account: ' + error.message);
        }
    }
}

// Enhanced sign in function
async function signInWithEmail(email, password) {
    // Ensure auth is initialized
    if (!auth && !initializeAuth()) {
        throw new Error('Firebase Auth not initialized');
    }
    
    try {
        console.log('🔐 Signing in:', email);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ User signed in:', userCredential.user);
        return userCredential.user;
    } catch (error) {
        console.error('❌ Sign in error:', error);
        
        // Handle specific error cases
        if (error.code === 'auth/user-not-found') {
            throw new Error('No account found with this email.');
        } else if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect password.');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address.');
        } else {
            throw new Error('Error signing in: ' + error.message);
        }
    }
}

// Sign out function
async function signOut() {
    if (!auth) return;
    
    try {
        await auth.signOut();
        console.log('✅ User signed out');
    } catch (error) {
        console.error('❌ Sign out error:', error);
        throw error;
    }
}

// Update UI based on auth state
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
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
            if (el) el.textContent = user.email;
        });
        
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
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

// Get current user
function getCurrentUser() {
    return auth ? auth.currentUser : null;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getCurrentUser();
}

// Password reset
async function resetPassword(email) {
    if (!auth) return false;
    
    try {
        await auth.sendPasswordResetEmail(email);
        console.log('✅ Password reset email sent');
        return true;
    } catch (error) {
        console.error('❌ Password reset error:', error);
        
        if (error.code === 'auth/user-not-found') {
            throw new Error('No account found with this email.');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address.');
        } else {
            throw new Error('Error sending reset email: ' + error.message);
        }
    }
}

// Initialize auth when script loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeAuth, 100); // Small delay to ensure Firebase is loaded
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        signUpWithEmail,
        signInWithEmail,
        signOut,
        getCurrentUser,
        isAuthenticated,
        resetPassword,
        updateAuthUI,
        initializeAuth
    };
}
