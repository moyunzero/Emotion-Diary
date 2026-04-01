#!/usr/bin/env bash
# Remove internal docs from Git index (files stay locally, just stop being tracked).
# Run this once after updating .gitignore, then commit the change.
#
# Usage: ./scripts/untrack-internal-docs.sh

set -e

cd "$(dirname "$0")/.."

echo "Removing .planning/ from Git index (files stay local)..."
git rm -r --cached .planning 2>/dev/null || true

echo "Removing app-store-submission/ from Git index (files stay local)..."
git rm -r --cached app-store-submission 2>/dev/null || true

echo "Removing agent-transcripts/ from Git index (if any)..."
git rm -r --cached agent-transcripts 2>/dev/null || true

echo "Done. Run: git status"
echo "Then commit: git add .gitignore && git commit -m 'chore: stop tracking internal docs, keep local only'"
