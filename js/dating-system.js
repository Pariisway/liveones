// Dating System - With Photos and Social Media
console.log('💘 Dating System: Photos Version Loaded');

let db;
let girlsData = [];
let isLoading = false;

function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase not loaded');
            return false;
        }
        
        if (!firebase.apps.length) {
            const firebaseConfig = {
                apiKey: "AIzaSyBU2tbinWSOw-N8ce6zMQ9AMKXt-5fj23g",
                authDomain: "house-of-whispers.firebaseapp.com",
                projectId: "house-of-whispers",
                storageBucket: "house-of-whispers.firebasestorage.app",
                messagingSenderId: "1063333130646",
                appId: "1:1063333130646:web:9f0d6ddc2927692aaaadb7",
                measurementId: "G-06QR5LFKJ9"
            };
            firebase.initializeApp(firebaseConfig);
        }
        
        db = firebase.firestore();
        console.log('✅ Firebase initialized in dating system');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
}

async function getGirlsData() {
    if (isLoading) {
        console.log('⏳ Already loading, skipping...');
        return girlsData;
    }
    
    isLoading = true;
    console.log('🔄 getGirlsData: Starting...');
    
    try {
        if (!db) {
            if (!initializeFirebase()) {
                console.log('🎭 Firebase not available, using fallback data');
                return getFallbackGirlsData();
            }
        }
        
        const querySnapshot = await db.collection('whispers').where('isActive', '==', true).limit(20).get();
        girlsData = [];
        
        if (querySnapshot.empty) {
            console.log('ℹ️ No whispers found in Firestore');
            return getFallbackGirlsData();
        }
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            girlsData.push({ 
                id: doc.id, 
                username: data.username || 'unknown',
                displayName: data.displayName || data.username || 'Whisper',
                avatar: data.avatar || '👤',
                photoURL: data.photoURL || null,
                location: data.location || 'Online',
                bio: data.bio || 'Ready to connect with you!',
                rating: data.rating || 4.5,
                verification: data.verification || 'Verified',
                interests: data.interests || 'General conversation',
                socialMedia: data.socialMedia || {}
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
    console.log('🔄 Using fallback sample data');
    return [
        {
            id: 'sample-1',
            username: 'whisper_sarah',
            displayName: 'Sarah 💫',
            avatar: '💁‍♀️',
            photoURL: null,
            location: 'New York',
            bio: 'Life coach and relationship expert. Lets talk about your dreams and goals!',
            rating: 4.8,
            verification: 'Verified',
            interests: 'Dating, Relationships, Personal Growth',
            socialMedia: {}
        }
    ];
}

function displayWhispers(whispers) {
    console.log('🔄 displayWhispers: Starting with', whispers.length, 'whispers');
    
    let girlsGrid = document.getElementById('girlsGrid');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!girlsGrid) {
        console.error('❌ Could not find girls grid element');
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.innerHTML = `
                <h3>Display Error</h3>
                <p>Could not load whispers display. Please refresh the page.</p>
                <button onclick="window.location.reload()" class="btn primary">Refresh Page</button>
            `;
        }
        if (loadingMessage) loadingMessage.style.display = 'none';
        return;
    }
    
    if (loadingMessage) loadingMessage.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';
    
    girlsGrid.innerHTML = '';

    if (!whispers || whispers.length === 0) {
        console.log('ℹ️ No whispers to display');
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.innerHTML = `
                <h3>No whispers available yet</h3>
                <p>Be the first to sign up and start earning!</p>
                <a href="become-a-whisper.html" class="btn primary">Become a Whisper</a>
            `;
        }
        return;
    }

    whispers.forEach(whisper => {
        const girlCard = document.createElement('div');
        girlCard.className = 'girl-card';
        
        // Determine what to show as profile image
        let profileImage = '';
        if (whisper.photoURL) {
            profileImage = `<img src="${whisper.photoURL}" alt="${whisper.displayName}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.3);">`;
        } else {
            profileImage = `<span style="font-size: 60px;">${whisper.avatar || '👤'}</span>`;
        }
        
        girlCard.innerHTML = `
            <div class="girl-avatar">
                ${profileImage}
                <div class="online-indicator online"></div>
            </div>
            <div class="girl-info">
                <h3>${whisper.displayName || whisper.username}
                    <span class="pricing-badge">$15/5min</span>
                </h3>
                <p class="girl-location">📍 ${whisper.location || 'Online'}</p>
                <p class="girl-bio">${whisper.bio || 'No bio yet'}</p>
                <p class="girl-interests"><strong>Interests:</strong> ${whisper.interests || 'General conversation'}</p>
                <div class="girl-stats">
                    <span class="verification-badge">${whisper.verification || 'Verified'}</span>
                    <span class="rating">⭐ ${whisper.rating || '5.0'}</span>
                </div>
            </div>
            <div class="button-group">
                <a href="call-payment.html?whisperId=${whisper.id}" class="btn primary" style="text-decoration: none;">
                    🎙️ Book Call - $15
                </a>
                <button class="btn secondary" onclick="viewProfile('${whisper.id}')">
                    👁️ View Profile
                </button>
            </div>
        `;
        girlsGrid.appendChild(girlCard);
    });

    console.log('✅ Whispers displayed successfully');
}

function viewProfile(whisperId) {
    console.log('👤 Viewing profile:', whisperId);
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
    console.log('🚀 Shoot Your Shot page loaded - Photos Version');
    setTimeout(loadWhispers, 1000);
});

// Export for global access
window.loadWhispers = loadWhispers;
window.viewProfile = viewProfile;
