// DOM elements
const questionElement = document.getElementById('question');
const choices = Array.from(document.getElementsByClassName('choice-text'));
const progressText = document.getElementById('progressText');
const progressBarFull = document.getElementById('progressBarFull');
const gameOverScreen = document.getElementById('game-over');
const restartButton = document.getElementById('restart-btn');
const urlParams = new URLSearchParams(window.location.search);
const difficulty = urlParams.get('level') || 'easy';
const mode = urlParams.get('mode') || 'review';

// Game variables
let verbData = {};
let currentQuestion = {};
let acceptingAnswers = false;
let correctCount = 0;
let questionCounter = 0;
let wrongQuestions = [];
const MAX_QUESTIONS = 10;
let availableQuestions = [];
const choiceContainers = Array.from(document.querySelectorAll('.choice-container'));

// Fetch verb data and start the game immediately
fetch('FrenchVerbs.json')
    .then(response => response.json())
    .then(data => {
        verbData = data;
        startGame();
    })
    .catch(error => {
        console.error('Error fetching JSON:', error);
    });

// Start the game
const startGame = (seedQuestions = []) => {
    gameOverScreen.style.display = 'none';
    document.getElementById('game').style.display = 'block';
    questionCounter = 0;
    correctCount = 0;
    const generated = generateQuestions();
    availableQuestions = [...seedQuestions, ...generated].slice(0, MAX_QUESTIONS);
    wrongQuestions = [];
    updateProgressBar();
    getNewQuestion();
};

// Generate 10 random questions
const generateQuestions = () => {
    let questions = [];
    const verbs = Object.keys(verbData);
    const tenses = ["Présent", "Passé Composé", "Imparfait", "Futur Simple"];
    const persons = ["1e personne du singulier", "2e personne du singulier", "3e personne du singulier", "1e personne du pluriel", "2e personne du pluriel", "3e personne du pluriel"];

    while (questions.length < MAX_QUESTIONS) {
        let verb = verbs[Math.floor(Math.random() * verbs.length)];
        if (difficulty === 'hard') {
            // TODO: replace with real irregular/hard tagging
            const irregulars = verbs.filter(v => v.toLowerCase().includes('être') || v.toLowerCase().includes('avoir') || v.toLowerCase().includes('aller'));
            if (irregulars.length) {
                verb = irregulars[Math.floor(Math.random() * irregulars.length)];
            }
        }
        const person = persons[Math.floor(Math.random() * persons.length)];
        const tense = tenses[Math.floor(Math.random() * tenses.length)];
        let conjugation = extractConjugation(verb, tense, person);

        if (conjugation) {
            questions.push({
                question: `Conjuger le verbe ${verb} à la ${person} au ${tense} :`,
                answer: conjugation,
                verb, tense, person
            });
        }
    }
    return questions;
};

// Extract the correct conjugation from JSON
const extractConjugation = (verb, tense, person) => {
    let data = verbData[verb][0][tense][0][person];
    if (Array.isArray(data)) {
        return data[0].m || data[0].f || data[0].neutral || "(multiple options)";
    }
    return data;
};

// Get a new question
const getNewQuestion = () => {
    if (availableQuestions.length === 0 || questionCounter >= MAX_QUESTIONS) {
        return endGame();
    }

    // quick fade out
    questionElement.classList.add('fade');
    choiceContainers.forEach(c => c.classList.add('fade'));

    questionCounter++;
    progressText.innerText = `Question ${questionCounter}/${MAX_QUESTIONS}`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions.splice(questionIndex, 1)[0];

    setTimeout(() => {
        questionElement.innerText = currentQuestion.question;

        const correctAnswer = currentQuestion.answer;
        const distractors = generateDistractors(currentQuestion);
        const allChoices = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

        choices.forEach((choice, index) => {
            choice.innerText = allChoices[index] || "(N/A)";
            choice.dataset['number'] = index + 1;
            requestAnimationFrame(() => {
                if (choice.scrollWidth > choice.clientWidth) {
                    choice.classList.add('long');
                } else {
                    choice.classList.remove('long');
                }
            });
        });

        questionElement.classList.remove('fade');
        choiceContainers.forEach(c => c.classList.remove('fade'));
    }, 120);

    acceptingAnswers = true;
};

// Generate distractors
const generateDistractors = (question) => {
    const tenses = ["Présent", "Passé Composé", "Imparfait", "Futur Simple"];
    const persons = ["1e personne du singulier", "2e personne du singulier", "3e personne du singulier", "1e personne du pluriel", "2e personne du pluriel", "3e personne du pluriel"];

    if (difficulty === 'easy') {
        return tenses
            .filter(t => t !== question.tense)
            .map(t => extractConjugation(question.verb, t, question.person))
            .filter(Boolean)
            .slice(0, 3);
    }

    if (difficulty === 'medium') {
        const sameNumberPrefix = question.person.includes('pluriel') ? 'pluriel' : 'singulier';
        const nearbyPersons = persons.filter(p => p !== question.person && p.includes(sameNumberPrefix));
        const options = [
            ...nearbyPersons.map(p => extractConjugation(question.verb, question.tense, p)),
            ...tenses.filter(t => t !== question.tense).map(t => extractConjugation(question.verb, t, question.person))
        ].filter(Boolean);
        return shuffle(options).slice(0, 3);
    }

    // hard: mix persons and tenses, allow cross-verb distractors
    const verbs = Object.keys(verbData);
    const randomOtherVerb = () => verbs[Math.floor(Math.random() * verbs.length)];

    const options = [
        ...persons.filter(p => p !== question.person).map(p => extractConjugation(question.verb, question.tense, p)),
        ...tenses.filter(t => t !== question.tense).map(t => extractConjugation(question.verb, t, question.person)),
        extractConjugation(randomOtherVerb(), question.tense, question.person),
    ].filter(Boolean);

    return shuffle(options).slice(0, 3);
};

function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Handle answer selection
choices.forEach(choice => {
    choice.addEventListener('click', e => {
        if (!acceptingAnswers) return;
        acceptingAnswers = false;
        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.innerText;
        const isCorrect = selectedAnswer === currentQuestion.answer;

        const selectedContainer = selectedChoice.parentElement;
        selectedContainer.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (!isCorrect) {
            const correctChoice = choices.find(c => c.innerText === currentQuestion.answer);
            if (correctChoice) {
                correctChoice.parentElement.classList.add('correct');
            }
            wrongQuestions.push(currentQuestion);
        }

        if (isCorrect) {
            correctCount += 1;
            updateProgressBar();
        }

        setTimeout(() => {
            selectedContainer.classList.remove(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                const correctChoice = choices.find(c => c.innerText === currentQuestion.answer);
                if (correctChoice) {
                    correctChoice.parentElement.classList.remove('correct');
                }
            }
            getNewQuestion();
        }, 1000);
    });
});

// End the game
const endGame = () => {
    document.getElementById('game').style.display = 'none';
    gameOverScreen.style.display = 'block';
    const finalCorrectText = document.getElementById('final-correct');
    if (finalCorrectText) {
        finalCorrectText.innerText = `${correctCount}/${MAX_QUESTIONS}`;
    }
};

restartButton.addEventListener('click', () => {
    const seed = wrongQuestions.length ? wrongQuestions : [];
    startGame(seed);
});

function updateProgressBar() {
    const ratio = correctCount / MAX_QUESTIONS;
    const percent = Math.round(ratio * 100);
    const hue = Math.max(0, Math.min(120, Math.round(ratio * 120)));
    progressBarFull.style.width = `${percent}%`;
    progressBarFull.style.background = `hsl(${hue}, 55%, 48%)`;
}
