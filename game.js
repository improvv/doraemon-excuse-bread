/* =============================================
   game.js - 게임 화면 동작
   =============================================
   담당 기능:
   - 닉네임 불러오기 및 검증
   - 문장 랜덤 선택
   - 라운드 / 타이머 / 점수 관리
   - 그리드 렌더링 (원문 + 입력 현황)
   - 한글 IME(composition) 처리
   - 숨겨진 textarea 입력 처리
   - 정답 판정 + 피드백
   - 게임 오버 모달
   - 결과 화면 + 랭킹 렌더링
   - localStorage 랭킹 저장
   ============================================= */


/* ==============================================
   1. 문장 데이터
   주제: 공부를 안 해도 되는 웃긴 이유 스타일
   ============================================== */
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
  '내일부터 진짜 시작하면 되기 때문에 오늘은 마음의 준비를 하는 소중한 날로 기억될 것이다.',
];


/* ==============================================
   2. 게임 설정 상수
   ============================================== */
const TOTAL_ROUNDS = 5;    // 총 라운드 수
const TIME_LIMIT = 30;   // 라운드당 제한 시간 (초)
const SCORE_BASE = 100;  // 정답 기본 점수
const SCORE_PER_SECOND = 10;   // 남은 시간 1초당 추가 점수
const SCORE_COMBO_BONUS = 50;   // 콤보 보너스 (2콤보 이상부터)
const RANKING_KEY = 'doraemon_bread_ranking'; // localStorage 키
const RANKING_MAX = 10;   // 랭킹 저장 최대 인원
const TIMER_WARNING = 4;    // 경고 구간 시작 (초)
const TIMER_DANGER = 2;    // 위험 구간 시작 (초)

/* 그리드 한 줄 최대 글자 수 */
const MAX_COLS = 28;


/* ==============================================
   3. 게임 상태 변수
   ============================================== */
let nickname = '';
let currentRound = 1;
let score = 0;
let combo = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let currentSentence = '';
let usedIndices = [];

/* IME(한글 조합) 상태 */
let isComposing = false;
let composingText = '';


/* ==============================================
   4. DOM 요소 참조
   ============================================== */
const scoreValueEl = document.getElementById('score-value');
const roundValueEl = document.getElementById('round-value');
const timerValueEl = document.getElementById('timer-value');
const timerBoxEl = document.getElementById('timer-box');
const progressBarEl = document.getElementById('progressBar');
const submitBtnEl = document.getElementById('submit-btn');
const messageEl = document.getElementById('message');

/* 그리드 영역 */
const textOverlayEl = document.getElementById('textOverlay');
const hiddenInputEl = document.getElementById('hiddenInput');

/* 모달 요소 */
const gameOverModalEl = document.getElementById('game-over-modal');
const modalTitleEl = document.getElementById('modal-title');
const modalScoreEl = document.getElementById('modal-score');
const viewResultBtnEl = document.getElementById('view-result-btn');
const modalHomeBtnEl = document.getElementById('modal-home-btn');

/* 결과 화면 요소 */
const resultSectionEl = document.getElementById('result-section');
const resultTitleEl = document.getElementById('result-title');
const rankingBodyEl = document.getElementById('ranking-body');
const goHomeBtnEl = document.getElementById('go-home-btn');


/* ==============================================
   5. 초기화 - 페이지 로드 시 실행
   ============================================== */
document.addEventListener('DOMContentLoaded', function () {

  /* 닉네임 불러오기 */
  nickname = sessionStorage.getItem('nickname') || '';

  if (nickname === '') {
    alert('닉네임이 없어! 시작 화면에서 이름을 입력하고 오자!');
    window.location.href = 'start.html';
    return;
  }

  /* 버튼 이벤트 */
  submitBtnEl.addEventListener('click', handleSubmit);

  /* 엔터로도 제출 */
  hiddenInputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  });

  /* 실시간 그리드 렌더링 */
  hiddenInputEl.addEventListener('input', function () {
    renderUnifiedGrid(hiddenInputEl.value);
  });

  /* 한글 IME 조합 시작 */
  hiddenInputEl.addEventListener('compositionstart', function () {
    isComposing = true;
  });

  /* 조합 중 (조합 글자 미리 표시) */
  hiddenInputEl.addEventListener('compositionupdate', function () {
    renderUnifiedGrid(hiddenInputEl.value);
  });

  /* 조합 완료 */
  hiddenInputEl.addEventListener('compositionend', function () {
    isComposing = false;
    renderUnifiedGrid(hiddenInputEl.value);
  });

  /* 모달 버튼 */
  viewResultBtnEl.addEventListener('click', showResultScreen);
  modalHomeBtnEl.addEventListener('click', function () {
    sessionStorage.removeItem('nickname');
    window.location.href = 'start.html';
  });

  /* 결과 화면 버튼 */
  goHomeBtnEl.addEventListener('click', function () {
    sessionStorage.removeItem('nickname');
    window.location.href = 'start.html';
  });

  /* 항상 입력창에 포커스 유지 (타자 안 쳐지는 현상 방지) */
  document.addEventListener('click', function () {
    if (hiddenInputEl && !hiddenInputEl.disabled) {
      hiddenInputEl.focus();
    }
  });

  /* 게임 시작 */
  startGame();
});


