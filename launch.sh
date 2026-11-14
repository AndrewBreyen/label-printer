#!/usr/bin/env bash

set -euo pipefail

case "${1:-}" in
  "")
    ;;
  --quick)
    ;;
  *)
    printf 'Usage: %s [--quick]\n' "$0" >&2
    exit 2
    ;;
esac

if ! command -v npm >/dev/null 2>&1; then
  printf 'Error: npm is required to launch this project.\n' >&2
  exit 1
fi

cd "$(dirname "$0")"

if [[ "${1:-}" != "--quick" ]]; then
  npm install --no-audit --no-fund
fi

if ! command -v mkcert >/dev/null 2>&1; then
  printf 'Error: mkcert is required for the local HTTPS certificate. Install it with: brew install mkcert\n' >&2
  exit 1
fi

if ! LAN_IP="$(ipconfig getifaddr en0)" || [[ -z "$LAN_IP" ]]; then
  printf 'Error: could not determine the Wi-Fi IP address for en0.\n' >&2
  exit 1
fi

mkdir -p .cert
mkcert -install
mkcert -cert-file .cert/lan-cert.pem -key-file .cert/lan-key.pem "$LAN_IP" localhost 127.0.0.1

printf 'Open https://%s:3001/label-printer on devices connected to this Wi-Fi network.\n' "$LAN_IP"
printf 'To trust the certificate on Android, install rootCA.pem from: %s\n' "$(mkcert -CAROOT)"

(sleep 3; open -a "Google Chrome" "https://$LAN_IP:3001/label-printer") &
BROWSER=none npm run start:lan-https 2>&1 | tee
