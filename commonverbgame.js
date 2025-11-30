// DOM elements
const questionElement = document.getElementById('question');
const choices = Array.from(document.getElementsByClassName('choice-text'));
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const progressBarFull = document.getElementById('progressBarFull');
const gameOverScreen = document.getElementById('game-over');
const finalScoreText = document.getElementById('final-score');
const restartButton = document.getElementById('restart-btn');

// Game variables
let verbData = {};
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
const MAX_QUESTIONS = 10;
const CORRECT_BONUS = 10;
let availableQuestions = [];

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
const startGame = () => {
    gameOverScreen.style.display = 'none';
    questionCounter = 0;
    score = 0;
    scoreText.innerText = score;
    availableQuestions = generateQuestions();
    getNewQuestion();
};

// Generate 10 random questions
const generateQuestions = () => {
    let questions = [];
    const verbs = Object.keys(verbData);
    const tenses = ["Présent", "Passé Composé", "Imparfait", "Futur Simple"];
    const persons = ["1e personne du singulier", "2e personne du singulier", "3e personne du singulier", "1e personne du pluriel", "2e personne du pluriel", "3e personne du pluriel"];

    while (questions.length < MAX_QUESTIONS) {
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
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
    questionCounter++;
    progressText.innerText = `Question ${questionCounter}/${MAX_QUESTIONS}`;
    progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions.splice(questionIndex, 1)[0];
    questionElement.innerText = currentQuestion.question;

    const correctAnswer = currentQuestion.answer;
    const distractors = generateDistractors(currentQuestion);
    const allChoices = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

    choices.forEach((choice, index) => {
        choice.innerText = allChoices[index] || "(N/A)";
        choice.dataset['number'] = index + 1;
    });

    acceptingAnswers = true;
};

// Generate distractors
const generateDistractors = (question) => {
    const tenses = ["Présent", "Passé Composé", "Imparfait", "Futur Simple"];
    return tenses
        .filter(t => t !== question.tense)
        .map(t => extractConjugation(question.verb, t, question.person))
        .filter(Boolean)
        .slice(0, 3);
};

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
        }

        if (isCorrect) incrementScore(CORRECT_BONUS);

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

// Increment score
const incrementScore = num => {
    score += num;
    scoreText.innerText = score;
};

// End the game
const endGame = () => {
    document.getElementById('game').style.display = 'none';
    gameOverScreen.style.display = 'block';
    finalScoreText.innerText = score;
};

// Restart the game
restartButton.addEventListener('click', startGame);
