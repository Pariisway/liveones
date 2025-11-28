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

    // ... rest of your methods stay the same ...

    // FIXED: Make getAllDaters async properly
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

    // ... rest of your existing methods ...
}

window.platformManager = new PlatformManager();
