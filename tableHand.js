class TableHand {
    constructor() {
        this.cards = [];

        this.onDealingFinish = () => { };

        this.isSpread = false;
        this.showHand = true;
        this.cardsExit = false;

        this.maxPlayer = -1;
        this.maxValue = -1;
    }

    show() {
        this.showHand = true;
    }

    hide() {
        this.showHand = false;
    }

    spread() {
        this.isSpread = true;
    }

    createAndShuffleDeck(seed) {
        values.forEach(value => {
            suits.forEach(suit => {
                this.cards.push(new Card(value, suit, 0, 0, true));
            });
        });

        let randomState = seed;
        for (let i = this.cards.length - 1; i > 0; i--) {
            randomState = (randomState * 1664525 + 1013904223) % 4294967296;
            let swapIndex = Math.floor((randomState / 4294967296) * (i + 1));

            [this.cards[i], this.cards[swapIndex]] = [this.cards[swapIndex], this.cards[i]];
        }
    }

    dealCards(hands) {
        setTimeout(() => {
            this.spread();
            this.onDealingFinish();
        }, this.cards.length * 50 + 600);
        for (let i = 0; i < this.cards.length; i++) {
            setTimeout(() => {
                hands[i % channels.numPeers].addCard(this.cards.shift());
            }, i * 50);
        }
    }

    addCard(card) {
        const valueOrder = { "A": 14, "K": 13, "Q": 12, "J": 11, "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };

        this.cards.push(card);

        if (firstRound) {
            firstRound = false;
        }

        if (!newRound && card.suit !== currentRoundSuit) {
            roundEnd = true;

            setTimeout(() => {
                this.cardsExit = true;
            }, 1200);

            setTimeout(() => {
                this.cardsExit = false;
                roundEnd = false;
                newRound = true;
                currentRoundSuit = "";
                this.cards.forEach(card => {
                    hands[this.maxPlayer].addCard(card);
                });
                this.cards = [];
                currentTurn = this.maxPlayer;

                this.maxPlayer = -1;
                this.maxValue = -1;
            }, 1500);
            return;
        }

        if (valueOrder[card.value] > this.maxValue) {
            this.maxValue = valueOrder[card.value]
            this.maxPlayer = currentTurn;
        }

        if (newRound) {
            newRound = false;
            currentRoundSuit = card.suit;
        }

        if (this.cards.length == channels.numPeers) {
            roundEnd = true;

            setTimeout(() => {
                this.cardsExit = true;
            }, 1200);

            setTimeout(() => {
                this.cardsExit = false;
                roundEnd = false;
                newRound = true;
                currentRoundSuit = "";
                this.cards = [];
                currentTurn = this.maxPlayer;

                this.maxPlayer = -1;
                this.maxValue = -1;
            }, 1500);
            return;
        } else {
            currentTurn = (currentTurn + 1) % channels.numPeers;
        }
    }

    removeCard(cardIndex) {
        this.cards.splice(cardIndex, 1);
    }

    sortCards() {
        const suitOrder = { "♠": 4, "♥": 3, "♣": 2, "♦": 1 };

        const valueOrder = { "A": 14, "K": 13, "Q": 12, "J": 11, "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };

        this.cards.sort((a, b) => {
            if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                return suitOrder[b.suit] - suitOrder[a.suit];
            }

            return valueOrder[b.value] - valueOrder[a.value];
        });
    }

    update(deltaTime) {
        if (this.cardsExit) {
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].targetScaleX = -1;
                this.cards[i].targetX = 0;
                this.cards[i].targetY = canvas.height;
            }
        } else if (this.isSpread) {
            this.gap = CARD_WIDTH * 1.2;
            if ((this.cards.length - 1) * this.gap + CARD_WIDTH < canvas.width) {
                this.baseX = -((this.cards.length - 1) * this.gap + CARD_WIDTH) / 2 + CARD_WIDTH / 2;
            } else {
                this.baseX = Math.min((CARD_WIDTH / 2) - (canvas.width / 2) + CARD_WIDTH / 2, Math.max((canvas.width / 2) - (this.cards.length * this.gap), this.baseX));
            }
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].targetScaleX = -1;
                this.cards[i].targetX = this.baseX + (i * this.gap);
                this.cards[i].targetY = CARD_HEIGHT * 0.9;
            }
        } else {
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].targetScaleX = 1;
                this.cards[i].targetX = 0;
                this.cards[i].targetY = 0;
            }
        }

        this.cards.forEach(card => {
            this.showHand ? card.show() : card.hide();
            card.update(deltaTime, this.gap);
        });
    }

    render() {
        this.cards.forEach(card => {
            card.render();
        });
    }
}