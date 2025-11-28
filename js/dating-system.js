/*************************************************************************
 * SHOOT YOUR SHOT DATING SYSTEM - FIXED VERSION
 * Removed duplicate section injection
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

// Fallback data function
function getFallbackGirlsData() {
    try {
        // Check localStorage first
        const storedGirls = localStorage.getItem('girlsData');
        if (storedGirls) {
            console.log('📁 Loading girls data from localStorage');
            return JSON.parse(storedGirls);
        }
    } catch (error) {
        console.warn('❌ Error loading from localStorage:', error);
    }
    
    // Final fallback - mock data
    console.log('🎭 Using mock girls data');
    return {
        "1": {
            id: "1",
            name: "Jessica",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
            location: "New York, NY",
            bio: "Love hiking and coffee dates ☕",
            schedule: ["Monday", "Wednesday", "Friday"],
            timezone: "EST",
            interests: ["Hiking", "Coffee", "Travel"],
            verification: "Verified",
            responseTime: "Usually replies in 2 mins",
            earnings: 1250,
            totalChats: 45,
            rating: 4.8
        },
        "2": {
            id: "2",
            name: "Sarah",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
            location: "Los Angeles, CA",
            bio: "Artist and dog lover 🎨🐕",
            schedule: ["Tuesday", "Thursday", "Saturday"],
            timezone: "PST",
            interests: ["Art", "Dogs", "Movies"],
            verification: "Verified",
            responseTime: "Usually replies in 5 mins",
            earnings: 980,
            totalChats: 32,
            rating: 4.6
        },
        "3": {
            id: "3",
            name: "Maya",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
            location: "Chicago, IL",
            bio: "Foodie and travel enthusiast 🌎",
            schedule: ["Monday", "Tuesday", "Weekends"],
            timezone: "CST",
            interests: ["Food", "Travel", "Photography"],
            verification: "Pending Verification",
            responseTime: "Usually replies in 10 mins",
            earnings: 650,
            totalChats: 28,
            rating: 4.7
        }
    };
}

// Save girls data to localStorage
function saveGirlsData(girlsData) {
    try {
        localStorage.setItem('girlsData', JSON.stringify(girlsData));
        console.log('💾 Girls data saved to localStorage');
    } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
    }
}

// Update shoot-your-shot.html to use dynamic data - FIXED
async function populateGirlsGrid() {
    try {
        console.log('🔄 populateGirlsGrid: Starting...');
        const girlsGrid = document.getElementById('girlsGrid');
        
        if (!girlsGrid) {
            console.error('❌ Girls grid element not found');
            return;
        }

        // Show loading state
        girlsGrid.innerHTML = `
            <div class="loading-girls">
                <div class="loading-spinner"></div>
                <p>Loading amazing people...</p>
            </div>
        `;

        const girlsData = await getGirlsData();
        console.log('📊 Girls data loaded:', Object.keys(girlsData).length, 'girls');

        if (!girlsData || Object.keys(girlsData).length === 0) {
            girlsGrid.innerHTML = `
                <div class="no-girls">
                    <p>No daters available at the moment.</p>
                    <p>Check back soon or <a href="become-a-dater.html">become a dater</a>!</p>
                </div>
            `;
            return;
        }

        // Clear loading state
        girlsGrid.innerHTML = '';

        // Populate grid with girls data
        Object.values(girlsData).forEach(girl => {
            const girlCard = document.createElement('div');
            girlCard.className = 'girl-card';
            girlCard.innerHTML = `
                <div class="girl-avatar">
                    <img src="${girl.avatar}" alt="${girl.name}" onerror="this.src='https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'">
                    <div class="online-indicator ${girl.isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="girl-info">
                    <h3>${girl.name}</h3>
                    <p class="girl-location">📍 ${girl.location}</p>
                    <p class="girl-bio">${girl.bio}</p>
                    <div class="girl-stats">
                        <span class="verification-badge">${girl.verification}</span>
                        <span class="rating">⭐ ${girl.rating}</span>
                    </div>
                    <div class="girl-interests">
                        ${girl.interests.slice(0, 3).map(interest => 
                            `<span class="interest-tag">${interest}</span>`
                        ).join('')}
                    </div>
                </div>
                <button class="btn primary start-chat-btn" data-girl-id="${girl.id}">
                    💘 Start Chat - $15
                </button>
            `;
            girlsGrid.appendChild(girlCard);
        });

        // Add click handlers for chat buttons
        document.querySelectorAll('.start-chat-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const girlId = this.getAttribute('data-girl-id');
                startDatingSession(girlId);
            });
        });

        console.log('✅ Girls grid populated successfully');

    } catch (error) {
        console.error('❌ Error populating girls grid:', error);
        const girlsGrid = document.getElementById('girlsGrid');
        if (girlsGrid) {
            girlsGrid.innerHTML = `
                <div class="error-state">
                    <p>Sorry, we're having trouble loading daters right now.</p>
                    <button onclick="populateGirlsGrid()" class="btn">Try Again</button>
                </div>
            `;
        }
    }
}

// Start dating session function
async function startDatingSession(girlId) {
    try {
        console.log('💘 Starting dating session with girl:', girlId);
        
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!currentUser.id) {
            alert('Please set your username first!');
            return;
        }

        // Show loading state
        const chatBtn = document.querySelector(`[data-girl-id="${girlId}"]`);
        const originalText = chatBtn.innerHTML;
        chatBtn.innerHTML = 'Starting chat...';
        chatBtn.disabled = true;

        // Simulate API call to start session
        const sessionData = {
            userId: currentUser.id,
            girlId: girlId,
            startTime: new Date().toISOString(),
            status: 'active'
        };

        // Save session to localStorage (replace with actual API call)
        const sessions = JSON.parse(localStorage.getItem('datingSessions') || '[]');
        sessions.push(sessionData);
        localStorage.setItem('datingSessions', JSON.stringify(sessions));

        // Redirect to private chat page
        setTimeout(() => {
            window.location.href = `private-chat.html?session=${btoa(JSON.stringify(sessionData))}`;
        }, 1000);

    } catch (error) {
        console.error('❌ Error starting dating session:', error);
        alert('Failed to start chat. Please try again.');
        
        // Reset button
        const chatBtn = document.querySelector(`[data-girl-id="${girlId}"]`);
        chatBtn.innerHTML = '💘 Start Chat - $15';
        chatBtn.disabled = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('💘 Dating System: DOM loaded');
    
    // Only populate girls grid if we're on the shoot-your-shot page
    if (document.getElementById('girlsGrid')) {
        populateGirlsGrid();
    }
    
    // Remove the duplicate section injection - this is the fix!
    // The duplicate createDatingSection() function has been removed
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getGirlsData,
        populateGirlsGrid,
        startDatingSession
    };
}
