// ===== GLOBAL VARIABLES =====
let currentCall = null;
let callTimer = null;
let callDuration = 0;
// Note: agoraClient, localStream, remoteStream are declared in firebase-config.js

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
    
    if (userData.coins < 1) {
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
    initMobileMenu();
    
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User authenticated:', user.email);
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                    loadWhispers();
                }
                updateUIForAuth(true);
            } else {
                console.log('User signed out');
                updateUIForAuth(false);
            }
        });
    }
    
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
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            if (email && password) {
                await loginUser(email, password);
            }
        });
    }
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail')?.value;
            const password = document.getElementById('signupPassword')?.value;
            const displayName = document.getElementById('displayName')?.value;
            const role = document.querySelector('input[name="role"]:checked')?.value || 'caller';
            
            if (email && password && displayName) {
                await signupUser(email, password, displayName, role);
            }
        });
    }
    
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            await signInWithGoogle();
        });
    }
    
    console.log('App initialized successfully');
}

window.initMobileMenu = initMobileMenu;
window.loginUser = loginUser;
window.signupUser = signupUser;
window.startCall = startCall;
window.formatDuration = formatDuration;
window.formatDate = formatDate;
window.initializeApp = initializeApp;
window.closeModal = closeModal;
window.showAuthModal = showAuthModal;

document.addEventListener('DOMContentLoaded', initializeApp);
