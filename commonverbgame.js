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
const MAX_QUESTIONS = 20;
let availableQuestions = [];
const choiceContainers = Array.from(document.querySelectorAll('.choice-container'));
const tallyByTense = {};

// Fetch verb data (generated)
fetch('new_frenchverbs.json')
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
    Object.keys(tallyByTense).forEach(k => delete tallyByTense[k]);
    const generated = generateQuestions();
    availableQuestions = [...seedQuestions, ...generated].slice(0, MAX_QUESTIONS);
    wrongQuestions = [];
    updateProgressBar();
    getNewQuestion();
};

const TENSE_SETS = {
    easy: ["Présent", "Passé Composé", "Imparfait", "Futur Simple"],
    medium: ["Présent", "Passé Composé", "Imparfait", "Futur Simple", "Conditionnel Présent", "Futur Proche", "Subjonctif"],
    hard: ["Présent", "Passé Composé", "Imparfait", "Futur Simple", "Conditionnel Présent", "Futur Proche", "Subjonctif", "Plus-que-parfait", "Conditionnel Passé", "Subjonctif Passé", "Futur Antérieur"]
};

// Generate 10 random questions
const generateQuestions = () => {
    let questions = [];
    const verbs = Object.keys(verbData);
    const persons = ["1e personne du singulier", "2e personne du singulier", "3e personne du singulier", "1e personne du pluriel", "2e personne du pluriel", "3e personne du pluriel"];
    const allowedTenses = TENSE_SETS[difficulty] || TENSE_SETS.easy;

    while (questions.length < MAX_QUESTIONS) {
        let verb = verbs[Math.floor(Math.random() * verbs.length)];
        if (difficulty === 'hard') {
            // TODO: replace with real irregular/hard tagging
            const irregulars = verbs.filter(v => v.toLowerCase().includes('être') || v.toLowerCase().includes('avoir') || v.toLowerCase().includes('aller'));
            if (irregulars.length) {
                verb = irregulars[Math.floor(Math.random() * irregulars.length)];
            }
        }
        const availableTenses = allowedTenses.filter(t => verbData[verb][0][t]);
        if (!availableTenses.length) continue;
        const person = persons[Math.floor(Math.random() * persons.length)];
        const tense = availableTenses[Math.floor(Math.random() * availableTenses.length)];
        const variants = getConjugationVariants(verb, tense, person);

        if (variants.length) {
            const answer = variants[Math.floor(Math.random() * variants.length)];
            questions.push({
                question: `Conjuger le verbe ${verb} à la ${person} au ${tense}`,
                answer,
                correctOptions: variants,
                verb, tense, person
            });
        }
    }
    return questions;
};

// Extract conjugation variants from JSON (handles gendered forms)
const getConjugationVariants = (verb, tense, person) => {
    let data = verbData[verb][0][tense][0][person];
    if (!data) return [];
    let variants = [];
    if (Array.isArray(data)) {
        const entry = data[0] || {};
        variants = [entry.m, entry.f, entry.neutral].filter(Boolean);
    } else {
        variants = [data];
    }
    // dedupe
    return Array.from(new Set(variants));
};

function highlightQuestion(text) {
    if (!text) return '';
    return text
        .replace(/Conjuger le verbe ([^ ]+)/, (_, v) => `Conjuger le verbe <span class="highlight">${v}</span>`)
        .replace(/à la ([^ ]+ [^ ]+ [^ ]+ [^ ]+)/, (_, p) => `à la <span class="highlight">${p}</span>`)
        .replace(/au (.+)/, (_, t) => `au <span class="highlight">${t.trim()}</span>`);
}

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
            questionElement.innerHTML = highlightQuestion(currentQuestion.question);

        const correctAnswer = currentQuestion.answer;
        const distractors = generateDistractors(currentQuestion);
        const allChoices = dedupe([correctAnswer, ...distractors]).sort(() => Math.random() - 0.5).slice(0, 4);

        choices.forEach((choice, index) => {
            choice.innerText = allChoices[index] || "(N/A)";
            choice.dataset['number'] = index + 1;
            requestAnimationFrame(() => fitChoiceText(choice));
        });

        // tally for tense count
        if (!tallyByTense[currentQuestion.tense]) {
            tallyByTense[currentQuestion.tense] = { correct: 0, total: 0 };
        }
        tallyByTense[currentQuestion.tense].total += 1;

        questionElement.classList.remove('fade');
        choiceContainers.forEach(c => c.classList.remove('fade'));
    }, 120);

    acceptingAnswers = true;
};

