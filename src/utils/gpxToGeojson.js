export function gpxToGeoJSON(gpxText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(
        gpxText,
        "application/xml"
    );

    if (xml.querySelector("parsererror")) {
        throw new Error("Hibás GPX fájl");
    }

    const features = [];

    xml.querySelectorAll("wpt").forEach((point) => {
        features.push({
            type: "Feature",
            properties: {
                name:
                point.querySelector("name")?.textContent ?? ""
            },
            geometry: {
                type: "Point",
                coordinates: [
                    Number(point.getAttribute("lon")),
                    Number(point.getAttribute("lat"))
                ]
            }
        });
    });

    xml.querySelectorAll("trk").forEach((track) => {

    const coordinates = [];

    track.querySelectorAll("trkpt")
        .forEach((point) => {

        coordinates.push([
            Number(point.getAttribute("lon")),
            Number(point.getAttribute("lat"))
        ]);

    });


    if (coordinates.length > 1) {
        features.push({
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates
            }
        });
    }

    });


    return {
        type: "FeatureCollection",
        features
    };
}