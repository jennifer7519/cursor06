// 설정
const BLOCK_SIZE = 24;
const COLS = 8;
const ROWS = 15;
const CANVAS_WIDTH = BLOCK_SIZE * COLS;
const CANVAS_HEIGHT = BLOCK_SIZE * ROWS;
const MAX_LIVES = 3;

// 캔버스
const canvas = document.getElementById('gameCanvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// 상태
let gameBoard = [];
let currentPiece = null;
let gameRunning = false;
let score = 0;
let level = 1;
let dropTime = 0;
let lastTime = 0;
let linesClearedTotal = 0;
let lives = MAX_LIVES;

// 파스텔톤 귀여운 색상
const COLORS = [
    '#AEEEEE', // 하늘
    '#FFFACD', // 노랑
    '#E6E6FA', // 라벤더
    '#B0E57C', // 연두
    '#FFB6C1', // 연핑크
    '#B0C4DE', // 연보라
    '#FFDAB9'  // 살구
];

// 블록 모양
const PIECES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]]
];

// 보드 초기화
function initBoard() {
    gameBoard = [];
    for (let row = 0; row < ROWS; row++) {
        gameBoard[row] = [];
        for (let col = 0; col < COLS; col++) {
            gameBoard[row][col] = 0;
        }
    }
}

function drawBoard() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (gameBoard[row][col]) {
                drawBlock(col, row, gameBoard[row][col] - 1);
            }
        }
    }
    if (currentPiece) drawPiece();
}

function drawBlock(x, y, colorIndex) {
    ctx.fillStyle = COLORS[colorIndex];
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    // 귀여운 흰색 테두리
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    // 그림자 효과
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawPiece() {
    if (!currentPiece) return;
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                drawBlock(currentPiece.x + col, currentPiece.y + row, currentPiece.colorIndex);
            }
        }
    }
}

function createNewPiece() {
    const pieceIndex = Math.floor(Math.random() * PIECES.length);
    const shape = PIECES[pieceIndex];
    currentPiece = {
        shape: shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
        colorIndex: pieceIndex
    };
    if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        loseLife();
    }
}

function isValidMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
                if (newY >= 0 && gameBoard[newY][newX]) return false;
            }
        }
    }
    return true;
}

function movePiece(dx, dy) {
    if (!currentPiece) return;
    if (isValidMove(currentPiece.x + dx, currentPiece.y + dy, currentPiece.shape)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        drawBoard();
        return true;
    }
    return false;
}

function rotatePiece() {
    if (!currentPiece) return;
    const rotated = [];
    const shape = currentPiece.shape;
    for (let col = 0; col < shape[0].length; col++) {
        rotated[col] = [];
        for (let row = shape.length - 1; row >= 0; row--) {
            rotated[col][shape.length - 1 - row] = shape[row][col];
        }
    }
    if (isValidMove(currentPiece.x, currentPiece.y, rotated)) {
        currentPiece.shape = rotated;
        drawBoard();
    }
}

function placePiece() {
    if (!currentPiece) return;
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;
                if (boardY >= 0) {
                    gameBoard[boardY][boardX] = currentPiece.colorIndex + 1;
                }
            }
        }
    }
    clearLines();
    createNewPiece();
}

function clearLines() {
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (gameBoard[row].every(cell => cell !== 0)) {
            gameBoard.splice(row, 1);
            gameBoard.unshift(new Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        linesClearedTotal += linesCleared;
        level = Math.floor(linesClearedTotal / 10) + 1;
        updateDisplay();
    }
}

function gameLoop(currentTime) {
    if (!gameRunning) return;
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    dropTime += deltaTime;
    // 속도: 레벨이 올라갈수록 빨라짐 (최소 100ms)
    let speed = Math.max(100, 700 - (level - 1) * 70);
    if (dropTime > speed) {
        if (!movePiece(0, 1)) {
            placePiece();
        }
        dropTime = 0;
    }
    drawBoard();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    switch(e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
    }
});

function startGame() {
    if (gameRunning) return;
    initBoard();
    score = 0;
    level = 1;
    linesClearedTotal = 0;
    lives = MAX_LIVES;
    gameRunning = true;
    lastTime = 0;
    dropTime = 0;
    createNewPiece();
    updateDisplay();
    requestAnimationFrame(gameLoop);
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
}

function pauseGame() {
    gameRunning = !gameRunning;
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
        document.getElementById('pauseBtn').textContent = '일시정지';
    } else {
        document.getElementById('pauseBtn').textContent = '계속하기';
    }
}

function loseLife() {
    lives--;
    updateDisplay();
    if (lives > 0) {
        alert(`블록이 쌓여서 한 번 실패! 남은 기회: ${lives}번`);
        initBoard();
        createNewPiece();
    } else {
        gameOver();
    }
}

function gameOver() {
    gameRunning = false;
    alert(`최종 게임 오버! 점수: ${score}`);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    // 남은 기회 표시
    let livesElem = document.getElementById('lives');
    if (!livesElem) {
        livesElem = document.createElement('div');
        livesElem.id = 'lives';
        livesElem.style.marginTop = '8px';
        document.querySelector('.game-info').appendChild(livesElem);
    }
    livesElem.textContent = `남은 기회: ${lives}`;
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', pauseGame);

// 모바일 터치 조작
let touchStartX = null;
let touchStartY = null;
canvas.addEventListener('touchstart', function(e) {
    if (!gameRunning) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});
canvas.addEventListener('touchend', function(e) {
    if (!gameRunning || touchStartX === null || touchStartY === null) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) movePiece(1, 0);      // 오른쪽
        else if (dx < -30) movePiece(-1, 0); // 왼쪽
    } else {
        if (dy > 30) movePiece(0, 1);      // 아래
        else if (dy < -30) rotatePiece();  // 위로 스와이프: 회전
    }
    touchStartX = null;
    touchStartY = null;
});