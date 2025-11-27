/*************************************************************************
 * SHOOT YOUR SHOT DATING SYSTEM
 *************************************************************************/

// Girl data management with Firebase support
async function getGirlsData() {
    try {
        if (window.platformManager && platformManager.initialized) {
            const daters = await platformManager.getAllDaters();
            const girlsData = {};
            
            daters.forEach(dater => {
                girlsData[dater.id || dater.username] = {
                    name: dater.displayName,
                    avatar: dater.avatar,
                    location: dater.location,
                    bio: dater.bio,
                    schedule: dater.schedule || [],
                    timezone: dater.timezone,
                    interests: dater.interests || [],
                    verification: dater.verification || 'Verified ✅',
                    responseTime: 'Usually replies in 2 mins'
                };
            });
            
            if (Object.keys(girlsData).length > 0) {
                return girlsData;
            }
        }
    } catch (error) {
        console.error('Error getting daters:', error);
    }
    
    // Fallback to localStorage or mock data
    return getFallbackGirlsData();
}

// Fallback data function
function getFallbackGirlsData() {
    // Check localStorage first
    const adminGirls = JSON.parse(localStorage.getItem('admin_girls') || '{}');
    if (Object.keys(adminGirls).length > 0) {
        return adminGirls;
    }
    
    // Default mock data
    return {
        'sarah': {
            name: 'Sarah, 24',
            avatar: '🔥',
            location: '📍 Los Angeles, CA',
            bio: 'Adventure seeker and coffee lover! I\'m a psychology major who enjoys hiking, trying new restaurants, and deep conversations.',
            schedule: ['19:00-21:00'],
            timezone: 'PST',
            interests: ['Hiking', 'Coffee', 'Photography', 'Travel'],
            verification: 'Verified ✅',
            responseTime: 'Usually replies in 2 mins'
        },
        'maya': {
            name: 'Maya, 22',
            avatar: '💫', 
            location: '📍 New York, NY',
            bio: 'Creative soul and foodie! I work in digital marketing and love exploring the city, photography, and trying new recipes.',
            schedule: ['16:00-18:00'],
            timezone: 'EST',
            interests: ['Art', 'Food', 'Exploring', 'Music'],
            verification: 'Verified ✅',
            responseTime: 'Usually replies in 1 min'
        },
        'chloe': {
            name: 'Chloe, 25',
            avatar: '🌟',
            location: '📍 Miami, FL',
            bio: 'Beach lover and artist! I\'m a freelance graphic designer who enjoys painting, yoga, and sunset walks.',
            schedule: ['20:00-22:00'],
            timezone: 'EST',
            interests: ['Art', 'Yoga', 'Beach', 'Design'],
            verification: 'Verified ✅',
            responseTime: 'Usually replies in 3 mins'
        },
        'jessica': {
            name: 'Jessica, 23',
            avatar: '✨',
            location: '📍 Chicago, IL',
            bio: 'Bookworm and travel enthusiast! I work in tech and love reading, planning my next trip, and coffee shop hopping.',
            schedule: ['14:00-16:00'],
            timezone: 'CST',
            interests: ['Reading', 'Travel', 'Tech', 'Coffee'],
            verification: 'Verified ✅',
            responseTime: 'Usually replies in 2 mins'
        }
    };
}

// Update initializeGirlProfile function to be async
async function initializeGirlProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const girlId = urlParams.get('girl') || 'sarah';
    const girlsData = await getGirlsData();
    const girl = girlsData[girlId];

    if (!girl) {
        window.location.href = 'shoot-your-shot.html';
        return;
    }

    // Update page with girl info
    document.getElementById('pageTitle').textContent = `MEET ${girl.name.split(',')[0].toUpperCase()}`;
    document.getElementById('girlAvatar').textContent = girl.avatar;
    document.getElementById('girlName').textContent = girl.name;
    document.getElementById('girlLocation').textContent = girl.location;
    document.getElementById('girlBio').textContent = girl.bio;

    // Create schedule slots
    const scheduleContainer = document.getElementById('scheduleSlots');
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

    // Check if it's currently scheduled time
    checkSchedule(girl);
    
    // Check schedule every minute
    setInterval(() => checkSchedule(girl), 60000);
}

