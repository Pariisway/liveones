#!/bin/bash

echo "🧹 CLEANING UP - Keeping only essential files..."
echo "================================================"

# Create backup just in case
backup_dir="../liveones_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
cp -r . "$backup_dir/"
echo "✅ Backup created at: $backup_dir"

echo ""
echo "📁 Files to KEEP:"
echo "-----------------"
echo "HTML FILES:"
echo "- index.html"
echo "- become-whisper.html"
echo "- whisper-login.html"
echo "- whisper-signup.html"
echo "- whisper-dashboard.html"
echo "- payment.html"
echo "- chat-room.html"
echo ""
echo "CSS FILES:"
echo "- css/dynamic-styles.css"
echo ""
echo "JS FILES:"
echo "- js/voice-chat.js"
echo "- js/firebase-init.js"
echo "- js/firebase-simple.js"
echo "- js/agora-voice.js"
echo "- js/payment-handler.js"
echo "- js/file-upload.js"
echo "- js/load-real-whispers.js"
echo "- js/whisper-notifications.js"
echo "- js/call-flow-system.js"
echo ""
echo "OTHER FILES:"
echo "- .gitignore"
echo "- CNAME (for custom domain)"
echo "- robots.txt"
echo "- sitemap.xml"
echo "- ads.txt"
echo "- .nojekyll"
echo "- images/ directory"
echo ""

echo "🗑️  Removing unnecessary files..."
echo "--------------------------------"

# Remove backup directory
rm -rf backup_20251204
echo "✅ Removed: backup_20251204"

# Remove all .sh scripts (except this one)
find . -name "*.sh" -not -name "cleanup-now.sh" -delete
echo "✅ Removed all .sh scripts"

# Remove unnecessary JS files
remove_js=("add-notification.js" "add-payment-button.js" "add-payment-features.js" \
           "cleanup-admin.js" "cleanup-firestore.js" "update-index.js" \
           "audio-visualizer.js" "firebase-wrapper.js" "firebase.js" \
           "stripe-config.js" "firebase-auth-fix.js" "whisper-signup-fix.js" \
           "firebase-real-auth.js")
for js in "${remove_js[@]}"; do
    if [ -f "$js" ] || [ -f "js/$js" ]; then
        rm -f "$js" "js/$js" 2>/dev/null
        echo "✅ Removed: $js"
    fi
done

# Remove unnecessary CSS files
rm -f css/cool-style.css css/dating.css css/notifications.css css/style.css
echo "✅ Removed unnecessary CSS files"

# Remove configuration files
rm -f database.db example-firebase-config.js package.json package-lock.json \
      server.js stripe-secrets.js.example stripe-webhook-simulator.js \
      update-storage-rules.md README.md
echo "✅ Removed configuration files"

echo ""
echo "📊 Cleanup complete!"
echo ""
echo "📁 Current files:"
ls -la
echo ""
echo "📁 HTML files:"
ls *.html
echo ""
echo "📁 CSS files:"
ls css/
echo ""
echo "📁 JS files:"
ls js/
echo ""
echo "🌐 Your site now has ONLY essential files."
echo "Ready to upload to GitHub!"
echo ""
echo "📋 To upload:"
echo "1. Go to: https://github.com/pariisway/liveones"
echo "2. Click 'Add file' → 'Upload files'"
echo "3. Drag ALL files from this folder"
echo "4. Commit changes"
echo "5. Enable GitHub Pages in Settings"
