// 카드 색상과 숫자
const COLORS = ['빨강', '파랑', '초록', '노랑'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// 카드 덱 만들기
function createDeck() {
    const deck = [];
    for (let color of COLORS) {
        for (let num of NUMBERS) {
            deck.push({ color, num });
        }
    }
    // 섞기
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

let deck, playerHand, computerHand, topCard, playerTurn, gameOver, round = 1;

function startGame() {
    deck = createDeck();
    playerHand = deck.splice(0, 7);
    computerHand = deck.splice(0, 7);
    topCard = deck.pop();
    playerTurn = true;
    gameOver = false;
    showMessage(`게임을 시작합니다! (라운드: ${round}) 먼저 내세요.`);
    render();
}

function render() {
    // 내 카드
    let playerHtml = '<h3>내 카드</h3>';
    playerHand.forEach((card, idx) => {
        playerHtml += `<button class="card" onclick="playCard(${idx})" style="background:${getColor(card.color)}">${card.color} ${card.num}</button> `;
    });
    document.getElementById('gameArea').innerHTML =
        `<div>
            <div style="margin-bottom:10px;">
                <b>상대(컴퓨터) 카드 개수:</b> ${computerHand.length}
            </div>
            <div style="margin-bottom:10px;">
                <b>중앙 카드:</b> <span class="card" style="background:${getColor(topCard.color)}">${topCard.color} ${topCard.num}</span>
            </div>
            <div>${playerHtml}</div>
            <div style="margin-top:10px;">
                <button onclick="drawCard()" ${!playerTurn || gameOver ? 'disabled' : ''}>카드 뽑기</button>
            </div>
        </div>`;
}

function getColor(color) {
    switch (color) {
        case '빨강': return '#ffb3b3';
        case '파랑': return '#b3d1ff';
        case '초록': return '#b3ffb3';
        case '노랑': return '#ffffb3';
        default: return '#fff';
    }
}

function playCard(idx) {
    if (!playerTurn || gameOver) return;
    const card = playerHand[idx];
    if (card.color === topCard.color || card.num === topCard.num) {
        topCard = card;
        playerHand.splice(idx, 1);
        playerTurn = false;
        render();
        checkWin();
        if (!gameOver) setTimeout(computerPlay, 1000);
    } else {
        showMessage("색깔이나 숫자가 같아야 내놓을 수 있어요!");
    }
}

function drawCard() {
    if (!playerTurn || gameOver) return;
    if (deck.length === 0) {
        showMessage("덱에 카드가 없어요!");
        return;
    }
    playerHand.push(deck.pop());
    playerTurn = false;
    render();
    setTimeout(computerPlay, 1000);
}

function computerPlay() {
    if (gameOver) return;
    let idx;
    if (round === 1) {
        // 1라운드: 랜덤
        let candidates = computerHand
            .map((card, i) => (card.color === topCard.color || card.num === topCard.num ? i : -1))
            .filter(i => i !== -1);
        idx = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : -1;
    } else {
        // 2라운드 이상: 플레이어가 다음에 낼 수 있는 카드를 막는 전략
        // 플레이어가 가진 카드의 색/숫자 빈도 계산
        let colorCount = {};
        let numCount = {};
        playerHand.forEach(card => {
            colorCount[card.color] = (colorCount[card.color] || 0) + 1;
            numCount[card.num] = (numCount[card.num] || 0) + 1;
        });
        // 컴퓨터가 낼 수 있는 카드 중에서 플레이어가 많이 가진 색/숫자를 우선 냄
        let candidates = computerHand
            .map((card, i) => (card.color === topCard.color || card.num === topCard.num ? {card, i} : null))
            .filter(x => x);
        if (candidates.length) {
            // 우선순위: 플레이어가 많이 가진 색/숫자 → 랜덤
            candidates.sort((a, b) => {
                let aScore = (colorCount[a.card.color] || 0) + (numCount[a.card.num] || 0);
                let bScore = (colorCount[b.card.color] || 0) + (numCount[b.card.num] || 0);
                return bScore - aScore;
            });
            idx = candidates[0].i;
        } else {
            idx = -1;
        }
    }
    if (idx !== -1) {
        topCard = computerHand[idx];
        computerHand.splice(idx, 1);
        showMessage("컴퓨터가 카드를 냈어요!");
    } else if (deck.length > 0) {
        computerHand.push(deck.pop());
        showMessage("컴퓨터가 카드를 뽑았어요!");
    } else {
        showMessage("컴퓨터가 낼 카드가 없어요!");
    }
    playerTurn = true;
    render();
    checkWin();
}

function checkWin() {
    if (playerHand.length === 0) {
        showMessage("축하합니다! 당신이 이겼어요! 🎉");
        gameOver = true;
        showNextRoundButton();
    } else if (computerHand.length === 0) {
        showMessage("아쉽지만 컴퓨터가 이겼어요!");
        gameOver = true;
        showNextRoundButton();
    }
}

function showNextRoundButton() {
    document.getElementById('gameArea').insertAdjacentHTML('beforeend',
        `<button onclick="nextRound()" style="margin-top:10px;">다음 라운드 시작</button>`);
}

function nextRound() {
    round++;
    startGame();
}

function showMessage(msg) {
    document.getElementById('gameArea').insertAdjacentHTML('afterbegin', `<div style="margin-bottom:8px;color:#333;">${msg}</div>`);
}

document.getElementById('startBtn').addEventListener('click', startGame);
