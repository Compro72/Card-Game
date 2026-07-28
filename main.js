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

let mouseX = 0;
let mouseY = 0;
let prevMouseDown = false;
let mouseDown = false;

let gameSeed;

const suits = ["♠", "♥", "♣", "♦"];
const values = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

let deck;
let myRank;
let hands = [];
let myHand;

let CARD_WIDTH = 90;
let CARD_HEIGHT = 126;

let frameNumber = 0;


function updateMousePosition(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (((clientX - rect.left) / rect.width) * canvas.width) - (canvas.width / 2);
    mouseY = (canvas.height / 2) - (((clientY - rect.top) / rect.height) * canvas.height);
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
    mouseDown = true;
}, { passive: false });

window.addEventListener("touchmove", (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
    handleTouch(e);
}, { passive: false });

window.addEventListener("touchend", (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
    mouseDown = false;
}, { passive: false });

window.addEventListener("mousedown", (event) => {
    mouseDown = true;
});

window.addEventListener("mouseup", (event) => {
    mouseDown = false;
});

window.addEventListener("resize", (event) => {
    canvas.width = window.innerHeight*(16/9);
    canvas.height = window.innerHeight - 80;
    hands.forEach(hand => {
        hand.reposition();
    });
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

        [deck[i], deck[swapIndex]] = [deck[swapIndex], deck[i]]
    }

    return deck;
}


// function animateDealing() {
//     for (let i = 0; i < deck.length; i++) {
//         let
//     }
// }

let ratio = screen.width/(screen.height-80);

function initialize(seed) {
    document.getElementById("game-area").style.display = "flex";
    Object.keys(channels.timestamps).forEach((item) => {
        let playerName = document.createElement("div");
        playerName.className = "player-name";
        playerName.innerHTML = item + (item === channels.id ? " (You)" : "");
        document.getElementById("player-bar").appendChild(playerName);
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80;

    gameSeed = seed;
    deck = createAndShuffleDeck(gameSeed);
    myRank = channels.getJoinRank(channels.id);
    for (let i = 0; i < channels.numPeers; i++) {
        if (myRank === i) {
            myHand = new Hand(true, myRank);
            hands[i] = myHand;
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
            }, i * 50+1000)
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

    ctx.fillStyle = "#00512d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (frameNumber !== 0) {
        deck.forEach(card => {
            card.update(deltaTime);
            card.render();
        });
    }


    frameNumber++;
    prevMouseDown = mouseDown;
    requestAnimationFrame(loop);
}

channels.onDataReceived = (data, remoteId) => {
    try {
        let received = JSON.parse(data);

        if (received.type === "seed") {
            if (remoteId === channels.hostId) {
                initialize(received.seed);
            }
        }
    } catch (e) { }
};
