#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Codex Reset Alert - Multi-Browser Extension Build & Packaging Script
# Targets: Chrome (CWS), Firefox (AMO), Edge (Partner Center)
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${ROOT_DIR}/dist"

# 1. Read extension metadata
NAME=$(node -e "console.log(require('./package.json').name || 'codex-reset-alert')")
VERSION=$(node -e "console.log(require('./manifest.json').version || '0.1.0')")

echo "=================================================="
echo " Building ${NAME} v${VERSION}"
echo "=================================================="

# 2. Clean build directory
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}/chrome" "${DIST_DIR}/firefox" "${DIST_DIR}/edge"

# Files to bundle
CORE_FILES=(
  "background.js"
  "shared.js"
  "i18n.js"
  "offscreen.html"
  "offscreen.js"
  "popup.html"
  "popup.css"
  "popup.js"
  "LICENSE"
  "README.md"
)

# ------------------------------------------------------------------------------
# Target: Chrome (Manifest V3 Service Worker, clean standard)
# ------------------------------------------------------------------------------
echo "→ Building Chrome package..."
for file in "${CORE_FILES[@]}"; do
  if [[ -f "${ROOT_DIR}/${file}" ]]; then
    cp "${ROOT_DIR}/${file}" "${DIST_DIR}/chrome/"
  fi
done
cp -r "${ROOT_DIR}/icons" "${DIST_DIR}/chrome/"
if [[ -d "${ROOT_DIR}/_locales" ]]; then
  cp -r "${ROOT_DIR}/_locales" "${DIST_DIR}/chrome/"
fi

# Tailor Chrome manifest (remove browser_specific_settings)
node -e "
  const fs = require('fs');
  const manifest = JSON.parse(fs.readFileSync('${ROOT_DIR}/manifest.json', 'utf8'));
  delete manifest.browser_specific_settings;
  fs.writeFileSync('${DIST_DIR}/chrome/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
"

(
  cd "${DIST_DIR}/chrome"
  zip -r -q "${DIST_DIR}/${NAME}-chrome-v${VERSION}.zip" .
)

# ------------------------------------------------------------------------------
# Target: Firefox (Manifest V3 with Gecko Settings)
# ------------------------------------------------------------------------------
echo "→ Building Firefox package..."
for file in "${CORE_FILES[@]}"; do
  if [[ -f "${ROOT_DIR}/${file}" ]]; then
    cp "${ROOT_DIR}/${file}" "${DIST_DIR}/firefox/"
  fi
done
cp -r "${ROOT_DIR}/icons" "${DIST_DIR}/firefox/"
if [[ -d "${ROOT_DIR}/_locales" ]]; then
  cp -r "${ROOT_DIR}/_locales" "${DIST_DIR}/firefox/"
fi

# Tailor Firefox manifest (ensure Gecko ID and scripts compatibility)
node -e "
  const fs = require('fs');
  const manifest = JSON.parse(fs.readFileSync('${ROOT_DIR}/manifest.json', 'utf8'));
  manifest.browser_specific_settings = manifest.browser_specific_settings || {
    gecko: {
      id: 'codex-reset-alert@local',
      strict_min_version: '121.0'
    }
  };
  manifest.background = {
    scripts: ['background.js']
  };
  fs.writeFileSync('${DIST_DIR}/firefox/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
"

(
  cd "${DIST_DIR}/firefox"
  zip -r -q "${DIST_DIR}/${NAME}-firefox-v${VERSION}.zip" .
)

# ------------------------------------------------------------------------------
# Target: Edge (Manifest V3 Chromium)
# ------------------------------------------------------------------------------
echo "→ Building Edge package..."
for file in "${CORE_FILES[@]}"; do
  if [[ -f "${ROOT_DIR}/${file}" ]]; then
    cp "${ROOT_DIR}/${file}" "${DIST_DIR}/edge/"
  fi
done
cp -r "${ROOT_DIR}/icons" "${DIST_DIR}/edge/"
if [[ -d "${ROOT_DIR}/_locales" ]]; then
  cp -r "${ROOT_DIR}/_locales" "${DIST_DIR}/edge/"
fi

# Tailor Edge manifest
node -e "
  const fs = require('fs');
  const manifest = JSON.parse(fs.readFileSync('${ROOT_DIR}/manifest.json', 'utf8'));
  delete manifest.browser_specific_settings;
  fs.writeFileSync('${DIST_DIR}/edge/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
"

(
  cd "${DIST_DIR}/edge"
  zip -r -q "${DIST_DIR}/${NAME}-edge-v${VERSION}.zip" .
)

# ------------------------------------------------------------------------------
# Build Summary
# ------------------------------------------------------------------------------
echo ""
echo "=================================================="
echo " Build Completed Successfully! 🎉"
echo "=================================================="
echo ""
printf "%-12s | %-10s | %-45s\n" "Target" "Size" "ZIP Archive"
echo "-------------+------------+-----------------------------------------------"

for target in "chrome" "firefox" "edge"; do
  ZIP_PATH="${DIST_DIR}/${NAME}-${target}-v${VERSION}.zip"
  if [[ -f "${ZIP_PATH}" ]]; then
    SIZE=$(du -h "${ZIP_PATH}" | awk '{print $1}')
    TARGET_LABEL="$(echo "${target:0:1}" | tr '[:lower:]' '[:upper:]')${target:1}"
    printf "%-12s | %-10s | %-45s\n" "${TARGET_LABEL}" "${SIZE}" "${ZIP_PATH#${ROOT_DIR}/}"
  fi
done

echo ""
echo "Unpacked build directories ready for testing:"
echo " - dist/chrome"
echo " - dist/firefox"
echo " - dist/edge"
echo "=================================================="
