#!/bin/bash
echo "🎯 FINAL VERIFICATION"

echo ""
echo "1. Checking key files:"
ls -la shoot-your-shot.html add-sample-whispers.html call-payment.html voice-call.html

echo ""
echo "2. Checking shoot-your-shot.html content:"
echo "   Header:"
grep -A 1 "Connect with amazing whispers" shoot-your-shot.html
echo ""
echo "   Subtitle:"
grep "subtitle" shoot-your-shot.html
echo ""
echo "   Call buttons:"
grep "Call Now" shoot-your-shot.html | head -2

echo ""
echo "3. Checking payment flow files:"
ls -la js/stripe-payment.js js/agora-voice-call.js

echo ""
echo "🎉 TESTING INSTRUCTIONS:"
echo "1. Visit: https://iaiwaf.com/cache-refresh.html"
echo "2. Click 'Add Sample Whispers'"
echo "3. Then click 'Test Shoot Your Shot'"
echo "4. You should see whisper profiles with '$15' pricing"
echo "5. Click 'Call Now - $15' to test payment flow"
