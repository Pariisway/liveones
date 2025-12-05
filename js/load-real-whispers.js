// Load REAL whispers from Firestore (NO DEMO DATA)
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Loading real whispers...");
    
    const whispersContainer = document.getElementById('whispers-container');
    if (!whispersContainer) return;
    
    // Show loading
    whispersContainer.innerHTML = '<div class="loading">Loading whispers...</div>';
    
    try {
        // Get only real whispers from Firestore
        const snapshot = await firebase.firestore()
            .collection('users')
            .where('userType', '==', 'whisper')
            .where('isAvailable', '==', true)
            .get();
        
        if (snapshot.empty) {
            whispersContainer.innerHTML = `
                <div class="no-whispers">
                    <h3>No whispers available at the moment</h3>
                    <p>Check back soon or sign up as a whisper!</p>
                </div>
            `;
            return;
        }
        
        // Build whispers HTML
        let whispersHTML = '';
        snapshot.forEach(doc => {
            const whisper = doc.data();
            whispersHTML += `
                <div class="whisper-card">
                    <div class="whisper-avatar">
                        <img src="${whisper.profilePic}" alt="${whisper.username}" 
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(whisper.username)}&background=6c5ce7&color=fff'">
                    </div>
                    <div class="whisper-info">
                        <h3>${whisper.username || 'Whisper'}</h3>
                        <p class="whisper-bio">${whisper.bio || 'Ready to listen and help'}</p>
                        <div class="whisper-meta">
                            <span class="rating">⭐ ${whisper.stats?.rating || '5.0'}</span>
                            <span class="calls">📞 ${whisper.stats?.totalCalls || 0} calls</span>
                            <span class="price">${whisper.price || 10} credits</span>
                        </div>
                    </div>
                    <button class="call-button" 
                            data-whisper-id="${doc.id}"
                            data-price="${whisper.price || 10}"
                            data-whisper-name="${whisper.username || 'Whisper'}">
                        Call Now
                    </button>
                </div>
            `;
        });
        
        whispersContainer.innerHTML = whispersHTML;
        
        // Attach click handlers to call buttons
        setTimeout(() => {
            document.querySelectorAll('.call-button').forEach(button => {
                button.addEventListener('click', function() {
                    const whisperId = this.getAttribute('data-whisper-id');
                    const price = this.getAttribute('data-price');
                    const whisperName = this.getAttribute('data-whisper-name');
                    
                    // Check if user is logged in
                    const user = firebase.auth().currentUser;
                    if (!user) {
                        alert('Please login first');
                        window.location.href = 'whisper-login.html';
                        return;
                    }
                    
                    // Start call flow
                    startCallFlow(whisperId, price, whisperName);
                });
            });
        }, 100);
        
    } catch (error) {
        console.error("Error loading whispers:", error);
        whispersContainer.innerHTML = `
            <div class="error">
                <h3>Error loading whispers</h3>
                <p>Please refresh the page</p>
            </div>
        `;
    }
});

// Call flow function
async function startCallFlow(whisperId, price, whisperName) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        // Check user credits
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userCredits = userDoc.data().credits || 0;
        
        if (userCredits >= price) {
            // Has enough credits - start call directly
            createCall(whisperId, price, user.uid, whisperName);
        } else {
            // Need payment
            window.location.href = `payment.html?whisper=${whisperId}&price=${price}&name=${encodeURIComponent(whisperName)}`;
        }
    } catch (error) {
        console.error("Call flow error:", error);
        alert("Error starting call: " + error.message);
    }
}

// Create call in Firestore
async function createCall(whisperId, price, listenerId, whisperName) {
    try {
        const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        await firebase.firestore().collection('calls').doc(callId).set({
            callId: callId,
            whisperId: whisperId,
            listenerId: listenerId,
            price: parseInt(price),
            status: 'pending',
            channelName: 'call_' + callId,
            whisperName: whisperName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            startedAt: null,
            endedAt: null,
            duration: 300 // 5 minutes
        });
        
        // Redirect to waiting room
        sessionStorage.setItem('currentCallId', callId);
        sessionStorage.setItem('callRole', 'listener');
        window.location.href = `chat-room.html?call=${callId}`;
        
    } catch (error) {
        console.error("Error creating call:", error);
        alert("Failed to create call: " + error.message);
    }
}
