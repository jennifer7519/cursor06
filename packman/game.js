const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 설정
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GROUND_HEIGHT = 80;
const PACMAN_RADIUS = 28;
const GRAVITY = 0.7;
const GROUND_SPEED = 3;
const TILE_WIDTH = 80;
const MIN_GROUND_Y = GAME_HEIGHT - 200;
const MAX_GROUND_Y = GAME_HEIGHT - 60;

let groundOffset = 0;

let pacman = {
  x: GAME_WIDTH * 0.25, // 화면에 고정
  y: GAME_HEIGHT - GROUND_HEIGHT - PACMAN_RADIUS,
  vy: 0,
  onGround: true
};

let score = 0;
let dots = [];
const DOT_RADIUS = 10;
const DOT_INTERVAL = 3; // 몇 타일마다 하나씩 점 생성

// 바닥 타일 배열 생성 (각 타일은 {x, y})
let groundTiles = [];
let obstacles = [];
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 20;
const OBSTACLE_TYPES = ['square', 'triangle', 'star'];
const OBSTACLE_COLORS = {
  square: '#e53935',
  triangle: '#43a047',
  star: '#40c4ff'
};
const OBSTACLE_CHANCE = 0.25; // 시작 확률 25%
let lastObstacleX = -Infinity;

let gameTick = 0;
let baseGroundSpeed = 3;
let groundSpeed = baseGroundSpeed;
const SPEEDUP_INTERVAL = 600; // 프레임(약 10초)마다 속도 증가
const SPEEDUP_AMOUNT = 0.4;
const MAX_GROUND_SPEED = 8;

let stars = [];
const STAR_RADIUS = 13;
const STAR_COLOR = '#b266ff';
const STAR_CHANCE = 0.2; // 20% 확률

// --- 배경 오브젝트 ---
let clouds = [];
let hills = [];
let bgStars = [];

const MAX_JUMP_Y = GAME_HEIGHT * 0.10 + PACMAN_RADIUS; // 화면 위에서 10%까지만

let highScore = Number(localStorage.getItem('packman_highscore') || 0);

let showRestartBtn = false;
let restartBtnRect = null;

// --- 스테이지 설정 ---
const STAGES = [
  { goal: 400, obstacleChance: 0.18, speed: 2 },
  { goal: 900, obstacleChance: 0.28, speed: 3 },
  { goal: 1600, obstacleChance: 0.38, speed: 5 },
  { goal: 2500, obstacleChance: 0.48, speed: 8 },
  { goal: 3600, obstacleChance: 0.55, speed: 11 }
];
let currentStage = 0;
let stageGoal = 0;
let stageObstacleChance = 0.25;
let stageBaseSpeed = 3;
let stageClear = false;
let showAllClear = false;

const STAGE_THEMES = [
  // 낮, 저녁, 밤, 우주, 파스텔
  { sky: ['#6ec6ff', '#fffde4'], cloud: '#fff', hill: ['#6ab04c', '#badc58', '#218c5a'] },
  { sky: ['#ffb347', '#ffcc80'], cloud: '#b0bec5', hill: ['#8d5524', '#e1b382', '#b68973'] },
  { sky: ['#2d3a6e', '#22223b'], cloud: '#b3c6ff', hill: ['#3d5a80', '#293241', '#98c1d9'] },
  { sky: ['#1e3c72', '#2a5298'], cloud: '#b0bec5', hill: ['#607d8b', '#26a69a', '#455a64'] },
  { sky: ['#e0c3fc', '#8ec5fc'], cloud: '#e0e0e0', hill: ['#ff6f91', '#b388ff', '#8fd3f4'] }
];

window.startStageGame = function(stageNum) {
  currentStage = stageNum - 1;
  stageGoal = STAGES[currentStage].goal;
  stageObstacleChance = STAGES[currentStage].obstacleChance;
  stageBaseSpeed = STAGES[currentStage].speed;
  showAllClear = false;
  stageClear = false;
  resetGame();
};

function getCurrentObstacleChance() {
  // 스테이지별 고정 확률
  return stageObstacleChance;
}

