export function injectIds(geojson) {
  return {
    ...geojson,
    features: geojson.features.map((f, index) => ({
      ...f,
      properties: {
        ...f.properties,
        uid: index,              // numerikus, vector tile-kompatibilis
        originalId: f.id ?? f.properties?.id  // eredeti string id megorzese
      }
    }))
  };
}

export function applyEdit(geojson, edit) {
  return {
    ...geojson,
    features: geojson.features.map((f) => {
      if (f.id !== edit.featureId) return f;

      if (edit.type === 'SET_VISITED') {
        return {
          ...f,
          properties: { ...f.properties, visited: edit.payload }
        };
      }

      if (edit.type === 'SET_VISITED_DATAS') {
        return {
          ...f,
          properties: { ...f.properties, visitedData: edit.payload }
        };
      }

      return f;
    })
  };
}

// Az összes elmentett lépést sorban lefuttatja egy geojson-on
export function applyAllEdits(geojson, edits) {
  return edits.reduce((acc, edit) => applyEdit(acc, edit), geojson);
}

// Ellenőrzi, hogy a végső geojson tartalmazza-e az összes módosítást
// (egyszerű konzisztencia-check: minden edit a logban tényleg megjelenik-e a feature-ben)
export function validateGeojsonAgainstEdits(geojson, edits) {
  const byFeature = new Map(geojson.features.map((f) => [f.id, f]));
  const problems = [];

  for (const edit of edits) {
    const feature = byFeature.get(edit.featureId);
    if (!feature) {
      problems.push(`Hiányzó feature: ${edit.featureId}`);
      continue;
    }
    if (edit.type === 'SET_VISITED' && feature.properties.visited !== edit.payload) {
      problems.push(`Eltérés visited mezőben: ${edit.featureId}`);
    }
    if (edit.type === 'SET_VISITED_DATAS') {
      const same = JSON.stringify(feature.properties.visitedData) === JSON.stringify(edit.payload);
      if (!same) problems.push(`Eltérés visitedData mezőben: ${edit.featureId}`);
    }
  }

  return { valid: problems.length === 0, problems };
}

export function isToday(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}