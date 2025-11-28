// Add this protection at the top to prevent duplicate declarations
if (typeof PlatformManager === 'undefined') {

class PlatformManager {
    constructor() {
        this.initialized = false;
        this.firebaseConfig = null;
        this.db = null;
        
        this.init();
    }

    async init() {
        try {
            // Try to load Firebase config
            await this.loadFirebaseConfig();
            
            if (this.firebaseConfig) {
                // Initialize Firebase
                if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                    firebase.initializeApp(this.firebaseConfig);
                }
                this.db = firebase.firestore();
                this.initialized = true;
                console.log('🔥 Firebase Platform Manager initialized');
                
                // Sync localStorage with Firebase
                await this.syncWithFirebase();
            } else {
                throw new Error('No Firebase config available');
            }
        } catch (error) {
            console.error('Firebase initialization failed, falling back to localStorage:', error);
            this.initLocalStorage();
        }
    }

    async loadFirebaseConfig() {
        return new Promise((resolve) => {
            // Check if firebaseConfig is already available globally
            if (typeof firebaseConfig !== 'undefined') {
                this.firebaseConfig = firebaseConfig;
                console.log('✅ Firebase config loaded from global variable');
                resolve();
                return;
            }
            
            // Check window object
            if (window.firebaseConfig) {
                this.firebaseConfig = window.firebaseConfig;
                console.log('✅ Firebase config loaded from window object');
                resolve();
                return;
            }
            
            // Try to load from external file
            const script = document.createElement('script');
            script.src = './js/firebase-config.js';
            script.onload = () => {
                if (typeof firebaseConfig !== 'undefined') {
                    this.firebaseConfig = firebaseConfig;
                    console.log('✅ Firebase config loaded from external file');
                } else {
                    console.warn('Firebase config file not available, using localStorage only');
                }
                resolve();
            };
            script.onerror = () => {
                console.warn('Firebase config file not found, using localStorage only');
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    initLocalStorage() {
        if (!localStorage.getItem('whispers_platform_data')) {
            const initialData = {
                daters: [],
                payments: [],
                payouts: [],
                statistics: {
                    totalRevenue: 0,
                    totalChats: 0,
                    activeDaters: 0
                }
            };
            localStorage.setItem('whispers_platform_data', JSON.stringify(initialData));
        }
        this.initialized = true;
        console.log('📱 LocalStorage Platform Manager initialized');
    }

    async syncWithFirebase() {
        try {
            if (!this.db) return;
            
            // Get data from Firebase
            const snapshot = await this.db.collection('platformData').doc('whispers_data').get();
            
            if (snapshot.exists) {
                const firebaseData = snapshot.data();
                localStorage.setItem('whispers_platform_data', JSON.stringify(firebaseData));
                console.log('✅ Synced from Firebase');
            } else {
                // If no Firebase data, upload localStorage data
                const localData = localStorage.getItem('whispers_platform_data');
                if (localData) {
                    await this.db.collection('platformData').doc('whispers_data').set(JSON.parse(localData));
                    console.log('✅ Initialized Firebase with local data');
                }
            }
        } catch (error) {
            console.error('Firebase sync failed:', error);
        }
    }

    async syncToFirebase() {
        if (!this.db) return;
        
        try {
            const localData = localStorage.getItem('whispers_platform_data');
            if (localData) {
                await this.db.collection('platformData').doc('whispers_data').set(JSON.parse(localData));
                console.log('✅ Synced to Firebase');
            }
        } catch (error) {
            console.error('Firebase sync failed:', error);
        }
    }

    // Data management methods
    getData() {
        const stored = localStorage.getItem('whispers_platform_data');
        return stored ? JSON.parse(stored) : { 
            daters: [], 
            payments: [], 
            payouts: [], 
            statistics: { 
                totalRevenue: 0, 
                totalChats: 0, 
                activeDaters: 0 
            } 
        };
    }

    saveData(data) {
        localStorage.setItem('whispers_platform_data', JSON.stringify(data));
    }

    generateId() {
        return 'dater_' + Math.random().toString(36).substr(2, 9);
    }

    // Dater management methods
    async addDater(daterData) {
        if (!this.initialized) throw new Error('Platform manager not initialized');
        
        const data = this.getData();
        
        // Check if username already exists
        if (data.daters.find(d => d.username === daterData.username)) {
            throw new Error('Username already exists');
        }

        const dater = {
            id: this.generateId(),
            ...daterData,
            createdAt: new Date().toISOString(),
            earnings: 0,
            totalChats: 0,
            rating: 0,
            isActive: true
        };

        data.daters.push(dater);
        data.statistics.activeDaters = data.daters.filter(d => d.isActive).length;
        
        this.saveData(data);
        
        // Sync to Firebase
        await this.syncToFirebase();
        
        return dater.id;
    }

    async getAllDaters() {
        if (!this.initialized) return [];
        
        // Try to sync from Firebase first
        try {
            if (this.db) {
                await this.syncWithFirebase();
            }
        } catch (error) {
            console.error('Failed to sync from Firebase:', error);
        }
        
        const data = this.getData();
        return data.daters.filter(dater => dater.isActive !== false);
    }

    async updateDater(id, updates) {
        const data = this.getData();
        const daterIndex = data.daters.findIndex(d => d.id === id);
        
        if (daterIndex === -1) throw new Error('Dater not found');
        
        data.daters[daterIndex] = { ...data.daters[daterIndex], ...updates };
        this.saveData(data);
        await this.syncToFirebase();
        
        return data.daters[daterIndex];
    }

    // Payment processing methods
    async processPayment(paymentData) {
        const data = this.getData();
        
        const payment = {
            id: 'pay_' + Math.random().toString(36).substr(2, 9),
            ...paymentData,
            processedAt: new Date().toISOString(),
            status: 'completed'
        };

        // Calculate revenue split
        const platformCut = (paymentData.amount * 25) / 100;
        const daterEarnings = paymentData.amount - platformCut;

        // Update dater earnings
        const daterIndex = data.daters.findIndex(d => d.id === paymentData.daterId);
        if (daterIndex !== -1) {
            data.daters[daterIndex].earnings += daterEarnings;
            data.daters[daterIndex].totalChats += 1;
        }

        // Update platform statistics
        data.statistics.totalRevenue += paymentData.amount;
        data.statistics.totalChats += 1;

        // Add payment to history
        data.payments.push(payment);
        
        this.saveData(data);
        await this.syncToFirebase();
        
        return {
            paymentId: payment.id,
            platformCut: platformCut,
            daterEarnings: daterEarnings
        };
    }

    // Payout methods
    async processPayout(daterId, amount) {
        const data = this.getData();
        
        const payout = {
            id: 'payout_' + Math.random().toString(36).substr(2, 9),
            daterId: daterId,
            amount: amount,
            processedAt: new Date().toISOString(),
            status: 'processed'
        };

        data.payouts.push(payout);
        this.saveData(data);
        await this.syncToFirebase();
        
        return payout.id;
    }

    // Statistics methods
    getStatistics() {
        const data = this.getData();
        return data.statistics;
    }

    getDaterStatistics(daterId) {
        const data = this.getData();
        const dater = data.daters.find(d => d.id === daterId);
        if (!dater) throw new Error('Dater not found');
        
        return {
            earnings: dater.earnings,
            totalChats: dater.totalChats,
            rating: dater.rating
        };
    }
}

// Initialize the platform manager
window.platformManager = new PlatformManager();

} // End of duplicate declaration protection
