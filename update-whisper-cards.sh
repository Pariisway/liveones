#!/bin/bash
# This script adds payment buttons to whisper cards

FILE="shoot-your-shot.html"

# Check if file exists
if [ ! -f "$FILE" ]; then
    echo "Error: $FILE not found"
    exit 1
fi

# Create backup
cp "$FILE" "$FILE.backup"

# Add payment button to whisper cards (this is a simplified version)
# In practice, we'd need to see the exact HTML structure
echo "Looking for whisper cards to update..."

# This is a template for what we want to add - we'll need to customize based on actual structure
PAYMENT_BUTTON='<a href="call-payment.html?whisperId=WHISPER_ID_PLACEHOLDER" class="call-button">🎙️ Call Now - $15</a>'

echo "Please check shoot-your-shot.html for whisper cards and manually add:"
echo "$PAYMENT_BUTTON"
echo ""
echo "Replace WHISPER_ID_PLACEHOLDER with the actual whisper ID"
