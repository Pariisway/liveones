#!/bin/bash
echo "🔍 Verifying Text Fixes..."

echo "1. Checking video/voice chat text..."
if grep -q "Private 5 minute voice chats" shoot-your-shot.html; then
    echo "✅ Fixed: Now says 'voice chats'"
else
    echo "❌ Still says 'video chats'"
fi

echo "2. Checking subtitle..."
if grep -q "Connect with amazing whispers for 5-minute voice calls" shoot-your-shot.html; then
    echo "✅ Subtitle updated"
else
    echo "❌ Subtitle not updated"
fi

echo "3. Checking no whispers message..."
if grep -q "No whispers available yet - Be the first to sign up!" shoot-your-shot.html; then
    echo "✅ No whispers message updated"
else
    echo "❌ No whispers message not updated"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Visit: https://iaiwaf.com/add-sample-whispers.html"
echo "2. Click 'Add Sample Whispers'"
echo "3. Then visit: https://iaiwaf.com/shoot-your-shot.html"
echo "4. You should now see whisper profiles with 'Call Now - $15' buttons!"
