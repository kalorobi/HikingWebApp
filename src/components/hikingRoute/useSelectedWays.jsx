import { useMemo } from "react";
import { findWays, findRelations } from "./useSelectedWaysHelpers";

export function useSelectedWays(geojson, selectedFeatureId) {
    const selectedWays = useMemo(() => {
        if (!geojson || !selectedFeatureId) {
        return { type: "FeatureCollection", features: [] };
    }

    const selectedFeature = geojson.features.find(
        f => f.id === selectedFeatureId
    );

    if (!selectedFeature) {
        // nincs egyező feature (pl. törölt/vágott way stale id-vel) - érvényes,
        // üres FeatureCollection-t adunk vissza
        return { type: "FeatureCollection", features: [] };
    }

    return findWays(geojson, selectedFeature);
    }, [geojson, selectedFeatureId]);

    const selectedRelations = useMemo(() => {
    if (!geojson || !selectedFeatureId) {
        return null;
    }
    const match = geojson.features.find(f => f.id === selectedFeatureId);
    return findRelations(geojson, match);
}, [geojson, selectedFeatureId]);

    return { selectedWays, selectedRelations };
}