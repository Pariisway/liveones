// Voice Chat WebRTC Implementation
class VoiceChat {
    constructor(roomId, isCaller) {
        this.roomId = roomId;
        this.isCaller = isCaller;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.database = null;
        
        // WebRTC configuration
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
        
        // Firebase references
        this.offerRef = null;
        this.answerRef = null;
        this.candidatesRef = null;
        this.hangupRef = null;
        
        // State
        this.isConnected = false;
        this.isMuted = false;
        
        console.log(`🎤 VoiceChat initialized: Room=${roomId}, Caller=${isCaller}`);
    }
    
    // Initialize with Firebase database
    async init(database) {
        try {
            this.database = database;
            
            // Setup Firebase references
            this.offerRef = database.ref('rooms/' + this.roomId + '/offer');
            this.answerRef = database.ref('rooms/' + this.roomId + '/answer');
            this.candidatesRef = database.ref('rooms/' + this.roomId + '/candidates');
            this.hangupRef = database.ref('rooms/' + this.roomId + '/hangup');
            
            // Clear previous data
            await this.cleanupFirebaseData();
            
            // Setup listeners based on role
            if (this.isCaller) {
                await this.setupAsCaller();
            } else {
                await this.setupAsReceiver();
            }
            
            return true;
        } catch (error) {
            console.error("❌ VoiceChat init failed:", error);
            throw error;
        }
    }
    