function initBackground() {
  // 구름 여러 개
  clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * GAME_WIDTH,
      y: 40 + Math.random() * 80,
      w: 80 + Math.random() * 60,
      h: 30 + Math.random() * 20,
      speed: 0.3 + Math.random() * 0.2
    });
  }
  // 언덕 여러 개
  hills = [];
  for (let i = 0; i < 3; i++) {
    hills.push({
      x: Math.random() * GAME_WIDTH,
      y: GAME_HEIGHT - 60 - Math.random() * 60,
      r: 80 + Math.random() * 60,
      color: i === 0 ? '#6ab04c' : (i === 1 ? '#218c5a' : '#badc58')
    });
  }
  // 밤하늘 별
  bgStars = [];
  for (let i = 0; i < 30; i++) {
    bgStars.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * (GAME_HEIGHT * 0.5),
      r: 1 + Math.random() * 1.5,
      tw: Math.random() * Math.PI * 2
    });
  }
}

initBackground();

function updateBackground() {
  // 구름 이동
  for (let c of clouds) {
    c.x -= c.speed;
    if (c.x + c.w < 0) {
      c.x = GAME_WIDTH + Math.random() * 100;
      c.y = 40 + Math.random() * 80;
      c.w = 80 + Math.random() * 60;
      c.h = 30 + Math.random() * 20;
      c.speed = 0.3 + Math.random() * 0.2;
    }
  }
  // 별 반짝임
  for (let s of bgStars) {
    s.tw += 0.04 + Math.random() * 0.02;
  }
}

function drawBackground() {
  const theme = STAGE_THEMES[currentStage] || STAGE_THEMES[0];
  // 하늘 그라데이션
  let grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, theme.sky[0]);
  grad.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  // 별
  for (let s of bgStars) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s.tw);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }
  // 언덕
  for (let i = 0; i < hills.length; i++) {
    const h = hills[i];
    ctx.save();
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.r, Math.PI, 0, false);
    ctx.fillStyle = theme.hill[i % theme.hill.length];
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.restore();
  }
  // 구름
  for (let c of clouds) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w, c.h, 0, 0, 2 * Math.PI);
    ctx.fillStyle = theme.cloud;
    ctx.fill();
    ctx.restore();
  }
}

for (let i = 0; i < Math.ceil(GAME_WIDTH / TILE_WIDTH) + 2; i++) {
  let prevY = i === 0 ? MAX_GROUND_Y : groundTiles[i - 1].y;
  // 이전 타일과 너무 차이나지 않게
  let y = prevY + (Math.random() - 0.5) * 60;
  y = Math.max(MIN_GROUND_Y, Math.min(MAX_GROUND_Y, y));
  addGroundTile(i * TILE_WIDTH, y, i);
}

// 바닥 타일 생성 시 점도 같이 생성
function addGroundTile(x, y, idx) {
  groundTiles.push({ x, y });
  // 점 생성
  let dotAir = Math.random() < 0.5;
  let dotY = dotAir ? y - DOT_RADIUS - 40 - Math.random() * 80 : y - DOT_RADIUS - 4;
  if (Math.random() < 0.5) {
    dots.push({ x: x + TILE_WIDTH / 2, y: dotY, collected: false });
  }
  // 보라별 생성 (20% 확률, 점과 겹치지 않게)
  if (Math.random() < STAR_CHANCE) {
    let starAir = Math.random() < 0.5;
    let starY = starAir ? y - STAR_RADIUS - 40 - Math.random() * 80 : y - STAR_RADIUS - 4;
    // dot과 겹치지 않게(중심 y좌표 차이 30px 이상)
    let canPlace = true;
    for (let dot of dots) {
      if (Math.abs((x + TILE_WIDTH / 2) - dot.x) < TILE_WIDTH / 2 && Math.abs(starY - dot.y) < 30) {
        canPlace = false;
        break;
      }
    }
    if (canPlace) {
      stars.push({ x: x + TILE_WIDTH / 2, y: starY, collected: false });
    }
  }
  const curObstacleChance = getCurrentObstacleChance();
  if (Math.random() < curObstacleChance && x - lastObstacleX >= TILE_WIDTH * 2) {
    // 빨간 네모가 50% 확률, 나머지 50%는 삼각형/별 중 랜덤
    let type;
    if (Math.random() < 0.5) type = 'square';
    else type = ['triangle', 'star'][Math.floor(Math.random() * 2)];
    let obsY = y - OBSTACLE_HEIGHT;
    let obs = { x: x + TILE_WIDTH / 2 - OBSTACLE_WIDTH / 2, y: obsY, w: OBSTACLE_WIDTH, h: OBSTACLE_HEIGHT, hit: false, type };
    if (type === 'star') {
      obs.baseY = obsY;
      obs.dir = Math.random() < 0.5 ? 1 : -1;
      obs.t = Math.random() * Math.PI * 2;
    }
    obstacles.push(obs);
    lastObstacleX = x;
  }
}

