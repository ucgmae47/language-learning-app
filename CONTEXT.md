# LinguaPath — Project Context & Development Log

This document is the living memory of the project. It captures completed work,
technical decisions, known issues, and ideas queued for future implementation.
Update it after every significant session.

---

## Current State (as of Jul 5, 2026)

### What's working / built

| Area | Status | Notes |
|---|---|---|
| Auth + assessment-first onboarding | ✅ | Language → CEFR test → signup (no direct `/signup` without `?assessment=`) |
| Email confirmation → Sign in | ✅ | `/auth/callback` confirms email, signs out, redirects to `/login?confirmed=1` |
| Dashboard spin wheel | ✅ | Arrow navigation only (no scroll hijack) |
| Unified header | ✅ | Single bar: logo, welcome, language control, icon settings/sign out |
| Language control | ✅ | Dropdown to switch added languages + `+` divider for add-language menu |
| Behavioral Interest Engine | ✅ | `user_events` → `topic_scores` → `genre_interests` with anti-binge rules |
| Persistent chat history | ✅ | `chat_sessions` + `chat_messages`, sidebar in `/chat` |
| Personality mirroring (chatbot) | ✅ | `profiles.personality_traits`, analyzed every 5th user message |
| Unified learner context | ✅ | `getUserContext()` feeds stories, chat, starters |
| Story pre-queuing | ✅ | Queued story + queued chat starters via `after()` |
| Daily library cron | ✅ | Nightly + WOTD resume: 1 Gemini library story per lang × CEFR (UTC day) |
| Story reader (paginated) | ✅ | One sentence at a time, EN translation below, word tooltips above |
| ElevenLabs TTS (chatbot) | ⚠️ | Wired up; **free plan cannot use library voices via API** — needs custom Voice Lab IDs |
| 20+ features (games, news, journal, etc.) | ✅ built | Many need API/quota testing — see Testing Queue below |

### Run pending Supabase migrations if not yet applied

```bash
# Run in Supabase SQL Editor (in order if schema is behind):
supabase/behavioral-events-migration.sql   # user_events, topic_scores
supabase/chat-history-migration.sql        # chat_sessions, chat_messages
supabase/personality-migration.sql         # profiles.personality_traits
# Or run the full idempotent dump:
supabase/full-schema.sql
```

---

## Session Log — Jul 4–5, 2026

### Behavioral Interest Engine (committed)

Replaced single-event writes to `genre_interests` with a three-layer pipeline:

1. **`user_events`** — append-only raw event log (news dwell, story quiz, music like, journal save, etc.)
2. **`topic_scores`** — aggregated confidence with session diminishing returns (25%), time decay, source diversity bonus
3. **Promotion to `genre_interests`** — only when score ≥ threshold AND events span ≥ N distinct calendar days

Files: `src/lib/events/{taxonomy,log-event,aggregate}.ts`, `src/app/actions/events.ts`, `supabase/behavioral-events-migration.sql`

Integrated in: news, stories, music, journal, recipes, explore, vocabulary.

### Onboarding & auth polish

- Removed generic "Get started" / "Create account" paths — signup requires completing CEFR assessment first
- `/signup` without `?assessment=es:B1` redirects to `/`
- Assessment result stored in `user_metadata.pending_assessment` when email confirmation required; applied on first login
- Email confirmation link → `/auth/callback?next=/login` → Sign in page with success banner

### Header & language UX

- Merged duplicate dashboard header into global `SiteHeader`
- `LanguageControl` component: active language dropdown (switch between added languages) + `+` button (add un-added languages via assessment)
- Settings and Sign out are icon-only buttons
- "Sign in" hidden when authenticated

### Story reader redesign

- **`TranslatedStoryBody`** now shows **one sentence at a time**
- English translation always visible underneath (no hover)
- Navigate via arrow buttons, scroll wheel, or keyboard arrows
- Slide-up / slide-down animation between sentences
- Word tooltips: click a word → meaning appears **above** the word

### ElevenLabs TTS

