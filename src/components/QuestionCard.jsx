export default function QuestionCard({ question, picked, onPick }) {
  const { combo, pronoun, answer, choices } = question
  const answered = picked !== null

  const statusOf = choice => {
    if (!answered) return ''
    if (choice === answer) return 'correct'
    return choice === picked ? 'wrong' : 'dimmed'
  }

  return (
    <>
      <section className="question-card">
        <p className="tense-label">{combo.tense}</p>
        <h1 className="verb">{combo.verb}</h1>
        <p className="prompt">
          {pronoun} <span className="blank">___</span>
        </p>
      </section>
      <div className="choices">
        {choices.map(choice => (
          <button key={choice} className={`choice ${statusOf(choice)}`} disabled={answered} onClick={() => onPick(choice)}>
            {choice}
          </button>
        ))}
      </div>
    </>
  )
}
