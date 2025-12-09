// Main JavaScript for WhisperChat

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("WhisperChat initialized");
    
    // Mobile menu toggle
    initMobileMenu();
    
    // Smooth scrolling for anchor links
    initSmoothScroll();
    
    // Load available whispers
    loadWhispers();
    
    // Initialize pricing buttons
    initPricingButtons();
    
    // Initialize call buttons
    initCallButtons();
    
    // Initialize auth buttons
    initAuthButtons();
    
    // Initialize modal
    initModal();
    
    // Check if user is logged in
    checkAuthState();
});

// Mobile menu functionality
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    const navActions = document.querySelector('.nav-actions');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            if (navMenu.style.display === 'flex') {
                navMenu.style.display = 'none';
                if (navActions) navActions.style.display = 'none';
            } else {
                navMenu.style.display = 'flex';
                navMenu.style.flexDirection = 'column';
                navMenu.style.position = 'absolute';
                navMenu.style.top = '100%';
                navMenu.style.left = '0';
                navMenu.style.right = '0';
                navMenu.style.background = 'rgba(26, 26, 46, 0.98)';
                navMenu.style.backdropFilter = 'blur(10px)';
                navMenu.style.padding = '20px';
                navMenu.style.gap = '15px';
                navMenu.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
                
                if (navActions) {
                    navActions.style.display = 'flex';
                    navActions.style.flexDirection = 'column';
                    navActions.style.gap = '10px';
                    navActions.style.marginTop = '15px';
                    navActions.style.paddingTop = '15px';
                    navActions.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
                }
            }
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-container')) {
            if (navMenu) navMenu.style.display = 'none';
            if (navActions) navActions.style.display = 'none';
        }
    });
}

// Smooth scrolling for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                const navMenu = document.querySelector('.nav-menu');
                const navActions = document.querySelector('.nav-actions');
                if (navMenu) navMenu.style.display = 'none';
                if (navActions) navActions.style.display = 'none';
                
                // Scroll to element
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Load available whispers
async function loadWhispers() {
    const whispersGrid = document.getElementById('whispersGrid');
    if (!whispersGrid) return;
    
    try {
        // Check if firebaseDB is available
        if (typeof firebaseDB === 'undefined') {
            console.warn("Firebase not loaded yet, showing mock data");
            showMockWhispers();
            return;
        }
        
        // Get whispers from Firestore
        const snapshot = await firebaseDB.collection('users')
            .where('role', '==', 'whisper')
            .where('isAvailable', '==', true)
            .limit(12)
            .get();
        
        const whispers = [];
        snapshot.forEach(doc => {
            whispers.push({ id: doc.id, ...doc.data() });
        });
        
        // If no whispers found, show mock data
        if (whispers.length === 0) {
            showMockWhispers();
            return;
        }
        
        // Render whispers
        renderWhispers(whispers);
        
    } catch (error) {
        console.error("Error loading whispers:", error);
        showMockWhispers();
    }
}

// Show mock whispers for demo
function showMockWhispers() {
    const mockWhispers = [
        {
            id: '1',
            displayName: 'Jessica Star',
            photoURL: 'https://randomuser.me/api/portraits/women/1.jpg',
            rating: 4.9,
            category: 'Lifestyle',
            bio: 'Fashion influencer with 500k followers. Love connecting with fans!',
            calls: 124,
            earnings: 1488,
            isAvailable: true
        },
        {
            id: '2',
            displayName: 'Mike Fitness',
            photoURL: 'https://randomuser.me/api/portraits/men/2.jpg',
            rating: 4.8,
            category: 'Fitness',
            bio: 'Personal trainer & fitness coach. Let\'s talk health goals!',
            calls: 89,
            earnings: 1068,
            isAvailable: true
        },
        {
            id: '3',
            displayName: 'Tech Guru',
            photoURL: 'https://randomuser.me/api/portraits/men/3.jpg',
            rating: 4.7,
            category: 'Technology',
            bio: 'Tech reviewer with 1M+ subscribers. Ask me anything about gadgets!',
            calls: 156,
            earnings: 1872,
            isAvailable: true
        },
        {
            id: '4',
            displayName: 'Travel Explorer',
            photoURL: 'https://randomuser.me/api/portraits/women/4.jpg',
            rating: 5.0,
            category: 'Travel',
            bio: 'Visited 50+ countries. Share travel stories and get tips!',
            calls: 67,
            earnings: 804,
            isAvailable: true
        }
    ];
    
    renderWhispers(mockWhispers);
}

