# LinguaPath

**Live demo:** [https://language-learning-app-vert-eight.vercel.app](https://language-learning-app-vert-eight.vercel.app)

Personalized Spanish & French learning app built with Next.js, Supabase, and AI-assisted features.

## What’s live right now

Soft launch focused on the **Story Library**:

- Graded reading passages with tap-to-translate
- CEFR filters (defaults to your level; All / multi-select available)
- Other wheel features are temporarily locked to control AI costs

Create an account on the live demo to try it.

## Stack

- **Next.js** (App Router)
- **Supabase** (auth + Postgres)
- **Vercel** hosting
- AI providers (Gemini / others) for Premium-path features when enabled

## Local development

```bash
npm install
cp .env.example .env.local
# fill in Supabase + API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

```bash
npm run seed:story-library      # seed free shared stories into Supabase
npm run seed:story-library -- --update-translations  # patch word glosses on existing library rows
npm run generate:story-library  # batch-generate more library stories (needs GEMINI_API_KEY)
npm run generate:crosswords     # offline crossword bank generation
```

### Daily library stories (cron)

Vercel Cron hits `/api/cron/nightly` at **00:05 UTC** (see `vercel.json`). That job:

1. Pre-creates tomorrow’s idiom decks (same as the old idiom cron)
2. Generates **one shared Story Library story per language × CEFR level** (es/fr × A1–C2) via Gemini Flash-Lite

The **08:00 UTC** WOTD cron also resumes the same library fill (idempotent) so leftover combos finish if midnight hit a short function timeout.

Idempotent per UTC day — re-runs skip combos that already have a library story from today. Requires `CRON_SECRET`, `GEMINI_API_KEY`, and Supabase service role on Vercel. Disable with `ENABLE_DAILY_LIBRARY_STORIES=false`.

Manual / local:

```bash
# Same logic as cron (skip if already created today)
npx tsx scripts/generate-library-stories.ts --once-per-day

# Force-generate (ignores today check), optionally narrow scope
npx tsx scripts/generate-library-stories.ts --lang=es --level=B1
```

### Soft-launch env flags

See `.env.example` for:

- `FREE_PREVIEW_STORIES_ONLY=true` — only Stories unlocked
- `DISABLE_TTS=true` — ElevenLabs off
- `ENABLE_PERSONAL_STORY_QUEUE=false` — no per-user AI story pre-generation
- `ENABLE_DAILY_LIBRARY_STORIES=true` — nightly Gemini library fill

## License

Private / personal project unless otherwise noted.
