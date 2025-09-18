import * as THREE from "three"
import Experience from "../Experience.js"
import gameConfig from "../configs/gameConfig.js"

export default class Path {
    /**
     * @param {Object} player - player object with either .position.z or .mesh.position.z
     */
    constructor(player) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.player = player

        // Config - merge default config with any provided options
        const pathConfig = gameConfig.path;

        this.segmentLength = pathConfig.segmentLength;
        this.visibleSegments = Math.max(2, pathConfig.visibleSegments);
        this.laneCount = gameConfig.laneCount;
        this.laneWidth = gameConfig.laneWidth;
        this.recycleMargin = pathConfig.recycleMargin;
        this.overlap = pathConfig.overlap;
        this.debug = pathConfig.debug;
        this.useBasicMaterialForDebug = pathConfig.useBasicMaterialForDebug;

        this.segments = []
        this.startPlayerZ = this._getPlayerZ()

        this.setLanes()
        this.setInitialGround()
    }

    /** Spawn initial ground segments */
    setInitialGround() {
        for (let i = 0; i < this.visibleSegments; i++) {
            const z = -((this.visibleSegments - 1 - i) * this.segmentLength)
            this.spawnSegment(z)
        }
        this.updateSegmentRefs()
    }

    /** Create one ground segment */
    spawnSegment(zPos) {
        const geometry = new THREE.BoxGeometry(
            this.laneCount * this.laneWidth,
            0.2,
            this.segmentLength
        )
        geometry.translate(0, 0, -this.segmentLength / 2)

        const material = (this.debug && this.useBasicMaterialForDebug)
            ? new THREE.MeshBasicMaterial({ color: 'pink'})
            : new THREE.MeshStandardMaterial({ color: 'pink'})

        const seg = new THREE.Mesh(geometry, material)
        seg.receiveShadow = true
        seg.position.z = zPos

        this.scene.add(seg)
        this.segments.push(seg)
    }

    /** Update cached refs (front, middle, back) */
    updateSegmentRefs() {
        this.frontSegment = this.segments[0]
        this.middleIndex = Math.floor(this.segments.length / 2)
        this.middleSegment = this.segments[this.middleIndex]
        this.backSegment = this.segments[this.segments.length - 1]
    }

    /** Move the back segment to the front */
    moveSegment() {
        const seg = this.segments.pop()
        seg.position.z = this.frontSegment.position.z - this.segmentLength + this.overlap
        this.segments.unshift(seg)

        this.updateSegmentRefs()
    }

    /** Compute lane X positions */
    setLanes() {
        this.lanePositions = []
        const isOdd = this.laneCount % 2 !== 0
        const half = Math.floor(this.laneCount / 2)

        for (let i = 0; i < this.laneCount; i++) {
            const offset = isOdd ? (i - half) : (i - half + 0.5)
            this.lanePositions.push(offset * this.laneWidth)
        }
    }

    /** Per-frame update */
    update() {
        if (!this.player || !this.middleSegment) return

        const playerZ = this._getPlayerZ()
        const dir = (playerZ === this.startPlayerZ) ? -1 : Math.sign(playerZ - this.startPlayerZ)

        let shouldMove = false
        if (dir < 0) {
            shouldMove = playerZ < this.middleSegment.position.z - this.recycleMargin
        } else if (dir > 0) {
            shouldMove = playerZ > this.middleSegment.position.z + this.recycleMargin
        }

        if (shouldMove) {
            this.moveSegment()
            this.startPlayerZ = playerZ
        }
    }

    // === Helpers ===
    _getPlayerZ() {
        if (!this.player) return 0
        if (this.player.position?.z !== undefined) return this.player.position.z
        if (this.player.mesh?.position?.z !== undefined) return this.player.mesh.position.z
        return 0
    }

    _log(...args) {
        if (this.debug) console.log("[Path]", ...args)
    }
}
