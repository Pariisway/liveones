// Whisper Notifications - Real-time call alerts
document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('whisper-dashboard')) return;
    
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Listen for incoming calls
    const unsubscribe = firebase.firestore().collection('calls')
        .where('whisperId', '==', user.uid)
        .where('status', '==', 'pending')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const call = change.doc.data();
                    showIncomingCallNotification(call);
                }
            });
        });
    
    // Show notification
    function showIncomingCallNotification(call) {
        // Remove any existing notifications
        const existing = document.querySelector('.incoming-call-notification');
        if (existing) existing.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'incoming-call-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>📞 Incoming Call!</h3>
                <p>Someone wants to talk with you</p>
                <p><strong>Price:</strong> ${call.price} credits</p>
                <p><strong>Duration:</strong> 5 minutes</p>
                <div class="notification-actions">
                    <button class="btn-accept">Accept Call</button>
                    <button class="btn-decline">Decline</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add event listeners
        notification.querySelector('.btn-accept').onclick = async () => {
            try {
                await firebase.firestore().collection('calls').doc(call.callId).update({
                    status: 'accepted',
                    whisperAcceptedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                sessionStorage.setItem('currentCallId', call.callId);
                sessionStorage.setItem('callRole', 'whisper');
                window.location.href = `chat-room.html?call=${call.callId}`;
                
            } catch (error) {
                console.error("Error accepting call:", error);
                alert("Failed to accept call: " + error.message);
            }
        };
        
        notification.querySelector('.btn-decline').onclick = async () => {
            await firebase.firestore().collection('calls').doc(call.callId).update({
                status: 'declined',
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            notification.remove();
        };
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                // Auto-decline if not answered
                firebase.firestore().collection('calls').doc(call.callId).update({
                    status: 'missed',
                    endedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }, 30000);
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        unsubscribe();
    });
});
