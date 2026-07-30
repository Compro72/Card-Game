class Card {
    constructor(value, suit, x, y, isFaceDown) {
        this.value = value;
        this.suit = suit;
        this.x = x;
        this.y = y;
        this.isFaceDown = isFaceDown;
        this.scaleX = 1.0;
        this.angle = 0;

        this.targetX = x;
        this.targetY = y;
        this.targetAngle = 0;

        this.isFlipping = false;
        this.flipFaceDown = false;
        this.flipProgress = 0;

        this.animationSpeed = 0.01;

        this.showCard = true;
    }

    show() {
        this.showCard = true;
    }

    hide() {
        this.showCard = false;
    }

    animatePosition(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    animateAngle(targetAngle) {
        this.targetAngle = targetAngle;
    }

    animateFlip() {
        this.isFlipping = true;
        this.flipProgress = 0;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    }

    setRotation(angle) {
        this.angle = angle;
        this.targetAngle = angle;
    }

    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    update(deltaTime) {
        let lerpAmount = 1 - Math.exp(-this.animationSpeed * deltaTime);
        this.x += (this.targetX - this.x) * lerpAmount;
        this.y += (this.targetY - this.y) * lerpAmount;

        let diff = this.targetAngle - this.angle;

        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        this.angle += diff * lerpAmount;

        if (this.isFlipping) {
            this.flipFaceDown = this.flipProgress >= 0.5 ? !this.isFaceDown : this.isFaceDown;
            this.scaleX = Math.abs(Math.cos(this.flipProgress * Math.PI));
            this.flipProgress += this.animationSpeed * deltaTime;

            if (this.flipProgress >= 1.0) {
                this.isFaceDown = !this.isFaceDown;
                this.isFlipping = false;
                this.flipFaceDown = false;
                this.scaleX = 1;
                this.flipProgress = 0;
            }
        }
    }

    render() {
        if (!this.showCard) return;

        const screenX = (canvas.width / 2) + this.x;
        const screenY = (canvas.height / 2) - this.y;

        if(screenX + CARD_WIDTH / 2 < 0 || screenX - CARD_WIDTH / 2 > canvas.width || screenY + CARD_HEIGHT / 2 < 0 || screenY - CARD_HEIGHT / 2 > canvas.height) {
            return;
        }

        ctx.save();

        ctx.translate(screenX, screenY);

        if (this.angle !== 0) ctx.rotate(this.angle);
        if (this.scaleX !== 1.0) ctx.scale(this.scaleX, 1.0);

        const halfW = CARD_WIDTH / 2;
        const halfH = CARD_HEIGHT / 2;
        const radius = Math.max(4, Math.floor(CARD_WIDTH * 0.09));

        if ((this.isFlipping && this.flipFaceDown) || (!this.isFlipping && this.isFaceDown)) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(-halfW, -halfH, CARD_WIDTH, CARD_HEIGHT, radius);
            ctx.fill();

            ctx.fillStyle = "#5a1b1b";
            ctx.beginPath();
            ctx.roundRect(-halfW + 5, -halfH + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10, radius);
            ctx.fill();

            // ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            // ctx.lineWidth = 8;
            // ctx.strokeRect(-halfW + 10, -halfH + 10, CARD_WIDTH - 20, CARD_HEIGHT - 20);
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(-halfW, -halfH, CARD_WIDTH, CARD_HEIGHT, radius);
            ctx.fill();

            ctx.fillStyle = (this.suit === "♥" || this.suit === "♦") ? "#d32f2f" : "#1e1e1e";
            const fontSize = Math.floor(CARD_WIDTH * 0.22);
            ctx.font = `bold ${fontSize}px sans-serif`;

            ctx.fillText(
                this.value + " " + this.suit,
                -halfW + CARD_WIDTH * 0.08,
                -halfH + fontSize * 1.15
            );
        }

        ctx.restore();
    }
}