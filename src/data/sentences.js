import { PERSONS } from '../engine/combos'

// Example sentences live in one file per verb (sentences/fr/<slug>.json) and are
// fetched on demand, so they don't weigh on the first load. Files key persons by
// pronoun: { "Présent": { "je": "...", "tu": "...", "il": "...", ... } }.
const loaders = import.meta.glob('./sentences/fr/*.json', { import: 'default' })

const PERSON_KEYS = ['je', 'tu', 'il', 'nous', 'vous', 'ils']
const LABEL = Object.fromEntries(PERSON_KEYS.map((key, i) => [key, PERSONS[i]]))

export const slugOf = verb => verb.replace(/['\s]+/g, '-')

// { tense: { je: s } } → { tense: { '1e personne du singulier': s } }; unknown keys are kept as-is.
export const expandPersons = tenses => Object.fromEntries(Object.entries(tenses).map(([tense, persons]) => [
  tense,
  Object.fromEntries(Object.entries(persons).map(([key, sentence]) => [LABEL[key] ?? key, sentence])),
]))

const bySlug = new Map(Object.entries(loaders).map(([path, load]) => [path.match(/([^/]+)\.json$/)[1], load]))
const cache = new Map()

// Resolves to { [tense]: { [person]: sentence } }, or null when the verb has none yet.
export function loadSentences(verb) {
  if (!cache.has(verb)) {
    const load = bySlug.get(slugOf(verb))
    cache.set(verb, load ? load().then(file => expandPersons(file.tenses)).catch(() => null) : Promise.resolve(null))
  }
  return cache.get(verb)
}