    // Setup as caller (initiates call)
    async setupAsCaller() {
        console.log("📞 Setting up as caller...");
        
        // Get microphone access
        await this.getUserMedia();
        
        // Create peer connection
        this.createPeerConnection();
        
        // Add local stream to connection
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });
        
        // Create and send offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        // Save offer to Firebase
        await this.offerRef.set({
            type: 'offer',
            sdp: offer.sdp,
            timestamp: Date.now()
        });
        
        console.log("✅ Caller: Offer sent to Firebase");
        
        // Listen for answer
        this.answerRef.on('value', async (snapshot) => {
            if (snapshot.exists() && this.peerConnection.remoteDescription === null) {
                const answer = snapshot.val();
                console.log("📥 Caller: Received answer");
                
                const remoteDesc = new RTCSessionDescription({
                    type: 'answer',
                    sdp: answer.sdp
                });
                
                await this.peerConnection.setRemoteDescription(remoteDesc);
                console.log("✅ Caller: Remote description set");
            }
        });
        
        // Listen for ICE candidates from receiver
        this.listenForRemoteCandidates();
        
        // Listen for hangup
        this.hangupRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                console.log("📞 Caller: Receiver hung up");
                this.endCall('Receiver ended the call');
            }
        });
    }
    
    // Setup as receiver (answers call)
    async setupAsReceiver() {
        console.log("👂 Setting up as receiver...");
        
        // Listen for offer
        this.offerRef.on('value', async (snapshot) => {
            if (snapshot.exists() && !this.peerConnection) {
                const offer = snapshot.val();
                console.log("📥 Receiver: Received offer");
                
                // Get microphone access
                await this.getUserMedia();
                
                // Create peer connection
                this.createPeerConnection();
                
                // Add local stream to connection
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
                
                // Set remote description
                const remoteDesc = new RTCSessionDescription({
                    type: 'offer',
                    sdp: offer.sdp
                });
                
                await this.peerConnection.setRemoteDescription(remoteDesc);
                
                // Create and send answer
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);
                
                // Save answer to Firebase
                await this.answerRef.set({
                    type: 'answer',
                    sdp: answer.sdp,
                    timestamp: Date.now()
                });
                
                console.log("✅ Receiver: Answer sent to Firebase");
                
                // Listen for ICE candidates from caller
                this.listenForRemoteCandidates();
                
                // Listen for hangup
                this.hangupRef.on('value', (snapshot) => {
                    if (snapshot.exists()) {
                        console.log("📞 Receiver: Caller hung up");
                        this.endCall('Caller ended the call');
                    }
                });
            }
        });
    }
    
    // Get user's microphone
    async getUserMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false // Voice-only
            });
            
            console.log("✅ Microphone access granted");
            
            // Create local audio element for self-monitoring (muted)
            const localAudio = document.getElementById('localAudio');
            if (localAudio) {
                localAudio.srcObject = this.localStream;
                localAudio.muted = true; // Prevent echo
            }
            
            return this.localStream;
        } catch (error) {
            console.error("❌ Microphone access denied:", error);
            throw new Error('Microphone access is required for voice chat');
        }
    }
    
    // Create WebRTC peer connection
    createPeerConnection() {
        console.log("🔧 Creating peer connection...");
        
        this.peerConnection = new RTCPeerConnection(this.config);
        
        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Save candidate to Firebase
                this.candidatesRef.push({
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    timestamp: Date.now(),
                    from: this.isCaller ? 'caller' : 'receiver'
                });
            }
        };
        
        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log("🎧 Received remote audio stream");
            this.remoteStream = event.streams[0];
            
            // Play remote audio
            const remoteAudio = document.getElementById('remoteAudio');
            if (remoteAudio) {
                remoteAudio.srcObject = this.remoteStream;
                remoteAudio.play().catch(e => console.log("Audio play error:", e));
            }
            
            this.isConnected = true;
            
            // Update UI
            if (typeof this.onConnected === 'function') {
                this.onConnected();
            }
        };
        
        // Handle connection state
        this.peerConnection.onconnectionstatechange = () => {
            console.log("Connection state:", this.peerConnection.connectionState);
            
            if (this.peerConnection.connectionState === 'connected') {
                this.isConnected = true;
                console.log("✅ WebRTC connection established!");
            }
            
            if (this.peerConnection.connectionState === 'disconnected' ||
                this.peerConnection.connectionState === 'failed' ||
                this.peerConnection.connectionState === 'closed') {
                this.endCall('Connection lost');
            }
        };
    }
    
    // Listen for remote ICE candidates
    listenForRemoteCandidates() {
        this.candidatesRef.on('child_added', async (snapshot) => {
            const candidateData = snapshot.val();
            
            // Only process candidates from the other party
            if (candidateData.from === (this.isCaller ? 'receiver' : 'caller')) {
                const candidate = new RTCIceCandidate({
                    candidate: candidateData.candidate,
                    sdpMid: candidateData.sdpMid,
                    sdpMLineIndex: candidateData.sdpMLineIndex
                });
                
                try {
                    await this.peerConnection.addIceCandidate(candidate);
                    console.log("✅ Added ICE candidate");
                } catch (error) {
                    console.warn("Failed to add ICE candidate:", error);
                }
            }
        });
    }
    
    // Toggle mute
    toggleMute() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            
            this.isMuted = !this.isMuted;
            console.log(this.isMuted ? "🔇 Muted" : "🔊 Unmuted");
            
            return this.isMuted;
        }
        return false;
    }
    
    // End the call
    async endCall(reason = 'Call ended') {
        console.log("📞 Ending call:", reason);
        
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
        }
        
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        // Send hangup signal
        if (this.hangupRef) {
            await this.hangupRef.set({
                timestamp: Date.now(),
                endedBy: this.isCaller ? 'caller' : 'receiver',
                reason: reason
            });
        }
        
        // Cleanup Firebase data
        await this.cleanupFirebaseData();
        
        this.isConnected = false;
        
        // Update UI
        if (typeof this.onDisconnected === 'function') {
            this.onDisconnected(reason);
        }
        
        return true;
    }
    
    // Cleanup Firebase data
    async cleanupFirebaseData() {
        try {
            if (this.database) {
                const roomRef = this.database.ref('rooms/' + this.roomId);
                await roomRef.remove();
            }
        } catch (error) {
            console.warn("Cleanup error:", error);
        }
    }
    
    // Set callbacks
    onConnected(callback) {
        this.onConnected = callback;
    }
    
    onDisconnected(callback) {
        this.onDisconnected = callback;
    }
}

// Make globally available
window.VoiceChat = VoiceChat;
