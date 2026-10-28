export const FREEZE_COOLDOWN = 7

export const emptyStreak = () => ({ current: 0, best: 0, lastDay: null, freezeDay: null })

const freezeAvailable = (streak, missedDay) =>
  streak.freezeDay === null || missedDay - streak.freezeDay >= FREEZE_COOLDOWN

// Called when a round is finished. One round a day keeps the streak alive;
// a single missed day is covered by a freeze at most once a week.
export function recordRound(streak, today) {
  if (streak.lastDay === today) return streak
  const gap = streak.lastDay === null ? Infinity : today - streak.lastDay
  let { current, freezeDay } = streak
  if (gap === 1) {
    current += 1
  } else if (gap === 2 && freezeAvailable(streak, today - 1)) {
    current += 1
    freezeDay = today - 1
  } else {
    current = 1
  }
  return { current, best: Math.max(streak.best, current), lastDay: today, freezeDay }
}

// The streak as it should be displayed today, before today's round is played.
export function displayedStreak(streak, today) {
  if (streak.lastDay === null) return 0
  const gap = today - streak.lastDay
  if (gap <= 1) return streak.current
  if (gap === 2 && freezeAvailable(streak, today - 1)) return streak.current
  return 0
}
