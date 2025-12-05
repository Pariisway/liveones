import { 
    auth, db, storage, realtimeDb,
    onAuthStateChanged, signOut,
    doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy,
    ref, uploadBytes, getDownloadURL,
    dbRef, set, update, onValue
} from './firebase-config.js';

let currentUser = null;
let userProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    // Check authentication
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadDashboardData(user.uid);
            setupDashboardListeners(user.uid);
        } else {
            // Redirect to home if not logged in
            window.location.href = 'index.html';
        }
    });

    // Setup event listeners
    setupEventListeners();
}

async function loadDashboardData(userId) {
    try {
        // Load user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            userProfile = userDoc.data();
            updateProfileDisplay();
            updateStatsDisplay();
        }

        // Load call history
        await loadCallHistory(userId);
        
        // Load payment history
        await loadPaymentHistory(userId);
        
        // Load bank info
        await loadBankInfo(userId);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateProfileDisplay() {
    if (!userProfile) return;
    
    document.getElementById('profileName').textContent = userProfile.name;
    document.getElementById('profileEmail').textContent = userProfile.email;
    document.getElementById('editName').value = userProfile.name;
    document.getElementById('editBio').value = userProfile.bio || '';
    document.getElementById('bioCount').textContent = (userProfile.bio || '').length;
    
    if (userProfile.photoURL) {
        document.getElementById('profileAvatar').src = userProfile.photoURL;
    }
    
    // Set availability toggle
    const availabilityToggle = document.getElementById('availabilityToggle');
    if (availabilityToggle) {
        availabilityToggle.checked = userProfile.available || false;
    }
}

function updateStatsDisplay() {
    if (!userProfile) return;
    
    document.getElementById('totalEarnings').textContent = `$${userProfile.totalEarnings || 0}`;
    document.getElementById('totalCalls').textContent = userProfile.totalCalls || 0;
    document.getElementById('balanceAmount').textContent = `$${userProfile.balance || 0}`;
    
    // Calculate next payout date (every 3 days)
    const nextPayout = new Date();
    nextPayout.setDate(nextPayout.getDate() + 3);
    document.getElementById('nextPayout').textContent = nextPayout.toLocaleDateString();
    document.getElementById('payoutDate').textContent = nextPayout.toLocaleDateString();
    document.getElementById('availableBalance').textContent = `$${userProfile.balance || 0}`;
}

async function loadCallHistory(userId) {
    try {
        const callsQuery = query(
            collection(db, 'calls'),
            where('whisperId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(callsQuery);
        const callsBody = document.getElementById('callHistoryBody');
        const recentCallsBody = document.getElementById('recentCallsBody');
        
        if (callsBody) callsBody.innerHTML = '';
        if (recentCallsBody) recentCallsBody.innerHTML = '';
        
        let todayCalls = 0;
        const today = new Date().toDateString();
        
        querySnapshot.forEach((doc, index) => {
            const call = doc.data();
            const callDate = call.createdAt?.toDate() || new Date();
            
            // Count today's calls
            if (callDate.toDateString() === today) {
                todayCalls++;
            }
            
            const row = `
                <tr>
                    <td>${callDate.toLocaleString()}</td>
                    <td>${call.customerEmail || 'N/A'}</td>
                    <td>${call.duration || '5:00'}</td>
                    <td>$${call.whisperEarnings || '12.00'}</td>
                    <td>${call.status || 'Completed'}</td>
                </tr>
            `;
            
            if (callsBody) callsBody.innerHTML += row;
            
            // Add to recent calls (first 5)
            if (index < 5 && recentCallsBody) {
                recentCallsBody.innerHTML += row;
            }
        });
        
        document.getElementById('todayCalls').textContent = todayCalls;
        
    } catch (error) {
        console.error('Error loading call history:', error);
    }
}

async function loadPaymentHistory(userId) {
    try {
        const paymentsQuery = query(
            collection(db, 'payments'),
            where('whisperId', '==', userId),
            orderBy('paidAt', 'desc')
        );
        
        const querySnapshot = await getDocs(paymentsQuery);
        const paymentHistoryBody = document.getElementById('paymentHistoryBody');
        
        if (paymentHistoryBody) paymentHistoryBody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const payment = doc.data();
            const paymentDate = payment.paidAt?.toDate() || new Date();
            
            const row = `
                <tr>
                    <td>${paymentDate.toLocaleDateString()}</td>
                    <td>$${payment.amount || '0.00'}</td>
                    <td>${payment.status || 'Completed'}</td>
                    <td>${payment.callCount || '0'} calls</td>
                </tr>
            `;
            
            if (paymentHistoryBody) paymentHistoryBody.innerHTML += row;
        });
        
    } catch (error) {
        console.error('Error loading payment history:', error);
    }
}

async function loadBankInfo(userId) {
    try {
        const bankDoc = await getDoc(doc(db, 'bankInfo', userId));
        if (bankDoc.exists()) {
            const bankInfo = bankDoc.data();
            document.getElementById('bankName').value = bankInfo.bankName || '';
            document.getElementById('accountName').value = bankInfo.accountName || '';
            document.getElementById('accountNumber').value = bankInfo.accountNumber || '';
            document.getElementById('routingNumber').value = bankInfo.routingNumber || '';
            document.getElementById('accountType').value = bankInfo.accountType || 'checking';
        }
    } catch (error) {
        console.error('Error loading bank info:', error);
    }
}

function setupEventListeners() {
    // Section navigation
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('onclick').match(/'(.*?)'/)[1];
            showSection(sectionId);
            
            // Update active class
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Bio character counter
    const editBio = document.getElementById('editBio');
    if (editBio) {
        editBio.addEventListener('input', (e) => {
            document.getElementById('bioCount').textContent = e.target.value.length;
        });
    }
    
    // Avatar upload
    const avatarInput = document.getElementById('avatarInput');
    const avatarUpload = document.querySelector('.avatar-upload');
    if (avatarInput && avatarUpload) {
        avatarUpload.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', handleAvatarUpload);
    }
    
    // Availability toggle
    const availabilityToggle = document.getElementById('availabilityToggle');
    if (availabilityToggle) {
        availabilityToggle.addEventListener('change', handleAvailabilityToggle);
    }
    
    // Bank form submission
    const bankForm = document.getElementById('bankForm');
    if (bankForm) {
        bankForm.addEventListener('submit', handleBankInfoUpdate);
    }
    
    // Settings checkboxes
    const settingsCheckboxes = document.querySelectorAll('.setting-item input[type="checkbox"]');
    settingsCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleSettingChange);
    });
    
    // Delete account button
    const deleteBtn = document.getElementById('deleteDashboardAccount');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteAccount);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('dashboardLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const name = document.getElementById('editName').value;
    const bio = document.getElementById('editBio').value;
    
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            name: name,
            bio: bio,
            updatedAt: new Date()
        });
        
        userProfile.name = name;
        userProfile.bio = bio;
        updateProfileDisplay();
        
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
    }
}

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    try {
        // Upload to Firebase Storage
        const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
        await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update user profile with new photo URL
        await updateDoc(doc(db, 'users', currentUser.uid), {
            photoURL: downloadURL
        });
        
        // Update displayed image
        document.getElementById('profileAvatar').src = downloadURL;
        userProfile.photoURL = downloadURL;
        
        alert('Profile picture updated successfully!');
    } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Error uploading profile picture. Please try again.');
    }
}

