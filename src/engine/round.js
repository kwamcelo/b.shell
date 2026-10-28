import { review } from './scheduler'
import { recordRound } from './streak'
import { shuffle } from './question'

export const ROUND_SIZE = 15
export const NEW_PER_ROUND = 5

const weakestFirst = cards => (a, b) => {
  const x = cards[a.id]
  const y = cards[b.id]
  return y.lapses - x.lapses || x.step - y.step || x.due - y.due
}

const todaysDaily = (daily, today) => (daily.day === today ? daily : { day: today, rounds: 0, reviews: 0 })

// Reviews are capped at the daily target's worth of rounds, so a missed week
// never turns into a pile: overflow simply waits for later days.
export function reviewsLeftToday(state, today) {
  const cap = state.settings.dailyTarget * ROUND_SIZE
  return Math.max(0, cap - todaysDaily(state.daily, today).reviews)
}

export function buildRound(state, combos, today, rng = Math.random) {
  const { cards, settings } = state
  const selected = new Set(settings.tenses)
  const eligible = combos.filter(c => selected.has(c.tense))
  const due = eligible.filter(c => cards[c.id] && cards[c.id].due <= today).sort(weakestFirst(cards))
  // combos are in frequency order, so this finishes one verb before starting the next
  const fresh = eligible.filter(c => !cards[c.id])

  const budget = Math.min(reviewsLeftToday(state, today), ROUND_SIZE)
  const reviews = due.slice(0, Math.min(budget, ROUND_SIZE - Math.min(NEW_PER_ROUND, fresh.length)))
  const news = fresh.slice(0, ROUND_SIZE - reviews.length)
  return shuffle([...reviews, ...news], rng)
}

// results: [{ id, correct }] in the order answered.
export function finishRound(state, results, today, now = Date.now()) {
  const cards = { ...state.cards }
  const summary = { correct: 0, total: results.length, misses: [], newCount: 0, strengthened: 0 }
  let reviews = 0
  for (const { id, correct } of results) {
    const before = cards[id] ?? null
    cards[id] = review(before, correct, today, now)
    if (before) reviews += 1
    else summary.newCount += 1
    if (correct) {
      summary.correct += 1
      if (before) summary.strengthened += 1
    } else {
      summary.misses.push(id)
    }
  }
  const daily = todaysDaily(state.daily, today)
  return {
    state: {
      ...state,
      cards,
      daily: { day: today, rounds: daily.rounds + 1, reviews: daily.reviews + reviews },
      streak: recordRound(state.streak, today),
    },
    summary,
  }
}
