/*************************************************************************
 * PERFORMANCE OPTIMIZATIONS
 *************************************************************************/

// Font loading handler
function handleFontsLoaded() {
    document.body.classList.remove('fonts-loading');
    document.body.classList.add('fonts-loaded');
}

// Check if fonts are already loaded
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(handleFontsLoaded);
} else {
    // Fallback
    setTimeout(handleFontsLoaded, 1000);
}

/*************************************************************************
 * APP CONFIGURATION
 *************************************************************************/
const APP_ID = '966c8e41da614722a88d4372c3d95dba';

// Video Rooms with working YouTube video IDs
const VIDEO_ROOMS = {
    'tiktoks': {
        displayName: '🔥 VIRAL TIKTOKS',
        videos: [
            { id: 'NTvgGAzepAE', title: 'POPULAR DANCE TRENDS' },
            { id: 'KJGVp_Up6AM', title: 'you laugh, you lose' },
            { id: '5yc2jryL2Ek', title: 'Hot and pretty girls' }
        ]
    },
    'worldwide': {
        displayName: '🌍 WORLD WIDE',
        videos: [
            { id: 'Yj8lIkAYiRA', title: 'Latin singer shot, killed in Northridge' },
            { id: 'DQUmMVrB2FM', title: 'Candace Owens Claims the Macrons are Plotting to ASSASSINATE Her' },
            { id: 'qcMd_6mZYGk', title: 'Son of Hamas founder has a WARNING for voters in New York' },
            { id: 'zCUi8b3Mr70', title: 'Treadmill Abuse Murder Trial' },
            { id: 'RRkdV_xmYOI', title: 'Madea Is Trump\'s New Communications Director' }
        ]
    },
    'gaming': {
        displayName: '🎮 GAMING CLIPS', 
        videos: [
            { id: 'i0yqhXe5TCg', title: 'NEW *BROKEN* SMG META😱 (46 Kills on Rebirth)' },
            { id: 'NliCxKf9aAs', title: 'INSANE Roblox Slap Tower CLUTCHES' },
            { id: 'kLjqtHMg-Hs', title: 'How to Open The Outlook Safe Room In Warzone (Verdansk Easter Egg)' }
        ]
    },
    'funny': {
        displayName: '😂 FUNNY MOMENTS',
        videos: [
            { id: 'PD2a5xUbCy4', title: 'Funny Baby Interviews Compilation #1' },
            { id: 'BQOzdbqP1d4', title: 'you laugh, you lose' },
            { id: 'X3nr1xqbsbA', title: 'One of My Favorite "Bernie Mac" Jokes' }
        ]
    },
    'drizzle': {
        displayName: '💧 DRIZZLE DRIZZLE',
        videos: [
            { id: 'UYO2Q-rL2iY', title: 'Celina Powell talks Sleeping with Snoop Dogg, Eating 50 Cent Butt, Sleeping with Teyana Taylor Man' },
            { id: 'lOmsSqpunUU', title: 'Ex Scripper Tries To SHAME Co Host For Having Standards' },
            { id: 'PjEgwhSNnmM', title: 'Latina Got HUMBLED After FINDING Out She\'s NOT Rare!' },
            { id: 'eWyHSUUhOgU', title: 'She Tried To SHAME Cooley Then This Happened…' },
            { id: '6J0QhC7M3Oc', title: 'Male Feminist THREATENS Cooley' },
            { id: 'h90EjOp_LA0', title: 'Men You Call Lame Today, Women Want Tomorrow' }
        ]
    },
    'sprinkle': {
        displayName: '✨ SPRINKLE SPRINKLE',
        videos: [
            { id: '_lzk3bdM1JE', title: 'WOMEN React to DRIZZLE DRIZZLE the soft guy Era ' },
            { id: 'H_Fc_7JlKzI', title: 'SPRINKLE SPRINKLE Lady Says, "The Man Has To Like You 10 Times More Than You Like Him To Be Happy!' },
            { id: '6J0QhC7M3Oc', title: 'Male Feminist THREATENS Cooley' },
            { id: 'i826SZJlvVk', title: 'Cop Allegedly Caught Kissing' },
            { id: 'JR-25LSqTyY', title: 'The Reason Men Aren\'t Approaching Women Is…Women?' }
        ]
    },
    'hear': {
        displayName: '👀 DID YALL HEAR',
        videos: [
            { id: 'dK1-rg4O8c8', title: 'Rapper Trippie Redd shows off blacked out home' },
            { id: 'saT78syrWZg', title: 'D4VD Case: MAJOR Development As Police Announce Key Piece Of Evidence' },
            { id: 'iIO_pF0d1u4', title: 'Survivors, American public await release of full Epstein case files' }
        ]
    },
    'relationships': {
        displayName: '💔 RELATIONSHIP TALK',
        videos: [
            { id: 'nxQYKNqZB70', title: 'The Best Relationship Advice No One Tells You' },
            { id: 'ebjMtvaeWE8', title: 'The Modern Reality of Women and Dating in 2025' },
            { id: 'GDVHOYqpZCY', title: 'This is WHY Men Have GIVEN UP on Dating' },
            { id: '9tQs1t3wfa4', title: 'Celina Powell Admits She Only Sleep With Men Raw & Doesn\'t Like Protection' }, 
            { id: 'AMlkKbA5JVw', title: '10 Signs Your Partner Doesn\'t Love You (Even If You Think They Do)' },
            { id: 'ebjMtvaeWE8', title: 'The Modern Reality of Women and Dating in 2025' },
            { id: 'Y4E8qEDi_xg', title: 'Dating women made me understand men' }
        ]
    },
    'trending': {
        displayName: '🚀 TRENDING NOW',
        videos: [
            { id: 'KQiVat92AwE', title: 'Jonathan Majors Surveillance Video Shows Fight with Girlfriend, She Chases Him | TMZ' },
            { id: '6NM5WH6tpN8', title: 'Candace Owens Exposes Gaza\’s Billionaire Land Grab' },
            { id: 'FKkdVFFVtME', title: 'Inside Russia\'s Hidden Black Community' },
            { id: 'EzQbLqinGLA', title: 'TRUMP and ERIKA KIRK\'S bizarre kiss moment' },
            { id: 'sdJLVRToeEU', title: 'Government officials BREAK silence on non-human life' }
        ]
    }
};

