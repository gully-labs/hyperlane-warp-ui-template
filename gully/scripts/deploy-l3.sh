#!/usr/bin/env sh
# Deploy a staged static build (node scripts/build-staging.mjs <dir>) to gully-l3, keeping old hashed assets:
#   sh scripts/deploy-l3.sh <stagedDir> [ssh-target]
# 1. upload to <site>.new  2. copy the live assets/ into the new assets/ without overwriting (tabs still running the
# previous build keep loading their lazy chunks, e.g. ccip-*.js)  3. swap: live -> <site>.old, .new -> live.
# Roll back: ssh <target> 'cd /srv/status/sites && mv S S.bad && mv S.old S' (S = the site folder).
set -eu
SRC=${1:?usage: deploy-l3.sh <stagedDir> [ssh-target]}
TARGET=${2:-deploy@57.129.137.57}
SITE=/srv/status/sites/testnet-bridge.gullychain.xyz
[ -f "$SRC/index.html" ] || { echo "no index.html in $SRC" >&2; exit 1; }

ssh "$TARGET" "rm -rf '$SITE.new' && mkdir -p '$SITE.new'"
tar -C "$SRC" -cf - . | ssh "$TARGET" "tar -C '$SITE.new' -xf -"
ssh "$TARGET" "set -e
  mkdir -p '$SITE.new/assets'
  if [ -d '$SITE/assets' ]; then cp -rn '$SITE/assets/.' '$SITE.new/assets/'; fi
  chmod -R a+rX '$SITE.new'
  rm -rf '$SITE.old'
  if [ -d '$SITE' ]; then mv '$SITE' '$SITE.old'; fi
  mv '$SITE.new' '$SITE'
  ls '$SITE/assets'"

# verify: page 200 and every script chunk in index.html served as JavaScript
for HOST in https://bridge.gullychain.xyz https://testnet-bridge.gullychain.xyz; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$HOST/")
  echo "$HOST/ -> $code"
  for js in $(curl -s "$HOST/" | grep -oE 'assets/[^"]+\.js'); do
    echo "  $js -> $(curl -s -o /dev/null -w '%{http_code} %{content_type}' "$HOST/$js")"
  done
done
