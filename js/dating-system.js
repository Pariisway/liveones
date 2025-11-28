/*************************************************************************
 * SHOOT YOUR SHOT DATING SYSTEM - FIXED VERSION
 *************************************************************************/

// Girl data management with Firebase support - FIXED
async function getGirlsData() {
    try {
        console.log('🔄 getGirlsData: Checking platform manager...');
        
        if (window.platformManager && platformManager.initialized) {
            console.log('✅ Platform manager found and initialized');
            const daters = await platformManager.getAllDaters();
            console.log('📊 Retrieved daters from platform manager:', daters);
            
            const girlsData = {};
            
            daters.forEach(dater => {
                // Use dater.id as the key for consistency
                girlsData[dater.id] = {
                    id: dater.id,
                    name: dater.displayName,
                    avatar: dater.avatar,
                    location: dater.location,
                    bio: dater.bio,
                    schedule: dater.schedule || [],
                    timezone: dater.timezone,
                    interests: dater.interests || [],
                    verification: dater.verification || 'Pending Verification',
                    responseTime: 'Usually replies in 2 mins',
                    earnings: dater.earnings || 0,
                    totalChats: dater.totalChats || 0,
                    rating: dater.rating || 0
                };
            });
            
            if (Object.keys(girlsData).length > 0) {
                console.log('✅ Successfully loaded', Object.keys(girlsData).length, 'daters from platform manager');
                return girlsData;
            } else {
                console.log('ℹ️ No daters found in platform manager');
            }
        } else {
            console.warn('❌ Platform manager not available or not initialized');
        }
    } catch (error) {
        console.error('❌ Error getting daters from platform manager:', error);
    }
    
    // Fallback to localStorage or mock data - ONLY if platform manager fails
    console.log('🔄 Falling back to alternative data source...');
    return getFallbackGirlsData();
}

// Fallback data function - UPDATED
function getFallbackGirlsData() {
    // First check if we have any daters in platform manager's localStorage
    try {
        const platformData = localStorage.getItem('whispers_platform_data');
        if (platformData) {
            const data = JSON.parse(platformData);
            if (data.daters && data.daters.length > 0) {
                console.log('📦 Found daters in localStorage fallback:', data.daters.length);
                const girlsData = {};
                data.daters.forEach(dater => {
                    girlsData[dater.id] = {
                        id: dater.id,
                        name: dater.displayName,
                        avatar: dater.avatar,
                        location: dater.location,
                        bio: dater.bio,
                        schedule: dater.schedule || [],
                        timezone: dater.timezone,
                        interests: dater.interests || [],
                        verification: dater.verification || 'Pending',
                        responseTime: 'Usually replies in 2 mins'
                    };
                });
                return girlsData;
            }
        }
    } catch (error) {
        console.error('Error reading localStorage fallback:', error);
    }
    
    // Check admin girls as secondary fallback
    const adminGirls = JSON.parse(localStorage.getItem('admin_girls') || '{}');
    if (Object.keys(adminGirls).length > 0) {
        console.log('👑 Using admin girls data');
        return adminGirls;
    }
    
    // Final fallback - default mock data (only if absolutely nothing else works)
    console.log('🎭 Using default mock data');
    return {
        'sarah': {
            id: 'sarah',
            name: 'Sarah, 24',
            avatar: '🔥',
            location: 'Los Angeles, CA',
            bio: 'Adventure seeker and coffee lover! I\'m a psychology major who enjoys hiking, trying new restaurants, and deep conversations.',
            schedule: ['19:00-21:00'],
            timezone: 'PST',
            interests: ['Hiking', 'Coffee', 'Photography', 'Travel'],
            verification: 'Verified ✅',
            responseTime: 'Usually replies in 2 mins'
        },
        'maya': {
            id: 'maya',
            name: 'Maya, 22',
            avatar: '💫', 
            location: 'New York, NY',
            bio: 'Creative soul and foodie! I work in digital marketing and love exploring the city, photography, and trying new recipes.',
            schedule: ['16:00-18:00'],
            timezone: 'EST',
            interests: ['Art', 'Food', 'Exploring', 'Music'],
            verification: 'Verified ✅',
            responseTime: 'Usually replies in 1 min'
        }
    };
}

