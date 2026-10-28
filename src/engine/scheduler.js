// Days until the next review after each consecutive correct answer.
const LADDER = [1, 3, 7, 21]
const GROWTH = 2.5
export const LEARNED_INTERVAL = 21

// `card` is null for a combo never answered. A first correct answer (possibly a
// lucky guess) only schedules it for tomorrow.
export function review(card, correct, today, now = Date.now()) {
  const reps = (card?.reps ?? 0) + 1
  const lapses = (card?.lapses ?? 0) + (correct ? 0 : 1)
  let step = 0
  let interval = LADDER[0]
  if (correct && card) {
    step = card.step + 1
    interval = step < LADDER.length ? LADDER[step] : Math.round(card.interval * GROWTH)
  }
  // reviewedAt is a timestamp so a future sync can merge devices by "latest review wins".
  return { step, interval, due: today + interval, reps, lapses, reviewedAt: now }
}

// Distractor stage: 1 = other tenses, 2 = other persons, 3 = made-up forms.
export function stageFor(card) {
  if (!card || card.step === 0) return 1
  if (card.step === 1) return 2
  return 3
}

export function statusOf(card) {
  if (!card) return 'unlearned'
  return card.interval >= LEARNED_INTERVAL ? 'learned' : 'learning'
}
