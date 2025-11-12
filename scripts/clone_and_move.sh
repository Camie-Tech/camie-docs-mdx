#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./clone_and_move.sh <github_repo_url>"
  exit 1
fi

REPO_URL=$1
TEMP_DIR="temp_repo"
CONTENT_DIR="src/content"

echo "🔄 Cloning repository..."

# If GITHUB_TOKEN exists, inject it into the URL
if [ -n "$GITHUB_TOKEN" ]; then
  # Extract repo path from URL (e.g., "Wallz100/Camie_Tech_Docs")
  REPO_PATH=$(echo "$REPO_URL" | sed -E 's|https://github.com/(.+)|\1|')
  AUTH_URL="https://${GITHUB_TOKEN}@github.com/${REPO_PATH}"
  git clone "$AUTH_URL" "$TEMP_DIR"
else
  git clone "$REPO_URL" "$TEMP_DIR"
fi

mkdir -p "$CONTENT_DIR"

echo "📁 Moving repository contents into $CONTENT_DIR..."
shopt -s dotglob
mv "$TEMP_DIR"/* "$CONTENT_DIR"/

rm -rf "$TEMP_DIR"

echo "✅ All repository contents moved into $CONTENT_DIR successfully."

# 🔄 Generate API pages from OpenAPI spec
echo "🔧 Generating individual API endpoint pages..."
node scripts/generateAPIPages.js

# 🔄 Generate meta.json from cloned content
echo "🔧 Generating meta.json from content structure..."
node scripts/generateMeta.js

echo "✅ Content setup complete!"