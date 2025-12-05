import { 
    auth, db, storage, realtimeDb,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
    collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, serverTimestamp,
    ref, uploadBytes, getDownloadURL,
    dbRef, set, onValue, push
} from './firebase-config.js';

// Remove the Stripe import since it's not in firebase-config.js anymore
// import { stripe } from './firebase-config.js'; // <-- REMOVE THIS LINE

// DOM Elements
const elements = {
    // ... (keep your existing elements)
};

// Global variables
let currentUser = null;
let agoraClient = null;
let agoraStream = null;
let currentChannel = null;
let currentCall = null;
let currentCallStartTime = null;
let callTimer = null;
let callDuration = 0;

// Initialize app
function initApp() {
    console.log('Initializing WhisperChat...');
    setupEventListeners();
    checkAuthState();
    loadAvailableListeners();
    
    // Remove any Stripe initialization code
    // if (typeof Stripe !== 'undefined') {
    //     // Stripe initialization removed
    // }
}

function setupEventListeners() {
    // Auth buttons
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', showLoginForm);
    }
    if (elements.signupBtn) {
        elements.signupBtn.addEventListener('click', showSignupForm);
    }
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    if (elements.authCancelBtn) {
        elements.authCancelBtn.addEventListener('click', hideAuthForm);
    }
    
    // Auth forms
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', handleSignup);
    }
    
    // Navigation
    if (elements.becomeListenerBtn) {
        elements.becomeListenerBtn.addEventListener('click', () => {
            if (currentUser) {
                window.location.href = 'dashboard.html';
            } else {
                showSignupForm();
                alert('Please sign up first to become a listener!');
            }
        });
    }
    
    // Call controls (if they exist)
    if (elements.endCallBtn) {
        elements.endCallBtn.addEventListener('click', endCurrentCall);
    }
    if (elements.toggleMuteBtn) {
        elements.toggleMuteBtn.addEventListener('click', toggleMute);
    }
    if (elements.toggleVideoBtn) {
        elements.toggleVideoBtn.addEventListener('click', toggleVideo);
    }
    
    // Payment (remove or comment out Stripe payment)
    // if (elements.paymentForm) {
    //     elements.paymentForm.addEventListener('submit', handlePayment);
    // }
}

function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            updateUIForLoggedInUser(user);
            loadUserProfile(user.uid);
            
            // Update user status in Realtime DB
            updateUserStatus(user.uid, true);
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
            
            // If on call page and not logged in, redirect
            if (window.location.pathname.includes('call.html')) {
                window.location.href = 'index.html';
            }
        }
    });
}

async function loadUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Update UI with user data
            if (elements.userName) {
                elements.userName.textContent = userData.name || 'User';
            }
            
            if (elements.userBalance) {
                elements.userBalance.textContent = `$${userData.balance || 0}`;
            }
            
            // Show/hide listener dashboard button
            if (elements.dashboardBtn) {
                elements.dashboardBtn.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function updateUserStatus(userId, isOnline) {
    try {
        const statusRef = dbRef(realtimeDb, `status/${userId}`);
        await set(statusRef, {
            online: isOnline,
            lastSeen: Date.now(),
            available: false // Default to not available for calls
        });
    } catch (error) {
        console.error('Error updating user status:', error);
    }
}

async function loadAvailableListeners() {
    const listenersList = document.getElementById('listenersList');
    if (!listenersList) return;
    
    listenersList.innerHTML = '<div class="loading">Loading available listeners...</div>';
    
    try {
        // Query users who are available
        const q = query(collection(db, 'users'), where('available', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            listenersList.innerHTML = '<div class="no-listeners">No listeners available right now. Check back later!</div>';
            return;
        }
        
        let html = '<div class="listeners-grid">';
        querySnapshot.forEach((doc) => {
            const listener = doc.data();
            html += `
                <div class="listener-card" data-uid="${doc.id}">
                    <div class="listener-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="listener-info">
                        <h4>${listener.name || 'Anonymous Listener'}</h4>
                        <p class="listener-bio">${listener.bio || 'Ready to listen and help'}</p>
                        <div class="listener-stats">
                            <span><i class="fas fa-star"></i> ${listener.rating || '4.8'}</span>
                            <span><i class="fas fa-phone"></i> ${listener.totalCalls || 0} calls</span>
                        </div>
                    </div>
                    <button class="btn btn-primary call-btn" onclick="startCallWithListener('${doc.id}', '${listener.name || 'Listener'}')">
                        <i class="fas fa-phone"></i> Call Now
                    </button>
                </div>
            `;
        });
        html += '</div>';
        listenersList.innerHTML = html;
    } catch (error) {
        console.error('Error loading listeners:', error);
        listenersList.innerHTML = '<div class="error">Error loading listeners. Please try again.</div>';
    }
}

// Make startCallWithListener globally available
window.startCallWithListener = async function(listenerId, listenerName) {
    if (!currentUser) {
        showLoginForm();
        alert('Please login or sign up to start a call!');
        return;
    }
    
    try {
        // Create a call document
        const callData = {
            callerId: currentUser.uid,
            listenerId: listenerId,
            status: 'initiating',
            createdAt: serverTimestamp(),
            callerName: currentUser.displayName || 'Anonymous',
            listenerName: listenerName
        };
        
        const callRef = await addDoc(collection(db, 'calls'), callData);
        currentCall = callRef.id;
        
        // Redirect to call page
        window.location.href = `call.html?callId=${currentCall}&listenerId=${listenerId}`;
    } catch (error) {
        console.error('Error starting call:', error);
        alert('Failed to start call. Please try again.');
    }
};

// Auth functions (keep your existing auth functions)
async function handleLogin(e) {
    e.preventDefault();
    const email = elements.loginEmail.value;
    const password = elements.loginPassword.value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
        hideAuthForm();
        alert('Login successful!');
    } catch (error) {
        console.error('Login error:', error);
        alert(`Login Error: ${error.message}`);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = elements.signupName.value;
    const email = elements.signupEmail.value;
    const password = elements.signupPassword.value;
    const confirmPassword = elements.signupConfirmPassword.value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            name: name,
            balance: 0,
            totalEarnings: 0,
            totalCalls: 0,
            rating: 0,
            available: false,
            createdAt: serverTimestamp(),
            bio: 'New WhisperChat user'
        });
        
        console.log('User created:', user);
        hideAuthForm();
        alert('Account created successfully! You can now become a listener.');
    } catch (error) {
        console.error('Signup error:', error);
        alert(`Signup Error: ${error.message}`);
    }
}

