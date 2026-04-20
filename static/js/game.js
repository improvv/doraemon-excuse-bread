/* =============================================
   game.js - 게임 화면 동작
   =============================================
   담당 기능:
   - 닉네임/난이도 불러오기 및 검증
   - 난이도별 시간 제한과 점수 배율 적용
   - 누적 콤보 점수 계산
   - 결과 화면/랭킹에 난이도 표시
   ============================================= */

const SENTENCES = [
  '나는 이미 마음속으로 A+을 받았기 때문에 현실에서까지 굳이 공부할 필요는 없다.',
  '오늘은 공부하는 날이 아니라 공부해야 한다는 사실을 받아들이는 날이므로 아직 괜찮다.',
  '시험 하루 전의 비상 두뇌 회전은 평소보다 강력하므로 지금은 에너지를 아껴야 한다.',
  '내가 공부를 안 하는 것은 게으른 것이 아니라 뇌에게 충분한 휴식을 제공하는 행위이다.',
  '졸린 상태에서 공부하면 효율이 거의 0이므로 지금 자는 것이 오히려 더 현명한 선택이다.',
  '시험 범위가 너무 넓어서 어디서부터 시작해야 할지 모르기 때문에 일단 아무것도 안 하는 중이다.',
  '어차피 내가 배운 것의 대부분은 살면서 쓸 일이 없다고 어른들도 말했으므로 생략 가능하다.',
  '공부보다 유튜브 시청이 창의력에 더 도움이 된다는 연구 결과가 어딘가에 분명히 존재할 것이다.',
  '나는 지금 공부 계획을 세우는 중이기 때문에 실제로 공부하는 것과 거의 동일한 효과를 내고 있다.',
  '교수님도 젊었을 때는 다 이랬을 거라는 강한 확신이 내 마음속 깊은 곳에 자리 잡고 있다.',
  '오늘 날씨가 너무 좋아서 공부하기 아깝고 날씨가 나빠도 우울해서 공부가 안 되는 것이다.',
  '책상에 앉아서 핸드폰을 보는 것도 넓은 의미에서 공부 환경을 조성하는 과정이라 볼 수 있다.',
  '내 잠재력은 아직 개발되지 않았을 뿐이며 언젠가 폭발적으로 발휘될 것이기 때문에 지금은 기다리는 중이다.',
  '스트레스 없이 행복하게 사는 것이 최고의 점수보다 인생에 더 중요하다는 철학을 나는 굳게 믿는다.',
  '시험이 끝나면 배운 내용을 모두 잊어버리므로 처음부터 외우지 않는 것이 더 효율적인 방법일 수 있다.',
  '밥을 먹은 직후라 소화를 위해 누워 있는 것은 공부가 아니라 건강 관리의 영역에 해당한다.',
  '어제 공부를 열심히 했다는 기억은 없지만 분명 잘 했을 것이라는 믿음이 나를 지탱하고 있다.',
  '공부를 시작하기 전에 주변 환경을 완벽하게 정리해야 하기 때문에 아직 시작하지 않은 것이다.',
  '지금 이 순간도 경험치가 쌓이고 있으며 살아있다는 것 자체가 일종의 학습이라고 할 수 있다.',
  '오늘 안에만 하면 된다고 했는데 자정이 아직 몇 시간이나 남아 있으므로 지금 당장 할 필요가 없다.',
  '집중력은 한정된 자원이므로 사소한 것에 낭비하지 않고 중요한 순간을 위해 아끼는 중이다.',
  '도라에몽에게 암기빵이 있다면 굳이 이렇게 고생할 필요도 없었을 텐데 너무 불공평한 세상이다.',
  '공부 유튜브 영상의 썸네일을 확인하는 것만으로도 이미 공부 의지를 불태우고 있는 셈이다.',
  '나는 지금 충분히 노력하고 있으며 단지 그 노력의 방향이 공부 쪽이 아닐 뿐인 것이다.',
  '내일부터 진짜 시작하면 되기 때문에 오늘은 마음의 준비를 하는 소중한 날로 기억될 것이다.'
];

const TOTAL_ROUNDS = 5;
const SCORE_BASE = 200;
const SCORE_PER_SECOND = 5;
const TIMER_WARNING_RATIO = 0.25;
const TIMER_DANGER_RATIO = 0.12;

const DIFFICULTY_SETTINGS = {
  easy: { label: 'EASY', timeLimit: 30, multiplier: 1.0 },
  normal: { label: 'NORMAL', timeLimit: 24, multiplier: 1.2 },
  hard: { label: 'HARD', timeLimit: 18, multiplier: 1.5 }
};