// Whisper Rooms
const WHISPER_ROOMS = {
    'hear': 'Did Y\'all Hear',
    'relationships': 'Bad Relationships', 
    'drizzle': 'Drizzle Drizzle',
    'sprinkle': 'Sprinkle Sprinkle'
};

/*************************************************************************
 * GLOBAL VARIABLES
 *************************************************************************/
let USERNAME = null;
let CURRENT_WHISPER_ROOM = null;
let CURRENT_ROOM_PAGE = null;
let currentVideoIndex = 0;
let videoInterval = null;
let currentRoomData = null;
let currentVideoElement = null;
let isVideoPlaying = true;
let mainPageVideos = [
    { id: '0pmuzvZO1Ek', title: 'Suspects plan to murder all Island\'s men, enslave women' },
    { id: 'j2nKT-yl-Oc', title: 'New poll shows most Americans are against military action in Venezuela' },
    { id: '6NM5WH6tpN8', title: 'Candace Owens Exposes Gaza\’s Billionaire Land Grab' },
    { id: 'lZhE1VvfSrA', title: 'Tucker Reveals What Trump Isn\’t Telling You' },
    { id: 'y2Oz2cwvtxs', title: 'Examining the risks of U.S. military action against Venezuela' }
];
let mainPageVideoIndex = 0;

/*************************************************************************
 * VIDEO MANAGEMENT
 *************************************************************************/

function stopAllVideos() {
    if (videoInterval) {
        clearInterval(videoInterval);
        videoInterval = null;
    }
    
    const videoContainers = [
        'mainVideoContainer',
        'videoPlayerContainer'
    ];
    
    videoContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="loading">Video stopped</div>';
        }
    });
    
    currentVideoElement = null;
}

function loadMainPageVideo() {
    const container = document.getElementById('mainVideoContainer');
    const video = mainPageVideos[mainPageVideoIndex];
    
    container.innerHTML = `
        <iframe 
            width="100%" 
            height="400" 
            src="https://www.youtube.com/embed/${video.id}?rel=0&autoplay=1&mute=0"
            style="border-radius: 12px;"
            frameborder="0" 
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
    `;
    
    document.getElementById('mainVideoTitle').textContent = video.title;
    currentVideoElement = container.querySelector('iframe');
}

function playRoomVideoDirect(videoId, title) {
    const container = document.getElementById('videoPlayerContainer');
    
    container.innerHTML = `
        <iframe 
            width="100%" 
            height="400" 
            src="https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&mute=0"
            style="border-radius: 12px;"
            frameborder="0" 
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
    `;
    
    document.getElementById('currentVideoTitle').textContent = `Now Playing: ${title}`;
    currentVideoElement = container.querySelector('iframe');
    isVideoPlaying = true;
}

/*************************************************************************
 * VIDEO CONTROLS - FORWARD/BACKWARD BUTTONS
 *************************************************************************/

