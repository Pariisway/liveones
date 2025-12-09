#!/bin/bash
echo "🚀 FINAL DEPLOYMENT SCRIPT"
echo "=========================="

echo "Step 1: Removing backup directory..."
rm -rf backup-*

echo "Step 2: Cleaning .git directory..."
rm -rf .git

echo "Step 3: Initializing fresh git repository..."
git init

echo "Step 4: Creating .gitignore to exclude backups..."
cat > .gitignore << 'GITIGNORE'
# Backup directories
backup-*/

# Node modules
node_modules/

# Environment variables
.env
.env.local

# OS files
.DS_Store
Thumbs.db

# Logs
*.log

# IDE files
.vscode/
.idea/
*.swp
*.swo
GITIGNORE

echo "Step 5: Adding all files..."
git add --all

echo "Step 6: Committing changes..."
git commit -m "🚀 Complete WhisperChat Platform Launch - Live 1.0"

echo "Step 7: Setting up remote..."
git remote add origin https://github.com/pariisway/liveones.git

echo "Step 8: Renaming branch to main..."
git branch -M main

echo "Step 9: Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📱 Your site will be at: https://pariisway.github.io/liveones/"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Go to https://github.com/pariisway/liveones"
echo "2. Click Settings → Pages"
echo "3. Select 'main' branch"
echo "4. Click Save"
echo "5. Wait 1-2 minutes for deployment"
echo "6. Visit https://pariisway.github.io/liveones/"
echo ""
echo "⚙️ FIREBASE SETUP:"
echo "1. Go to https://console.firebase.google.com/"
echo "2. Select your project: whisper-chat-live"
echo "3. Enable Email/Password Authentication"
echo "4. Go to Firestore Database → Create Database"
echo "5. Start in test mode"
echo "6. Go to Storage → Get Started"
echo "7. Add your GitHub Pages URL to Authorized Domains"
echo ""
echo "🔗 TEST YOUR SITE:"
echo "Open: https://pariisway.github.io/liveones/"
echo "Try: Sign up → Browse whispers → Test call flow"
echo ""
echo "📊 YOUR PLATFORM IS NOW LIVE!"
