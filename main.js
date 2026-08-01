let connector = new Connector();

function createRoom() {
    connector.createRoom();
}

function leaveRoom() {
    connector.leaveRoom();
}


let channels = new P2PDataChannels(connector);


connector.onRoomsListChange = () => {
    updateView();
}

connector.onRoomJoinStatusChange = () => {
    updateView();
}

channels.idCreated = (localId) => {
    updateView();
}

channels.onPeerConnected = (remoteId) => {
    updateView();
};

channels.onPeerDisconnected = (remoteId) => {
    updateView();
};

updateView();


function updateView() {
    const hasJoinedRoom = connector.connectedRoom && connector.connectedRoom !== "null";

    if (hasJoinedRoom) {
        document.getElementById("first-lobby").style.display = "none";
        document.getElementById("second-lobby").style.display = "flex";

        document.getElementById("my-id-second").textContent = channels.id;
        document.getElementById("room-id").textContent = connector.connectedRoom;

        if (hasJoinedRoom) {
            const host = channels.hostId || "loading...";
            const hostBadge = document.getElementById("host-id");

            if (channels.isHost()) {
                hostBadge.textContent = `${host} (You)`;
                hostBadge.style.border = "3px solid green";
            } else {
                hostBadge.textContent = host;
                hostBadge.style.border = "none";
            }
        }

        if (channels.isHost()) {
            document.getElementById("start-room").style.display = "inline";
        } else {
            document.getElementById("start-room").style.display = "none";
        }

        document.getElementById("players-joined").textContent = "Players Joined (" + channels.numPeers + ")";

        const listContainer = document.getElementById("players-list");
        listContainer.innerHTML = "";
        Object.keys(channels.timestamps).forEach(item => {
            const li = document.createElement("li");

            const textSpan = document.createElement("span");
            if (item === channels.id) {
                textSpan.textContent = "Player ID: " + item + " (You)";
                textSpan.style.border = "3px solid green";
            } else {
                textSpan.textContent = "Player ID: " + item;
            }

            textSpan.className = "id";
            li.appendChild(textSpan);

            if (channels.isHost() && item !== channels.id) {
                const removeButton = document.createElement("button");
                removeButton.textContent = "remove";

                removeButton.className = "btn remove";

                removeButton.onclick = () => {
                    channels.removeFromRoom(item);
                };

                li.appendChild(removeButton);
            }
            listContainer.appendChild(li);
        });
    } else {
        document.getElementById("first-lobby").style.display = "flex";
        document.getElementById("second-lobby").style.display = "none";

        document.getElementById("my-id").textContent = channels.id || "loading...";

        document.getElementById("available-rooms").textContent = "Available Rooms (" + connector.roomIds.length + ")";

        const listContainer = document.getElementById("rooms-list");
        listContainer.innerHTML = "";
        connector.roomIds.forEach(item => {
            const li = document.createElement("li");

            const textSpan = document.createElement("span");
            textSpan.textContent = "Room ID: " + item;
            textSpan.className = "id";
            li.appendChild(textSpan);

            const joinButton = document.createElement("button");
            joinButton.textContent = "Join";

            joinButton.className = "btn join";

            joinButton.onclick = () => {
                connector.joinRoom(item);
            };

            li.appendChild(joinButton);
            listContainer.appendChild(li);
        });
    }
}

function start() {
    //if (channels.numPeers >= 2) {
    channels.start();
    //}
}

connector.onRoomStart = () => {
    document.getElementById("lobby-container").style.display = "none";
    if (channels.isHost()) {
        initialize(Date.now());
    }
};


// function goFullscreen() {
//     document.body.requestFullscreen();
// }


















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

let deck;
let myRank;
let hands = [];
let myHand;
let tableHand;

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
            distScrolled = dx;
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

    distScrolled = -delta;

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

function createAndShuffleDeck(seed) {
    let deck = [];
    values.forEach(value => {
        suits.forEach(suit => {
            deck.push(new Card(value, suit, 0, 0, true));
        });
    });

    let randomState = seed;
    for (let i = deck.length - 1; i > 0; i--) {
        randomState = (randomState * 1664525 + 1013904223) % 4294967296;
        let swapIndex = Math.floor((randomState / 4294967296) * (i + 1));

        [deck[i], deck[swapIndex]] = [deck[swapIndex], deck[i]];
    }

    return deck;
}


function initialize(seed) {
    document.getElementById("game-area").style.display = "flex";
    Object.keys(channels.timestamps).forEach((item) => {
        let playerName = document.createElement("div");
        playerName.className = "player-name";
        playerName.innerHTML = item + (item === channels.id ? " (You)" : "");
        document.getElementById("player-bar").appendChild(playerName);
    });
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = (window.innerHeight * 0.9) * window.devicePixelRatio;

    gameSeed = seed;
    deck = createAndShuffleDeck(gameSeed);
    myRank = channels.getJoinRank(channels.id);

    tableHand = new TableHand();
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
    for (let i = 0; i < deck.length + 1; i++) {
        if (i == deck.length) {
            setTimeout(() => {
                hands.forEach(hand => {
                    hand.hide();
                });

                myHand.show();
                myHand.spread();
            }, i * 50 + 600);
        } else {
            setTimeout(() => {
                hands[i % channels.numPeers].addCard(deck[i]);
            }, i * 50);
        }
    }

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
        frameNumber++;
        prevMouseDown = mouseDown;
        requestAnimationFrame(loop);
    }

    if ((isScrolling || isDragging) && mouseY < 0) {
        myHand.baseX += distScrolled;
    }

    ctx.fillStyle = "#00512d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // console.log(canvas.width, canvas.height, mouseX, mouseY, mouseDown);

    CARD_WIDTH = (canvas.height * 0.27777777777) * (90 / 126);
    CARD_HEIGHT = canvas.height * 0.27777777777;

    if (myHand.isSpread) {
        hands.forEach(hand => {
            hand.update(deltaTime);
            hand.render();
        });
    } else {
        hands.forEach(hand => {
            hand.update(deltaTime);
        });
        deck.forEach(card => {
            card.render();
        });
    }

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
            let cardIndex = hands[remoteRank].getCardIndex(received.value, received.suit);
            let card = hands[remoteRank].cards[cardIndex];
            card.show();
            card.animateFlip();
            hands[remoteRank].removeCard(cardIndex);
            card.animationSpeed = 0.005;
            tableHand.addCard(card);
        }
    } catch (e) { }
};