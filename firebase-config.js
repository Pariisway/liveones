// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey: "AIzaSyALbIJSI2C-p6IyMtj_F0ZqGyN1i79jOd4",
    authDomain: "whisper-chat-live.firebaseapp.com",
    databaseURL: "https://whisper-chat-live-default-rtdb.firebaseio.com",
    projectId: "whisper-chat-live",
    storageBucket: "whisper-chat-live.firebasestorage.app",
    messagingSenderId: "302894848452",
    appId: "1:302894848452:web:61a7ab21a269533c426c91"
};

// ===== THIRD-PARTY CONFIGURATION =====
const STRIPE_PUBLISHABLE_KEY = "pk_live_51TZ0C0wOq1WjSyy00EaQ2V8sZ4v7e4D6vK8J4q9X7y3mN1pL2r5t8gHjK4l9M7w3bQ6c8d9f0g1h2j3";
const AGORA_APP_ID = "966c8e41da614722a88d4372c3d95dba";

// ===== INITIALIZATION =====
// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Initialize Stripe
let stripe = null;
if (typeof Stripe !== 'undefined') {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
}

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let userData = null;
let agoraClient = null;
let localStream = null;
let remoteStream = null;
let currentCallId = null;

// ===== AUTHENTICATION =====
// Listen for auth state changes
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    console.log("Auth state changed:", user ? "Logged in" : "Logged out");
    
    if (user) {
        try {
            // Load user data from Firestore
            await loadUserData(user.uid);
            
            // Update UI for logged in state
            updateUIForAuth(true);
            
            // Show welcome toast for new users
            if (sessionStorage.getItem('newUser') === 'true') {
                showToast('Welcome to WhisperChat!', 'success');
                sessionStorage.removeItem('newUser');
            }
            
            // Check if user is in an active call
            await checkActiveCall(user.uid);
            
        } catch (error) {
            console.error("Error in auth state change:", error);
        }
    } else {
        userData = null;
        updateUIForAuth(false);
    }
});

// Load user data from Firestore
async function loadUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            userData = { id: userDoc.id, ...userDoc.data() };
            console.log("User data loaded:", userData);
            updateUserUI(userData);
            
            // If user is a whisper, update availability
            if (userData.role === 'whisper') {
                updateWhisperUI(userData.isAvailable || false);
            }
        } else {
            await createUserDocument(userId);
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

// Create user document
async function createUserDocument(userId) {
    const user = auth.currentUser;
    const userDoc = {
        uid: userId,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'caller',
        isAvailable: false,
        isWhisper: false,
        coins: 0,
        earnings: 0,
        totalCalls: 0,
        rating: 5.0,
        ratingCount: 0,
        bio: '',
        category: 'general',
        socialLinks: {
            instagram: '',
            twitter: '',
            tiktok: '',
            youtube: '',
            twitch: ''
        },
        paymentInfo: {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('users').doc(userId).set(userDoc);
        userData = userDoc;
        console.log("User document created");
    } catch (error) {
        console.error("Error creating user document:", error);
    }
}

// ===== AUTHENTICATION FUNCTIONS =====
async function signUpWithEmail(email, password, displayName, role = 'caller') {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        await userCredential.user.updateProfile({
            displayName: displayName
        });
        
        // Mark as new user for welcome message
        sessionStorage.setItem('newUser', 'true');
        
        showToast('Account created successfully!', 'success');
        return { success: true, user: userCredential.user };
        
    } catch (error) {
        console.error("Sign up error:", error);
        showToast(getAuthErrorMessage(error), 'error');
        return { success: false, error: error.message };
    }
}

async function signInWithEmail(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showToast('Logged in successfully!', 'success');
        return { success: true, user: userCredential.user };
        
    } catch (error) {
        console.error("Sign in error:", error);
        showToast(getAuthErrorMessage(error), 'error');
        return { success: false, error: error.message };
    }
}

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await auth.signInWithPopup(provider);
        
        // Check if user document exists
        const userDoc = await db.collection('users').doc(result.user.uid).get();
        
        if (!userDoc.exists) {
            sessionStorage.setItem('newUser', 'true');
        }
        
        showToast('Logged in with Google!', 'success');
        return { success: true, user: result.user };
        
    } catch (error) {
        console.error("Google sign in error:", error);
        showToast(getAuthErrorMessage(error), 'error');
        return { success: false, error: error.message };
    }
}

