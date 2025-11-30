function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function humanizeLevel(level) {
  const map = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  return map[level] || 'Easy';
}

function initLevelPage() {
  const level = getQueryParam('level') || 'easy';
  const levelTitle = document.getElementById('level-title');
  if (levelTitle) {
    levelTitle.textContent = `${humanizeLevel(level)} Verbs`;
  }
  const progressText = document.getElementById('progress-text');
  if (progressText) {
    progressText.textContent = `Progress: ${humanizeLevel(level)}`;
  }
  // Placeholder progress value until wired to real data
  const progressValue = document.getElementById('progress-value');
  const progressFill = document.getElementById('progress-fill');
  if (progressValue && progressFill) {
    progressValue.textContent = '0%';
    progressFill.style.width = '0%';
  }

  const reviewLink = document.getElementById('review-link');
  const unlearnedLink = document.getElementById('unlearned-link');
  if (reviewLink) {
    reviewLink.href = `/commonverbgame.html?level=${level}&mode=review`;
  }
  if (unlearnedLink) {
    unlearnedLink.href = `/commonverbgame.html?level=${level}&mode=unlearned`;
  }
}

document.addEventListener('DOMContentLoaded', initLevelPage);
