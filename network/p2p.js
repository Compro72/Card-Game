class P2PDataChannels {
	constructor(connector) {
		this.id = null;
		this.hostId = null;
		this.devices = {};
		this.dataChannels = {};
		this.isInitiator = {};
		this.iceCandidateQueue = {};
		this.latency = {};
		this.unresolvedPings = {};

		this.timestamps = {};
		this.oldestTimestamp = Infinity;
		this.numPeers = 0;

		this.connector = connector;

		this.connector.socket.onopen = () => {
			this.id = sessionStorage.getItem("p2p_session_id");
			if (!this.id) {
				this.id = "peer_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
				sessionStorage.setItem("p2p_session_id", this.id);
			}

			this.connector.send(JSON.stringify({
				type: "initId",
				id: this.id
			}));

			this.idCreated(this.id);

			clearInterval(this.pingInterval);
			this.pingInterval = setInterval(() => {
				Object.keys(this.dataChannels).forEach((remoteId) => {
					if (this.sendDataToPeer(remoteId, JSON.stringify({ type: "ping", time: Date.now() }))) {
						if (!this.unresolvedPings[remoteId]) {
							this.unresolvedPings[remoteId] = 0;
						}
						this.unresolvedPings[remoteId]++;
						if (this.unresolvedPings[remoteId] >= 3) {
							this.closePeerConnection(remoteId);
						}
					}
				});
			}, 1000);
		}

		this.connector.onPeerDataReceived = async (data) => {
			await this.process(data);
		};

		this.connector.onRoomLeft = () => {
			this.leaveRoom();
		};

		window.addEventListener('pagehide', () => {
			this.connector.leaveRoom();
		});

		this.idCreated = (localId) => { };
		this.onDataReceived = (data, remoteId) => { };
		this.onPeerConnected = (remoteId) => { };
		this.onPeerDisconnected = (remoteId) => { };
	}

	isHost() {
		return this.id && this.hostId && this.id === this.hostId;
	}

	getJoinRank(playerId) {
		let sorted = Object.entries(this.timestamps);
		sorted.sort((a, b) => a[1] - b[1]);
		let index = sorted.findIndex(item => item[0] == playerId);
		return index;
	}

	start() {
		if (this.isHost()) {
			this.connector.send(JSON.stringify({
				type: "start"
			}));
		}
	}

	leaveRoom() {
		clearInterval(this.pingInterval);
		Object.keys(this.dataChannels).forEach((remoteId) => {
			this.closePeerConnection(remoteId);
		});
		this.timestamps = {};
		this.hostId = null;
		this.oldestTimestamp = Infinity;
		this.numPeers = 0;
	}

	removeFromRoom(remoteId) {
		if (this.isHost() && !this.connector.roomStarted) {
			this.connector.send(JSON.stringify({
				type: "peerMessage",
				peerMessageType: "remove",
				targetId: remoteId,
				remoteId: this.id
			}));
		}
	}

	async process(data) {
		let received;
		try {
			received = JSON.parse(data);
		} catch (e) {
			return;
		}

		let peerMessageType = received.peerMessageType;
		let remoteId = received.remoteId;

		if (peerMessageType === "timestamp") {
			this.numPeers++;
			this.timestamps[remoteId] = received.timestamp;
			if (received.timestamp < this.oldestTimestamp) {
				this.oldestTimestamp = received.timestamp;
				this.hostId = remoteId;
			}

		} else if (peerMessageType === "role") {
			await this.initialize(received.role, remoteId);

		} else if (peerMessageType === "sdp") {
			if (!this.devices[remoteId]) return;

			await this.devices[remoteId].setRemoteDescription(new RTCSessionDescription(received.sdp));

			while (this.iceCandidateQueue[remoteId] && this.iceCandidateQueue[remoteId].length > 0) {
				const candidate = this.iceCandidateQueue[remoteId].shift();
				try {
					await this.devices[remoteId].addIceCandidate(candidate);
				} catch (e) { }
			}

			if (!this.isInitiator[remoteId]) {
				await this.createAnswer(remoteId);
			}

		} else if (peerMessageType === "iceCandidate") {
			const candidate = new RTCIceCandidate(received.candidate);

			if (!this.devices[remoteId] || !this.devices[remoteId].remoteDescription) {
				if (!this.iceCandidateQueue[remoteId]) this.iceCandidateQueue[remoteId] = [];
				this.iceCandidateQueue[remoteId].push(candidate);
			} else {
				await this.devices[remoteId].addIceCandidate(candidate);
			}
		} else if (peerMessageType === "remove") {
			if (remoteId === this.hostId) {
				this.connector.leaveRoom();
			}
		}
	}

	async initialize(role, remoteId) {
		this.iceCandidateQueue[remoteId] = [];

		this.devices[remoteId] = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
		});

		this.devices[remoteId].onicecandidate = ({ candidate }) => {
			if (candidate) {
				this.connector.send(JSON.stringify({
					type: "peerMessage",
					peerMessageType: "iceCandidate",
					candidate: candidate,
					targetId: remoteId,
					remoteId: this.id
				}));
			}
		};

		if (role === "initiator") {
			this.isInitiator[remoteId] = true;
			await this.createOffer(remoteId);
		} else {
			this.isInitiator[remoteId] = false;

			this.devices[remoteId].ondatachannel = (event) => {
				this.setupDataChannel(remoteId, event.channel);
			};
		}
	}

	setupDataChannel(remoteId, channel) {
		this.dataChannels[remoteId] = channel;
		channel.onmessage = (event) => {
			try {
				let received = JSON.parse(event.data);

				if (received.type === "ping") {
					this.sendDataToPeer(remoteId, JSON.stringify({ type: "pong", time: received.time }));
				} else if (received.type === "pong") {
					this.unresolvedPings[remoteId] = 0;
					this.latency[remoteId] = Date.now() - received.time;
				} else {
					this.onDataReceived(event.data, remoteId);
				}
			} catch (err) {
				this.onDataReceived(event.data, remoteId);
			}
		};

		channel.onopen = () => {
			this.onPeerConnected(remoteId);
		};

		channel.onclose = () => {
			this.closePeerConnection(remoteId);
		};
	}

	async createOffer(remoteId) {
		const channel = this.devices[remoteId].createDataChannel("dataChannel");
		this.setupDataChannel(remoteId, channel);

		const offer = await this.devices[remoteId].createOffer();
		await this.devices[remoteId].setLocalDescription(offer);

		this.connector.send(JSON.stringify({
			type: "peerMessage",
			peerMessageType: "sdp",
			sdp: this.devices[remoteId].localDescription,
			targetId: remoteId,
			remoteId: this.id
		}));
	}

	async createAnswer(remoteId) {
		const answer = await this.devices[remoteId].createAnswer();
		await this.devices[remoteId].setLocalDescription(answer);

		this.connector.send(JSON.stringify({
			type: "peerMessage",
			peerMessageType: "sdp",
			sdp: this.devices[remoteId].localDescription,
			targetId: remoteId,
			remoteId: this.id
		}));
	}

	broadcastData(data) {
		Object.keys(this.dataChannels).forEach((remoteId) => {
			this.sendDataToPeer(remoteId, data);
		});
	}

	sendDataToPeer(remoteId, data) {
		if (this.dataChannels[remoteId] && this.dataChannels[remoteId].readyState === "open" && this.dataChannels[remoteId].bufferedAmount < 1048576) {
			this.dataChannels[remoteId].send(data);
			return true;
		} else {
			return false;
		}
	}

	closePeerConnection(remoteId) {
		if (!this.devices[remoteId] && !this.dataChannels[remoteId]) return;

		if (this.dataChannels[remoteId]) {
			this.dataChannels[remoteId].onopen = null;
			this.dataChannels[remoteId].onclose = null;
			this.dataChannels[remoteId].onmessage = null;
			this.dataChannels[remoteId].close();
		}

		if (this.devices[remoteId]) {
			this.devices[remoteId].onicecandidate = null;
			this.devices[remoteId].onconnectionstatechange = null;
			this.devices[remoteId].ondatachannel = null;
			this.devices[remoteId].close();
		}

		delete this.devices[remoteId];
		delete this.dataChannels[remoteId];
		delete this.isInitiator[remoteId];
		delete this.iceCandidateQueue[remoteId];
		delete this.latency[remoteId];
		delete this.unresolvedPings[remoteId];
		delete this.timestamps[remoteId];

		this.oldestTimestamp = Infinity;
		Object.keys(this.timestamps).forEach((timestampRemoteId) => {
			if (this.timestamps[timestampRemoteId] < this.oldestTimestamp) {
				this.oldestTimestamp = this.timestamps[timestampRemoteId];
				this.hostId = timestampRemoteId;
			}
		});

		this.onPeerDisconnected(remoteId);
	}
}