let nickname = '';
let difficultyKey = 'normal';
let difficulty = DIFFICULTY_SETTINGS.normal;
let currentRound = 1;
let rawScore = 0;
let finalScore = 0;
let combo = 0;
let timeLeft = difficulty.timeLimit;
let timerInterval = null;
let currentSentence = '';
let usedIndices = [];
let isComposing = false;
let previousInputLength = 0;
let totalTypedCount = 0;
let recentKeyTimes = [];

const scoreValueEl = document.getElementById('score-value');
const roundValueEl = document.getElementById('round-value');
const timerValueEl = document.getElementById('timer-value');
const timerBoxEl = document.getElementById('timer-box');
const progressBarEl = document.getElementById('progressBar');
const submitBtnEl = document.getElementById('submit-btn');
const messageEl = document.getElementById('message');
const difficultyValueEl = document.getElementById('difficulty-value');
const typingSpeedValueEl = document.getElementById('typing-speed-value');
const typingTotalValueEl = document.getElementById('typing-total-value');
const textOverlayEl = document.getElementById('textOverlay');
const hiddenInputEl = document.getElementById('hiddenInput');
const gameOverModalEl = document.getElementById('game-over-modal');
const modalTitleEl = document.getElementById('modal-title');
const modalScoreEl = document.getElementById('modal-score');
const viewResultBtnEl = document.getElementById('view-result-btn');
const modalHomeBtnEl = document.getElementById('modal-home-btn');
const resultSectionEl = document.getElementById('result-section');
const resultTitleEl = document.getElementById('result-title');
const resultSubtitleEl = document.getElementById('result-subtitle');
const rankingBodyEl = document.getElementById('ranking-body');
const goHomeBtnEl = document.getElementById('go-home-btn');
const breadImageEl = document.getElementById('bread-image');
const resultDoraemonImgEl = document.getElementById('result-doraemon-img');

document.addEventListener('DOMContentLoaded', function () {
  if (breadImageEl) {
    breadImageEl.addEventListener('error', function () {
      breadImageEl.style.display = 'none';
    }, { once: true });
  }

  if (resultDoraemonImgEl) {
    resultDoraemonImgEl.addEventListener('error', function () {
      resultDoraemonImgEl.style.display = 'none';
      const placeholder = resultDoraemonImgEl.nextElementSibling;
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }, { once: true });
  }

  nickname = sessionStorage.getItem('nickname') || '';
  difficultyKey = (sessionStorage.getItem('difficulty') || '').toLowerCase();
  difficulty = DIFFICULTY_SETTINGS[difficultyKey];

  if (!/^[0-9A-Za-z가-힣 _-]{1,10}$/.test(nickname) || !difficulty) {
    alert('닉네임 또는 난이도 정보가 올바르지 않아! 시작 화면에서 다시 선택하고 오자!');
    sessionStorage.removeItem('nickname');
    sessionStorage.removeItem('difficulty');
    window.location.href = '/start';
    return;
  }

  difficultyValueEl.textContent = difficulty.label;
  difficultyValueEl.classList.add('difficulty-' + difficultyKey);

  submitBtnEl.addEventListener('click', handleSubmit);

  hiddenInputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  });

  hiddenInputEl.addEventListener('input', function () {
    trackTyping(hiddenInputEl.value);
    renderUnifiedGrid(hiddenInputEl.value);
  });

  hiddenInputEl.addEventListener('compositionstart', function () {
    isComposing = true;
  });

  hiddenInputEl.addEventListener('compositionupdate', function () {
    renderUnifiedGrid(hiddenInputEl.value);
  });

  hiddenInputEl.addEventListener('compositionend', function () {
    isComposing = false;
    renderUnifiedGrid(hiddenInputEl.value);
  });

  viewResultBtnEl.addEventListener('click', showResultScreen);
  modalHomeBtnEl.addEventListener('click', returnToStart);
  goHomeBtnEl.addEventListener('click', returnToStart);

  document.addEventListener('click', function () {
    if (hiddenInputEl && !hiddenInputEl.disabled) {
      hiddenInputEl.focus();
    }
  });

  startGame();
});

function startGame() {
  currentRound = 1;
  rawScore = 0;
  finalScore = 0;
  combo = 0;
  usedIndices = [];
  resetTypingStats();

  updateScoreDisplay();
  startRound();
}

