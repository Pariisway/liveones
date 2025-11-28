class PlatformManager {
    constructor() {
        this.initialized = false;
        this.firebaseConfig = null;
        this.db = null;
        this.useLocalStorage = false;
        this.init();
    }

    async init() {
        try {
            // Check for Firebase config
            if (typeof firebaseConfig !== 'undefined') {
                console.log('✅ Firebase config loaded from global variable');
                this.firebaseConfig = firebaseConfig;
                
                // Initialize Firebase if not already initialized
                if (!firebase.apps.length) {
                    firebase.initializeApp(this.firebaseConfig);
                }
                
                this.db = firebase.firestore();
                this.initialized = true;
                console.log('🔥 Firebase Platform Manager initialized');
            } else {
                throw new Error('Firebase config not found');
            }
        } catch (error) {
            console.warn('❌ Firebase initialization failed:', error.message);
            console.log('📱 Using localStorage-only mode');
            this.useLocalStorage = true;
            this.initialized = true;
        }
    }

    // Add a new dater to the platform
    async addDater(daterData) {
        if (!this.initialized) {
            throw new Error('Platform manager not initialized');
        }

        try {
            if (!this.useLocalStorage && this.db) {
                // Add to Firebase
                const docRef = await this.db.collection('daters').add({
                    ...daterData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'active'
                });
                console.log('✅ Dater added to Firebase with ID:', docRef.id);
                return docRef.id;
            } else {
                // Fallback to localStorage
                const daters = this.getLocalStorageDaters();
                const daterId = 'local_' + Date.now();
                const newDater = {
                    id: daterId,
                    ...daterData,
                    createdAt: new Date().toISOString(),
                    status: 'active'
                };
                daters.push(newDater);
                localStorage.setItem('daters', JSON.stringify(daters));
                console.log('✅ Dater added to localStorage with ID:', daterId);
                console.log('📝 Dater data:', newDater);
                return daterId;
            }
        } catch (error) {
            console.error('❌ Error adding dater:', error);
            throw error;
        }
    }

    // Get all daters from the platform
    async getAllDaters() {
        if (!this.initialized) {
            throw new Error('Platform manager not initialized');
        }

        try {
            if (!this.useLocalStorage && this.db) {
                // Get from Firebase
                const snapshot = await this.db.collection('daters')
                    .where('status', '==', 'active')
                    .get();
                
                const daters = [];
                snapshot.forEach(doc => {
                    daters.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                console.log(`📊 Retrieved ${daters.length} daters from Firebase`);
                return daters;
            } else {
                // Fallback to localStorage
                const daters = this.getLocalStorageDaters();
                const activeDaters = daters.filter(dater => dater.status === 'active');
                console.log(`📊 Retrieved ${activeDaters.length} daters from localStorage`);
                console.log('📝 All localStorage daters:', daters);
                return activeDaters;
            }
        } catch (error) {
            console.error('❌ Error getting daters from Firebase:', error);
            console.log('🔄 Falling back to localStorage');
            // Fallback to localStorage
            const daters = this.getLocalStorageDaters();
            return daters.filter(dater => dater.status === 'active');
        }
    }

    // Get a specific dater by ID
    async getDater(daterId) {
        if (!this.initialized) {
            throw new Error('Platform manager not initialized');
        }

        try {
            if (!this.useLocalStorage && this.db) {
                const doc = await this.db.collection('daters').doc(daterId).get();
                if (doc.exists) {
                    return { id: doc.id, ...doc.data() };
                }
                return null;
            } else {
                const daters = this.getLocalStorageDaters();
                return daters.find(dater => dater.id === daterId) || null;
            }
        } catch (error) {
            console.error('❌ Error getting dater:', error);
            return null;
        }
    }

    // Update a dater's information
    async updateDater(daterId, updates) {
        if (!this.initialized) {
            throw new Error('Platform manager not initialized');
        }

        try {
            if (!this.useLocalStorage && this.db) {
                await this.db.collection('daters').doc(daterId).update({
                    ...updates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Dater updated in Firebase:', daterId);
            } else {
                const daters = this.getLocalStorageDaters();
                const index = daters.findIndex(dater => dater.id === daterId);
                if (index !== -1) {
                    daters[index] = { ...daters[index], ...updates, updatedAt: new Date().toISOString() };
                    localStorage.setItem('daters', JSON.stringify(daters));
                    console.log('✅ Dater updated in localStorage:', daterId);
                }
            }
        } catch (error) {
            console.error('❌ Error updating dater:', error);
            throw error;
        }
    }

    // Helper method for localStorage
    getLocalStorageDaters() {
        try {
            const stored = localStorage.getItem('daters');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('❌ Error reading localStorage:', error);
            return [];
        }
    }

    // Clear all daters (for testing)
    clearAllDaters() {
        if (!this.useLocalStorage) {
            console.warn('⚠️ clearAllDaters only works in localStorage mode');
            return;
        }
        localStorage.removeItem('daters');
        console.log('✅ All daters cleared from localStorage');
    }

    // Debug method to check platform status
    debug() {
        return {
            initialized: this.initialized,
            useLocalStorage: this.useLocalStorage,
            firebaseConfig: this.firebaseConfig ? '✅ Loaded' : '❌ Missing',
            db: this.db ? '✅ Connected' : '❌ Disconnected',
            methods: {
                addDater: typeof this.addDater,
                getAllDaters: typeof this.getAllDaters,
                getDater: typeof this.getDater,
                updateDater: typeof this.updateDater
            },
            localStorageDaters: this.getLocalStorageDaters().length
        };
    }
}

// Create global instance
window.platformManager = new PlatformManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformManager;
}
