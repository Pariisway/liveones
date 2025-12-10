// ===== GLOBAL VARIABLES =====
let currentCall = null;
let callTimer = null;
let callDuration = 0;
let agoraClient = null;
let localStream = null;
let remoteStream = null;

// ===== MOBILE MENU =====
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
            mobileMenuBtn.innerHTML = navMenu.style.display === 'flex' ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navMenu.style.display = 'flex';
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            } else {
                navMenu.style.display = 'none';
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
}

// ===== AUTHENTICATION =====
async function loginUser(email, password) {
    try {
        const result = await signInWithEmail(email, password);
        if (result.success) {
            closeModal();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed: ' + error.message, 'error');
        return false;
    }
}

async function signupUser(email, password, displayName, role) {
    try {
        const result = await signUpWithEmail(email, password, displayName, role);
        if (result.success) {
            closeModal();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Signup failed: ' + error.message, 'error');
        return false;
    }
}

// ===== CALL MANAGEMENT =====
async function startCall(whisperId) {
    if (!currentUser) {
        showToast('Please log in to start a call', 'error');
        showAuthModal('login');
        return;
    }
    
    if (userData.coins < 1) {
        showToast('You need at least 1 coin to start a call', 'error');
        window.location.href = 'payment.html';
        return;
    }
    
    showToast('Starting call...', 'info');
    await startCallWithWhisper(whisperId);
}

async function endCall(callId, reason = 'ended_by_user') {
    try {
        // Stop any active timers
        if (callTimer) {
            clearInterval(callTimer);
            callTimer = null;
        }
        
        // Leave Agora call if active
        if (agoraClient) {
            await leaveAgoraCall();
        }
        
        // Update call status in Firestore
        const callRef = db.collection('activeCalls').doc(callId);
        const callDoc = await callRef.get();
        
        if (!callDoc.exists) {
            showToast('Call not found', 'error');
            return;
        }
        
        const callData = callDoc.data();
        const updates = {
            status: reason === 'time_up' ? 'completed' : reason,
            endTime: firebase.firestore.FieldValue.serverTimestamp(),
            actualDuration: callDuration,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Handle refund for missed calls
        if (reason === 'missed' && callDuration < 30) {
            updates.status = 'missed';
            await refundCall(callId);
        } else if (reason === 'time_up') {
            updates.status = 'completed';
        }
        
        await callRef.update(updates);
        
        // Make whisper available again
        if (callData.whisperId) {
            await db.collection('users').doc(callData.whisperId).update({
                isAvailable: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Update user stats
        await updateUserCallStats(callData.callerId, callData.whisperId, callDuration);
        
        showToast('Call ended', 'success');
        
        // Redirect based on context
        if (window.location.pathname.includes('call.html')) {
            // Show call ended screen
            showCallEndedScreen(callData, callDuration, reason);
        } else {
            window.location.href = 'enhanced-dashboard.html';
        }
        
    } catch (error) {
        console.error('Error ending call:', error);
        showToast('Error ending call: ' + error.message, 'error');
    }
}

async function updateUserCallStats(callerId, whisperId, duration) {
    try {
        // Update caller stats
        await db.collection('users').doc(callerId).update({
            totalCalls: firebase.firestore.FieldValue.increment(1),
            avgDuration: firebase.firestore.FieldValue.increment(duration),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update whisper stats
        if (whisperId) {
            await db.collection('users').doc(whisperId).update({
                totalCalls: firebase.firestore.FieldValue.increment(1),
                earnings: firebase.firestore.FieldValue.increment(0.70), // 70% of $15
                avgDuration: firebase.firestore.FieldValue.increment(duration),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
}

function showCallEndedScreen(callData, duration, reason) {
    const endedScreen = document.getElementById('callEndedScreen');
    if (!endedScreen) return;
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update UI elements
    const endedIcon = document.getElementById('endedIcon');
    const endedTitle = document.getElementById('endedTitle');
    const endedMessage = document.getElementById('endedMessage');
    const finalDuration = document.getElementById('finalDuration');
    const ratingSection = document.getElementById('ratingSection');
    
    if (finalDuration) {
        finalDuration.textContent = durationStr;
    }
    
    if (reason === 'time_up') {
        endedIcon.innerHTML = '<i class="fas fa-clock"></i>';
        endedTitle.textContent = 'Time\'s Up!';
        endedMessage.textContent = 'Your 5-minute call has ended.';
    } else if (reason === 'missed') {
        endedIcon.innerHTML = '<i class="fas fa-undo"></i>';
        endedTitle.textContent = 'Call Refunded';
        endedMessage.textContent = 'Your coin has been refunded.';
        if (ratingSection) ratingSection.style.display = 'none';
    } else {
        endedIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        endedTitle.textContent = 'Call Completed';
        endedMessage.textContent = 'Thank you for using WhisperChat!';
        if (ratingSection) ratingSection.style.display = 'block';
    }
    
    endedScreen.classList.add('active');
}

// ===== REFUND LOGIC =====
async function processRefund(callId) {
    try {
        const callRef = db.collection('activeCalls').doc(callId);
        const callDoc = await callRef.get();
        
        if (!callDoc.exists) {
            showToast('Call not found', 'error');
            return false;
        }
        
        const callData = callDoc.data();
        const duration = callData.actualDuration || 0;
        
        // Conditions for refund:
        // 1. Call was missed (whisper didn't answer)
        // 2. Call lasted less than 30 seconds
        // 3. Caller initiated refund within 5 minutes
        if (callData.status === 'missed' && duration < 30) {
            // Refund coin to caller
            await db.collection('users').doc(callData.callerId).update({
                coins: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update call status
            await callRef.update({
                status: 'refunded',
                refunded: true,
                refundTime: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update local user data if applicable
            if (currentUser && currentUser.uid === callData.callerId && userData) {
                userData.coins += 1;
                updateCoinBalance();
            }
            
            showToast('Call refunded successfully', 'success');
            return true;
        }
        
        showToast('Call does not qualify for refund', 'warning');
        return false;
        
    } catch (error) {
        console.error('Error processing refund:', error);
        showToast('Error processing refund: ' + error.message, 'error');
        return false;
    }
}

// ===== AGORA INTEGRATION =====
async function initializeCallAudio(callId, channelName) {
    try {
        if (!AGORA_APP_ID) {
            throw new Error('Agora App ID not configured');
        }
        
        // Initialize Agora client
        agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        
        // Initialize client
        await agoraClient.init(AGORA_APP_ID);
        
        // Join channel
        const uid = currentUser ? currentUser.uid.substring(0, 8) : Math.random().toString(36).substr(2, 9);
        await agoraClient.join(null, channelName, uid);
        
        // Create local audio stream
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
            // Play remote audio
            remoteStream.play("remoteAudio");
            
            // Update UI to show connected
            updateCallUI('connected');
        });
        
        agoraClient.on("peer-leave", (evt) => {
            // Handle peer leaving
            if (remoteStream && remoteStream.getId() === evt.uid) {
                remoteStream.stop();
                remoteStream = null;
                endCall(callId, 'ended_by_other');
            }
        });
        
        agoraClient.on("network-quality", (stats) => {
            updateConnectionQuality(stats);
        });
        
        return true;
        
    } catch (error) {
        console.error('Error initializing Agora:', error);
        showToast('Error connecting to audio: ' + error.message, 'error');
        return false;
    }
}

function updateCallUI(status) {
    const statusElement = document.getElementById('callStatusText');
    const messageElement = document.getElementById('callStatusMessage');
    
    if (!statusElement || !messageElement) return;
    
    switch (status) {
        case 'connecting':
            statusElement.textContent = 'Connecting...';
            messageElement.textContent = 'Please wait while we connect you';
            break;
        case 'connected':
            statusElement.textContent = 'Connected';
            messageElement.textContent = 'You are now connected';
            break;
        case 'disconnected':
            statusElement.textContent = 'Disconnected';
            messageElement.textContent = 'Connection lost';
            break;
    }
}

function updateConnectionQuality(stats) {
    const qualityElement = document.getElementById('connectionQuality');
    if (!qualityElement) return;
    
    const quality = stats.downlinkNetworkQuality || stats.uplinkNetworkQuality || 0;
    
    if (quality <= 1) {
        qualityElement.textContent = 'Excellent';
        qualityElement.style.color = '#48BB78';
    } else if (quality <= 3) {
        qualityElement.textContent = 'Good';
        qualityElement.style.color = '#38A169';
    } else if (quality <= 5) {
        qualityElement.textContent = 'Fair';
        qualityElement.style.color = '#ECC94B';
    } else {
        qualityElement.textContent = 'Poor';
        qualityElement.style.color = '#F56565';
    }
}

// ===== WHISPER MANAGEMENT =====
async function toggleAvailability() {
    if (!currentUser || userData.role !== 'whisper') {
        showToast('Only whispers can toggle availability', 'error');
        return;
    }
    
    const newStatus = !userData.isAvailable;
    await updateWhisperAvailability(newStatus);
    
    // Update local data
    userData.isAvailable = newStatus;
    
    // Update UI
    const toggle = document.getElementById('availabilityToggle');
    if (toggle) {
        toggle.checked = newStatus;
    }
}

async function loadWhispers() {
    try {
        const whispers = await getAvailableWhispers();
        const container = document.getElementById('whispersGrid');
        
        if (!container) return;
        
        if (whispers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <h3>No whispers available</h3>
                    <p>Check back later or refresh the page.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        whispers.forEach(whisper => {
            html += `
                <div class="whisper-card" data-whisper-id="${whisper.id}">
                    <div class="whisper-avatar">
                        ${whisper.avatarUrl ? 
                            `<img src="${whisper.avatarUrl}" alt="${whisper.displayName}">` : 
                            `<i class="fas fa-user"></i>`}
                    </div>
                    <div class="whisper-info">
                        <h3>${whisper.displayName}</h3>
                        <div class="whisper-category">${whisper.category || 'Entertainment'}</div>
                        <div class="whisper-rating">
                            <div class="stars">
                                ${generateStarRating(whisper.rating || 5.0)}
                            </div>
                            <span>${(whisper.rating || 5.0).toFixed(1)}</span>
                        </div>
                        <div class="whisper-stats">
                            <span><i class="fas fa-phone-alt"></i> ${whisper.totalCalls || 0} calls</span>
                            <span><i class="fas fa-clock"></i> ${formatDuration(whisper.avgDuration || 300)} avg</span>
                        </div>
                    </div>
                    <button class="btn-primary whisper-call-btn" onclick="startCall('${whisper.id}')">
                        <i class="fas fa-phone-alt"></i> Call - 1 Coin
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading whispers:', error);
        const container = document.getElementById('whispersGrid');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading whispers</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// ===== UTILITY FUNCTIONS =====
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateTime(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== PAYMENT PROCESSING =====
async function processCoinPurchase(coins, amount, productId) {
    if (!currentUser) {
        showToast('Please log in to purchase coins', 'error');
        showAuthModal('login');
        return;
    }
    
    showToast('Processing payment...', 'info');
    
    try {
        await initializeStripePayment(amount, coins, productId);
        
        // Update local user data
        if (userData) {
            userData.coins += coins;
            updateCoinBalance();
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        showToast('Payment failed: ' + error.message, 'error');
    }
}

// ===== PROFILE MANAGEMENT =====
async function updateUserProfile(profileData) {
    if (!currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            ...profileData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local data
        Object.assign(userData, profileData);
        
        showToast('Profile updated successfully', 'success');
        return true;
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile: ' + error.message, 'error');
        return false;
    }
}

async function uploadProfilePicture(file) {
    if (!currentUser || !file) return null;
    
    try {
        // Validate file
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showToast('File size must be less than 5MB', 'error');
            return null;
        }
        
        if (!file.type.match('image.*')) {
            showToast('Only image files are allowed', 'error');
            return null;
        }
        
        // Upload to Firebase Storage
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`avatars/${currentUser.uid}/${Date.now()}_${file.name}`);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        // Update user document
        await db.collection('users').doc(currentUser.uid).update({
            avatarUrl: downloadURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local data
        if (userData) {
            userData.avatarUrl = downloadURL;
        }
        
        showToast('Profile picture updated', 'success');
        return downloadURL;
        
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showToast('Error uploading image: ' + error.message, 'error');
        return null;
    }
}

// ===== NOTIFICATIONS =====
function showNotification(title, body, icon = null) {
    // Check if notifications are supported
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
    }
    
    // Check if permission is granted
    if (Notification.permission === "granted") {
        createNotification(title, body, icon);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                createNotification(title, body, icon);
            }
        });
    }
}

function createNotification(title, body, icon) {
    const options = {
        body: body,
        icon: icon || '/assets/favicon.ico',
        badge: '/assets/favicon.ico'
    };
    
    const notification = new Notification(title, options);
    
    // Close notification after 5 seconds
    setTimeout(() => {
        notification.close();
    }, 5000);
    
    // Handle click
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
}

// ===== WEBSOCKET/REALTIME UPDATES =====
function initializeRealtimeUpdates() {
    if (!currentUser) return;
    
    // Listen for incoming calls
    db.collection('activeCalls')
        .where('whisperId', '==', currentUser.uid)
        .where('status', '==', 'connecting')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const call = change.doc.data();
                    showIncomingCallNotification(call);
                }
            });
        });
    
    // Listen for call status updates
    db.collection('activeCalls')
        .where('participants', 'array-contains', currentUser.uid)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const call = change.doc.data();
                if (change.type === 'modified' && call.status === 'active') {
                    // Update call UI if on call page
                    if (window.location.pathname.includes('call.html')) {
                        updateCallUI('connected');
                    }
                }
            });
        });
}

function showIncomingCallNotification(call) {
    if (!call || !call.callerId) return;
    
    // Get caller info
    db.collection('users').doc(call.callerId).get().then((doc) => {
        if (doc.exists) {
            const caller = doc.data();
            const title = 'Incoming Call';
            const body = `${caller.displayName} is calling you`;
            
            // Show browser notification
            showNotification(title, body, caller.avatarUrl);
            
            // Show in-app notification if not on call page
            if (!window.location.pathname.includes('call.html')) {
                showToast(body, 'info');
            }
        }
    });
}

// ===== ERROR HANDLING =====
function handleFirebaseError(error) {
    console.error('Firebase error:', error);
    
    let message = 'An error occurred';
    let type = 'error';
    
    switch (error.code) {
        case 'permission-denied':
            message = 'You don\'t have permission to perform this action';
            break;
        case 'unavailable':
            message = 'Service is temporarily unavailable. Please try again later.';
            type = 'warning';
            break;
        case 'failed-precondition':
            message = 'Please refresh the page and try again';
            break;
        default:
            message = error.message || 'An unexpected error occurred';
    }
    
    showToast(message, type);
    return false;
}

// ===== INITIALIZATION =====
function initializeApp() {
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize auth state listeners
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                console.log('User authenticated:', user.email);
                
                // Load whispers if on home page
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                    loadWhispers();
                }
                
                // Initialize realtime updates
                initializeRealtimeUpdates();
                
                // Update UI
                updateUIForAuth(true);
            } else {
                // User is signed out
                console.log('User signed out');
                updateUIForAuth(false);
            }
        });
    }
    
    // Initialize event listeners
    document.addEventListener('click', (e) => {
        // Handle modal closing
        if (e.target.classList.contains('modal') || 
            e.target.classList.contains('modal-close') ||
            e.target.closest('.modal-close')) {
            closeModal();
        }
        
        // Handle auth modal tabs
        if (e.target.classList.contains('auth-tab')) {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            
            e.target.classList.add('active');
            const form = document.getElementById(`${tabId}Form`);
            if (form) form.classList.add('active');
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            if (email && password) {
                await loginUser(email, password);
            }
        });
    }
    
    // Handle signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail')?.value;
            const password = document.getElementById('signupPassword')?.value;
            const displayName = document.getElementById('displayName')?.value;
            const role = document.querySelector('input[name="role"]:checked')?.value || 'caller';
            
            if (email && password && displayName) {
                await signupUser(email, password, displayName, role);
            }
        });
    }
    
    // Handle Google login
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            await signInWithGoogle();
        });
    }
    
    console.log('App initialized successfully');
}

// ===== EXPORT FUNCTIONS =====
// Make functions available globally
window.initMobileMenu = initMobileMenu;
window.loginUser = loginUser;
window.signupUser = signupUser;
window.startCall = startCall;
window.endCall = endCall;
window.toggleAvailability = toggleAvailability;
window.loadWhispers = loadWhispers;
window.processRefund = processRefund;
window.processCoinPurchase = processCoinPurchase;
window.updateUserProfile = updateUserProfile;
window.uploadProfilePicture = uploadProfilePicture;
window.showNotification = showNotification;
window.formatDuration = formatDuration;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.initializeApp = initializeApp;
window.closeModal = closeModal;
window.showAuthModal = showAuthModal;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);