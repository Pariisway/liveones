// Earnings Tracker for Whispers
class EarningsTracker {
    constructor() {
        this.earnings = 0;
        this.pendingEarnings = 0;
        this.completedCalls = 0;
    }

    // Initialize earnings tracking
    async initialize(whisperId) {
        try {
            this.whisperId = whisperId;
            await this.loadEarnings();
            this.setupEarningsListener();
            this.updateEarningsDisplay();
        } catch (error) {
            console.error('Error initializing earnings tracker:', error);
        }
    }

    // Load earnings from Firestore
    async loadEarnings() {
        try {
            const earningsRef = firebase.firestore().collection('earnings').doc(this.whisperId);
            const doc = await earningsRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                this.earnings = data.earnings || 0;
                this.pendingEarnings = data.pendingEarnings || 0;
                this.completedCalls = data.completedCalls || 0;
            }
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    }

    // Setup real-time earnings listener
    setupEarningsListener() {
        firebase.firestore().collection('earnings').doc(this.whisperId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    this.earnings = data.earnings || 0;
                    this.pendingEarnings = data.pendingEarnings || 0;
                    this.completedCalls = data.completedCalls || 0;
                    this.updateEarningsDisplay();
                }
            });
    }

    // Update earnings display
    updateEarningsDisplay() {
        const earningsElement = document.getElementById('total-earnings');
        const pendingElement = document.getElementById('pending-earnings');
        const callsElement = document.getElementById('completed-calls');
        
        if (earningsElement) {
            earningsElement.textContent = `$${this.earnings.toFixed(2)}`;
        }
        
        if (pendingElement) {
            pendingElement.textContent = `$${this.pendingEarnings.toFixed(2)}`;
        }
        
        if (callsElement) {
            callsElement.textContent = this.completedCalls;
        }
    }

    // Add new earnings (called when call completes)
    async addEarnings(amount, callId) {
        try {
            const earningsRef = firebase.firestore().collection('earnings').doc(this.whisperId);
            
            // Add to pending earnings (held for 3 days)
            await earningsRef.set({
                pendingEarnings: firebase.firestore.FieldValue.increment(amount),
                lastUpdated: new Date().toISOString(),
                whisperId: this.whisperId
            }, { merge: true });
            
            console.log(`✅ Added $${amount} to pending earnings for whisper ${this.whisperId}`);
            
            // Schedule transfer from pending to available after 3 days
            this.scheduleEarningsTransfer(amount, callId);
        } catch (error) {
            console.error('Error adding earnings:', error);
        }
    }

    // Schedule earnings transfer after 3 days
    scheduleEarningsTransfer(amount, callId) {
        const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
        
        setTimeout(async () => {
            try {
                const earningsRef = firebase.firestore().collection('earnings').doc(this.whisperId);
                
                await earningsRef.update({
                    pendingEarnings: firebase.firestore.FieldValue.increment(-amount),
                    earnings: firebase.firestore.FieldValue.increment(amount),
                    completedCalls: firebase.firestore.FieldValue.increment(1),
                    lastTransfer: new Date().toISOString()
                });
                
                console.log(`💰 Transferred $${amount} from pending to available earnings`);
            } catch (error) {
                console.error('Error transferring earnings:', error);
            }
        }, threeDays);
    }
}

// Global earnings tracker
let earningsTracker;

// Initialize when page loads (on whisper portal)
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('whisper-portal.html')) {
        // In real implementation, you'd get the whisper ID from user authentication
        const whisperId = 'current-whisper-id'; // This should come from your auth system
        
        earningsTracker = new EarningsTracker();
        earningsTracker.initialize(whisperId);
    }
});
