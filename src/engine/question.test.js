import { describe, expect, it } from 'vitest'
import verbData from '../../new_frenchverbs.json'
import { buildCombos, indexCombos, splitSubject } from './combos'
import { buildChoices, makeQuestion, CHOICES } from './question'
import { makeFakes, regularForm } from './fakes'

const combos = buildCombos(verbData)
const index = indexCombos(combos)
const find = (verb, tense, person) => index.get(verb, tense, person)
const NOUS = '1e personne du pluriel'

// Deterministic rng so failures are reproducible.
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

const cardAtStage = { 1: null, 2: { step: 1 }, 3: { step: 3 } }

describe('combos', () => {
  it('splits the subject pronoun from the form', () => {
    expect(splitSubject("j'ai")).toEqual({ pronoun: "j'", form: 'ai' })
    expect(splitSubject('elles sont allées')).toEqual({ pronoun: 'elles', form: 'sont allées' })
    expect(splitSubject('va')).toEqual({ pronoun: '', form: 'va' })
  })

  it('cleans stray spaces after apostrophes', () => {
    expect(find('Se lever', 'Passé Composé', '3e personne du singulier').forms.f).toBe("elle s'est levée")
  })
})

describe('makeQuestion', () => {
  it('picks a gender variant and keeps agreement in the answer', () => {
    const combo = find('Aller', 'Passé Composé', '3e personne du pluriel')
    const answers = new Set()
    const rng = seeded(7)
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(combo, rng)
      answers.add(`${q.pronoun} ${q.answer}`)
    }
    expect(answers).toEqual(new Set(['ils sont allés', 'elles sont allées']))
  })
})

describe('buildChoices', () => {
  const formsWhere = predicate => new Set(
    combos.filter(predicate).flatMap(c => Object.values(c.forms).map(f => splitSubject(f).form)),
  )

  it('stage 1 uses other tenses of the same person', () => {
    const q = buildChoices(makeQuestion(find('Aller', 'Futur Simple', NOUS)), null, index, seeded())
    const samePerson = formsWhere(c => c.verb === 'Aller' && c.person === NOUS)
    expect(q.choices.every(c => samePerson.has(c))).toBe(true)
  })

  it('stage 2 uses other persons of the same tense', () => {
    const q = buildChoices(makeQuestion(find('Aller', 'Futur Simple', NOUS)), { step: 1 }, index, seeded())
    const sameTense = formsWhere(c => c.verb === 'Aller' && c.tense === 'Futur Simple')
    expect(q.choices.every(c => sameTense.has(c))).toBe(true)
  })

  it('keeps the answer\'s reflexive pronoun on other-person options', () => {
    const combo = find('Se lever', 'Présent', '1e personne du singulier')
    const q = buildChoices(makeQuestion(combo), { step: 1 }, index, seeded())
    expect(q.choices.every(c => c.startsWith('me '))).toBe(true)
  })

  it('only regularises verbs with a real regular pattern', () => {
    expect(regularForm('Faire', 'Présent', 0)).toBeNull()
    expect(regularForm('Être', 'Présent', 5)).toBeNull()
    expect(regularForm('Attendre', 'Présent', 2)).toBe('attend')
  })

  it('stage 3 leads with the regularised form', () => {
    expect(regularForm('Aller', 'Futur Simple', 3)).toBe('allerons')
    const q = buildChoices(makeQuestion(find('Aller', 'Futur Simple', NOUS)), { step: 3 }, index, seeded())
    expect(q.choices).toContain('allerons')
  })

  it.each([1, 2, 3])('stage %i always gives 4 distinct choices including the answer, across the dataset', stage => {
    const rng = seeded(stage)
    for (const combo of combos) {
      const q = buildChoices(makeQuestion(combo, rng), cardAtStage[stage], index, rng)
      expect(q.choices).toHaveLength(CHOICES)
      expect(new Set(q.choices).size).toBe(CHOICES)
      expect(q.choices).toContain(q.answer)
    }
  })

  it('never offers a made-up form that is a real form of the verb', () => {
    const rng = seeded(3)
    for (const combo of combos) {
      const real = index.realForms(combo.verb)
      for (const fake of makeFakes(makeQuestion(combo, rng), index)) {
        expect(real.has(fake)).toBe(false)
      }
    }
  })
})
