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
                textSpan.textContent = "Player ID: " + item + " (You)" + " " + channels.getJoinRank(item);
                textSpan.style.border = "3px solid green";
            } else {
                textSpan.textContent = "Player ID: " + item + " " + channels.getJoinRank(item);
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
    if (channels.numPeers >= 2) {
        channels.start();
    }
}

connector.onRoomStart = () => {
    document.getElementById("lobby-container").style.display = "none";
    initialize();
};


// function goFullscreen() {
//     document.body.requestFullscreen();
// }


















// --- GAME ---
let canvas = document.getElementById("main-canvas");
let ctx = canvas.getContext("2d");

let prevTime = 0;
let deltaTime = 0;
let fps = 60;

let mouseX = 0;
let mouseY = 0;

let seed;



function updateMousePosition(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((clientX - rect.left) / rect.width) * canvas.width;
    mouseY = ((clientY - rect.top) / rect.height) * canvas.height;
}

window.addEventListener("mousemove", (e) => {
    updateMousePosition(e.clientX, e.clientY);
});

function handleTouch(e) {
    if (e.touches.length > 0) {
        updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
    }
}

window.addEventListener("touchstart", (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
    handleTouch(e);
}, { passive: false });

window.addEventListener("touchmove", (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
    handleTouch(e);
}, { passive: false });

window.addEventListener('resize', (event) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});



function initialize() {
    document.getElementById("game-area").style.display = "flex";
    Object.keys(channels.timestamps).forEach((item) => {
        let playerName = document.createElement("div");
        playerName.className = "player-name";
        playerName.innerHTML = item + (item === channels.id ? " (You)" : "");
        document.getElementById("player-bar").appendChild(playerName);
    });

    if (channels.isHost()) {
        seed = Date.now();
        deck = createAndShuffleDeck(seed);
        hand = getHand(deck, channels.getJoinRank(channels.id), channels.numPeers);
        console.log(hand);
        channels.broadcastData(JSON.stringify({
            type: "seed",
            seed: seed
        }));
    }

    requestAnimationFrame(loop);
}


const suits = ["♠", "♥", "♣", "♦"];
const values = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
let deck;
let hand;

let CARD_WIDTH = 90;
let CARD_HEIGHT = 126;

function drawCard(x, y, isFaceDown = false, value = "A", suit = "♠", heightOffset = 0, scaleX = 1.0, angle = 0) {
    ctx.save();

    ctx.translate(x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
    if (angle !== 0) ctx.rotate(angle);
    if (scaleX !== 1.0) ctx.scale(scaleX, 1.0);
    ctx.translate(-(x + CARD_WIDTH / 2), -(y + CARD_HEIGHT / 2));

    const radius = Math.max(4, Math.floor(CARD_WIDTH * 0.09));

    if (isFaceDown) {
        ctx.fillStyle = "#201b5a";
        ctx.beginPath();
        ctx.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, radius);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 8;
        ctx.strokeRect(x + 10, y + 10, CARD_WIDTH - 20, CARD_HEIGHT - 20);
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, radius);
        ctx.fill();

        ctx.fillStyle = (suit === "♥" || suit === "♦") ? "#ff0000" : "#000000";
        const fontSize = Math.max(11, Math.floor(CARD_WIDTH * 0.3));
        ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
        ctx.fillText(`${value} ${suit}`, x + CARD_WIDTH * 0.08, y + fontSize * 1.15);
    }

    ctx.restore();
}


function createAndShuffleDeck(seed) {
    let deck = [];
    values.forEach(value => {
        suits.forEach(suit => {
            deck.push([value, suit]);
        });
    });

    let randomState = seed;
    for (let i = deck.length - 1; i > 0; i--) {
        randomState = (randomState * 1664525 + 1013904223) % 4294967296;
        let swapIndex = Math.floor((randomState / 4294967296) * (i + 1));

        [deck[i], deck[swapIndex]] = [deck[swapIndex], deck[i]]
    }

    return deck;
}


function getHand(deck, offset, stride) {
    let hand = [];
    for (let i = offset; i < deck.length; i += stride) {
        hand.push([deck[i][0], deck[i][1]]);
    }
    return hand
}


function loop(timestamp) {
    deltaTime = timestamp - prevTime;
    prevTime = timestamp;
    fps = Math.round(1000 / deltaTime);

    ctx.fillStyle = "#00512c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);



    requestAnimationFrame(loop);
}

channels.onDataReceived = (data, remoteId) => {
    try {
        let received = JSON.parse(data);

        if (received.type === "seed") {
            if (remoteId === channels.hostId) {
                seed = received.seed;
                deck = createAndShuffleDeck(seed);
                hand = getHand(deck, channels.getJoinRank(channels.id), channels.numPeers);
                console.log(hand);
            }
        }
    } catch (err) { }
};
