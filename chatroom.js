import { 
    auth, db, realtimeDb, agoraConfig,
    doc, getDoc, updateDoc,
    dbRef, onValue, update, remove,
    onAuthStateChanged
} from './firebase-config.js';

let currentUser = null;
let currentCall = null;
let callData = null;
let callRole = 'customer'; // 'customer' or 'whisper'
let timerInterval = null;
let timeRemaining = 300; // 5 minutes in seconds
let agoraClient = null;
let localAudioTrack = null;
let remoteAudioTrack = null;

document.addEventListener('DOMContentLoaded', () => {
    initChatRoom();
});

async function initChatRoom() {
    // Get call ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const callId = urlParams.get('call');
    callRole = urlParams.get('role') || 'customer';
    
    if (!callId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Check authentication
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
        } else if (callRole === 'whisper') {
            // Whispers need to be logged in
            window.location.href = 'index.html#login';
            return;
        }
        
        await loadCallData(callId);
        setupChatRoom();
        startTimer();
        
        if (callRole === 'whisper') {
            await answerCall();
        } else {
            await joinCall();
        }
    });
}

async function loadCallData(callId) {
    try {
        const callDoc = await getDoc(doc(db, 'calls', callId));
        if (callDoc.exists()) {
            callData = { id: callDoc.id, ...callDoc.data() };
            updateCallInfo();
        } else {
            throw new Error('Call not found');
        }
    } catch (error) {
        console.error('Error loading call data:', error);
        alert('Call not found. Redirecting...');
        window.location.href = 'index.html';
    }
}

function updateCallInfo() {
    if (!callData) return;
    
    const callInfo = document.getElementById('callInfo');
    if (callInfo) {
        callInfo.innerHTML = `
            <p>Connected to: <strong>${callRole === 'customer' ? callData.whisperName : callData.customerName || 'Customer'}</strong></p>
            <p>${callRole === 'customer' ? 'You are the customer' : 'You are the whisper'}</p>
        `;
    }
    
    const remoteName = document.getElementById('remoteName');
    if (remoteName) {
        remoteName.textContent = callRole === 'customer' ? callData.whisperName : callData.customerName || 'Customer';
    }
}

function setupChatRoom() {
    // Setup event listeners
    setupEventListeners();
    
    // Update status message
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.innerHTML = callRole === 'customer' 
            ? '<i class="fas fa-spinner fa-spin"></i> Waiting for whisper to join...'
            : '<i class="fas fa-spinner fa-spin"></i> Joining call...';
    }
    
    // Setup real-time listeners
    setupRealtimeListeners();
}

function setupEventListeners() {
    // Mute button
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.addEventListener('click', toggleMute);
    }
    
    // End call button
    const endCallBtn = document.getElementById('endCallBtn');
    if (endCallBtn) {
        endCallBtn.addEventListener('click', endCall);
    }
    
    // Speaker button
    const speakerBtn = document.getElementById('speakerBtn');
    if (speakerBtn) {
        speakerBtn.addEventListener('click', toggleSpeaker);
    }
}

function setupRealtimeListeners() {
    if (!callData) return;
    
    // Listen for call updates
    const callRef = dbRef(realtimeDb, `activeCalls/${callData.id}`);
    onValue(callRef, (snapshot) => {
        const callStatus = snapshot.val();
        if (!callStatus) {
            // Call was ended
            endCall(true);
        }
    });
}

function startTimer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            endCall(true); // Auto-end when time is up
            return;
        }
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update timer color based on remaining time
        if (timeRemaining < 60) {
            timerElement.style.color = '#ff4444';
        } else if (timeRemaining < 180) {
            timerElement.style.color = '#ffaa00';
        }
        
    }, 1000);
}

async function joinCall() {
    // Initialize Agora RTC client
    agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    
    try {
        // Join the channel
        // Note: In production, you need to generate tokens from your server
        const uid = await agoraClient.join(
            agoraConfig.appId,
            callData.id, // Use call ID as channel name
            null, // Token - generate from your server
            currentUser?.uid || `customer_${Date.now()}`
        );
        
        // Create and publish local audio track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish([localAudioTrack]);
        
        // Subscribe to remote tracks
        agoraClient.on('user-published', async (user, mediaType) => {
            if (mediaType === 'audio') {
                remoteAudioTrack = await agoraClient.subscribe(user, mediaType);
                remoteAudioTrack.play();
                
                // Update status
                updateCallStatus('connected');
            }
        });
        
        // Handle user leaving
        agoraClient.on('user-left', (user) => {
            endCall(true);
        });
        
        // Update call as active in Realtime DB
        await set(dbRef(realtimeDb, `activeCalls/${callData.id}`), {
            startedAt: Date.now(),
            participants: [currentUser?.uid || 'customer', callData.whisperId],
            status: 'active'
        });
        
    } catch (error) {
        console.error('Error joining call:', error);
        alert('Failed to join call. Please try again.');
        endCall(false);
    }
}

