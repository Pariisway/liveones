// FIXED Call Flow System - Waits for Firebase

class CallFlowSystem {
    constructor() {
        this.currentCall = null;
        this.callListener = null;
        this.agoraClient = null;
        this.initialized = false;
        
        // Wait for DOM and Firebase
        this.waitForFirebase();
    }
    
    waitForFirebase() {
        // Check if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.waitForFirebase());
            return;
        }
        
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined' || 
            typeof firebase.auth === 'undefined' || 
            typeof firebase.firestore === 'undefined') {
            console.log("Waiting for Firebase to load...");
            setTimeout(() => this.waitForFirebase(), 100);
            return;
        }
        
        // Firebase is loaded, initialize
        this.init();
    }
    
    init() {
        if (this.initialized) return;
        
        console.log("Call Flow System Initializing...");
        this.initialized = true;
        
        // Set up Firebase auth listener
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.userId = user.uid;
                this.setupCallListeners();
            }
        });
        
        // Set up call buttons if on index page
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            this.setupCallButtons();
        }
        
        // Set up chat room if on chat-room page
        if (window.location.pathname.includes('chat-room.html')) {
            this.setupChatRoom();
        }
        
        // Set up whisper dashboard listener
        if (window.location.pathname.includes('whisper-dashboard.html')) {
            this.setupWhisperDashboard();
        }
    }
    
    setupCallListeners() {
        // Listen for user's active calls
        if (!this.userId) return;
        
        this.callListener = firebase.firestore().collection('calls')
            .where('listenerId', '==', this.userId)
            .where('status', 'in', ['pending', 'active', 'waiting'])
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    const call = change.doc.data();
                    console.log("User's call updated:", call.status);
                });
            });
    }
    
    setupCallButtons() {
        // This is called by load-real-whispers.js now
        console.log("Call buttons setup deferred to whisper loader");
    }
    
    setupWhisperDashboard() {
        console.log("Setting up whisper dashboard notifications...");
        
        // Wait for user to be authenticated
        firebase.auth().onAuthStateChanged(user => {
            if (!user) return;
            
            this.userId = user.uid;
            
            // Listen for incoming calls
            this.callListener = firebase.firestore().collection('calls')
                .where('whisperId', '==', user.uid)
                .where('status', '==', 'pending')
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const call = change.doc.data();
                            console.log("New call for whisper:", call.callId);
                            this.showCallNotification(call);
                        }
                    });
                });
        });
    }
    
    showCallNotification(call) {
        // Check if notification already exists
        if (document.querySelector('.call-notification')) return;
        
        const notification = document.createElement('div');
        notification.className = 'call-notification';
        notification.innerHTML = `
            <div class="notification-overlay">
                <div class="notification-box">
                    <h3><i class="fas fa-phone"></i> Incoming Call!</h3>
                    <p>A listener wants to talk with you</p>
                    <div class="call-details">
                        <p><strong>Price:</strong> ${call.price} credits</p>
                        <p><strong>Duration:</strong> 5 minutes</p>
                    </div>
                    <div class="notification-buttons">
                        <button class="btn-accept">Accept Call</button>
                        <button class="btn-decline">Decline</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles if not present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .notification-box {
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .notification-buttons {
                    display: flex;
                    gap: 15px;
                    margin-top: 20px;
                }
                .btn-accept, .btn-decline {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .btn-accept {
                    background: #6c5ce7;
                    color: white;
                }
                .btn-accept:hover {
                    background: #5b4bd8;
                }
                .btn-decline {
                    background: #ddd;
                    color: #333;
                }
                .btn-decline:hover {
                    background: #ccc;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add event listeners
        notification.querySelector('.btn-accept').addEventListener('click', () => {
            this.acceptCall(call.callId);
            notification.remove();
        });
        
        notification.querySelector('.btn-decline').addEventListener('click', () => {
            this.declineCall(call.callId);
            notification.remove();
        });
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                this.declineCall(call.callId);
            }
        }, 30000);
    }
    
    async acceptCall(callId) {
        try {
            await firebase.firestore().collection('calls').doc(callId).update({
                status: 'accepted',
                whisperAcceptedAt: new Date()
            });
            
            // Get call details and redirect
            const callDoc = await firebase.firestore().collection('calls').doc(callId).get();
            const call = callDoc.data();
            
            sessionStorage.setItem('currentCallId', callId);
            sessionStorage.setItem('callRole', 'whisper');
            sessionStorage.setItem('channelName', call.channelName || ('call_' + callId));
            
            window.location.href = `chat-room.html?call=${callId}`;
        } catch (error) {
            console.error("Error accepting call:", error);
            alert("Failed to accept call: " + error.message);
        }
    }
    
    async declineCall(callId) {
        try {
            await firebase.firestore().collection('calls').doc(callId).update({
                status: 'declined',
                endedAt: new Date()
            });
        } catch (error) {
            console.error("Error declining call:", error);
        }
    }
    
    setupChatRoom() {
        console.log("Setting up chat room...");
        
        const urlParams = new URLSearchParams(window.location.search);
        const callId = urlParams.get('call') || sessionStorage.getItem('currentCallId');
        
        if (!callId) {
            console.error("No call ID found");
            window.location.href = 'index.html';
            return;
        }
        
        this.callId = callId;
        this.role = sessionStorage.getItem('callRole') || 'listener';
        
        // Listen to call updates
        this.setupCallListener(callId);
    }
    
    setupCallListener(callId) {
        firebase.firestore().collection('calls').doc(callId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const call = doc.data();
                    this.currentCall = call;
                    
                    // Update UI
                    this.updateChatRoomUI(call);
                    
                    // Start timer if both accepted
                    if (call.status === 'accepted' && !this.timerStarted) {
                        this.startCallTimer();
                    }
                    
                    // Handle call end
                    if (call.status === 'completed' || call.status === 'ended') {
                        this.endCall();
                    }
                }
            }, error => {
                console.error("Error listening to call:", error);
            });
    }
    
    updateChatRoomUI(call) {
        const statusElement = document.getElementById('call-status');
        const timerElement = document.getElementById('timer');
        
        if (statusElement) {
            statusElement.textContent = call.status.charAt(0).toUpperCase() + call.status.slice(1);
            statusElement.className = `status-${call.status}`;
        }
        
        if (timerElement && call.status === 'accepted') {
            timerElement.style.display = 'block';
        }
    }
    
    startCallTimer() {
        console.log("Starting call timer...");
        this.timerStarted = true;
        
        let timeLeft = 300; // 5 minutes in seconds
        const timerElement = document.getElementById('timer');
        
        if (!timerElement) {
            // Create timer element if it doesn't exist
            const timerDiv = document.createElement('div');
            timerDiv.id = 'timer';
            timerDiv.className = 'timer-display';
            timerDiv.textContent = '05:00';
            document.querySelector('.main-content').prepend(timerDiv);
        }
        
        this.timerInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.endCall();
            }
            
            timeLeft--;
        }, 1000);
    }
    
    async endCall() {
        console.log("Ending call...");
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Update call status
        if (this.callId) {
            try {
                await firebase.firestore().collection('calls').doc(this.callId).update({
                    status: 'completed',
                    endedAt: new Date()
                });
            } catch (error) {
                console.error("Error updating call status:", error);
            }
        }
        
        // Show completion message
        alert("Call completed! Thank you for using House of Whispers.");
        
        // Redirect based on role
        if (this.role === 'whisper') {
            window.location.href = 'whisper-dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Initialize only once
if (!window.callFlowSystem) {
    window.callFlowSystem = new CallFlowSystem();
}
