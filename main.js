// --- GAME ---
let canvas = document.getElementById("main-canvas");
let ctx = canvas.getContext("2d");

let prevTime = performance.now();
let deltaTime = 0;
let fps = 60;

// let mouseX = 0;
// let mouseY = 0;
// let prevMouseDown = false;
// let mouseDown = false;

let gameSeed;

const suits = ["♠", "♥", "♣", "♦"];
const values = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

let myRank;
let hands = [];
let myHand;
let tableHand;

let currentTurn;
let newRound = true;
let firstRound = true;
let roundEnd = false;
let currentRoundSuit = "♠";

let CARD_WIDTH = 90;
let CARD_HEIGHT = 126;

let frameNumber = 0;




let mouseX = 0;
let mouseY = 0;

let mouseDown = false;
let prevMouseDown = false;

let isClicked = false;
let isPressed = false;
let isReleased = false;

let isDragging = false;
let isScrolling = false;

let lastTouchX = 0;
let lastTouchY = 0;
let touchStartX = 0;
let touchStartY = 0;
const DRAG_THRESHOLD = 8;
let scrollTimeout = null;

let distScrolled = 0;



function goFullscreen() {
    document.body.requestFullscreen();
}

function updateMousePosition(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (((clientX - rect.left) / rect.width) * canvas.width) - (canvas.width / 2);
    mouseY = (canvas.height / 2) - (((clientY - rect.top) / rect.height) * canvas.height);
}

canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    canvas.setPointerCapture(e.pointerId);

    updateMousePosition(e.clientX, e.clientY);

    mouseDown = true;
    isPressed = true;
    isDragging = false;

    touchStartX = e.clientX;
    touchStartY = e.clientY;
    lastTouchX = e.clientX;
    lastTouchY = e.clientY;
});

window.addEventListener("pointermove", (e) => {
    updateMousePosition(e.clientX, e.clientY);

    if (!mouseDown) return;

    const totalDx = e.clientX - touchStartX;
    const totalDy = e.clientY - touchStartY;
    const distSq = totalDx * totalDx + totalDy * totalDy;

    if (!isDragging && distSq > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        isDragging = true;
    }

    if (isDragging) {
        const dx = (e.clientX - lastTouchX) * window.devicePixelRatio;
        if (myHand) {
            distScrolled += dx;
        }
    }

    lastTouchX = e.clientX;
    lastTouchY = e.clientY;
});

function handlePointerUp(e) {
    if (!mouseDown) return;

    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }

    if (!isDragging) {
        isClicked = true;
    }

    mouseDown = false;
    isDragging = false;
    isReleased = true;
}

window.addEventListener("pointerup", handlePointerUp);
window.addEventListener("pointercancel", handlePointerUp);

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    distScrolled -= delta;

    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 150);
}, { passive: false });


window.addEventListener("resize", (event) => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = (window.innerHeight * 0.9) * window.devicePixelRatio;
});

function initialize(seed) {
    document.getElementById("game-area").style.display = "flex";
    let playerRank = 0;
    Object.keys(channels.timestamps).forEach((item) => {
        let playerName = document.createElement("div");
        playerName.id = "player" + playerRank;
        playerName.className = "player-name";
        playerName.innerHTML = item + (item === channels.id ? " (You)" : "");
        document.getElementById("player-bar").appendChild(playerName);

        playerRank++;
    });
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = (window.innerHeight * 0.9) * window.devicePixelRatio;




    gameSeed = seed;
    myRank = channels.getJoinRank(channels.id);

    tableHand = new TableHand();
    tableHand.createAndShuffleDeck(gameSeed);

    for (let i = 0; i < channels.numPeers; i++) {
        if (myRank === i) {
            myHand = new Hand(true, myRank);
            hands[i] = myHand;

            myHand.onCardPlayed = (card, cardIndex) => {
                myHand.removeCard(cardIndex);
                card.animationSpeed = 0.005;
                tableHand.addCard(card);

                channels.broadcastData(JSON.stringify({
                    type: "playCard",
                    value: card.value,
                    suit: card.suit
                }));
            }
        } else {
            hands[i] = new Hand(myRank === i, i);
        }
    }

    tableHand.dealCards(hands);

    tableHand.onDealingFinish = () => {
        hands.forEach(hand => {
            if (hand.containsCard("A", "♠")) {
                currentTurn = hand.rank;
            }
            hand.hide();
        });

        myHand.show();
        myHand.spread();
    };

    if (channels.isHost()) {
        channels.broadcastData(JSON.stringify({
            type: "seed",
            seed: seed
        }));
    }

    requestAnimationFrame(loop);
}


function loop(timestamp) {
    deltaTime = timestamp - prevTime;
    prevTime = timestamp;
    fps = Math.round(1000 / deltaTime);

    if (frameNumber === 0) {
        prevMouseDown = mouseDown;
        isClicked = false;
        isPressed = false;
        isReleased = false;

        frameNumber++;
        requestAnimationFrame(loop);
    }

    for (let i = 0; i < channels.numPeers; i++) {
        if (i == currentTurn) {
            document.getElementById("player" + i).style.border = "10px solid red";
        } else {
            document.getElementById("player" + i).style.border = "none";
        }
    }

    if (isScrolling || isDragging) {
        if (mouseY < 0) {
            myHand.baseX += distScrolled;
        } else {
            tableHand.baseX += distScrolled;
        }
        distScrolled = 0;
    }

    ctx.fillStyle = "#00512d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    CARD_WIDTH = (canvas.height * 0.27777777777) * (90 / 126);
    CARD_HEIGHT = canvas.height * 0.27777777777;

    hands.forEach(hand => {
        hand.update(deltaTime);
        hand.render();
    });

    tableHand.update(deltaTime);
    tableHand.render();

    prevMouseDown = mouseDown;
    isClicked = false;
    isPressed = false;
    isReleased = false;

    frameNumber++;
    requestAnimationFrame(loop);
}

channels.onDataReceived = (data, remoteId) => {
    try {
        let received = JSON.parse(data);

        if (received.type === "seed") {
            if (remoteId === channels.hostId) {
                initialize(received.seed);
            }
        } else if (received.type === "playCard") {
            let remoteRank = channels.getJoinRank(remoteId);
            if (remoteRank == currentTurn && (
                (firstRound && received.value == "A" && received.suit == "♠") ||
                (newRound && !firstRound) ||
                (!newRound && received.suit == currentRoundSuit) ||
                (!newRound && !hands[remoteRank].containsCard("any", currentRoundSuit))
            )) {
                let cardIndex = hands[remoteRank].getCardIndex(received.value, received.suit);
                let card = hands[remoteRank].cards[cardIndex];
                hands[remoteRank].removeCard(cardIndex);
                card.animationSpeed = 0.005;
                tableHand.addCard(card);
            }
        }
    } catch (e) { }
};