function startRound() {
  roundValueEl.textContent = currentRound + ' / ' + TOTAL_ROUNDS;
  currentSentence = pickRandomSentence();
  isComposing = false;
  renderUnifiedGrid('');

  hiddenInputEl.value = '';
  hiddenInputEl.disabled = false;
  hiddenInputEl.focus();
  resetTypingStats();

  messageEl.textContent = '';
  messageEl.className = 'message';

  timeLeft = difficulty.timeLimit;
  updateTimerDisplay();
  updateProgressBar();
  resetTimerStyle();
  updateBreadGlow(combo);
  updateTypingStats();
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  timeLeft--;
  updateTimerDisplay();
  updateProgressBar();
  applyTimerStyle();
  updateTypingStats();

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    handleTimeOver();
  }
}

function handleTimeOver() {
  hiddenInputEl.disabled = true;
  combo = 0;
  updateBreadGlow(0);

  showMessage('시간 초과! 콤보가 끊겼어 ⏰', false);
  queueNextRound('타임 오버!');
}

function handleSubmit() {
  clearInterval(timerInterval);

  const userAnswer = hiddenInputEl.value;
  if (userAnswer === '') {
    timerInterval = setInterval(tickTimer, 1000);
    return;
  }

  hiddenInputEl.disabled = true;

  if (userAnswer === currentSentence) {
    const nextCombo = combo + 1;
    const gained = calcRawScore(timeLeft, nextCombo);
    combo = nextCombo;
    rawScore += gained;
    finalScore = getAdjustedScore(rawScore);
    updateScoreDisplay();

    const adjustedGain = getAdjustedScore(gained);
    showComboDisplay(combo);
    showScoreFloat(adjustedGain);
    bounceBread();
    updateBreadGlow(combo);

    showMessage(
      '정답! 🎉 +' + adjustedGain + '점 (' + difficulty.label + ' x' + difficulty.multiplier + ', ' + combo + '콤보)',
      true
    );

    queueNextRound('게임 종료!');
  } else {
    combo = 0;
    updateBreadGlow(0);
    showMessage('틀렸어... 😢 콤보가 끊겼어!', false);
    queueNextRound('게임 종료!');
  }
}

function queueNextRound(lastTitle) {
  if (currentRound < TOTAL_ROUNDS) {
    setTimeout(function () {
      currentRound++;
      startRound();
    }, 900);
  } else {
    setTimeout(function () {
      showGameOverModal(lastTitle);
    }, 900);
  }
}

function renderUnifiedGrid(typedValue) {
  let html = '';

  for (let i = 0; i < currentSentence.length; i++) {
    let originalChar = currentSentence[i];
    let cls = '';
    let currentToDisplay = originalChar;

    if (i < typedValue.length) {
      currentToDisplay = typedValue[i];
      if (isComposing && i === typedValue.length - 1) {
        cls = 'composing';
      } else {
        cls = (typedValue[i] === originalChar) ? 'correct' : 'wrong';
      }
    } else if (i === typedValue.length) {
      cls = 'cursor';
    }

    let displayChar = (currentToDisplay === ' ') ? '&nbsp;' : escapeHtml(currentToDisplay);
    html += '<span class="' + cls + '">' + displayChar + '</span>';
  }

  if (typedValue.length >= currentSentence.length) {
    for (let i = currentSentence.length; i < typedValue.length; i++) {
      let extraChar = typedValue[i];
      let cls = 'extra';
      if (isComposing && i === typedValue.length - 1) {
        cls += ' composing';
      }
      html += '<span class="' + cls + '">' + (extraChar === ' ' ? '&nbsp;' : escapeHtml(extraChar)) + '</span>';
    }
    html += '<span class="cursor"></span>';
  }

  textOverlayEl.innerHTML = html;
}

function trackTyping(currentValue) {
  const currentLength = currentValue.length;
  const addedCount = Math.max(0, currentLength - previousInputLength);

  if (addedCount > 0) {
    const now = Date.now();
    totalTypedCount += addedCount;

    for (let i = 0; i < addedCount; i++) {
      recentKeyTimes.push(now);
    }
  }

  previousInputLength = currentLength;
  updateTypingStats();
}

function resetTypingStats() {
  previousInputLength = 0;
  totalTypedCount = 0;
  recentKeyTimes = [];
  updateTypingStats();
}