// Check schedule function
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
        purchaseBtn.disabled = false;
        queueInfo.textContent = 'Chat is LIVE! Join the queue now.';
        // Add active class to current time slot
        document.querySelectorAll('.time-slot').forEach(slot => {
            if (slot.textContent.includes(currentTime.substring(0,2))) {
                slot.classList.add('active');
            }
        });
    } else {
        purchaseBtn.disabled = true;
        queueInfo.textContent = 'Purchase available only during scheduled hours';
    }
}

// Purchase function - UPDATED TO USE PAYMENTS PAGE
function purchaseChat() {
    const urlParams = new URLSearchParams(window.location.search);
    const girlId = urlParams.get('girl');
    
    // Redirect to payment page instead of directly to chat
    window.location.href = `payments.html?girl=${girlId}`;
}

// Initialize private chat
function initializePrivateChat() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const girlId = urlParams.get('girl');
    const username = urlParams.get('user') || 'Guest';
    const paid = urlParams.get('paid') === 'true';

    // Update title
    document.getElementById('chatTitle').textContent = `WITH ${(girlId || 'YOUR DATE').toUpperCase()}`;

    // If not paid, redirect back
    if (!paid) {
        alert('Please complete payment first!');
        window.location.href = `girl-profile.html?girl=${girlId}`;
        return;
    }

    // Simulate queue position (in real app, this would come from server)
    let queuePosition = Math.floor(Math.random() * 5) + 1;
    document.getElementById('queuePosition').textContent = `Position: ${queuePosition}`;

    // Countdown to chat start
    let countdown = 5;
    const countdownElement = document.getElementById('countdown');
    
    function updateCountdown() {
        if (queuePosition === 1 && countdown > 0) {
            countdownElement.textContent = countdown;
            countdown--;
            
            if (countdown < 0) {
                startChat();
            }
        } else if (queuePosition > 1) {
            // Simulate moving up in queue
            setTimeout(() => {
                queuePosition--;
                document.getElementById('queuePosition').textContent = `Position: ${queuePosition}`;
                countdown = 5; // Reset countdown when position changes
            }, 5000);
        }
    }

    // Start countdown
    setInterval(updateCountdown, 1000);

    // Auto-start chat after 15 seconds for demo (remove in production)
    setTimeout(() => {
        if (queuePosition > 0) {
            queuePosition = 1;
            document.getElementById('queuePosition').textContent = 'Position: 1';
        }
    }, 15000);
}

function startChat() {
    document.getElementById('waitingRoom').classList.add('hidden');
    document.getElementById('activeChat').classList.remove('hidden');
    
    // Start 5-minute timer
    let timeLeft = 300; // 5 minutes in seconds
    const timerElement = document.getElementById('chatTimer');
    
    const chatTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
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

// Update shoot-your-shot.html to use dynamic data
async function populateGirlsGrid() {
    const girlsGrid = document.querySelector('.girls-grid');
    if (!girlsGrid) return;

    // Show loading state
    girlsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted);">Loading profiles...</div>';

    try {
        const girlsData = await getGirlsData();
        girlsGrid.innerHTML = '';

        if (Object.keys(girlsData).length === 0) {
            girlsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted);">No profiles available yet.</div>';
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
                    <div class="girl-schedule">🕐 ${girl.schedule && girl.schedule[0] ? girl.schedule[0] + ' ' + girl.timezone : 'Check schedule'}</div>
                    <div class="girl-tag">5-min Chat: $15</div>
                </div>
            `;
            girlsGrid.appendChild(girlCard);
        });
    } catch (error) {
        console.error('Error populating girls grid:', error);
        girlsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--accent1);">Error loading profiles. Please refresh.</div>';
    }
}

// Initialize dating system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add dating section to main page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        setTimeout(addDatingSection, 1000);
    }
    
    // Initialize girl profile page
    if (window.location.pathname.endsWith('girl-profile.html')) {
        // Use setTimeout to allow platformManager to initialize
        setTimeout(() => {
            initializeGirlProfile();
        }, 500);
    }
    
    // Initialize private chat page
    if (window.location.pathname.endsWith('private-chat.html')) {
        initializePrivateChat();
    }

    // Populate girls grid on shoot-your-shot page
    if (window.location.pathname.endsWith('shoot-your-shot.html')) {
        // Use setTimeout to allow platformManager to initialize
        setTimeout(() => {
            populateGirlsGrid();
        }, 500);
    }
});
