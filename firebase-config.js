import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged,
    deleteUser
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    addDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { 
    getDatabase,
    ref as dbRef,
    set,
    onValue,
    push,
    remove,
    update
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyALbIJSI2C-p6IyMtj_F0ZqGyN1i79jOd4",
    authDomain: "whisper-chat-live.firebaseapp.com",
    databaseURL: "https://whisper-chat-live-default-rtdb.firebaseio.com",
    projectId: "whisper-chat-live",
    storageBucket: "whisper-chat-live.firebasestorage.app",
    messagingSenderId: "302894848452",
    appId: "1:302894848452:web:61a7ab21a269533c426c91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const realtimeDb = getDatabase(app);

// Initialize Stripe
const stripe = Stripe('pk_test_51SPYHwRvETRK3Zx7mnVDTNyPB3mxT8vbSIcSVQURp8irweK0lGznwFrW9sjgju2GFgmDiQ5GkWYVlUQZZVNrXkJb00q2QOCC3I');

// Agora Configuration
const agoraConfig = {
    appId: '966c8e41da614722a88d4372c3d95dba',
    token: null
};

export { 
    auth, db, storage, realtimeDb, stripe, agoraConfig,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser,
    collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where, onSnapshot, serverTimestamp, addDoc,
    ref, uploadBytes, getDownloadURL, deleteObject,
    dbRef, set, onValue, push, remove, update
};
