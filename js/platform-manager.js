class PlatformManager {
    constructor() {
        this.initialized = false;
        this.firebaseConfig = {
            // Replace with your Firebase config
            apiKey: "your-api-key",
            authDomain: "your-project.firebaseapp.com",
            projectId: "your-project-id",
            storageBucket: "your-project.appspot.com",
            messagingSenderId: "123456789",
            appId: "your-app-id"
        };
        
        this.init();
    }

    async init() {
        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            this.db = firebase.firestore();
            this.initialized = true;
            console.log('🔥 Firebase Platform Manager initialized');
            
            // Sync localStorage with Firebase (for backward compatibility)
            await this.syncWithFirebase();
            
        } catch (error) {
            console.error('Firebase initialization failed, falling back to localStorage:', error);
            this.initLocalStorage();
        }
    }

    initLocalStorage() {
        // Fallback to localStorage if Firebase fails
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

    // Updated addDater method with Firebase sync
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

    // Updated getAllDaters method
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

    // Update other methods to include Firebase sync...
    async updateDater(id, updates) {
        const data = this.getData();
        const daterIndex = data.daters.findIndex(d => d.id === id);
        
        if (daterIndex === -1) throw new Error('Dater not found');
        
        data.daters[daterIndex] = { ...data.daters[daterIndex], ...updates };
        this.saveData(data);
        await this.syncToFirebase();
    }

    async processPayment(paymentData) {
        const data = this.getData();
        // ... existing payment logic
        this.saveData(data);
        await this.syncToFirebase();
    }

    // Helper methods (keep existing)
    getData() {
        const stored = localStorage.getItem('whispers_platform_data');
        return stored ? JSON.parse(stored) : { daters: [], payments: [], payouts: [], statistics: { totalRevenue: 0, totalChats: 0, activeDaters: 0 } };
    }

    saveData(data) {
        localStorage.setItem('whispers_platform_data', JSON.stringify(data));
    }

    generateId() {
        return 'dater_' + Math.random().toString(36).substr(2, 9);
    }
}

window.platformManager = new PlatformManager();
