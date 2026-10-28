import { TENSES } from '../engine/combos'
import { displayedStreak } from '../engine/streak'
import { toDay } from '../engine/day'
import ProgressBar from '../components/ProgressBar'
import t from '../i18n/strings.fr'

export default function Home({ state, onChangeTenses, onPlay }) {
  const today = toDay()
  const streak = displayedStreak(state.streak, today)
  const roundsToday = state.daily.day === today ? state.daily.rounds : 0
  const { tenses, dailyTarget } = state.settings

  // Keep the selection in canonical tense order.
  const toggle = tense => onChangeTenses(
    tenses.includes(tense) ? tenses.filter(x => x !== tense) : TENSES.filter(x => tenses.includes(x) || x === tense),
  )

  return (
    <main className="screen home">
      <section className="hero">
        <h1>b.shell</h1>
        <p className="subtitle">{t.tagline}</p>
      </section>

      <section className="panel stats">
        <p className="streak">🔥 {t.streak(streak)}</p>
        <div className="today">
          <span>{t.today}</span>
          <ProgressBar value={roundsToday / dailyTarget} label={t.today} />
          <span>{t.roundsOf(Math.min(roundsToday, dailyTarget), dailyTarget)}</span>
        </div>
      </section>

      <section className="tenses">
        <h2>{t.tenses}</h2>
        <div className="chips">
          {TENSES.map(tense => (
            <button key={tense} className="chip" aria-pressed={tenses.includes(tense)} onClick={() => toggle(tense)}>
              {tense}
            </button>
          ))}
        </div>
      </section>

      <div className="bottom-action">
        {!tenses.length && <p className="hint">{t.pickTense}</p>}
        <button className="btn-primary" disabled={!tenses.length} onClick={onPlay}>▶ {t.practice}</button>
      </div>
    </main>
  )
}
