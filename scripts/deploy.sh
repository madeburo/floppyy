#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ROOT=${DEPLOY_ROOT:-$(cd "$(dirname "$0")/.." && pwd -P)}
ROOT=$(cd "$ROOT" && pwd -P)
PM2_APP=${PM2_APP:-floppyy}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3018/api/health}
RELEASES="$(dirname "$ROOT")/.floppyy-releases"
mkdir -p "$RELEASES"
exec 9>"$RELEASES/deploy.lock"
flock -n 9 || { echo "Another deployment is running." >&2; exit 1; }
cd "$ROOT"

if [[ -n $(git status --porcelain) ]]; then
  echo "Refusing to deploy a dirty checkout." >&2
  exit 1
fi
pm2 describe "$PM2_APP" >/dev/null
BRANCH=$(git symbolic-ref --short HEAD)
git fetch origin "$BRANCH"
TARGET=$(git rev-parse FETCH_HEAD)
git merge-base --is-ancestor HEAD "$TARGET"
BACKUP="$RELEASES/$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
STAGE=$(mktemp -d "$RELEASES/staging.XXXXXX")
mkdir -p "$BACKUP"
CUTOVER=0
PROMOTED=0

rollback() {
  local status=$?
  trap - ERR INT TERM
  if [[ "$CUTOVER" == 1 ]]; then
    echo "Deployment failed; restoring the previous release." >&2
    pm2 stop "$PM2_APP" >/dev/null || true
    if [[ "$PROMOTED" == 1 ]]; then mv "$ROOT" "$BACKUP/failed"; fi
    if [[ -d "$BACKUP/app" ]]; then mv "$BACKUP/app" "$ROOT"; fi
    cd "$ROOT"
    pm2 restart "$PM2_APP"
    curl --retry 8 --retry-delay 1 --retry-connrefused --max-time 5 -fsS "${HEALTH_URL%/api/health}/" >/dev/null || echo "Rollback needs manual health verification." >&2
  fi
  echo "Staging/backup retained at $RELEASES for inspection." >&2
  exit "$((status == 0 ? 1 : status))"
}
trap rollback ERR INT TERM

echo "==> Stage $TARGET without changing the running site"
git clone --quiet --no-hardlinks "$ROOT" "$STAGE"
git -C "$STAGE" remote set-url origin "$(git remote get-url origin)"
# Preserve ignored server files (including environment files), but not build outputs.
rsync -a --exclude=.git --exclude=node_modules --exclude=.next "$ROOT/" "$STAGE/"
git -C "$STAGE" checkout -B "$BRANCH" "$TARGET"
git -C "$STAGE" update-ref "refs/remotes/origin/$BRANCH" "$TARGET"
cd "$STAGE"
npm ci
npm test
npm run build
EXPECTED=$(node -p 'require("./package.json").version')

echo "==> Switch PM2 app $PM2_APP to $EXPECTED"
cd "$(dirname "$ROOT")"
pm2 stop "$PM2_APP"
CUTOVER=1
mv "$ROOT" "$BACKUP/app"
mv "$STAGE" "$ROOT"
PROMOTED=1
cd "$ROOT"
pm2 restart "$PM2_APP"

HEALTHY=0
for attempt in {1..30}; do
  if curl --max-time 3 -fsS "$HEALTH_URL" | EXPECTED="$EXPECTED" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const h=JSON.parse(s);process.exit(h.status==="ok"&&h.version===process.env.EXPECTED?0:1)}catch{process.exit(1)}})'; then
    HEALTHY=1
    break
  fi
  sleep 1
done
[[ "$HEALTHY" == 1 ]]
curl --max-time 10 -fsS "${HEALTH_URL%/api/health}/" >/dev/null
CUTOVER=0
trap - ERR INT TERM
pm2 save
if ! bash scripts/cf-purge.sh; then
  echo "WARNING: release is healthy, but Cloudflare cache purge needs attention." >&2
fi
echo "Deployed $EXPECTED ($TARGET). Previous checkout: $BACKUP/app"
