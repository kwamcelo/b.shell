# b.shell — Flashcard-Style Verb Practice

Lightweight conjugation practice app with Kahoot-like ease: fast multiple choice prompts that feel like flashcards. Starting with French, built to expand to Spanish.

## Feature Specification
- Home screen: difficulty cards (Easy, Medium, Hard) with progress %, theme toggle (sun/moon, light/dark, respects system pref), mobile-first layout with large tap targets.
- Level screen (per difficulty): shows progress bar for that difficulty and offers Review / Unlearned entry points.
- Quiz flow: prompt “Conjugate VERB at PERSON in TENSE”, four answers (same verb, different tense/person distractors), progress bar, streak/score, per-question feedback, session size 10–20 with no repeats.
- Learning states: unlearned/review/learned; promote after N consecutive correct, demote on miss; bias question selection toward unlearned.
- Data: normalized verb dataset per language with difficulty tagging, tenses, persons, conjugations. French now; Spanish planned.
- Progress: stored per user/language/difficulty/verb/tense/person with attempts, correct, streak, status, lastSeen; aggregates shown on home cards and per-level page.
- Theming/accessibility: CSS variables for light/dark palettes, custom font, focus styles, high contrast defaults, animations for answer states; persistent theme toggle visible on all pages.

## Team Split (4-person, minimal overlap)
- Frontend A (UI/Theme): global styles, theme context/toggle, typography, responsive layout, home shell, header/footer, color tokens.
- Frontend B (Quiz UX/Logic): quiz components and flow, question rendering, feedback animations, category selection wiring, API client use.
- Backend A (Data/Schema/API): verb datasets and schema (French now, Spanish-ready), difficulty tagging, endpoints for verbs/questions, DTO contracts.
- Backend B (Progress/Storage/Auth-lite): progress model and rules, persistence layer, endpoints for progress/prefs, aggregates for home + per-difficulty pages.

## Notes
- Stack: React + Vite. ESLint configured.
- Storage: start with local DB/file; keep abstraction to swap later if needed.
