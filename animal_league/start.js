/* =============================================
   start.js - 시작 화면 동작
   =============================================
   - 닉네임 입력 검증
   - 닉네임 저장 (sessionStorage)
   - index.html 이동
   ============================================= */

// DOM이 모두 로드된 후 실행
document.addEventListener('DOMContentLoaded', function () {

  /* ── 요소 참조 ── */
  const startBtn      = document.getElementById('start-btn');
  const nicknameInput = document.getElementById('nickname-input');
  const errorMsg      = document.getElementById('nickname-error');

  /* ── 시작 버튼 클릭 ── */
  startBtn.addEventListener('click', function () {
    handleStart();
  });

  /* ── 입력창에서 엔터 키 누를 때도 동작 ── */
  nicknameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      handleStart();
    }
  });

  /* ── 입력 중 오류 메시지 숨기기 ── */
  nicknameInput.addEventListener('input', function () {
    hideError();
  });

  /**
   * 닉네임 검증 후 게임 화면으로 이동
   */
  function handleStart() {
    // 앞뒤 공백 제거 후 닉네임 추출
    const nickname = nicknameInput.value.trim();

    if (nickname === '') {
      // 닉네임 없으면 경고 표시
      showError();
      nicknameInput.focus();
      return;
    }

    // sessionStorage에 닉네임 저장
    sessionStorage.setItem('nickname', nickname);

    // 게임 화면으로 이동
    window.location.href = 'index.html';
  }

  /**
   * 오류 메시지 표시
   */
  function showError() {
    errorMsg.classList.remove('hidden');
    nicknameInput.style.borderColor = 'var(--color-danger)';
  }

  /**
   * 오류 메시지 숨기기
   */
  function hideError() {
    errorMsg.classList.add('hidden');
    nicknameInput.style.borderColor = '';
  }

});
