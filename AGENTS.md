<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 app (**LinguaPath**, App Router + Turbopack). In production it uses a **hosted** Supabase project; in this cloud VM there are no external secrets, so we run a **local Supabase stack via Docker** instead. Dependencies are refreshed automatically by the startup update script (`npm install`, honoring `.npmrc` `legacy-peer-deps=true`). Standard commands live in `README.md` / `package.json` scripts — this section only covers non-obvious startup caveats.

### Services

| Service | How to run | Notes |
|---|---|---|
| Next.js dev server | `npm run dev` → http://localhost:3000 | Reads `.env.local`. Lint: `npm run lint` (3 pre-existing errors in repo code, unrelated to env). Build: `npm run build`. |
| Local Supabase (Postgres + Auth) | `sudo dockerd` (if not running) then `sudo supabase start` | Docker + the `supabase` CLI are preinstalled in the VM snapshot. API `:54321`, DB `:54322`, Studio `:54323`, Mailpit `:54324`. Get keys with `sudo supabase status -o env`. |

### First-time / fresh-DB setup (only if the local DB is empty)

Not needed if the Docker volumes from a prior session are intact. On a fresh stack:
1. `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/full-schema.sql` (idempotent full DDL; there are no files in `supabase/migrations/`, so `supabase start` does NOT auto-apply the schema).
2. `npm run seed:story-library` — loads the free Story Library from `data/story-library-seed.json` (self-loads `.env.local`).

### Non-obvious caveats

- **API-role grants:** The current Supabase CLI does NOT auto-expose new `public` tables to the `anon`/`authenticated`/`service_role` PostgREST roles, but the app schema (built against hosted Supabase) assumes they are. `supabase/config.toml` sets `auto_expose_new_tables = true` so a fresh schema apply grants access automatically. If you apply the schema to an already-running DB started before that flag existed, you'll get `permission denied for table ...`; fix with a one-time `GRANT ... ON ALL TABLES/SEQUENCES/ROUTINES IN SCHEMA public TO anon, authenticated, service_role;` (plus matching `ALTER DEFAULT PRIVILEGES`).
- **`.env.local`** holds the local Supabase URL + JWT keys and is gitignored. If it's missing, recreate it from `.env.example` using values from `sudo supabase status -o env` (`API_URL`→`NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`→`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`→`SUPABASE_SERVICE_ROLE_KEY`), and set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
- **Auth flow is assessment-first:** `/signup` only works with a `?assessment=<lang>:<level>` query (reached via the homepage → CEFR assessment). Locally, email confirmation is disabled (`enable_confirmations = false`), so signup logs you straight into `/onboarding/interests` (production requires email confirmation).
- **AI features are optional:** story generation, chat tutor, news, journal, TTS, etc. require external keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `GITHUB_TOKEN`, `ELEVENLABS_API_KEY`, …) and are gated by `FREE_PREVIEW_STORIES_ONLY=true`. The flagship **Story Library** works fully from seeded data with no AI keys.
