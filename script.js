// 게임 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const guideMsg = document.getElementById('guideMsg');

// 캔버스 크기에 맞춰 그리드 설정
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// 게임 상태
let snake = [{x: 7, y: 7}];
let food = {};
let dx = 1; // 오른쪽으로 시작
let dy = 0;
let score = 0;
let gameRunning = false;
let gameLoop;

// 스와이프 제스처 변수
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;
const minSwipeDistance = 30; // 최소 스와이프 거리

// 음식 타입 정의
const FOOD_TYPES = {
    NORMAL: { type: 'normal', color: '#FF5722', points: 10, probability: 0.5, name: '일반 사과' },
    GOLD: { type: 'gold', color: '#FFD700', points: 20, probability: 0.3, name: '골드 사과' },
    POISON: { type: 'poison', color: '#9C27B0', points: 0, probability: 0.2, name: '독사과' }
};

// 초기화
function init() {
    snake = [{x: 7, y: 7}];
    dx = 1; // 오른쪽으로 시작
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    generateFood();
    draw();
    console.log('게임 초기화 완료');
}

// 음식 생성 (특수 음식 포함)
function generateFood() {
    // 음식 타입 결정 (확률 기반)
    const random = Math.random();
    let foodType;
    
    console.log('음식 생성 확률:', random);
    
    if (random < FOOD_TYPES.NORMAL.probability) {
        foodType = FOOD_TYPES.NORMAL;
        console.log('일반 사과 생성');
    } else if (random < FOOD_TYPES.NORMAL.probability + FOOD_TYPES.GOLD.probability) {
        foodType = FOOD_TYPES.GOLD;
        console.log('골드 사과 생성! ⭐');
    } else {
        foodType = FOOD_TYPES.POISON;
        console.log('독사과 생성! ☠️ 조심!');
    }
    
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
        type: foodType.type,
        color: foodType.color,
        points: foodType.points,
        name: foodType.name
    };
    
    // 뱀과 겹치지 않도록
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
    console.log('음식 생성 완료:', food.name, food.points + '점', '위치:', food.x, food.y);
}

