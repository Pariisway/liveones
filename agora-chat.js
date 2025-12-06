// Agora Chat Integration for House of Whispers
class AgoraChatManager {
    constructor() {
        this.appId = 'YOUR_AGORA_APP_ID'; // Replace with your Agora App ID
        this.channel = null;
        this.client = null;
        this.localAudioTrack = null;
        this.remoteAudioTracks = {};
        this.isInCall = false;
        this.isListener = false;
        this.callDuration = 5 * 60; // 5 minutes in seconds
        this.timerInterval = null;
        this.timeRemaining = 5 * 60;
    }
    
    // Initialize Agora
    async initialize() {
        // Load Agora RTC SDK
        await this.loadAgoraSDK();
        
        // Initialize the client
        this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        // Listen for events
        this.setupEventListeners();
        
        // Check if this is a listener or caller
        this.isListener = !!localStorage.getItem('currentUser');
        
        return this.client;
    }
    
    async loadAgoraSDK() {
        return new Promise((resolve) => {
            if (window.AgoraRTC) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.19.0.js';
            script.onload = () => {
                console.log('Agora SDK loaded');
                resolve();
            };
            document.head.appendChild(script);
        });
    }
    
    setupEventListeners() {
        // Listen for remote users joining
        this.client.on('user-published', async (user, mediaType) => {
            await this.client.subscribe(user, mediaType);
            
            if (mediaType === 'audio') {
                const remoteAudioTrack = user.audioTrack;
                this.remoteAudioTracks[user.uid] = remoteAudioTrack;
                remoteAudioTrack.play();
                
                // Start the 5-minute timer when someone joins
                if (Object.keys(this.remoteAudioTracks).length === 1) {
                    this.startTimer();
                }
            }
        });
        
        // Listen for remote users leaving
        this.client.on('user-unpublished', (user) => {
            delete this.remoteAudioTracks[user.uid];
            
            // End call if everyone left
            if (Object.keys(this.remoteAudioTracks).length === 0) {
                this.endCall();
            }
        });
        
        // Listen for network quality
        this.client.on('network-quality', (stats) => {
            console.log('Network quality:', stats);
        });
    }
    
    // Join a chat room
    async joinChannel(channelName, token = null, uid = null) {
        try {
            // Generate channel name from call data
            const callData = JSON.parse(localStorage.getItem('activeCall') || localStorage.getItem('currentCall'));
            if (!callData) {
                throw new Error('No active call found');
            }
            
            // Use listenerId + timestamp as channel name
            channelName = `whisper_${callData.listenerId}_${Date.now()}`;
            
            // Join the channel
            await this.client.join(this.appId, channelName, token, uid);
            
            // Create and publish local audio track
            this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            await this.client.publish([this.localAudioTrack]);
            
            this.channel = channelName;
            this.isInCall = true;
            
            // Store channel info
            localStorage.setItem('agoraChannel', channelName);
            
            console.log('Joined channel:', channelName);
            return channelName;
            
        } catch (error) {
            console.error('Failed to join channel:', error);
            throw error;
        }
    }
    
    // Leave the chat room
    async leaveChannel() {
        try {
            if (this.localAudioTrack) {
                this.localAudioTrack.close();
                this.localAudioTrack = null;
            }
            
            if (this.client) {
                await this.client.leave();
            }
            
            this.channel = null;
            this.isInCall = false;
            this.stopTimer();
            
            // Clear channel info
            localStorage.removeItem('agoraChannel');
            
            console.log('Left channel');
            
        } catch (error) {
            console.error('Failed to leave channel:', error);
        }
    }
    
    // Start the 5-minute timer
    startTimer() {
        this.timeRemaining = this.callDuration;
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            
            // Update timer display
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            document.getElementById('sessionTimer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Change color when under 1 minute
            if (this.timeRemaining <= 60) {
                document.getElementById('sessionTimer').style.color = '#ff4444';
            }
            
            // End call when time is up
            if (this.timeRemaining <= 0) {
                this.endCall();
            }
        }, 1000);
    }
    
    // Stop the timer
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // End the call
    async endCall() {
        this.stopTimer();
        
        // Leave the channel
        await this.leaveChannel();
        
        // Show completion message
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            const endMessage = document.createElement('div');
            endMessage.className = 'message system';
            endMessage.innerHTML = `<p><strong>Session ended.</strong> Thank you for using House of Whispers.</p>`;
            chatMessages.appendChild(endMessage);
        }
        
        // Disable buttons
        const endCallBtn = document.getElementById('endCallBtn');
        if (endCallBtn) {
            endCallBtn.disabled = true;
            endCallBtn.innerHTML = '<i class="fas fa-check"></i> Session Complete';
            endCallBtn.className = 'btn btn-secondary';
        }
        
        // Record the call completion for listeners
        if (this.isListener) {
            this.recordCallCompletion();
        }
        
        // Redirect after 5 seconds
        setTimeout(() => {
            if (this.isListener) {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 5000);
    }
    
    // Record call completion in listener's history
    recordCallCompletion() {
        const callData = JSON.parse(localStorage.getItem('activeCall'));
        if (!callData) return;
        
        let userData = JSON.parse(localStorage.getItem('userData')) || {
            calls: 0,
            hours: 0,
            earnings: 0,
            callHistory: []
        };
        
        const callDuration = Math.max(1, Math.floor((this.callDuration - this.timeRemaining) / 60));
        
        userData.calls += 1;
        userData.hours += callDuration / 60;
        userData.earnings += 12; // Listener gets $12
        
        userData.callHistory.push({
            callerEmail: callData.callerEmail || 'Anonymous',
            timestamp: new Date().toISOString(),
            duration: callDuration,
            amount: 12
        });
        
        localStorage.setItem('userData', JSON.stringify(userData));
    }
    
    // Toggle microphone mute
    toggleMute() {
        if (this.localAudioTrack) {
            this.localAudioTrack.setEnabled(!this.localAudioTrack.enabled);
            return !this.localAudioTrack.enabled;
        }
        return false;
    }
}

// Initialize Agora when page loads
let agoraManager;

document.addEventListener('DOMContentLoaded', async function() {
    // Only initialize on chat pages
    if (window.location.pathname.includes('chat-active')) {
        agoraManager = new AgoraChatManager();
        
        try {
            await agoraManager.initialize();
            
            // Join channel when page loads
            const channelName = await agoraManager.joinChannel();
            console.log('Joined Agora channel:', channelName);
            
        } catch (error) {
            console.error('Failed to initialize Agora:', error);
            alert('Failed to initialize voice chat. Please refresh the page.');
        }
    }
});
