// Payment Handler - Creates call after successful payment
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const whisperId = urlParams.get('whisper');
    const price = urlParams.get('price');
    const whisperName = urlParams.get('name') || 'Whisper';
    
    if (!whisperId || !price) {
        alert("Missing call information");
        window.location.href = 'index.html';
        return;
    }
    
    // Display call info
    document.getElementById('payment-description').textContent = 
        `Payment for 5-minute call with ${decodeURIComponent(whisperName)}: ${price} credits`;
    
    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please login first");
        window.location.href = 'whisper-login.html';
        return;
    }
    
    // Handle demo payment (for testing)
    document.getElementById('demo-payment').addEventListener('click', async () => {
        if (confirm('DEMO: Process payment and start call?')) {
            try {
                // Create call in Firestore
                const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const channelName = 'whisper_' + whisperId + '_' + callId;
                
                await firebase.firestore().collection('calls').doc(callId).set({
                    callId: callId,
                    whisperId: whisperId,
                    listenerId: user.uid,
                    price: parseInt(price),
                    status: 'pending',
                    channelName: channelName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    startedAt: null,
                    endedAt: null,
                    duration: 300
                });
                
                // Store call info and redirect
                sessionStorage.setItem('currentCallId', callId);
                sessionStorage.setItem('currentChannel', channelName);
                sessionStorage.setItem('callRole', 'listener');
                
                alert("Payment successful! Call initiated. Waiting for whisper to accept...");
                window.location.href = `chat-room.html?call=${callId}`;
            } catch (error) {
                console.error("Error creating call:", error);
                alert("Failed to create call: " + error.message);
            }
        }
    });
    
    // Handle real Stripe payment (you need to implement this)
    document.getElementById('stripe-payment').addEventListener('click', async () => {
        alert("Real Stripe payment would be processed here");
        // Implement Stripe Checkout here
    });
});