// Update initializeGirlProfile function to be async - FIXED
async function initializeGirlProfile() {
    console.log('🔄 Initializing girl profile...');
    const urlParams = new URLSearchParams(window.location.search);
    const girlId = urlParams.get('girl');
    console.log('👤 Requested girl ID:', girlId);
    
    if (!girlId) {
        console.error('❌ No girl ID provided in URL');
        window.location.href = 'shoot-your-shot.html';
        return;
    }
    
    const girlsData = await getGirlsData();
    console.log('📋 Available girls data:', Object.keys(girlsData));
    
    const girl = girlsData[girlId];
    console.log('🎯 Found girl data:', girl);
    
    if (!girl) {
        console.error('❌ Girl not found with ID:', girlId);
        alert('Profile not found. This dater may no longer be available.');
        window.location.href = 'shoot-your-shot.html';
        return;
    }

    // Update page with girl info
    document.getElementById('pageTitle').textContent = `MEET ${girl.name.split(',')[0].toUpperCase()}`;
    document.getElementById('girlAvatar').textContent = girl.avatar;
    document.getElementById('girlName').textContent = girl.name;
    document.getElementById('girlLocation').textContent = `📍 ${girl.location}`;
    document.getElementById('girlBio').textContent = girl.bio;

    // Update verification badge
    const verificationElement = document.getElementById('girlVerification');
    if (verificationElement) {
        verificationElement.textContent = girl.verification;
    }

    // Create schedule slots
    const scheduleContainer = document.getElementById('scheduleSlots');
    if (scheduleContainer) {
        scheduleContainer.innerHTML = '';
        
        if (girl.schedule && girl.schedule.length > 0) {
            girl.schedule.forEach(slot => {
                const slotDiv = document.createElement('div');
                slotDiv.className = 'time-slot';
                slotDiv.textContent = slot;
                scheduleContainer.appendChild(slotDiv);
            });
        } else {
            scheduleContainer.innerHTML = '<div style="color: var(--muted);">Schedule not set</div>';
        }
    }

    // Check if it's currently scheduled time
    checkSchedule(girl);
    
    // Check schedule every minute
    setInterval(() => checkSchedule(girl), 60000);
    
    console.log('✅ Girl profile initialized successfully');
}

// Check schedule function - IMPROVED
function checkSchedule(girl) {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    
    let isActive = false;
    
    if (girl.schedule && girl.schedule.length > 0) {
        girl.schedule.forEach(slot => {
            const [start, end] = slot.split('-');
            if (currentTime >= start && currentTime <= end) {
                isActive = true;
            }
        });
    }

    const purchaseBtn = document.getElementById('purchaseBtn');
    const queueInfo = document.getElementById('queueInfo');
    
    if (isActive) {
        if (purchaseBtn) purchaseBtn.disabled = false;
        if (queueInfo) queueInfo.textContent = 'Chat is LIVE! Join the queue now.';
        // Add active class to current time slot
        document.querySelectorAll('.time-slot').forEach(slot => {
            if (slot.textContent.includes(currentTime.substring(0,2))) {
                slot.classList.add('active');
            }
        });
    } else {
        if (purchaseBtn) purchaseBtn.disabled = true;
        if (queueInfo) queueInfo.textContent = 'Purchase available only during scheduled hours';
    }
}

// Purchase function - UPDATED TO USE PAYMENTS PAGE
function purchaseChat() {
    const urlParams = new URLSearchParams(window.location.search);
    const girlId = urlParams.get('girl');
    
    if (!girlId) {
        alert('Error: No dater selected');
        return;
    }
    
    console.log('💰 Redirecting to payment for girl:', girlId);
    // Redirect to payment page instead of directly to chat
    window.location.href = `payments.html?girl=${girlId}`;
}

// Initialize private chat
function initializePrivateChat() {
    console.log('🔄 Initializing private chat...');
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const girlId = urlParams.get('girl');
    const username = urlParams.get('user') || 'Guest';
    const paid = urlParams.get('paid') === 'true';

    console.log('💬 Chat parameters:', { girlId, username, paid });

    // Update title
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) {
        chatTitle.textContent = `WITH ${(girlId || 'YOUR DATE').toUpperCase()}`;
    }

    // If not paid, redirect back
    if (!paid) {
        alert('Please complete payment first!');
        window.location.href = `girl-profile.html?girl=${girlId}`;
        return;
    }

    // Simulate queue position (in real app, this would come from server)
    let queuePosition = Math.floor(Math.random() * 5) + 1;
    const queueElement = document.getElementById('queuePosition');
    if (queueElement) {
        queueElement.textContent = `Position: ${queuePosition}`;
    }

    // Countdown to chat start
    let countdown = 5;
    const countdownElement = document.getElementById('countdown');
    
    function updateCountdown() {
        if (queuePosition === 1 && countdown > 0) {
            if (countdownElement) {
                countdownElement.textContent = countdown;
            }
            countdown--;
            
            if (countdown < 0) {
                startChat();
            }
        } else if (queuePosition > 1) {
            // Simulate moving up in queue
            setTimeout(() => {
                queuePosition--;
                if (queueElement) {
                    queueElement.textContent = `Position: ${queuePosition}`;
                }
                countdown = 5; // Reset countdown when position changes
            }, 5000);
        }
    }

    // Start countdown
    const countdownInterval = setInterval(updateCountdown, 1000);

    // Auto-start chat after 15 seconds for demo (remove in production)
    setTimeout(() => {
        if (queuePosition > 0) {
            queuePosition = 1;
            if (queueElement) {
                queueElement.textContent = 'Position: 1';
            }
        }
    }, 15000);
}

