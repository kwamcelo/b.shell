export const PERSONS = [
  '1e personne du singulier',
  '2e personne du singulier',
  '3e personne du singulier',
  '1e personne du pluriel',
  '2e personne du pluriel',
  '3e personne du pluriel',
]

export const TENSES = [
  'Présent',
  'Passé Composé',
  'Imparfait',
  'Futur Simple',
  'Conditionnel Présent',
  'Futur Proche',
  'Subjonctif',
  'Plus-que-parfait',
  'Conditionnel Passé',
  'Subjonctif Passé',
  'Futur Antérieur',
  'Impératif',
  'Passé Simple',
]

export const COMPOUND_TENSES = new Set([
  'Passé Composé',
  'Plus-que-parfait',
  'Conditionnel Passé',
  'Subjonctif Passé',
  'Futur Antérieur',
])

const SUBJECT = /^(je |j'|tu |il |elle |on |nous |vous |ils |elles )/

// The generator sometimes leaves a space after an apostrophe ("s' est").
const clean = phrase => phrase.replace(/'\s+/g, "'").trim()

const toForms = value => {
  if (typeof value === 'string') return { m: clean(value) }
  const entry = value?.[0] ?? {}
  const forms = {}
  for (const key of ['m', 'f', 'neutral']) {
    if (entry[key]) forms[key] = clean(entry[key])
  }
  return forms
}

// Flattens the verb JSON into one combo per verb × tense × person.
// Verb order in the JSON is frequency order, so combos come out most-common first.
export function buildCombos(verbData, { lang = 'fr' } = {}) {
  const combos = []
  Object.keys(verbData).forEach((verb, rank) => {
    const tables = verbData[verb][0]
    for (const tense of TENSES) {
      const table = tables[tense]?.[0]
      if (!table) continue
      for (const person of PERSONS) {
        if (!table[person]) continue
        const forms = toForms(table[person])
        if (!Object.keys(forms).length) continue
        combos.push({ id: `${lang}:${verb}:${tense}:${person}`, lang, verb, rank, tense, person, forms })
      }
    }
  })
  return combos
}

export function splitSubject(phrase) {
  const match = phrase.match(SUBJECT)
  if (!match) return { pronoun: '', form: phrase }
  return { pronoun: match[1].trim(), form: phrase.slice(match[1].length) }
}

export const formFor = (combo, variant) =>
  combo.forms[variant] ?? combo.forms.m ?? Object.values(combo.forms)[0]

export function indexCombos(combos) {
  const byKey = new Map()
  const formsByVerb = new Map()
  for (const combo of combos) {
    byKey.set(`${combo.verb}|${combo.tense}|${combo.person}`, combo)
    if (!formsByVerb.has(combo.verb)) formsByVerb.set(combo.verb, new Set())
    for (const phrase of Object.values(combo.forms)) {
      formsByVerb.get(combo.verb).add(splitSubject(phrase).form)
    }
  }
  return {
    verbs: [...formsByVerb.keys()],
    get: (verb, tense, person) => byKey.get(`${verb}|${tense}|${person}`),
    realForms: verb => formsByVerb.get(verb) ?? new Set(),
  }
}
