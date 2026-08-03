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
npm run generate:story-library  # batch-generate more library stories (needs GEMINI_API_KEY)
npm run generate:crosswords     # offline crossword bank generation
```

### Soft-launch env flags

See `.env.example` for:

- `FREE_PREVIEW_STORIES_ONLY=true` — only Stories unlocked
- `DISABLE_TTS=true` — ElevenLabs off
- `ENABLE_PERSONAL_STORY_QUEUE=false` — no per-user AI story pre-generation

## License

Private / personal project unless otherwise noted.
