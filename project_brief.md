# PROJECT BRIEF: Personalized Language Learning Platform
## OVERVIEW
Build an adaptive, personalized language learning application that combines the best features from existing platforms (Spanish Dict, Fluency Drop, Lucia) into a unified experience. The app targets intermediate learners and focuses on creating an engaging, personalized journey rather than competing with established AI capabilities.
## DEVELOPMENT WORKSPACE & TOOLING ($0 Stack)
 * **Primary IDE:** **Cursor Pro** (Activated via Free Student Year). The core development engine will utilize Cursor's **Composer Mode (Cmd + I)** for multi-file code generation and continuous feature integration.
 * **Autocompletion AI:** **GitHub Copilot** (Activated via Free Student GitHub Pack). Used for passive inline code-completions during manual edits.
## TARGET AUDIENCE & SCOPE
 * **Primary audience:** Intermediate language learners at B1-B2 CEFR levels.
 * **Initial launch languages:** Spanish and French.
 * **Future expansion:** German, Russian, then Chinese (which requires separate UI design due to character system).
 * **Business model:** Launch free, gather user feedback, introduce freemium tier later with optional premium features.
## PRODUCTION ARCHITECTURE & TECH STACK ($0 Infrastructure)
 * **Frontend & Backend Orchestration:** **Next.js (App Router) + TypeScript**. This single-codebase architecture allows Cursor to write both client UI components and secure backend endpoints simultaneously.
 * **Styling & UI:** **Tailwind CSS**. Chosen for rapid UI iteration, enabling natural-language design prompts in Cursor Composer.
 * **Database & Authentication:** **Supabase (Free Tier)**. Managed PostgreSQL database to store user authentication state, grammar weakness maps, interest vectors, and daily engagement metrics.
 * **Deployment:** **Vercel (Free Tier)**. Connects directly to GitHub for automated, continuous deployment (CI/CD) on every code push.
 * **Unified AI Gateway:** **Vercel AI SDK (npm i ai)**. A standard library abstraction layer allowing the application to alternate between different underlying AI models by changing just a few lines of code.
## CORE FEATURES & TECHNICAL ROUTING
### 1. Daily Engagement Features
 * **Daily Crossword Puzzles:** Vocabulary-focused, interactive grid components with integrated dictionary search. Built with local state tracking in React.
 * **Word of the Day:** Automated widget presenting a daily curated word, example usage, and translations.
 * **Purpose:** Keep users coming back with low-friction daily habits.
### 2. Reading & Comprehension
 * **Short Stories:** 5–10 paragraphs per story.
 * **Content Sources:** AI-generated stories, curated public domain/Creative Commons content, and news articles for advanced learners.
 * **Adaptive Length:** Shorter for B1, longer for B2.
 * **Interactive Quizzes:** Served after each story with immediate visual feedback (green highlights for correct answers, celebration pop-ups utilizing canvas-confetti).
 * **Technical Pipeline:** Orchestrated on the backend via **Google AI Studio (Gemini Flash API Free Tier)** for zero-cost, high-throughput story and quiz generation.
### 3. Speaking & Conversation Practice
 * **Text-Based Chatbot:** Interface for conversational typing practice.
 * **Voice/Audio Chat:** Feature allowing speech-to-text and text-to-speech interaction.
 * **Chatbot Personality:** Remembers user preferences and interests, provides encouragement, and adapts topics to what engages the learner.
 * **Technical Pipeline:** Powered via **GitHub Models API (Free Tier Access to Claude 3.5 Sonnet / GPT-4o mini)** hooked into the Vercel AI SDK to stream responses seamlessly to the client.
### 4. Grammar & Structure Practice
 * **Conjugation Drills:** Tailored to the user’s weak areas, pulling from a personal profile stored in the Supabase DB.
 * **Grammar Explanations:** Introduced contextually based on drill failures.
 * **Idioms & Expressions:** Interactive flashcard/matching systems.
 * **Technical Pipeline:** Leverages high-speed inference endpoints (**Groq or Cerebras API Free Tiers**) running ultra-fast open-source models (like Llama) to deliver instantaneous, real-time grammar corrections.
### 5. Personalization & Assessment
 * **Initial CEFR Assessment:** Onboarding quiz to baseline user proficiency.
 * **Adaptive Content Scaling:** System logic adjusts model prompts dynamically based on user history.
 * **Interest Mapping & Content Recommendations:** A user preference profile is updated in Supabase after every session. When generating stories, the Next.js API injects these preferences directly into the LLM system prompt.
 * **Real-Time Adaptation:** System monitors engagement metrics. If failure rates spike in grammar drills, the backend switches execution modes to serve lighter, high-engagement conversational or gaming content.
## KEY DIFFERENTIATORS FROM EXISTING PLATFORMS
 1. **True Personalization:** Unlike generic paths (Duolingo/Babbel), this system dynamically alters its prompt contexts based on tracked state, adapting to fatigue and interest.
 2. **Unified Multi-Feature Experience:** Merges Spanish Dict’s games, Fluency Drop’s stories, and Lucia’s custom chat into a single, cohesive user experience.
 3. **Interactive Feedback:** Enhances basic reading with immediate, gamified assessment elements.
 4. **Smart Content Curation:** Focuses on code orchestration (knowing what prompt to serve and when, based on database records) rather than raw content generation.
## BUSINESS MODEL
 * **Launch:** Completely free with unobtrusive ads (Spanish Dict model).
 * **Validation Phase:** Gather user feedback, identify which features drive retention.
 * **Scale Phase:** Introduce a freemium tier (Basic features free; Premium features like unlimited stories, advanced quizzes, priority chatbot access, and zero ads for $5–$10/month).
 * **Revenue Goal:** Sustainable student income, not venture-scale growth.
## DEVELOPMENT PRIORITIES
### Phase 1: MVP with Spanish Language Support
 * Setup Next.js environment, initialize Tailwind CSS, and wire up Supabase Auth.
 * Build the initial CEFR assessment quiz module.
 * Implement 3–5 sample stories with post-reading quizzes powered by the Gemini API.
 * Develop the daily Word of the Day widget and database log.
 * Deploy a basic text chatbot using the Vercel AI SDK and GitHub Models.
 * Create fundamental interest-tracking tables in Supabase.
### Phase 2: Add French, Expand Content Library
### Phase 3: Grammar Drills & Conjugation Engine
### Phase 4: Personalization Engine Refinement (Data-Driven Prompts)
### Phase 5: Voice Chat and Speaking Practice Integration
## SUCCESS METRICS
 * High percentage of users returning daily (Daily Active Users / Monthly Active Users ratio).
 * Positive feedback on personalization.
 * Data demonstrating that content recommendations dynamically alter based on the user profile.