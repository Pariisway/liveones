/*************************************************************************
 * AGORA VOICE CHAT SYSTEM
 *************************************************************************/

// Lazy load Agora SDK only when needed
let agoraLoaded = false;
let agoraLoadPromise = null;

function loadAgoraSDK() {
    if (!agoraLoadPromise) {
        agoraLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N.js';
            script.async = true;
            script.onload = () => {
                agoraLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return agoraLoadPromise;
}

async function ensureAgoraLoaded() {
    if (!agoraLoaded) {
        await loadAgoraSDK();
    }
}

// Agora Variables
let rtcClient = null;
let localAudioTrack = null;
let currentChannel = null;
let isVoiceMuted = false;

/*************************************************************************
 * VOICE CHAT SYSTEM - OPTIMIZED
 *************************************************************************/
async function initializeVoiceChat() {
    const joinBtn = document.getElementById('joinBtn');
    const leaveBtn = document.getElementById('leaveBtn');
    const muteBtn = document.getElementById('muteBtn');
    const statusEl = document.getElementById('status');
    
    joinBtn.addEventListener('click', async function() {
        if (!CURRENT_WHISPER_ROOM) {
            alert('Please select a whisper room first!');
            return;
        }
        await joinVoiceChat(CURRENT_WHISPER_ROOM, statusEl);
    });
    
    leaveBtn.addEventListener('click', function() {
        leaveVoiceChat();
        statusEl.textContent = 'Status: Voice chat disconnected';
        joinBtn.disabled = false;
        leaveBtn.disabled = true;
        muteBtn.disabled = true;
        muteBtn.textContent = 'MUTE MIC';
        muteBtn.style.background = '';
    });
    
    muteBtn.addEventListener('click', function() {
        toggleMute();
    });
}

async function initializeRoomVoiceChat() {
    const joinBtn = document.getElementById('roomJoinBtn');
    const leaveBtn = document.getElementById('roomLeaveBtn');
    const muteBtn = document.getElementById('roomMuteBtn');
    const statusEl = document.getElementById('roomStatus');
    
    joinBtn.addEventListener('click', async function() {
        if (!CURRENT_ROOM_PAGE) {
            alert('No room selected!');
            return;
        }
        await joinVoiceChat(CURRENT_ROOM_PAGE, statusEl);
    });
    
    leaveBtn.addEventListener('click', function() {
        leaveVoiceChat();
        statusEl.textContent = 'Status: Voice chat disconnected';
        joinBtn.disabled = false;
        leaveBtn.disabled = true;
        muteBtn.disabled = true;
        muteBtn.textContent = 'MUTE MIC';
        muteBtn.style.background = '';
    });
    
    muteBtn.addEventListener('click', function() {
        toggleMute();
    });
}

function toggleMute() {
    if (!localAudioTrack) return;
    
    isVoiceMuted = !isVoiceMuted;
    localAudioTrack.setEnabled(!isVoiceMuted);
    
    const muteBtn = document.getElementById('muteBtn');
    const roomMuteBtn = document.getElementById('roomMuteBtn');
    
    if (muteBtn) {
        muteBtn.textContent = isVoiceMuted ? '🔇 UNMUTE MIC' : '🎤 MUTE MIC';
        muteBtn.style.background = isVoiceMuted 
            ? 'linear-gradient(145deg, #ff3333, #cc0000)' 
            : 'linear-gradient(145deg, var(--accent1), #ff3366)';
    }
    
    if (roomMuteBtn) {
        roomMuteBtn.textContent = isVoiceMuted ? '🔇 UNMUTE MIC' : '🎤 MUTE MIC';
        roomMuteBtn.style.background = isVoiceMuted 
            ? 'linear-gradient(145deg, #ff3333, #cc0000)' 
            : 'linear-gradient(145deg, var(--accent1), #ff3366)';
    }
    
    const statusEl = document.getElementById('status');
    const roomStatusEl = document.getElementById('roomStatus');
    
    if (statusEl) statusEl.textContent = isVoiceMuted ? 'Status: Microphone muted' : 'Status: Microphone active';
    if (roomStatusEl) roomStatusEl.textContent = isVoiceMuted ? 'Status: Microphone muted' : 'Status: Microphone active';
}

async function joinVoiceChat(channelName, statusEl) {
    try {
        // Load Agora SDK only when needed
        await ensureAgoraLoaded();
        
        if (rtcClient && currentChannel) {
            await leaveVoiceChat();
        }
        
        rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        rtcClient.on('user-published', async (user, mediaType) => {
            await rtcClient.subscribe(user, mediaType);
            if (mediaType === 'audio') {
                user.audioTrack.play();
            }
        });

        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

        const uid = await rtcClient.join(APP_ID, channelName, null, null);

        await rtcClient.publish([localAudioTrack]);

        statusEl.textContent = `Status: Connected to ${getDisplayName(channelName)}`;
        
        document.getElementById('joinBtn').disabled = true;
        document.getElementById('leaveBtn').disabled = false;
        document.getElementById('muteBtn').disabled = false;
        document.getElementById('roomJoinBtn').disabled = true;
        document.getElementById('roomLeaveBtn').disabled = false;
        document.getElementById('roomMuteBtn').disabled = false;
        
        isVoiceMuted = false;
        const muteBtn = document.getElementById('muteBtn');
        const roomMuteBtn = document.getElementById('roomMuteBtn');
        
        if (muteBtn) {
            muteBtn.textContent = '🎤 MUTE MIC';
            muteBtn.style.background = 'linear-gradient(145deg, var(--accent1), #ff3366)';
        }
        if (roomMuteBtn) {
            roomMuteBtn.textContent = '🎤 MUTE MIC';
            roomMuteBtn.style.background = 'linear-gradient(145deg, var(--accent1), #ff3366)';
        }

        currentChannel = channelName;

    } catch (error) {
        console.error('Error joining voice chat:', error);
        statusEl.textContent = 'Status: Failed to connect';
    }
}

async function leaveVoiceChat() {
    try {
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        
        if (rtcClient) {
            await rtcClient.leave();
            rtcClient = null;
        }
        
        currentChannel = null;
        isVoiceMuted = false;

        document.getElementById('joinBtn').disabled = false;
        document.getElementById('leaveBtn').disabled = true;
        document.getElementById('muteBtn').disabled = true;
        document.getElementById('roomJoinBtn').disabled = false;
        document.getElementById('roomLeaveBtn').disabled = true;
        document.getElementById('roomMuteBtn').disabled = true;
        
        const muteBtn = document.getElementById('muteBtn');
        const roomMuteBtn = document.getElementById('roomMuteBtn');
        
        if (muteBtn) {
            muteBtn.textContent = 'MUTE MIC';
            muteBtn.style.background = '';
        }
        if (roomMuteBtn) {
            roomMuteBtn.textContent = 'MUTE MIC';
            roomMuteBtn.style.background = '';
        }

    } catch (error) {
        console.error('Error leaving voice chat:', error);
    }
}

function getDisplayName(channelId) {
    if (WHISPER_ROOMS[channelId]) {
        return WHISPER_ROOMS[channelId];
    }
    if (VIDEO_ROOMS[channelId]) {
        return VIDEO_ROOMS[channelId].displayName;
    }
    return channelId;
}
