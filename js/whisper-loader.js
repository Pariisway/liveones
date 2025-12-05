// Fixed Whisper Loader - No Template Literal Syntax Errors
console.log('✅ Fixed whisper loader loaded');

function loadWhispers() {
    console.log('🔍 Loading whispers...');
    const container = document.getElementById('whispersContainer');
    
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="whisper-card" style="grid-column: 1 / -1; text-align: center; padding: 60px;">' +
        '<i class="fas fa-spinner fa-spin fa-3x" style="margin-bottom: 20px; color: #7c3aed;"></i>' +
        '<h3>Finding available listeners...</h3>' +
        '<p style="opacity: 0.7; margin-top: 10px;">Searching for whispers online</p>' +
        '</div>';
    
    // Check Firebase
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        showNoWhispers('Firebase not loaded. Please refresh the page.');
        return;
    }
    
    try {
        // Initialize Firebase if needed
        if (firebase.apps.length === 0) {
            console.log('Initializing Firebase...');
            firebase.initializeApp({
                apiKey: "AIzaSyALbIJSI2C-p6IyMtj_F0ZqGyN1i79jOd4",
                authDomain: "whisper-chat-live.firebaseapp.com",
                projectId: "whisper-chat-live",
                storageBucket: "whisper-chat-live.firebasestorage.app",
                messagingSenderId: "302894848452",
                appId: "1:302894848452:web:61a7ab21a269533c426c91"
            });
        }
        
        const db = firebase.firestore();
        console.log('📡 Firestore connected, loading users...');
        
        // Load all users
        db.collection('users').get().then(snapshot => {
            console.log('📊 Found ' + snapshot.size + ' total users');
            
            const whispers = [];
            snapshot.forEach(doc => {
                const user = doc.data();
                if (user.userType === 'whisper') {
                    whispers.push({
                        id: doc.id,
                        username: user.username || 'Whisper',
                        bio: user.bio || 'Ready to listen',
                        isAvailable: user.isAvailable || false,
                        photoURL: user.photoURL || user.profilePic,
                        rating: user.rating || 5.0
                    });
                }
            });
            
            console.log('🎯 Found ' + whispers.length + ' whispers');
            
            // Filter available whispers
            const availableWhispers = whispers.filter(w => w.isAvailable === true);
            console.log('🟢 ' + availableWhispers.length + ' whispers available');
            
            if (availableWhispers.length === 0) {
                if (whispers.length === 0) {
                    showNoWhispers('No whispers registered yet. <a href="become-whisper.html" style="color: #7c3aed; text-decoration: underline;">Become the first whisper!</a>');
                } else {
                    showNoWhispers('No whispers are currently online. Check back soon or <a href="become-whisper.html" style="color: #7c3aed; text-decoration: underline;">become a whisper</a>');
                }
                return;
            }
            
            // Display whispers
            displayWhispers(availableWhispers);
            
        }).catch(error => {
            console.error('❌ Error loading whispers:', error);
            showNoWhispers('Error loading whispers: ' + error.message + 
                '<br><button onclick="loadWhispers()" style="background: #7c3aed; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 10px; cursor: pointer;">Retry</button>');
        });
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
        showNoWhispers('Unexpected error. Check console for details.');
    }
}

function displayWhispers(whispers) {
    const container = document.getElementById('whispersContainer');
    
    let html = '';
    whispers.forEach(whisper => {
        // Generate avatar URL
        const avatarUrl = whisper.photoURL || 
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(whisper.username) + 
            '&background=7c3aed&color=fff&size=200';
        
        // Create card HTML
        html += '<div class="whisper-card">' +
            '<img src="' + avatarUrl + '" class="profile-img" alt="' + whisper.username + '">' +
            '<div class="online-status"></div>' +
            '<h3 style="margin: 10px 0 5px;">' + whisper.username + '</h3>' +
            '<div style="margin: 5px 0; color: #fbbf24;">' +
                '⭐ '.repeat(Math.floor(whisper.rating || 5)) +
            '</div>' +
            '<p style="opacity: 0.7; margin-bottom: 15px; font-size: 0.9rem; min-height: 40px;">' + 
                (whisper.bio || 'Ready to listen and provide support') + 
            '</p>' +
            '<div style="margin: 15px 0; padding: 10px; background: rgba(124, 58, 237, 0.1); border-radius: 10px; text-align: center;">' +
                '<span style="font-weight: bold; color: #7c3aed;">$15 for 5 minutes</span>' +
            '</div>' +
            '<button onclick="startCall(\'' + whisper.id + '\', \'' + whisper.username.replace(/'/g, "\\'") + '\')" ' +
                'class="btn btn-primary" style="width: 100%; padding: 12px;">' +
                '<i class="fas fa-phone-alt"></i> Start Private Call' +
            '</button>' +
        '</div>';
    });
    
    container.innerHTML = html;
}

function showNoWhispers(message) {
    const container = document.getElementById('whispersContainer');
    container.innerHTML = '<div class="whisper-card" style="grid-column: 1 / -1; text-align: center; padding: 60px;">' +
        '<i class="fas fa-user-slash fa-3x" style="margin-bottom: 20px; opacity: 0.5;"></i>' +
        '<h3>No whispers available</h3>' +
        '<div style="opacity: 0.7; margin-top: 10px; margin-bottom: 20px;">' + message + '</div>' +
        '<div style="display: flex; gap: 15px; justify-content: center;">' +
            '<button onclick="loadWhispers()" class="btn btn-outline">' +
                '<i class="fas fa-redo"></i> Refresh' +
            '</button>' +
            '<a href="become-whisper.html" class="btn btn-primary">' +
                '<i class="fas fa-user-plus"></i> Become a Whisper' +
            '</a>' +
        '</div>' +
    '</div>';
}

function startCall(whisperId, whisperName) {
    const email = prompt('Enter your email to start the call:');
    
    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address (example@domain.com)');
        return;
    }
    
    localStorage.setItem('customerEmail', email);
    window.location.href = 'payment.html?whisper=' + whisperId + '&name=' + encodeURIComponent(whisperName);
}

// Auto-load when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM loaded, waiting for Firebase...');
        setTimeout(loadWhispers, 2000);
    });
} else {
    console.log('📄 DOM already loaded, loading whispers...');
    setTimeout(loadWhispers, 2000);
}

// Expose to window for manual refresh
if (typeof window !== 'undefined') {
    window.loadWhispers = loadWhispers;
    window.startCall = startCall;
}

// Auto-refresh every 30 seconds
setInterval(loadWhispers, 30000);
