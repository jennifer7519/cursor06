// 게임 설정
const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 360;
const BLOCK_SIZE = 20;
const COLS = CANVAS_WIDTH / BLOCK_SIZE;
const ROWS = CANVAS_HEIGHT / BLOCK_SIZE;

// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 상태
let gameBoard = [];
let currentPiece = null;
let gameRunning = false;
let score = 0;
let level = 1;
let dropTime = 0;
let lastTime = 0;

// 테트리스 블록 모양 (7가지)
const PIECES = [
    // I
    [
        [1, 1, 1, 1]
    ],
    // O
    [
        [1, 1],
        [1, 1]
    ],
    // T
    [
        [0, 1, 0],
        [1, 1, 1]
    ],
    // S
    [
        [0, 1, 1],
        [1, 1, 0]
    ],
    // Z
    [
        [1, 1, 0],
        [0, 1, 1]
    ],
    // J
    [
        [1, 0, 0],
        [1, 1, 1]
    ],
    // L
    [
        [0, 0, 1],
        [1, 1, 1]
    ]
];

// 기존 COLORS 배열을 아래로 교체
const COLORS = [
    '#AEEEEE', // 파스텔 하늘색
    '#FFFACD', // 파스텔 노랑
    '#E6E6FA', // 라벤더
    '#B0E57C', // 연두
    '#FFB6C1', // 연핑크
    '#B0C4DE', // 연보라
    '#FFDAB9'  // 살구색
];
// 게임 보드 초기화
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
    // 보드 그리기
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (gameBoard[row][col]) {
                drawBlock(col, row, gameBoard[row][col] - 1);
            }
        }
    }
    // 현재 조각 그리기
    if (currentPiece) {
        drawPiece();
    }
}

function drawBlock(x, y, colorIndex) {
    ctx.fillStyle = COLORS[colorIndex];
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    // 귀여운 흰색 테두리
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    // 살짝 그림자 효과
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
    // 게임 오버 체크
    if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver();
    }
}

function isValidMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                if (newY >= 0 && gameBoard[newY][newX]) {
                    return false;
                }
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
        level = Math.floor(score / 1000) + 1;
        updateDisplay();
    }
}

function gameLoop(currentTime) {
    if (!gameRunning) return;
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    dropTime += deltaTime;
    if (dropTime > 1000 - (level * 50)) {
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

function gameOver() {
    gameRunning = false;
    alert(`게임 오버! 최종 점수: ${score}`);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', pauseGame);

// 모바일 터치 조작 추가 (옵션)
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