function updateTypingStats() {
  pruneRecentKeyTimes();

  if (typingSpeedValueEl) {
    const typingSpeed = Math.round(recentKeyTimes.length * 12);
    typingSpeedValueEl.textContent = String(typingSpeed);
  }

  if (typingTotalValueEl) {
    typingTotalValueEl.textContent = String(totalTypedCount);
  }
}

function pruneRecentKeyTimes() {
  const threshold = Date.now() - 5000;
  recentKeyTimes = recentKeyTimes.filter(function (time) {
    return time >= threshold;
  });
}

function calcRawScore(remainingTime, nextCombo) {
  return SCORE_BASE + remainingTime * SCORE_PER_SECOND + getComboBonus(nextCombo);
}

function getComboBonus(nextCombo) {
  if (nextCombo <= 1) {
    return 0;
  }

  return Math.min(nextCombo - 1, 4) * 50;
}

function getAdjustedScore(rawValue) {
  return Math.round(rawValue * difficulty.multiplier);
}

function updateScoreDisplay() {
  scoreValueEl.textContent = getAdjustedScore(rawScore);
  triggerPop(scoreValueEl);
}

function updateTimerDisplay() {
  timerValueEl.textContent = timeLeft;
  if (timeLeft <= getDangerThreshold()) {
    triggerPop(timerValueEl);
  }
}

function triggerPop(el) {
  el.classList.remove('value-pop');
  void el.offsetWidth;
  el.classList.add('value-pop');
  el.addEventListener('animationend', function handler() {
    el.classList.remove('value-pop');
    el.removeEventListener('animationend', handler);
  });
}

function updateProgressBar() {
  const percent = (timeLeft / difficulty.timeLimit) * 100;
  progressBarEl.style.width = percent + '%';

  progressBarEl.classList.remove('warning', 'danger');
  if (timeLeft <= getDangerThreshold()) {
    progressBarEl.classList.add('danger');
  } else if (timeLeft <= getWarningThreshold()) {
    progressBarEl.classList.add('warning');
  }
}

function applyTimerStyle() {
  timerBoxEl.classList.remove('timer-caution', 'timer-warning', 'timer-danger');

  if (timeLeft <= getDangerThreshold()) {
    timerBoxEl.classList.add('timer-danger');
  } else if (timeLeft <= getWarningThreshold()) {
    timerBoxEl.classList.add('timer-warning');
  } else if (timeLeft <= Math.ceil(difficulty.timeLimit * 0.5)) {
    timerBoxEl.classList.add('timer-caution');
  }
}

function resetTimerStyle() {
  timerBoxEl.classList.remove('timer-caution', 'timer-warning', 'timer-danger');
}

function getWarningThreshold() {
  return Math.max(3, Math.ceil(difficulty.timeLimit * TIMER_WARNING_RATIO));
}

function getDangerThreshold() {
  return Math.max(1, Math.ceil(difficulty.timeLimit * TIMER_DANGER_RATIO));
}

function showMessage(text, isCorrect) {
  messageEl.textContent = text;
  messageEl.className = 'message ' + (isCorrect ? 'msg-correct' : 'msg-wrong');
}

async function showGameOverModal(titleText) {
  clearInterval(timerInterval);
  hiddenInputEl.disabled = true;

  finalScore = getAdjustedScore(rawScore);
  modalTitleEl.textContent = titleText;
  modalScoreEl.textContent = nickname + ' · ' + difficulty.label + ' · 최종 점수 ' + finalScore + '점!';

  await saveRanking(nickname, finalScore, difficultyKey);

  gameOverModalEl.classList.remove('hidden');
}

function showResultScreen() {
  gameOverModalEl.classList.add('hidden');
  resultTitleEl.textContent = nickname + '의 점수는 ' + finalScore + '점!';
  resultSubtitleEl.textContent = difficulty.label + ' 난이도 (점수 배율 x' + difficulty.multiplier + ') 로 기록을 남겼어!';
  renderRanking();
  resultSectionEl.classList.remove('hidden');
}

