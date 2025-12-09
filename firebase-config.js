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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("✅ Firebase initialized successfully");

// Global user state
let currentUser = null;
let userData = null;

// Check auth state
auth.onAuthStateChanged((user) => {
    currentUser = user;
    console.log("Auth state changed:", user ? "Logged in" : "Logged out");
    
    if (user) {
        // User is signed in
        loadUserData(user.uid);
        updateUIForAuth(true);
    } else {
        // User is signed out
        updateUIForAuth(false);
    }
});

// Load user data from Firestore
async function loadUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            console.log("User data loaded:", userData);
            
            // Update UI with user data
            updateUserUI(userData);
            
            // If user is a whisper, update whispers grid
            if (userData.role === 'whisper') {
                updateWhisperAvailability(userData.isAvailable || false);
            }
        } else {
            // Create user document if it doesn't exist
            await createUserDocument(userId);
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

// Create user document in Firestore
async function createUserDocument(userId) {
    const user = auth.currentUser;
    const defaultData = {
        uid: userId,
        email: user.email,
        displayName: user.displayName || 'New User',
        role: 'caller', // Default role
        isAvailable: false,
        isWhisper: false,
        coins: 0,
        earnings: 0,
        totalCalls: 0,
        rating: 5.0,
        ratingCount: 0,
        bio: '',
        socialLinks: {},
        paymentInfo: {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('users').doc(userId).set(defaultData);
        userData = defaultData;
        console.log("User document created");
    } catch (error) {
        console.error("Error creating user document:", error);
    }
}

// Update UI based on auth state
function updateUIForAuth(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const heroSignupBtn = document.getElementById('heroSignupBtn');
    
    if (isLoggedIn) {
        // User is logged in
        if (loginBtn) loginBtn.textContent = 'Dashboard';
        if (signupBtn) signupBtn.textContent = 'Log Out';
        if (heroSignupBtn) heroSignupBtn.textContent = 'Go to Dashboard';
        
        // Update button event listeners
        if (loginBtn) {
            loginBtn.onclick = () => window.location.href = 'dashboard.html';
            loginBtn.classList.remove('btn-outline');
            loginBtn.classList.add('btn-primary');
        }
        
        if (signupBtn) {
            signupBtn.onclick = logoutUser;
            signupBtn.classList.remove('btn-primary');
            signupBtn.classList.add('btn-danger');
        }
        
        if (heroSignupBtn) {
            heroSignupBtn.onclick = () => window.location.href = 'dashboard.html';
        }
    } else {
        // User is logged out
        if (loginBtn) {
            loginBtn.textContent = 'Log In';
            loginBtn.onclick = showAuthModal;
            loginBtn.classList.remove('btn-primary');
            loginBtn.classList.add('btn-outline');
        }
        
        if (signupBtn) {
            signupBtn.textContent = 'Sign Up Free';
            signupBtn.onclick = showAuthModal;
            signupBtn.classList.remove('btn-danger');
            signupBtn.classList.add('btn-primary');
        }
        
        if (heroSignupBtn) {
            heroSignupBtn.textContent = 'Start Connecting';
            heroSignupBtn.onclick = showAuthModal;
        }
    }
}

// Update UI with user data
function updateUserUI(data) {
    // Update user name in navbar if element exists
    const userNavElement = document.getElementById('userNav');
    if (userNavElement) {
        userNavElement.textContent = data.displayName;
    }
    
    // Update role-specific UI
    if (data.role === 'whisper') {
        // Show whisper-specific elements
        document.querySelectorAll('.whisper-only').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        // Show caller-specific elements
        document.querySelectorAll('.caller-only').forEach(el => {
            el.style.display = 'block';
        });
    }
}

// Logout function
function logoutUser() {
    auth.signOut().then(() => {
        console.log("User signed out");
        window.location.reload();
    }).catch((error) => {
        console.error("Sign out error:", error);
    });
}

// Show auth modal
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Initialize Firebase listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside or on close button
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') || 
            event.target.classList.contains('modal-close') ||
            event.target.closest('.modal-close')) {
            closeModal();
        }
    });
    
    // Escape key closes modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    // Auth tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab
            document.querySelectorAll('.auth-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show corresponding form
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(tabId + 'Form').classList.add('active');
        });
    });
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            loginUser(email, password);
        });
    }
    
    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const displayName = document.getElementById('displayName').value;
            const role = document.querySelector('input[name="role"]:checked').value;
            
            signupUser(email, password, displayName, role);
        });
    }
});

