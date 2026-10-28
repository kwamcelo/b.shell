import { describe, expect, it } from 'vitest'
import { displayedStreak, emptyStreak, recordRound } from './streak'

const playDays = days => days.reduce((streak, day) => recordRound(streak, day), emptyStreak())

describe('recordRound', () => {
  it('counts consecutive days and ignores extra rounds on the same day', () => {
    expect(playDays([10, 10, 11, 12]).current).toBe(3)
  })

  it('uses a freeze to cover a single missed day', () => {
    const streak = playDays([10, 11, 13])
    expect(streak.current).toBe(3)
    expect(streak.freezeDay).toBe(12)
  })

  it('allows only one freeze per week', () => {
    expect(playDays([10, 11, 13, 15]).current).toBe(1)
    expect(playDays([10, 11, 13, 14, 15, 16, 17, 18, 20]).current).toBe(9)
  })

  it('resets after two missed days and keeps the best', () => {
    const streak = playDays([10, 11, 12, 16])
    expect(streak.current).toBe(1)
    expect(streak.best).toBe(3)
  })
})

describe('displayedStreak', () => {
  it('stays alive until a missed day can no longer be covered', () => {
    const streak = playDays([10, 11])
    expect(displayedStreak(streak, 12)).toBe(2)
    expect(displayedStreak(streak, 13)).toBe(2)
    expect(displayedStreak(streak, 14)).toBe(0)
    expect(displayedStreak(emptyStreak(), 14)).toBe(0)
  })
})
