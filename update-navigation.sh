#!/bin/bash
echo "🔄 Updating navigation with auth elements..."

# Update shoot-your-shot.html navigation
sed -i '/<div class="nav-links">/,/<\/div>/c\
            <div class="nav-links">\
                <a href="index.html">Home</a>\
                <a href="shoot-your-shot.html" class="active">Find Whispers</a>\
                <a href="become-a-whisper.html">Become a Whisper</a>\
                <div class="auth-element logged-out">\
                    <a href="login.html" class="btn secondary">Sign In</a>\
                </div>\
                <div class="auth-element logged-in" style="display: none;">\
                    <a href="whisper-portal.html" class="btn primary">My Portal</a>\
                    <a href="#" onclick="signOutUser()" class="btn secondary">Sign Out</a>\
                </div>\
            </div>' shoot-your-shot.html

echo "✅ Navigation updated with auth elements"
echo "📁 Files updated:"
echo "   - shoot-your-shot.html"
echo ""
echo "🚀 Next: Enable Firebase Authentication in console, then push these changes"
