// Enhanced Whisper Dashboard JavaScript
console.log('🎛️ Enhanced whisper dashboard loaded');

let currentUser = null;
let userData = null;
let unsubscribeCalls = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM ready, checking auth...');
    firebase.auth().onAuthStateChanged(handleAuthStateChange);
    initParticles();
});

function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    // Create 30 particles
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size and position
        const size = Math.random() * 4 + 1;
        const left = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 20;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = left + '%';
        particle.style.animationDuration = duration + 's';
        particle.style.animationDelay = delay + 's';
        particle.style.opacity = Math.random() * 0.3 + 0.1;
        
        particlesContainer.appendChild(particle);
    }
}

async function handleAuthStateChange(user) {
    if (!user) {
        console.log('👤 No user, redirecting to login...');
        window.location.href = 'whisper-login.html';
        return;
    }
    
    console.log('👤 User authenticated:', user.email);
    currentUser = user;
    await loadUserData(user);
    setupCallListeners(user.uid);
    setupEventListeners();
}

async function loadUserData(user) {
    try {
        console.log('📥 Loading user data for:', user.uid);
        
        // Update UI with basic info
        document.getElementById('displayName').value = user.email.split('@')[0];
        document.getElementById('profileEmail').value = user.email;
        
        // Update profile avatar
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            console.log('📊 User data loaded:', userData);
            
            // Update stats
            document.getElementById('totalEarnings').textContent = '$' + (userData.totalEarnings || 0).toFixed(2);
            document.getElementById('totalCalls').textContent = userData.totalCalls || 0;
            document.getElementById('weeklyEarnings').textContent = '$' + (userData.weeklyEarnings || 0).toFixed(2);
            document.getElementById('rating').textContent = (userData.rating || 5.0).toFixed(1);
            
            // Update form fields
            if (userData.username) {
                document.getElementById('displayName').value = userData.username;
            }
            if (userData.bio) {
                document.getElementById('profileBio').value = userData.bio;
                updateBioCounter();
            }
            if (userData.photoURL) {
                document.getElementById('profileAvatar').src = userData.photoURL;
            }
            
            // Update availability toggle
            const isAvailable = userData.isAvailable || false;
            document.getElementById('availabilityToggle').checked = isAvailable;
            updateAvailabilityUI(isAvailable);
            
        } else {
            console.log('📝 Creating new user document...');
            // Create user document
            await userRef.set({
                email: user.email,
                username: user.email.split('@')[0],
                bio: 'I\'m a good listener who enjoys helping people through conversation.',
                isAvailable: false,
                totalEarnings: 0,
                totalCalls: 0,
                weeklyEarnings: 0,
                todayEarnings: 0,
                rating: 5.0,
                userType: 'whisper',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            userData = { isAvailable: false };
            updateAvailabilityUI(false);
        }
        
        console.log('✅ User data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading user data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

function setupEventListeners() {
    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateProfile();
    });
    
    // Availability toggle
    document.getElementById('availabilityToggle').addEventListener('change', async function() {
        await updateAvailability(this.checked);
    });
    
    // Avatar upload
    document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);
    
    // Bio character counter
    document.getElementById('profileBio').addEventListener('input', updateBioCounter);
}

function updateBioCounter() {
    const bio = document.getElementById('profileBio').value;
    document.getElementById('bioCounter').textContent = bio.length;
}

function updateAvailabilityUI(isAvailable) {
    const slider = document.getElementById('toggleSlider');
    const text = document.getElementById('toggleText');
    const indicator = document.getElementById('currentStatus');
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (isAvailable) {
        // Toggle slider
        slider.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        slider.querySelector('div').style.left = '38px';
        text.textContent = 'Go Offline';
        text.style.color = '#10b981';
        
        // Status indicator
        indicator.innerHTML = '<i class="fas fa-circle" style="color: #10b981;"></i> CURRENTLY ONLINE';
        indicator.style.background = 'rgba(16, 185, 129, 0.1)';
        indicator.style.color = '#10b981';
        
        // Small status indicator
        statusIndicator.innerHTML = '<i class="fas fa-circle" style="color: #10b981;"></i> ONLINE';
        statusIndicator.style.background = 'rgba(16, 185, 129, 0.1)';
        statusIndicator.style.color = '#10b981';
        
    } else {
        // Toggle slider
        slider.style.background = '#4b5563';
        slider.querySelector('div').style.left = '4px';
        text.textContent = 'Go Online';
        text.style.color = '#9ca3af';
        
        // Status indicator
        indicator.innerHTML = '<i class="fas fa-circle" style="color: #ef4444;"></i> CURRENTLY OFFLINE';
        indicator.style.background = 'rgba(239, 68, 68, 0.1)';
        indicator.style.color = '#ef4444';
        
        // Small status indicator
        statusIndicator.innerHTML = '<i class="fas fa-circle" style="color: #ef4444;"></i> OFFLINE';
        statusIndicator.style.background = 'rgba(239, 68, 68, 0.1)';
        statusIndicator.style.color = '#ef4444';
    }
}

async function updateAvailability(isAvailable) {
    if (!currentUser) return;
    
    try {
        console.log('🔄 Updating availability to:', isAvailable);
        const db = firebase.firestore();
        
        await db.collection('users').doc(currentUser.uid).update({
            isAvailable: isAvailable,
            lastOnline: new Date()
        });
        
        updateAvailabilityUI(isAvailable);
        showNotification(isAvailable ? 
            '🎉 You are now online and visible to customers!' : 
            '👋 You are now offline', 
            isAvailable ? 'success' : 'info'
        );
        
        // Update userData
        if (userData) {
            userData.isAvailable = isAvailable;
        }
        
    } catch (error) {
        console.error('❌ Error updating availability:', error);
        document.getElementById('availabilityToggle').checked = !isAvailable;
        updateAvailabilityUI(!isAvailable);
        showNotification('Error updating status', 'error');
    }
}

async function updateProfile() {
    if (!currentUser) return;
    
    try {
        const displayName = document.getElementById('displayName').value.trim();
        const bio = document.getElementById('profileBio').value.trim();
        
        if (!displayName) {
            showNotification('Please enter a display name', 'error');
            return;
        }
        
        const db = firebase.firestore();
        
        await db.collection('users').doc(currentUser.uid).update({
            username: displayName,
            bio: bio,
            updatedAt: new Date()
        });
        
        showNotification('✅ Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        showNotification('Error updating profile: ' + error.message, 'error');
    }
}

async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File must be less than 5MB', 'error');
        return;
    }
    
    try {
        showNotification('Uploading image...', 'info');
        
        const storage = firebase.storage();
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${Date.now()}.${fileExt}`;
        const avatarRef = storage.ref(`whispers/${currentUser.uid}/avatars/${fileName}`);
        
        // Upload file
        const uploadTask = avatarRef.put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress tracking
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload progress: ' + progress + '%');
            },
            (error) => {
                console.error('❌ Upload error:', error);
                showNotification('Upload failed: ' + error.message, 'error');
            },
            async () => {
                // Upload complete
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                
                // Update Firestore
                const db = firebase.firestore();
                await db.collection('users').doc(currentUser.uid).update({
                    photoURL: downloadURL,
                    updatedAt: new Date()
                });
                
                // Update UI
                document.getElementById('profileAvatar').src = downloadURL;
                
                // Update userData
                if (userData) {
                    userData.photoURL = downloadURL;
                }
                
                showNotification('✅ Profile picture updated!', 'success');
            }
        );
        
    } catch (error) {
        console.error('❌ Error uploading avatar:', error);
        showNotification('Error uploading image', 'error');
    }
    
    // Reset input
    event.target.value = '';
}

function setupCallListeners(whisperId) {
    if (unsubscribeCalls) unsubscribeCalls();
    
    const db = firebase.firestore();
    
    unsubscribeCalls = db.collection('calls')
        .where('whisperId', '==', whisperId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .onSnapshot(snapshot => {
            updateCallsList(snapshot);
        }, error => {
            console.error('❌ Error listening to calls:', error);
        });
}

function updateCallsList(snapshot) {
    const container = document.getElementById('callsList');
    
    if (!snapshot || snapshot.empty) {
        container.innerHTML = '<div style="text-align: center; padding: 60px; opacity: 0.7;">' +
            '<i class="fas fa-history fa-3x" style="margin-bottom: 20px;"></i>' +
            '<h3>No call history yet</h3>' +
            '<p>When you complete calls, they\'ll appear here</p>' +
            '</div>';
        return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
        const call = doc.data();
        const date = call.createdAt?.toDate() || new Date();
        const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const duration = call.actualDuration ? 
            Math.floor(call.actualDuration / 60) + ':' + 
            (call.actualDuration % 60).toString().padStart(2, '0') : 
            'N/A';
        
        const earnings = call.amount ? '$' + (call.amount / 100).toFixed(2) : '$12.00';
        
        let statusClass = 'status-completed';
        let statusText = 'COMPLETED';
        
        if (call.status === 'pending') {
            statusClass = 'status-new';
            statusText = 'PENDING';
        } else if (call.status === 'active') {
            statusClass = 'status-active';
            statusText = 'ACTIVE';
        }
        
        html += '<div class="call-item">' +
            '<div style="flex: 1;">' +
                '<h4 style="margin-bottom: 5px;">Call with ' + (call.customerEmail || 'Customer') + '</h4>' +
                '<p style="opacity: 0.8; margin-bottom: 5px;">' + dateStr + '</p>' +
                '<div style="display: flex; gap: 15px; font-size: 0.9rem; opacity: 0.7;">' +
                    '<span><i class="fas fa-clock"></i> ' + duration + '</span>' +
                    '<span><i class="fas fa-money-bill-wave"></i> ' + earnings + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="call-status ' + statusClass + '">' + statusText + '</div>' +
        '</div>';
    });
    
    container.innerHTML = html;
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Activate selected button
    event.target.classList.add('active');
}

function resetForm() {
    if (userData) {
        document.getElementById('displayName').value = userData.username || currentUser.email.split('@')[0];
        document.getElementById('profileBio').value = userData.bio || '';
        updateBioCounter();
    }
    showNotification('Form reset to saved values', 'info');
}

function refreshCalls() {
    if (currentUser) {
        setupCallListeners(currentUser.uid);
        showNotification('Refreshing call history...', 'info');
    }
}

function showNotifications() {
    showNotification('No new notifications', 'info');
}

function showNotification(message, type) {
    // Remove existing notifications
    document.querySelectorAll('.notification-toast').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    
    // Colors based on type
    let bgColor = '#8b5cf6';
    let icon = 'fas fa-info-circle';
    
    if (type === 'success') {
        bgColor = '#10b981';
        icon = 'fas fa-check-circle';
    } else if (type === 'error') {
        bgColor = '#ef4444';
        icon = 'fas fa-exclamation-circle';
    } else if (type === 'warning') {
        bgColor = '#f59e0b';
        icon = 'fas fa-exclamation-triangle';
    }
    
    notification.innerHTML = '<i class="' + icon + '" style="margin-right: 10px;"></i>' + message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 18px 28px;
        border-radius: 15px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        font-weight: 600;
        font-size: 15px;
        display: flex;
        align-items: center;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = 'index.html';
        }).catch(error => {
            console.error('❌ Logout error:', error);
            showNotification('Error logging out', 'error');
        });
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
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