- Route: `/api/tts` proxies to ElevenLabs `eleven_multilingual_v2`
- Hook: `use-voice-chat.ts` calls `/api/tts`, falls back to browser `speechSynthesis` on failure
- **Known issue:** Free ElevenLabs plan returns `paid_plan_required` for library voices (e.g. Rachel default)
- **Fix:** Create voices in [Voice Lab](https://elevenlabs.io/voice-lab), set IDs in `.env.local`:
  ```
  ELEVENLABS_VOICE_ES=<your_voice_id>
  ELEVENLABS_VOICE_FR=<your_voice_id>
  ```
- Chat shows amber banner when falling back to browser voice
- Restart dev server after env changes

### Dev environment notes

- Dev server may run on **port 3001** if 3000 is occupied
- Set `NEXT_PUBLIC_APP_URL=http://localhost:3001` and add `http://localhost:3001/auth/callback` to Supabase redirect URLs
- User accounts were cleared via Supabase admin API for fresh onboarding testing

---

## Testing Queue (pick up tomorrow)

Features built but likely need hands-on testing / API quota fixes:

| Feature | Route | Likely issues |
|---|---|---|
| Story generation | `/stories` | Gemini daily quota (429) — queued story fallback works |
| Story tooltips backfill | `/stories` | Same quota limits |
| Chat tutor | `/chat` | ElevenLabs voice (see above); GitHub Models token |
| News | `/news` | `NEWS_API_KEY`, Gemini summarization |
| Journal | `/journal` | Gemini structured output |
| Music | `/music` | YouTube API key optional |
| Sentence Builder | `/sentence-builder` | Gemini generate/judge |
| Pictionary / Chat Room | `/gameroom`, `/chat-room` | Supabase Realtime, RLS |
| Behavioral events | all integrated features | Run `behavioral-events-migration.sql` first |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.x (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| AI — stories, news, journal, etc. | Google Gemini 2.5 Flash Lite |
| AI — chat tutor | GitHub Models `gpt-4o-mini` |
| AI — grammar drills | Groq `llama-3.1-8b-instant` |
| TTS — chatbot | ElevenLabs `eleven_multilingual_v2` (with browser fallback) |
| Email | Resend |
| Deployment target | Vercel |

### Critical API notes

- Pass Gemini key explicitly: `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })`
- GitHub Models: use `github.chat("gpt-4o-mini")` not `github("gpt-4o-mini")`
- Use model slug `gemini-2.5-flash-lite` (stable)
- ElevenLabs `output_format` must be a **query param**, not body field
- Gemini free tier: ~20 req/min + daily quota — custom retry + user-facing 429 messages in story routes

---

## Database Schema Summary

See `supabase/full-schema.sql` for the complete idempotent DDL. Key tables beyond Phase 1:

```
language_profiles       ← per-language CEFR (es, fr)
genre_interests         ← behavioral genre weights (promoted from topic_scores)
user_events             ← raw behavioral event log
topic_scores            ← aggregated topic confidence
chat_sessions           ← persistent tutor conversations
chat_messages           ← messages within sessions
queued_chat_starters    ← pre-generated chat starters
profiles.personality_traits  ← JSONB chatbot mirroring
stories.is_queued       ← pre-generated story flag
stories.sentence_translations / word_translations  ← hover/tooltip data
```

---

## Onboarding Flow (current)

```
Homepage → language card → /assessment/es|fr → /signup?assessment=es:C1
  → email confirmation → /auth/callback → /login?confirmed=1
  → sign in → /onboarding/interests → /dashboard
```

Authenticated users adding a second language: header `+` → assessment → saves to `language_profiles`.

---

## Environment Variables Reference

See `.env.example`. Key additions since Phase 1:

| Variable | Service | Notes |
|---|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs | Chatbot TTS |
| `ELEVENLABS_VOICE_ES` | ElevenLabs | **Required on free plan** — custom Voice Lab ID |
| `ELEVENLABS_VOICE_FR` | ElevenLabs | **Required on free plan** — custom Voice Lab ID |
| `NEWS_API_KEY` | NewsAPI | News feature |
| `GROQ_API_KEY` | Groq | Grammar drill feedback |
| `YOUTUBE_API_KEY` | Google | Music embeds (optional) |

---

## Ideas / Future Work

- Story batching across similar users (reduce API calls) — discussed, not implemented
- Expand CEFR question bank (5+ questions per level)
- Full dark theme on story reader page (currently light card on dark app shell)
- ElevenLabs Starter upgrade ($5/mo) unlocks library voices via API
- Cron job for story/chat pre-queuing (currently uses `after()` on user actions)

### Daily Story Library cron (done)

- `/api/cron/nightly` at 00:05 UTC runs idiom precreate + `generateDailyLibraryStories()`
- One Gemini library story per `es`/`fr` × A1–C2 per UTC day (`src/lib/stories/daily-library.ts`)
- Kill switch: `ENABLE_DAILY_LIBRARY_STORIES=false`

---

## Git / Remote

- Remote: `github.com/ucgmae47/language-learning-app`
- Branch `main` may be ahead of origin — push when ready