/* ==============================================
   6. 게임 흐름 함수
   ============================================== */

function startGame() {
  currentRound = 1;
  score = 0;
  combo = 0;
  usedIndices = [];

  updateScoreDisplay();
  startRound();
}

function startRound() {
  /* 라운드 표시 */
  roundValueEl.textContent = currentRound + ' / ' + TOTAL_ROUNDS;

  /* 문장 선택 */
  currentSentence = pickRandomSentence();

  /* IME 상태 초기화 */
  isComposing = false;
  composingText = '';

  /* 그리드 렌더링 */
  renderUnifiedGrid('');

  /* 입력창 초기화 */
  hiddenInputEl.value = '';
  hiddenInputEl.disabled = false;
  hiddenInputEl.focus();

  /* 피드백 메시지 초기화 */
  messageEl.textContent = '';
  messageEl.className = 'message';

  /* 타이머 리셋 */
  timeLeft = TIME_LIMIT;
  updateTimerDisplay();
  updateProgressBar();
  resetTimerStyle();
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  timeLeft--;
  updateTimerDisplay();
  updateProgressBar();
  applyTimerStyle();

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    handleTimeOver();
  }
}

function handleTimeOver() {
  hiddenInputEl.disabled = true;
  combo = 0;

  showMessage('시간 초과! ⏰', false);

  if (currentRound < TOTAL_ROUNDS) {
    setTimeout(function () {
      currentRound++;
      startRound();
    }, 900);
  } else {
    setTimeout(function () {
      showGameOverModal('타임 오버!');
    }, 900);
  }
}

function handleSubmit() {
  clearInterval(timerInterval);

  const userAnswer = hiddenInputEl.value;

  /* 빈 입력 무시 */
  if (userAnswer === '') {
    timerInterval = setInterval(tickTimer, 1000);
    return;
  }

  hiddenInputEl.disabled = true;

  if (userAnswer === currentSentence) {
    /* ── 정답 ── */
    const gained = calcScore(timeLeft);
    score += gained;
    combo++;
    updateScoreDisplay();

    showMessage('정답! 🎉 +' + gained + '점', true);

    if (currentRound < TOTAL_ROUNDS) {
      setTimeout(function () {
        currentRound++;
        startRound();
      }, 900);
    } else {
      setTimeout(function () {
        showGameOverModal('게임 종료!');
      }, 900);
    }
  } else {
    /* ── 오답 ── */
    combo = 0;

    showMessage('틀렸어... 😢 다음 기회에!', false);

    if (currentRound < TOTAL_ROUNDS) {
      setTimeout(function () {
        currentRound++;
        startRound();
      }, 900);
    } else {
      setTimeout(function () {
        showGameOverModal('게임 종료!');
      }, 900);
    }
  }
}


/* ==============================================
   7. 그리드 통합 렌더링 함수
   ============================================== */

