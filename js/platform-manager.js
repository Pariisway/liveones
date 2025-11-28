// platform-manager.js - ULTIMATE FIXED VERSION
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
                // Check multiple possible config locations
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
                
                // For live site - try to load from file
                if (typeof jQuery !== 'undefined') {
                    // If jQuery is available, use it to load the config
                    jQuery.getScript('/js/firebase-config.js')
                        .done(() => {
                            if (typeof firebaseConfig !== 'undefined') {
                                this.firebaseConfig = firebaseConfig;
                                console.log('✅ Firebase config loaded via jQuery');
                            }
                            resolve();
                        })
                        .fail(() => {
                            console.log('❌ Could not load Firebase config file');
                            resolve();
                        });
                } else {
                    // Fallback for vanilla JS
                    const script = document.createElement('script');
                    script.src = '/js/firebase-config.js';
                    script.onload = () => {
                        if (typeof firebaseConfig !== 'undefined') {
                            this.firebaseConfig = firebaseConfig;
                            console.log('✅ Firebase config loaded from file');
                        }
                        resolve();
                    };
                    script.onerror = () => {
                        console.log('❌ Firebase config file not found');
                        resolve();
                    };
                    document.head.appendChild(script);
                }
            });
        }

        initLocalStorage() {
            if (!localStorage.getItem('whispers_platform_data')) {
                const initialData = {
                    daters: [],
                    payments: [],
                    payouts: [],
                    statistics: { totalRevenue: 0, totalChats: 0, activeDaters: 0 }
                };
                localStorage.setItem('whispers_platform_data', JSON.stringify(initialData));
            }
            this.initialized = true;
            console.log('📱 LocalStorage Platform Manager initialized');
        }

        // ... keep all your existing methods (getData, getAllDaters, etc.) the same ...
        // Make sure they're exactly the same as the previous fixed version

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

        // ... include all your other methods ...
    }

    // Initialize only once
    if (!window.platformManager) {
        window.platformManager = new PlatformManager();
        window.PlatformManager = PlatformManager; // For debugging
    }
})();
