#!/bin/bash
echo "=== Verifying Site Structure ==="

echo "1. Checking index.html structure..."
if grep -q "Manage My Whispers" index.html; then
    echo "✅ 'Manage My Whispers' button found in index.html"
else
    echo "❌ 'Manage My Whispers' button missing from index.html"
fi

echo "2. Checking whisper links..."
if grep -q "become-a-whisper.html" index.html; then
    echo "✅ 'Become a Whisper' link found"
else
    echo "❌ 'Become a Whisper' link missing"
fi

echo "3. Checking HTML structure..."
div_count=$(grep -o "<div" index.html | wc -l)
div_end_count=$(grep -o "</div" index.html | wc -l)
echo "   Opening divs: $div_count"
echo "   Closing divs: $div_end_count"

if [ "$div_count" -eq "$div_end_count" ]; then
    echo "✅ HTML div structure is balanced"
else
    echo "❌ HTML div structure unbalanced (difference: $((div_count - div_end_count)))"
fi

echo "=== Verification Complete ==="
