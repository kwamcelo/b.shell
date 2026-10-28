# b.shell — L'Art de conjuguer

A phone-first French conjugation trainer. Short multiple-choice rounds, spaced repetition per verb/tense/person, works offline. Solo project, for me and a few friends.

## Design

### Platform
- React + Vite single-page app, installable PWA, works offline.
- Deployed to Netlify (`*.netlify.app`); every push to `main` goes live, branches get preview URLs.
- No backend in v1: progress lives on the device. All reads/writes go through one storage module so Supabase sync can be added in v2.

### What you practise
- The unit of learning is a **combination**: verb × tense × person (e.g. *aller / Futur Simple / nous*).
- You pick which tenses to drill on the home screen (remembered). No Easy/Medium/Hard.
- 13 tenses: Présent, Passé Composé, Imparfait, Futur Simple, Conditionnel Présent, Futur Proche, Subjonctif, Plus-que-parfait, Conditionnel Passé, Subjonctif Passé, Futur Antérieur, Impératif (tu/nous/vous only), Passé Simple.
- ~150 verbs from the Lexique frequency list, tagged regular -er / -ir / -re / irregular, introduced most-frequent first. Impersonal verbs (*falloir*, *pleuvoir*) are asked in *il* only; pronominal verbs are included.
- Data and progress carry `lang: "fr"`; nothing else is built for other languages yet.

### Learning engine
- Spaced repetition: each combination has a due date. Correct answers push it out (1 → 3 → 7 → 21 days, then ×2.5); a miss brings it back tomorrow.
- Rounds of ~15 questions: due reviews first, plus ~5 new combinations taken from the most frequent unfinished verb within the selected tenses.
- Reviews are capped at ~3 rounds' worth per day; any overflow rolls to later days, weakest first. Nothing piles up.
- New combinations are quizzed immediately (no teaching card). A lucky first guess only schedules it for tomorrow.
- Distractors get harder with mastery:
  1. new/shaky: same person, other tenses
  2. getting there: same tense, other persons
  3. well known: plausible made-up forms (e.g. *allerons*), checked never to be real forms

### Screens
- **Question card:** verb large, tense label, prompt like `ils ___`, four verb-form choices without pronouns. *il/elle/on* and *ils/elles* are picked at random; compound tenses use the agreeing participle.
- **After answering:** correct → short flash, auto-advance. Wrong → correct form shown in an example sentence, a WordReference button, and *Continuer*.
- **Home:** streak + today's progress, big Practice button within thumb reach, tense toggles, per-tense progress bars.
- **End of round:** score, streak, daily progress, list of misses (with WordReference links), "+N new · M strengthened", *Encore une manche* / *Accueil*.
- **Streak:** one round a day keeps it alive; daily target is adjustable (default 3 rounds); one freeze per week.
- UI is in French, with every string in one file so English can be added later.
- Lato, light/dark themes. Brand colour is deep blue/ink so green only ever means "correct".

### Data
- `src/data/verbs.fr.json` is generated, never hand-edited: `npm run verbs` rebuilds it from `scripts/verb-frequency.fr.tsv` (top verbs by spoken frequency) and Lefff conjugations. Overrides (excluded artifacts, pronominal verbs, être verbs) live at the top of `scripts/generate-verbs.js`.
- To refresh the frequency list, download [Lexique 3.83](http://www.lexique.org/) and run `node scripts/rank-verbs.js path/to/Lexique383.tsv`.
- ~6,900 example sentences, one per combination, written once in Claude Code and stored with the verb data. A check script verifies each sentence contains the exact form from the verb data.
- Progress protection in v1: `navigator.storage.persist()`, Export/Import of a backup file, install-to-home-screen prompt.

### Later, maybe
Typing mode (may be dropped), Supabase sync, Spanish, English UI.

## Build order
1. Learning engine — scheduler, rounds, distractors, streak, storage (pure logic, Vitest)
2. Data — Lexique verb list, regular/irregular tags, generator adds Impératif + Passé Simple
3. Go live — React + Vite app on Netlify, compact question card, new palette; remove the old pages
4. Home screen + end-of-round screen
5. Example sentences + wrong-answer screen
6. Polish — PWA/offline, persistent storage, Export/Import

## Development
```sh
npm install
npm run dev     # local dev server
npm test        # engine + data tests
npm run verbs   # regenerate src/data/verbs.fr.json
```

## Credits
- Verb frequencies: Lexique 3.83 — New, B., Pallier, C. et al., [lexique.org](http://www.lexique.org/) (CC BY-SA 4.0). `scripts/verb-frequency.fr.tsv` is derived from it under the same licence.
- Conjugations: [Lefff](http://pauillac.inria.fr/~sagot/index.html#lefff) (LGPL-LR) via `french-verbs-lefff`.
