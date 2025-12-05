// Firebase Configuration with Error Handling
try {
    const firebaseConfig = {
        apiKey: "AIzaSyCW-4HQn-VPExAezXZvwC0vdfQDPJZeqII",
        authDomain: "liveones-5b3d6.firebaseapp.com",
        projectId: "liveones-5b3d6",
        storageBucket: "liveones-5b3d6.appspot.com",
        messagingSenderId: "100207137753",
        appId: "1:100207137753:web:7ba177c3b1941c1a41c752",
        measurementId: "G-VPQQPENHXZ"
    };

    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
    alert("Firebase configuration error. Please check console.");
}
