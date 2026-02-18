#!/bin/bash
# Validates that safeworkplace-web-app exists as a sibling
if [ ! -d "../safeworkplace-web-app/src/UI" ]; then
  echo "ERROR: safeworkplace-web-app not found at ../safeworkplace-web-app/"
  echo "This template expects the main web app repo as a sibling directory."
  echo "Clone it: git clone [repo-url] ../safeworkplace-web-app"
  exit 1
fi

echo "✓ safeworkplace-web-app found"
echo "✓ UI components will be referenced from ../safeworkplace-web-app/src/UI/"

# Warn if the web app has node_modules — this can cause duplicate package resolution
if [ -d "../safeworkplace-web-app/node_modules" ]; then
  echo ""
  echo "⚠️  WARNING: ../safeworkplace-web-app/node_modules/ exists."
  echo "   This can cause duplicate React/MUI resolution and 'Invalid hook call' errors."
  echo "   If you hit issues, delete that node_modules folder or avoid running npm install in the web app."
fi

echo ""
echo "Run 'npm install && npm run dev' to start."
