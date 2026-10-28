import { COMPOUND_TENSES, PERSONS, splitSubject, formFor } from './combos'

const IMPARFAIT = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient']
const SUBJONCTIF = ['e', 'es', 'e', 'ions', 'iez', 'ent']
const PASSE_SIMPLE_IR = ['is', 'is', 'it', 'îmes', 'îtes', 'irent']

// Regular endings added to the stem (infinitive minus -er/-ir/-re).
const ENDINGS = {
  er: {
    'Présent': ['e', 'es', 'e', 'ons', 'ez', 'ent'],
    'Imparfait': IMPARFAIT,
    'Subjonctif': SUBJONCTIF,
    'Impératif': [null, 'e', null, 'ons', 'ez', null],
    'Passé Simple': ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
  },
  ir: {
    'Présent': ['is', 'is', 'it', 'issons', 'issez', 'issent'],
    'Imparfait': IMPARFAIT.map(e => `iss${e}`),
    'Subjonctif': SUBJONCTIF.map(e => `iss${e}`),
    'Impératif': [null, 'is', null, 'issons', 'issez', null],
    'Passé Simple': PASSE_SIMPLE_IR,
  },
  re: {
    'Présent': ['s', 's', '', 'ons', 'ez', 'ent'],
    'Imparfait': IMPARFAIT,
    'Subjonctif': SUBJONCTIF,
    'Impératif': [null, 's', null, 'ons', 'ez', null],
    'Passé Simple': PASSE_SIMPLE_IR,
  },
}

const FUTUR = ['ai', 'as', 'a', 'ons', 'ez', 'ont']
const CONDITIONNEL = IMPARFAIT
const PARTICIPLE = { er: 'é', ir: 'i', re: 'u' }

const infinitiveOf = verb => verb.toLowerCase().replace(/^se |^s'/, '')

// Only -dre/-ttre verbs (vendre, mettre) follow a pattern worth regularising;
// faire, être, dire… would produce nonsense like "faiu".
const groupOf = infinitive => {
  if (/(dre|ttre)$/.test(infinitive)) return 're'
  const ending = infinitive.slice(-2)
  return ending === 'er' || ending === 'ir' ? ending : null
}

// What the verb would look like if it were regular — e.g. aller → "allerons".
export function regularForm(verb, tense, personIndex) {
  const infinitive = infinitiveOf(verb)
  const group = groupOf(infinitive)
  if (!group) return null
  const stem = infinitive.slice(0, -2)
  if (tense === 'Futur Simple' || tense === 'Conditionnel Présent') {
    const futureStem = group === 're' ? infinitive.slice(0, -1) : infinitive
    return futureStem + (tense === 'Futur Simple' ? FUTUR : CONDITIONNEL)[personIndex]
  }
  const ending = ENDINGS[group][tense]?.[personIndex]
  return ending == null ? null : stem + ending
}

export const regularParticiple = verb => {
  const infinitive = infinitiveOf(verb)
  const group = groupOf(infinitive)
  return group ? infinitive.slice(0, -2) + PARTICIPLE[group] : null
}

const ACCENT_SWAPS = [['é', 'è'], ['é', 'e'], ['è', 'é'], ['ê', 'e'], ['â', 'a'], ['î', 'i'], ['û', 'u'], ['ç', 'c'], ['e', 'é']]
const VOWEL = 'aeiouyéèêâîôû'

// Typical learner slips: wrong accent, doubled or undoubled consonant, -ger/-cer spelling.
export function mutations(word) {
  const out = []
  if (/ge[aoâ]/.test(word)) out.push(word.replace(/ge([aoâ])/, 'g$1'))
  if (/g[aoi]/.test(word)) out.push(word.replace(/g([aoi])/, 'ge$1'))
  if (/ç[aoâ]/.test(word)) out.push(word.replace(/ç([aoâ])/, 'c$1'))
  for (const [from, to] of ACCENT_SWAPS) {
    if (word.includes(from)) out.push(word.replace(from, to))
  }
  for (const c of 'lntrmps') {
    if (word.includes(c + c)) out.push(word.replace(c + c, c))
    const single = new RegExp(`([${VOWEL}])${c}([${VOWEL}])`)
    if (single.test(word)) out.push(word.replace(single, `$1${c}${c}$2`))
  }
  return out
}

// Plausible wrong forms for a question's answer, most plausible (regularised) first.
// Anything that is a real form of the verb is dropped.
export function makeFakes(question, index) {
  const { combo, answer } = question
  const personIndex = PERSONS.indexOf(combo.person)
  const words = answer.split(' ')
  const prefix = words.slice(0, -1)
  let last = words.at(-1)
  // Keep an elided reflexive ("m'appelle") attached but out of the way.
  const elided = last.match(/^[mts]'/)?.[0] ?? ''
  last = last.slice(elided.length)

  const candidates = []
  if (COMPOUND_TENSES.has(combo.tense)) {
    const participle = regularParticiple(combo.verb)
    const base = index.get(combo.verb, combo.tense, PERSONS[0])
    const baseParticiple = base && splitSubject(formFor(base, 'm')).form.split(' ').at(-1)
    const agreement = baseParticiple && last.startsWith(baseParticiple) ? last.slice(baseParticiple.length) : ''
    if (participle) candidates.push(participle + agreement)
  } else if (combo.tense !== 'Futur Proche') {
    const regular = regularForm(combo.verb, combo.tense, personIndex)
    if (regular) candidates.push(regular)
  }
  candidates.push(...mutations(last))

  const real = index.realForms(combo.verb)
  const seen = new Set()
  return candidates
    .map(word => [...prefix, elided + word].join(' '))
    .filter(fake => {
      if (fake === answer || real.has(fake) || seen.has(fake)) return false
      seen.add(fake)
      return true
    })
}
