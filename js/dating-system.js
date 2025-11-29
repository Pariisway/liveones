// Dating System - Fixed Version
console.log('💘 Dating System: DOM loaded');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBU2tbinWSOw-N8ce6zMQ9AMKXt-5fj23g",
    authDomain: "house-of-whispers.firebaseapp.com",
    projectId: "house-of-whispers",
    storageBucket: "house-of-whispers.firebasestorage.app",
    messagingSenderId: "1063333130646",
    appId: "1:1063333130646:web:9f0d6ddc2927692aaaadb7",
    measurementId: "G-06QR5LFKJ9"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let girlsData = [];
let isLoading = false;

async function getGirlsData() {
    if (isLoading) {
        console.log('⏳ Already loading, skipping...');
        return girlsData;
    }
    
    isLoading = true;
    console.log('🔄 getGirlsData: Starting...');
    
    try {
        const querySnapshot = await db.collection('whispers').get();
        girlsData = [];
        
        querySnapshot.forEach((doc) => {
            girlsData.push({ 
                id: doc.id, 
                ...doc.data() 
            });
        });
        
        console.log(`✅ Firestore data loaded: ${girlsData.length} whispers`);
        return girlsData;
        
    } catch (error) {
        console.error('❌ Error getting whispers data:', error);
        console.log('🎭 Using fallback data');
        return getFallbackGirlsData();
    } finally {
        isLoading = false;
    }
}

function getFallbackGirlsData() {
    return [
        {
            id: 'fallback-1',
            username: 'sample_whisper',
            displayName: 'Sample Whisper 🌟',
            avatar: '💁‍♀️',
            location: 'Online',
            bio: 'Ready to connect with you!',
            rating: 4.5,
            verification: 'Verified'
        }
    ];
}

function displayWhispers(whispers) {
    console.log('🔄 displayWhispers: Starting...');
    
    const girlsGrid = document.getElementById('girlsGrid');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!girlsGrid) {
        console.error('❌ girlsGrid element not found');
        return;
    }
    
    // Hide loading, show content
    if (loadingMessage) loadingMessage.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';
    
    girlsGrid.innerHTML = '';

    if (whispers.length === 0) {
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.innerHTML = `
                <h3>No whispers available yet - Be the first to sign up!</h3>
                <p>The first whispers are signing up now! Join them and start earning.</p>
                <a href="become-a-whisper.html" class="btn primary">Become a Whisper</a>
            `;
        }
        return;
    }

    whispers.forEach(whisper => {
        const girlCard = document.createElement('div');
        girlCard.className = 'girl-card';
        girlCard.innerHTML = `
            <div class="girl-avatar">
                <span style="font-size: 60px;">${whisper.avatar || '👤'}</span>
                <div class="online-indicator online"></div>
            </div>
            <div class="girl-info">
                <h3>${whisper.displayName || whisper.username}
                    <span class="pricing-badge">$15/5min</span>
                </h3>
                <p class="girl-location">📍 ${whisper.location || 'Location not set'}</p>
                <p class="girl-bio">${whisper.bio || 'No bio yet'}</p>
                <div class="girl-stats">
                    <span class="verification-badge">${whisper.verification || 'Pending'}</span>
                    <span class="rating">⭐ ${whisper.rating || '0.0'}</span>
                </div>
            </div>
            <div class="button-group">
                <button class="btn primary start-chat-btn" onclick="viewProfile('${whisper.id}')">
                    💘 View Profile
                </button>
                <a href="call-payment.html?whisperId=${whisper.id}" class="call-button">
                    🎙️ Call Now - $15
                </a>
            </div>
        `;
        girlsGrid.appendChild(girlCard);
    });

    console.log('✅ Whispers displayed successfully');
}

function viewProfile(whisperId) {
    console.log('👤 Viewing profile:', whisperId);
    // For now, redirect to payment page. Later you can create profile pages.
    window.location.href = `call-payment.html?whisperId=${whisperId}`;
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (loadingMessage) loadingMessage.style.display = 'none';
    if (errorMessage) {
        errorMessage.style.display = 'block';
        errorMessage.innerHTML = `
            <h3>Error Loading Whispers</h3>
            <p>${message}</p>
            <button onclick="loadWhispers()" class="btn primary">Try Again</button>
        `;
    }
}

async function loadWhispers() {
    try {
        console.log('🚀 Loading whispers...');
        const whispers = await getGirlsData();
        displayWhispers(whispers);
    } catch (error) {
        console.error('❌ Error loading whispers:', error);
        showError(error.message);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Shoot Your Shot page loaded - Fixed Version');
    
    // Load whispers after a short delay to ensure DOM is ready
    setTimeout(loadWhispers, 100);
});

// Export for global access
window.loadWhispers = loadWhispers;
window.viewProfile = viewProfile;