function drawGround() {
  ctx.save();
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.moveTo(groundTiles[0].x - groundOffset, GAME_HEIGHT);
  for (let i = 0; i < groundTiles.length; i++) {
    ctx.lineTo(groundTiles[i].x - groundOffset, groundTiles[i].y);
  }
  ctx.lineTo(groundTiles[groundTiles.length - 1].x - groundOffset, GAME_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPacman() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(pacman.x, pacman.y, PACMAN_RADIUS, 0.25 * Math.PI, 1.75 * Math.PI, false);
  ctx.lineTo(pacman.x, pacman.y);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.restore();
}

function updateGround() {
  gameTick++;
  // 스테이지별 고정 속도 + 점수에 따라 소폭 증가
  groundSpeed = stageBaseSpeed + Math.min(score / 300, 2);
  groundOffset += groundSpeed;
  // 타일이 왼쪽으로 완전히 나가면 제거, 오른쪽에 새 타일 추가
  while (groundTiles.length && groundTiles[0].x - groundOffset < -TILE_WIDTH) {
    groundTiles.shift();
  }
  while (groundTiles.length < Math.ceil(GAME_WIDTH / TILE_WIDTH) + 2) {
    let last = groundTiles[groundTiles.length - 1];
    let y = last.y + (Math.random() - 0.5) * 60;
    y = Math.max(MIN_GROUND_Y, Math.min(MAX_GROUND_Y, y));
    addGroundTile(last.x + TILE_WIDTH, y, groundTiles.length);
  }
}

function getGroundY(px) {
  // px 위치에서의 바닥 y값(선형보간)
  for (let i = 0; i < groundTiles.length - 1; i++) {
    let t1 = groundTiles[i];
    let t2 = groundTiles[i + 1];
    let x1 = t1.x - groundOffset;
    let x2 = t2.x - groundOffset;
    if (px >= x1 && px <= x2) {
      let ratio = (px - x1) / (x2 - x1);
      return t1.y * (1 - ratio) + t2.y * ratio;
    }
  }
  // 범위 밖이면 마지막 타일 y
  return groundTiles[groundTiles.length - 1].y;
}

let isGlide = false;
let jumpQueued = false;

// 키보드: 스페이스바/위/W를 누르면 점프 큐, 떼면 글라이드 해제
// 모바일: 터치다운 시 점프 큐, 터치업 시 글라이드 해제

let gameOver = false;

function updateDots() {
  for (let dot of dots) {
    if (!dot.collected) {
      let dx = (dot.x - groundOffset) - pacman.x;
      let dy = dot.y - pacman.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PACMAN_RADIUS + DOT_RADIUS - 2) {
        dot.collected = true;
        score += 10;
      }
    }
  }
}

function updateStars() {
  for (let star of stars) {
    if (!star.collected) {
      let dx = (star.x - groundOffset) - pacman.x;
      let dy = star.y - pacman.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PACMAN_RADIUS + STAR_RADIUS - 2) {
        star.collected = true;
        score += 20;
      }
    }
  }
}

function updateObstacles() {
  for (let obs of obstacles) {
    if (obs.hit) continue;
    let px = pacman.x;
    let py = pacman.y;
    let ox = obs.x - groundOffset, oy = obs.y;
    let hit = false;
    if (obs.type === 'square') {
      // 사각형 충돌
      hit = (px + PACMAN_RADIUS > ox && px - PACMAN_RADIUS < ox + obs.w && py + PACMAN_RADIUS > oy && py - PACMAN_RADIUS < oy + obs.h);
    } else if (obs.type === 'triangle') {
      // 삼각형(단순 AABB)
      hit = (px + PACMAN_RADIUS > ox && px - PACMAN_RADIUS < ox + obs.w && py + PACMAN_RADIUS > oy && py - PACMAN_RADIUS < oy + obs.h);
    } else if (obs.type === 'star') {
      // 별(원형 근사)
      let dx = px - (ox + obs.w / 2);
      let dy = py - (oy + obs.h / 2);
      let dist = Math.sqrt(dx * dx + dy * dy);
      hit = dist < PACMAN_RADIUS + obs.w / 2 - 2;
    }
    if (hit) {
      obs.hit = true;
      gameOver = true;
    }
  }
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('packman_highscore', highScore);
  }
}

