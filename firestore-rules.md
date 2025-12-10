# FIREBASE FIRESTORE RULES - Copy and paste these in Firebase Console

Go to: Firebase Console → Firestore Database → Rules tab

Paste these rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to whispers for everyone (for home page)
    match /users/{userId} {
      allow read: if true;  // Allow anyone to read user profiles
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write calls
    match /calls/{callId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write activeCalls
    match /activeCalls/{callId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to create transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
