#!/usr/bin/env bash
# Rebuilds the whole monorepo (shared -> api -> web) and restarts every PM2 process in one go.
#
#   ./deploy/redeploy.sh                 build + pm2 restart all
#   ./deploy/redeploy.sh --pull          git pull first
#   ./deploy/redeploy.sh --install       npm ci first (after dependency changes)
#   ./deploy/redeploy.sh --migrate       apply SQL migrations after the build, before the restart
#   ./deploy/redeploy.sh -p -i -m        all of the above, in the right order
#   ./deploy/redeploy.sh --dry-run       print the steps and change nothing
#
# Also available as `npm run redeploy -- --pull`.
#
# If any step fails, nothing is restarted: the running site keeps serving the previous version.
# NEXT_PUBLIC_* variables are baked into the web bundle at build time, so they must be present
# (apps/web/.env.production or exported in the shell) when this script runs.
# A 2 GB server may run out of memory while building Next.js; add swap or run with
# NODE_OPTIONS=--max-old-space-size=1536 ./deploy/redeploy.sh.

set -euo pipefail

PULL=0
INSTALL=0
MIGRATE=0
DRY_RUN=0

usage() {
  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
}

for arg in "$@"; do
  case "$arg" in
    -p | --pull) PULL=1 ;;
    -i | --install) INSTALL=1 ;;
    -m | --migrate) MIGRATE=1 ;;
    -n | --dry-run) DRY_RUN=1 ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -t 1 ]; then
  BOLD=$'\033[1m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  RED=$'\033[31m'
  RESET=$'\033[0m'
else
  BOLD='' GREEN='' YELLOW='' RED='' RESET=''
fi

step() { printf '\n%s==> %s%s\n' "$BOLD" "$1" "$RESET"; }
note() { printf '%s%s%s\n' "$YELLOW" "$1" "$RESET"; }
fail() {
  printf '%sError: %s%s\n' "$RED" "$1" "$RESET" >&2
  exit 1
}

# Prints the command first; in dry-run mode that is all it does.
run() {
  printf '%s$ %s%s\n' "$YELLOW" "$*" "$RESET"
  if [ "$DRY_RUN" -eq 0 ]; then
    "$@"
  fi
}

# The script lives in <repo>/deploy, everything below runs from the repo root.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

command -v node > /dev/null || fail "node is not installed"
command -v npm > /dev/null || fail "npm is not installed"
if [ "$DRY_RUN" -eq 0 ]; then
  command -v pm2 > /dev/null || fail "pm2 is not installed (npm install -g pm2)"
fi

[ -f package.json ] || fail "package.json not found; run this script from a Formula checkout"

[ "$DRY_RUN" -eq 1 ] && note "Dry run: nothing is executed."
SECONDS=0
printf 'Node %s, npm %s\n' "$(node -v)" "$(npm -v)"

if [ "$PULL" -eq 1 ]; then
  step "Pulling the latest code"
  run git pull --ff-only
fi

if [ "$INSTALL" -eq 1 ]; then
  step "Installing dependencies"
  # HUSKY=0: git hooks are for developers, the server must not install them.
  HUSKY=0 run npm ci
fi

step "Building shared, api and web"
# `turbo run build` orders the tasks: packages/shared first, then api and web.
run npm run build

if [ "$MIGRATE" -eq 1 ]; then
  step "Applying SQL migrations"
  run npm run db:migrate
fi

step "Restarting PM2 processes"
if [ "$DRY_RUN" -eq 0 ]; then
  # Captured first: `grep -q` closing the pipe early would trip `pipefail`.
  processes="$(pm2 jlist 2> /dev/null || true)"
  case "$processes" in
    *'"name"'*) ;;
    *) fail "PM2 has no processes yet; start them first: pm2 start ecosystem.config.js && pm2 save" ;;
  esac
fi
run pm2 restart all --update-env
run pm2 status

printf '\n%sDone in %ss.%s\n' "$GREEN" "$SECONDS" "$RESET"
