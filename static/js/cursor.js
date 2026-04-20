/* =============================================
   cursor.js - 커스텀 마우스 커서
   =============================================
   동작 방식:
   - 기본 커서를 숨기고, fixed 이미지 요소가 마우스를 lerp로 따라다님
   - 이동 시 spark 입자 생성 후 자동 제거
   - hover 대상 위에서 커서 이미지 확대
   - 터치 디바이스 / prefers-reduced-motion 자동 감지
   ============================================= */

/* ── 설정값 (여기만 수정하면 됨) ── */
const CURSOR_CONFIG = {
  size: 40,    // 커서 이미지 크기 (px)
  lerpFactor: 0.18,  // 따라오기 속도 (0.1 = 느리게 / 0.5 = 빠르게)
  hoverScale: 1.55,  // hover 시 커서 확대 배율
  sparkCount: 5,     // 한 번에 생성할 spark 개수
  sparkInterval: 48,    // spark 생성 최소 간격 (ms) — 낮으면 더 자주
  sparkMinSize: 1.5,   // spark 최소 크기 (px)
  sparkMaxSize: 4.0,   // spark 최대 크기 (px)
  sparkMinDist: 8,     // spark 퍼지는 최소 거리 (px)
  sparkMaxDist: 22,    // spark 퍼지는 최대 거리 (px)
};

/* ── spark 색상 팔레트 ── */
const SPARK_COLORS = [
  '#ffffff',  /* 흰색   */
  '#aee6ff',  /* 연파랑 */
  '#ffe077',  /* 노랑   */
  '#c9f0ff',  /* 하늘색 */
  '#e8b4ff',  /* 연보라 */
];

/* ── 터치 디바이스 감지 (모바일에서는 비활성화) ── */
function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}

/* ── prefers-reduced-motion 감지 ── */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 터치 디바이스면 전체 비활성화 */
if (!isTouchDevice()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
  } else {
    initCursor();
  }
}

/* =============================================
   커서 초기화
   ============================================= */
