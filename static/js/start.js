/* =============================================
   start.js - 시작 화면 동작
   =============================================
   - 닉네임 입력 검증
   - 난이도 선택 모달
   - 닉네임/난이도 저장 (sessionStorage)
   - 게임 화면 이동
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {
  const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣 _-]{1,10}$/;

  const startBtn = document.getElementById('start-btn');
  const nicknameInput = document.getElementById('nickname-input');
  const errorMsg = document.getElementById('nickname-error');
  const doraemonImg = document.getElementById('doraemon-img');
  const difficultyModal = document.getElementById('difficulty-modal');
  const difficultyCancelBtn = document.getElementById('difficulty-cancel-btn');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');

  if (doraemonImg) {
    doraemonImg.addEventListener('error', function () {
      doraemonImg.style.display = 'none';
      document.getElementById('doraemon-placeholder').style.display = 'flex';
    }, { once: true });
  }

  startBtn.addEventListener('click', openDifficultyModal);

  nicknameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      openDifficultyModal();
    }
  });

  nicknameInput.addEventListener('input', hideError);

  difficultyButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      saveAndStart(button.dataset.difficulty);
    });
  });

  difficultyCancelBtn.addEventListener('click', function () {
    difficultyModal.classList.add('hidden');
    nicknameInput.focus();
  });

  function openDifficultyModal() {
    const nickname = nicknameInput.value.trim();

    if (nickname === '') {
      showError('닉네임을 입력해야 빵을 먹을 수 있어!');
      nicknameInput.focus();
      return;
    }

    if (!NICKNAME_PATTERN.test(nickname)) {
      showError('닉네임은 한글, 영문, 숫자, 공백, _, -만 10자까지 가능해!');
      nicknameInput.focus();
      return;
    }

    hideError();
    difficultyModal.classList.remove('hidden');
  }

  function saveAndStart(difficulty) {
    const nickname = nicknameInput.value.trim();

    sessionStorage.setItem('nickname', nickname);
    sessionStorage.setItem('difficulty', difficulty);
    window.location.href = '/game';
  }

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    nicknameInput.style.borderColor = 'var(--color-danger)';
  }

  function hideError() {
    errorMsg.classList.add('hidden');
    nicknameInput.style.borderColor = '';
  }
});