function renderUnifiedGrid(typedValue) {
  let html = '';
  
  // 기준 원문을 한 겹으로 렌더링
  for (let i = 0; i < currentSentence.length; i++) {
    let originalChar = currentSentence[i];
    let cls = '';

    let currentToDisplay = originalChar;

    if (i < typedValue.length) {
      currentToDisplay = typedValue[i]; // 사용자가 단어로 친 오타, 자음/모음을 화면에 덮어씌움
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
  
  // 사용자가 원문보다 더 길게 초과해서 입력했을 경우
  if (typedValue.length >= currentSentence.length) {
    for (let i = currentSentence.length; i < typedValue.length; i++) {
      let extraChar = typedValue[i];
      let cls = 'extra';
      if (isComposing && i === typedValue.length - 1) {
        cls += ' composing';
      }
      html += '<span class="' + cls + '">' + (extraChar === ' ' ? '&nbsp;' : escapeHtml(extraChar)) + '</span>';
    }
    // 초과 길이의 마지막에 커서 부착
    html += '<span class="cursor"></span>';
  }
  
  textOverlayEl.innerHTML = html;
}


/* ==============================================
   8. 점수 계산
   ============================================== */

function calcScore(remainingTime) {
  var gained = SCORE_BASE + remainingTime * SCORE_PER_SECOND;

  if (combo >= 1) {
    gained += SCORE_COMBO_BONUS;
  }

  return gained;
}


/* ==============================================
   9. UI 업데이트 함수
   ============================================== */

function updateScoreDisplay() {
  scoreValueEl.textContent = score;
  triggerPop(scoreValueEl);
}

function updateTimerDisplay() {
  timerValueEl.textContent = timeLeft;
  if (timeLeft <= 3) {
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
  var percent = (timeLeft / TIME_LIMIT) * 100;
  progressBarEl.style.width = percent + '%';

  if (timeLeft <= TIMER_DANGER) {
    progressBarEl.classList.add('danger');
  } else {
    progressBarEl.classList.remove('danger');
  }
}

function applyTimerStyle() {
  timerBoxEl.classList.remove('timer-warning', 'timer-danger');

  if (timeLeft <= TIMER_DANGER) {
    timerBoxEl.classList.add('timer-danger');
  } else if (timeLeft <= TIMER_WARNING) {
    timerBoxEl.classList.add('timer-warning');
  }
}

function resetTimerStyle() {
  timerBoxEl.classList.remove('timer-warning', 'timer-danger');
}

/**
 * 라운드 결과 피드백 메시지 표시
 */
function showMessage(text, isCorrect) {
  messageEl.textContent = text;
  messageEl.className = 'message ' + (isCorrect ? 'msg-correct' : 'msg-wrong');
}


/* ==============================================
   10. 게임 오버 모달
   ============================================== */

async function showGameOverModal(titleText) {
  clearInterval(timerInterval);
  hiddenInputEl.disabled = true;

  modalTitleEl.textContent = titleText;
  modalScoreEl.textContent = nickname + '의 최종 점수: ' + score + '점!';

  await saveRanking(nickname, score);

  gameOverModalEl.classList.remove('hidden');
}


/* ==============================================
   11. 결과 화면
   ============================================== */

function showResultScreen() {
  gameOverModalEl.classList.add('hidden');
  resultTitleEl.textContent = nickname + '의 점수는 ' + score + '점!';
  renderRanking();
  resultSectionEl.classList.remove('hidden');
}

async function renderRanking() {
  var rankings = await loadRanking();
  rankingBodyEl.innerHTML = '';

  if (rankings.length === 0) {
    var emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="3">아직 기록이 없어요!</td>';
    rankingBodyEl.appendChild(emptyRow);
    return;
  }

  rankings.forEach(function (entry, index) {
    var rank = index + 1;
    var tr = document.createElement('tr');

    if (rank === 1) tr.classList.add('rank-1');
    else if (rank === 2) tr.classList.add('rank-2');
    else if (rank === 3) tr.classList.add('rank-3');

    if (entry.nickname === nickname && entry.score === score && !tr.dataset.marked) {
      tr.classList.add('current-player');
      tr.dataset.marked = 'true';
    }

    var rankDisplay = rank + '위';
    if (rank === 1) rankDisplay = '🥇 1위';
    else if (rank === 2) rankDisplay = '🥈 2위';
    else if (rank === 3) rankDisplay = '🥉 3위';

    tr.innerHTML =
      '<td>' + rankDisplay + '</td>' +
      '<td>' + escapeHtml(entry.nickname) + '</td>' +
      '<td>' + entry.score + '점</td>';

    rankingBodyEl.appendChild(tr);
  });
}


/* ==============================================
   12. 랭킹 MongoDB API 관리
   ============================================== */

async function saveRanking(nick, s) {
  try {
    const response = await fetch('/api/ranking/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: nick,
        score: s
      })
    });
    const data = await response.json();
    return data.success;
  } catch (e) {
    console.error('순위 저장 실패:', e);
    return false;
  }
}

async function loadRanking() {
  try {
    const response = await fetch('/api/ranking/get');
    const data = await response.json();
    if (data.success) {
      return data.rankings.map(item => ({
        nickname: item.nickname,
        score: item.score
      }));
    }
    return [];
  } catch (e) {
    console.error('순위 로드 실패:', e);
    return [];
  }
}


/* ==============================================
   13. 문장 선택 유틸
   ============================================== */

function pickRandomSentence() {
  var available = [];
  for (var i = 0; i < SENTENCES.length; i++) {
    if (usedIndices.indexOf(i) === -1) available.push(i);
  }

  if (available.length === 0) {
    usedIndices = [];
    available = SENTENCES.map(function (_, i) { return i; });
  }

  var randIndex = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(randIndex);
  return SENTENCES[randIndex];
}


/* ==============================================
   14. 보안 유틸
   ============================================== */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