async function handleLogout() {
    try {
        if (currentUser) {
            // Update status to offline
            await updateUserStatus(currentUser.uid, false);
        }
        
        await signOut(auth);
        alert('Logged out successfully!');
    } catch (error) {
        console.error('Logout error:', error);
        alert(`Logout Error: ${error.message}`);
    }
}

// UI Functions
function showLoginForm() {
    if (elements.authModal) elements.authModal.style.display = 'flex';
    if (elements.loginForm) elements.loginForm.style.display = 'block';
    if (elements.signupForm) elements.signupForm.style.display = 'none';
}

function showSignupForm() {
    if (elements.authModal) elements.authModal.style.display = 'flex';
    if (elements.loginForm) elements.loginForm.style.display = 'none';
    if (elements.signupForm) elements.signupForm.style.display = 'block';
}

function hideAuthForm() {
    if (elements.authModal) elements.authModal.style.display = 'none';
    // Clear form fields
    if (elements.loginEmail) elements.loginEmail.value = '';
    if (elements.loginPassword) elements.loginPassword.value = '';
    if (elements.signupName) elements.signupName.value = '';
    if (elements.signupEmail) elements.signupEmail.value = '';
    if (elements.signupPassword) elements.signupPassword.value = '';
    if (elements.signupConfirmPassword) elements.signupConfirmPassword.value = '';
}

function updateUIForLoggedInUser(user) {
    // Show user info and hide auth buttons
    if (elements.userInfo) elements.userInfo.style.display = 'flex';
    if (elements.authButtons) elements.authButtons.style.display = 'none';
    if (elements.dashboardBtn) elements.dashboardBtn.style.display = 'block';
    
    // Update user name
    if (elements.userName) {
        elements.userName.textContent = user.displayName || user.email || 'User';
    }
}

function updateUIForLoggedOutUser() {
    // Hide user info and show auth buttons
    if (elements.userInfo) elements.userInfo.style.display = 'none';
    if (elements.authButtons) elements.authButtons.style.display = 'flex';
    if (elements.dashboardBtn) elements.dashboardBtn.style.display = 'none';
}

// Call functions (simplified for now)
async function endCurrentCall() {
    if (currentCall) {
        // Update call status in Firestore
        try {
            await updateDoc(doc(db, 'calls', currentCall), {
                status: 'ended',
                endedAt: serverTimestamp(),
                duration: callDuration
            });
        } catch (error) {
            console.error('Error updating call:', error);
        }
        
        // Reset call variables
        currentCall = null;
        currentCallStartTime = null;
        callDuration = 0;
        
        if (callTimer) {
            clearInterval(callTimer);
            callTimer = null;
        }
        
        // Redirect to home
        window.location.href = 'index.html';
    }
}

function toggleMute() {
    if (agoraStream) {
        const audioTrack = agoraStream.getAudioTrack();
        if (audioTrack) {
            audioTrack.setEnabled(!audioTrack.enabled);
            const muteBtn = document.getElementById('toggleMuteBtn');
            if (muteBtn) {
                muteBtn.innerHTML = audioTrack.enabled ? 
                    '<i class="fas fa-microphone"></i>' : 
                    '<i class="fas fa-microphone-slash"></i>';
            }
        }
    }
}

function toggleVideo() {
    if (agoraStream) {
        const videoTrack = agoraStream.getVideoTrack();
        if (videoTrack) {
            videoTrack.setEnabled(!videoTrack.enabled);
            const videoBtn = document.getElementById('toggleVideoBtn');
            if (videoBtn) {
                videoBtn.innerHTML = videoTrack.enabled ? 
                    '<i class="fas fa-video"></i>' : 
                    '<i class="fas fa-video-slash"></i>';
            }
        }
    }
}

// Payment function (removed Stripe integration for now)
// function handlePayment(e) {
//     e.preventDefault();
//     alert('Payment feature coming soon!');
// }

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    setTimeout(initApp, 0);
}

// Export functions that need to be globally available
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;
window.hideAuthForm = hideAuthForm;
