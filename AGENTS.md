<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

LinguaPath is a single Next.js 16 (App Router, Turbopack) app backed by Supabase (auth + Postgres). There is one deployable service (the Next.js app) plus a **local Supabase stack** it depends on for auth and the database. Standard commands live in `README.md` / `package.json` scripts; only the non-obvious cloud setup is captured here.

### Services and how to run them

The local Supabase stack is NOT a system service — it runs in Docker and must be started each session. Docker itself is installed but its daemon is not auto-started here.

1. Start the Docker daemon (needs sudo; not running on a fresh boot) and make the socket usable without sudo:
   - `sudo dockerd > /tmp/dockerd.log 2>&1 &`
   - `sudo chmod 666 /var/run/docker.sock`
2. Start Supabase (reuses the existing DB volume, so schema + seeded stories persist): run `supabase start` from the repo root. API → `http://127.0.0.1:54321`, Studio → `http://127.0.0.1:54323`, Mailpit (emails) → `http://127.0.0.1:54324`, Postgres → `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. The DB container is `supabase_db_workspace`.
3. Run the app: `npm run dev` (http://localhost:3000). Lint: `npm run lint`. Build: `npm run build`.

### Non-obvious gotchas

- `.env.local` is git-ignored but already present in the VM (persisted in the snapshot). It points `NEXT_PUBLIC_SUPABASE_URL` / anon / service-role at the local Supabase stack using the CLI's default demo JWT keys, and sets soft-launch flags. If it is ever missing, recreate it with the values printed by `supabase start` (use the legacy `ANON_KEY` / `SERVICE_ROLE_KEY` JWTs, not the `sb_publishable_`/`sb_secret_` keys) plus `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
- Soft-launch flags (`FREE_PREVIEW_STORIES_ONLY=true`, `ENABLE_PERSONAL_STORY_QUEUE=false`, `ENABLE_DAILY_LIBRARY_STORIES=false`, `DISABLE_TTS=true`) intentionally lock every wheel feature except **Stories**. To exercise other features (chat, news, journal, games, etc.) set `FREE_PREVIEW_STORIES_ONLY=false` — most also need the relevant AI/API keys (Gemini, Groq, GitHub Models, etc.) which are optional and blank by default; those features degrade or error without keys.
- Email confirmation is disabled in `supabase/config.toml` (`enable_confirmations = false`), so signup logs you in immediately. Any confirmation emails would land in Mailpit at `http://127.0.0.1:54324`.
- Onboarding is assessment-gated: `/signup` only works with an assessment param, e.g. `/signup?assessment=es:B1`. Visiting `/signup` directly redirects to `/`.
- Database bootstrap (only needed if the Supabase volume is fresh/empty): apply `supabase/full-schema.sql`, then grant the Supabase roles (the schema does NOT grant them, so PostgREST returns "permission denied"), then seed:
  - `docker exec -i supabase_db_workspace psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/full-schema.sql`
  - Grant: `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;` (also sequences/functions and matching `ALTER DEFAULT PRIVILEGES`).
  - `npm run seed:story-library` (seeds 24 free library stories from `data/story-library-seed.json`).
- Lint currently reports 3 pre-existing `react-hooks/set-state-in-effect` errors + 1 unused-var warning in app source. These are not environment problems.
