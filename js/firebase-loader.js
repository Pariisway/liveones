/**
 * Firebase Loader - Handles Firebase SDK loading gracefully
 */

class FirebaseLoader {
    constructor() {
        this.loaded = false;
        this.loading = false;
        this.callbacks = [];
    }

    async loadFirebase() {
        if (this.loaded) return Promise.resolve();
        if (this.loading) return new Promise(resolve => this.callbacks.push(resolve));

        this.loading = true;
        console.log('🔄 Loading Firebase SDK...');

        return new Promise((resolve, reject) => {
            // Check if Firebase is already available (loaded by another script)
            if (typeof firebase !== 'undefined') {
                console.log('✅ Firebase already loaded');
                this.loaded = true;
                this.loading = false;
                this.executeCallbacks();
                resolve();
                return;
            }

            // Load Firebase SDK
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js';
            script.onload = () => {
                console.log('✅ Firebase App SDK loaded');
                // Load Firestore
                const firestoreScript = document.createElement('script');
                firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js';
                firestoreScript.onload = () => {
                    console.log('✅ Firebase Firestore SDK loaded');
                    this.loaded = true;
                    this.loading = false;
                    this.executeCallbacks();
                    resolve();
                };
                firestoreScript.onerror = () => {
                    console.warn('⚠️ Firebase Firestore failed to load, continuing without it');
                    this.loaded = true;
                    this.loading = false;
                    this.executeCallbacks();
                    resolve(); // Resolve anyway for graceful degradation
                };
                document.head.appendChild(firestoreScript);
            };
            script.onerror = () => {
                console.warn('⚠️ Firebase App failed to load, continuing without Firebase');
                this.loaded = true;
                this.loading = false;
                this.executeCallbacks();
                resolve(); // Resolve anyway for graceful degradation
            };
            document.head.appendChild(script);
        });
    }

    executeCallbacks() {
        this.callbacks.forEach(callback => callback());
        this.callbacks = [];
    }

    isFirebaseAvailable() {
        return typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined';
    }
}

// Create global instance
window.firebaseLoader = new FirebaseLoader();

// Auto-load Firebase on pages that might need it
if (document.querySelector('[data-load-firebase]')) {
    window.firebaseLoader.loadFirebase();
}
