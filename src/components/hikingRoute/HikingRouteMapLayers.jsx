export const baseMap = {
    dragRotate: false,
    interactiveLayerIds: ['way-hitbox'],
    initialViewState: { longitude: 19.826587, latitude: 47.9263058, zoom: 12 },
    style: { width: '100%', height: '100%' },
    mapStyle: "https://tiles.openfreemap.org/styles/bright"
}

export const wayHitbox = {
    paint: {
        'line-color': 'transparent',
        'line-width': 20,
    }
} 

export const hiking = {
    paint: { 
        'line-color': '#D4813A', 
        'line-width': 2 
    },
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    }
}

export const visited = {
    paint: { 
        'line-color': '#FDFF24', 
        'line-width': 4, "line-opacity": 0.5 
    },
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    }
}

export const selected = {
    paint: { 
        'line-color': 'red',
        'line-width': 4 
    },
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    }
}

export const selectedLabel = {
    minzoom : 13,
    layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 200,
        'text-field': ['get', 'uid'],
        'text-size': { base: 1, stops: [[13, 10],[16, 10],[20, 22]]},
        'text-anchor': 'bottom', 'text-offset': [0, -0.8],
    },
    paint: {
        'text-color': '#4A2E1F',
        'text-halo-color': '#fff',
        'text-halo-width': 1,
    }
}

export const cut = {
    paint: {
        'line-color': 'blue',
        'line-width': 4 
    }
}

export const cutPoint = {
    minzoom: 13,
    paint: {
        'circle-radius': 4, 
        'circle-color': '#3A8D60'
    }
}

export const empty = {
    type: "FeatreCollection",
    features: []
}