// Login user
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("User logged in:", userCredential.user);
        closeModal();
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
    }
}

// Signup user
async function signupUser(email, password, displayName, role) {
    try {
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update display name
        await user.updateProfile({
            displayName: displayName
        });
        
        console.log("User created:", user);
        closeModal();
    } catch (error) {
        console.error("Signup error:", error);
        alert("Signup failed: " + error.message);
    }
}

// Update whisper availability
async function updateWhisperAvailability(isAvailable) {
    if (!currentUser || !userData || userData.role !== 'whisper') return;
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            isAvailable: isAvailable,
            lastStatusChange: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("Availability updated:", isAvailable);
    } catch (error) {
        console.error("Error updating availability:", error);
    }
}

// Get available whispers
async function getAvailableWhispers() {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'whisper')
            .where('isAvailable', '==', true)
            .limit(20)
            .get();
        
        const whispers = [];
        snapshot.forEach(doc => {
            whispers.push({ id: doc.id, ...doc.data() });
        });
        
        return whispers;
    } catch (error) {
        console.error("Error getting whispers:", error);
        return [];
    }
}

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;
window.currentUser = () => currentUser;
window.userData = () => userData;

// Add this function to handle dashboard redirect
function redirectToDashboard() {
    if (currentUser) {
        window.location.href = 'dashboard.html';
    } else {
        showToast('Please log in first');
        showAuthModal();
    }
}

// Update the button handlers in the auth state change
function updateUIForAuth(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const heroSignupBtn = document.getElementById('heroSignupBtn');
    
    if (isLoggedIn) {
        // User is logged in
        if (loginBtn) {
            loginBtn.textContent = 'Dashboard';
            loginBtn.onclick = redirectToDashboard;
            loginBtn.classList.remove('btn-outline');
            loginBtn.classList.add('btn-primary');
        }
        
        if (signupBtn) {
            signupBtn.textContent = 'Log Out';
            signupBtn.onclick = logoutUser;
            signupBtn.classList.remove('btn-primary');
            signupBtn.classList.add('btn-danger');
        }
        
        if (heroSignupBtn) {
            heroSignupBtn.textContent = 'Go to Dashboard';
            heroSignupBtn.onclick = redirectToDashboard;
        }
    } else {
        // User is logged out
        if (loginBtn) {
            loginBtn.textContent = 'Log In';
            loginBtn.onclick = showAuthModal;
            loginBtn.classList.remove('btn-primary');
            loginBtn.classList.add('btn-outline');
        }
        
        if (signupBtn) {
            signupBtn.textContent = 'Sign Up Free';
            signupBtn.onclick = showAuthModal;
            signupBtn.classList.remove('btn-danger');
            signupBtn.classList.add('btn-primary');
        }
        
        if (heroSignupBtn) {
            heroSignupBtn.textContent = 'Start Connecting';
            heroSignupBtn.onclick = showAuthModal;
        }
    }
}
// Add this at the end of firebase-config.js
console.log("Firebase config loaded for dashboard");

// Create a global event to signal when auth is ready
window.dispatchEvent(new Event('auth-ready'));

// Function to check if we can access dashboard
window.canAccessDashboard = function() {
    return new Promise((resolve) => {
        if (currentUser) {
            resolve(true);
        } else {
            // Wait for auth state change
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(!!user);
            });
            
            // Timeout after 3 seconds
            setTimeout(() => {
                unsubscribe();
                resolve(false);
            }, 3000);
        }
    });
};
