/* =============================================
   stars.js - 밤하늘 별 생성
   =============================================
   body에 .star 요소를 동적으로 추가하고
   CSS의 star-twinkle 애니메이션으로 반짝임 처리
   ============================================= */

(function createStars() {
  /* 생성할 별 개수 */
  var STAR_COUNT = 80;

  /* 별 크기 범위 (px) */
  var SIZE_MIN = 1;
  var SIZE_MAX = 3;

  /* 반짝임 주기 범위 (초) */
  var DURATION_MIN = 1.5;
  var DURATION_MAX = 4.0;

  for (var i = 0; i < STAR_COUNT; i++) {
    var star = document.createElement('div');
    star.classList.add('star');

    /* 랜덤 위치 (화면 전체) */
    var x = Math.random() * 100;  /* vw % */
    var y = Math.random() * 100;  /* vh % */
    star.style.left = x + 'vw';
    star.style.top  = y + 'vh';

    /* 랜덤 크기 */
    var size = SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN);
    star.style.width  = size + 'px';
    star.style.height = size + 'px';

    /* 랜덤 반짝임 주기 + 시작 딜레이 */
    var duration = DURATION_MIN + Math.random() * (DURATION_MAX - DURATION_MIN);
    var delay    = Math.random() * DURATION_MAX;
    star.style.setProperty('--star-duration', duration.toFixed(2) + 's');
    star.style.setProperty('--star-delay',    delay.toFixed(2)    + 's');

    /* 크기가 클수록 약간 더 밝게 */
    var baseOpacity = 0.3 + (size / SIZE_MAX) * 0.5;
    star.style.opacity = baseOpacity.toFixed(2);

    document.body.appendChild(star);
  }
})();
