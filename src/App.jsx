import { useState } from 'react'
import verbData from './data/verbs.fr.json'
import { buildCombos, indexCombos } from './engine/combos'
import { createStorage } from './engine/storage'
import { finishRound } from './engine/round'
import { toDay } from './engine/day'
import Home from './screens/Home'
import Round from './screens/Round'
import RoundEnd from './screens/RoundEnd'
import ThemeToggle from './components/ThemeToggle'
import t from './i18n/strings.fr'

const storage = createStorage()
const combos = buildCombos(verbData)
const index = indexCombos(combos)

export default function App() {
  const [appState, setAppState] = useState(() => storage.load())
  const [screen, setScreen] = useState({ name: 'home' })

  const update = next => {
    setAppState(next)
    storage.save(next)
  }

  const startRound = () => setScreen({ name: 'round', id: Date.now() })
  const goHome = () => setScreen({ name: 'home' })

  // Progress is only committed when a round is finished; quitting discards it.
  const handleFinish = (results, misses) => {
    const { state, summary } = finishRound(appState, results, toDay())
    update(state)
    setScreen({ name: 'end', summary, misses })
  }

  return (
    <div className="app">
      <header className="app-header">
        {screen.name === 'round'
          ? <button className="icon-btn" onClick={goHome} aria-label={t.quit}>✕</button>
          : <span className="brand">b.shell</span>}
        <ThemeToggle />
      </header>

      {screen.name === 'home' && (
        <Home
          state={appState}
          onChangeTenses={tenses => update({ ...appState, settings: { ...appState.settings, tenses } })}
          onPlay={startRound}
        />
      )}
      {screen.name === 'round' && (
        <Round key={screen.id} state={appState} combos={combos} index={index} onFinish={handleFinish} onQuit={goHome} />
      )}
      {screen.name === 'end' && (
        <RoundEnd state={appState} summary={screen.summary} misses={screen.misses} onAgain={startRound} onHome={goHome} />
      )}
    </div>
  )
}
