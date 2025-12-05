import { 
    auth, db, storage, realtimeDb, stripe, agoraConfig,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser,
    collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where, onSnapshot,
    ref, uploadBytes, getDownloadURL,
    dbRef, set, onValue, push, remove, update,
    serverTimestamp, addDoc
} from './firebase-config.js';

// DOM Elements
let currentUser = null;
let currentCall = null;
let agoraClient = null;
let agoraLocalTracks = null;

// Initialize app only once
function initApp() {
    console.log('App initializing...');
    
    // Check authentication state
    onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        if (user) {
            currentUser = user;
            updateUIForLoggedInUser();
            await loadUserProfile(user.uid);
            setupRealtimeListeners(user.uid);
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });

    // Event Listeners
    setupEventListeners();
    
    // Load whispers
    loadWhispers();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Auth modal
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const modal = document.getElementById('authModal');
    const closeBtn = modal ? modal.querySelector('.close') : null;
    const switchToLogin = document.getElementById('switchToLogin');
    const switchToSignup = document.getElementById('switchToSignup');
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const startWhisperingBtn = document.getElementById('startWhispering');
    const availableOnlyToggle = document.getElementById('availableOnly');

    if (signupBtn) {
        console.log('Signup button found');
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Signup button clicked');
            openAuthModal('signup');
        });
    }
    
    if (loginBtn) {
        console.log('Login button found');
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Login button clicked');
            openAuthModal('login');
        });
    }
    
    if (closeBtn) closeBtn.addEventListener('click', () => closeAuthModal());
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('login');
        });
    }
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('signup');
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    
    if (startWhisperingBtn) {
        console.log('Start Whispering button found');
        startWhisperingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Start Whispering button clicked');
            openAuthModal('signup');
        });
    }
    
    if (availableOnlyToggle) availableOnlyToggle.addEventListener('change', filterAvailableWhispers);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (modal && e.target === modal) {
            closeAuthModal();
        }
    });
}

