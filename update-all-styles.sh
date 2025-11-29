#!/bin/bash
echo "🎨 Standardizing all pages to match home page style..."

# Common navigation HTML
NAV_HTML='<nav class="main-nav">
    <div class="nav-container">
        <div class="nav-logo">
            <a href="index.html">House of Whispers</a>
        </div>
        <div class="nav-links">
            <a href="index.html">Home</a>
            <a href="shoot-your-shot.html">Find Whispers</a>
            <a href="become-a-whisper.html">Become a Whisper</a>
            <div class="auth-element logged-out">
                <a href="login.html" class="btn secondary">Sign In</a>
            </div>
            <div class="auth-element logged-in" style="display: none;">
                <a href="whisper-portal.html" class="btn primary">My Portal</a>
                <a href="#" onclick="signOutUser()" class="btn secondary">Sign Out</a>
            </div>
        </div>
    </div>
</nav>'

# Common CSS links
CSS_LINKS='<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/dating.css">'

# Common scripts
COMMON_SCRIPTS='<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
<script src="js/firebase-auth.js"></script>'

# Pages to update (excluding index.html which is already styled)
PAGES=("shoot-your-shot.html" "become-a-whisper.html" "whisper-portal.html" "login.html" "signup.html" "call-payment.html" "voice-call.html" "call-completed.html" "whisper-earnings.html")

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "Updating $page"
        
        # Create backup
        cp "$page" "$page.backup"
        
        # Create updated version
        cat > "$page.updated" << TEMPLATE
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$(grep -oP '<title>\K[^<]*' "$page")</title>
    <!-- Google Adsense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1184595877548269" crossorigin="anonymous"></script>
    <meta name="google-adsense-account" content="ca-pub-1184595877548269">
    <!-- Styles -->
    $CSS_LINKS
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            color: white;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .main-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
        }
        
        .main-header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
        }
        
        .content-section {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .btn {
            padding: 12px 24px;
            background: #8B5CF6;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #7C3AED;
        }
        
        .btn.primary {
            background: #8B5CF6;
        }
        
        .btn.secondary {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .btn.secondary:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    $NAV_HTML
    
    <div class="container">
        $(sed -n '/<body>/,/<\/body>/p' "$page" | grep -v '<body>' | grep -v '</body>' | grep -v 'main-nav' | grep -v 'nav-container')
    </div>

    $COMMON_SCRIPTS
</body>
</html>
TEMPLATE
        
        # Replace the original file
        mv "$page.updated" "$page"
        echo "  ✅ $page updated with consistent style"
    else
        echo "  ❌ $page not found"
    fi
done

echo "🎉 All pages now have consistent styling!"
