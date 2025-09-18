import * as THREE from "three"
import Experience from "../Experience.js"
import TextHandler from "../Utils/TextHandler.js"
import gameConfig from "../configs/gameConfig.js"

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
        this.laneCount = gameConfig.laneCount
        this.laneWidth = gameConfig.laneWidth
        this.gap = gameConfig.numberManager.gap
        this.initialCount = gameConfig.numberManager.initialCount

        this.groups = []
        this.lastSpawnZ = 0

        // Debug UI
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder("Numbers Manager")
            this.debugFolder.add(this, "gap").min(5).max(100).step(1).name("Group Gap")
        }

        // Initial groups
        this.spawnInitial()
    }

    /** Spawn the first N groups */
    spawnInitial() {
        for (let i = 1; i <= this.initialCount; i++) {
            this.spawnGroup(-i * this.gap)
        }
    }

    generateValues() {
        const current = this.player.counterValue || 1

        let positive = Math.max(1, Math.floor(current * 0.5) + Math.floor(Math.random() * 5) + 1)
        let negative = -Math.max(1, Math.floor(Math.random() * Math.max(2, current * 0.5)))

        const range = Math.max(10, Math.floor(current * 1.2))
        const random = (Math.random() < 0.7)
            ? -(Math.floor(Math.random() * range) + 1)
            : Math.floor(Math.random() * range) + 1

        const values = [positive, negative, random]

        // Shuffle in-place
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[values[i], values[j]] = [values[j], values[i]]
        }

        return values
    }

    createNumberCube(value, x, y, z) {
        const cubeGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9)
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
        const cube = new THREE.Mesh(cubeGeo, cubeMat)
        cube.position.set(x, y, z)

        // Attach text
        const textMesh = this.textHandler.createText({
            text: value.toString(),
            fontSize: 0.5,
            color: 0xffffff,
            position: { x: 0, y: 1, z: 0 },
            rotation: {x: -90, y: 0, z: 0}
        })
        cube.add(textMesh)

        // Optional debug helper
        let helper = null
        if (this.debug.active) {
            helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(cube), 0xffff00)
        }

        return { mesh: cube, value, helper }
    }

    spawnGroup(zPos) {
        const y = 0.5
        const half = Math.floor(this.laneCount / 2)
        const values = this.generateValues()

        const group = new THREE.Group()
        const numbers = []

        for (let lane = 0; lane < this.laneCount; lane++) {
            const value = values[lane]
            const x = (lane - half) * this.laneWidth
            const num = this.createNumberCube(value, x, y, zPos)

            group.add(num.mesh)
            if (num.helper) group.add(num.helper)

            numbers.push(num)
        }

        this.scene.add(group)
        this.groups.push({ group, numbers })
        this.lastSpawnZ = zPos
    }


    handleCollision(grp, num, j) {
        if (grp.consumed) return

        grp.consumed = true 

        this.eventEmitter.trigger("numberCollision", [num.value])

        grp.group.remove(num.mesh)
        if (num.helper) grp.group.remove(num.helper)
        grp.numbers.splice(j, 1)

        this.spawnGroup(this.lastSpawnZ - this.gap)
    }

    /** Update per-frame */
    update() {
        if (!this.player?.mesh) return

        const playerBB = new THREE.Box3().setFromObject(this.player.mesh)

        for (let i = this.groups.length - 1; i >= 0; i--) {
            const grp = this.groups[i]

            // Skip collision checks if group already consumed
            if (grp.consumed) continue

            for (let j = grp.numbers.length - 1; j >= 0; j--) {
                const num = grp.numbers[j]
                const numBB = new THREE.Box3().setFromObject(num.mesh)

                if (this.debug.active && num.helper) {
                    num.helper.box.copy(numBB)
                }

                if (playerBB.intersectsBox(numBB)) {
                    this.handleCollision(grp, num, j)
                }
            }

            // Cleanup if empty
            if (grp.numbers.length === 0) {
                this.scene.remove(grp.group)
                this.groups.splice(i, 1)
            }
        }
    }

}
