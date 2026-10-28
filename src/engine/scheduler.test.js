import { describe, expect, it } from 'vitest'
import { review, stageFor, statusOf } from './scheduler'

describe('review', () => {
  it('schedules a first correct answer for tomorrow only', () => {
    const card = review(null, true, 100, 0)
    expect(card).toMatchObject({ step: 0, interval: 1, due: 101, reps: 1, lapses: 0 })
  })

  it('climbs the 1 → 3 → 7 → 21 ladder, then grows ×2.5', () => {
    let card = null
    const intervals = []
    for (let i = 0; i < 6; i++) {
      card = review(card, true, 100)
      intervals.push(card.interval)
    }
    expect(intervals).toEqual([1, 3, 7, 21, 53, 133])
  })

  it('sends a miss back to tomorrow and counts the lapse', () => {
    let card = null
    for (let i = 0; i < 4; i++) card = review(card, true, 100)
    card = review(card, false, 200)
    expect(card).toMatchObject({ step: 0, interval: 1, due: 201, lapses: 1, reps: 5 })
  })
})

describe('stageFor / statusOf', () => {
  it('maps mastery to distractor stages', () => {
    expect(stageFor(null)).toBe(1)
    expect(stageFor({ step: 0 })).toBe(1)
    expect(stageFor({ step: 1 })).toBe(2)
    expect(stageFor({ step: 2 })).toBe(3)
  })

  it('counts a combo as learned once its interval reaches three weeks', () => {
    expect(statusOf(null)).toBe('unlearned')
    expect(statusOf({ interval: 7 })).toBe('learning')
    expect(statusOf({ interval: 21 })).toBe('learned')
  })
})
