class Hand {
    constructor(isLocal, rank) {
        this.isLocal = isLocal;
        this.rank = rank;
        this.cards = [];

        this.gap;
        this.isSpread = false;
        this.baseX = Infinity;

        this.onCardPlayed = (card) => { };
    }

    show() {
        this.cards.forEach(card => {
            card.show();
        });
    }

    hide() {
        this.cards.forEach(card => {
            card.hide();
        });
    }

    spread() {
        this.sortCards();
        this.isSpread = true;
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].animateFlip();
        }
        // setTimeout(() => {
        //     this.cards.forEach(card => card.animationSpeed = 0.01);
        // }, 1200);
    }

    addCard(card) {
        this.cards.push(card);
    }

    removeCard(cardIndex) {
        this.cards.splice(cardIndex, 1); 
    }

    getCardIndex(value, suit) {
        for(let i = 0; i < this.cards.length; i++) {
            if(this.cards[i].value == value && this.cards[i].suit == suit) {
                return i;
            }
        }
        return -1;
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
        this.gap = CARD_WIDTH * 0.8;

        this.cards.forEach(card => {
            card.update(deltaTime, this.gap);
        });

        if (this.isSpread) {
            this.baseX = Math.min((CARD_WIDTH / 2) - (canvas.width / 2) + CARD_WIDTH / 2, Math.max((canvas.width / 2) - (this.cards.length * this.gap), this.baseX));
            for (let i = 0; i < this.cards.length; i++) {
                if (this.cards[i].isHovered && isClicked) {
                    this.onCardPlayed(this.cards[i], i);
                } else if (this.cards[i].isHovered) {
                    this.cards[i].animatePosition(this.baseX + (i * this.gap), CARD_HEIGHT / 2 - (canvas.height / 2) + CARD_WIDTH / 4 + CARD_HEIGHT / 5);
                } else {
                    this.cards[i].animatePosition(this.baseX + (i * this.gap), CARD_HEIGHT / 2 - (canvas.height / 2) + CARD_WIDTH / 4);
                }
            }
        } else {
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].animatePosition((((canvas.width / channels.numPeers) / 2) - (canvas.width / 2)) + (this.rank * (canvas.width / channels.numPeers)), CARD_HEIGHT / 2 - (canvas.height / 2) + CARD_WIDTH / 4);
            }
        }
    }

    render() {
        this.cards.forEach(card => {
            card.render();
        });
    }
}