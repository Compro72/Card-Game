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