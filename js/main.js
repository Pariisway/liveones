// Main JavaScript Functions

// Initialize the platform
function initPlatform() {
    console.log("🎙️ Voice Connect Platform Initialized");
    
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("User logged in:", user.email);
        } else {
            console.log("No user logged in");
        }
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: rgba(0,0,0,0.8); 
              color: white; padding: 15px 25px; border-radius: 10px; z-index: 10000;
              box-shadow: 0 5px 20px rgba(0,0,0,0.3); backdrop-filter: blur(10px);">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}" 
               style="margin-right: 10px; color: ${type === 'success' ? '#00ff00' : type === 'error' ? '#ff5555' : '#00aaff'}"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPlatform);
