#!/bin/bash

# List of HTML files to update
HTML_FILES=("index.html" "login.html" "signup.html" "become-a-whisper.html" "payment.html" "call-room.html")

for file in "${HTML_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Create a temporary file with the updated script order
        awk '
        /<!-- Firebase -->/ { 
            print "<!-- Firebase SDKs -->"
            print "<script src=\"https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js\"></script>"
            print "<script src=\"https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js\"></script>"
            print "<script src=\"https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js\"></script>"
            print ""
            print "<!-- Firebase Configuration -->"
            print "<script src=\"js/firebase-config.js\"></script>"
            print ""
            print "<!-- Auth Manager -->"
            print "<script src=\"js/auth-manager.js\"></script>"
            next
        }
        /src="https:\/\/www.gstatic.com\/firebasejs\/8.10.0\/firebase-app.js"/ { next }
        /src="https:\/\/www.gstatic.com\/firebasejs\/8.10.0\/firebase-auth.js"/ { next }
        /src="https:\/\/www.gstatic.com\/firebasejs\/8.10.0\/firebase-firestore.js"/ { next }
        /src="js\/firebase-init.js"/ { next }
        /src="js\/firebase-auth.js"/ { next }
        { print }
        ' "$file" > "$file.tmp"
        
        mv "$file.tmp" "$file"
        echo "✅ Updated $file"
    else
        echo "⚠️  $file not found, skipping"
    fi
done

echo "🎉 All pages updated with proper Firebase loading order!"
