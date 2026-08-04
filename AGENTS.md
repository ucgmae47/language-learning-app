<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

LinguaPath is a single Next.js 16 (App Router, Turbopack) app whose only hard dependency is **Supabase** (Postgres + Auth). Standard commands live in `package.json` (`npm run dev|build|lint`, `npm run seed:story-library`) and `README.md` — use those; the notes below only cover the non-obvious cloud/local setup.

### Running the app end to end
There are no hosted Supabase secrets in this environment, so the app runs against a **local Supabase stack** (Docker). Docker Engine and the Supabase CLI are already installed in the VM image; the update script only refreshes `npm` deps. On a fresh pod, bring the stack up:

1. Start the Docker daemon (it is not auto-started): `sudo dockerd > /tmp/dockerd.log 2>&1 &` then `sudo chmod 666 /var/run/docker.sock`.
2. From the repo root: `supabase start` (config is committed at `supabase/config.toml`). This prints the local API URL + anon/service keys (also via `supabase status`).
3. Ensure `.env.local` exists with the local Supabase URL/keys and the soft-launch flags (`FREE_PREVIEW_STORIES_ONLY=true`, `DISABLE_TTS=true`, `ENABLE_PERSONAL_STORY_QUEUE=false`). `.env.local` is gitignored; recreate it from `.env.example` + `supabase status` if missing.
4. `npm run dev` → http://localhost:3000.

The local Postgres data volume persists in the VM snapshot, so once seeded you normally just need steps 1, 2, and 4.

### Non-obvious gotchas
- **DB grants after loading the schema.** `supabase/full-schema.sql` has no `GRANT` statements and relies on Supabase default privileges, which the local Postgres image only applies partially. After applying the schema you get `permission denied for table ...` even with the service-role key. Fix once per fresh DB by granting the Supabase roles: run `supabase/full-schema.sql` (via `docker exec -i supabase_db_workspace psql -U postgres -d postgres < supabase/full-schema.sql`) then `GRANT ALL ON ALL TABLES/SEQUENCES/FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;` plus the matching `ALTER DEFAULT PRIVILEGES`. Then `npm run seed:story-library`.
- **Auth has email confirmation disabled locally** (`enable_confirmations = false` in `supabase/config.toml`), so signup returns a session immediately and redirects to `/onboarding/interests` — no email step. The onboarding flow is homepage → `/assessment/{es,fr}` → `/signup?assessment=...` → interests → dashboard → `/stories`. Local emails (if any) land in Mailpit at http://127.0.0.1:54324.
- **Lint noise from `supabase start`.** Running `supabase start` creates `supabase/.temp/` (gitignored) containing a bundled edge-runtime file that ESLint lints, adding ~150 spurious errors. Run `npm run lint` before starting Supabase, or lint with `--ignore-pattern "supabase/**"`. The committed source itself has 3 pre-existing `react-hooks/set-state-in-effect` errors unrelated to setup.
- **AI/third-party features are optional.** With the keys in `.env.example` left blank, the Story Library (the only soft-launched feature) works fully; other AI features degrade gracefully. Add `GEMINI_API_KEY` etc. only when testing those specific features.
