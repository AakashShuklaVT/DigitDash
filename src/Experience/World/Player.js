import * as THREE from 'three'
import gsap from 'gsap'
import Experience from '../Experience.js'
import TextHandler from '../Utils/TextHandler.js'

export default class Player {
    constructor() {
        this.experience = new Experience()
        this.camera = this.experience.camera
        this.scene = this.experience.scene
        this.eventEmitter = this.experience.eventEmitter
        this.textHandler = new TextHandler(this.scene)

        // Config
        this.laneIndex = 1
        this.laneCount = 3
        this.laneWidth = 2
        this.baseSpeed = 0.09// starting speed
        this.speed = this.baseSpeed
        this.maxSpeed = 0.4  // maximum speed
        this.acceleration = 0.00009 // speed increase per frame (adjustable)
        this.isDead = false
        // Score / counter value
        this.counterValue = 2

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
        this.mesh.position.z = -4

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
            fontSize: 0.2,
            color: 0xffffff,
            position: {
                x: this.mesh.position.x,
                y: this.mesh.position.y + 0.04,
                z: this.mesh.position.z + 0.4
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
        // this.eventEmitter.off('gameOver', this.gameOver)
    }

    update() {
        // Gradually increase speed
        if (this.isDead) return
        if (this.speed < this.maxSpeed) {
            this.speed += this.acceleration
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed
        }

        // Move forward
        this.mesh.position.z -= this.speed

        // Make camera follow
        this.camera.followPlayer(this.mesh.position)

        // Keep text floating above player
        if (this.counterText) {
            this.counterText.position.set(
                this.mesh.position.x,
                this.mesh.position.y + 0.04,
                this.mesh.position.z + 0.4,
            )
        }
    }
}

