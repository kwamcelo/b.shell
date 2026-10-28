import { useEffect, useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import t from '../i18n/strings.fr'

const FILL_HOLD_MS = 900

// Shown after a round that completed a tier: the bar sits full on the finished
// tier, then flips to the next tier's share.
export default function TierUp({ tierUps, onContinue }) {
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowNext(true), FILL_HOLD_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="screen tier-up">
      <div className="tier-up-body">
        <p className="tier-up-emoji" aria-hidden="true">🎉</p>
        <h1>{t.tierUpTitle}</h1>
        {tierUps.map(({ tense, completedTier, next }) => {
          const flipped = showNext && !next.complete
          return (
            <section key={tense} className="panel tier-up-card">
              <p className="tier-up-message">
                {next.complete
                  ? t.tenseMastered(tense)
                  : t.tierUpMessage(tense, t.tier(completedTier), t.tier(next.tier))}
              </p>
              <div className="tense-progress-head">
                <span className="tense-name">{tense} <span className="tier">· {t.tier(flipped ? next.tier : completedTier)}</span></span>
                <span className="tense-count">
                  {flipped ? t.mastered(next.mastered, next.target) : t.tierComplete}
                </span>
              </div>
              <ProgressBar value={flipped ? next.mastered / next.target : 1} label={tense} />
            </section>
          )
        })}
      </div>
      <div className="bottom-action">
        <button className="btn-primary" onClick={onContinue}>{t.continue}</button>
      </div>
    </main>
  )
}
