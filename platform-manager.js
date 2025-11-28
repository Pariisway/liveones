// platform-manager.js - COMPLETE WORKING VERSION
(function() {
    // Global protection - only run once
    if (window.PlatformManager) {
        console.log('🔄 PlatformManager already exists, using existing instance');
        return;
    }

    class PlatformManager {
        constructor() {
            if (window._platformManagerInstance) {
                return window._platformManagerInstance;
            }
            window._platformManagerInstance = this;
            
            this.initialized = false;
            this.firebaseConfig = null;
            this.db = null;
            this.init();
        }

        async init() {
            try {
                await this.loadFirebaseConfig();
                
                if (this.firebaseConfig) {
                    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                        firebase.initializeApp(this.firebaseConfig);
                    }
                    this.db = firebase.firestore();
                    this.initialized = true;
                    console.log('🔥 Firebase Platform Manager initialized');
                    await this.syncWithFirebase();
                } else {
                    throw new Error('No Firebase config available');
                }
            } catch (error) {
                console.log('📱 Using localStorage-only mode');
                this.initLocalStorage();
            }
        }

        async loadFirebaseConfig() {
            return new Promise((resolve) => {
                if (typeof firebaseConfig !== 'undefined') {
                    this.firebaseConfig = firebaseConfig;
                    console.log('✅ Firebase config loaded from global variable');
                    resolve();
                    return;
                }
                
                if (window.firebaseConfig) {
                    this.firebaseConfig = window.firebaseConfig;
                    console.log('✅ Firebase config loaded from window object');
                    resolve();
                    return;
                }
                
                console.log('📱 Using localStorage-only mode');
                resolve();
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

        // ✅ MUST HAVE THIS METHOD - Data management
        getData() {
            try {
                const stored = localStorage.getItem('whispers_platform_data');
                if (!stored) {
                    const initialData = {
                        daters: [],
                        payments: [],
                        payouts: [],
                        statistics: { totalRevenue: 0, totalChats: 0, activeDaters: 0 }
                    };
                    localStorage.setItem('whispers_platform_data', JSON.stringify(initialData));
                    return initialData;
                }
                
                const data = JSON.parse(stored);
                if (!data.daters) data.daters = [];
                if (!data.payments) data.payments = [];
                if (!data.payouts) data.payouts = [];
                if (!data.statistics) data.statistics = { totalRevenue: 0, totalChats: 0, activeDaters: 0 };
                
                return data;
            } catch (error) {
                console.error('Error reading platform data:', error);
                return { daters: [], payments: [], payouts: [], statistics: { totalRevenue: 0, totalChats: 0, activeDaters: 0 } };
            }
        }

        saveData(data) {
            localStorage.setItem('whispers_platform_data', JSON.stringify(data));
        }

        generateId() {
            return 'dater_' + Math.random().toString(36).substr(2, 9);
        }

        // ✅ MUST HAVE THIS METHOD - Add Dater
        async addDater(daterData) {
            console.log('🔄 addDater called with:', daterData);
            
            if (!this.initialized) {
                throw new Error('Platform manager not initialized');
            }
            
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

            console.log('✅ Creating dater:', dater);
            
            data.daters.push(dater);
            data.statistics.activeDaters = data.daters.filter(d => d.isActive).length;
            
            this.saveData(data);
            
            // Sync to Firebase if available
            if (this.db) {
                await this.syncToFirebase();
            }
            
            console.log('✅ Dater added successfully, ID:', dater.id);
            return dater.id;
        }

        // ✅ MUST HAVE THIS METHOD - Get all daters
        async getAllDaters() {
            if (!this.initialized) return [];
            
            try {
                if (this.db) {
                    await this.syncWithFirebase();
                }
            } catch (error) {
                console.error('Failed to sync from Firebase:', error);
            }
            
            const data = this.getData();
            const daters = data.daters || [];
            return daters.filter(dater => dater.isActive !== false);
        }

        async syncWithFirebase() {
            try {
                if (!this.db) return;
                
                const snapshot = await this.db.collection('platformData').doc('whispers_data').get();
                
                if (snapshot.exists) {
                    const firebaseData = snapshot.data();
                    localStorage.setItem('whispers_platform_data', JSON.stringify(firebaseData));
                    console.log('✅ Synced from Firebase');
                } else {
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

        // Other methods...
        async updateDater(id, updates) {
            const data = this.getData();
            const daterIndex = data.daters.findIndex(d => d.id === id);
            
            if (daterIndex === -1) throw new Error('Dater not found');
            
            data.daters[daterIndex] = { ...data.daters[daterIndex], ...updates };
            this.saveData(data);
            
            if (this.db) {
                await this.syncToFirebase();
            }
            
            return data.daters[daterIndex];
        }

        async processPayment(paymentData) {
            const data = this.getData();
            
            const payment = {
                id: 'pay_' + Math.random().toString(36).substr(2, 9),
                ...paymentData,
                processedAt: new Date().toISOString(),
                status: 'completed'
            };

            const platformCut = (paymentData.amount * 25) / 100;
            const daterEarnings = paymentData.amount - platformCut;

            const daterIndex = data.daters.findIndex(d => d.id === paymentData.daterId);
            if (daterIndex !== -1) {
                data.daters[daterIndex].earnings += daterEarnings;
                data.daters[daterIndex].totalChats += 1;
            }

            data.statistics.totalRevenue += paymentData.amount;
            data.statistics.totalChats += 1;
            data.payments.push(payment);
            
            this.saveData(data);
            
            if (this.db) {
                await this.syncToFirebase();
            }
            
            return {
                paymentId: payment.id,
                platformCut: platformCut,
                daterEarnings: daterEarnings
            };
        }
    }

    // Initialize only once
    if (!window.platformManager) {
        window.platformManager = new PlatformManager();
        window.PlatformManager = PlatformManager;
        console.log('✅ PlatformManager initialized with addDater method');
    }
})();
