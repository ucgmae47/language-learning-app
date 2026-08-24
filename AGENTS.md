<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Local Mac testing (default)

Primary click-through testing is on **This Mac**, not Cursor Cloud. Cloud credits are limited — do not assume a Cloud desktop is available.

Bring the stack up:

1. Ensure Docker Desktop is running.
2. From the repo root: `npx supabase start` (config is committed at `supabase/config.toml`). This prints the local API URL + anon/service keys (also via `npx supabase status`).
3. Ensure `.env.local` exists with the local Supabase URL/keys and the soft-launch flags (`FREE_PREVIEW_STORIES_ONLY=true`, `DISABLE_TTS=true`, `ENABLE_PERSONAL_STORY_QUEUE=false`, `ENABLE_PREMIUM_AI=false`). `.env.local` is gitignored; recreate it from `.env.example` + `npx supabase status` if missing.
4. `npm run dev` → http://localhost:3000 — tell the user to open that in their browser.

## Cursor Cloud notes (optional only)

If a Cloud VM is used: Docker Engine and the Supabase CLI may already be installed; on a fresh pod start `dockerd` first, then `supabase start`, then `npm run dev`. Prefer Mac local testing whenever possible.

### Non-obvious gotchas
- **Schema / migrations — do not use the Supabase SQL editor.** Apply SQL with `npm run db:apply -- supabase/<file>.sql` (practice DB). After user approval for production: `npm run db:apply -- supabase/<file>.sql --live` (requires `SUPABASE_DB_URL`). The script also applies `supabase/grants-public-roles.sql` on practice so PostgREST does not hit `permission denied`.
- **DB grants after loading the schema.** `supabase/full-schema.sql` has no `GRANT` statements; local Postgres needs `grants-public-roles.sql` (handled by `db:apply`). Bootstrap: `npm run db:apply -- supabase/full-schema.sql` then `npm run seed:story-library`.
- **New feature migrations.** Whenever a change depends on a new SQL file (e.g. `supabase/story-progress-migration.sql`), apply it to the practice DB yourself immediately, tell the user in plain language that the practice database was updated, and only update the live database after they approve.
- **Auth has email confirmation disabled locally** (`enable_confirmations = false` in `supabase/config.toml`), so signup returns a session immediately and redirects to `/onboarding/interests` — no email step. The onboarding flow is homepage → `/assessment/{es,fr}` → `/signup?assessment=...` → interests → dashboard → `/stories`. Local emails (if any) land in Mailpit at http://127.0.0.1:54324.
- **Lint noise from `supabase start`.** Running `supabase start` creates `supabase/.temp/` (gitignored) containing a bundled edge-runtime file that ESLint lints, adding ~150 spurious errors. Run `npm run lint` before starting Supabase, or lint with `--ignore-pattern "supabase/**"`. The committed source itself has 3 pre-existing `react-hooks/set-state-in-effect` errors unrelated to setup.
- **AI/third-party features are optional.** With the keys in `.env.example` left blank, the Story Library free path works fully; other AI features degrade gracefully. Add `GEMINI_API_KEY` etc. only when testing those specific features.
