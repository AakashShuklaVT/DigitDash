import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Path {
    /**
     * @param {Object} player - your player object. Supports either player.position.z or player.mesh.position.z
     * @param {Object} opts - optional configuration
     */
    constructor(player, {
        segmentLength = 200,
        visibleSegments = 3,
        laneCount = 3,
        laneWidth = 2,
        recycleMargin = 10, // how far past the middle the player must be before recycling
        overlap = 0.05,     // small overlap to hide seams between segments
        debug = false,
        useBasicMaterialForDebug = true
    } = {}) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.player = player

        // Config (validated)
        this.segmentLength = segmentLength
        this.visibleSegments = Math.max(2, visibleSegments)
        this.laneCount = laneCount
        this.laneWidth = laneWidth
        this.recycleMargin = recycleMargin
        this.overlap = overlap
        this.debug = debug
        this.useBasicMaterialForDebug = useBasicMaterialForDebug

        this.segments = []

        // store starting z to detect player's forward direction
        this.startPlayerZ = this._getPlayerZ()

        this.setLanes()
        this.setInitialGround()
    }

    _log(...args) {
        if (this.debug) console.log('[Path]', ...args)
    }

    // Helper: support both player.position.z and player.mesh.position.z
    _getPlayerZ() {
        if (!this.player) return 0
        if (this.player.position && typeof this.player.position.z === 'number') return this.player.position.z
        if (this.player.mesh && this.player.mesh.position && typeof this.player.mesh.position.z === 'number') return this.player.mesh.position.z
        return 0
    }

    setInitialGround() {
        // Spawn so segments are ordered front-to-back: [front (most negative z), ..., back (highest z)]
        // Example: visibleSegments=3, segmentLength=100 => [-200, -100, 0]
        for (let i = 0; i < this.visibleSegments; i++) {
            const z = -((this.visibleSegments - 1 - i) * this.segmentLength)
            this.spawnSegment(z)
        }

        this.updateSegmentRefs()
        this._log('Initial segments (z):', this.segments.map(s => s.position.z))
    }

    spawnSegment(zPos) {
        const geometry = new THREE.BoxGeometry(
            this.laneCount * this.laneWidth,
            0.2,
            this.segmentLength
        )

        // Align the geometry so front/back edges match expectations (optional)
        geometry.translate(0, 0, -this.segmentLength / 2)

        // Choose material: basic for debug so lighting doesn't hide things, otherwise standard
        const material = (this.debug && this.useBasicMaterialForDebug)
            ? new THREE.MeshBasicMaterial({ color: 0x888888 })
            : new THREE.MeshStandardMaterial({ color: 0xffffff })

        const ground = new THREE.Mesh(geometry, material)
        ground.receiveShadow = true
        ground.position.z = zPos

        this.scene.add(ground)
        this.segments.push(ground)
    }

    updateSegmentRefs() {
        // segments[0] = front-most (in front of player)
        this.frontSegment = this.segments[0]
        this.middleIndex = Math.floor(this.segments.length / 2)
        this.middleSegment = this.segments[this.middleIndex]
        this.backSegment = this.segments[this.segments.length - 1]
    }

    moveSegment() {
        // Remove the back-most segment (the one behind the player) and place it in front
        const segment = this.segments.pop()

        // Compute new front position (more negative if front is negative)
        const frontZ = this.frontSegment.position.z
        const newZ = frontZ - this.segmentLength + this.overlap

        segment.position.z = newZ

        // Insert it at front of array
        this.segments.unshift(segment)

        this.updateSegmentRefs()
        this._log('Moved segment. New order (z):', this.segments.map(s => s.position.z))
    }

    setLanes() {
        this.lanePositions = []
        const isOdd = this.laneCount % 2 !== 0
        const half = Math.floor(this.laneCount / 2)

        for (let i = 0; i < this.laneCount; i++) {
            let x
            if (isOdd) {
                x = (i - half) * this.laneWidth
            } else {
                x = (i - half + 0.5) * this.laneWidth
            }
            this.lanePositions.push(x)
        }
    }

    update() {
        if (!this.player) return
        if (this.segments.length === 0) return
        if (!this.middleSegment) return

        const playerZ = this._getPlayerZ()

        // Determine player forward direction from initial movement
        // If startPlayerZ === playerZ (not moved yet), default to -1 (negative Z forward).
        const dir = (playerZ === this.startPlayerZ) ? -1 : Math.sign(playerZ - this.startPlayerZ)

        // Decide threshold depending on direction
        let shouldMove = false
        if (dir < 0) {
            // forward is negative Z
            const threshold = this.middleSegment.position.z - this.recycleMargin
            shouldMove = (playerZ < threshold)
        } else if (dir > 0) {
            // forward is positive Z
            const threshold = this.middleSegment.position.z + this.recycleMargin
            shouldMove = (playerZ > threshold)
        }

        if (shouldMove) {
            // Move one segment forward
            this.moveSegment()
            // Update startPlayerZ so we require further movement before moving again
            this.startPlayerZ = playerZ
        }
    }
}
