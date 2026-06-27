# LinguaPath — Project Context & Development Log

This document is the living memory of the project. It captures completed work,
technical decisions, known issues, and ideas queued for future implementation.
Update it after every significant session.

---

## Current State (as of Jun 27, 2026)

### Phase 1: Complete ✅

| Feature | Route / File | Status |
|---|---|---|
| Supabase Auth (signup/login/logout) | `/login`, `/signup`, `actions/auth.ts` | ✅ |
| Session management (proxy.ts) | `src/proxy.ts` | ✅ |
| CEFR Assessment Quiz | `/assessment` | ✅ |
| Word of the Day widget | `/dashboard` | ✅ |
| WOTD daily email (Vercel Cron) | `/api/cron/wotd-email` | ✅ |
| AI Story Generation (Gemini 2.5) | `/stories`, `/api/stories/generate` | ✅ |
| Story genre topic selector | `components/stories/story-generator.tsx` | ✅ |
| Post-reading comprehension quiz | `/stories/[id]/quiz` | ✅ |
| Chat tutor "Lucía" (GitHub Models) | `/chat`, `/api/chat` | ✅ |
| AI-generated personalised chat starters | `lib/chat/generate-starters.ts` | ✅ |
| Interest tracking tables (DB only) | `supabase/schema.sql` | ✅ schema only |
| Git + GitHub remote | `github.com/ucgmae47/language-learning-app` | ✅ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.x (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| AI — stories | Google Gemini 2.5 Flash Lite (`@ai-sdk/google`) |
| AI — chat | GitHub Models `gpt-4o-mini` via OpenAI-compatible API |
| AI — chat starters | Google Gemini 2.5 Flash Lite |
| Email | Resend |
| Deployment target | Vercel (Free Tier) |

### Critical API notes

- `@ai-sdk/google` reads `GOOGLE_GENERATIVE_AI_API_KEY` by default.
  **We pass the key explicitly** via `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })` to avoid renaming the env var.
- `@ai-sdk/openai` v4 defaults to the **Responses API** (`/responses` endpoint).
  GitHub Models only supports Chat Completions. **Always use `github.chat("model-id")`** instead of `github("model-id")`.
- `gemini-2.0-flash` and `gemini-1.5-flash` are unavailable on the free tier with
  a new project. Use `gemini-2.5-flash-lite` (confirmed working).
- The GitHub token needs the **GitHub Copilot / Models** account permission
  (found under fine-grained token → "Account permissions").

---

## Database Schema Summary

See `supabase/schema.sql` for the full schema. Key tables:

```
auth.users          ← managed by Supabase Auth
profiles            ← display_name, cefr_level, streak_count, stories_read
user_interests      ← topic (enum), weight (int), user_id
session_metrics     ← per-day engagement stats
word_of_day_logs    ← which word each user saw per date
stories             ← AI-generated passages + quiz JSONB
story_attempts      ← quiz scores per user per story
```

RPC function `increment_stories_read(uid)` must be created manually in Supabase
SQL Editor if running a fresh schema (included in schema.sql).

---

## Ideas Queued for Future Implementation

### 🔴 HIGH PRIORITY — Behavioural Interest Graph

**What:** Track what topics/themes a user gravitates toward over time and use that
signal to personalise every surface of the app — story prompts, chat topics, word
selections, email content.

**Why it matters:** The `user_interests` table already exists with a `weight` column
designed for this. Right now weights are static (set at onboarding, never updated).
Making them dynamic is the single highest-leverage personalization improvement.

**Signal sources (ranked by strength):**

| Signal | Event | Weight delta |
|---|---|---|
| Story genre selection | User picks "Romance" in topic picker | +3 |
| Story read completion | User finishes a story on a topic | +2 |
| Story quiz score ≥ 4/5 | Strong comprehension = genuine interest | +1 |
| Chat conversation topic | AI detects topic cluster in conversation | +1 |
| Word of Day interaction | User clicks to learn more | +1 |
| Topic not engaged | User skips story of a genre repeatedly | −1 |

**Implementation plan:**

1. **Story topic selection** (easiest — already captured in API route):
   In `/api/stories/generate/route.ts`, after saving the story, upsert
   `user_interests` for the selected genre:
   ```typescript
   if (selectedTopic) {
     await supabase.from("user_interests").upsert(
       { user_id: user.id, topic: selectedTopic, weight: 1 },
       { onConflict: "user_id,topic", ignoreDuplicates: false }
     );
     // Or better: call an RPC that does weight += 3 with a cap
   }
   ```

2. **Chat topic detection** (medium):
   At the end of a chat session (or periodically), send the last N messages to
   Gemini with a prompt like: "List the top 1–2 topics discussed in this
   conversation from this enum: [fantasy, mystery, romance, ...]". Upsert the
   result into `user_interests`.

3. **Weight decay** (important for freshness):
   Add a Supabase scheduled function (pg_cron) or Vercel Cron that runs weekly:
   ```sql
   UPDATE user_interests SET weight = GREATEST(0, weight - 1)
   WHERE updated_at < NOW() - INTERVAL '14 days';
   ```
   This ensures old signals fade and recent behavior dominates.

4. **Schema addition needed** — add `interest_slug` support for the story genres
   (currently the `interest_topic` enum is a fixed set; the story topic picker uses
   free-text strings). Options:
   - Extend the `interest_topic` enum to include genres like `fantasy`, `mystery`, etc.
   - Or store genre interests in a separate `genre_interests` table with a text column.

5. **Consumption** — wherever we currently read interests (story generation prompt,
   chat system prompt, WOTD email), the ranked interest list by weight will
   automatically improve the output once weights are dynamic.

---

### Phase 2 — French Language Support + Content Library Expansion

- Add a `language` field to `profiles` (default `'es'`, add `'fr'`)
- Parameterise all prompts with `targetLanguage` instead of hardcoded "Spanish"
- Expand the WOTD bank for French
- Daily crossword puzzle component (local state, vocabulary-focused)
- Curated public-domain story bank (Project Gutenberg excerpts, adapted)

### Phase 3 — Grammar Drills & Conjugation Engine

- New table: `grammar_weaknesses (user_id, verb_form, error_count, last_seen)`
- Drill engine: Groq or Cerebras free tier (ultra-fast Llama inference) for
  real-time correction feedback
- Idiom/expression flashcard system (flip card UI component)

### Phase 4 — Personalization Engine Refinement

- Implement the behavioural interest graph (see above)
- Real-time adaptation: if `session_metrics.quiz_score_avg < 0.5` for 3 days,
  downgrade CEFR level and surface easier content
- A/B test: does sending the WOTD email in the morning vs. evening affect DAU?

### Phase 5 — Voice Chat & Speaking Practice

- Speech-to-text input in `/chat` using the Web Speech API (free, browser-native)
- Text-to-speech playback of Lucía's responses using the Web Speech API
- Or: integrate Cartesia / ElevenLabs free tier for higher-quality voice

---

## Phase 1 Polish Items (deferred)

These were discussed and deliberately deferred:

1. **Sentence/word translation tooltips on story reader** — hover a sentence to
   see its English translation; hover a word within to see word-level translation.
   Needs: story text tokenised into sentences, Gemini translation call on hover
   (debounced), two-level tooltip UI. Save for Phase 2.

2. **CEFR question bank expansion** — currently ~8 questions (A2/B1/B2 only).
   Target: 5 quality questions per level × 6 active levels = 30 questions minimum.
   Consider AI-generated adaptive assessment in Phase 4 instead of expanding the
   static bank.

3. **Onboarding interest selection UI** — the `user_interests` table is wired up
   but users have no UI to set initial interests. Add a step after CEFR assessment
   that shows a grid of topic chips and saves selections.

4. **User settings page** — display name, language preference, email notification
   toggle, CEFR level override.

---

## Environment Variables Reference

See `.env.example` for all required keys. The mapping:

| Variable | Service | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server-only — never expose |
| `GEMINI_API_KEY` | Google AI Studio | Used explicitly, not via SDK env auto-detect |
| `RESEND_API_KEY` | Resend | For WOTD emails |
| `WOTD_FROM_EMAIL` | Resend | Must be a verified sender domain |
| `CRON_SECRET` | Vercel | Secures `/api/cron/wotd-email` |
| `GITHUB_TOKEN` | GitHub Models | Needs "GitHub Copilot/Models" account permission |
| `NEXT_PUBLIC_APP_URL` | App | Used in email CTAs |
