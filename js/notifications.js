// Real-time Notifications System
class NotificationManager {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.notificationCount = 0;
        this.init();
    }

    init() {
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.setupNotificationListener(user.uid);
                this.checkPendingNotifications(user.uid);
            } else {
                this.cleanup();
            }
        });
    }

    setupNotificationListener(userId) {
        // Listen for new bookings for whispers
        this.bookingListener = this.db.collection('bookings')
            .where('whisperId', '==', userId)
            .where('status', '==', 'pending')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.showNewBookingNotification(change.doc.data());
                    }
                });
            });

        // Listen for call requests (for customers)
        this.callListener = this.db.collection('calls')
            .where('customerId', '==', userId)
            .where('status', '==', 'waiting')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.showCallReadyNotification(change.doc.data());
                    }
                });
            });
    }

    async checkPendingNotifications(userId) {
        try {
            // Check for pending bookings
            const bookingsSnapshot = await this.db.collection('bookings')
                .where('whisperId', '==', userId)
                .where('status', '==', 'pending')
                .get();

            // Check for waiting calls
            const callsSnapshot = await this.db.collection('calls')
                .where('customerId', '==', userId)
                .where('status', '==', 'waiting')
                .get();

            this.notificationCount = bookingsSnapshot.size + callsSnapshot.size;
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    showNewBookingNotification(booking) {
        this.notificationCount++;
        this.updateNotificationBadge();

        if (this.isNotificationPermissionGranted()) {
            this.showBrowserNotification('New Booking!', `You have a new call request from ${booking.customerEmail}`);
        }

        this.showInAppNotification('🎉 New Booking', `You have a new call request!`, 'booking', booking.id);
    }

    showCallReadyNotification(call) {
        this.notificationCount++;
        this.updateNotificationBadge();

        if (this.isNotificationPermissionGranted()) {
            this.showBrowserNotification('Call Ready!', 'Your whisper is ready for the call');
        }

        this.showInAppNotification('📞 Call Ready', 'Your call is ready to start!', 'call', call.id);
    }

    showInAppNotification(title, message, type, dataId) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}</strong>
                <p>${message}</p>
                <small>Just now</small>
            </div>
            <button class="notification-close">&times;</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #8B5CF6;
            color: white;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        // Add close functionality
        notification.querySelector('.notification-close').onclick = () => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        };

        // Add click functionality
        notification.onclick = () => {
            this.handleNotificationClick(type, dataId);
            notification.remove();
        };

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        document.body.appendChild(notification);

        // Add CSS animations if not already added
        this.ensureNotificationStyles();
    }

    handleNotificationClick(type, dataId) {
        switch (type) {
            case 'booking':
                window.location.href = `whisper-portal.html#bookings`;
                break;
            case 'call':
                window.location.href = `call-room.html?callId=${dataId}`;
                break;
        }
    }

    showBrowserNotification(title, body) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) return false;

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return Notification.permission === 'granted';
    }

    isNotificationPermissionGranted() {
        return Notification.permission === 'granted';
    }

    updateNotificationBadge() {
        // Update notification badge in navigation
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            if (this.notificationCount > 0) {
                badge.textContent = this.notificationCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    ensureNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-badge {
                background: #EF4444;
                color: white;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 0.7rem;
                position: absolute;
                top: -5px;
                right: -5px;
                display: none;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
            }
        `;
        document.head.appendChild(styles);
    }

    cleanup() {
        if (this.bookingListener) this.bookingListener();
        if (this.callListener) this.callListener();
        this.notificationCount = 0;
        this.updateNotificationBadge();
    }
}

// Initialize notifications
let notificationManager;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        notificationManager = new NotificationManager();
    }
});
