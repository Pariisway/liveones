#!/bin/bash
echo "=== Fixing All Issues ==="

# 1. Fix index.html site name
sed -i 's/Voice Connect/House of Whispers/g' index.html
sed -i 's/VoiceConnect/House of Whispers/g' index.html

# 2. Fix all other HTML files
for file in *.html; do
    if [ -f "$file" ]; then
        sed -i 's/Voice Connect/House of Whispers/g' "$file"
        sed -i 's/VoiceConnect/House of Whispers/g' "$file"
    fi
done

# 3. Fix whisper dashboard - add home button
cat > whisper-dashboard-fixed.html << 'WHISPER_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Whisper Dashboard | House of Whispers</title>
    <meta name="google-adsense-account" content="ca-pub-1184595877548269">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1184595877548269" crossorigin="anonymous"></script>
    <script src="js/page-stabilizer.js"></script>
    <script src="js/navigation-guard.js"></script>
    <script src="js/firebase-init-unified.js"></script>
    <style>
        .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .dashboard-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        .user-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 4px solid rgba(255,255,255,0.3); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: rgba(255,255,255,0.05); padding: 25px; border-radius: 15px; text-align: center; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-value { font-size: 2.5rem; font-weight: bold; color: #00ff88; margin: 10px 0; }
        .stat-label { opacity: 0.7; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        .toggle-switch { position: relative; display: inline-block; width: 60px; height: 34px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .toggle-slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .toggle-slider { background-color: #00ff88; }
        input:checked + .toggle-slider:before { transform: translateX(26px); }
        .status-indicator { padding: 10px 20px; border-radius: 25px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; }
        .status-online { background: rgba(0,255,136,0.1); color: #00ff88; }
        .status-offline { background: rgba(255,85,85,0.1); color: #ff5555; }
        .calls-list { margin-top: 20px; }
        .call-item { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
        .call-status { padding: 6px 15px; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
        .status-active { background: rgba(0,255,136,0.1); color: #00ff88; }
        .status-completed { background: rgba(102,126,234,0.1); color: #667eea; }
        
        /* Home button */
        .home-btn { 
            background: rgba(255,255,255,0.1); 
            color: white; 
            padding: 10px 20px; 
            border-radius: 25px; 
            text-decoration: none; 
            display: inline-flex; 
            align-items: center; 
            gap: 8px; 
            margin-right: 15px; 
            transition: all 0.3s; 
        }
        .home-btn:hover { background: rgba(255,255,255,0.2); transform: translateY(-2px); }
    </style>
</head>
<body class="page-transition">
    <div class="dashboard-container">
        <header class="dashboard-header">
            <div style="display: flex; align-items: center; gap: 20px;">
                <img id="userAvatar" src="https://ui-avatars.com/api/?name=Whisper&background=667eea&color=fff" class="user-avatar">
                <div>
                    <h1 id="userName">Loading...</h1>
                    <p id="userEmail" style="opacity: 0.8;">Connecting...</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <a href="index.html" class="home-btn">
                    <i class="fas fa-home"></i> Home
                </a>
                <button onclick="handleLogout()" class="call-btn" style="background: rgba(255,255,255,0.1);">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </header>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="totalEarnings">$0.00</div>
                <div class="stat-label">Total Earnings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="totalCalls">0</div>
                <div class="stat-label">Total Calls</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="weeklyEarnings">$0.00</div>
                <div class="stat-label">This Week</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="rating">⭐ 0.0</div>
                <div class="stat-label">Rating</div>
            </div>
        </div>
        
        <div class="glass-card" style="margin-bottom: 30px;">
            <h2 style="margin-bottom: 20px;">Dashboard Controls</h2>
            
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
                <label class="toggle-switch">
                    <input type="checkbox" id="availabilityToggle">
                    <span class="toggle-slider"></span>
                </label>
                <div id="statusDisplay" class="status-indicator status-offline">
                    <span id="statusIcon">⚫</span>
                    <span id="statusText">OFFLINE</span>
                </div>
            </div>
            
            <p style="opacity: 0.8; margin-bottom: 30px;">
                When online, customers can request calls from you. You'll receive notifications for new calls.
            </p>
            
            <div style="display: flex; align-items: center; gap: 30px; margin-top: 30px;">
                <img id="currentPhoto" src="https://ui-avatars.com/api/?name=Whisper&background=667eea&color=fff" 
                     style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #667eea;">
                <div>
                    <h3 style="margin-bottom: 15px;">Profile Photo</h3>
                    <input type="file" id="photoInput" accept="image/*" style="display: none;">
                    <button onclick="openFilePicker()" class="call-btn" style="padding: 12px 25px;">
                        <i class="fas fa-camera"></i> Upload Photo
                    </button>
                    <p style="margin-top: 10px; opacity: 0.7; font-size: 0.9rem;">JPG, PNG or GIF. Max 5MB.</p>
                </div>
            </div>
        </div>
        
        <div class="glass-card">
            <h2 style="margin-bottom: 20px;">Recent Calls</h2>
            <div class="calls-list" id="callsList">
                <p style="text-align: center; padding: 40px; opacity: 0.7;">No calls yet. Go online to receive calls.</p>
            </div>
        </div>
    </div>

    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js"></script>
    <script>
        let currentUser = null;
        let unsubscribeCalls = null;
        
        document.addEventListener('DOMContentLoaded', function() {
            firebase.auth().onAuthStateChanged(handleAuthStateChange);
        });
        
        async function handleAuthStateChange(user) {
            if (!user) {
                window.location.href = 'whisper-login.html';
                return;
            }
            
            currentUser = user;
            await loadUserData(user);
            setupCallListener(user.uid);
            
            document.getElementById('availabilityToggle').addEventListener('change', async function() {
                await updateAvailability(this.checked);
            });
            
            document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);
        }
        
        async function loadUserData(user) {
            try {
                document.getElementById('userName').textContent = user.email.split('@')[0];
                document.getElementById('userEmail').textContent = user.email;
                
                const db = firebase.firestore();
                const userRef = db.collection('users').doc(user.uid);
                const userDoc = await userRef.get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    document.getElementById('totalEarnings').textContent = `$${(userData.totalEarnings || 0).toFixed(2)}`;
                    document.getElementById('totalCalls').textContent = userData.totalCalls || 0;
                    document.getElementById('weeklyEarnings').textContent = `$${(userData.weeklyEarnings || 0).toFixed(2)}`;
                    document.getElementById('rating').textContent = `⭐ ${(userData.rating || 0).toFixed(1)}`;
                    
                    const isAvailable = userData.isAvailable || false;
                    document.getElementById('availabilityToggle').checked = isAvailable;
                    updateStatusDisplay(isAvailable);
                    
                    if (userData.photoURL) {
                        document.getElementById('userAvatar').src = userData.photoURL;
                        document.getElementById('currentPhoto').src = userData.photoURL;
                    }
                } else {
                    await userRef.set({
                        email: user.email,
                        username: user.email.split('@')[0],
                        isAvailable: false,
                        totalEarnings: 0,
                        totalCalls: 0,
                        weeklyEarnings: 0,
                        rating: 0,
                        userType: 'whisper',
                        createdAt: new Date()
                    });
                }
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error loading dashboard', 'error');
            }
        }
        
        function setupCallListener(whisperId) {
            if (unsubscribeCalls) unsubscribeCalls();
            
            const db = firebase.firestore();
            
            // Fixed query without orderBy to avoid index requirement
            unsubscribeCalls = db.collection('calls')
                .where('whisperId', '==', whisperId)
                .limit(10)
                .onSnapshot(snapshot => {
                    updateCallsList(snapshot);
                }, error => {
                    console.error('Error loading calls:', error);
                    // Show user-friendly error
                    document.getElementById('callsList').innerHTML = 
                        '<p style="text-align: center; padding: 40px; opacity: 0.7;">Error loading calls. Please refresh.</p>';
                });
        }
        
        function updateCallsList(snapshot) {
            const container = document.getElementById('callsList');
            
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; opacity: 0.7;">No calls yet. Go online to receive calls.</p>';
                return;
            }
            
            let html = '';
            const calls = [];
            
            snapshot.forEach(doc => {
                calls.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort manually by date
            calls.sort((a, b) => {
                const dateA = a.createdAt?.toDate() || new Date(0);
                const dateB = b.createdAt?.toDate() || new Date(0);
                return dateB - dateA; // Newest first
            });
            
            calls.forEach(call => {
                const date = call.createdAt?.toDate() || new Date();
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                const statusClass = call.status === 'active' ? 'status-active' : 'status-completed';
                const statusText = call.status === 'active' ? 'ACTIVE' : 'COMPLETED';
                
                html += `
                    <div class="call-item">
                        <div>
                            <h4>Call with Customer</h4>
                            <p style="opacity: 0.8;">${dateStr} • $${(call.amount / 100 || 0).toFixed(2)}</p>
                            ${call.customerEmail ? `<p style="font-size: 0.9rem; opacity: 0.7;">${call.customerEmail}</p>` : ''}
                        </div>
                        <div class="call-status ${statusClass}">${statusText}</div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
        
        function updateStatusDisplay(isOnline) {
            const icon = document.getElementById('statusIcon');
            const text = document.getElementById('statusText');
            const display = document.getElementById('statusDisplay');
            
            if (isOnline) {
                icon.textContent = '🟢';
                text.textContent = 'ONLINE';
                display.className = 'status-indicator status-online';
            } else {
                icon.textContent = '⚫';
                text.textContent = 'OFFLINE';
                display.className = 'status-indicator status-offline';
            }
        }
        
        async function updateAvailability(isAvailable) {
            if (!currentUser) return;
            
            try {
                const db = firebase.firestore();
                await db.collection('users').doc(currentUser.uid).update({
                    isAvailable: isAvailable,
                    lastOnline: new Date()
                });
                
                updateStatusDisplay(isAvailable);
                showNotification(isAvailable ? 'You are now online!' : 'You are now offline', 'success');
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('availabilityToggle').checked = !isAvailable;
                showNotification('Error updating status', 'error');
            }
        }
        
        function openFilePicker() {
            document.getElementById('photoInput').click();
        }
        
        async function handlePhotoUpload(event) {
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
                const storage = firebase.storage();
                const fileExt = file.name.split('.').pop();
                const fileName = `profile_${Date.now()}.${fileExt}`;
                const photoRef = storage.ref(`whispers/${currentUser.uid}/${fileName}`);
                
                const uploadTask = photoRef.put(file);
                
                uploadTask.on('state_changed',
                    null,
                    (error) => {
                        console.error('Upload error:', error);
                        showNotification('Upload failed', 'error');
                    },
                    async () => {
                        const photoURL = await uploadTask.snapshot.ref.getDownloadURL();
                        const db = firebase.firestore();
                        
                        await db.collection('users').doc(currentUser.uid).update({
                            photoURL: photoURL,
                            photoUpdatedAt: new Date()
                        });
                        
                        document.getElementById('userAvatar').src = photoURL;
                        document.getElementById('currentPhoto').src = photoURL;
                        showNotification('Profile photo updated!', 'success');
                    }
                );
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error uploading photo', 'error');
            }
            
            event.target.value = '';
        }
        
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? 'rgba(0,255,136,0.9)' : 'rgba(255,85,85,0.9)'};
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
        
        function handleLogout() {
            if (confirm('Are you sure you want to logout?')) {
                firebase.auth().signOut().then(() => {
                    window.location.href = 'index.html';
                });
            }
        }
    </script>
</body>
</html>
WHISPER_EOF

# Replace the old file
mv whisper-dashboard-fixed.html whisper-dashboard.html

# 4. Fix index.html whisper loading
cat > js/fixed-whisper-loader.js << 'JS_EOF'
// Fixed whisper loader for index.html
console.log('Loading whispers...');

function loadWhispers() {
    const container = document.getElementById('whispersContainer');
    
    // Show loading
    container.innerHTML = `
        <div class="whisper-card" style="grid-column: 1 / -1; text-align: center;">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <p style="margin-top: 20px;">Loading whispers...</p>
        </div>
    `;
    
    // Initialize Firebase if needed
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        container.innerHTML = `
            <div class="whisper-card" style="grid-column: 1 / -1; text-align: center;">
                <i class="fas fa-exclamation-triangle fa-3x" style="color: #ff5555;"></i>
                <p style="margin-top: 20px;">Firebase not loaded. Please refresh.</p>
            </div>
        `;
        return;
    }
    
    try {
        const db = firebase.firestore();
        
        // Simple query without complex filters
        db.collection('users').get()
            .then(snapshot => {
                const whispers = [];
                
                snapshot.forEach(doc => {
                    const user = doc.data();
                    if (user.userType === 'whisper' && user.isAvailable === true) {
                        whispers.push({ id: doc.id, ...user });
                    }
                });
                
                if (whispers.length === 0) {
                    container.innerHTML = `
                        <div class="whisper-card" style="grid-column: 1 / -1; text-align: center;">
                            <i class="fas fa-user-slash fa-3x" style="opacity: 0.5;"></i>
                            <p style="margin-top: 20px; font-size: 1.2rem;">
                                No whispers available. Check back soon!
                            </p>
                        </div>
                    `;
                    return;
                }
                
                let html = '';
                whispers.forEach(whisper => {
                    html += `
                        <div class="whisper-card">
                            <img src="${whisper.profilePic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(whisper.username)}" 
                                 class="profile-img" alt="${whisper.username}">
                            <div class="online-status"></div>
                            <h3 style="margin: 10px 0 5px;">${whisper.username}</h3>
                            <p style="opacity: 0.7; margin-bottom: 10px; font-size: 0.9rem;">
                                ${whisper.bio || 'Ready to listen and chat'}
                            </p>
                            <div class="price-tag">$15 for 5 minutes</div>
                            <button class="call-btn" onclick="startCall('${whisper.id}', '${whisper.username}')" style="margin-top: 15px;">
                                <i class="fas fa-phone-alt"></i> Start Private Call
                            </button>
                        </div>
                    `;
                });
                
                container.innerHTML = html;
                
            })
            .catch(error => {
                console.error('Error loading whispers:', error);
                container.innerHTML = `
                    <div class="whisper-card" style="grid-column: 1 / -1; text-align: center;">
                        <i class="fas fa-exclamation-triangle fa-3x" style="color: #ff5555;"></i>
                        <p style="margin-top: 20px;">Error loading whispers. Please refresh.</p>
                    </div>
                `;
            });
            
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div class="whisper-card" style="grid-column: 1 / -1; text-align: center;">
                <i class="fas fa-exclamation-triangle fa-3x" style="color: #ff5555;"></i>
                <p style="margin-top: 20px;">Error: ${error.message}</p>
            </div>
        `;
    }
}

// Start call function
function startCall(whisperId, whisperName) {
    const email = prompt("Enter your email for call access (no account needed):");
    
    if (!email || !email.includes('@')) {
        alert("Please enter a valid email address");
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('customerEmail', email);
    
    // Redirect to payment
    window.location.href = \`payment.html?whisper=\${whisperId}&name=\${encodeURIComponent(whisperName)}\`;
}

// Load whispers when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWhispers);
} else {
    loadWhispers();
}

// Refresh every 30 seconds
setInterval(loadWhispers, 30000);
JS_EOF

# Update index.html to use the fixed loader
sed -i '/loadWhispers();/d' index.html
sed -i '/function loadWhispers()/,/^    }/d' index.html
sed -i '/function startCall()/,/^    }/d' index.html
sed -i '/setInterval(loadWhispers, 30000);/d' index.html

# Add the fixed loader to index.html
echo '<script src="js/fixed-whisper-loader.js"></script>' >> index.html

echo "✅ All fixes applied!"
echo "1. Site name changed to 'House of Whispers'"
echo "2. Whisper dashboard now has home button"
echo "3. Fixed Firestore index error"
echo "4. Added working whisper loader"
echo ""
echo "IMPORTANT: Create the Firebase index at:"
echo "https://console.firebase.google.com/v1/r/project/whisper-chat-live/firestore/indexes?create_composite=Ck9wcm9qZWN0cy93aGlzcGVyLWNoYXQtbGl2ZS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvY2FsbHMvaW5kZXhlcy9fEAEaDQoJd2hpc3BlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg"
