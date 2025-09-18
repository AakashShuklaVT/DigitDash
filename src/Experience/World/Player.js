import * as THREE from 'three'
import gsap from 'gsap'
import Experience from '../Experience.js'
import TextHandler from '../Utils/TextHandler.js'
import gameConfig from '../configs/gameConfig.js'

export default class Player {
    constructor() {
        this.experience = new Experience()
        this.camera = this.experience.camera
        this.scene = this.experience.scene
        this.eventEmitter = this.experience.eventEmitter
        this.textHandler = new TextHandler(this.scene)

        // Config
        this.laneIndex = gameConfig.player.laneIndex
        this.laneCount = gameConfig.laneCount
        this.laneWidth = gameConfig.laneWidth
        this.baseSpeed = gameConfig.player.baseSpeed
        this.speed = gameConfig.player.speed
        this.maxSpeed = gameConfig.player.maxSpeed
        this.acceleration = gameConfig.player.acceleration
        this.isDead = false

        this.counterValue = gameConfig.player.counterValue

        this.setPlayer()
        this.registerEvents()
        this.createPlayerCounterText()
    }

    setPlayer() {
        const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7)
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.castShadow = true

        // initial position
        const half = Math.floor(this.laneCount / 2)
        this.mesh.position.x = (this.laneIndex - half) * this.laneWidth
        this.mesh.position.y = 0.45
        this.mesh.position.z = -10

        this.scene.add(this.mesh)
    }

    registerEvents() {
        this.eventEmitter.on('left', () => this.moveLeft())
        this.eventEmitter.on('right', () => this.moveRight())
        this.eventEmitter.on('numberCollision', (number) => this.updatePlayerCounterText(number))
        this.eventEmitter.on('gameOver', () => this.gameOver())
    }

    createPlayerCounterText() {
        this.counterText = this.textHandler.createText({
            text: this.counterValue.toString(),
            fontSize: 0.3,
            color: 0xffffff,
            position: {
                x: this.mesh.position.x,
                y: this.mesh.position.y + 1,
                z: this.mesh.position.z
            },
            rotation: {
                x: -90,
                y: 0,
                z: 0
            },
            outlineWidth: 0.01
        })
        this.scene.add(this.counterText)
    }

    updatePlayerCounterText(number) {
        this.counterValue += number


        this.counterText.text = this.counterValue.toString()
        this.counterText.sync()

        if (this.counterValue <= 0) {
            this.eventEmitter.trigger('gameOver')
            return
        }
        else {
            this.eventEmitter.trigger('scoreUpdated')
        }
    }

    moveLeft() {
        if (this.laneIndex > 0) {
            this.laneIndex--
            this.updatePosition()
        }
    }

    moveRight() {
        if (this.laneIndex < this.laneCount - 1) {
            this.laneIndex++
            this.updatePosition()
        }
    }

    updatePosition() {
        const half = Math.floor(this.laneCount / 2)
        const targetX = (this.laneIndex - half) * this.laneWidth

        gsap.to(this.mesh.position, {
            x: targetX,
            duration: 0.2,
            ease: 'power2.out'
        })
    }

    gameOver() {
        console.log('Game Over');
        this.isDead = true
        // removeEventListener
        this.eventEmitter.off('left', this.moveLeft)
        this.eventEmitter.off('right', this.moveRight)
        this.eventEmitter.off('numberCollision', this.updatePlayerCounterText)
    }

    update() {
        // Gradually increase speed
        if (this.isDead) return
        if (this.speed < this.maxSpeed) {
            this.speed += this.acceleration
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed
        }
        console.log(this.speed);

        // Move forward
        this.mesh.position.z -= this.speed

        this.camera.followPlayer(this.mesh.position)

        // Keep text floating above player
        if (this.counterText) {
            this.counterText.position.set(
                this.mesh.position.x,
                this.mesh.position.y + 0.5,
                this.mesh.position.z,
            )
        }
    }
}

