import { useMemo } from "react";
import { findWays } from "./useSelectedWaysHelpers";

export function useSelectedWays(geojson, selectedFeatureId) {
    const selectedWays = useMemo(() => {
        if (!geojson || !selectedFeatureId) {
            return { type: "FeatureCollection", features: [] };
        }

        // selectedFeatureId a valódi (OSM eredetű) feature.id, NEM a properties.uid
        // (utóbbi csak a MapLibre kattintáskezeléshez van injektálva)
        const selectedFeature = geojson.features.filter(
            f => f.id === selectedFeatureId
        );

        if (selectedFeature.length === 0) {
            // nincs egyező feature (pl. törölt/vágott way stale id-vel) - érvényes,
            // üres FeatureCollection-t adunk vissza, NEM a csupasz filter-tömböt
            return { type: "FeatureCollection", features: [] };
        }

        return findWays(geojson, selectedFeature[0]);
    }, [geojson, selectedFeatureId]);

    return { selectedWays };
}