function startChat() {
    const waitingRoom = document.getElementById('waitingRoom');
    const activeChat = document.getElementById('activeChat');
    
    if (waitingRoom) waitingRoom.classList.add('hidden');
    if (activeChat) activeChat.classList.remove('hidden');
    
    // Start 5-minute timer
    let timeLeft = 300; // 5 minutes in seconds
    const timerElement = document.getElementById('chatTimer');
    
    const chatTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(chatTimer);
            endChat();
        }
    }, 1000);
}

function joinVoiceChat() {
    alert('Voice chat would start here! In a real app, this would connect to Agora.');
    // This would integrate with your existing Agora code
}

function leaveChat() {
    if (confirm('Are you sure you want to leave the chat early?')) {
        endChat();
    }
}

function endChat() {
    alert('Chat ended! Thank you for your time.');
    window.location.href = 'shoot-your-shot.html';
}

// Add dating section to main page
function addDatingSection() {
    const mainInterface = document.getElementById('mainInterface');
    if (!mainInterface) return;

    // Find a good position to insert the dating section (after first ad slot)
    const firstAdSlot = mainInterface.querySelector('.ad-container');
    
    const datingSection = document.createElement('div');
    datingSection.className = 'panel dating-section';
    datingSection.innerHTML = `
        <h2 class="glowing-title title-medium">💘 SHOOT YOUR SHOT</h2>
        <p style="text-align: center; color: var(--muted); margin-bottom: 20px; font-size: 18px;">
            Private 5-minute video chats with verified local singles<br>
            <span style="color: var(--accent3);">Make your move before someone else does! 💖</span>
        </p>
        
        <div class="dating-features">
            <div class="dating-feature">
                <div class="dating-feature-icon">🔥</div>
                <div class="dating-feature-title">Instant Matching</div>
                <div class="dating-feature-desc">Connect with singles in your area</div>
            </div>
            
            <div class="dating-feature">
                <div class="dating-feature-icon">⏱️</div>
                <div class="dating-feature-title">5-Minute Chats</div>
                <div class="dating-feature-desc">Quick, fun, no pressure</div>
            </div>
            
            <div class="dating-feature">
                <div class="dating-feature-icon">💰</div>
                <div class="dating-feature-title">$15 per Chat</div>
                <div class="dating-feature-desc">Affordable dating experience</div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <a href="shoot-your-shot.html" class="btn primary" style="font-size: 20px; padding: 18px 40px; background: linear-gradient(145deg, var(--accent1), #ff3366);">
                💘 Start Dating Now
            </a>
            <div style="margin-top: 15px; color: var(--accent3); font-size: 14px;">
                🔥 12 people chatting right now!
            </div>
        </div>
    `;

    // Insert after the first ad slot or at the beginning of main interface
    if (firstAdSlot && firstAdSlot.nextSibling) {
        mainInterface.insertBefore(datingSection, firstAdSlot.nextSibling);
    } else {
        const firstPanel = mainInterface.querySelector('.panel');
        if (firstPanel) {
            mainInterface.insertBefore(datingSection, firstPanel.nextSibling);
        } else {
            mainInterface.appendChild(datingSection);
        }
    }
}

