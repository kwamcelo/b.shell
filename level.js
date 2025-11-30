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
    levelTitle.textContent = `${humanizeLevel(level)} Mode`;
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
}

document.addEventListener('DOMContentLoaded', initLevelPage);