async function logoutUser() {
    try {
        await auth.signOut();
        showToast('Logged out successfully', 'success');
        
        // If not on homepage, redirect
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
        
    } catch (error) {
        console.error("Logout error:", error);
        showToast('Error logging out', 'error');
    }
}

function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'Email already in use';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/operation-not-allowed':
            return 'Operation not allowed';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/user-disabled':
            return 'Account has been disabled';
        case 'auth/user-not-found':
            return 'User not found';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/too-many-requests':
            return 'Too many attempts. Try again later';
        default:
            return error.message;
    }
}

// ===== UI FUNCTIONS =====
function updateUIForAuth(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const userNav = document.getElementById('userNav');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (isLoggedIn && currentUser) {
        // User is logged in
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Dashboard';
            loginBtn.onclick = () => window.location.href = 'enhanced-dashboard.html';
        }
        
        if (signupBtn) {
            signupBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Log Out';
            signupBtn.onclick = logoutUser;
        }
        
        if (userNav && userData) {
            userNav.textContent = userData.displayName || 'User';
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
    } else {
        // User is logged out
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log In';
            loginBtn.onclick = () => showAuthModal('login');
        }
        
        if (signupBtn) {
            signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
            signupBtn.onclick = () => showAuthModal('signup');
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

function updateUserUI(data) {
    // Update coin balance
    updateCoinBalance();
    
    // Update user name
    const userNavElement = document.getElementById('userNav');
    if (userNavElement && data.displayName) {
        userNavElement.textContent = data.displayName;
    }
}

function updateCoinBalance() {
    if (!userData) return;
    
    const coinElements = document.querySelectorAll('#coinBalance, .coin-balance, .card-value.coins');
    coinElements.forEach(element => {
        if (element && userData.coins !== undefined) {
            element.textContent = userData.coins;
        }
    });
}

function updateWhisperUI(isAvailable) {
    const availabilityToggle = document.getElementById('availabilityToggle');
    if (availabilityToggle) {
        availabilityToggle.checked = isAvailable;
    }
}

// ===== FIRESTORE FUNCTIONS =====
async function getAvailableWhispers(limit = 12) {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'whisper')
            .where('isAvailable', '==', true)
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error("Error getting whispers:", error);
        return [];
    }
}

async function updateWhisperAvailability(isAvailable) {
    if (!currentUser || !userData || userData.role !== 'whisper') return;
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            isAvailable: isAvailable,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        userData.isAvailable = isAvailable;
        showToast(`You are now ${isAvailable ? 'available' : 'unavailable'} for calls`, 'success');
        
    } catch (error) {
        console.error("Error updating availability:", error);
        showToast('Error updating availability', 'error');
    }
}

