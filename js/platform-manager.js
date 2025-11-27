/*************************************************************************
 * PLATFORM MANAGEMENT SYSTEM
 * Handles dater accounts, payments, and revenue sharing
 *************************************************************************/

class PlatformManager {
    constructor() {
        this.platformData = this.loadPlatformData();
        this.initializePlatform();
    }

    loadPlatformData() {
        const savedData = localStorage.getItem('whispers_platform_data');
        if (savedData) {
            return JSON.parse(savedData);
        }

        // Initialize platform data structure
        return {
            users: {
                'admin': {
                    type: 'admin',
                    username: 'admin',
                    platformEarnings: 0,
                    totalChats: 0,
                    joinDate: new Date().toISOString()
                }
            },
            payments: [],
            platformSettings: {
                chatPrice: 15.00,
                platformCutPercent: 25,
                daterCutPercent: 75,
                payoutSchedule: 'weekly'
            },
            statistics: {
                totalRevenue: 0,
                totalChats: 0,
                activeDaters: 0,
                platformEarnings: 0
            }
        };
    }

    savePlatformData() {
        localStorage.setItem('whispers_platform_data', JSON.stringify(this.platformData));
    }

    initializePlatform() {
        this.updateStatistics();
    }

    // Dater Management
    addDater(daterData) {
        if (this.platformData.users[daterData.username]) {
            throw new Error('Username already exists');
        }

        this.platformData.users[daterData.username] = {
            ...daterData,
            earnings: 0,
            totalChats: 0,
            rating: 0,
            isActive: true,
            joinDate: new Date().toISOString()
        };

        this.updateStatistics();
        this.savePlatformData();
        return daterData.username;
    }

    getDater(username) {
        return this.platformData.users[username];
    }

    getAllDaters() {
        return Object.values(this.platformData.users).filter(user => user.type === 'dater');
    }

    getActiveDaters() {
        return this.getAllDaters().filter(dater => dater.isActive);
    }

    // Payment Processing
    processPayment(paymentData) {
        const { daterId, userId, amount } = paymentData;
        const dater = this.getDater(daterId);
        
        if (!dater) {
            throw new Error('Dater not found');
        }

        const platformCut = (amount * this.platformData.platformSettings.platformCutPercent) / 100;
        const daterEarnings = amount - platformCut;

        // Create payment record
        const payment = {
            id: 'pay_' + Date.now(),
            daterId,
            userId,
            amount,
            platformCut,
            daterEarnings,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };

        // Update balances
        dater.earnings += daterEarnings;
        dater.totalChats += 1;
        
        this.platformData.users.admin.platformEarnings += platformCut;
        this.platformData.users.admin.totalChats += 1;

        // Add to payments history
        this.platformData.payments.push(payment);

        // Update statistics
        this.updateStatistics();
        this.savePlatformData();

        return payment;
    }

    // Revenue Distribution
    getDaterEarnings(daterId) {
        const dater = this.getDater(daterId);
        if (!dater) return 0;
        
        return {
            totalEarnings: dater.earnings,
            totalChats: dater.totalChats,
            averageEarnings: dater.totalChats > 0 ? dater.earnings / dater.totalChats : 0
        };
    }

    getPlatformEarnings() {
        return {
            totalPlatformEarnings: this.platformData.users.admin.platformEarnings,
            totalChats: this.platformData.users.admin.totalChats,
            averagePerChat: this.platformData.users.admin.totalChats > 0 ? 
                this.platformData.users.admin.platformEarnings / this.platformData.users.admin.totalChats : 0
        };
    }

    // Statistics
    updateStatistics() {
        const daters = this.getAllDaters();
        
        this.platformData.statistics = {
            totalRevenue: this.platformData.payments.reduce((sum, payment) => sum + payment.amount, 0),
            totalChats: this.platformData.payments.length,
            activeDaters: daters.filter(dater => dater.isActive).length,
            platformEarnings: this.platformData.users.admin.platformEarnings,
            totalDaters: daters.length
        };
    }

    getStatistics() {
        return this.platformData.statistics;
    }

    // Payout Management (simplified - in real app, integrate with Stripe Connect)
    initiatePayout(daterId, amount) {
        const dater = this.getDater(daterId);
        if (!dater || dater.earnings < amount) {
            throw new Error('Insufficient earnings');
        }

        // Simulate payout
        dater.earnings -= amount;
        
        const payout = {
            id: 'payout_' + Date.now(),
            daterId,
            amount,
            timestamp: new Date().toISOString(),
            status: 'processed'
        };

        this.savePlatformData();
        return payout;
    }

    // Admin Functions
    updatePlatformSettings(settings) {
        this.platformData.platformSettings = { ...this.platformData.platformSettings, ...settings };
        this.savePlatformData();
    }

    getPlatformSettings() {
        return this.platformData.platformSettings;
    }
}

// Global platform manager instance
let platformManager;

// Initialize platform manager when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    platformManager = new PlatformManager();
    console.log('Platform Manager initialized');
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformManager;
}
