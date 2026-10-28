import { useMemo } from 'react'
import { TENSES } from '../engine/combos'
import { displayedStreak } from '../engine/streak'
import { tenseProgress } from '../engine/progress'
import { toDay } from '../engine/day'
import ProgressBar from '../components/ProgressBar'
import t from '../i18n/strings.fr'

const MIN_TARGET = 1
const MAX_TARGET = 5

export default function Home({ state, combos, onChangeSettings, onPlay }) {
  const today = toDay()
  const streak = displayedStreak(state.streak, today)
  const roundsToday = state.daily.day === today ? state.daily.rounds : 0
  const { tenses, dailyTarget } = state.settings

  // Selected tenses, plus any tense already started.
  const progress = useMemo(() => {
    const started = new Set(combos.filter(c => state.cards[c.id]).map(c => c.tense))
    return TENSES.filter(tense => tenses.includes(tense) || started.has(tense))
      .map(tense => ({ tense, ...tenseProgress(combos, state.cards, tense) }))
  }, [combos, state.cards, tenses])

  // Keep the selection in canonical tense order.
  const toggle = tense => onChangeSettings({
    tenses: tenses.includes(tense) ? tenses.filter(x => x !== tense) : TENSES.filter(x => tenses.includes(x) || x === tense),
  })
  const setTarget = target => onChangeSettings({ dailyTarget: Math.min(MAX_TARGET, Math.max(MIN_TARGET, target)) })

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
        <div className="target">
          <span>{t.dailyTarget}</span>
          <div className="stepper">
            <button className="icon-btn" onClick={() => setTarget(dailyTarget - 1)} disabled={dailyTarget <= MIN_TARGET}
              aria-label={t.fewerRounds}>−</button>
            <span aria-live="polite">{t.rounds(dailyTarget)}</span>
            <button className="icon-btn" onClick={() => setTarget(dailyTarget + 1)} disabled={dailyTarget >= MAX_TARGET}
              aria-label={t.moreRounds}>+</button>
          </div>
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

      {progress.length > 0 && (
        <section className="tense-progress">
          <h2>{t.progressTitle}</h2>
          <ul>
            {progress.map(p => (
              <li key={p.tense}>
                <div className="tense-progress-head">
                  <span className="tense-name">{p.tense} <span className="tier">· {t.tier(p.tier)}</span></span>
                  <span className="tense-count">{p.complete ? t.tierComplete : t.mastered(p.mastered, p.target)}</span>
                </div>
                <ProgressBar value={p.mastered / p.target} label={`${p.tense} ${t.tier(p.tier)}`} />
                {p.inProgress > 0 && <p className="tense-sub">{t.inProgress(p.inProgress)}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="bottom-action">
        {!tenses.length && <p className="hint">{t.pickTense}</p>}
        <button className="btn-primary" disabled={!tenses.length} onClick={onPlay}>▶ {t.practice}</button>
      </div>
    </main>
  )
}
