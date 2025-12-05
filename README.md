# House of Whispers

A dynamic web application for private 5-minute voice chats between members (Whispers) and customers.

## Features

- **For Customers**: Browse available whispers, purchase 5-minute voice chats for $15
- **For Whispers**: Create profile, set availability, earn $12 per call, manage payments
- **Real-time**: Live status updates, call notifications, voice chat
- **Secure Payments**: Stripe integration for secure transactions
- **Admin Dashboard**: Manage users, calls, and payments

## Setup Instructions

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Enable Realtime Database
6. Enable Storage
7. Update the configuration in `firebase-config.js` with your project's details

### 2. Stripe Setup
1. Sign up at [Stripe](https://stripe.com)
2. Get your publishable and secret keys
3. Update Stripe key in `firebase-config.js`

### 3. Agora Setup
1. Sign up at [Agora](https://agora.io)
2. Create a new project
3. Get your App ID
4. Update Agora config in `firebase-config.js`

### 4. Deployment

#### Option A: Deploy to GitHub
```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/liveones.git

# Push to GitHub
git branch -M main
git push -u origin main
