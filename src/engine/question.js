import { PERSONS, TENSES, splitSubject, formFor } from './combos'
import { makeFakes } from './fakes'
import { stageFor } from './scheduler'

export const CHOICES = 4

export function shuffle(list, rng = Math.random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Picks il/elle/on (or ils/elles) at random and returns the prompt pieces:
// `pronoun ___` is shown, `answer` is the pronoun-less form.
export function makeQuestion(combo, rng = Math.random) {
  const variants = Object.keys(combo.forms)
  const variant = variants[Math.floor(rng() * variants.length)]
  const { pronoun, form } = splitSubject(combo.forms[variant])
  return { combo, variant, pronoun, answer: form }
}

const formOf = (index, verb, tense, person, variant) => {
  const combo = index.get(verb, tense, person)
  return combo ? splitSubject(formFor(combo, variant)).form : null
}

const REFLEXIVE = /^(me |te |se |nous |vous |m'|t'|s')/

// Other persons of a pronominal verb carry their own reflexive ("se lève" for "je ___"),
// which gives the answer away — so borrow the answer's reflexive instead ("me lèves").
const withReflexiveOf = (option, answer) => {
  const own = answer.match(REFLEXIVE)?.[0]
  const theirs = option?.match(REFLEXIVE)?.[0]
  return own && theirs ? own + option.slice(theirs.length) : option
}

export function buildChoices(question, card, index, rng = Math.random) {
  const { combo, variant, answer } = question
  const stage = stageFor(card)
  const otherTenses = () => shuffle(
    TENSES.filter(t => t !== combo.tense).map(t => formOf(index, combo.verb, t, combo.person, variant)),
    rng,
  )
  const otherPersons = () => shuffle(
    PERSONS.filter(p => p !== combo.person)
      .map(p => withReflexiveOf(formOf(index, combo.verb, combo.tense, p, variant), answer)),
    rng,
  )
  const madeUp = () => {
    const [mostPlausible, ...rest] = makeFakes(question, index)
    return mostPlausible ? [mostPlausible, ...shuffle(rest, rng)] : []
  }
  const otherVerbs = () => shuffle(index.verbs.filter(v => v !== combo.verb), rng)
    .map(v => formOf(index, v, combo.tense, combo.person, variant))

  const pools = {
    1: [otherTenses, otherPersons],
    2: [otherPersons, otherTenses],
    3: [madeUp, otherPersons, otherTenses],
  }[stage]

  const picked = new Set([answer])
  for (const pool of [...pools, otherVerbs]) {
    for (const option of pool()) {
      if (picked.size === CHOICES) break
      if (option) picked.add(option)
    }
    if (picked.size === CHOICES) break
  }
  return { ...question, stage, choices: shuffle([...picked], rng) }
}
