// Add this function to scripts.js to update whisper cards when profile changes
function updateUserProfileOnHomePage(userData) {
    console.log("Updating user profile on home page", userData);
    
    // Find and update the user's whisper card
    const whisperCards = document.querySelectorAll('.whisper-card');
    whisperCards.forEach(card => {
        const userId = card.getAttribute('data-user-id');
        if (userId === userData.uid) {
            // Update the card with new data
            const avatar = card.querySelector('.whisper-avatar i, .whisper-avatar img');
            const name = card.querySelector('.whisper-name');
            const category = card.querySelector('.whisper-category');
            const bio = card.querySelector('.whisper-bio p');
            
            if (name) name.textContent = userData.displayName || "User";
            if (category) category.textContent = userData.category || "Lifestyle";
            if (bio) bio.textContent = userData.bio || "Available for calls";
            
            // Update avatar
            if (userData.photoURL) {
                // Replace icon with image
                if (avatar && avatar.tagName === 'I') {
                    const img = document.createElement('img');
                    img.src = userData.photoURL;
                    img.alt = userData.displayName;
                    img.onerror = function() {
                        this.style.display = 'none';
                        avatar.style.display = 'flex';
                    };
                    avatar.parentNode.insertBefore(img, avatar);
                    avatar.style.display = 'none';
                } else if (avatar && avatar.tagName === 'IMG') {
                    avatar.src = userData.photoURL;
                }
            }
        }
    });
}

// Listen for profile updates from dashboard
window.addEventListener('storage', function(e) {
    if (e.key === 'profileUpdated' && currentUser) {
        // Reload user data when profile is updated from dashboard
        loadWhispers();
    }
});

// Also update the loadWhispers function to listen for real-time updates
// Modify the existing loadWhispers function to add this at the beginning:
function enhancedLoadWhispers() {
    if (!currentUser) return;
    
    // Listen for real-time updates to current user's profile
    firebase.firestore().collection('users').doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                updateUserProfileOnHomePage(userData);
            }
        });
    
    // Rest of existing loadWhispers function...
    // [Keep all existing code here]
}

// Replace the existing loadWhispers function call with enhanced version
// In your existing code, change loadWhispers(); to enhancedLoadWhispers();
