import * as THREE from 'three'
import Experience from '../Experience.js'
import TextHandler from '../Utils/TextHandler.js'

export default class NumbersManager {
    constructor(player) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.time = this.experience.time
        this.player = player
        this.textHandler = new TextHandler(this.scene)
        this.eventEmitter = this.experience.eventEmitter
        this.debug = this.experience.debug

        // Config
        this.laneCount = 3
        this.laneWidth = 2
        this.spawnInterval = 3000

        this.groups = []
        this.lastSpawnTime = 0
        // Debug folder
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('Numbers Manager')
            this.debugFolder.add(this, 'spawnInterval').min(500).max(5000).step(100).name('Spawn Interval')
        }
    }

    generateValues() {
        const current = this.player.counterValue || 1

        // Positive: ~half of current with some random spread
        let positive = Math.floor(current * 0.5) + Math.floor(Math.random() * 5) + 1
        if (positive <= 0) positive = 1

        // Negative: proportional to current, never 0
        let negative = -Math.floor(Math.random() * Math.max(2, current * 0.5))
        if (negative === 0) negative = -1

        // Random: skewed to be more negative
        const range = Math.max(10, Math.floor(current * 1.2))
        let random
        if (Math.random() < 0.7) {
            // 70% chance negative
            random = -Math.floor(Math.random() * range) - 1
        } else {
            // 30% chance positive
            random = Math.floor(Math.random() * range) + 1
        }

        // Put all values in an array
        const values = [positive, negative, random]

        // Shuffle array (Fisher-Yates shuffle)
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[values[i], values[j]] = [values[j], values[i]]
        }
        return values
    }

    spawnGroup() {
        const z = this.player.mesh.position.z - 15
        const y = 0.5
        const half = Math.floor(this.laneCount / 2)

        const values = this.generateValues()

        const group = new THREE.Group()
        this.scene.add(group)
        const numbers = []

        for (let lane = 0; lane < this.laneCount; lane++) {
            const value = values[lane]
            const x = (lane - half) * this.laneWidth

            // === Cube geometry (always white) ===
            const cubeGeo = new THREE.BoxGeometry(1, 1, 1)
            const cubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
            const cube = new THREE.Mesh(cubeGeo, cubeMat)
            cube.position.set(x, y, z)

            // === Text mesh (moved up a bit above cube) ===
            const textMesh = this.textHandler.createText({
                text: value.toString(),
                fontSize: 0.5,
                color: 0xffffff, 
                position: { x: 0, y: 0.05, z: 0.55 }, 
            })

            cube.add(textMesh) // attach text to cube

            group.add(cube)

            let helper = null
            if (this.debug.active) {
                helper = new THREE.Box3Helper(
                    new THREE.Box3().setFromObject(cube),
                    0xffff00
                )
                group.add(helper)
            }

            numbers.push({ mesh: cube, value, helper })
        }

        this.groups.push({ group, numbers })
    }

    update() {
        if (!this.player?.mesh) return

        const elapsed = this.time.elapsed

        if (elapsed - this.lastSpawnTime > this.spawnInterval) {
            this.spawnGroup()
            this.lastSpawnTime = elapsed
        }

        const playerBB = new THREE.Box3().setFromObject(this.player.mesh)

        for (let i = this.groups.length - 1; i >= 0; i--) {
            const grp = this.groups[i]

            // iterate backwards so splice doesn’t mess indexing
            for (let j = grp.numbers.length - 1; j >= 0; j--) {
                const num = grp.numbers[j]
                const numBB = new THREE.Box3().setFromObject(num.mesh)

                if (this.debug.active && num.helper) {
                    num.helper.box.copy(numBB)
                }

                if (playerBB.intersectsBox(numBB)) {
                    // 🔥 trigger collision event
                    this.eventEmitter.trigger("numberCollision", [num.value])

                    // remove number mesh
                    grp.group.remove(num.mesh)
                    if (num.helper) grp.group.remove(num.helper)

                    // cleanup from numbers list
                    grp.numbers.splice(j, 1)
                }
            }

            // if group has no numbers left → remove whole group
            if (grp.numbers.length === 0) {
                this.scene.remove(grp.group)
                this.groups.splice(i, 1)
            }

            // remove group if it’s behind player
            else if (grp.group.position.z < this.player.mesh.position.z - 5) {
                this.scene.remove(grp.group)
                this.groups.splice(i, 1)
            }
        }
    }

}
