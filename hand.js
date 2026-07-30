class Hand {
    constructor(isLocal, rank) {
        this.isLocal = isLocal;
        this.rank = rank;
        this.cards = [];

        this.gap = 50;
        this.isSpread = false;
        this.baseX = -canvas.width / 2 + CARD_WIDTH / 2;
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
        this.isSpread = true;
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].animateFlip();
        }
    }

    reposition() {
        this.gap = CARD_WIDTH / 2;
        if (this.isSpread) {
            this.baseX = Math.min((CARD_WIDTH / 2) - (canvas.width / 2) + this.gap, Math.max((canvas.width / 2) - (this.cards.length * this.gap) - this.gap, this.baseX));
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].animatePosition(this.baseX + (i * this.gap), CARD_HEIGHT / 2 - (canvas.height / 2) + this.gap / 2);
                setTimeout(() => {
                    this.cards[i].animationSpeed = 1;
                }, 900);
            }
        } else {
            for (let i = 0; i < this.cards.length; i++) {
                this.cards[i].animatePosition((((canvas.width / channels.numPeers) / 2) - (canvas.width / 2)) + (this.rank * (canvas.width / channels.numPeers)), CARD_HEIGHT / 2 - (canvas.height / 2) + this.gap / 2);
            }
        }
    }

    addCard(card) {
        this.cards.push(card);
    }
}