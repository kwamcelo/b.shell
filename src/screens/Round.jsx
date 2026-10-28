import { useEffect, useMemo, useRef, useState } from 'react'
import { buildRound } from '../engine/round'
import { buildChoices, makeQuestion } from '../engine/question'
import { toDay } from '../engine/day'
import QuestionCard from '../components/QuestionCard'
import ProgressBar from '../components/ProgressBar'
import WordReferenceLink from '../components/WordReferenceLink'
import t from '../i18n/strings.fr'

const CORRECT_DELAY_MS = 700

export default function Round({ state, combos, index, onFinish, onQuit }) {
  const [round] = useState(() => buildRound(state, combos, toDay()))
  const [position, setPosition] = useState(0)
  const [picked, setPicked] = useState(null)
  const [results, setResults] = useState([])
  const [misses, setMisses] = useState([])
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const combo = round[position]
  const question = useMemo(
    () => combo && buildChoices(makeQuestion(combo), state.cards[combo.id] ?? null, index),
    [combo, state.cards, index],
  )

  if (!round.length) {
    return (
      <main className="screen center">
        <p>{t.nothingToPractice}</p>
        <button className="btn-secondary" onClick={onQuit}>{t.home}</button>
      </main>
    )
  }

  const advance = (nextResults, nextMisses) => {
    if (position + 1 >= round.length) return onFinish(nextResults, nextMisses)
    setPosition(position + 1)
    setPicked(null)
  }

  const pick = choice => {
    const correct = choice === question.answer
    const nextResults = [...results, { id: combo.id, correct }]
    const nextMisses = correct ? misses : [...misses, question]
    setPicked(choice)
    setResults(nextResults)
    setMisses(nextMisses)
    if (correct) timer.current = setTimeout(() => advance(nextResults, nextMisses), CORRECT_DELAY_MS)
  }

  const wrong = picked !== null && picked !== question.answer

  return (
    <main className="screen round">
      <div className="round-progress">
        <ProgressBar value={position / round.length} label={t.progress(position + 1, round.length)} />
        <span>{position + 1} / {round.length}</span>
      </div>

      <QuestionCard key={position} question={question} picked={picked} onPick={pick} />

      {wrong && (
        <div className="feedback" role="status">
          <p className="feedback-label">{t.correctAnswer}</p>
          <p className="feedback-answer">{question.pronoun} <strong>{question.answer}</strong></p>
          <WordReferenceLink verb={combo.verb} />
          <button className="btn-primary" onClick={() => advance(results, misses)} autoFocus>{t.continue}</button>
        </div>
      )}
    </main>
  )
}
