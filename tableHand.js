class TableHand {
    constructor() {
        this.cards = [];
    }

    addCard(card) {
        this.cards.push(card);
        this.sortCards();
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

        this.baseX = -((this.cards.length - 1) * this.gap + CARD_WIDTH) / 2 + CARD_WIDTH / 2;
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].animatePosition(this.baseX + (i * this.gap), CARD_HEIGHT*0.9);
        }

        this.cards.forEach(card => {
            card.update(deltaTime, this.gap);
        });
    }

    render() {
        this.cards.forEach(card => {
            card.render();
        });
    }
}