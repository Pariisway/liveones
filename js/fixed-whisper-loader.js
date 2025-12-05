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
