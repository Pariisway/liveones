// ===== GLOBAL VARIABLES =====
let currentCall = null;
let callTimer = null;
let callDuration = 0;

// ===== MOBILE MENU =====
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
            mobileMenuBtn.innerHTML = navMenu.style.display === 'flex' ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
        });
        
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navMenu.style.display = 'flex';
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            } else {
                navMenu.style.display = 'none';
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
}

// ===== AUTHENTICATION =====
async function loginUser(email, password) {
    try {
        const result = await signInWithEmail(email, password);
        if (result.success) {
            closeModal();
            // MANUAL redirect to dashboard (not automatic)
            showToast('Login successful! Going to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = 'enhanced-dashboard.html';
            }, 1500);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed: ' + error.message, 'error');
        return false;
    }
}

async function signupUser(email, password, displayName, role) {
    try {
        const result = await signUpWithEmail(email, password, displayName, role);
        if (result.success) {
            closeModal();
            // MANUAL redirect to dashboard (not automatic)
            showToast('Account created! Going to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = 'enhanced-dashboard.html';
            }, 1500);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Signup failed: ' + error.message, 'error');
        return false;
    }
}

// ===== CALL MANAGEMENT =====
async function startCall(whisperId) {
    if (!currentUser) {
        showToast('Please log in to start a call', 'error');
        showAuthModal('login');
        return;
    }
    
    if (userData && userData.coins < 1) {
        showToast('You need at least 1 coin to start a call', 'error');
        window.location.href = 'payment.html';
        return;
    }
    
    showToast('Starting call...', 'info');
    await startCallWithWhisper(whisperId);
}

// ===== UTILITY FUNCTIONS =====
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// ===== INITIALIZATION =====
function initializeApp() {
    console.log("🚀 Initializing app...");
    
    initMobileMenu();
    
    // Setup event listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || 
            e.target.classList.contains('modal-close') ||
            e.target.closest('.modal-close')) {
            closeModal();
        }
        
        if (e.target.classList.contains('auth-tab')) {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            
            e.target.classList.add('active');
            const form = document.getElementById(`${tabId}Form`);
            if (form) form.classList.add('active');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            if (email && password) {
                const loginBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = loginBtn.innerHTML;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                loginBtn.disabled = true;
                
                try {
                    await loginUser(email, password);
                } finally {
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                }
            }
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail')?.value;
            const password = document.getElementById('signupPassword')?.value;
            const displayName = document.getElementById('displayName')?.value;
            const role = document.querySelector('input[name="role"]:checked')?.value || 'caller';
            
            if (email && password && displayName) {
                const signupBtn = signupForm.querySelector('button[type="submit"]');
                const originalText = signupBtn.innerHTML;
                signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
                signupBtn.disabled = true;
                
                try {
                    await signupUser(email, password, displayName, role);
                } finally {
                    signupBtn.innerHTML = originalText;
                    signupBtn.disabled = false;
                }
            }
        });
    }
    
    // Google login
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            const originalText = googleLoginBtn.innerHTML;
            googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            googleLoginBtn.disabled = true;
            
            try {
                await signInWithGoogle();
                // MANUAL redirect after Google login
                showToast('Login successful! Going to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'enhanced-dashboard.html';
                }, 1500);
            } finally {
                googleLoginBtn.innerHTML = originalText;
                googleLoginBtn.disabled = false;
            }
        });
    }
    
    // Google signup (if separate button exists)
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', async () => {
            const originalText = googleSignupBtn.innerHTML;
            googleSignupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            googleSignupBtn.disabled = true;
            
            try {
                await signInWithGoogle();
                // MANUAL redirect after Google signup
                showToast('Account created! Going to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'enhanced-dashboard.html';
                }, 1500);
            } finally {
                googleSignupBtn.innerHTML = originalText;
                googleSignupBtn.disabled = false;
            }
        });
    }
    
    console.log('✅ App initialized successfully');
}

// ===== EXPOSE FUNCTIONS TO WINDOW =====
window.initMobileMenu = initMobileMenu;
window.loginUser = loginUser;
window.signupUser = signupUser;
window.startCall = startCall;
window.formatDuration = formatDuration;
window.formatDate = formatDate;
window.initializeApp = initializeApp;

// ===== INITIALIZE ON LOAD =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