async function answerCall() {
    // Remove from waiting calls
    await remove(dbRef(realtimeDb, `calls/${callData.whisperId}/waiting/${callData.id}`));
    
    // Join the call (same as customer)
    await joinCall();
    
    // Update call status in Firestore
    await updateDoc(doc(db, 'calls', callData.id), {
        status: 'active',
        startedAt: serverTimestamp()
    });
}

function updateCallStatus(status) {
    const statusMessage = document.getElementById('statusMessage');
    const remoteStatus = document.getElementById('remoteStatus');
    
    if (statusMessage) {
        switch (status) {
            case 'connected':
                statusMessage.innerHTML = '<i class="fas fa-check-circle"></i> Call Connected';
                break;
            case 'waiting':
                statusMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Waiting for participant...';
                break;
            case 'ended':
                statusMessage.innerHTML = '<i class="fas fa-phone-slash"></i> Call Ended';
                break;
        }
    }
    
    if (remoteStatus) {
        remoteStatus.textContent = status === 'connected' ? 'Connected' : 'Connecting...';
    }
}

function toggleMute() {
    if (!localAudioTrack) return;
    
    const muteBtn = document.getElementById('muteBtn');
    const isMuted = !localAudioTrack.muted;
    
    localAudioTrack.setMuted(isMuted);
    
    if (muteBtn) {
        const icon = muteBtn.querySelector('i');
        const text = muteBtn.querySelector('span');
        
        if (isMuted) {
            icon.className = 'fas fa-microphone-slash';
            text.textContent = 'Unmute';
        } else {
            icon.className = 'fas fa-microphone';
            text.textContent = 'Mute';
        }
    }
}

function toggleSpeaker() {
    // Note: Speaker management depends on browser and device
    const speakerBtn = document.getElementById('speakerBtn');
    if (speakerBtn) {
        const icon = speakerBtn.querySelector('i');
        const text = speakerBtn.querySelector('span');
        
        // This is a placeholder - actual implementation would vary
        if (icon.className.includes('volume-up')) {
            icon.className = 'fas fa-volume-off';
            text.textContent = 'Speaker Off';
        } else {
            icon.className = 'fas fa-volume-up';
            text.textContent = 'Speaker';
        }
    }
}

async function endCall(isComplete = false) {
    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Leave Agora channel
    if (agoraClient) {
        if (localAudioTrack) {
            localAudioTrack.close();
        }
        await agoraClient.leave();
    }
    
    // Clean up real-time data
    if (callData) {
        await remove(dbRef(realtimeDb, `activeCalls/${callData.id}`));
        
        // Update call record
        const duration = 300 - timeRemaining; // Actual duration in seconds
        await updateDoc(doc(db, 'calls', callData.id), {
            status: isComplete ? 'completed' : 'ended_early',
            endedAt: serverTimestamp(),
            duration: duration,
            // Calculate earnings for whisper
            whisperEarnings: isComplete ? 1200 : 0 // $12.00 or $0 for early end
        });
        
        // Update whisper's balance if call completed
        if (isComplete && callRole === 'customer') {
            const whisperRef = doc(db, 'users', callData.whisperId);
            const whisperDoc = await getDoc(whisperRef);
            if (whisperDoc.exists()) {
                const whisperData = whisperDoc.data();
                await updateDoc(whisperRef, {
                    balance: (whisperData.balance || 0) + 12,
                    totalEarnings: (whisperData.totalEarnings || 0) + 12,
                    totalCalls: (whisperData.totalCalls || 0) + 1
                });
            }
        }
    }
    
    // Show call ended modal
    showCallEndedModal(isComplete);
}

function showCallEndedModal(isComplete) {
    const modal = document.getElementById('callEndedModal');
    const callSummary = document.getElementById('callSummary');
    
    if (modal && callSummary) {
        const duration = 300 - timeRemaining;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        callSummary.innerHTML = `
            <div class="call-stats">
                <p><strong>Call Duration:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}</p>
                <p><strong>Status:</strong> ${isComplete ? 'Completed' : 'Ended Early'}</p>
                ${callRole === 'whisper' ? `<p><strong>Earnings:</strong> $${isComplete ? '12.00' : '0.00'}</p>` : ''}
            </div>
        `;
        
        modal.style.display = 'block';
    }
}

// Make functions available globally
window.endCall = endCall;