// Render whispers to the grid
function renderWhispers(whispers) {
    const whispersGrid = document.getElementById('whispersGrid');
    if (!whispersGrid) return;
    
    whispersGrid.innerHTML = '';
    
    whispers.forEach(whisper => {
        const whisperCard = document.createElement('div');
        whisperCard.className = 'whisper-card fade-in';
        
        // Format earnings
        const earningsFormatted = whisper.earnings ? `$${whisper.earnings}` : '$0';
        
        whisperCard.innerHTML = `
            <div class="whisper-header">
                <img src="${whisper.photoURL || 'https://via.placeholder.com/300x200?text=Whisper'}" 
                     alt="${whisper.displayName}" class="whisper-avatar">
                <div class="whisper-status">Available</div>
            </div>
            <div class="whisper-body">
                <div class="whisper-name">
                    <span>${whisper.displayName}</span>
                    <div class="whisper-rating">
                        <i class="fas fa-star"></i> ${whisper.rating || 5.0}
                    </div>
                </div>
                <div class="whisper-category">${whisper.category || 'Influencer'}</div>
                <p class="whisper-bio">${whisper.bio || 'Available for 5-minute chats!'}</p>
                <div class="whisper-stats">
                    <div class="stat-item">
                        <span class="stat-value">${whisper.calls || 0}</span>
                        <span class="stat-label">Calls</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${earningsFormatted}</span>
                        <span class="stat-label">Earned</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">5min</span>
                        <span class="stat-label">Duration</span>
                    </div>
                </div>
                <div class="whisper-actions">
                    <button class="btn-primary btn-block call-whisper-btn" data-whisper-id="${whisper.id}">
                        <i class="fas fa-phone-alt"></i> Call Now (1 Coin)
                    </button>
                </div>
            </div>
        `;
        
        whispersGrid.appendChild(whisperCard);
    });
    
    // Re-initialize call buttons
    initCallButtons();
}

// Initialize call buttons
function initCallButtons() {
    document.querySelectorAll('.call-whisper-btn').forEach(button => {
        button.addEventListener('click', function() {
            const whisperId = this.getAttribute('data-whisper-id');
            startCall(whisperId);
        });
    });
}

// Start a call with a whisper
function startCall(whisperId) {
    // Check if user is logged in
    if (!currentUser || !window.currentUser || (typeof window.currentUser === 'function' && !window.currentUser())) {
        showToast('Please log in to start a call');
        showAuthModal();
        return;
    }
    
    // Check if user has coins
    if (userData && userData.coins < 1) {
        showToast('You need at least 1 Whisper Coin to make a call');
        showBuyCoinsModal();
        return;
    }
    
    // Redirect to call page
    window.location.href = `call.html?whisper=${whisperId}`;
}

// Initialize pricing buttons
function initPricingButtons() {
    document.querySelectorAll('.btn-primary[data-amount]').forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount'); // in cents
            const coins = this.getAttribute('data-coins');
            
            if (!currentUser) {
                showToast('Please sign up first');
                showAuthModal();
                return;
            }
            
            showBuyCoinsModal(amount, coins);
        });
    });
}