function update() {
  if (gameOver || stageClear || showAllClear) return;
  gameTick++;
  updateBackground();
  updateGround();

  // 점프 처리
  if (pacman.onGround && jumpQueued) {
    pacman.vy = -JUMP_POWER;
    pacman.onGround = false;
    jumpQueued = false;
  }
  // 글라이드: 누르고 있으면 중력 감소(공중에서만)
  let gravity = (isGlide && !pacman.onGround) ? GLIDE_GRAVITY : NORMAL_GRAVITY;
  if (!pacman.onGround) {
    pacman.vy += gravity;
    pacman.vy *= 0.995;
    pacman.y += pacman.vy;
    // 화면 위로 못 나가게
    if (pacman.y < MAX_JUMP_Y) {
      pacman.y = MAX_JUMP_Y;
      if (pacman.vy < 0) pacman.vy = 0;
    }
    // 바닥 충돌
    let groundY = getGroundY(pacman.x);
    if (pacman.y >= groundY - PACMAN_RADIUS) {
      pacman.y = groundY - PACMAN_RADIUS;
      pacman.vy = 0;
      pacman.onGround = true;
    } else {
      pacman.onGround = false;
    }
  } else {
    // 바닥 위에 있을 때는 곡선을 따라감
    pacman.y = getGroundY(pacman.x) - PACMAN_RADIUS;
    pacman.vy = 0;
  }
  updateDots();
  updateStars();
  updateObstacles();
  if (score >= stageGoal) {
    if (currentStage < 4) {
      stageClear = true;
      setTimeout(() => {
        window.startStageGame(currentStage + 2);
      }, 1800);
    } else {
      showAllClear = true;
    }
  }
  if (gameOver) saveHighScore();
}