// Main Page Video Controls
function previousMainVideo() {
    mainPageVideoIndex = (mainPageVideoIndex - 1 + mainPageVideos.length) % mainPageVideos.length;
    loadMainPageVideo();
}

function nextMainVideo() {
    mainPageVideoIndex = (mainPageVideoIndex + 1) % mainPageVideos.length;
    loadMainPageVideo();
}

// Room Video Controls
function previousVideo() {
    if (!currentRoomData) return;
    currentVideoIndex = (currentVideoIndex - 1 + currentRoomData.videos.length) % currentRoomData.videos.length;
    const video = currentRoomData.videos[currentVideoIndex];
    playRoomVideoDirect(video.id, video.title);
}

function nextVideo() {
    if (!currentRoomData) return;
    currentVideoIndex = (currentVideoIndex + 1) % currentRoomData.videos.length;
    const video = currentRoomData.videos[currentVideoIndex];
    playRoomVideoDirect(video.id, video.title);
}

/*************************************************************************
 * PAGE NAVIGATION - FIXED SCROLL TO TOP
 *************************************************************************/
function showHomePage() {
    stopAllVideos();
    
    if (window.leaveVoiceChat) {
        leaveVoiceChat();
    }
    
    document.getElementById('homePage').classList.remove('hidden');
    document.getElementById('videoRoomPage').classList.add('hidden');
    loadMainPageVideo();
    
    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function showVideoRoom(roomId) {
    // Scroll to top immediately when room is clicked
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    stopAllVideos();
    
    CURRENT_ROOM_PAGE = roomId;
    document.getElementById('homePage').classList.add('hidden');
    document.getElementById('videoRoomPage').classList.remove('hidden');
    
    currentRoomData = VIDEO_ROOMS[roomId];
    document.getElementById('roomTitle').textContent = currentRoomData.displayName;
    document.getElementById('roomVideoTitle').textContent = `🎬 ${currentRoomData.displayName}`;
    
    startVideoPlaylist(roomId);
    if (window.initializeRoomVoiceChat) {
        initializeRoomVoiceChat();
    }
    
    // Double ensure scroll to top after a brief delay
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, 50);
}

/*************************************************************************
 * VIDEO PLAYLIST SYSTEM
 *************************************************************************/
function startVideoPlaylist(roomId) {
    stopVideoPlaylist();
    
    const roomData = VIDEO_ROOMS[roomId];
    currentVideoIndex = 0;
    currentRoomData = roomData;
    
    const firstVideo = roomData.videos[currentVideoIndex];
    playRoomVideoDirect(firstVideo.id, firstVideo.title);
    
    videoInterval = setInterval(() => {
        if (isVideoPlaying) {
            currentVideoIndex = (currentVideoIndex + 1) % roomData.videos.length;
            const nextVideo = roomData.videos[currentVideoIndex];
            playRoomVideoDirect(nextVideo.id, nextVideo.title);
        }
    }, 180000);
}

function stopVideoPlaylist() {
    if (videoInterval) {
        clearInterval(videoInterval);
        videoInterval = null;
    }
}

/*************************************************************************
 * CONTACT MODAL
 *************************************************************************/
function showContactModal() {
    document.getElementById('contactModal').classList.remove('hidden');
}

function hideContactModal() {
    document.getElementById('contactModal').classList.add('hidden');
    document.getElementById('contactResult').innerHTML = '';
    document.getElementById('contactForm').reset();
}

/*************************************************************************
 * USERNAME SYSTEM
 *************************************************************************/
function setUsername() {
    const input = document.getElementById('usernameInput');
    const name = input.value.trim();
    
    if (!name) {
        showUsernameError('Please enter a display name!');
        return;
    }
    
    if (name.length < 2) {
        showUsernameError('Name must be at least 2 characters long');
        return;
    }
    
    USERNAME = name;
    localStorage.setItem('videohub_username', USERNAME);
    
    document.getElementById('usernameSetup').classList.add('hidden');
    document.getElementById('mainInterface').classList.remove('hidden');
    
    initializeApp();
}

function showUsernameError(message) {
    const existingError = document.getElementById('usernameError');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.id = 'usernameError';
    errorDiv.className = 'username-error';
    errorDiv.textContent = message;
    
    const buttonContainer = document.querySelector('.username-setup .btn.primary').parentNode;
    buttonContainer.parentNode.insertBefore(errorDiv, buttonContainer.nextSibling);
    
    document.getElementById('usernameInput').focus();
}

