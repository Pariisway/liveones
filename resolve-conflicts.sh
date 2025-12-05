#!/bin/bash
echo "Resolving conflicts in favor of our work..."

# For each conflicted file, accept our version
for file in $(git diff --name-only --diff-filter=U); do
    echo "Resolving: $file"
    git checkout --ours "$file"
    git add "$file"
done

# Continue the merge
git commit -m "Merge: Resolved conflicts in favor of local work"
