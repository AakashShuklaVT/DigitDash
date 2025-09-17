import Experience from '../Experience'

export default class ScoreManager {
    constructor() {
        this.experience = new Experience()
        this.eventEmitter = this.experience.eventEmitter

        // Config
        this.score = 0

        this.getUIElements()
        this.registerEvents()
    }
    
    getUIElements() {
        this.scoreElement = document.querySelector('.score-text')
    }

    registerEvents() {
        this.eventEmitter.on('scoreUpdated', (points = 1) => this.add(points)) 
    }

    add(points = 1) {
        this.score += points
        this.updateUI()
    }

    set(value) {
        this.score = value
        this.updateUI()
    }

    updateUI() {
        if (this.scoreElement) {
            this.scoreElement.innerText = 'Score : ' + this.score
        }
    }

    getScore() {
        return this.score
    }
}
