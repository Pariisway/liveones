#!/bin/bash
echo "🔍 Verifying Payment & Call System..."

# Check if all key files exist
echo "1. Checking essential files..."
files=("call-payment.html" "voice-call.html" "call-success.html" "js/stripe-payment.js" "js/agora-voice-call.js" "js/earnings-tracker.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

# Check if shoot-your-shot has payment buttons
echo ""
echo "2. Checking payment buttons in shoot-your-shot.html..."
if grep -q "Call Now - \$15" shoot-your-shot.html; then
    echo "✅ Payment buttons found in whisper cards"
else
    echo "❌ Payment buttons missing"
fi

# Check Stripe configuration
echo ""
echo "3. Checking Stripe configuration..."
if grep -q "pk_test_51SPYHwRvETRK3Zx7mnVDTNyPB3mxT8vbSIcSVQURp8irweK0lGznwFrW9sjgju2GFgmDiQ5GkWYVlUQZZVNrXkJb00q2QOCC3I" js/stripe-payment.js; then
    echo "✅ Stripe test key configured"
else
    echo "❌ Stripe key missing"
fi

# Check Agora configuration
echo ""
echo "4. Checking Agora configuration..."
if grep -q "966c8e41da614722a88d4372c3d95dba" js/agora-voice-call.js; then
    echo "✅ Agora app ID configured"
else
    echo "❌ Agora app ID missing"
fi

echo ""
echo "🎯 VERIFICATION COMPLETE!"
echo "Next: Update Firebase security rules from firebase-rules.txt"
echo "Then test the payment flow at: https://iaiwaf.com/shoot-your-shot.html"
