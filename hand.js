class Hand {
    constructor(isLocal, rank) {
        this.isLocal = isLocal;
        this.rank = rank;
        this.cards = [];

        this.gap = 50;
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
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].animatePosition((i * this.gap) - (this.gap * (this.cards.length - 1)) / 2, CARD_HEIGHT / 2 - (canvas.height / 2) + this.gap / 2);
            this.cards[i].animateFlip();
        }
    }

    reposition() {
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].animatePosition((i * this.gap) - (this.gap * (this.cards.length - 1)) / 2, CARD_HEIGHT / 2 - (canvas.height / 2) + this.gap / 2);
        }
    }

    addCard(card) {
        this.cards.push(card);
        card.animatePosition((((canvas.width / channels.numPeers) / 2) - (canvas.width / 2)) + (this.rank * (canvas.width / channels.numPeers)), CARD_HEIGHT / 2 - (canvas.height / 2))
    }
}