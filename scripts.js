// Main app initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing app...');
    
    // Initialize any page-specific functionality
    if (typeof initPage === 'function') {
        initPage();
    }
    
    // Setup modal close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Setup auth tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active form
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            document.getElementById(tabName + 'Form').classList.add('active');
        });
    });
    
    // Setup hero buttons
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    const heroSignupBtn = document.getElementById('heroSignupBtn');
    
    if (heroLoginBtn) {
        heroLoginBtn.addEventListener('click', function() {
            if (typeof showAuthModal === 'function') {
                showAuthModal('login');
            }
        });
    }
    
    if (heroSignupBtn) {
        heroSignupBtn.addEventListener('click', function() {
            if (typeof showAuthModal === 'function') {
                showAuthModal('signup');
            }
        });
    }
    
    // Refresh whispers button
    const refreshBtn = document.getElementById('refreshWhispersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            if (typeof loadWhispers === 'function') {
                loadWhispers();
            }
        });
    }
    
    console.log('✅ App initialized successfully');
});

// ===== GLOBAL FUNCTIONS =====
// Load whispers for home page - GLOBAL FUNCTION
async function loadWhispers() {
    const grid = document.getElementById('whispersGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // Make sure getAvailableWhispers is available
        if (typeof getAvailableWhispers !== 'function') {
            console.error('getAvailableWhispers not found');
            grid.innerHTML = '<p>Error loading whispers. Please refresh.</p>';
            return;
        }
        
        const whispers = await getAvailableWhispers();
        
        if (whispers.length === 0) {
            grid.innerHTML = '<p>No whispers available. Check back soon!</p>';
            return;
        }
        
        let html = '';
        whispers.forEach(whisper => {
            html += `
                <div class="whisper-card">
                    <div class="whisper-avatar">
                        <img src="${whisper.avatarUrl}" alt="${whisper.displayName}" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(whisper.displayName)}&backgroundColor=6c63ff'">
                    </div>
                    <div class="whisper-info">
                        <h3>${whisper.displayName}</h3>
                        <div class="whisper-category">${whisper.category}</div>
                        <div class="whisper-rating">
                            <i class="fas fa-star"></i> ${whisper.rating.toFixed(1)}
                        </div>
                        <p class="whisper-bio">${whisper.bio}</p>
                        <div class="whisper-price">
                            <span class="price-tag">1 Coin</span>
                            <button class="btn-primary" onclick="startCallWithWhisper('${whisper.id}')">
                                <i class="fas fa-phone"></i> Call Now
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
        
    } catch (error) {
        console.error('Load whispers error:', error);
        grid.innerHTML = '<p>Error loading whispers. Please try again.</p>';
    }
}

// Page-specific initialization for index.html
function initIndexPage() {
    console.log('📱 Initializing index page...');
    
    // Load whispers if on home page
    loadWhispers();
    
    // Setup auth form submissions
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            const result = await signInWithEmail(email, password);
            if (result.success) {
                closeModal();
                showToast('Logged in successfully!', 'success');
            } else {
                showToast(result.error, 'error');
            }
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const displayName = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            
            if (!displayName || !email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            if (password.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }
            
            const result = await signUpWithEmail(email, password, displayName);
            if (result.success) {
                closeModal();
                showToast('Account created! Welcome to Whisper+Me!', 'success');
            } else {
                showToast(result.error, 'error');
            }
        });
    }
}

// Check if we're on index.html and initialize
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/liveones/')) {
    window.initPage = initIndexPage;
}

// Make loadWhispers available globally regardless of page
window.loadWhispers = loadWhispers;