function initCursor() {

  /* ── 커서 컨테이너 생성 ── */
  var cursorEl = document.createElement('div');
  cursorEl.id = 'custom-cursor';

  /* 커서 이미지
   * Flask static 기준 경로
   */
  var imgEl = document.createElement('img');
  imgEl.id = 'cursor-img';
  imgEl.src = '/static/images/magic.png';
  imgEl.alt = '';

  /* 이미지 로드 성공 확인 */
  imgEl.addEventListener('load', function () {
    console.log('[cursor] /static/images/magic.png 로드 성공 ✅');
  });

  /* 이미지 로드 실패 시: 콘솔 에러 + 깨진 아이콘 숨김 처리 */
  imgEl.addEventListener('error', function () {
    console.error('[cursor] /static/images/magic.png 로드 실패 ❌ — 경로를 확인하세요: /static/images/magic.png');
    /* 깨진 아이콘이 보이지 않도록 커서 요소 전체를 숨김 */
    cursorEl.style.display = 'none';
  });

  cursorEl.appendChild(imgEl);
  document.body.appendChild(cursorEl);

  /* CSS 변수로 크기 주입 (CSS에서도 참조 가능) */
  document.documentElement.style.setProperty('--cursor-size', CURSOR_CONFIG.size + 'px');
  document.documentElement.style.setProperty('--cursor-hover-scale', CURSOR_CONFIG.hoverScale);

  /* ── 상태 변수 ── */
  var mouseX = -300;
  var mouseY = -300;
  var renderX = -300;  /* lerp 계산용 현재 렌더 위치 */
  var renderY = -300;
  var visible = false; /* 처음 마우스 진입 전까지 숨김 */
  var hovering = false; /* hover 대상 위에 있는지 */
  var lastSparkTime = 0;

  /* ── 마우스 이동 이벤트 ── */
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    /* 처음 진입 시 lerp 없이 즉시 이동해서 튀는 느낌 방지 */
    if (!visible) {
      renderX = mouseX;
      renderY = mouseY;
      visible = true;
      cursorEl.classList.add('cursor-visible');
    }

    /* spark 생성 (쓰로틀링으로 성능 관리) */
    if (!reducedMotion) {
      var now = Date.now();
      if (now - lastSparkTime > CURSOR_CONFIG.sparkInterval) {
        spawnSparks(mouseX, mouseY);
        lastSparkTime = now;
      }
    }
  });

  /* ── 화면 밖으로 나가면 커서 숨기기 ── */
  document.addEventListener('mouseleave', function () {
    cursorEl.classList.remove('cursor-visible');
    visible = false;
  });

  /* ── 화면 다시 들어오면 즉시 위치 맞추고 보이기 ── */
  document.addEventListener('mouseenter', function (e) {
    /* 즉시 이동 후 표시 (lerp 잔상 없애기) */
    renderX = e.clientX;
    renderY = e.clientY;
    visible = true;
    cursorEl.classList.add('cursor-visible');
  });

  /* ── hover 대상: 버튼, 링크, 입력창 등 ── */
  var HOVER_TARGET = 'a, button, input, textarea, select, label, [role="button"], .clickable';

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(HOVER_TARGET)) {
      hovering = true;
      cursorEl.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(HOVER_TARGET)) {
      hovering = false;
      cursorEl.classList.remove('cursor-hover');
    }
  });

  /* ── rAF 루프: lerp로 부드러운 이동 ── */
  function tick() {
    /* 실제 마우스 위치 쪽으로 매 프레임 조금씩 이동 */
    renderX += (mouseX - renderX) * CURSOR_CONFIG.lerpFactor;
    renderY += (mouseY - renderY) * CURSOR_CONFIG.lerpFactor;

    /* 커서 중앙이 마우스 포인터에 오도록 크기의 절반만큼 오프셋 */
    var offsetX = renderX - CURSOR_CONFIG.size / 2;
    var offsetY = renderY - CURSOR_CONFIG.size / 2;

    /* transform으로 위치 변경 → reflow 없이 GPU 가속 */
    cursorEl.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* =============================================
   spark 생성
   ============================================= */
function spawnSparks(x, y) {
  var count = CURSOR_CONFIG.sparkCount;

  for (var i = 0; i < count; i++) {
    var spark = document.createElement('div');
    spark.className = 'cursor-spark';

    /* 랜덤 색상 */
    spark.style.backgroundColor =
      SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];

    /* 랜덤 크기 */
    var size = CURSOR_CONFIG.sparkMinSize +
      Math.random() * (CURSOR_CONFIG.sparkMaxSize - CURSOR_CONFIG.sparkMinSize);
    spark.style.width = size + 'px';
    spark.style.height = size + 'px';

    /* 시작 위치: 커서 중앙 기준으로 배치 */
    spark.style.left = (x - size / 2) + 'px';
    spark.style.top = (y - size / 2) + 'px';

    /* 랜덤 방향과 퍼지는 거리 */
    var angle = Math.random() * Math.PI * 2;
    var distance = CURSOR_CONFIG.sparkMinDist +
      Math.random() * (CURSOR_CONFIG.sparkMaxDist - CURSOR_CONFIG.sparkMinDist);
    spark.style.setProperty('--tx', (Math.cos(angle) * distance).toFixed(1) + 'px');
    spark.style.setProperty('--ty', (Math.sin(angle) * distance).toFixed(1) + 'px');

    /* 랜덤 애니메이션 지속 시간 */
    var duration = 0.4 + Math.random() * 0.35;
    spark.style.animationDuration = duration.toFixed(2) + 's';

    document.body.appendChild(spark);

    /* 애니메이션이 끝나면 DOM에서 즉시 제거 */
    spark.addEventListener('animationend', function () {
      this.remove();
    }, { once: true });
  }
}
