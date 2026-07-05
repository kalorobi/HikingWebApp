import { useMemo } from "react";
import { findWays } from "./useSelectedWaysHelpers";

export function useSelectedWays(geojson, selectedFeatureId) {
    const selectedWays = useMemo(() => {
        if (!geojson || !selectedFeatureId) {
            return { type: "FeatureCollection", features: [] };
        }

        const selectedFeature = geojson.features.filter(
            f => f.properties.uid === selectedFeatureId
        );
        let selected = selectedFeature;
        if(selectedFeature.length > 0){

            selected = findWays(geojson, selectedFeature[0]);

        }


        return selected;
    }, [geojson, selectedFeatureId]);

    return { selectedWays };
}