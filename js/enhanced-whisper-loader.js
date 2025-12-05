// Enhanced Whisper Loader with Grid and Error Handling
class WhisperLoader {
    constructor() {
        this.whispers = [];
        this.init();
    }
    
    async init() {
        console.log("Enhanced Whisper Loader Initializing...");
        
        // Wait for Firebase
        await this.waitForFirebase();
        
        // Load whispers
        await this.loadWhispers();
        
        // Setup auto-refresh every 30 seconds
        setInterval(() => this.loadWhispers(), 30000);
    }
    
    waitForFirebase() {
        return new Promise((resolve) => {
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                resolve();
                return;
            }
            
            const checkInterval = setInterval(() => {
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    async loadWhispers() {
        try {
            const container = document.getElementById('whispers-container');
            if (!container) return;
            
            // Show loading state
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <div class="loading-spinner"></div>
                    <p style="margin-top: 20px; color: #666;">Loading whispers...</p>
                </div>
            `;
            
            // Get whispers from Firestore
            const snapshot = await firebase.firestore()
                .collection('users')
                .where('userType', '==', 'whisper')
                .where('isAvailable', '==', true)
                .get();
            
            if (snapshot.empty) {
                this.showNoWhispers();
                return;
            }
            
            this.whispers = [];
            snapshot.forEach(doc => {
                const whisper = { id: doc.id, ...doc.data() };
                this.whispers.push(whisper);
            });
            
            this.renderWhispers();
            
        } catch (error) {
            console.error("Error loading whispers:", error);
            this.showError(error);
        }
    }
    
    renderWhispers() {
        const container = document.getElementById('whispers-container');
        if (!container) return;
        
        if (this.whispers.length === 0) {
            this.showNoWhispers();
            return;
        }
        
        let html = '';
        
        this.whispers.forEach(whisper => {
            html += `
                <div class="whisper-card neon-glow">
                    <div class="whisper-avatar">
                        <img src="${whisper.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(whisper.username)}&background=6c5ce7&color=fff&size=200`}" 
                             alt="${whisper.username}"
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(whisper.username)}&background=6c5ce7&color=fff'">
                    </div>
                    <div class="whisper-info">
                        <h3>${whisper.username || 'Anonymous Whisper'}</h3>
                        <p class="whisper-bio">${whisper.bio || 'Ready to listen and provide support'}</p>
                        <div class="whisper-meta">
                            <span class="rating">⭐ ${whisper.stats?.rating?.toFixed(1) || '5.0'}</span>
                            <span class="calls">📞 ${whisper.stats?.totalCalls || 0}</span>
                            <span class="price">${whisper.price || 10} credits</span>
                        </div>
                    </div>
                    <button class="call-button" onclick="startCallWithWhisper('${whisper.id}', ${whisper.price || 10}, '${whisper.username}')">
                        <i class="fas fa-phone"></i> Start 5-min Call
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Update stats
        this.updateStats();
    }
    
    showNoWhispers() {
        const container = document.getElementById('whispers-container');
        if (!container) return;
        
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <div style="font-size: 4rem; color: #ddd; margin-bottom: 20px;">
                    <i class="fas fa-user-friends"></i>
                </div>
                <h3 style="color: #636e72; margin-bottom: 15px;">No Whispers Available</h3>
                <p style="color: #999; margin-bottom: 30px;">
                    Check back soon or be the first to sign up as a whisper!
                </p>
                <a href="whisper-signup.html" class="btn-primary" style="padding: 12px 30px;">
                    <i class="fas fa-user-plus"></i> Become a Whisper
                </a>
            </div>
        `;
    }
    
    showError(error) {
        const container = document.getElementById('whispers-container');
        if (!container) return;
        
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px; background: rgba(255, 0, 0, 0.05); border-radius: 15px;">
                <div style="font-size: 4rem; color: #ff6b6b; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="color: #e74c3c; margin-bottom: 15px;">Connection Error</h3>
                <p style="color: #999; margin-bottom: 30px;">
                    Unable to load whispers. Please check your connection.
                </p>
                <button onclick="location.reload()" class="btn-primary" style="padding: 12px 30px;">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
    
    updateStats() {
        const totalWhispers = document.getElementById('totalWhispers');
        const totalCalls = document.getElementById('totalCalls');
        
        if (totalWhispers) {
            totalWhispers.textContent = this.whispers.length;
        }
        
        if (totalCalls) {
            // Calculate total calls (mock for now)
            const total = this.whispers.reduce((sum, w) => sum + (w.stats?.totalCalls || 0), 0);
            totalCalls.textContent = total;
        }
    }
}

// Global call function
async function startCallWithWhisper(whisperId, price, whisperName) {
    try {
        // Check if user is logged in
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please login first to start a call');
            window.location.href = 'whisper-login.html';
            return;
        }
        
        // Check user credits
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        if (!userData) {
            alert('User data not found. Please login again.');
            return;
        }
        
        if (userData.credits < price) {
            // Not enough credits - redirect to payment
            window.location.href = `payment.html?whisper=${whisperId}&price=${price}&name=${encodeURIComponent(whisperName)}`;
            return;
        }
        
        // Create call
        const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        await firebase.firestore().collection('calls').doc(callId).set({
            callId: callId,
            whisperId: whisperId,
            listenerId: user.uid,
            price: price,
            status: 'pending',
            channelName: 'whisper_channel_' + callId,
            whisperName: whisperName,
            listenerName: userData.username || user.email,
            createdAt: new Date(),
            duration: 300 // 5 minutes
        });
        
        // Deduct credits
        await firebase.firestore().collection('users').doc(user.uid).update({
            credits: firebase.firestore.FieldValue.increment(-price)
        });
        
        // Store session and redirect
        sessionStorage.setItem('currentCallId', callId);
        sessionStorage.setItem('callRole', 'listener');
        
        alert(`Call initiated with ${whisperName}! Waiting for acceptance...`);
        window.location.href = `chat-room.html?call=${callId}`;
        
    } catch (error) {
        console.error("Error starting call:", error);
        alert("Failed to start call: " + error.message);
    }
}

// Initialize loader
let whisperLoader;
document.addEventListener('DOMContentLoaded', () => {
    whisperLoader = new WhisperLoader();
});
