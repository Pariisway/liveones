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
const STRIPE_PUBLISHABLE_KEY = "pk_test_51SPYHwRvETRK3Zx7mnVDTNyPB3mxT8vbSIcSVQURp8irweK0lGznwFrW9sjgju2GFgmDiQ5GkWYVlUQZZVNrXkJb00q2QOCC3I";
const AGORA_APP_ID = "966c8e41da614722a88d4372c3d95dba";

// ===== INITIALIZATION =====
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

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

// ===== AUTHENTICATION HANDLER =====
let authInitialized = false;

function initializeAuth() {
    if (authInitialized) return;
    
    auth.onAuthStateChanged(async (user) => {
        console.log("🚨 AUTH STATE CHANGED - User:", user ? "Logged in" : "Logged out");
        console.log("Current page:", window.location.pathname);
        
        currentUser = user;
        
        if (user) {
            try {
                await loadUserData(user.uid);
                updateUIForAuth(true, user);
                
                if (sessionStorage.getItem('newUser') === 'true') {
                    showToast('Welcome to Whisper+Me!', 'success');
                    sessionStorage.removeItem('newUser');
                }
                
                await checkActiveCall(user.uid);
                
            } catch (error) {
                console.error("Error in auth state change:", error);
            }
        } else {
            userData = null;
            updateUIForAuth(false, null);
        }
    });
    
    authInitialized = true;
}

