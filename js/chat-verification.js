// Chat Room Verification System
class ChatVerification {
    constructor() {
        this.callId = null;
        this.role = null;
        this.timer = null;
        this.init();
    }
    
    init() {
        console.log("Chat Verification Initializing...");
        
        // Get call info from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.callId = urlParams.get('call') || sessionStorage.getItem('currentCallId');
        this.role = sessionStorage.getItem('callRole') || 'listener';
        
        if (!this.callId) {
            alert("No call session found");
            window.location.href = 'index.html';
            return;
        }
        
        this.verifyCall();
        this.setupListeners();
    }
    
    async verifyCall() {
        try {
            // Get call data
            const callDoc = await firebase.firestore().collection('calls').doc(this.callId).get();
            
            if (!callDoc.exists) {
                alert("Call not found");
                window.location.href = 'index.html';
                return;
            }
            
            const call = callDoc.data();
            console.log("Call verified:", call);
            
            // Update UI with call info
            this.updateCallUI(call);
            
            // Start Agora if call is active
            if (call.status === 'active' || call.status === 'accepted') {
                this.startAgoraCall(call.channelName);
            }
            
            // Listen for call updates
            this.setupCallListener();
            
        } catch (error) {
            console.error("Verification error:", error);
        }
    }
    
    updateCallUI(call) {
        // Update page title
        document.title = `Call with ${call.whisperName || 'Whisper'} | House of Whispers`;
        
        // Create call UI if not exists
        if (!document.getElementById('call-container')) {
            document.body.innerHTML = `
                <div class="chat-room">
                    <div class="background-elements">
                        <div class="floating-element"></div>
                        <div class="floating-element"></div>
                        <div class="floating-element"></div>
                    </div>
                    
                    <div class="container">
                        <header class="header" style="background: rgba(255,255,255,0.1); color: white;">
                            <div class="logo-container">
                                <div class="logo-icon">👂</div>
                                <h1>House of Whispers</h1>
                            </div>
                            <p class="tagline">Private Chat Room</p>
                        </header>
                        
                        <main class="main-content">
                            <div id="call-container" class="call-container">
                                <div class="timer-display" id="timer">05:00</div>
                                
                                <div class="participants-grid">
                                    <div class="participant-card">
                                        <div class="participant-avatar">
                                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(call.whisperName || 'Whisper')}&background=6c5ce7&color=fff&size=150" alt="Whisper">
                                        </div>
                                        <h3>${call.whisperName || 'Whisper'}</h3>
                                        <p>Listening...</p>
                                    </div>
                                    
                                    <div class="participant-card">
                                        <div class="participant-avatar">
                                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(call.listenerName || 'You')}&background=00cec9&color=fff&size=150" alt="You">
                                        </div>
                                        <h3>${this.role === 'listener' ? 'You' : call.listenerName || 'Listener'}</h3>
                                        <p>${this.role === 'listener' ? 'Speaking' : 'Listening'}</p>
                                    </div>
                                </div>
                                
                                <div class="call-controls">
                                    <button class="control-btn mic-btn" onclick="toggleMic()">
                                        <i class="fas fa-microphone"></i>
                                    </button>
                                    <button class="control-btn end-btn" onclick="endCall()">
                                        <i class="fas fa-phone-slash"></i> End Call
                                    </button>
                                    <button class="control-btn volume-btn" onclick="toggleVolume()">
                                        <i class="fas fa-volume-up"></i>
                                    </button>
                                </div>
                                
                                <div class="call-info">
                                    <p>Status: <span id="call-status">${call.status}</span></p>
                                    <p>Price: ${call.price} credits</p>
                                    <p>Duration: 5 minutes</p>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            `;
        }
        
        // Start timer if call is active
        if (call.status === 'active') {
            this.startTimer(300); // 5 minutes
        }
    }
    
    startTimer(seconds) {
        let timeLeft = seconds;
        const timerElement = document.getElementById('timer');
        
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            
            if (timerElement) {
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            
            // Color change warnings
            if (timeLeft <= 60) {
                if (timerElement) timerElement.style.color = '#ff6b6b';
            } else if (timeLeft <= 120) {
                if (timerElement) timerElement.style.color = '#fdcb6e';
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.timer);
                this.endCall();
            }
            
            timeLeft--;
        }, 1000);
    }
    
    async startAgoraCall(channelName) {
        console.log("Starting Agora call on channel:", channelName);
        
        // Mock Agora implementation
        // In production, you would initialize Agora SDK here
        alert("Agora call would start now. Channel: " + channelName);
        
        // Update call status to active
        await firebase.firestore().collection('calls').doc(this.callId).update({
            status: 'active',
            startedAt: new Date()
        });
    }
    
    setupCallListener() {
        firebase.firestore().collection('calls').doc(this.callId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const call = doc.data();
                    
                    // Update status display
                    const statusElement = document.getElementById('call-status');
                    if (statusElement) {
                        statusElement.textContent = call.status;
                    }
                    
                    // Handle status changes
                    switch(call.status) {
                        case 'active':
                            if (!this.timer) {
                                this.startTimer(call.duration || 300);
                            }
                            break;
                        case 'completed':
                        case 'ended':
                            this.endCall();
                            break;
                    }
                }
            });
    }
    
    async endCall() {
        clearInterval(this.timer);
        
        // Update call status
        await firebase.firestore().collection('calls').doc(this.callId).update({
            status: 'completed',
            endedAt: new Date()
        });
        
        alert("Call completed! Thank you for using House of Whispers.");
        
        // Redirect based on role
        if (this.role === 'whisper') {
            window.location.href = 'whisper-dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    }
    
    setupListeners() {
        // Add control functions to window
        window.toggleMic = () => {
            alert("Microphone toggled (Agora implementation needed)");
        };
        
        window.toggleVolume = () => {
            alert("Volume toggled (Agora implementation needed)");
        };
        
        window.endCall = () => {
            if (confirm("Are you sure you want to end the call?")) {
                this.endCall();
            }
        };
    }
}

// Initialize on chat-room.html
if (window.location.pathname.includes('chat-room.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        new ChatVerification();
    });
}
