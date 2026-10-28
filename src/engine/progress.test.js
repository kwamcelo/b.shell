import { describe, expect, it } from 'vitest'
import { tenseProgress } from './progress'

// 120 verbs × 2 persons in one tense, plus noise in another tense.
const combos = Array.from({ length: 120 }, (_, v) => ['je', 'tu'].map(person => ({
  id: `v${v}:${person}`,
  verb: `v${v}`,
  tense: 'Présent',
  person,
}))).flat().concat([{ id: 'x', verb: 'v0', tense: 'Imparfait', person: 'je' }])

const learned = { interval: 21 }
const learning = { interval: 3 }

const withVerbs = (count, card = learned) =>
  Object.fromEntries(combos.filter(c => Number(c.verb.slice(1)) < count && c.tense === 'Présent').map(c => [c.id, card]))

describe('tenseProgress', () => {
  it('starts at tier I with nothing mastered', () => {
    expect(tenseProgress(combos, {}, 'Présent')).toEqual({ tier: 1, target: 25, mastered: 0, inProgress: 0, complete: false })
  })

  it('only counts a verb once every person is learned', () => {
    const cards = { 'v0:je': learned, 'v0:tu': learning, 'v1:je': learned, 'v1:tu': learned }
    expect(tenseProgress(combos, cards, 'Présent')).toMatchObject({ mastered: 1, inProgress: 1 })
  })

  it('moves to the next tier once the current one is mastered', () => {
    expect(tenseProgress(combos, withVerbs(25), 'Présent')).toMatchObject({ tier: 2, target: 50, mastered: 25 })
    expect(tenseProgress(combos, withVerbs(50), 'Présent')).toMatchObject({ tier: 3, target: 100, mastered: 50 })
  })

  it('caps the last tier at the number of verbs and reports completion', () => {
    expect(tenseProgress(combos, withVerbs(100), 'Présent')).toMatchObject({ tier: 4, target: 120, mastered: 100 })
    expect(tenseProgress(combos, withVerbs(120), 'Présent')).toEqual({ tier: 4, target: 120, mastered: 120, inProgress: 0, complete: true })
  })
})