// 그리기 함수
function draw() {
    // 캔버스 클리어
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 그리드 그리기 (옵션)
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // 뱀 그리기 (개선된 모양)
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        
        if (i === 0) {
            // 머리 - 원형
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(x + gridSize/2, y + gridSize/2, gridSize/2 - 1, 0, 2 * Math.PI);
            ctx.fill();
            
            // 눈 그리기
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x + gridSize/2 - 3, y + gridSize/2 - 3, 2, 0, 2 * Math.PI);
            ctx.arc(x + gridSize/2 + 3, y + gridSize/2 - 3, 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // 동공
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x + gridSize/2 - 3, y + gridSize/2 - 3, 1, 0, 2 * Math.PI);
            ctx.arc(x + gridSize/2 + 3, y + gridSize/2 - 3, 1, 0, 2 * Math.PI);
            ctx.fill();
            
        } else if (i === snake.length - 1) {
            // 꼬리 - 작은 원형
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(x + gridSize/2, y + gridSize/2, gridSize/3, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // 몸 - 둥근 사각형
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(x + 4, y + 4, 4, 0, 2 * Math.PI);
            ctx.arc(x + gridSize - 4, y + 4, 4, 0, 2 * Math.PI);
            ctx.arc(x + gridSize - 4, y + gridSize - 4, 4, 0, 2 * Math.PI);
            ctx.arc(x + 4, y + gridSize - 4, 4, 0, 2 * Math.PI);
            ctx.fillRect(x + 4, y, gridSize - 8, gridSize);
            ctx.fillRect(x, y + 4, gridSize, gridSize - 8);
            ctx.fill();
        }
    }
    
    // 음식 그리기 (특수 음식 포함)
    const foodX = food.x * gridSize + gridSize/2;
    const foodY = food.y * gridSize + gridSize/2;
    
    // 음식 배경 (광택 효과)
    if (food.type === 'gold') {
        // 골드 사과는 반짝이는 효과
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(foodX, foodY, gridSize/2 + 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // 음식 본체
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(foodX, foodY, gridSize/2 - 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 음식 타입별 특수 효과
    if (food.type === 'gold') {
        // 골드 사과는 별 모양 효과
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', foodX, foodY + 4);
    } else if (food.type === 'poison') {
        // 독사과는 해골 효과
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('☠️', foodX, foodY + 4);
    } else {
        // 일반 사과는 잎
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.ellipse(foodX, foodY - gridSize/4, 3, 2, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// 방향 변경 함수 (진동 피드백 포함)
function changeDirection(newDx, newDy) {
    // 반대 방향으로는 이동 불가
    if (dx !== -newDx && dy !== -newDy) {
        dx = newDx;
        dy = newDy;
        console.log('방향 변경:', dx, dy);
        
        // 진동 피드백 (모바일에서만)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

// 게임 업데이트
function update() {
    if (!gameRunning) return;
    
    // 뱀 이동
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // 벽 충돌 체크
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    // 자기 몸 충돌 체크 (머리 제외)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    // 음식 먹기 체크
    if (head.x === food.x && head.y === food.y) {
        // 음식 타입별 처리
        if (food.type === 'poison') {
            // 독사과 먹으면 게임 오버
            gameOver();
            return;
        } else {
            // 일반 사과나 골드 사과
            score += food.points;
            scoreElement.textContent = score;
            
            // 점수 획득 메시지 표시
            showScoreMessage(food.points, food.name);
            
            generateFood();
            
            // 음식 먹을 때 진동
            if (navigator.vibrate) {
                if (food.type === 'gold') {
                    navigator.vibrate([100, 50, 100, 50, 100]); // 골드 사과는 특별한 진동
                } else {
                    navigator.vibrate([50, 50, 50]);
                }
            }
        }
    } else {
        snake.pop();
    }
    
    draw();
}

// 점수 메시지 표시
function showScoreMessage(points, foodName) {
    const message = `+${points}점 (${foodName})`;
    console.log(message);
    
    // 화면에 임시 메시지 표시 (선택사항)
    // 나중에 더 예쁜 UI로 개선 가능
}

// 게임 오버
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // 게임 오버 진동
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
    
    setTimeout(() => {
        const reason = food.type === 'poison' ? '독사과를 먹었습니다!' : '벽이나 몸에 부딪혔습니다!';
        guideMsg.textContent = `게임 오버! 점수: ${score} (${reason})`;
        restartBtn.style.display = 'inline-block';
        startBtn.style.display = 'none';
    }, 100);
}

// 스와이프 제스처 처리
function handleSwipe() {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance >= minSwipeDistance) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 좌우 스와이프
            if (deltaX > 0) {
                changeDirection(1, 0); // 오른쪽
            } else {
                changeDirection(-1, 0); // 왼쪽
            }
        } else {
            // 상하 스와이프
            if (deltaY > 0) {
                changeDirection(0, 1); // 아래
            } else {
                changeDirection(0, -1); // 위
            }
        }
    }
}

// 터치 이벤트 (스와이프 제스처)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    endX = touch.clientX;
    endY = touch.clientY;
    handleSwipe();
});

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
            changeDirection(0, -1);
            break;
        case 'ArrowDown':
            changeDirection(0, 1);
            break;
        case 'ArrowLeft':
            changeDirection(-1, 0);
            break;
        case 'ArrowRight':
            changeDirection(1, 0);
            break;
    }
});

// 작은 방향 버튼 이벤트
document.getElementById('miniUpBtn').addEventListener('click', () => changeDirection(0, -1));
document.getElementById('miniDownBtn').addEventListener('click', () => changeDirection(0, 1));
document.getElementById('miniLeftBtn').addEventListener('click', () => changeDirection(-1, 0));
document.getElementById('miniRightBtn').addEventListener('click', () => changeDirection(1, 0));

// 게임 시작/재시작 버튼
startBtn.addEventListener('click', () => {
    console.log('게임 시작!');
    init();
    gameRunning = true;
    gameLoop = setInterval(update, 300); // 속도를 300ms로 늦춤
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    guideMsg.textContent = '방향키, 스와이프, 또는 우측 하단 버튼으로 조작하세요!';
});

restartBtn.addEventListener('click', () => {
    console.log('게임 재시작!');
    init();
    gameRunning = true;
    gameLoop = setInterval(update, 300); // 속도를 300ms로 늦춤
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    guideMsg.textContent = '방향키, 스와이프, 또는 우측 하단 버튼으로 조작하세요!';
});

// 초기 화면 안내 메시지
window.onload = () => {
    guideMsg.textContent = '게임을 시작하려면 아래 버튼을 누르세요!';
    startBtn.style.display = 'inline-block';
    restartBtn.style.display = 'none';
};

// 초기 화면 그리기
init(); 