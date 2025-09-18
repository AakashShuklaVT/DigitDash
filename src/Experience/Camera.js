import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Experience from './Experience.js'

export default class Camera {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas

        this.frustumSize = 12

        // Relative offset from player (fixed)
        this.offset = new THREE.Vector3(0, 5, 0)

        this.setInstance()
        // this.setControls()
    }

    setInstance() {
        const aspect = this.sizes.width / this.sizes.height

        this.instance = new THREE.OrthographicCamera(
            (-this.frustumSize * aspect) / 2, // left
            (this.frustumSize * aspect) / 2,  // right
            this.frustumSize / 2,             // top
            -this.frustumSize / 2,            // bottom
            0.1,                              // near
            100                               // far
        )

        // Start at offset position relative to origin
        this.instance.position.copy(this.offset)
        // this.instance.lookAt(0, 0, 0)
        this.scene.add(this.instance)
    }

    setControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.enableDamping = true
    }

    resize() {
        const aspect = this.sizes.width / this.sizes.height
        this.instance.left = (-this.frustumSize * aspect) / 2
        this.instance.right = (this.frustumSize * aspect) / 2
        this.instance.top = this.frustumSize / 2
        this.instance.bottom = -this.frustumSize / 2
        this.instance.updateProjectionMatrix()
    }

    /**
     * Smoothly follow the player while keeping a fixed offset
     * @param {THREE.Vector3} playerPosition
     */
    followPlayer(playerPosition) {
        if (!playerPosition) return

        // Compute target position: player + fixed offset
        const target = new THREE.Vector3().addVectors(playerPosition, this.offset)

        // Smoothly move camera to target
        gsap.to(this.instance.position, {
            // x: target.x,
            y: target.y,
            z: target.z,
            duration: 0.05, // fast but smooth
            ease: 'power2.out'
        })

        // Always look at player
        this.instance.lookAt(this.instance.position.x, playerPosition.y, playerPosition.z)
    }

    update() {
        // Optional: update controls if using OrbitControls
        if (this.controls) this.controls.update()
    }
}
