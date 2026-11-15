#!/usr/bin/env bash

set -euo pipefail

usage() {
  printf 'Usage: %s [DEVICE_NAME_OR_ID]\n' "$0"
  printf 'Set IOS_DEVELOPMENT_TEAM and IOS_DEVICE_ID in .env.ios.local or in your environment.\n'
  printf 'Find your device with: xcrun devicectl list devices\n'
}

if [[ "${1:-}" == "--help" && $# -eq 1 ]]; then
  usage
  exit 0
fi

if [[ $# -gt 1 ]]; then
  usage >&2
  exit 2
fi

cd "$(dirname "$0")"

device="${1:-${IOS_DEVICE_ID:-}}"
team="${IOS_DEVELOPMENT_TEAM:-}"
if [[ -f .env.ios.local ]]; then
  source ./.env.ios.local
  device="${device:-${IOS_DEVICE_ID:-}}"
  team="${team:-${IOS_DEVELOPMENT_TEAM:-}}"
fi

if [[ -z "$device" || -z "$team" ]]; then
  usage >&2
  exit 2
fi
derived_data="/tmp/label-printer-signed"
source_packages="/tmp/label-printer-spm"

npm run ios:sync

xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$derived_data" \
  -clonedSourcePackagesDirPath "$source_packages" \
  "DEVELOPMENT_TEAM=$team" \
  -allowProvisioningUpdates \
  -quiet build

app="$derived_data/Build/Products/Debug-iphoneos/App.app"
install_app() {
  xcrun devicectl device install app --device "$device" --timeout 30 "$app"
}

if ! install_app; then
  printf 'Install failed. Retrying once…\n' >&2
  install_app
fi
