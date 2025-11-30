# b.shell — Flashcard-Style Verb Practice

Lightweight conjugation practice app with Kahoot-like ease: fast multiple choice prompts that feel like flashcards. Starting with French (Regular vs Irregular); structure ready for Spanish later.

## Feature Specification
- Home screen: two category cards (Regular, Irregular) showing progress %, theme toggle (light/dark, respects system pref), mobile-first layout with large tap targets.
- Quiz flow: prompt “Conjugate VERB at PERSON in TENSE”, four answers (same verb, different tense/person distractors), progress bar, streak/score, per-question feedback, session size 10–20 with no repeats.
- Learning states: unlearned/review/learned; promote after N consecutive correct, demote on miss; bias question selection toward unlearned.
- Data: normalized verb dataset per language with regular/irregular flag, tenses, persons, conjugations. French now; Spanish planned.
- Progress: stored per user/language/category/verb/tense/person with attempts, correct, streak, status, lastSeen; aggregates shown on home cards.
- Theming/accessibility: CSS variables for light/dark palettes, custom font, focus styles, high contrast defaults, animations for answer states.

## Team Split (4-person, minimal overlap)
- Frontend A (UI/Theme): global styles, theme context/toggle, typography, responsive layout, home shell, header/footer, color tokens.
- Frontend B (Quiz UX/Logic): quiz components and flow, question rendering, feedback animations, category selection wiring, API client use.
- Backend A (Data/Schema/API): verb datasets and schema (French now, Spanish-ready), endpoints for verbs/questions, DTO contracts.
- Backend B (Progress/Storage/Auth-lite): progress model and rules, persistence layer, endpoints for progress/prefs, aggregates for home cards.

## Notes
- Stack: React + Vite. ESLint configured.
- Storage: start with local DB/file; keep abstraction to swap later if needed.