// Generate distractors
const generateDistractors = (question) => {
    const allowedTenses = TENSE_SETS[difficulty] || TENSE_SETS.easy;
    const persons = ["1e personne du singulier", "2e personne du singulier", "3e personne du singulier", "1e personne du pluriel", "2e personne du pluriel", "3e personne du pluriel"];
    const correctSet = new Set(question.correctOptions || [question.answer]);

    const pickVariant = (verb, tense, person) => {
        const variants = getConjugationVariants(verb, tense, person).filter(v => !correctSet.has(v));
        return variants.length ? variants[Math.floor(Math.random() * variants.length)] : null;
    };

    if (difficulty === 'easy') {
        const options = allowedTenses
            .filter(t => t !== question.tense && verbData[question.verb][0][t])
            .map(t => pickVariant(question.verb, t, question.person))
            .filter(Boolean);
        return dedupe(options).slice(0, 3);
    }

    if (difficulty === 'medium') {
        const sameNumberPrefix = question.person.includes('pluriel') ? 'pluriel' : 'singulier';
        const nearbyPersons = persons.filter(p => p !== question.person && p.includes(sameNumberPrefix));
        const options = [
            ...nearbyPersons.map(p => pickVariant(question.verb, question.tense, p)),
            ...allowedTenses.filter(t => t !== question.tense && verbData[question.verb][0][t]).map(t => pickVariant(question.verb, t, question.person))
        ].filter(Boolean);
        return dedupe(shuffle(options)).slice(0, 3);
    }

    // hard: mix persons and tenses, allow cross-verb distractors
    const verbs = Object.keys(verbData);
    const randomOtherVerb = () => verbs[Math.floor(Math.random() * verbs.length)];

    const options = [
        ...persons.filter(p => p !== question.person).map(p => pickVariant(question.verb, question.tense, p)),
        ...allowedTenses.filter(t => t !== question.tense && verbData[question.verb][0][t]).map(t => pickVariant(question.verb, t, question.person)),
        pickVariant(randomOtherVerb(), question.tense, question.person),
    ].filter(Boolean);

    return dedupe(shuffle(options)).slice(0, 3);
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
        const isCorrect = (currentQuestion.correctOptions || [currentQuestion.answer]).includes(selectedAnswer);

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
            if (tallyByTense[currentQuestion.tense]) {
                tallyByTense[currentQuestion.tense].correct += 1;
            }
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
    const breakdownEl = document.getElementById('final-breakdown');
    if (breakdownEl) {
        breakdownEl.innerHTML = '';
        Object.keys(tallyByTense).forEach(tense => {
            const stats = tallyByTense[tense];
            const row = document.createElement('div');
            row.className = 'row';
            row.innerHTML = `<span>${tense}</span><span>${stats.correct}/${stats.total}</span>`;
            breakdownEl.appendChild(row);
        });
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

function fitChoiceText(choice) {
    if (!choice) return;
    const container = choice.parentElement;
    const maxHeight = container.clientHeight - 10; // padding buffer
    const maxWidth = container.clientWidth - 10;
    let size = 2.6; // rem starting point
    choice.style.fontSize = `${size}rem`;

    // shrink until it fits or hits minimum
    while ((choice.scrollWidth > maxWidth || choice.scrollHeight > maxHeight) && size > 1.0) {
        size -= 0.08;
        choice.style.fontSize = `${size.toFixed(2)}rem`;
    }
}

function dedupe(list) {
    return Array.from(new Set(list));
}
