#!/usr/bin/env bash
# Import all Asset QT accounts via the Node script (not MCP).
# Requires SUPABASE_SECRET_KEY in the environment or .env.local.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${SUPABASE_SECRET_KEY:-}" && -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  if [[ -f .env.local ]]; then
    set -a
    # shellcheck disable=SC1091
    source <(grep -E '^(SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL)=' .env.local | sed 's/^/export /')
    set +a
  fi
fi

if [[ -z "${SUPABASE_SECRET_KEY:-}" && -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Missing SUPABASE_SECRET_KEY. Add it to .env.local or your Cursor environment secrets." >&2
  echo "Dashboard: Supabase project → Settings → API → secret (service_role) key" >&2
  exit 1
fi

echo "Importing all accounts from data/Lifecycle_Management_Asset_QT.csv ..."
npm run db:import-qt -- --all-accounts --replace "$@"
