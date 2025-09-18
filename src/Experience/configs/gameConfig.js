export default {
    // Lane configuration
    laneCount: 3,
    laneWidth: 2,
    
    // Player configuration
    player: {
        laneIndex: 1,
        baseSpeed: 0.04,
        speed: 0.09, // Initial speed equals baseSpeed
        maxSpeed: 0.28,
        acceleration: 0.000009,
        counterValue: 2
    },
    
    // Path configuration
    path: {
        segmentLength: 200,
        visibleSegments: 3,
        recycleMargin: 10,
        overlap: 0.05,
        debug: false,
        useBasicMaterialForDebug: true
    },
    
    // Number manager configuration
    numberManager: {
        gap: 30,
        initialCount: 5
    }
}