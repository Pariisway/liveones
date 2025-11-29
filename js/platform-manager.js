/**
 * PLATFORM MANAGER - FIXED VERSION
 * Unified platform manager with Firebase and localStorage support
 */

class PlatformManager {
    constructor() {
        console.log('🔧 PlatformManager constructor called');
        this.initialized = false;
        this.firebaseConfig = null;
        this.db = null;
        this.useFirebase = false;
        
        // Bind methods to maintain proper 'this' context
        this.getAllDaters = this.getAllDaters.bind(this);
        this.addDater = this.addDater.bind(this);
        this.updateDater = this.updateDater.bind(this);
        this.syncWithFirebase = this.syncWithFirebase.bind(this);
        this.syncToFirebase = this.syncToFirebase.bind(this);
        this.getData = this.getData.bind(this);
        this.setData = this.setData.bind(this);
        this.deleteDaterProfile = this.deleteDaterProfile.bind(this);
        
        console.log('🔥 Firebase Platform Manager initialized');
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🔄 Initializing PlatformManager...');
            
            // Try to load Firebase config from global variable
            if (typeof firebaseConfig !== 'undefined') {
                this.firebaseConfig = firebaseConfig;
                console.log('✅ Firebase config loaded from global variable');
                
                // Initialize Firebase
                if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                    firebase.initializeApp(this.firebaseConfig);
                }
                this.db = firebase.firestore();
                this.useFirebase = true;
                console.log('✅ Firebase Firestore initialized');
            } else {
                console.log('📱 Using localStorage-only mode');
                this.useFirebase = false;
            }
            
