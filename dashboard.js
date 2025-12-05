import { 
    auth, db, storage, realtimeDb,
    signOut, onAuthStateChanged, deleteUser,
    collection, doc, getDoc, updateDoc, query, where, orderBy, getDocs,
    ref, uploadBytes, getDownloadURL,
    dbRef, set, onValue, update
} from './firebase-config.js';

// Global variables
let currentUser = null;
let userProfile = null;

// Initialize dashboard
function initDashboard() {
    console.log('Initializing dashboard...');
    
    // Check authentication state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile(user.uid);
            setupDashboardEventListeners();
            showSection('overview');
            updateUIForLoggedInUser();
            setupRealtimeStatusListener();
        } else {
            // Redirect to home if not logged in
            window.location.href = 'index.html';
        }
    });
}

async function loadUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            userProfile = userDoc.data();
            updateProfileUI();
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

function updateProfileUI() {
    if (!userProfile) return;
    
    // Update profile section
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');
    const profileBalance = document.getElementById('profileBalance');
    const totalEarnings = document.getElementById('totalEarnings');
    const totalCalls = document.getElementById('totalCalls');
    
    if (profileName) profileName.textContent = userProfile.name || 'No name';
    if (profileEmail) profileEmail.textContent = userProfile.email || 'No email';
    if (profileBio) profileBio.textContent = userProfile.bio || 'No bio provided';
    if (profileBalance) profileBalance.textContent = `$${userProfile.balance || 0}`;
    if (totalEarnings) totalEarnings.textContent = `$${userProfile.totalEarnings || 0}`;
    if (totalCalls) totalCalls.textContent = userProfile.totalCalls || 0;
    
    // Update availability toggle
    const availabilityToggle = document.getElementById('availabilityToggle');
    if (availabilityToggle) {
        availabilityToggle.checked = userProfile.available || false;
    }
}

function setupDashboardEventListeners() {
    console.log('Setting up dashboard event listeners...');
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Delete Account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    
    // Availability Toggle
    const availabilityToggle = document.getElementById('availabilityToggle');
    if (availabilityToggle) {
        availabilityToggle.addEventListener('change', handleAvailabilityToggle);
    }
    
    // Edit Profile
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) editProfileBtn.addEventListener('click', showEditProfileForm);
    
    // Save Profile
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
    
    // Cancel Edit
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEditProfile);
    
    // Withdraw Button
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) withdrawBtn.addEventListener('click', handleWithdraw);
}

// Make showSection available globally
window.showSection = function(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Add active class to clicked nav link
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific data
    switch(sectionId) {
        case 'history':
            loadCallHistory();
            break;
        case 'earnings':
            loadEarnings();
            break;
        case 'settings':
            // Already loaded
            break;
    }
};

async function handleAvailabilityToggle(e) {
    const isAvailable = e.target.checked;
    
    if (!currentUser) return;
    
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
        
        console.log('Availability updated to:', isAvailable);
    } catch (error) {
        console.error('Error updating availability:', error);
        // Revert toggle on error
        e.target.checked = !isAvailable;
        alert('Failed to update availability. Please try again.');
    }
}

function setupRealtimeStatusListener() {
    if (!currentUser) return;
    
    const statusRef = dbRef(realtimeDb, `status/${currentUser.uid}`);
    onValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        if (status) {
            const availabilityToggle = document.getElementById('availabilityToggle');
            if (availabilityToggle) {
                availabilityToggle.checked = status.available || false;
            }
        }
    });
}

async function loadCallHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    historyList.innerHTML = '<div class="loading">Loading call history...</div>';
    
    try {
        // This is a placeholder - you'll need to create a calls collection
        // For now, show a message
        historyList.innerHTML = '<div class="no-history">No call history yet. Start taking calls to see your history here.</div>';
    } catch (error) {
        console.error('Error loading call history:', error);
        historyList.innerHTML = '<div class="error">Error loading call history.</div>';
    }
}

async function loadEarnings() {
    const earningsList = document.getElementById('earningsList');
    if (!earningsList) return;
    
    earningsList.innerHTML = '<div class="loading">Loading earnings...</div>';
    
    try {
        // This is a placeholder - you'll need to create a transactions collection
        earningsList.innerHTML = `
            <div class="earnings-summary">
                <div class="earnings-item">
                    <span class="earnings-label">Total Balance:</span>
                    <span class="earnings-amount">$${userProfile?.balance || 0}</span>
                </div>
                <div class="earnings-item">
                    <span class="earnings-label">Total Earnings:</span>
                    <span class="earnings-amount">$${userProfile?.totalEarnings || 0}</span>
                </div>
                <div class="earnings-item">
                    <span class="earnings-label">Total Calls:</span>
                    <span class="earnings-amount">${userProfile?.totalCalls || 0}</span>
                </div>
            </div>
            <div class="no-earnings">Detailed earnings history coming soon!</div>
        `;
    } catch (error) {
        console.error('Error loading earnings:', error);
        earningsList.innerHTML = '<div class="error">Error loading earnings.</div>';
    }
}

function showEditProfileForm() {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('profileEdit').style.display = 'block';
    
    // Populate form fields
    document.getElementById('editName').value = userProfile?.name || '';
    document.getElementById('editBio').value = userProfile?.bio || '';
    document.getElementById('editEmail').value = userProfile?.email || '';
}

function cancelEditProfile() {
    document.getElementById('profileEdit').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
}

async function saveProfile() {
    const name = document.getElementById('editName').value;
    const bio = document.getElementById('editBio').value;
    
    if (!name.trim()) {
        alert('Name is required');
        return;
    }
    
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            name: name,
            bio: bio
        });
        
        // Reload profile
        await loadUserProfile(currentUser.uid);
        
        cancelEditProfile();
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
    }
}

async function handleWithdraw() {
    if (!userProfile || userProfile.balance < 50) {
        alert('Minimum withdrawal amount is $50. Your current balance is too low.');
        return;
    }
    
    if (!confirm(`Request withdrawal of $${userProfile.balance}? This will be processed within 3-5 business days.`)) {
        return;
    }
    
    // This is a placeholder - you'll need to integrate with Stripe Connect or another payment processor
    alert('Withdrawal feature coming soon! For now, please contact support to withdraw your earnings.');
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
        alert(`Logout Error: ${error.message}`);
    }
}

async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.')) {
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
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Delete account error:', error);
        alert(`Error: ${error.message}`);
    }
}

function updateUIForLoggedInUser() {
    // Nothing needed here for dashboard
    console.log('User logged in, dashboard ready');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    setTimeout(initDashboard, 0);
}
