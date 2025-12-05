#!/bin/bash
# Simple deploy fix

echo "Cleaning up and preparing..."

# Remove any old git issues
rm -rf .git

# Initialize fresh
git init
git add -A
git commit -m "Fresh start: Complete working LiveOnes platform"

echo "Now you need to connect to GitHub:"
echo ""
echo "1. Go to GitHub.com and create a new repository called 'liveones'"
echo "2. Copy the repository URL (https://github.com/YOUR_USERNAME/liveones.git)"
echo "3. Run these commands:"
echo ""
echo "   git remote add origin YOUR_REPOSITORY_URL_HERE"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "If push fails, use: git push -u origin main --force"
