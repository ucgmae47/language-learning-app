#!/usr/bin/env bash
# Apply a SQL file to the practice DB (Cloud local Supabase) or live hosted DB.
# Usage:
#   npm run db:apply -- supabase/some-migration.sql
#   npm run db:apply -- supabase/some-migration.sql --live
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ $# -lt 1 ]]; then
  echo "Usage: npm run db:apply -- <path-to.sql> [--live]" >&2
  exit 1
fi

FILE="$1"
shift
LIVE=false
for arg in "$@"; do
  if [[ "$arg" == "--live" ]]; then
    LIVE=true
  fi
done

if [[ ! -f "$FILE" ]]; then
  echo "SQL file not found: $FILE" >&2
  exit 1
fi

apply_psql() {
  local url="$1"
  local sql_file="$2"
  psql "$url" -v ON_ERROR_STOP=1 -f "$sql_file"
}

apply_docker() {
  local sql_file="$1"
  local container="${SUPABASE_DB_CONTAINER:-supabase_db_workspace}"
  if ! docker inspect "$container" >/dev/null 2>&1; then
    echo "Practice database container '$container' not running. Start it with: supabase start" >&2
    exit 1
  fi
  docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <"$sql_file"
}

if [[ "$LIVE" == true ]]; then
  URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
  if [[ -z "$URL" ]]; then
    echo "Live database URL missing. Add SUPABASE_DB_URL (Supabase → Settings → Database → URI) as a Cursor secret." >&2
    exit 1
  fi
  if ! command -v psql >/dev/null 2>&1; then
    echo "psql is required for live applies. Install postgresql-client." >&2
    exit 1
  fi
  echo "Applying $FILE to LIVE database…"
  apply_psql "$URL" "$FILE"
  echo "Done (live)."
  exit 0
fi

# Practice / Cloud local Supabase
PRACTICE_URL="${SUPABASE_DB_URL_PRACTICE:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
echo "Applying $FILE to PRACTICE database…"

if command -v psql >/dev/null 2>&1 && psql "$PRACTICE_URL" -c 'select 1' >/dev/null 2>&1; then
  apply_psql "$PRACTICE_URL" "$FILE"
  apply_psql "$PRACTICE_URL" "supabase/grants-public-roles.sql"
else
  apply_docker "$FILE"
  apply_docker "supabase/grants-public-roles.sql"
fi

echo "Done (practice)."
