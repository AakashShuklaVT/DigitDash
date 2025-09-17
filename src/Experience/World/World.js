import * as THREE from 'three'
import Experience from '../Experience.js'
import InputHandler from '../Systems/InputHandler.js'
import Environment from './Environment.js'
import Path from './Path.js'
import Player from './Player.js'
import NumbersManager from './NumbersManager.js'
import ScoreManager from './ScoreManager.js'

export default class World {
    constructor() {
        this.experience = new Experience()
        this.eventEmitter = this.experience.eventEmitter
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.inputHandler = new InputHandler()
        this.isGameOver = false
        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.player = new Player()
            this.path = new Path(this.player)
            this.numbersManager = new NumbersManager(this.player)
            this.environment = new Environment()
            this.scoreManager = new ScoreManager()
            this.registerEvents()
        })
    }

    registerEvents() {
        this.eventEmitter.on('gameOver', () => this.gameOver())
    }

    gameOver() {
        this.isGameOver = true
        this.eventEmitter.off('gameOver', this.gameOver)
    }

    update() {
        if (this.isGameOver) return
        if (this.player) {
            this.player.update()
        }
        if (this.numbersManager) {
            this.numbersManager.update()
        }
        if (this.path) {
            this.path.update()
        }
    }

}