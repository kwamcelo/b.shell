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

// A person's value is a string, or { m, f, neutral } for il/elle/on and ils/elles.
const toForms = value => (typeof value === 'string' ? { m: value } : { ...value })

// Flattens verbs.<lang>.json into one combo per verb × tense × person.
// Verbs are stored in frequency order, so combos come out most-common first.
export function buildCombos(verbData) {
  const { lang } = verbData
  const combos = []
  verbData.verbs.forEach(({ infinitive: verb, group, tenses: tables }, rank) => {
    for (const tense of TENSES) {
      const table = tables[tense]
      if (!table) continue
      for (const person of PERSONS) {
        if (!table[person]) continue
        combos.push({ id: `${lang}:${verb}:${tense}:${person}`, lang, verb, group, rank, tense, person, forms: toForms(table[person]) })
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
