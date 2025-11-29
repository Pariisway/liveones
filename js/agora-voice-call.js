// Agora Voice Call Manager
class AgoraVoiceCall {
    constructor() {
        this.client = null;
        this.localStream = null;
        this.remoteStream = null;
        this.channel = null;
        this.isInCall = false;
        this.callTimer = null;
        this.timeRemaining = 300; // 5 minutes in seconds
        this.appId = '966c8e41da614722a88d4372c3d95dba';
    }

    // Initialize Agora client
    async initializeClient() {
        try {
            this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            
            await this.client.join(
                this.appId,
                this.channel,
                null, // token - would be needed for production
                null  // uid
            );
            
            console.log('✅ Joined Agora channel:', this.channel);
            return true;
        } catch (error) {
            console.error('❌ Failed to join Agora channel:', error);
            return false;
        }
    }

    // Start a voice call
    async startCall(whisperId, customerId) {
        try {
            this.channel = `call_${whisperId}_${customerId}_${Date.now()}`;
            
            // Create unique call session in Firestore
            await this.createCallSession(whisperId, customerId);
            
            // Initialize Agora client
            const success = await this.initializeClient();
            if (!success) {
                throw new Error('Failed to initialize voice call');
            }

            // Create local audio stream
            this.localStream = await AgoraRTC.createMicrophoneAudioTrack();
            await this.client.publish([this.localStream]);

            // Listen for remote streams
            this.client.on('user-published', async (user, mediaType) => {
                if (mediaType === 'audio') {
                    this.remoteStream = await this.client.subscribe(user, mediaType);
                    this.remoteStream.play('remote-audio');
                    console.log('🔊 Remote user connected');
                }
            });

            this.isInCall = true;
            this.startCallTimer();
            this.updateCallUI(true);
            
            return true;
        } catch (error) {
            console.error('❌ Call start error:', error);
            this.updateCallUI(false, error.message);
            return false;
        }
    }

    // Create call session in Firestore
    async createCallSession(whisperId, customerId) {
        try {
            const callData = {
                whisperId: whisperId,
                customerId: customerId,
                channel: this.channel,
                startTime: new Date().toISOString(),
                duration: 300, // 5 minutes
                status: 'active',
                amount: 15.00,
                paymentIntent: this.getPaymentIntentFromURL() // Get from URL params
            };

            // Save to Firestore
            await firebase.firestore().collection('calls').add(callData);
            console.log('✅ Call session created in Firestore');
        } catch (error) {
            console.error('❌ Error creating call session:', error);
        }
    }

    // Get payment intent from URL
    getPaymentIntentFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('payment_intent') || 'unknown';
    }

    // Start the 5-minute call timer
    startCallTimer() {
        this.callTimer = setInterval(() => {
            this.timeRemaining--;
            
            // Update timer display
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            document.getElementById('call-timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // End call when time is up
            if (this.timeRemaining <= 0) {
                this.endCall();
            }
        }, 1000);
    }

    // End the call
    async endCall() {
        try {
            clearInterval(this.callTimer);
            
            if (this.localStream) {
                this.localStream.close();
            }
            
            if (this.client) {
                await this.client.leave();
            }
            
            this.isInCall = false;
            this.updateCallUI(false);
            
            // Update call session in Firestore
            await this.updateCallSession('completed');
            
            console.log('✅ Call ended successfully');
        } catch (error) {
            console.error('❌ Error ending call:', error);
        }
    }

    // Update call session in Firestore
    async updateCallSession(status) {
        try {
            const callsRef = firebase.firestore().collection('calls');
            const query = callsRef.where('channel', '==', this.channel);
            const snapshot = await query.get();
            
            if (!snapshot.empty) {
                const callDoc = snapshot.docs[0];
                await callDoc.ref.update({
                    status: status,
                    endTime: new Date().toISOString(),
                    actualDuration: 300 - this.timeRemaining
                });
            }
        } catch (error) {
            console.error('❌ Error updating call session:', error);
        }
    }

    // Update call UI
    updateCallUI(isConnected, errorMessage = '') {
        const callContainer = document.getElementById('call-container');
        const callStatus = document.getElementById('call-status');
        
        if (isConnected) {
            callStatus.innerHTML = '<span style="color: #4ADE80;">🔊 Call Connected - Speak Now!</span>';
            document.getElementById('end-call-btn').style.display = 'block';
        } else if (errorMessage) {
            callStatus.innerHTML = `<span style="color: #EF4444;">❌ Call Failed: ${errorMessage}</span>`;
        } else {
            callStatus.innerHTML = '<span>Call Ended</span>';
        }
    }
}

// Global Agora instance
let agoraCall;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    agoraCall = new AgoraVoiceCall();
    
    // Check if we're on a call page and auto-start if payment was successful
    if (window.location.pathname.includes('call-success.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentIntent = urlParams.get('payment_intent');
        
        if (paymentIntent) {
            // In a real scenario, you'd get whisperId and customerId from your backend
            // For now, we'll use demo values
            setTimeout(() => {
                const whisperId = 'demo-whisper';
                const customerId = 'demo-customer';
                agoraCall.startCall(whisperId, customerId);
            }, 2000);
        }
    }
});

// End call function for button
function endAgoraCall() {
    if (agoraCall) {
        agoraCall.endCall();
    }
}
