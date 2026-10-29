#!/usr/bin/env bash
# TOKEN-03 — fail if business UI still has hardcoded #hex outside allowlist.
# Wave 0: expected FAIL until Plan 06 cleanup; tests/__tests__ already excluded.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Allowlist (non-product / docs only). Paths relative to repo root.
# Empty by default — D-05: tests already excluded via globs below.
ALLOWLIST=(
  # e.g. scripts/ansi-demo.md
)

HEX_PATTERN='#[0-9A-Fa-f]{3,8}\b'
SCAN_ROOTS=(components styles features app)

if ! command -v rg >/dev/null 2>&1; then
  echo "FAIL: ripgrep (rg) not in PATH"
  exit 1
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# shellcheck disable=SC2068
rg -n "$HEX_PATTERN" "${SCAN_ROOTS[@]}" \
  --glob '!**/*.{test,spec}.*' \
  --glob '!**/__tests__/**' \
  --glob '!**/*.md' \
  >"$TMP" || true

# Drop allowlisted paths
FILTERED="$(mktemp)"
trap 'rm -f "$TMP" "$FILTERED"' EXIT
if [[ ${#ALLOWLIST[@]} -eq 0 ]]; then
  cp "$TMP" "$FILTERED"
else
  : >"$FILTERED"
  while IFS= read -r line; do
    skip=0
    for a in "${ALLOWLIST[@]}"; do
      [[ -z "$a" || "$a" == \#* ]] && continue
      case "$line" in
        "$a":*|"$a/"*) skip=1; break ;;
      esac
    done
    [[ $skip -eq 0 ]] && printf '%s\n' "$line" >>"$FILTERED"
  done <"$TMP"
fi

COUNT=$(wc -l <"$FILTERED" | tr -d ' ')
echo "== hardcoded hex gate (components styles features app) =="
echo "hits: $COUNT"
if [[ "$COUNT" -gt 0 ]]; then
  echo "--- sample (first 30) ---"
  head -n 30 "$FILTERED"
  echo "FAIL: $COUNT hardcoded hex hit(s) remain outside allowlist"
  exit 1
fi

echo "OK: no business-UI hardcoded hex outside allowlist"
exit 0