            // Initialize data structure
            this.initializeData();
            this.initialized = true;
            console.log('✅ Platform Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            console.log('📱 Falling back to localStorage-only mode');
            this.useFirebase = false;
            this.initializeData();
            this.initialized = true;
        }
    }

    initializeData() {
        if (!localStorage.getItem('platformData')) {
            const initialData = {
                daters: [],
                sessions: [],
                payments: [],
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('platformData', JSON.stringify(initialData));
            console.log('📁 Initialized platform data structure');
        }
    }

    getData() {
        try {
            const data = localStorage.getItem('platformData');
            return data ? JSON.parse(data) : { daters: [], sessions: [], payments: [] };
        } catch (error) {
            console.error('Error reading platform data:', error);
            return { daters: [], sessions: [], payments: [] };
        }
    }

    setData(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            localStorage.setItem('platformData', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving platform data:', error);
            return false;
        }
    }

    // syncWithFirebase method
    async syncWithFirebase() {
        if (!this.useFirebase || !this.db) {
            console.log('📱 Firebase not available, skipping sync');
            return;
        }

        try {
            console.log('🔄 Syncing with Firebase...');
            
            // Get local data
            const localData = this.getData();
            
            // Try to get data from Firebase
            const snapshot = await this.db.collection('platformData').doc('main').get();
            
            if (snapshot.exists) {
                const firebaseData = snapshot.data();
                console.log('📥 Firebase data found:', firebaseData);
                
                // Merge strategies - you might want more sophisticated merging
                const mergedData = this.mergeData(localData, firebaseData);
                this.setData(mergedData);
                
                // Update Firebase with merged data
                await this.db.collection('platformData').doc('main').set(mergedData);
                console.log('✅ Data synced with Firebase');
            } else {
                // No Firebase data exists, push local data to Firebase
                await this.db.collection('platformData').doc('main').set(localData);
                console.log('✅ Local data pushed to Firebase');
            }
        } catch (error) {
            console.error('❌ Firebase sync failed:', error);
        }
    }

    // syncToFirebase method
    async syncToFirebase() {
        if (!this.useFirebase || !this.db) {
            return;
        }

        try {
            const localData = this.getData();
            await this.db.collection('platformData').doc('main').set(localData);
            console.log('✅ Data synced to Firebase');
        } catch (error) {
            console.error('❌ Failed to sync to Firebase:', error);
        }
    }

    mergeData(localData, firebaseData) {
        // Simple merge - in production you'd want more sophisticated conflict resolution
        return {
            daters: [...(firebaseData.daters || []), ...(localData.daters || [])].filter((dater, index, array) =>
                index === array.findIndex(d => d.id === dater.id)
            ),
            sessions: [...(firebaseData.sessions || []), ...(localData.sessions || [])],
            payments: [...(firebaseData.payments || []), ...(localData.payments || [])],
            lastUpdated: new Date().toISOString()
        };
    }

    async getAllDaters() {
        if (!this.initialized) {
            console.warn('Platform manager not initialized');
            return [];
        }

        try {
            // Sync with Firebase first if available
            await this.syncWithFirebase();
        } catch (error) {
            console.error('Failed to sync from Firebase:', error);
        }

        const data = this.getData();
        const daters = data.daters || [];
        console.log('📊 Retrieved daters:', daters.length);
        return daters.filter(dater => dater.isActive !== false);
    }

    // addDater method
    async addDater(daterData) {
        console.log('🎯 addDater method called with:', daterData);
        
        if (!this.initialized) {
            throw new Error('Platform manager not initialized');
        }

        try {
            const data = this.getData();
            
            // Create new dater object
            const newDater = {
                id: this.generateId(),
                username: daterData.username,
                displayName: daterData.displayName,
                email: daterData.email,
                location: daterData.location,
                avatar: daterData.avatar,
                bio: daterData.bio || '',
                interests: daterData.interests || [],
                schedule: daterData.schedule || [],
                timezone: daterData.timezone || 'UTC',
                verification: 'pending',
                isActive: true,
                earnings: 0,
                totalChats: 0,
                rating: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('📝 Creating new dater:', newDater);

            // Add to daters array
            data.daters.push(newDater);
            
            // Save data
            if (this.setData(data)) {
                // Sync to Firebase if available
                await this.syncToFirebase();
                console.log('✅ Dater added successfully:', newDater);
                return newDater;
            } else {
                throw new Error('Failed to save dater data');
            }
        } catch (error) {
            console.error('❌ Error adding dater:', error);
            throw error;
        }
    }

    // updateDater method
    async updateDater(daterId, updates) {
        if (!this.initialized) {
            throw new Error('Platform manager not initialized');
        }

        try {
            const data = this.getData();
            const daterIndex = data.daters.findIndex(d => d.id === daterId);
            
            if (daterIndex === -1) {
                throw new Error('Dater not found');
            }

            // Update dater
            data.daters[daterIndex] = {
                ...data.daters[daterIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Save data
            if (this.setData(data)) {
                await this.syncToFirebase();
                console.log('✅ Dater updated successfully:', data.daters[daterIndex]);
                return data.daters[daterIndex];
            } else {
                throw new Error('Failed to update dater data');
            }
        } catch (error) {
            console.error('❌ Error updating dater:', error);
            throw error;
        }
    }

    generateId() {
        return 'dater_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // getDater method
    async getDater(daterId) {
        const daters = await this.getAllDaters();
        return daters.find(d => d.id === daterId);
    }

    // deleteDater method
    async deleteDater(daterId) {
        if (!this.initialized) {
            throw new Error('Platform manager not initialized');
        }

        try {
            const data = this.getData();
            data.daters = data.daters.filter(d => d.id !== daterId);
            
            if (this.setData(data)) {
                await this.syncToFirebase();
                console.log('✅ Dater deleted successfully');
                return true;
            } else {
                throw new Error('Failed to delete dater');
            }
        } catch (error) {
            console.error('❌ Error deleting dater:', error);
            throw error;
        }
    }

    // deleteDaterProfile method for user self-deletion
    async deleteDaterProfile(daterId, confirmation = true) {
        if (!this.initialized) {
            throw new Error('Platform manager not initialized');
        }

        if (confirmation) {
            const userConfirmed = confirm('Are you sure you want to delete your profile? This action cannot be undone.');
            if (!userConfirmed) {
                console.log('❌ Profile deletion cancelled by user');
                return false;
            }
        }

        try {
            const data = this.getData();
            const daterIndex = data.daters.findIndex(d => d.id === daterId);
            
            if (daterIndex === -1) {
                throw new Error('Dater profile not found');
            }

            const daterName = data.daters[daterIndex].displayName;
            
            // Remove dater from array
            data.daters.splice(daterIndex, 1);
            
            // Save updated data
            if (this.setData(data)) {
                await this.syncToFirebase();
                console.log('✅ Dater profile deleted successfully:', daterName);
                
                if (confirmation) {
                    alert(`Your profile "${daterName}" has been deleted successfully.`);
                    // Redirect to home page
                    window.location.href = '/';
                }
                
                return true;
            } else {
                throw new Error('Failed to delete dater profile');
            }
        } catch (error) {
            console.error('❌ Error deleting dater profile:', error);
            if (confirmation) {
                alert('Error deleting profile: ' + error.message);
            }
            throw error;
        }
    }
}

// Initialize platform manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Platform Manager...');
    window.platformManager = new PlatformManager();
});

// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformManager;
}
