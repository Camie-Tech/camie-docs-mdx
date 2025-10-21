#!/bin/bash

# Exit if any command fails
set -e

# Check if a repo URL was provided
if [ -z "$1" ]; then
  echo "Usage: ./clone_and_move.sh <github_repo_url>"
  exit 1
fi

# Variables
REPO_URL=$1
TEMP_DIR="temp_repo"
CONTENT_DIR="src/content"

# Clone the repo into a temporary folder
echo "Cloning repository..."
git clone "$REPO_URL" "$TEMP_DIR"

# Create content folder if it doesn’t exist
mkdir -p "$CONTENT_DIR"

# Move ONLY the contents (not the folder itself)
echo "Moving repository contents into $CONTENT_DIR..."
shopt -s dotglob
mv "$TEMP_DIR"/* "$CONTENT_DIR"/

# Clean up the temporary directory
rm -rf "$TEMP_DIR"

echo "✅ All repository contents moved into $CONTENT_DIR successfully."
