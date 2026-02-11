#!/bin/bash
# Deployment preparation script for Event Participant Data Collection
# Run this from the Event-Participant-Data-Collection folder

set -e
cd "$(dirname "$0")"

echo "=== Preparing deployment ==="

# Use this folder as its own git repo (needed for Azure Static Web Apps)
# If we're in a parent repo, we need our own .git here
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null || true)
if [ -n "$GIT_DIR" ] && [[ "$GIT_DIR" == *"Development/.git"* ]]; then
    echo "This project is inside a parent git repo."
    echo "Initializing this folder as its own repository for deployment..."
    rm -rf .git 2>/dev/null || true
    git init
fi

[ ! -d .git ] && git init

git add .
git status

echo ""
echo "=== Ready to commit and push ==="
echo ""
echo "Run these commands (replace with your GitHub repo URL):"
echo ""
echo "  git commit -m 'Initial commit: Event participant registration'"
echo "  git remote add origin https://github.com/YOUR_ORG/event-participant-data-collection.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""
echo "Then create your Azure Static Web App at: https://portal.azure.com"
echo "See DEPLOYMENT.md for full instructions."
echo ""
