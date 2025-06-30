// 게임 상태 변수들
let currentBoard = [];
let solutionBoard = [];
let currentDifficulty = '';
let selectedCell = null;
let gameStartTime = null;
let timerInterval = null;
let isGameComplete = false;

// 난이도별 설정
const difficultySettings = {
    easy: { name: '초급', filledCells: 45 },    // 36개 빈칸
    medium: { name: '중급', filledCells: 35 },  // 46개 빈칸
    hard: { name: '고급', filledCells: 25 }     // 56개 빈칸
};

// 화면 전환 함수들
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showStartScreen() {
    showScreen('start-screen');
    stopTimer();
    resetGame();
}

function showGameScreen() {
    showScreen('game-screen');
    startTimer();
}

function showResultScreen() {
    showScreen('result-screen');
    stopTimer();
    updateResultInfo();
}

// 게임 시작
function startGame(difficulty) {
    currentDifficulty = difficulty;
    document.getElementById('difficulty-display').textContent = difficultySettings[difficulty].name;
    
    generateSudoku(difficulty);
    renderBoard();
    showGameScreen();
}

// 스도쿠 보드 생성
function generateSudoku(difficulty) {
    // 완전한 스도쿠 솔루션 생성
    solutionBoard = generateCompleteSolution();
    
    // 난이도에 따라 일부 숫자 제거
    currentBoard = removeNumbers(solutionBoard, difficultySettings[difficulty].filledCells);
}

// 완전한 스도쿠 솔루션 생성
function generateCompleteSolution() {
    const board = Array(9).fill().map(() => Array(9).fill(0));
    
    // 첫 번째 행을 랜덤하게 채움
    const firstRow = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(firstRow);
    board[0] = [...firstRow];
    
    // 나머지 행들을 채움
    solveSudoku(board);
    
    return board;
}

// 스도쿠 풀이 알고리즘 (백트래킹)
function solveSudoku(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                shuffleArray(numbers);
                
                for (let num of numbers) {
                    if (isValidMove(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) {
                            return true;
                        }
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// 유효한 이동인지 확인
function isValidMove(board, row, col, num) {
    // 행 확인
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }
    
    // 열 확인
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }
    
    // 3x3 박스 확인
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[startRow + i][startCol + j] === num) return false;
        }
    }
    
    return true;
}

// 배열 섞기
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 숫자 제거 (퍼즐 생성)
function removeNumbers(solution, filledCells) {
    const puzzle = solution.map(row => [...row]);
    const totalCells = 81;
    const cellsToRemove = totalCells - filledCells;
    
    const positions = [];
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            positions.push([i, j]);
        }
    }
    
    shuffleArray(positions);
    
    for (let i = 0; i < cellsToRemove; i++) {
        const [row, col] = positions[i];
        puzzle[row][col] = 0;
    }
    
    return puzzle;
}

// 보드 렌더링
function renderBoard() {
    const boardElement = document.getElementById('sudoku-board');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('button');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const value = currentBoard[row][col];
            if (value !== 0) {
                cell.textContent = value;
                cell.classList.add('fixed');
            }
            
            cell.addEventListener('click', () => selectCell(row, col));
            boardElement.appendChild(cell);
        }
    }
}

// 셀 선택
function selectCell(row, col) {
    // 고정된 셀은 선택 불가
    if (currentBoard[row][col] !== 0 && isOriginalCell(row, col)) {
        return;
    }
    
    // 이전 선택 해제
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    
    // 새 셀 선택
    selectedCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    selectedCell.classList.add('selected');
}

// 원본 셀인지 확인 (고정된 숫자)
function isOriginalCell(row, col) {
    return currentBoard[row][col] !== 0 && !isUserInput(row, col);
}

// 사용자 입력인지 확인
function isUserInput(row, col) {
    // 간단한 방법: 현재 값이 솔루션과 다르면 사용자 입력
    return currentBoard[row][col] !== 0 && currentBoard[row][col] !== solutionBoard[row][col];
}

// 숫자 선택
function selectNumber(num) {
    if (!selectedCell) return;
    
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    
    // 고정된 셀은 수정 불가
    if (isOriginalCell(row, col)) return;
    
    // 숫자 입력
    currentBoard[row][col] = num;
    selectedCell.textContent = num;
    selectedCell.classList.remove('error', 'completed');
    
    // 게임 완료 확인 (즉시 오답 표시하지 않음)
    checkGameCompletion();
}

// 셀 지우기
function clearCell() {
    if (!selectedCell) return;
    
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    
    // 고정된 셀은 지울 수 없음
    if (isOriginalCell(row, col)) return;
    
    currentBoard[row][col] = 0;
    selectedCell.textContent = '';
    selectedCell.classList.remove('error', 'completed');
}

// 정답 확인
function checkSolution() {
    let isCorrect = true;
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (currentBoard[row][col] !== solutionBoard[row][col]) {
            isCorrect = false;
            cell.classList.add('error');
        } else {
            cell.classList.remove('error');
            if (currentBoard[row][col] !== 0) {
                cell.classList.add('completed');
            }
        }
    });
    
    if (isCorrect) {
        setTimeout(() => {
            alert('🎉 정답입니다! 축하합니다!');
            showResultScreen();
        }, 500);
    } else {
        alert('❌ 아직 완성되지 않았습니다. 다시 확인해보세요!');
    }
}

// 게임 완료 확인
function checkGameCompletion() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (currentBoard[row][col] !== solutionBoard[row][col]) {
                return;
            }
        }
    }
    
    // 모든 셀이 정답과 일치
    isGameComplete = true;
    setTimeout(() => {
        alert('🎉 축하합니다! 스도쿠를 완성했습니다!');
        showResultScreen();
    }, 500);
}

// 힌트 보여주기
function showHint() {
    if (!selectedCell) {
        alert('힌트를 원하는 셀을 먼저 선택해주세요!');
        return;
    }
    
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    
    if (currentBoard[row][col] === solutionBoard[row][col]) {
        alert('이 셀은 이미 정답입니다!');
        return;
    }
    
    const correctNumber = solutionBoard[row][col];
    alert(`힌트: 이 셀의 정답은 ${correctNumber}입니다!`);
    
    // 힌트 효과
    selectedCell.classList.add('hint');
    setTimeout(() => {
        selectedCell.classList.remove('hint');
    }, 1000);
}

// 새 게임
function newGame() {
    if (currentDifficulty) {
        startGame(currentDifficulty);
    } else {
        showStartScreen();
    }
}

// 게임 리셋
function resetGame() {
    currentBoard = [];
    solutionBoard = [];
    selectedCell = null;
    isGameComplete = false;
    currentDifficulty = '';
}

// 타이머 관련 함수들
function startTimer() {
    gameStartTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    if (!gameStartTime) return;
    
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateResultInfo() {
    if (!gameStartTime) return;
    
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('final-time').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('final-difficulty').textContent = 
        difficultySettings[currentDifficulty]?.name || '알 수 없음';
}

// 키보드 이벤트 처리
document.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '9') {
        selectNumber(parseInt(event.key));
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
        clearCell();
    }
});

// 터치 이벤트 처리 (모바일)
document.addEventListener('touchstart', (event) => {
    // 터치 이벤트 처리
}, { passive: true });

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    showStartScreen();
}); 