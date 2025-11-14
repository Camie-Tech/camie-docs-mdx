#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./clone_and_move.sh <github_repo_url>"
  exit 1
fi

REPO_URL=$1
TEMP_DIR="temp_repo"

# Detect if we're running from /opt/render/project/src or /opt/render/project
CURRENT_DIR=$(pwd)
echo "🔍 Debug: Current directory = $CURRENT_DIR"

if [[ "$CURRENT_DIR" == */src ]]; then
  # Running from /opt/render/project/src, so paths are relative to here
  CONTENT_DIR="content"
  DATA_DIR="data"
  echo "✅ Detected running from src/ directory"
else
  # Running from /opt/render/project, so paths include src/
  CONTENT_DIR="src/content"
  DATA_DIR="src/data"
  echo "✅ Detected running from project root"
fi

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
mkdir -p "$DATA_DIR"

echo "📁 Moving repository contents..."

# Check if repo has src/content structure or flat structure
if [ -d "$TEMP_DIR/src/content" ]; then
  echo "✅ Found src/content structure in repo"
  
  # Move openapi.json if it exists
  if [ -f "$TEMP_DIR/src/data/openapi.json" ]; then
    echo "✅ Moving openapi.json to $DATA_DIR/"
    mv "$TEMP_DIR/src/data/openapi.json" "$DATA_DIR/"
  fi
  
  # Move content
  shopt -s dotglob
  mv "$TEMP_DIR/src/content"/* "$CONTENT_DIR"/ 2>/dev/null || true
  
elif [ -d "$TEMP_DIR/content" ]; then
  echo "✅ Found content/ directory in repo"
  
  # Move openapi.json if it exists
  if [ -f "$TEMP_DIR/data/openapi.json" ]; then
    echo "✅ Moving openapi.json to $DATA_DIR/"
    mv "$TEMP_DIR/data/openapi.json" "$DATA_DIR/"
  fi
  
  # Move content
  shopt -s dotglob
  mv "$TEMP_DIR/content"/* "$CONTENT_DIR"/ 2>/dev/null || true
  
else
  echo "✅ Found flat structure, moving all files"
  
  # Move openapi.json to src/data/ if it exists
  if [ -f "$TEMP_DIR/openapi.json" ]; then
    echo "✅ Found openapi.json, moving to $DATA_DIR/"
    mv "$TEMP_DIR/openapi.json" "$DATA_DIR/"
  fi
  
  # Move everything else to src/content/
  shopt -s dotglob
  mv "$TEMP_DIR"/* "$CONTENT_DIR"/ 2>/dev/null || true
fi

# Debug: List what was moved
echo "📋 Content directory now contains:"
ls -la "$CONTENT_DIR" || echo "Content directory is empty!"

rm -rf "$TEMP_DIR"

echo "✅ All repository contents moved successfully."

# 🔄 Generate API pages from OpenAPI spec
echo "🔧 Generating individual API endpoint pages..."
node scripts/generateAPIPages.js

# 🔄 Generate meta.json from cloned content
echo "🔧 Generating meta.json from content structure..."
node scripts/generateMeta.js

echo "✅ Content setup complete!"