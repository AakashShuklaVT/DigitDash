import { Text } from 'troika-three-text'
import * as THREE from 'three'

let instance = null

export default class TextHandler {
    constructor(scene) {
        if (instance) {
            return instance
        }
        instance = this
        this.scene = scene
        this.textObjects = []
    }

    /**
     * Create a new Troika Text and add it to the scene
     */
    createText(options = {}) {
        const {
            text = 'Default Text',
            fontSize = 1,           // base font size
            scaleFactor = 1,        // external responsive factor
            color = 0xffffff,
            maxWidth = 10,
            position = new THREE.Vector3(0, 0, 0),
            anchorX = 'center',
            anchorY = 'middle',
            font = '/fonts/happy-monkey.ttf',
            outlineColor = '#000000',
            outlineWidth = 0.04
        } = options

        const troikaText = new Text()
        troikaText.text = text
        troikaText.fontSize = fontSize * scaleFactor
        troikaText.color = color
        troikaText.maxWidth = maxWidth * scaleFactor
        troikaText.position.copy(position)
        troikaText.anchorX = anchorX
        troikaText.anchorY = anchorY
        troikaText.font = font

        // outline setup
        troikaText.outlineColor = outlineColor
        troikaText.outlineWidth = outlineWidth * scaleFactor

        this.scene.add(troikaText)
        troikaText.sync()

        // store defaults so updates keep them
        troikaText._defaults = { font, color, outlineColor, outlineWidth, fontSize, maxWidth }

        this.textObjects.push(troikaText)
        return troikaText
    }

    /**
     * Update an existing Troika Text but keep original font/outline/color unless overridden
     */
    updateText(troikaText, newText, options = {}) {
        if (!troikaText) return

        const { font, color, outlineColor, outlineWidth, fontSize, maxWidth } = {
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

        troikaText.sync()
    }
}
