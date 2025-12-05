import { 
    db, realtimeDb,
    collection, query, where, getDocs,
    dbRef, onValue
} from './firebase-config.js';

let whispers = [];
let statuses = {};

document.addEventListener('DOMContentLoaded', () => {
    loadAllWhispers();
    setupSearchListeners();
});

async function loadAllWhispers() {
    try {
        const q = query(collection(db, 'users'), where('isWhisper', '==', true));
        const querySnapshot = await getDocs(q);
        
        whispers = [];
        querySnapshot.forEach((doc) => {
            whispers.push({ id: doc.id, ...doc.data() });
        });
        
        // Listen for real-time status updates
        onValue(dbRef(realtimeDb, 'status'), (snapshot) => {
            statuses = snapshot.val() || {};
            displayWhispers();
        });
        
        displayWhispers();
        
    } catch (error) {
        console.error('Error loading whispers:', error);
        document.getElementById('searchResults').innerHTML = 
            '<div class="error">Error loading whispers. Please try again.</div>';
    }
}

function displayWhispers() {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const availableOnly = document.getElementById('availableFilter')?.checked || false;
    const sortBy = document.getElementById('sortBy')?.value || 'availability';
    
    // Filter whispers
    let filteredWhispers = whispers.filter(whisper => {
        const matchesSearch = 
            whisper.name.toLowerCase().includes(searchTerm) ||
            (whisper.bio || '').toLowerCase().includes(searchTerm);
        
        const isAvailable = statuses[whisper.id]?.available || false;
        
        if (availableOnly && !isAvailable) return false;
        return matchesSearch;
    });
    
    // Sort whispers
    filteredWhispers.sort((a, b) => {
        const aAvailable = statuses[a.id]?.available || false;
        const bAvailable = statuses[b.id]?.available || false;
        
        switch (sortBy) {
            case 'availability':
                return bAvailable - aAvailable;
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
    
    // Display whispers
    if (filteredWhispers.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No whispers found. Try changing your search criteria.</div>';
        return;
    }
    
    searchResults.innerHTML = '';
    
    filteredWhispers.forEach(whisper => {
        const isAvailable = statuses[whisper.id]?.available || false;
        const card = createWhisperCard(whisper, isAvailable);
        searchResults.appendChild(card);
    });
}

function createWhisperCard(whisper, isAvailable) {
    const card = document.createElement('div');
    card.className = `whisper-card ${isAvailable ? 'available' : ''}`;
    card.innerHTML = `
        <div class="whisper-header">
            <img src="${whisper.photoURL || 'https://via.placeholder.com/60'}" 
                 alt="${whisper.name}" 
                 class="whisper-avatar"
                 onerror="this.src='https://via.placeholder.com/60'">
            <div>
                <h3 class="whisper-name">${whisper.name}</h3>
                <div class="status-indicator">
                    <span class="status-dot ${isAvailable ? 'available' : 'busy'}"></span>
                    <span class="status-text">${isAvailable ? 'Available Now' : 'Busy'}</span>
                </div>
            </div>
        </div>
        <p class="whisper-bio">${whisper.bio || 'No bio provided'}</p>
        <div class="whisper-stats">
            <span class="stat"><i class="fas fa-star"></i> ${whisper.rating || 'New'}</span>
            <span class="stat"><i class="fas fa-phone"></i> ${whisper.totalCalls || 0} calls</span>
        </div>
        <button class="call-btn" onclick="initiateCall('${whisper.id}')" ${!isAvailable ? 'disabled' : ''}>
            <i class="fas fa-phone"></i> Call Now - $15
        </button>
    `;
    
    return card;
}

function setupSearchListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', displayWhispers);
    }
    
    // Filters
    const availableFilter = document.getElementById('availableFilter');
    const sortBy = document.getElementById('sortBy');
    
    if (availableFilter) {
        availableFilter.addEventListener('change', displayWhispers);
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', displayWhispers);
    }
    
    // Auth buttons
    const signupBtn = document.getElementById('searchSignup');
    const loginBtn = document.getElementById('searchLogin');
    
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.href = 'index.html#signup';
        });
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'index.html#login';
        });
    }
}

function searchWhispers() {
    displayWhispers();
}

function initiateCall(whisperId) {
    // Show payment modal
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Store selected whisper ID
        modal.dataset.whisperId = whisperId;
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make functions available globally
window.searchWhispers = searchWhispers;
window.initiateCall = initiateCall;
window.closePaymentModal = closePaymentModal;