async function loadUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            userData = { id: userDoc.id, ...userDoc.data() };
            console.log("User data loaded:", userData);
            updateUserUI(userData);
            
            // Set role switch in dashboard if exists
            updateRoleSwitchUI(userData.role);
            
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
        // Set user role back to caller on logout
        if (currentUser && userData && userData.role === 'whisper') {
            await db.collection('users').doc(currentUser.uid).update({
                role: 'caller',
                isAvailable: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        await auth.signOut();
        showToast('Logged out successfully', 'success');
        
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

// ===== ROLE MANAGEMENT =====
async function switchUserRole(newRole) {
    if (!currentUser || !userData) {
        showToast('Please log in to switch roles', 'error');
        return false;
    }
    
    try {
        const updates = {
            role: newRole,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (newRole === 'whisper') {
            updates.isAvailable = false;
        } else {
            updates.isAvailable = false;
        }
        
        await db.collection('users').doc(currentUser.uid).update(updates);
        
        userData.role = newRole;
        userData.isAvailable = newRole === 'whisper' ? false : false;
        
        showToast(`Role switched to ${newRole}`, 'success');
        
        updateRoleSwitchUI(newRole);
        
        if (newRole === 'whisper') {
            updateWhisperUI(false);
        }
        
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
        
        return true;
        
    } catch (error) {
        console.error("Error switching role:", error);
        showToast('Error switching role', 'error');
        return false;
    }
}

// ===== UI FUNCTIONS =====
function updateUIForAuth(isLoggedIn, user) {
    console.log('updateUIForAuth called. Logged in:', isLoggedIn);
    
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const userNav = document.getElementById('userNav');
    const logoutBtn = document.getElementById('logoutBtn');
    const heroSignupBtn = document.getElementById('heroSignupBtn');
    
    if (isLoggedIn && user) {
        console.log('User is logged in, updating UI');
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Dashboard';
            loginBtn.onclick = () => window.location.href = 'enhanced-dashboard.html';
            loginBtn.style.display = 'block';
        }
        
        if (signupBtn) {
            signupBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Log Out';
            signupBtn.onclick = logoutUser;
            signupBtn.style.display = 'block';
        }
        
        if (userNav) {
            userNav.textContent = user.displayName || user.email || 'User';
            userNav.style.display = 'inline-block';
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.onclick = logoutUser;
        }
        
        if (heroSignupBtn) {
            heroSignupBtn.textContent = 'Go to Dashboard';
            heroSignupBtn.onclick = () => window.location.href = 'enhanced-dashboard.html';
        }
        
    } else {
        console.log('User is logged out, updating UI');
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log In';
            loginBtn.onclick = () => showAuthModal('login');
            loginBtn.style.display = 'block';
        }
        
        if (signupBtn) {
            signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
            signupBtn.onclick = () => showAuthModal('signup');
            signupBtn.style.display = 'block';
        }
        
        if (userNav) {
            userNav.style.display = 'none';
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
        
        if (heroSignupBtn) {
            heroSignupBtn.textContent = 'Start Connecting';
            heroSignupBtn.onclick = () => showAuthModal('signup');
        }
    }
}

function updateUserUI(data) {
    updateCoinBalance();
    
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

function updateRoleSwitchUI(role) {
    const roleToggle = document.getElementById('roleToggle');
    if (roleToggle) {
        roleToggle.checked = role === 'whisper';
        
        const roleLabel = document.getElementById('roleLabel');
        if (roleLabel) {
            roleLabel.textContent = role === 'whisper' ? 'Whisper Mode' : 'Caller Mode';
        }
        
        const availabilitySection = document.getElementById('availabilitySection');
        if (availabilitySection) {
            availabilitySection.style.display = role === 'whisper' ? 'block' : 'none';
        }
    }
}

function updateWhisperUI(isAvailable) {
    const availabilityToggle = document.getElementById('availabilityToggle');
    if (availabilityToggle) {
        availabilityToggle.checked = isAvailable;
        
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator ' + (isAvailable ? 'available' : '');
        }
        
        if (statusText) {
            statusText.textContent = isAvailable ? 'Currently available for calls' : 'Currently unavailable';
        }
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
        
        const whispers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Loaded ${whispers.length} whispers`);
        return whispers;
        
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
        updateWhisperUI(isAvailable);
        
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
        const whisperData = await getWhisperProfile(whisperId);
        if (!whisperData || !whisperData.isAvailable) {
            showToast('This whisper is not available right now', 'error');
            return;
        }
        
        await db.collection('users').doc(currentUser.uid).update({
            coins: firebase.firestore.FieldValue.increment(-1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        userData.coins -= 1;
        updateCoinBalance();
        
        const callRef = await db.collection('activeCalls').add({
            callerId: currentUser.uid,
            whisperId: whisperId,
            participants: [currentUser.uid, whisperId],
            status: 'connecting',
            startTime: firebase.firestore.FieldValue.serverTimestamp(),
            endTime: null,
            cost: 1,
            earnings: 0.70,
            duration: 0,
            actualDuration: 0,
            rating: null,
            feedback: '',
            channelName: `call_${Date.now()}_${currentUser.uid}_${whisperId}`
        });
        
        await db.collection('users').doc(whisperId).update({
            isAvailable: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        window.location.href = `call.html?callId=${callRef.id}`;
        
    } catch (error) {
        console.error("Error starting call:", error);
        showToast('Error starting call: ' + error.message, 'error');
        
        if (userData) {
            await db.collection('users').doc(currentUser.uid).update({
                coins: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            userData.coins += 1;
            updateCoinBalance();
        }
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
        
        const duration = callData.actualDuration || 0;
        if (callData.status === 'missed' || duration < 30) {
            await db.collection('users').doc(callData.callerId).update({
                coins: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            await db.collection('activeCalls').doc(callId).update({
                status: 'refunded',
                refunded: true,
                refundTime: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
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
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            coins: firebase.firestore.FieldValue.increment(coins),
            totalSpent: firebase.firestore.FieldValue.increment(amount),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('transactions').add({
            userId: currentUser.uid,
            type: 'purchase',
            amount: amount,
            coins: coins,
            status: 'completed',
            productId: productId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        userData.coins += coins;
        userData.totalSpent = (userData.totalSpent || 0) + amount;
        
        updateCoinBalance();
        
        showToast(`Payment successful! ${coins} coins added`, 'success');
        return true;
        
    } catch (error) {
        console.error("Error processing payment:", error);
        showToast('Payment processing failed: ' + error.message, 'error');
        return false;
    }
}

// ===== AGORA FUNCTIONS =====
async function initializeAgoraClient(channelName) {
    if (!AGORA_APP_ID) {
        console.error("Agora App ID not configured");
        return null;
    }
    
    try {
        agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        
        await agoraClient.init(AGORA_APP_ID);
        
        const uid = currentUser ? currentUser.uid.substring(0, 8) : Math.random().toString(36).substr(2, 9);
        await agoraClient.join(null, channelName, uid);
        
        localStream = AgoraRTC.createStream({
            streamID: uid,
            audio: true,
            video: false,
            screen: false
        });
        
        await localStream.init();
        await agoraClient.publish(localStream);
        
        agoraClient.on("stream-added", (evt) => {
            agoraClient.subscribe(evt.stream);
        });
        
        agoraClient.on("stream-subscribed", (evt) => {
            remoteStream = evt.stream;
            remoteStream.play("remoteAudio");
        });
        
        agoraClient.on("peer-leave", (evt) => {
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
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
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
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
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
        
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        const activeTab = document.querySelector(`[data-tab="${tab}"]`);
        const activeForm = document.getElementById(`${tab}Form`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activeForm) activeForm.classList.add('active');
    } else {
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

// ===== LOAD WHISPERS =====
async function loadWhispers() {
    const whispersGrid = document.getElementById('whispersGrid');
    if (!whispersGrid) return;
    
    whispersGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <div class="loading-spinner" style="width: 50px; height: 50px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p>Loading whispers...</p>
        </div>
    `;
    
    try {
        const whispers = await getAvailableWhispers(12);
        
        if (whispers.length === 0) {
            whispersGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-user-slash" style="font-size: 3rem; color: var(--text-gray); margin-bottom: 20px;"></i>
                    <h3>No whispers available at the moment</h3>
                    <p>Check back soon or become a whisper yourself!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        whispers.forEach(whisper => {
            const rating = whisper.rating || 5.0;
            const stars = generateStarRating(rating);
            
            html += `
                <div class="whisper-card" data-whisper-id="${whisper.id}">
                    <div class="whisper-avatar">
                        ${whisper.avatarUrl ? 
                            `<img src="${whisper.avatarUrl}" alt="${whisper.displayName}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                            `<i class="fas fa-user"></i>`}
                    </div>
                    <div class="whisper-info">
                        <h3>${whisper.displayName || 'Anonymous'}</h3>
                        <div class="whisper-category">${whisper.category || 'General'}</div>
                        <div class="whisper-rating">
                            <div class="stars">
                                ${stars}
                            </div>
                            <span>${rating.toFixed(1)}</span>
                        </div>
                        <div class="whisper-stats">
                            <span><i class="fas fa-phone-alt"></i> ${whisper.totalCalls || 0} calls</span>
                            <span><i class="fas fa-clock"></i> 5 min</span>
                        </div>
                        <p style="color: var(--text-gray); font-size: 0.9rem; margin-top: 10px; height: 40px; overflow: hidden;">
                            ${whisper.bio || 'Ready to have a meaningful conversation!'}
                        </p>
                    </div>
                    <button class="btn-primary whisper-call-btn" onclick="startCallWithWhisper('${whisper.id}')">
                        <i class="fas fa-phone-alt"></i> Call - 1 Coin
                    </button>
                </div>
            `;
        });
        
        whispersGrid.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading whispers:", error);
        whispersGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--warning); margin-bottom: 20px;"></i>
                <h3>Error loading whispers</h3>
                <p>Please try again later or refresh the page.</p>
                <button class="btn-outline" onclick="loadWhispers()" style="margin-top: 20px;">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
    }
}

function generateStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// ===== INITIALIZATION =====
window.auth = auth;
window.db = db;
window.currentUser = currentUser;
window.userData = userData;
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.signInWithGoogle = signInWithGoogle;
window.logoutUser = logoutUser;
window.switchUserRole = switchUserRole;
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
window.loadWhispers = loadWhispers;

console.log("✅ Firebase configuration loaded successfully");

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    
    // Add spinner animation style
    if (!document.querySelector('#spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
});
