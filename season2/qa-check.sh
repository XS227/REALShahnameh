#!/usr/bin/env bash
# QA check for Season 2 localization completeness.
# Usage: bash qa-check.sh   (run from season2/ directory)

cd "$(dirname "$0")"

PASS=0; FAIL=0; WARN=0

ok()   { echo "  ✓ $*"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $*"; FAIL=$((FAIL+1)); }
warn() { echo "  ! $*"; WARN=$((WARN+1)); }

echo "=== 1. JS syntax check ==="
for f in app.js tap.js market.js resources.js i18n.js i18n/en.js i18n/fa.js i18n/tg.js; do
  if node --check "$f" 2>/dev/null; then
    ok "$f"
  else
    fail "$f syntax error"
  fi
done

echo ""
echo "=== 2. i18n key parity (en / fa / tg) ==="
EN_KEYS=$(node -e "
  var L = {}; var window={RealI18NLocales:L};
  eval(require('fs').readFileSync('i18n/en.js','utf8'));
  console.log(Object.keys(L.en).sort().join('\n'));
")
FA_KEYS=$(node -e "
  var L = {}; var window={RealI18NLocales:L};
  eval(require('fs').readFileSync('i18n/fa.js','utf8'));
  console.log(Object.keys(L.fa).sort().join('\n'));
")
TG_KEYS=$(node -e "
  var L = {}; var window={RealI18NLocales:L};
  eval(require('fs').readFileSync('i18n/tg.js','utf8'));
  console.log(Object.keys(L.tg).sort().join('\n'));
")

EN_COUNT=$(echo "$EN_KEYS" | wc -l | tr -d ' ')
FA_COUNT=$(echo "$FA_KEYS" | wc -l | tr -d ' ')
TG_COUNT=$(echo "$TG_KEYS" | wc -l | tr -d ' ')
ok "en.js: $EN_COUNT keys"

MISSING_FA=$(comm -23 <(echo "$EN_KEYS") <(echo "$FA_KEYS") | head -10)
MISSING_TG=$(comm -23 <(echo "$EN_KEYS") <(echo "$TG_KEYS") | head -10)

if [ -z "$MISSING_FA" ]; then
  ok "fa.js: $FA_COUNT keys (matches en)"
else
  fail "fa.js missing $(echo "$MISSING_FA" | wc -l | tr -d ' ') keys:"
  echo "$MISSING_FA" | sed 's/^/    /'
fi
if [ -z "$MISSING_TG" ]; then
  ok "tg.js: $TG_COUNT keys (matches en)"
else
  fail "tg.js missing $(echo "$MISSING_TG" | wc -l | tr -d ' ') keys:"
  echo "$MISSING_TG" | sed 's/^/    /'
fi

echo ""
echo "=== 3. data-i18n attribute counts ==="
for page in index.html tap.html heroes.html learn.html earn.html social.html; do
  N=$(grep -c 'data-i18n' "$page" || true)
  ok "$page: $N data-i18n occurrences"
done

echo ""
echo "=== 4. Local file existence ==="
for f in index.html tap.html heroes.html learn.html earn.html social.html \
         app.js tap.js i18n/en.js i18n/fa.js i18n/tg.js i18n.js style.css; do
  if [ -f "$f" ]; then
    ok "$f"
  else
    fail "$f MISSING"
  fi
done

echo ""
echo "=== Summary ==="
echo "  PASS: $PASS  WARN: $WARN  FAIL: $FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo "  All checks passed."
else
  echo "  Failures detected — see above."
fi