async function handleAvailabilityToggle(e) {
    if (!currentUser) return;
    
    const isAvailable = e.target.checked;
    
    try {
        // Update Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
            available: isAvailable
        });
        
        // Update Realtime Database
        await update(dbRef(realtimeDb, `status/${currentUser.uid}`), {
            available: isAvailable,
            lastSeen: Date.now()
        });
        
        userProfile.available = isAvailable;
        
        // Show status message
        showStatusMessage(`You are now ${isAvailable ? 'available' : 'unavailable'} for calls`);
        
    } catch (error) {
        console.error('Error updating availability:', error);
        alert('Error updating availability. Please try again.');
    }
}

async function handleBankInfoUpdate(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const bankInfo = {
        bankName: document.getElementById('bankName').value,
        accountName: document.getElementById('accountName').value,
        accountNumber: document.getElementById('accountNumber').value,
        routingNumber: document.getElementById('routingNumber').value,
        accountType: document.getElementById('accountType').value,
        updatedAt: new Date()
    };
    
    try {
        await setDoc(doc(db, 'bankInfo', currentUser.uid), bankInfo, { merge: true });
        alert('Bank information updated successfully!');
    } catch (error) {
        console.error('Error updating bank info:', error);
        alert('Error updating bank information. Please try again.');
    }
}

function handleSettingChange(e) {
    const settingId = e.target.id;
    const value = e.target.checked;
    
    // Save setting to localStorage or Firestore
    localStorage.setItem(`setting_${settingId}`, value);
    
    // Show confirmation
    showStatusMessage(`Setting updated: ${settingId.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
}

async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    try {
        const user = auth.currentUser;
        
        // Delete user data from Firestore
        await Promise.all([
            deleteDoc(doc(db, 'users', user.uid)),
            deleteDoc(doc(db, 'bankInfo', user.uid))
        ]);
        
        // Delete from Realtime Database
        await remove(dbRef(realtimeDb, `status/${user.uid}`));
        
        // Delete storage files
        try {
            const storageRef = ref(storage, `profile-pictures/${user.uid}`);
            await deleteObject(storageRef);
        } catch (storageError) {
            console.log('No profile picture to delete');
        }
        
        // Delete authentication
        await user.delete();
        
        alert('Account deleted successfully');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Delete account error:', error);
        alert(`Error: ${error.message}`);
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
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function setupDashboardListeners(userId) {
    // Listen for incoming calls
    const callsRef = dbRef(realtimeDb, `calls/${userId}/waiting`);
    onValue(callsRef, (snapshot) => {
        const calls = snapshot.val();
        if (calls) {
            showWaitingCalls(calls);
        }
    });
}

function showWaitingCalls(calls) {
    const waitingCalls = document.getElementById('waitingCalls');
    const waitingCallsList = document.getElementById('waitingCallsList');
    
    if (!waitingCalls || !waitingCallsList) return;
    
    waitingCallsList.innerHTML = '';
    const callIds = Object.keys(calls);
    
    if (callIds.length > 0) {
        waitingCalls.style.display = 'block';
        
        callIds.forEach(callId => {
            const call = calls[callId];
            const callItem = document.createElement('div');
            callItem.className = 'waiting-call-item';
            callItem.innerHTML = `
                <p><strong>New Call</strong></p>
                <p>From: ${call.customerEmail}</p>
                <button onclick="answerDashboardCall('${callId}')" class="btn-primary">
                    Answer Call
                </button>
            `;
            waitingCallsList.appendChild(callItem);
        });
    } else {
        waitingCalls.style.display = 'none';
    }
}

function showStatusMessage(message) {
    // Create and show temporary status message
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-message';
    statusDiv.textContent = message;
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-red);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: var(--glow);
        z-index: 1000;
    `;
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.remove();
    }, 3000);
}

// Make functions available globally
window.showSection = showSection;
window.answerDashboardCall = async function(callId) {
    // Redirect to chat room
    window.location.href = `chatroom.html?call=${callId}&role=whisper`;
};
