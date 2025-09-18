import { Text } from 'troika-three-text'
import * as THREE from 'three'

let instance = null

export default class TextHandler {
    constructor(scene) {
        if (instance) return instance
        instance = this
        this.scene = scene
        this.textObjects = []
    }

    /**
     * Convert a rotation object in degrees to THREE.Euler in radians
     */
    _parseRotation(rotation = { x: 0, y: 0, z: 0 }) {
        return new THREE.Euler(
            THREE.MathUtils.degToRad(rotation.x || 0),
            THREE.MathUtils.degToRad(rotation.y || 0),
            THREE.MathUtils.degToRad(rotation.z || 0)
        )
    }

    /**
     * Convert position object {x,y,z} to THREE.Vector3
     */
    _parsePosition(position = { x: 0, y: 0, z: 0 }) {
        if (position instanceof THREE.Vector3) return position
        return new THREE.Vector3(position.x || 0, position.y || 0, position.z || 0)
    }

    /**
     * Create a new Troika Text, add it to the scene, allow rotation and high-speed clarity
     */
    createText(options = {}) {
        const {
            text = 'Default Text',
            fontSize = 1,
            scaleFactor = 1,
            color = 0xffffff,
            maxWidth = 10,
            position = { x: 0, y: 0, z: 0 },
            rotation = { x: 0, y: 0, z: 0 }, // degrees
            anchorX = 'center',
            anchorY = 'middle',
            font = '/fonts/happy-monkey.ttf',
            outlineColor = '#000000',
            outlineWidth = 0.04,
            resolution = 1024 // default high resolution
        } = options

        const troikaText = new Text()
        troikaText.text = text
        troikaText.fontSize = fontSize * scaleFactor
        troikaText.color = color
        troikaText.maxWidth = maxWidth * scaleFactor
        troikaText.position.copy(this._parsePosition(position))
        troikaText.rotation.copy(this._parseRotation(rotation))
        troikaText.anchorX = anchorX
        troikaText.anchorY = anchorY
        troikaText.font = font

        // outline setup
        troikaText.outlineColor = outlineColor
        troikaText.outlineWidth = outlineWidth * scaleFactor

        // high-speed clarity
        troikaText.resolution = resolution

        this.scene.add(troikaText)
        troikaText.sync()

        // store defaults for future updates
        troikaText._defaults = { font, color, outlineColor, outlineWidth, fontSize, maxWidth, rotation, resolution }

        this.textObjects.push(troikaText)
        return troikaText
    }

    /**
     * Update an existing Troika Text, including rotation and resolution
     */
    updateText(troikaText, newText, options = {}) {
        if (!troikaText) return

        const { font, color, outlineColor, outlineWidth, fontSize, maxWidth, rotation, resolution } = {
            ...troikaText._defaults,
            ...options
        }

        troikaText.text = newText
        troikaText.font = font
        troikaText.color = color
        troikaText.outlineColor = outlineColor
        troikaText.outlineWidth = outlineWidth
        troikaText.fontSize = fontSize
        troikaText.maxWidth = maxWidth
        troikaText.rotation.copy(this._parseRotation(rotation))
        troikaText.resolution = resolution

        troikaText.sync()
    }
}