async function renderRanking() {
  const rankings = await loadRanking();
  let currentPlayerMarked = false;
  rankingBodyEl.innerHTML = '';

  if (rankings.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="4">아직 기록이 없어요!</td>';
    rankingBodyEl.appendChild(emptyRow);
    return;
  }

  rankings.forEach(function (entry, index) {
    const rank = index + 1;
    const tr = document.createElement('tr');

    if (rank === 1) tr.classList.add('rank-1');
    else if (rank === 2) tr.classList.add('rank-2');
    else if (rank === 3) tr.classList.add('rank-3');

    if (entry.nickname === nickname && entry.score === finalScore && entry.difficulty === difficultyKey && !currentPlayerMarked) {
      tr.classList.add('current-player');
      currentPlayerMarked = true;
    }

    let rankDisplay = rank + '위';
    if (rank === 1) rankDisplay = '🥇 1위';
    else if (rank === 2) rankDisplay = '🥈 2위';
    else if (rank === 3) rankDisplay = '🥉 3위';

    tr.innerHTML =
      '<td>' + rankDisplay + '</td>' +
      '<td>' + escapeHtml(entry.nickname) + '</td>' +
      '<td>' + escapeHtml(formatDifficulty(entry.difficulty)) + '</td>' +
      '<td>' + entry.score + '점</td>';

    rankingBodyEl.appendChild(tr);
  });
}

async function saveRanking(nick, scoreValue, selectedDifficulty) {
  try {
    const response = await fetch('/api/ranking/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        nickname: nick,
        score: scoreValue,
        difficulty: selectedDifficulty
      })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (e) {
    console.error('순위 저장 실패:', e);
    return false;
  }
}

async function loadRanking() {
  try {
    const response = await fetch('/api/ranking/get', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (data.success) {
      return data.rankings.map(function (item) {
        return {
          nickname: item.nickname,
          score: item.score,
          difficulty: item.difficulty || 'easy'
        };
      });
    }
    return [];
  } catch (e) {
    console.error('순위 로드 실패:', e);
    return [];
  }
}

function pickRandomSentence() {
  let available = [];
  for (let i = 0; i < SENTENCES.length; i++) {
    if (usedIndices.indexOf(i) === -1) {
      available.push(i);
    }
  }

  if (available.length === 0) {
    usedIndices = [];
    available = SENTENCES.map(function (_, i) { return i; });
  }

  const randIndex = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(randIndex);
  return SENTENCES[randIndex];
}

function formatDifficulty(key) {
  const currentDifficulty = DIFFICULTY_SETTINGS[key];
  return currentDifficulty ? currentDifficulty.label : 'EASY';
}

function returnToStart() {
  sessionStorage.removeItem('nickname');
  sessionStorage.removeItem('difficulty');
  window.location.href = '/start';
}

/* ── UI 피드백 함수 ── */

// 콤보 팝업: .bread-area 내 #combo-display에 span 생성
function showComboDisplay(currentCombo) {
  const container = document.getElementById('combo-display');
  if (!container) return;

  container.innerHTML = '';

  const span = document.createElement('span');
  span.className = 'combo-text';

  let level;
  if (currentCombo >= 5)      level = 4;
  else if (currentCombo >= 3) level = 3;
  else if (currentCombo >= 2) level = 2;
  else                        level = 1;

  span.classList.add('level-' + level);
  span.textContent = currentCombo >= 5
    ? 'COMBO ' + currentCombo + '!!'
    : 'Combo ' + currentCombo + '!';

  container.appendChild(span);
  span.addEventListener('animationend', function () {
    if (container.contains(span)) container.removeChild(span);
  });
}

// 점수 플로팅: 점수 박스 위에 +N 텍스트가 떠오르며 사라짐
function showScoreFloat(adjustedGain) {
  const rect = scoreValueEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'score-float-item';
  el.textContent = '+' + adjustedGain;
  el.style.left = (rect.left + rect.width / 2) + 'px';
  el.style.top = rect.top + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', function () {
    if (document.body.contains(el)) document.body.removeChild(el);
  });
}

// 식빵 바운스: 정답 시 통통 튀는 애니메이션
function bounceBread() {
  if (!breadImageEl) return;
  breadImageEl.classList.remove('bread-bounce');
  void breadImageEl.offsetWidth;
  breadImageEl.classList.add('bread-bounce');
  breadImageEl.addEventListener('animationend', function handler() {
    breadImageEl.classList.remove('bread-bounce');
    breadImageEl.removeEventListener('animationend', handler);
  });
}

// 식빵 글로우: 콤보 수에 따라 글로우 강도 변경
function updateBreadGlow(currentCombo) {
  if (!breadImageEl) return;
  breadImageEl.classList.remove('combo-glow-1', 'combo-glow-2', 'combo-glow-3');
  if (currentCombo >= 5)      breadImageEl.classList.add('combo-glow-3');
  else if (currentCombo >= 3) breadImageEl.classList.add('combo-glow-2');
  else if (currentCombo >= 1) breadImageEl.classList.add('combo-glow-1');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
