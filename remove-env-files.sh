#!/bin/bash

# This script removes .env files from Git tracking without deleting the actual files

echo "Removing .env files from Git tracking..."

# Remove .env files from Git tracking
git rm --cached .env.render
git rm --cached client/.env.production

# Add a commit for the removal
git commit -m "Remove .env files from Git tracking"

echo "Done! The .env files have been removed from Git tracking but still exist in your local directory."
echo "Make sure to update your .gitignore file to prevent these files from being tracked again."
