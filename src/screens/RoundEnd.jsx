import { toDay } from '../engine/day'
import ProgressBar from '../components/ProgressBar'
import WordReferenceLink from '../components/WordReferenceLink'
import t from '../i18n/strings.fr'

export default function RoundEnd({ state, summary, misses, onAgain, onHome }) {
  const today = toDay()
  const roundsToday = state.daily.day === today ? state.daily.rounds : 0
  const { dailyTarget } = state.settings

  return (
    <main className="screen round-end">
      <h1>{t.roundDone} ✓</h1>

      <section className="panel stats">
        <p className="score">{t.score(summary.correct, summary.total)}</p>
        <p className="streak">🔥 {t.streak(state.streak.current)}</p>
        <div className="today">
          <span>{t.today}</span>
          <ProgressBar value={roundsToday / dailyTarget} label={t.today} />
          <span>{t.roundsOf(Math.min(roundsToday, dailyTarget), dailyTarget)}</span>
        </div>
      </section>

      {misses.length > 0 && (
        <section className="misses">
          <h2>{t.toReview}</h2>
          <ul>
            {misses.map(miss => (
              <li key={miss.combo.id}>
                <span className="miss-what">{miss.combo.verb} · {miss.combo.tense} · {miss.pronoun}</span>
                <span className="miss-answer">{miss.answer}</span>
                <WordReferenceLink verb={miss.combo.verb} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="summary">{t.summary(summary.newCount, summary.strengthened)}</p>

      <div className="bottom-action two">
        <button className="btn-primary" onClick={onAgain}>{t.again}</button>
        <button className="btn-secondary" onClick={onHome}>{t.home}</button>
      </div>
    </main>
  )
}
