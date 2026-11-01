#!/usr/bin/env bash
# TOKEN-02 / SC3 / D-07 — fail if product UI still has off-scale borderRadius
# numeric literals outside {8, 14, 22, 9999} (= DESIGN_TOKENS.borderRadius sm/md/lg/full).
# Empty allowlist by default (T-22-20 / T-22-27). Intentional exceptions only via
# radius-exceptions.md with rationale — do not expand silently.
# Batch B (22-10) + Batch C (22-11): BOTH NONE — orphans remapped; keep ALLOWLIST empty.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Allowlist (non-product only). Paths relative to repo root. Keep empty unless justified.
# Synced to .planning/phases/22-design-tokens/radius-exceptions.md (Batch B+C = NONE).
ALLOWLIST=(
)

RADIUS_PATTERN='borderRadius:\s*[0-9]+\b'
LEGAL_PATTERN='borderRadius:\s*(8|14|22|9999)\b'
SCAN_ROOTS=(app components styles features)

if ! command -v rg >/dev/null 2>&1; then
  echo "FAIL: ripgrep (rg) not in PATH"
  exit 1
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# shellcheck disable=SC2068
rg -n "$RADIUS_PATTERN" "${SCAN_ROOTS[@]}" \
  --glob '!**/*.{test,spec}.*' \
  --glob '!**/__tests__/**' \
  --glob '!**/*.md' \
  >"$TMP" || true

# Keep only illegal (off-scale) literals
ILLEGAL="$(mktemp)"
trap 'rm -f "$TMP" "$ILLEGAL"' EXIT
grep -Ev "$LEGAL_PATTERN" "$TMP" >"$ILLEGAL" || true

# Drop allowlisted paths
FILTERED="$(mktemp)"
trap 'rm -f "$TMP" "$ILLEGAL" "$FILTERED"' EXIT
if [[ ${#ALLOWLIST[@]} -eq 0 ]]; then
  cp "$ILLEGAL" "$FILTERED"
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
  done <"$ILLEGAL"
fi

COUNT=$(wc -l <"$FILTERED" | tr -d ' ')
# Empty filtered file can yield 0 or blank — normalize
COUNT=${COUNT:-0}
echo "== borderRadius scale gate (app components styles features) =="
echo "hits: $COUNT"
if [[ "$COUNT" -gt 0 ]]; then
  echo "--- sample (first 30) ---"
  head -n 30 "$FILTERED"
  echo "FAIL: $COUNT off-scale borderRadius hit(s) remain outside {8,14,22,9999} allowlist"
  exit 1
fi

echo "OK: no product-UI borderRadius literals outside {8,14,22,9999}"
exit 0