function drawDots() {
  ctx.save();
  ctx.fillStyle = '#fff200';
  for (let dot of dots) {
    if (!dot.collected && dot.x - groundOffset > -DOT_RADIUS && dot.x - groundOffset < GAME_WIDTH + DOT_RADIUS) {
      ctx.beginPath();
      ctx.arc(dot.x - groundOffset, dot.y, DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStars() {
  ctx.save();
  for (let star of stars) {
    if (!star.collected && star.x - groundOffset > -STAR_RADIUS && star.x - groundOffset < GAME_WIDTH + STAR_RADIUS) {
      ctx.beginPath();
      // 별 모양 그리기
      for (let i = 0; i < 5; i++) {
        let angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        let sx = Math.cos(angle) * STAR_RADIUS + (star.x - groundOffset);
        let sy = Math.sin(angle) * STAR_RADIUS + star.y;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
        angle += Math.PI / 5;
        sx = Math.cos(angle) * (STAR_RADIUS * 0.45) + (star.x - groundOffset);
        sy = Math.sin(angle) * (STAR_RADIUS * 0.45) + star.y;
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = STAR_COLOR;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}

function drawObstacles() {
  for (let obs of obstacles) {
    if (obs.hit || obs.x - groundOffset < -OBSTACLE_WIDTH || obs.x - groundOffset > GAME_WIDTH + OBSTACLE_WIDTH) continue;
    let ox = obs.x - groundOffset, oy = obs.y;
    if (obs.type === 'square') {
      ctx.save();
      ctx.fillStyle = OBSTACLE_COLORS.square;
      ctx.fillRect(ox, oy, obs.w, obs.h);
      ctx.restore();
    } else if (obs.type === 'triangle') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ox + obs.w / 2, oy);
      ctx.lineTo(ox, oy + obs.h);
      ctx.lineTo(ox + obs.w, oy + obs.h);
      ctx.closePath();
      ctx.fillStyle = OBSTACLE_COLORS.triangle;
      ctx.fill();
      ctx.restore();
    } else if (obs.type === 'star') {
      // 움직이는 별(상하)
      obs.t += 0.07;
      obs.y = obs.baseY + Math.sin(obs.t) * 18;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        let angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        let sx = Math.cos(angle) * (obs.w / 2) + ox + obs.w / 2;
        let sy = Math.sin(angle) * (obs.h / 2) + obs.y + obs.h / 2;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
        angle += Math.PI / 5;
        sx = Math.cos(angle) * (obs.w * 0.25) + ox + obs.w / 2;
        sy = Math.sin(angle) * (obs.h * 0.25) + obs.y + obs.h / 2;
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = OBSTACLE_COLORS.star;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
}

function drawScore() {
  ctx.save();
  ctx.fillStyle = 'yellow';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`점수: ${score}`, 20, 40);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`최고: ${highScore}`, 22, 70);
  ctx.restore();
}

function drawStageInfo() {
  ctx.save();
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.fillText(`Stage ${currentStage + 1} / 5`, GAME_WIDTH - 20, 40);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#fff200';
  ctx.fillText(`목표: ${stageGoal}`, GAME_WIDTH - 20, 70);
  ctx.restore();
}

function drawStageClear() {
  ctx.save();
  ctx.fillStyle = '#00e676';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Stage Clear!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('다음 스테이지로...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
  ctx.restore();
}

function drawAllClear() {
  ctx.save();
  ctx.fillStyle = '#ffd600';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('축하합니다! 올클리어!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('처음으로 돌아가기', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
  ctx.restore();
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'red';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = 'yellow';
  ctx.fillText('최고 점수: ' + highScore, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
  // 다시 시작 버튼
  const btnW = 260, btnH = 64;
  const btnX = GAME_WIDTH / 2 - btnW / 2;
  const btnY = GAME_HEIGHT / 2 + 100;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 18);
  ctx.fillStyle = '#222';
  ctx.globalAlpha = 0.92;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff200';
  ctx.stroke();
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#fff200';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('다시 시작', GAME_WIDTH / 2, btnY + btnH / 2);
  ctx.restore();
  restartBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
  showRestartBtn = true;
  ctx.restore();
}

function handleRestartClick(x, y) {
  if (!showRestartBtn || !restartBtnRect) return false;
  if (x >= restartBtnRect.x && x <= restartBtnRect.x + restartBtnRect.w &&
      y >= restartBtnRect.y && y <= restartBtnRect.y + restartBtnRect.h) {
    resetGame();
    showRestartBtn = false;
    return true;
  }
  return false;
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawBackground();
  drawGround();
  drawDots();
  drawStars();
  drawObstacles();
  drawPacman();
  drawScore();
  drawStageInfo();
  if (stageClear) drawStageClear();
  if (showAllClear) drawAllClear();
  if (gameOver) drawGameOver();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  // 바닥, 점, 장애물 초기화
  groundTiles = [];
  dots = [];
  obstacles = [];
  score = 0;
  for (let i = 0; i < Math.ceil(GAME_WIDTH / TILE_WIDTH) + 2; i++) {
    let prevY = i === 0 ? MAX_GROUND_Y : groundTiles[i - 1].y;
    let y = prevY + (Math.random() - 0.5) * 60;
    y = Math.max(MIN_GROUND_Y, Math.min(MAX_GROUND_Y, y));
    addGroundTile(i * TILE_WIDTH, y, i);
  }
  groundOffset = 0;
  pacman.y = GAME_HEIGHT - GROUND_HEIGHT - PACMAN_RADIUS;
  pacman.vy = 0;
  pacman.onGround = true;
  gameOver = false;
  groundSpeed = baseGroundSpeed;
  gameTick = 0;
  stars = [];
  initBackground();
  saveHighScore();
  lastObstacleX = -Infinity;
}

document.addEventListener('keydown', (e) => {
  if (gameOver && showRestartBtn) return; // 키로 재시작 방지
  if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) {
    if (!isGlide) jumpQueued = true;
    isGlide = true;
  }
});
document.addEventListener('keyup', (e) => {
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') isGlide = false;
});
canvas.addEventListener('pointerdown', (e) => {
  if (showAllClear) {
    document.getElementById('stageSelect').style.display = '';
    showAllClear = false;
    return;
  }
  if (gameOver && showRestartBtn) {
    // 좌표 변환 추가
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (handleRestartClick(x, y)) return;
    return;
  }
  if (!isGlide) jumpQueued = true;
  isGlide = true;
});
canvas.addEventListener('pointerup', (e) => {
  isGlide = false;
});
canvas.addEventListener('pointerleave', (e) => {
  isGlide = false;
});

const NORMAL_GRAVITY = 0.78;
const GLIDE_GRAVITY = 0.035;
const JUMP_POWER = 12.5;

gameLoop(); 