// Builds src/data/verbs.fr.json from the Lexique frequency list and Lefff conjugations.
//
//   node scripts/generate-verbs.js
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const conjugations = require('french-verbs-lefff/dist/conjugations.json')

const VERB_COUNT = 150
const root = path.join(import.meta.dirname, '..')
const frequencyPath = path.join(import.meta.dirname, 'verb-frequency.fr.tsv')
const outPath = path.join(root, 'src/data/verbs.fr.json')

// Lexique artifacts: adjectives (désolé → désoler), fixed expressions
// (n'importe → importer), and slang not worth drilling.
const EXCLUDE = new Set(['désoler', 'importer', 'foutre', 'baiser', 'ficher'])
// "suis" is counted for suivre as well as être; move it to roughly its real rank.
const DEMOTE = { suivre: 100 }
// Almost always used pronominally, so taught that way.
const PRONOMINAL_ONLY = new Set(['souvenir', 'asseoir', 'taire', 'dépêcher', 'inquiéter', 'marier'])
// Common both ways: the pronominal entry follows the plain one.
const ALSO_PRONOMINAL = new Set(['lever', 'appeler', 'coucher', 'réveiller', 'sentir', 'rappeler', 'occuper', 'tromper'])

// Lefff picks literary forms in a few places; use the everyday ones. { lemma: { code: { personIndex: form } } }
const FORM_OVERRIDES = {
  pouvoir: { P: { 0: 'peux' } },
  taire: { P: { 2: 'tait' } },
}

// Imperatives Lefff lists but nobody uses.
const NO_IMPERATIVE = new Set(['devoir', 'plaire', 'mourir', "s'appeler", 'se sentir', 'valoir',
  'suffire', 'sembler', 'ressembler', "s'inquiéter", 'se tromper'])

// Pronominal verbs whose "se" is an indirect object, so the participle never agrees: "elle s'est rappelé".
const INVARIABLE_PARTICIPLE = new Set(['se rappeler'])

const ETRE_VERBS = new Set([
  'aller', 'venir', 'arriver', 'partir', 'revenir', 'devenir', 'entrer', 'rentrer', 'sortir', 'monter',
  'descendre', 'tomber', 'retourner', 'naître', 'mourir', 'rester', 'apparaître', 'parvenir', 'intervenir',
])

const PERSONS = [
  { label: '1e personne du singulier', subjects: { m: 'je' }, reflexive: 'me', plural: false },
  { label: '2e personne du singulier', subjects: { m: 'tu' }, reflexive: 'te', plural: false },
  { label: '3e personne du singulier', subjects: { m: 'il', f: 'elle', neutral: 'on' }, reflexive: 'se', plural: false },
  { label: '1e personne du pluriel', subjects: { m: 'nous' }, reflexive: 'nous', plural: true },
  { label: '2e personne du pluriel', subjects: { m: 'vous' }, reflexive: 'vous', plural: true },
  { label: '3e personne du pluriel', subjects: { m: 'ils', f: 'elles' }, reflexive: 'se', plural: true },
]
const IMPERATIVE_REFLEXIVE = { 1: 'toi', 3: 'nous', 4: 'vous' }

const SIMPLE_TENSES = {
  'Présent': 'P',
  'Imparfait': 'I',
  'Futur Simple': 'F',
  'Conditionnel Présent': 'C',
  'Subjonctif': 'S',
  'Passé Simple': 'J',
}
const COMPOUND_TENSES = {
  'Passé Composé': 'P',
  'Plus-que-parfait': 'I',
  'Futur Antérieur': 'F',
  'Conditionnel Passé': 'C',
  'Subjonctif Passé': 'S',
}

const ELIDABLE = new Set(['je', 'me', 'te', 'se'])
const VOWEL_START = /^[aeiouyâêîôûäëïöüàéèùœh]/i

// Joins words, eliding je/me/te/se before a vowel or mute h: je + me + arrête → "je m'arrête".
function phrase(words) {
  const parts = words.filter(Boolean)
  let out = parts.at(-1)
  for (let i = parts.length - 2; i >= 0; i--) {
    out = ELIDABLE.has(parts[i]) && VOWEL_START.test(out) ? `${parts[i][0]}'${out}` : `${parts[i]} ${out}`
  }
  return out
}

const usable = form => form && form !== 'NA'

// Lefff participles are [masc sing, masc plur, fem sing, fem plur].
const participle = (forms, gender, plural) => forms.K[(gender === 'f' ? 2 : 0) + (plural ? 1 : 0)]

