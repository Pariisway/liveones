// Smart call notifications for whispers
// Only shows notifications when whisper is online

let notificationCheckInterval = null;
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 30000; // 30 seconds between notifications

// Initialize notifications
function initNotifications() {
    console.log('🔔 Initializing notification system...');
    
    // Check every 10 seconds
    notificationCheckInterval = setInterval(checkForNewCalls, 10000);
    
    // Initial check
    setTimeout(checkForNewCalls, 2000);
}

// Check for new calls
async function checkForNewCalls() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('No user logged in');
        return;
    }
    
    // Check if user is online/available
    try {
        const userDoc = await firebase.firestore().collection('whispers').doc(user.uid).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        if (!userData.isAvailable) {
            console.log('User is offline, skipping notification check');
            return;
        }
    } catch (error) {
        console.error('Error checking user availability:', error);
        return;
    }
    
    // Check for new calls
    try {
        const now = Date.now();
        if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
            console.log('In notification cooldown period');
            return;
        }
        
        const snapshot = await firebase.firestore().collection('calls')
            .where('whisperId', '==', user.uid)
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            console.log('No pending calls found');
            return;
        }
        
        const call = snapshot.docs[0].data();
        const callId = snapshot.docs[0].id;
        
        // Check if this call is recent (last 2 minutes)
        const callTime = call.createdAt ? call.createdAt.toDate().getTime() : 0;
        const twoMinutesAgo = now - (2 * 60 * 1000);
        
        if (callTime < twoMinutesAgo) {
            console.log('Call is older than 2 minutes, ignoring');
            return;
        }
        
        // Check if we already showed notification for this call
        const lastCallId = localStorage.getItem('lastNotifiedCall');
        if (lastCallId === callId) {
            console.log('Already notified about this call');
            return;
        }
        
        // Show notification
        console.log('📞 New call found:', callId);
        showCallNotification(callId, call);
        
        // Update tracking
        lastNotificationTime = now;
        localStorage.setItem('lastNotifiedCall', callId);
        
    } catch (error) {
        console.error('Error checking for calls:', error);
    }
}

// Show call notification
function showCallNotification(callId, callData) {
    // Don't show if already showing
    if (document.getElementById('callNotification')) return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'callNotification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            z-index: 99999;
            min-width: 350px;
            border-left: 5px solid #4CAF50;
            animation: slideIn 0.5s ease-out;
        ">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                <div style="font-size: 32px;">📞</div>
                <div>
                    <h3 style="margin: 0; font-size: 20px;">INCOMING CALL!</h3>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Customer waiting to connect</p>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0;"><strong>Earnings:</strong> $12.00</p>
                <p style="margin: 0;"><strong>Duration:</strong> 5 minutes</p>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="acceptCallNow('${callId}')" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    flex: 1;
                    font-weight: bold;
                    font-size: 16px;
                ">
                    ✅ Accept Call
                </button>
                <button onclick="declineCallNow('${callId}')" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    width: 50px;
                ">
                    ❌
                </button>
            </div>
            
            <p style="text-align: center; margin-top: 15px; font-size: 12px; opacity: 0.7;">
                Auto-closes in 30 seconds
            </p>
        </div>
    `;
    
    // Add animation
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
    
    document.body.appendChild(notification);
    
    // Play sound
    playNotificationSound();
    
    // Auto remove after 30 seconds
    setTimeout(() => {
        const notif = document.getElementById('callNotification');
        if (notif) {
            notif.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => notif.remove(), 500);
        }
    }, 30000);
}

// Accept call
async function acceptCallNow(callId) {
    try {
        await firebase.firestore().collection('calls').doc(callId).update({
            status: 'accepted',
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Remove notification
        const notif = document.getElementById('callNotification');
        if (notif) notif.remove();
        
        // Redirect to chat room
        window.location.href = `chat-room.html?call=${callId}&role=whisper`;
        
    } catch (error) {
        console.error('Error accepting call:', error);
        alert('Error accepting call. Please try again.');
    }
}

// Decline call
async function declineCallNow(callId) {
    if (confirm('Are you sure you want to decline this call?')) {
        try {
            await firebase.firestore().collection('calls').doc(callId).update({
                status: 'declined',
                declinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Remove notification
            const notif = document.getElementById('callNotification');
            if (notif) notif.remove();
            
            // Refresh page to update call list
            window.location.reload();
            
        } catch (error) {
            console.error('Error declining call:', error);
        }
    }
}

// Play notification sound
function playNotificationSound() {
    try {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
        
    } catch (error) {
        console.log('Could not play sound:', error);
    }
}

// Start notifications when page loads and user is authenticated
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        if (user && window.location.pathname.includes('whisper-dashboard')) {
            console.log('User authenticated, starting notifications');
            setTimeout(initNotifications, 2000);
        }
    });
});

// Clean up interval when leaving page
window.addEventListener('beforeunload', function() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
    }
});
