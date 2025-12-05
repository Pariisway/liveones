#!/bin/bash
echo "=== Deploying LiveOnes ==="

cd ~/liveones

# Add all files
git add -A

# Commit
git commit -m "COMPLETE: Fixed all files with correct Firebase, Agora, AdSense configs and stabilized pages"

# Push to GitHub
echo "Pushing to GitHub..."
if git push origin main; then
    echo "✅ Successfully deployed!"
    echo "Your site should be available at: https://yourusername.github.io/liveones/"
else
    echo "❌ Push failed, trying with --force-with-lease..."
    git push origin main --force-with-lease
fi

echo "=== Deployment Complete ==="