// One person's value: a plain string, or { m, f, neutral } for il/elle/on and ils/elles.
function personValue(person, make) {
  const entries = Object.entries(person.subjects).map(([variant, subject]) => [variant, make(subject, variant === 'f' ? 'f' : 'm')])
  return entries.length === 1 ? entries[0][1] : Object.fromEntries(entries)
}

function groupOf(infinitive, forms) {
  if (infinitive === 'aller' || infinitive === 'envoyer' || infinitive === 'renvoyer') return 'irregular'
  if (infinitive.endsWith('er')) return 'er'
  if (infinitive.endsWith('ir') && forms.P?.[3]?.endsWith('issons')) return 'ir'
  if (infinitive.endsWith('dre')) {
    const stem = infinitive.slice(0, -2)
    if (forms.P?.[0] === `${stem}s` && forms.K?.[0] === `${stem}u`) return 're'
  }
  return 'irregular'
}

function withOverrides(base) {
  const forms = { ...conjugations[base] }
  for (const [code, byPerson] of Object.entries(FORM_OVERRIDES[base] ?? {})) {
    forms[code] = forms[code].map((form, i) => byPerson[i] ?? form)
  }
  return forms
}

function buildVerb(base, pronominal) {
  const infinitive = pronominal ? phrase(['se', base]) : base
  const forms = withOverrides(base)
  const avoir = conjugations['avoir']
  const etre = conjugations['être']
  const aller = conjugations['aller']
  const impersonal = !usable(forms.P?.[0]) && usable(forms.P?.[2])
  const persons = impersonal ? [PERSONS[2]] : PERSONS
  // Impersonal verbs are only asked with "il".
  const personsFor = list => (impersonal ? list.map(p => ({ ...p, subjects: { m: 'il' } })) : list)
  const reflexive = person => (pronominal ? person.reflexive : null)
  const auxiliary = ETRE_VERBS.has(base) || pronominal ? etre : avoir
  const agrees = auxiliary === etre && !INVARIABLE_PARTICIPLE.has(infinitive)

  const tenses = {}
  const addTense = (name, build) => {
    const table = {}
    personsFor(persons).forEach(person => {
      const index = PERSONS.findIndex(p => p.label === person.label)
      const value = build(person, index)
      if (value) table[person.label] = value
    })
    if (Object.keys(table).length) tenses[name] = table
  }

  for (const [name, code] of Object.entries(SIMPLE_TENSES)) {
    addTense(name, (person, i) => usable(forms[code]?.[i])
      && personValue(person, subject => phrase([subject, reflexive(person), forms[code][i]])))
  }

  if (forms.K) {
    for (const [name, code] of Object.entries(COMPOUND_TENSES)) {
      addTense(name, (person, i) => personValue(person, (subject, gender) => {
        const pp = agrees ? participle(forms, gender, person.plural) : forms.K[0]
        return phrase([subject, reflexive(person), auxiliary[code][i], pp])
      }))
    }
  }

  // aller + infinitive, with the reflexive before the infinitive: "je vais me lever".
  addTense('Futur Proche', (person, i) => personValue(person, subject =>
    phrase([subject, aller.P[i], phrase([reflexive(person), base])])))

  if (!impersonal && forms.Y && !NO_IMPERATIVE.has(infinitive)) {
    addTense('Impératif', (person, i) => usable(forms.Y[i])
      && (pronominal ? `${forms.Y[i]}-${IMPERATIVE_REFLEXIVE[i]}` : forms.Y[i]))
  }

  return {
    infinitive,
    group: groupOf(base, forms),
    pronominal,
    impersonal,
    tenses,
  }
}

function selectVerbs() {
  const lemmas = fs.readFileSync(frequencyPath, 'utf8').trim().split('\n').slice(1)
    .map(line => line.split('\t')[0])
    .filter(lemma => !EXCLUDE.has(lemma) && conjugations[lemma])
  for (const [lemma, rank] of Object.entries(DEMOTE)) {
    lemmas.splice(lemmas.indexOf(lemma), 1)
    lemmas.splice(rank - 1, 0, lemma)
  }
  return lemmas.slice(0, VERB_COUNT).flatMap(lemma => {
    if (PRONOMINAL_ONLY.has(lemma)) return [[lemma, true]]
    if (ALSO_PRONOMINAL.has(lemma)) return [[lemma, false], [lemma, true]]
    return [[lemma, false]]
  })
}

const verbs = selectVerbs().map(([lemma, pronominal]) => buildVerb(lemma, pronominal))
const data = {
  lang: 'fr',
  sources: 'Frequency: Lexique 3.83 (CC BY-SA 4.0). Conjugations: Lefff via french-verbs-lefff (LGPL-LR).',
  verbs,
}
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(data, null, 1) + '\n')
console.log(`Wrote ${verbs.length} verbs to ${path.relative(root, outPath)}`)
