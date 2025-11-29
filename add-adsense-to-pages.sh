#!/bin/bash
echo "📝 Adding Google Adsense to all pages..."

# Adsense code to add
ADSENSE_SCRIPT='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1184595877548269" crossorigin="anonymous"></script>'
ADSENSE_META='<meta name="google-adsense-account" content="ca-pub-1184595877548269">'

# List of pages to update
PAGES=("index.html" "shoot-your-shot.html" "become-a-whisper.html" "whisper-portal.html" "login.html" "signup.html" "call-payment.html" "voice-call.html" "call-completed.html" "whisper-earnings.html")

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "Adding Adsense to $page"
        
        # Check if Adsense is already added
        if ! grep -q "google-adsense-account" "$page"; then
            # Add Adsense meta tag after charset
            sed -i '/<meta charset="UTF-8">/a\'"$ADSENSE_META" "$page"
            
            # Add Adsense script before closing head tag
            if grep -q "</head>" "$page"; then
                sed -i '/<\/head>/i\'"$ADSENSE_SCRIPT" "$page"
            else
                # If no </head> tag, add before </head> or before </body>
                if grep -q "</body>" "$page"; then
                    sed -i '/<\/body>/i\'"$ADSENSE_SCRIPT" "$page"
                else
                    echo "  ⚠️  Could not find closing tags in $page"
                fi
            fi
            echo "  ✅ Adsense added to $page"
        else
            echo "  ✅ Adsense already in $page"
        fi
    else
        echo "  ❌ $page not found"
    fi
done

echo "🎯 Google Adsense added to all pages!"