// Show buy coins modal
function showBuyCoinsModal(amount = 1500, coins = 1) {
    const modalHTML = `
        <div class="modal active" id="buyCoinsModal">
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <h2 style="margin-bottom: 20px;">Buy Whisper Coins</h2>
                <p style="color: var(--gray); margin-bottom: 30px;">
                    1 Coin = 1 five-minute call with any available Whisper
                </p>
                
                <div class="coins-options" style="margin-bottom: 30px;">
                    <div class="coins-option ${coins == 1 ? 'active' : ''}" data-amount="1500" data-coins="1">
                        <div class="coins-number">1</div>
                        <div class="coins-price">$15</div>
                        <div class="coins-per">$15 per coin</div>
                    </div>
                    <div class="coins-option ${coins == 5 ? 'active' : ''}" data-amount="6000" data-coins="5">
                        <div class="coins-number">5</div>
                        <div class="coins-price">$60</div>
                        <div class="coins-per">$12 per coin</div>
                        <div class="coins-save">Save $15</div>
                    </div>
                    <div class="coins-option ${coins == 15 ? 'active' : ''}" data-amount="15000" data-coins="15">
                        <div class="coins-number">15</div>
                        <div class="coins-price">$150</div>
                        <div class="coins-per">$10 per coin</div>
                        <div class="coins-save">Save $75</div>
                    </div>
                </div>
                
                <button class="btn-primary btn-block" id="stripeCheckoutBtn">
                    <i class="fas fa-credit-card"></i> Purchase with Credit Card
                </button>
                
                <button class="btn-secondary btn-block mt-20" id="cryptoCheckoutBtn">
                    <i class="fab fa-bitcoin"></i> Purchase with Crypto (Coming Soon)
                </button>
                
                <p style="text-align: center; margin-top: 20px; color: var(--gray); font-size: 0.9rem;">
                    Secure payment powered by Stripe
                </p>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('buyCoinsModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize modal interactions
    initBuyCoinsModal(amount, coins);
}

// Initialize buy coins modal interactions
function initBuyCoinsModal(defaultAmount, defaultCoins) {
    let selectedAmount = defaultAmount;
    let selectedCoins = defaultCoins;
    
    // Coin option selection
    document.querySelectorAll('.coins-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            document.querySelectorAll('.coins-option').forEach(opt => {
                opt.classList.remove('active');
            });
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Update selected amount and coins
            selectedAmount = this.getAttribute('data-amount');
            selectedCoins = this.getAttribute('data-coins');
        });
    });
    
    // Stripe checkout button
    document.getElementById('stripeCheckoutBtn').addEventListener('click', function() {
        initiateStripeCheckout(selectedAmount, selectedCoins);
    });
    
    // Crypto checkout button
    document.getElementById('cryptoCheckoutBtn').addEventListener('click', function() {
        showToast('Crypto payments coming soon!');
    });
    
    // Close modal
    document.querySelector('#buyCoinsModal .modal-close').addEventListener('click', function() {
        document.getElementById('buyCoinsModal').remove();
    });
    
    document.querySelector('#buyCoinsModal.modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// Initiate Stripe checkout
function initiateStripeCheckout(amount, coins) {
    // In a real implementation, you would:
    // 1. Create a checkout session on your server
    // 2. Redirect to Stripe checkout
    
    // For now, show a success message (simulated)
    showToast(`Processing purchase of ${coins} coin(s) for $${amount/100}...`);
    
    // Simulate successful purchase
    setTimeout(() => {
        document.getElementById('buyCoinsModal').remove();
        showToast(`Success! ${coins} Whisper Coin(s) added to your account`);
        
        // Update user's coin balance in Firestore
        if (currentUser && window.firebaseDB) {
            window.firebaseDB.collection('users').doc(currentUser.uid).update({
                coins: firebase.firestore.FieldValue.increment(parseInt(coins))
            });
        }
    }, 2000);
}

// Initialize auth buttons
function initAuthButtons() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && !loginBtn.onclick) {
        loginBtn.addEventListener('click', showAuthModal);
    }
    
    // Signup button
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn && !signupBtn.onclick) {
        signupBtn.addEventListener('click', showAuthModal);
    }
    
    // Hero signup button
    const heroSignupBtn = document.getElementById('heroSignupBtn');
    if (heroSignupBtn && !heroSignupBtn.onclick) {
        heroSignupBtn.addEventListener('click', showAuthModal);
    }
    
    // Learn more button
    const learnMoreBtn = document.getElementById('learnMoreBtn');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', () => {
            document.querySelector('#how-it-works').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// Initialize modal
function initModal() {
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Escape key closes modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

// Close modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Check auth state
function checkAuthState() {
    // This will be handled by Firebase auth state listener
    // We just need to ensure Firebase is initialized
    if (typeof firebase !== 'undefined' && firebase.auth) {
        console.log("Firebase auth is ready");
    } else {
        console.warn("Firebase auth not available");
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--dark);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                border-left: 4px solid var(--success);
                animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
                max-width: 300px;
            }
            .toast-error {
                border-left-color: var(--danger);
            }
            .toast-warning {
                border-left-color: var(--warning);
            }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .toast i {
                font-size: 20px;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// Share profile function
function shareProfile(whisperId) {
    const url = `https://iaiwaf.com/?ref=${whisperId}`;
    const text = `Connect with me on WhisperChat for a private 5-minute call! Only $15.`;
    
    if (navigator.share) {
        // Use Web Share API if available
        navigator.share({
            title: 'WhisperChat Profile',
            text: text,
            url: url
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${text} ${url}`).then(() => {
            showToast('Profile link copied to clipboard!');
        });
    }
}

// Export functions for global use
window.showToast = showToast;
window.shareProfile = shareProfile;
window.startCall = startCall;
window.showBuyCoinsModal = showBuyCoinsModal;
window.showAuthModal = showAuthModal;
window.closeModal = closeModal;
