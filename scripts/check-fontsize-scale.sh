#!/usr/bin/env bash
# TOKEN-02 / SC3 — fail if product UI still has sub-footnote fontSize literals (10|11).
# VISUAL-SYSTEM: 去掉 10/11；注脚最小 12. Empty allowlist by default (T-22-17).
# Any future exception must cite D-05-class non-product rationale here.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Allowlist (non-product only). Paths relative to repo root. Keep empty unless justified.
ALLOWLIST=(
)

FONTSIZE_PATTERN='fontSize:\s*(10|11)\b'
SCAN_ROOTS=(app components styles features)

if ! command -v rg >/dev/null 2>&1; then
  echo "FAIL: ripgrep (rg) not in PATH"
  exit 1
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# shellcheck disable=SC2068
rg -n "$FONTSIZE_PATTERN" "${SCAN_ROOTS[@]}" \
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
echo "== fontSize scale gate (app components styles features) =="
echo "hits: $COUNT"
if [[ "$COUNT" -gt 0 ]]; then
  echo "--- sample (first 30) ---"
  head -n 30 "$FILTERED"
  echo "FAIL: $COUNT sub-footnote fontSize (10|11) hit(s) remain outside allowlist"
  exit 1
fi

echo "OK: no product-UI fontSize 10|11 literals outside allowlist"
exit 0
