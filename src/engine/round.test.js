import { describe, expect, it } from 'vitest'
import { buildRound, finishRound, reviewsLeftToday, ROUND_SIZE, NEW_PER_ROUND } from './round'
import { createInitialState } from './storage'

const combos = Array.from({ length: 60 }, (_, i) => ({
  id: `c${i}`,
  tense: i % 3 === 0 ? 'Imparfait' : 'Présent',
}))

const stateWith = (cards, overrides = {}) => ({
  ...createInitialState(),
  cards,
  settings: { tenses: ['Présent'], dailyTarget: 3 },
  ...overrides,
})

const dueCard = (lapses = 0, step = 1) => ({ step, interval: 3, due: 50, reps: 2, lapses, reviewedAt: 0 })

describe('buildRound', () => {
  it('only uses the selected tenses', () => {
    const round = buildRound(stateWith({}), combos, 100)
    expect(round.every(c => c.tense === 'Présent')).toBe(true)
  })

  it('fills a round with new combos in frequency order when nothing is due', () => {
    const round = buildRound(stateWith({}), combos, 100)
    const expected = combos.filter(c => c.tense === 'Présent').slice(0, ROUND_SIZE).map(c => c.id)
    expect(round.map(c => c.id).sort()).toEqual(expected.sort())
  })

  it('leaves room for new combos and picks the weakest due reviews', () => {
    const cards = {}
    combos.filter(c => c.tense === 'Présent').slice(0, 30).forEach((c, i) => {
      cards[c.id] = dueCard(i === 29 ? 5 : 0)
    })
    const round = buildRound(stateWith(cards), combos, 100)
    const reviews = round.filter(c => cards[c.id])
    expect(reviews).toHaveLength(ROUND_SIZE - NEW_PER_ROUND)
    expect(reviews.map(c => c.id)).toContain(combos.filter(c => c.tense === 'Présent')[29].id)
  })

  it('stops serving reviews once the daily cap is used', () => {
    const cards = Object.fromEntries(combos.slice(0, 40).map(c => [c.id, dueCard()]))
    const state = stateWith(cards, { daily: { day: 100, rounds: 3, reviews: 3 * ROUND_SIZE } })
    expect(reviewsLeftToday(state, 100)).toBe(0)
    expect(buildRound(state, combos, 100).every(c => !cards[c.id])).toBe(true)
    expect(reviewsLeftToday(state, 101)).toBe(3 * ROUND_SIZE)
  })
})

describe('finishRound', () => {
  it('updates cards, daily progress, streak and the summary', () => {
    const state = stateWith({ c1: dueCard() })
    const { state: next, summary } = finishRound(state, [
      { id: 'c1', correct: true },
      { id: 'c2', correct: false },
      { id: 'c4', correct: true },
    ], 100, 0)
    expect(summary).toEqual({ correct: 2, total: 3, misses: ['c2'], newCount: 2, strengthened: 1 })
    expect(next.cards.c1.step).toBe(2)
    expect(next.cards.c2.due).toBe(101)
    expect(next.daily).toEqual({ day: 100, rounds: 1, reviews: 1 })
    expect(next.streak.current).toBe(1)
  })
})
