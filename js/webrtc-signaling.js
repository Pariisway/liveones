// WebRTC Signaling System using Firebase
class WebRTCManager {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.dataChannel = null;
        this.callId = null;
        this.role = null; // 'caller' or 'callee'
        this.isCallActive = false;
        
        // WebRTC configuration (using free STUN servers)
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        this.db = firebase.firestore();
    }

    // Initialize WebRTC for a call
    async initializeCall(callId, role, whisperId = null) {
        this.callId = callId;
        this.role = role;
        
        try {
            // Get user media (audio only)
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            
            console.log('🎤 Microphone access granted');
            
            // Create peer connection
            this.createPeerConnection();
            
            // Add local stream to connection
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
            
            // Set up signaling listeners
            this.setupSignalingListeners();
            
            // If caller, create offer
            if (this.role === 'caller') {
                await this.createOffer();
            }
            
            return true;
            
        } catch (error) {
            console.error('Error initializing call:', error);
            throw error;
        }
    }

    createPeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.rtcConfig);
        
        // Handle incoming remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('📞 Remote stream received');
            this.remoteStream = event.streams[0];
            this.onRemoteStream(this.remoteStream);
        };
        
        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal('ice-candidate', event.candidate);
            }
        };
        
        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            
            switch (this.peerConnection.connectionState) {
                case 'connected':
                    this.isCallActive = true;
                    this.onCallConnected();
                    break;
                case 'disconnected':
                case 'failed':
                    this.isCallActive = false;
                    this.onCallDisconnected();
                    break;
            }
        };
        
        // Create data channel for call metadata
        if (this.role === 'caller') {
            this.dataChannel = this.peerConnection.createDataChannel('call-data');
            this.setupDataChannel();
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            };
        }
    }

    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
        };
        
        this.dataChannel.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.onDataMessage(data);
        };
    }

    async createOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            await this.sendSignal('offer', offer);
            console.log('📤 Offer created and sent');
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }

    async handleOffer(offer) {
        try {
            await this.peerConnection.setRemoteDescription(offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            await this.sendSignal('answer', answer);
            console.log('📥 Offer received, answer sent');
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(answer) {
        try {
            await this.peerConnection.setRemoteDescription(answer);
            console.log('✅ Answer received, call connected');
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async handleIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    // Firebase signaling - listen for WebRTC signals
    setupSignalingListeners() {
        this.signalUnsubscribe = this.db.collection('calls')
            .doc(this.callId)
            .collection('signaling')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const signal = change.doc.data();
                        this.handleIncomingSignal(signal);
                    }
                });
            });
    }

    handleIncomingSignal(signal) {
        // Don't process our own signals
        if (signal.sender === this.role) return;

        console.log('📡 Incoming signal:', signal.type);

        switch (signal.type) {
            case 'offer':
                this.handleOffer(signal.data);
                break;
            case 'answer':
                this.handleAnswer(signal.data);
                break;
            case 'ice-candidate':
                this.handleIceCandidate(signal.data);
                break;
            case 'end-call':
                this.onCallEndedByPeer();
                break;
        }
    }

    async sendSignal(type, data) {
        try {
            await this.db.collection('calls')
                .doc(this.callId)
                .collection('signaling')
                .add({
                    type: type,
                    data: data,
                    sender: this.role,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
        } catch (error) {
            console.error('Error sending signal:', error);
        }
    }

    // Call management
    async endCall() {
        this.isCallActive = false;
        
        // Send end call signal
        await this.sendSignal('end-call', { reason: 'user-ended' });
        
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        // Clean up signaling listener
        if (this.signalUnsubscribe) {
            this.signalUnsubscribe();
        }
        
        console.log('📞 Call ended');
        this.onCallEnded();
    }

    toggleMute() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            const isMuted = !audioTracks[0].enabled;
            audioTracks[0].enabled = isMuted;
            return !isMuted; // Return new mute state (true = muted)
        }
        return false;
    }

    // Event handlers (to be overridden by the UI)
    onRemoteStream(stream) {
        console.log('Override this with remote audio element setup');
    }

    onCallConnected() {
        console.log('Override this with call connected UI update');
    }

    onCallDisconnected() {
        console.log('Override this with call disconnected UI update');
    }

    onCallEnded() {
        console.log('Override this with call ended UI update');
    }

    onCallEndedByPeer() {
        console.log('Override this with peer ended call UI update');
    }

    onDataMessage(data) {
        console.log('Data channel message:', data);
    }

    // Utility methods
    getCallStats() {
        if (!this.peerConnection) return null;
        
        return {
            connectionState: this.peerConnection.connectionState,
            iceConnectionState: this.peerConnection.iceConnectionState,
            signalingState: this.peerConnection.signalingState
        };
    }

    isCallConnected() {
        return this.peerConnection && 
               this.peerConnection.connectionState === 'connected';
    }
}

// Global WebRTC manager instance
let webRTCManager = null;

// Initialize WebRTC when needed
function initializeWebRTC(callId, role, whisperId = null) {
    if (!webRTCManager) {
        webRTCManager = new WebRTCManager();
    }
    
    return webRTCManager.initializeCall(callId, role, whisperId);
}

// Utility function to generate call ID
function generateCallId() {
    return 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
