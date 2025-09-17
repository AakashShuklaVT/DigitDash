import Experience from "../Experience.js"

export default class InputHandler {
    constructor() {
        this.experience = new Experience()
        this.eventEmitter = this.experience.eventEmitter

        // touch vars
        this.touchStartX = 0
        this.touchEndX = 0
        this.threshold = 50 

        this.init()
    }

    init() {
        // Keyboard events
        window.addEventListener("keydown", (e) => {
            switch (e.code) {
                case "ArrowLeft":
                    this.eventEmitter.trigger("left")
                    break
                case "ArrowRight":
                    this.eventEmitter.trigger("right")
                    break
            }
        })

        // Touch events (for swipe)
        window.addEventListener("touchstart", (e) => {
            this.touchStartX = e.changedTouches[0].screenX
        })

        window.addEventListener("touchend", (e) => {
            this.touchEndX = e.changedTouches[0].screenX
            this.handleSwipe()
        })
    }

    handleSwipe() {
        const diffX = this.touchEndX - this.touchStartX

        if (Math.abs(diffX) > this.threshold) {
            if (diffX > 0) {
                this.eventEmitter.trigger("right")
            } else {
                this.eventEmitter.trigger("left")
            }
        }
    }
}
