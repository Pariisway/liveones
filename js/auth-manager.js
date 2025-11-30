// Simple Auth Manager - Works with firebase-config.js
class AuthManager {
    constructor() {
        this.auth = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            await waitForFirebase();
            this.auth = getAuth();
            this.initialized = true;
            console.log('✅ Auth Manager initialized');
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.onAuthStateChange(user);
            });
            
        } catch (error) {
            console.error('❌ Auth Manager initialization failed:', error);
        }
    }

    async signUp(email, password, displayName = '') {
        if (!this.initialized) await this.init();
        
        try {
            console.log('📝 Creating account for:', email);
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            if (displayName) {
                await user.updateProfile({
                    displayName: displayName
                });
            }
            
            console.log('✅ User created:', user.email);
            return user;
            
        } catch (error) {
            console.error('❌ Sign up error:', error);
            throw this.handleAuthError(error);
        }
    }

    async signIn(email, password) {
        if (!this.initialized) await this.init();
        
        try {
            console.log('🔐 Signing in:', email);
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ User signed in:', userCredential.user.email);
            return userCredential.user;
            
        } catch (error) {
            console.error('❌ Sign in error:', error);
            throw this.handleAuthError(error);
        }
    }

    async signOut() {
        if (!this.initialized) await this.init();
        
        try {
            await this.auth.signOut();
            console.log('✅ User signed out');
        } catch (error) {
            console.error('❌ Sign out error:', error);
            throw error;
        }
    }

    getCurrentUser() {
        return this.initialized ? this.auth.currentUser : null;
    }

    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    handleAuthError(error) {
        const errorMap = {
            'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        
        return new Error(errorMap[error.code] || error.message || 'Authentication failed');
    }

    onAuthStateChange(user) {
        console.log('🔄 Auth state changed:', user ? user.email : 'No user');
        
        // Update UI elements
        this.updateAuthUI(user);
    }

    updateAuthUI(user) {
        // Update navigation based on auth state
        const authElements = document.querySelectorAll('.auth-element');
        const userElements = document.querySelectorAll('.user-element');
        
        if (user) {
            authElements.forEach(el => el.style.display = 'none');
            userElements.forEach(el => el.style.display = 'block');
            
            // Update user info
            document.querySelectorAll('.user-email').forEach(el => {
                el.textContent = user.email;
            });
            document.querySelectorAll('.user-name').forEach(el => {
                el.textContent = user.displayName || user.email;
            });
        } else {
            authElements.forEach(el => el.style.display = 'block');
            userElements.forEach(el => el.style.display = 'none');
        }
    }
}

// Create global instance
const authManager = new AuthManager();

// Global functions for backward compatibility
async function signUpWithEmail(email, password, displayName) {
    return await authManager.signUp(email, password, displayName);
}

async function signInWithEmail(email, password) {
    return await authManager.signIn(email, password);
}

async function signOut() {
    return await authManager.signOut();
}

function getCurrentUser() {
    return authManager.getCurrentUser();
}

function isAuthenticated() {
    return authManager.isAuthenticated();
}

// Make available globally
window.authManager = authManager;
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
