#!/usr/bin/env bash
# Switch the active app icon set (home-screen icon, apple-touch icons, favicon).
# Usage: ./scripts/switch-icon.sh a|b|c|d
set -euo pipefail

key="${1:-}"
root="$(cd "$(dirname "$0")/.." && pwd)"

case "$key" in
  a) folder="a-fullbleed" ;;
  b) folder="b-neon" ;;
  c) folder="c-inball" ;;
  d) folder="d-wildcard" ;;
  *)
    echo "Usage: $0 a|b|c|d" >&2
    echo "  a = a-fullbleed (leather ball, wrapped wordmark)" >&2
    echo "  b = b-neon      (neon outline, double stripes — current winner)" >&2
    echo "  c = c-inball    (neon outline, wordmark inside)" >&2
    echo "  d = d-wildcard  (leather + neon rim)" >&2
    exit 1
    ;;
esac

src="$root/icon-designs/$folder"
pub="$root/public"
cp "$src"/icon-*.png "$pub"/
cp "$src"/apple-touch-icon*.png "$pub"/
cp "$src"/favicon-*.png "$pub"/
cp "$src"/favicon.ico "$pub"/
cp "$src"/apple-touch-icon.png "$root/src/app/apple-icon.png"
cp "$src"/favicon.ico "$root/src/app/favicon.ico"

echo "Active icon set: $folder"
echo "Restart the dev server / redeploy, then re-add to the iPhone home screen (iOS caches icons)."
