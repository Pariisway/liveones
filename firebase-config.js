// ===== FIREBASE CONFIG - NO AUTO-REDIRECTS =====
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ===== SIMPLE AUTH STATE =====
let currentUser = null;

auth.onAuthStateChanged((user) => {
    currentUser = user;
    console.log("Auth state:", user ? "Logged in" : "Logged out");
    
    // Update UI elements if they exist
    updateAuthUI();
});

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userNav = document.getElementById('userNav');
    
    if (currentUser) {
        // User is logged in
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Dashboard';
            loginBtn.onclick = () => window.location.href = 'dashboard.html';
        }
        if (signupBtn) {
            signupBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            signupBtn.onclick = logout;
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.onclick = logout;
        }
        if (userNav) {
            userNav.textContent = currentUser.displayName || currentUser.email.split('@')[0];
        }
    } else {
        // User is logged out
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            loginBtn.onclick = () => showAuthModal('login');
        }
        if (signupBtn) {
            signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Signup';
            signupBtn.onclick = () => showAuthModal('signup');
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

// ===== AUTH FUNCTIONS =====
async function signUpWithEmail(email, password, displayName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: displayName });
        
        // Create user document
        await db.collection('users').doc(userCredential.user.uid).set({
            uid: userCredential.user.uid,
            email: email,
            displayName: displayName,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=6c63ff`,
            role: 'caller',
            coins: 5,
            rating: 5.0,
            bio: 'New user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signInWithEmail(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function logout() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== NEW AVATAR FUNCTION =====
async function getUserAvatar(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Return user's actual avatar if it exists
            if (userData.avatarUrl && !userData.avatarUrl.includes('dicebear')) {
                return userData.avatarUrl;
            }
            
            // Otherwise use DiceBear with displayName
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.displayName || userId)}&backgroundColor=6c63ff`;
        }
    } catch (error) {
        console.error('Error getting user avatar:', error);
    }
    
    // Fallback to generic DiceBear
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=6c63ff`;
}

// ===== WHISPER FUNCTIONS =====
// In your getAvailableWhispers function, update the avatarUrl logic:
async function getAvailableWhispers() {
    try {
        const snapshot = await db.collection('whispers')
            .where('isAvailable', '==', true)
            .limit(20)
            .get();
        
        const whispers = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // FIX: Always use user's actual avatar if it exists
            let avatarUrl = data.avatarUrl;
            
            // If no avatar, use DiceBear OR check user's actual avatar
            if (!avatarUrl || avatarUrl.includes('dicebear')) {
                // Try to get user's actual avatar from users collection
                // Or use display name for consistent avatar
                avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.displayName || data.uid || doc.id)}&backgroundColor=6c63ff`;
            }
            
            whispers.push({
                id: doc.id,
                displayName: data.displayName || 'Anonymous',
                avatarUrl: avatarUrl,
                category: data.category || 'General',
                rating: data.rating || 5.0,
                bio: data.bio || 'Available for calls',
                price: data.price || 1,
                uid: data.uid // Add this to track user
            });
        });
        
        return whispers;
    } catch (error) {
        console.error('Get whispers error:', error);
        return [];
    }
}

async function startCallWithWhisper(whisperId) {
    if (!currentUser) {
        alert('Please login first');
        showAuthModal('login');
        return;
    }
    
    try {
        // Get user data to check coins
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) {
            alert('User not found');
            return;
        }
        
        const userData = userDoc.data();
        
        // Check if user has enough coins
        if (userData.coins < 1) {
            alert('You need at least 1 coin to call');
            return;
        }
        
        // Get whisper data for their display name
        const whisperDoc = await db.collection('whispers').doc(whisperId).get();
        const whisperData = whisperDoc.data();
        
        // Create channel name - FIXED: Consistent channel name for both users
        const channelName = `call_${Date.now()}_${currentUser.uid}_${whisperId}`;
        
        // Create call document
        const callRef = await db.collection('calls').add({
            callerId: currentUser.uid,
            callerName: userData.displayName,
            whisperId: whisperId,
            whisperName: whisperData.displayName || 'Anonymous',
            status: 'ringing',
            channelName: channelName,
            startTime: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            earnings: 12.00  // Fixed earnings for whisper
        });
        
        // Deduct coin from caller
        await db.collection('users').doc(currentUser.uid).update({
            coins: firebase.firestore.FieldValue.increment(-1)
        });
        
        // Mark whisper as unavailable
        await db.collection('whispers').doc(whisperId).update({
            isAvailable: false
        });
        
        // Redirect to call page
        window.location.href = `call.html?callId=${callRef.id}`;
        
    } catch (error) {
        console.error('Start call error:', error);
        alert('Error starting call: ' + error.message);
    }
}

// ===== MODAL FUNCTIONS =====
function showAuthModal(tab) {
    const modal = document.getElementById('authModal');
    if (!modal) {
        window.location.href = 'index.html';
        return;
    }
    
    modal.classList.add('active');
    
    // Switch tabs
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    const activeTab = document.querySelector(`[data-tab="${tab}"]`);
    const activeForm = document.getElementById(`${tab}Form`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeForm) activeForm.classList.add('active');
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
}

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'info') {
    console.log(`Toast [${type}]:`, message);
    
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div>${message}</div>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// ===== EXPORT =====
window.auth = auth;
window.db = db;
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.logout = logout;
window.getAvailableWhispers = getAvailableWhispers;
window.startCallWithWhisper = startCallWithWhisper;
window.showAuthModal = showAuthModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.getUserAvatar = getUserAvatar;  // ADD THIS LINE TOO!

console.log('✅ Firebase config loaded');