async function getUserCallHistory(limit = 10) {
    if (!currentUser) return [];
    
    try {
        const snapshot = await db.collection('calls')
            .where('participants', 'array-contains', currentUser.uid)
            .orderBy('startTime', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error("Error getting call history:", error);
        return [];
    }
}

async function getWhisperProfile(whisperId) {
    try {
        const doc = await db.collection('users').doc(whisperId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting whisper profile:", error);
        return null;
    }
}

// ===== CALL FUNCTIONS =====
async function checkActiveCall(userId) {
    try {
        const activeCall = await db.collection('activeCalls')
            .where('participants', 'array-contains', userId)
            .where('status', 'in', ['active', 'connecting'])
            .limit(1)
            .get();
        
        if (!activeCall.empty) {
            const call = activeCall.docs[0].data();
            if (call.endTime && call.endTime.toDate() > new Date()) {
                window.location.href = `call.html?callId=${activeCall.docs[0].id}`;
            }
        }
    } catch (error) {
        console.error("Error checking active calls:", error);
    }
}

async function startCallWithWhisper(whisperId) {
    if (!currentUser) {
        showToast('Please log in to start a call', 'error');
        return;
    }
    
    if (!userData || userData.coins < 1) {
        showToast('You need at least 1 coin to start a call', 'error');
        window.location.href = 'payment.html';
        return;
    }
    
    try {
        // Get whisper data
        const whisperData = await getWhisperProfile(whisperId);
        if (!whisperData || !whisperData.isAvailable) {
            showToast('This whisper is not available right now', 'error');
            return;
        }
        
        // Deduct coin from caller
        await db.collection('users').doc(currentUser.uid).update({
            coins: firebase.firestore.FieldValue.increment(-1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        userData.coins -= 1;
        updateCoinBalance();
        
        // Create call document
        const callRef = await db.collection('activeCalls').add({
            callerId: currentUser.uid,
            whisperId: whisperId,
            participants: [currentUser.uid, whisperId],
            status: 'connecting',
            startTime: firebase.firestore.FieldValue.serverTimestamp(),
            endTime: null,
            cost: 1,
            earnings: 0.70, // Whisper gets 70% ($10.50 of $15)
            duration: 0,
            actualDuration: 0,
            rating: null,
            feedback: '',
            channelName: `call_${Date.now()}_${currentUser.uid}_${whisperId}`
        });
        
        // Update whisper's availability
        await db.collection('users').doc(whisperId).update({
            isAvailable: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Redirect to call page
        window.location.href = `call.html?callId=${callRef.id}`;
        
    } catch (error) {
        console.error("Error starting call:", error);
        showToast('Error starting call: ' + error.message, 'error');
    }
}

async function refundCall(callId) {
    try {
        const callDoc = await db.collection('activeCalls').doc(callId).get();
        if (!callDoc.exists) {
            showToast('Call not found', 'error');
            return;
        }
        
        const callData = callDoc.data();
        
        // Only refund if call was missed or lasted less than 30 seconds
        const duration = callData.actualDuration || 0;
        if (callData.status === 'missed' || duration < 30) {
            // Refund coin to caller
            await db.collection('users').doc(callData.callerId).update({
                coins: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update call status
            await db.collection('activeCalls').doc(callId).update({
                status: 'refunded',
                refunded: true,
                refundTime: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Make whisper available again
            await db.collection('users').doc(callData.whisperId).update({
                isAvailable: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('Call refunded successfully', 'success');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error("Error refunding call:", error);
        showToast('Error refunding call', 'error');
        return false;
    }
}

// ===== PAYMENT FUNCTIONS =====
async function initializeStripePayment(amount, coins, productId) {
    showToast('Processing payment...', 'info');
    
    // In production, this would call your backend
    // For demo, simulate successful payment
    setTimeout(async () => {
        try {
            // Add coins to user's balance
            await db.collection('users').doc(currentUser.uid).update({
                coins: firebase.firestore.FieldValue.increment(coins),
                totalSpent: firebase.firestore.FieldValue.increment(amount),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Record transaction
            await db.collection('transactions').add({
                userId: currentUser.uid,
                type: 'purchase',
                amount: amount,
                coins: coins,
                status: 'completed',
                productId: productId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update local user data
            userData.coins += coins;
            userData.totalSpent = (userData.totalSpent || 0) + amount;
            
            // Update UI
            updateCoinBalance();
            
            showToast(`Payment successful! ${coins} coins added`, 'success');
            
        } catch (error) {
            console.error("Error processing payment:", error);
            showToast('Payment processing failed', 'error');
        }
    }, 1500);
}

// ===== AGORA FUNCTIONS =====
async function initializeAgoraClient(channelName) {
    if (!AGORA_APP_ID) {
        console.error("Agora App ID not configured");
        return null;
    }
    
    try {
        // Create Agora client
        agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        
        // Initialize client
        await agoraClient.init(AGORA_APP_ID);
        
        // Join channel
        const uid = currentUser ? currentUser.uid.substring(0, 8) : Math.random().toString(36).substr(2, 9);
        await agoraClient.join(null, channelName, uid);
        
        // Create local stream
        localStream = AgoraRTC.createStream({
            streamID: uid,
            audio: true,
            video: false,
            screen: false
        });
        
        await localStream.init();
        await agoraClient.publish(localStream);
        
        // Set up event listeners
        agoraClient.on("stream-added", (evt) => {
            agoraClient.subscribe(evt.stream);
        });
        
        agoraClient.on("stream-subscribed", (evt) => {
            remoteStream = evt.stream;
            // Play remote stream
            remoteStream.play("remoteAudio");
        });
        
        agoraClient.on("peer-leave", (evt) => {
            // Handle peer leaving
            if (remoteStream && remoteStream.getId() === evt.uid) {
                remoteStream.stop();
                remoteStream = null;
            }
        });
        
        return agoraClient;
        
    } catch (error) {
        console.error("Error initializing Agora:", error);
        return null;
    }
}

async function leaveAgoraCall() {
    if (localStream) {
        localStream.close();
        localStream = null;
    }
    
    if (agoraClient) {
        await agoraClient.leave();
        agoraClient = null;
    }
    
    if (remoteStream) {
        remoteStream.stop();
        remoteStream = null;
    }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    switch (type) {
        case 'success': icon = 'check-circle'; break;
        case 'warning': icon = 'exclamation-triangle'; break;
        case 'error': icon = 'times-circle'; break;
        default: icon = 'info-circle';
    }
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    // Add styles if not present
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--card-bg);
                color: white;
                padding: 15px 20px;
                border-radius: var(--radius);
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: var(--shadow);
                z-index: 9999;
                animation: slideIn 0.3s ease;
                max-width: 350px;
                border-left: 4px solid var(--primary);
            }
            .toast-success { border-left-color: var(--success); }
            .toast-warning { border-left-color: var(--warning); }
            .toast-error { border-left-color: var(--danger); }
            .toast i { font-size: 20px; }
            .toast-close {
                background: none;
                border: none;
                color: var(--gray);
                font-size: 24px;
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .toast-close:hover { color: white; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    });
}

// ===== MODAL FUNCTIONS =====
function showAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        
        // Set active tab
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        const activeTab = document.querySelector(`[data-tab="${tab}"]`);
        const activeForm = document.getElementById(`${tab}Form`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activeForm) activeForm.classList.add('active');
    } else {
        // Fallback: redirect to index.html which should have the modal
        window.location.href = 'index.html';
    }
}

function closeModal(modalId = null) {
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    } else {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
}

// ===== INITIALIZATION =====
// Export functions globally
window.auth = auth;
window.db = db;
window.storage = storage;
window.currentUser = currentUser;
window.userData = userData;
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.signInWithGoogle = signInWithGoogle;
window.logoutUser = logoutUser;
window.getAvailableWhispers = getAvailableWhispers;
window.updateWhisperAvailability = updateWhisperAvailability;
window.getWhisperProfile = getWhisperProfile;
window.startCallWithWhisper = startCallWithWhisper;
window.refundCall = refundCall;
window.getUserCallHistory = getUserCallHistory;
window.initializeStripePayment = initializeStripePayment;
window.initializeAgoraClient = initializeAgoraClient;
window.leaveAgoraCall = leaveAgoraCall;
window.showToast = showToast;
window.showAuthModal = showAuthModal;
window.closeModal = closeModal;

console.log("✅ Firebase configuration loaded successfully");

// Initialize on DOM ready
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
    
    // Initialize logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
});