function checkExistingUsername() {
    const savedName = localStorage.getItem('videohub_username');
    if (savedName) {
        USERNAME = savedName;
        document.getElementById('usernameInput').value = USERNAME;
    }
}

/*************************************************************************
 * VIDEO ROOMS SYSTEM - FIXED SCROLL TO TOP
 *************************************************************************/
function populateVideoRooms() {
    const grid = document.getElementById('videoRoomsGrid');
    grid.innerHTML = '';
    
    Object.keys(VIDEO_ROOMS).forEach(roomId => {
        const roomData = VIDEO_ROOMS[roomId];
        const room = document.createElement('div');
        room.className = 'video-room-btn';
        room.textContent = roomData.displayName;
        room.onclick = () => {
            // Scroll to top immediately when room is clicked
            window.scrollTo({ top: 0, behavior: 'instant' });
            showVideoRoom(roomId);
        };
        grid.appendChild(room);
    });
}

/*************************************************************************
 * WHISPER ROOMS SYSTEM
 *************************************************************************/
function joinWhisperRoom(roomId) {
    CURRENT_WHISPER_ROOM = roomId;
    
    document.querySelectorAll('.whisper-room').forEach(room => {
        const roomText = room.querySelector('div:last-child').textContent;
        const roomDisplayName = WHISPER_ROOMS[roomId];
        room.classList.toggle('active', roomText === roomDisplayName);
    });
    
    updateUsersDisplay();
}

/*************************************************************************
 * USER MANAGEMENT
 *************************************************************************/
function updateUsersDisplay() {
    const grid = document.getElementById('usersGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!USERNAME) return;
    
    const userCard = document.createElement('div');
    userCard.className = 'user-card you';
    userCard.innerHTML = `
        <div class="user-name">${USERNAME}</div>
        <div class="user-status">YOU • READY TO CHAT</div>
    `;
    grid.appendChild(userCard);
}

function updateRoomUsersDisplay() {
    const grid = document.getElementById('roomUsersGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!USERNAME) return;
    
    const userCard = document.createElement('div');
    userCard.className = 'user-card you';
    userCard.innerHTML = `
        <div class="user-name">${USERNAME}</div>
        <div class="user-status">YOU • WATCHING</div>
    `;
    grid.appendChild(userCard);
}

/*************************************************************************
 * APP INITIALIZATION
 *************************************************************************/
function initializeApp() {
    populateVideoRooms();
    updateUsersDisplay();
    if (window.initializeVoiceChat) {
        initializeVoiceChat();
    }
    loadMainPageVideo();
    
    if (!CURRENT_WHISPER_ROOM) {
        joinWhisperRoom('hear');
    }
}

/*************************************************************************
 * EVENT LISTENERS SETUP
 *************************************************************************/
function setupEventListeners() {
    // Username setup
    document.getElementById('setUsernameBtn').addEventListener('click', setUsername);
    document.getElementById('usernameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            setUsername();
        }
    });

    // Whisper rooms
    document.querySelectorAll('.whisper-room').forEach(room => {
        room.addEventListener('click', function() {
            joinWhisperRoom(this.dataset.room);
        });
    });

    // Video controls - Main page
    document.getElementById('prevMainBtn').addEventListener('click', previousMainVideo);
    document.getElementById('nextMainBtn').addEventListener('click', nextMainVideo);

    // Video controls - Room page
    document.getElementById('prevRoomBtn').addEventListener('click', previousVideo);
    document.getElementById('nextRoomBtn').addEventListener('click', nextVideo);

    // Navigation
    document.getElementById('mainMenuBtn').addEventListener('click', showHomePage);

    // Contact modal
    document.getElementById('contactBtn').addEventListener('click', showContactModal);
    document.getElementById('closeModalBtn').addEventListener('click', hideContactModal);

    // Contact form
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const subject = document.getElementById('contactSubject').value;
        const message = document.getElementById('contactMessage').value;
        
        const mailtoLink = `mailto:ifanifwasafifth@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage: ${message}`)}`;
        
        window.location.href = mailtoLink;
        
        document.getElementById('contactResult').innerHTML = `
            <div class="form-success">
                ✅ Email client opened! If it didn't open, please send to: ifanifwasafifth@gmail.com
            </div>
        `;
        
        setTimeout(() => {
            hideContactModal();
        }, 3000);
    });

    // Modal background click
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('contactModal');
        if (e.target === modal) {
            hideContactModal();
        }
    });
}

/*************************************************************************
 * INITIALIZATION
 *************************************************************************/
document.addEventListener('DOMContentLoaded', function() {
    checkExistingUsername();
    loadMainPageVideo();
    setupEventListeners();
});
