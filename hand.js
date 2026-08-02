class Hand {
    constructor(isLocal, rank) {
        this.isLocal = isLocal;
        this.rank = rank;
        this.cards = [];

        this.gap;
        this.isSpread = false;
        this.baseX = Infinity;

        this.showHand = true;

        this.onCardPlayed = (card) => { };
    }

    show() {
        this.showHand = true;
    }

    hide() {
        this.showHand = false;
    }

    spread() {
        this.sortCards();
        this.isSpread = true;
    }

    addCard(card) {
        this.cards.push(card);

        if (this.isSpread) {
            this.sortCards();
        }
    }

    removeCard(cardIndex) {
        this.cards.splice(cardIndex, 1);
    }

    getCardIndex(value, suit) {
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].value == value && this.cards[i].suit == suit) {
                return i;
            }
        }
        return -1;
    }

    containsCard(value, suit) {
        if (value == "any" && suit == "any") {
            return this.cards.length > 0;
        } else if (value == "any") {
            for (let i = 0; i < this.cards.length; i++) {
                if (this.cards[i].suit == suit) {
                    return true;
                }
            }
            return false;
        } else if (suit == "any") {
            for (let i = 0; i < this.cards.length; i++) {
                if (this.cards[i].value == value) {
                    return true;
                }
            }
            return false;
        } else {
            return this.getCardIndex(value, suit) !== -1;
        }
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

    cardClicked(card, cardIndex) {
        if (currentTurn == myRank && (
            (firstRound && card.value == "A" && card.suit == "♠") ||
            (newRound && !firstRound) ||
            (!newRound && card.suit == currentRoundSuit) ||
            (!newRound && !this.containsCard("any", currentRoundSuit))
        )) {
            this.onCardPlayed(card, cardIndex);
        }
    }

    update(deltaTime) {
        this.gap = CARD_WIDTH * 0.8;

        this.cards.forEach(card => {
            this.showHand ? card.show() : card.hide();
            card.update(deltaTime, this.gap);
        });

        if (this.isSpread) {
            if ((this.cards.length - 1) * this.gap + CARD_WIDTH < canvas.width) {
                this.baseX = -((this.cards.length - 1) * this.gap + CARD_WIDTH) / 2 + CARD_WIDTH / 2;
            } else {
                this.baseX = Math.min((CARD_WIDTH / 2) - (canvas.width / 2) + CARD_WIDTH / 2, Math.max((canvas.width / 2) - (this.cards.length * this.gap), this.baseX));
            }
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].targetScaleX = -1;
                this.cards[i].targetX = this.baseX + (i * this.gap);
                this.cards[i].targetY = CARD_HEIGHT / 2 - (canvas.height / 2) + CARD_WIDTH / 4;
                if (this.cards[i].isHovered) {
                    this.cards[i].targetY += CARD_HEIGHT / 5;
                }
                if (this.cards[i].isHovered && isClicked) {
                    this.cardClicked(this.cards[i], i);
                }
            }
        } else {
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].targetScaleX = 1;
                this.cards[i].targetX = (((canvas.width / channels.numPeers) / 2) - (canvas.width / 2)) + (this.rank * (canvas.width / channels.numPeers));
                this.cards[i].targetY = CARD_HEIGHT / 2 - (canvas.height / 2) + CARD_WIDTH / 4;
            }
        }
    }

    render() {
        this.cards.forEach(card => {
            card.render();
        });
    }
}