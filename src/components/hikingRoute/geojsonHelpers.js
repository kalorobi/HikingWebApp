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
        const prevDates = f.properties.visitedDates ?? [];
        const date = edit.payload.date;

        // duplikátum elkerülése: ha ugyanaz a dátum már szerepel, nem adjuk hozzá újra
        const nextDates = date && !prevDates.includes(date)
          ? [...prevDates, date]
          : prevDates;

        return {
          ...f,
          properties: {
            ...f.properties,
            visited: edit.payload.visited,
            visitedDates: nextDates
          }
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

  // featureId szerint csoportosítjuk az edit-eket, hogy tudjuk mi az adott feature
  // UTOLSÓ visited állapota, és mely dátumoknak KELL szerepelniük a tömbben
  const byFeatureEdits = new Map();
  for (const edit of edits) {
    if (edit.type !== 'SET_VISITED') continue;
    if (!byFeatureEdits.has(edit.featureId)) byFeatureEdits.set(edit.featureId, []);
    byFeatureEdits.get(edit.featureId).push(edit);
  }

  for (const [featureId, featureEdits] of byFeatureEdits) {
    const feature = byFeature.get(featureId);
    if (!feature) {
      problems.push(`Hiányzó feature: ${featureId}`);
      continue;
    }

    // az utolsó edit adja a végleges 'visited' állapotot
    const lastEdit = featureEdits[featureEdits.length - 1];
    if (feature.properties.visited !== lastEdit.payload.visited) {
      problems.push(`Eltérés visited mezőben: ${featureId}`);
    }

    // minden edit dátumának szerepelnie kell a visitedDates tömbben
    const expectedDates = [...new Set(featureEdits.map((e) => e.payload.date).filter(Boolean))];
    const actualDates = feature.properties.visitedDates ?? [];
    const missing = expectedDates.filter((d) => !actualDates.includes(d));
    if (missing.length > 0) {
      problems.push(`Hiányzó dátum(ok) a visitedDates mezőben: ${featureId} (${missing.join(', ')})`);
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