// Update shoot-your-shot.html to use dynamic data - FIXED
async function populateGirlsGrid() {
    console.log('🔄 populateGirlsGrid: Starting...');
    
    // Try multiple selectors for the grid
    const girlsGrid = document.getElementById('datersGrid') || document.querySelector('.girls-grid');
    if (!girlsGrid) {
        console.error('❌ Girls grid element not found!');
        return;
    }

    // Show loading state
    girlsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted);">🔥 Loading profiles from database...</div>';

    try {
        const girlsData = await getGirlsData();
        console.log('📋 Girls data for grid:', girlsData);
        
        girlsGrid.innerHTML = '';

        if (!girlsData || Object.keys(girlsData).length === 0) {
            girlsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <div style="color: var(--muted); margin-bottom: 20px; font-size: 18px;">
                        🌟 No profiles available yet. Be the first to sign up!
                    </div>
                    <a href="dater-signup.html" class="btn primary" style="background: var(--accent2);">
                        💖 Become a Dater and Earn Money
                    </a>
                </div>
            `;
            return;
        }

        Object.keys(girlsData).forEach(girlId => {
            const girl = girlsData[girlId];
            const girlCard = document.createElement('a');
            girlCard.href = `girl-profile.html?girl=${girlId}`;
            girlCard.className = 'girl-card';
            girlCard.innerHTML = `
                <div class="girl-image">${girl.avatar}</div>
                <div class="girl-info">
                    <div class="girl-name">${girl.name}</div>
                    <div class="girl-location">📍 ${girl.location}</div>
                    <div class="girl-bio">${girl.bio ? (girl.bio.substring(0, 80) + (girl.bio.length > 80 ? '...' : '')) : 'No bio provided'}</div>
                    <div class="girl-schedule">🕐 ${girl.schedule && girl.schedule[0] ? girl.schedule[0] + ' ' + girl.timezone : 'Check schedule'}</div>
                    <div class="girl-tag">5-min Chat: $15</div>
                    ${girl.verification ? `<div class="verification-badge">${girl.verification}</div>` : ''}
                </div>
            `;
            girlsGrid.appendChild(girlCard);
        });
        
        console.log('✅ Successfully populated girls grid with', Object.keys(girlsData).length, 'profiles');
        
    } catch (error) {
        console.error('❌ Error populating girls grid:', error);
        girlsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--accent1);">
                <h3>Error loading profiles</h3>
                <p>Please refresh the page or try again later.</p>
                <button onclick="location.reload()" class="btn primary" style="margin-top: 10px;">Refresh Page</button>
            </div>
        `;
    }
}

// Debug function to check platform status
window.debugDatingSystem = function() {
    console.log('=== DATING SYSTEM DEBUG ===');
    console.log('Platform Manager:', window.platformManager);
    console.log('Platform Manager Initialized:', window.platformManager?.initialized);
    
    if (window.platformManager) {
        const daters = platformManager.getAllDaters();
        console.log('Daters from platform manager:', daters);
        console.log('Total daters:', daters.length);
    }
    
    const stored = localStorage.getItem('whispers_platform_data');
    console.log('Stored platform data:', stored ? JSON.parse(stored) : 'NO DATA');
    
    alert(`Dating System Debug:
Platform Manager: ${window.platformManager ? '✅ Found' : '❌ Missing'}
Initialized: ${window.platformManager?.initialized ? '✅ Yes' : '❌ No'}
Total Daters: ${window.platformManager ? platformManager.getAllDaters().length : 'N/A'}
Check console for details.`);
};

// Initialize dating system when DOM is loaded - IMPROVED
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 DOM loaded, initializing dating system...');
    
    // Add dating section to main page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        console.log('📍 On main page, adding dating section');
        setTimeout(addDatingSection, 1000);
    }
    
    // Initialize girl profile page
    if (window.location.pathname.endsWith('girl-profile.html')) {
        console.log('👤 On girl profile page, initializing...');
        // Wait for platform manager to initialize
        const initInterval = setInterval(() => {
            if (window.platformManager && platformManager.initialized) {
                clearInterval(initInterval);
                initializeGirlProfile();
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            if (!window.platformManager || !platformManager.initialized) {
                console.warn('Platform manager not initialized, trying anyway...');
                initializeGirlProfile();
            }
        }, 5000);
    }
    
    // Initialize private chat page
    if (window.location.pathname.endsWith('private-chat.html')) {
        console.log('💬 On private chat page, initializing...');
        initializePrivateChat();
    }

    // Populate girls grid on shoot-your-shot page
    if (window.location.pathname.endsWith('shoot-your-shot.html')) {
        console.log('🎯 On shoot-your-shot page, populating grid...');
        // Wait for platform manager to initialize
        const initInterval = setInterval(() => {
            if (window.platformManager && platformManager.initialized) {
                clearInterval(initInterval);
                populateGirlsGrid();
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            if (!window.platformManager || !platformManager.initialized) {
                console.warn('Platform manager not initialized, trying anyway...');
                populateGirlsGrid();
            }
        }, 5000);
    }
    
    console.log('✅ Dating system initialization complete');
});