function openAuthModal(formType) {
    console.log('Opening auth modal for:', formType);
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'block';
        switchAuthForm(formType);
    } else {
        console.error('Auth modal not found!');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchAuthForm(formType) {
    const forms = document.querySelectorAll('.form-container');
    const formTitle = document.getElementById('formTitle');
    
    forms.forEach(form => form.style.display = 'none');
    
    if (formType === 'signup') {
        const signupFormContainer = document.querySelector('#signupForm').parentElement;
        if (signupFormContainer) {
            signupFormContainer.style.display = 'block';
        }
        if (formTitle) formTitle.textContent = 'Sign Up';
    } else {
        const loginFormContainer = document.querySelector('#loginForm').parentElement;
        if (loginFormContainer) {
            loginFormContainer.style.display = 'block';
        }
        if (formTitle) formTitle.textContent = 'Login';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    console.log('Handling signup...');
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const bio = document.getElementById('signupBio').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            bio: bio || '',
            isWhisper: true,
            available: false,
            createdAt: serverTimestamp(),
            balance: 0,
            totalEarnings: 0,
            totalCalls: 0
        });
        
        // Create realtime status node
        await set(dbRef(realtimeDb, `status/${user.uid}`), {
            available: false,
            lastSeen: Date.now()
        });
        
        closeAuthModal();
        alert('Account created successfully! You can now log in.');
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Error creating account. ';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage += 'This email is already registered. Please use a different email or log in.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage += 'Password is too weak. Please use at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += 'Email address is invalid.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('Handling login...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        closeAuthModal();
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. ';
        if (error.code === 'auth/invalid-credential') {
            errorMessage += 'Invalid email or password. Please try again.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage += 'No account found with this email. Please sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage += 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage += 'Too many failed attempts. Please try again later.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

async function handleLogout() {
    try {
        if (currentUser) {
            // Update status to offline
            await update(dbRef(realtimeDb, `status/${currentUser.uid}`), {
                available: false,
                lastSeen: Date.now()
            });
        }
        
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
        alert(`Logout Error: ${error.message}`);
    }
}

async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    try {
        const user = auth.currentUser;
        
        // Delete user data from Firestore
        await deleteDoc(doc(db, 'users', user.uid));
        
        // Delete from Realtime Database
        await remove(dbRef(realtimeDb, `status/${user.uid}`));
        
        // Delete storage files (profile picture)
        try {
            const storageRef = ref(storage, `profile-pictures/${user.uid}`);
            await deleteObject(storageRef);
        } catch (storageError) {
            console.log('No profile picture to delete');
        }
        
        // Delete authentication
        await deleteUser(user);
        
        alert('Account deleted successfully');
    } catch (error) {
        console.error('Delete account error:', error);
        alert(`Error: ${error.message}`);
    }
}

function updateUIForLoggedInUser() {
    console.log('Updating UI for logged in user');
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const searchBtn = document.getElementById('searchBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    if (signupBtn) signupBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'none';
    if (dashboardBtn) dashboardBtn.style.display = 'flex';
    if (searchBtn) searchBtn.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'flex';
    if (deleteAccountBtn) deleteAccountBtn.style.display = 'flex';
}

function updateUIForLoggedOutUser() {
    console.log('Updating UI for logged out user');
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const searchBtn = document.getElementById('searchBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    if (signupBtn) signupBtn.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'flex';
    if (dashboardBtn) dashboardBtn.style.display = 'none';
    if (searchBtn) searchBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (deleteAccountBtn) deleteAccountBtn.style.display = 'none';
}

async function loadUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data();
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
    return null;
}

async function loadWhispers() {
    const whispersGrid = document.getElementById('whispersGrid');
    if (!whispersGrid) return;
    
    try {
        const q = query(collection(db, 'users'), where('isWhisper', '==', true));
        const querySnapshot = await getDocs(q);
        
        whispersGrid.innerHTML = '';
        
        if (querySnapshot.empty) {
            whispersGrid.innerHTML = '<div class="loading">No whispers found. Be the first to sign up!</div>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const whisper = doc.data();
            createWhisperCard(whisper);
        });
        
        // Listen for real-time status updates
        onValue(dbRef(realtimeDb, 'status'), (snapshot) => {
            const statuses = snapshot.val() || {};
            updateWhisperStatuses(statuses);
        });
        
    } catch (error) {
        console.error('Error loading whispers:', error);
        whispersGrid.innerHTML = '<div class="error">Error loading whispers. Please refresh the page.</div>';
    }
}

function createWhisperCard(whisper) {
    const whispersGrid = document.getElementById('whispersGrid');
    if (!whispersGrid) return;
    
    const card = document.createElement('div');
    card.className = 'whisper-card';
    card.id = `whisper-${whisper.uid}`;
    card.innerHTML = `
        <div class="whisper-header">
            <img src="${whisper.photoURL || 'https://via.placeholder.com/60'}" 
                 alt="${whisper.name}" 
                 class="whisper-avatar"
                 onerror="this.src='https://via.placeholder.com/60'">
            <div>
                <h3 class="whisper-name">${whisper.name}</h3>
                <div class="status-indicator">
                    <span class="status-dot"></span>
                    <span class="status-text">Loading...</span>
                </div>
            </div>
        </div>
        <p class="whisper-bio">${whisper.bio || 'No bio provided'}</p>
        <button class="call-btn" onclick="startCall('${whisper.uid}')">
            <i class="fas fa-phone"></i> Call Now - $15
        </button>
    `;
    
    whispersGrid.appendChild(card);
}

function updateWhisperStatuses(statuses) {
    Object.keys(statuses).forEach(uid => {
        const status = statuses[uid];
        const card = document.getElementById(`whisper-${uid}`);
        if (card) {
            const statusDot = card.querySelector('.status-dot');
            const statusText = card.querySelector('.status-text');
            const callBtn = card.querySelector('.call-btn');
            
            if (status.available) {
                statusDot.className = 'status-dot available';
                statusText.textContent = 'Available Now';
                card.classList.add('available');
                if (callBtn) callBtn.disabled = false;
            } else {
                statusDot.className = 'status-dot busy';
                statusText.textContent = 'Busy';
                card.classList.remove('available');
                if (callBtn) callBtn.disabled = true;
            }
        }
    });
}

function filterAvailableWhispers() {
    const showAvailableOnly = document.getElementById('availableOnly').checked;
    const cards = document.querySelectorAll('.whisper-card');
    
    cards.forEach(card => {
        if (showAvailableOnly) {
            card.style.display = card.classList.contains('available') ? 'block' : 'none';
        } else {
            card.style.display = 'block';
        }
    });
}

async function startCall(whisperId) {
    if (!currentUser) {
        openAuthModal('login');
        return;
    }
    
    // Check if whisper is available
    const statusRef = dbRef(realtimeDb, `status/${whisperId}`);
    onValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        if (!status || !status.available) {
            alert('This whisper is currently unavailable. Please choose another.');
            return;
        }
        
        // Redirect to payment page
        window.location.href = `payment.html?whisper=${whisperId}`;
    }, { once: true });
}

function setupRealtimeListeners(userId) {
    // Listen for incoming calls
    const callsRef = dbRef(realtimeDb, `calls/${userId}/waiting`);
    onValue(callsRef, (snapshot) => {
        const calls = snapshot.val();
        if (calls) {
            showCallNotification(Object.values(calls)[0]);
        }
    });
}

function showCallNotification(call) {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'call-notification';
    notification.innerHTML = `
        <p>New call from ${call.customerEmail}</p>
        <button onclick="answerCall('${call.id}')">Answer</button>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 30 seconds
    setTimeout(() => {
        notification.remove();
    }, 30000);
}

// Make functions available globally
window.startCall = startCall;
window.answerCall = async function(callId) {
    // Redirect to chat room
    window.location.href = `chatroom.html?call=${callId}`;
};

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    setTimeout(initApp, 0);
}
