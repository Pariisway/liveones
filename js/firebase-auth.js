// Firebase Authentication System - FIXED VERSION
const auth = firebase.auth();

// Initialize auth state listener
auth.onAuthStateChanged((user) => {
    console.log('✅ Firebase Auth initialized');
    if (user) {
        console.log('👤 User signed in:', user.email);
        updateAuthUI(user);
    } else {
        console.log('👤 No user signed in');
        updateAuthUI(null);
    }
});

// Enhanced sign up function with better error handling
async function signUpWithEmail(email, password, displayName) {
    try {
        console.log('📝 Creating account for:', email);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        await user.updateProfile({
            displayName: displayName
        });
        
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
        authElements.forEach(el => el.style.display = 'none');
        userElements.forEach(el => el.style.display = 'block');
        
        // Update user info
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });
        
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = user.displayName || user.email;
        });
        
    } else {
        // User is signed out
        authElements.forEach(el => el.style.display = 'block');
        userElements.forEach(el => el.style.display = 'none');
    }
}

// Get current user
function getCurrentUser() {
    return auth.currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!auth.currentUser;
}

// Password reset
async function resetPassword(email) {
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

// Update user profile
async function updateUserProfile(displayName, photoURL = null) {
    const user = auth.currentUser;
    if (!user) throw new Error('No user signed in');
    
    try {
        await user.updateProfile({
            displayName: displayName,
            photoURL: photoURL
        });
        console.log('✅ User profile updated');
        return true;
    } catch (error) {
        console.error('❌ Profile update error:', error);
        throw error;
    }
}

// Listen for auth state changes with custom callbacks
function onAuthStateChange(callback) {
    return auth.onAuthStateChanged(callback);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        signUpWithEmail,
        signInWithEmail,
        signOut,
        getCurrentUser,
        isAuthenticated,
        resetPassword,
        updateUserProfile,
        onAuthStateChange
    };
}
