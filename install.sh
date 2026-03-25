#!/bin/bash
# =============================================================================
#  NCE Studio — One-Shot Install Script
#  Usage: bash install.sh [site]
#  Default site: manager.ncesoccer.com
# =============================================================================

set -e

BENCH_DIR="/home/frappe/frappe-bench"
SITE="${1:-manager.ncesoccer.com}"
REPO="https://github.com/oliver-nce/studio.git"

echo ""
echo "============================================="
echo "  NCE Studio — Installing on: $SITE"
echo "============================================="
echo ""

cd "$BENCH_DIR"

# 1. Get the app (skip if already present)
if [ ! -d "$BENCH_DIR/apps/studio" ]; then
  echo ">>> Fetching app from GitHub..."
  bench get-app "$REPO"
else
  echo ">>> App already present — skipping get-app"
fi

# 2. Install on site (skip if already installed)
INSTALLED=$(bench --site "$SITE" list-installed-apps 2>/dev/null || true)
if echo "$INSTALLED" | grep -q "^studio$"; then
  echo ">>> App already installed on $SITE — skipping install-app"
else
  echo ">>> Installing app on site: $SITE ..."
  bench --site "$SITE" install-app studio
fi

# 3. Run migrations
echo ">>> Running migrations..."
bench --site "$SITE" migrate

# 4. Build frontend assets
echo ">>> Building frontend assets..."
bench build --app studio

# 5. Clear cache
echo ">>> Clearing cache..."
bench --site "$SITE" clear-cache

# 6. Restart bench
echo ">>> Restarting bench..."
bench restart

echo ""
echo "============================================="
echo "  Done! Visit: https://$SITE/studio"
echo "============================================="
echo ""
