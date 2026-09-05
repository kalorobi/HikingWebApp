import React, { useMemo, useState } from 'react';
import './GeojsonChecker.css';

const GeoJsonCompare = () => {
    const [geojsonA, setGeojsonA] = useState(null);
    const [geojsonB, setGeojsonB] = useState(null);

    const [fileNameA, setFileNameA] = useState('');
    const [fileNameB, setFileNameB] = useState('');

    const [error, setError] = useState('');

    // ---------------------------------------------------------
    // GeoJSON betöltése
    // ---------------------------------------------------------

    const handleFile = (file, side) => {
        if (!file) return;

        setError('');

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (
                    data.type !== 'FeatureCollection' ||
                    !Array.isArray(data.features)
                ) {
                    throw new Error('A fájl nem érvényes GeoJSON FeatureCollection.');
                }

                if (side === 'A') {
                    setGeojsonA(data);
                    setFileNameA(file.name);
                } else {
                    setGeojsonB(data);
                    setFileNameB(file.name);
                }
            } catch (err) {
                setError(`${file.name}: ${err.message}`);
            }
        };

        reader.onerror = () => {
            setError(`Nem sikerült beolvasni: ${file.name}`);
        };

        reader.readAsText(file);
    };

    const handleFileA = (event) => {
        handleFile(event.target.files[0], 'A');
    };

    const handleFileB = (event) => {
        handleFile(event.target.files[0], 'B');
    };

    // ---------------------------------------------------------
    // Tömb összehasonlítás
    // ---------------------------------------------------------

    const getArrayDiff = (arrayA = [], arrayB = []) => {
        const a = new Set(arrayA.map(String));
        const b = new Set(arrayB.map(String));

        return {
            onlyA: [...a].filter((value) => !b.has(value)),
            onlyB: [...b].filter((value) => !a.has(value)),
        };
    };

    // ---------------------------------------------------------
    // Feature összehasonlítás
    // ---------------------------------------------------------

    const compareFeatures = useMemo(() => {
        if (!geojsonA || !geojsonB) {
            return [];
        }

        const featuresA = geojsonA.features.filter(
            (feature) =>
                feature.geometry?.type === 'Polygon' ||
                feature.geometry?.type === 'LineString'
        );

        const featuresB = geojsonB.features.filter(
            (feature) =>
                feature.geometry?.type === 'Polygon' ||
                feature.geometry?.type === 'LineString'
        );

        /*
         * Külön Map a Polygon és LineString feature-öknek.
         *
         * A kulcs:
         * geometry.type + id
         */
        const mapA = new Map();
        const mapB = new Map();

        featuresA.forEach((feature) => {
            const key = `${feature.geometry.type}:${feature.id}`;
            mapA.set(key, feature);
        });

        featuresB.forEach((feature) => {
            const key = `${feature.geometry.type}:${feature.id}`;
            mapB.set(key, feature);
        });

        const keys = new Set([
            ...mapA.keys(),
            ...mapB.keys(),
        ]);

        const differences = [];

        keys.forEach((key) => {
            const featureA = mapA.get(key);
            const featureB = mapB.get(key);

            // ---------------------------------------------
            // Csak A-ban van
            // ---------------------------------------------

            if (featureA && !featureB) {
                differences.push({
                    key,
                    type: featureA.geometry.type,
                    id: featureA.id,
                    status: 'onlyA',
                    featureA,
                    featureB: null,
                    diff: null,
                });

                return;
            }

            // ---------------------------------------------
            // Csak B-ben van
            // ---------------------------------------------

            if (!featureA && featureB) {
                differences.push({
                    key,
                    type: featureB.geometry.type,
                    id: featureB.id,
                    status: 'onlyB',
                    featureA: null,
                    featureB,
                    diff: null,
                });

                return;
            }

            // ---------------------------------------------
            // Mindkettőben van
            // ---------------------------------------------

            const propertyName =
                featureA.geometry.type === 'Polygon'
                    ? 'ways'
                    : 'relations';

            const arrayA = featureA.properties?.[propertyName] ?? [];
            const arrayB = featureB.properties?.[propertyName] ?? [];

            const diff = getArrayDiff(arrayA, arrayB);

            const hasDifference =
                diff.onlyA.length > 0 ||
                diff.onlyB.length > 0;

            if (hasDifference) {
                differences.push({
                    key,
                    type: featureA.geometry.type,
                    id: featureA.id,
                    status: 'changed',
                    featureA,
                    featureB,
                    propertyName,
                    diff,
                });
            }
        });

        // Típus, majd ID szerint rendezzük
        differences.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type.localeCompare(b.type);
            }

            return String(a.id).localeCompare(
                String(b.id),
                undefined,
                { numeric: true }
            );
        });

        return differences;
    }, [geojsonA, geojsonB]);

    // ---------------------------------------------------------
    // Egy oldal tartalma
    // ---------------------------------------------------------

    const renderFeature = (item, side) => {
        const feature =
            side === 'A'
                ? item.featureA
                : item.featureB;

        // Nincs ezen az oldalon
        if (!feature) {
            return (
                <div className="geojson-compare-missing">
                    <span>—</span>
                    <span>Nincs ebben a GeoJSON-ban</span>
                </div>
            );
        }

        const propertyName =
            item.type === 'Polygon'
                ? 'ways'
                : 'relations';

        const values =
            feature.properties?.[propertyName] ?? [];

        // Csak ebben az oldalon szerepel
        if (
            (item.status === 'onlyA' && side === 'A') ||
            (item.status === 'onlyB' && side === 'B')
        ) {
            return (
                <div className="geojson-compare-feature only">
                    <div className="geojson-compare-values">
                        {values.length > 0
                            ? values.map((value) => (
                                <span
                                    key={String(value)}
                                    className="geojson-compare-value"
                                >
                                    {String(value)}
                                </span>
                            ))
                            : <span>üres</span>
                        }
                    </div>
                </div>
            );
        }

        // Megváltozott feature
        if (item.status === 'changed') {
            const differentValues =
                side === 'A'
                    ? item.diff.onlyA
                    : item.diff.onlyB;

            return (
                <div className="geojson-compare-feature changed">
                    <div className="geojson-compare-values">
                        {values.length > 0
                            ? values.map((value) => {
                                const isDifferent =
                                    differentValues.includes(
                                        String(value)
                                    );

                                return (
                                    <span
                                        key={String(value)}
                                        className={
                                            isDifferent
                                                ? 'geojson-compare-value different'
                                                : 'geojson-compare-value'
                                        }
                                    >
                                        {String(value)}
                                    </span>
                                );
                            })
                            : <span>üres</span>
                        }
                    </div>
                </div>
            );
        }

        return null;
    };

    // ---------------------------------------------------------
    // Render
    // ---------------------------------------------------------

    return (
        <div className="geojson-compare">

            <div className="geojson-compare-header">
                <h2>GeoJSON összehasonlítás</h2>

                <div className="geojson-compare-files">

                    <label className="geojson-compare-file">
                        <span>GeoJSON A</span>

                        <input
                            type="file"
                            accept=".geojson,.json,application/geo+json,application/json"
                            onChange={handleFileA}
                        />

                        {fileNameA && (
                            <small>{fileNameA}</small>
                        )}
                    </label>

                    <label className="geojson-compare-file">
                        <span>GeoJSON B</span>

                        <input
                            type="file"
                            accept=".geojson,.json,application/geo+json,application/json"
                            onChange={handleFileB}
                        />

                        {fileNameB && (
                            <small>{fileNameB}</small>
                        )}
                    </label>

                </div>
            </div>

            {error && (
                <div className="geojson-compare-error">
                    {error}
                </div>
            )}

            {!geojsonA || !geojsonB ? (
                <div className="geojson-compare-empty">
                    Töltsd be mindkét GeoJSON fájlt az összehasonlításhoz.
                </div>
            ) : (
                <>
                    <div className="geojson-compare-summary">
                        <span>
                            Összes eltérés: <strong>{compareFeatures.length}</strong>
                        </span>

                        <span>
                            Polygon:{' '}
                            <strong>
                                {
                                    compareFeatures.filter(
                                        (item) => item.type === 'Polygon'
                                    ).length
                                }
                            </strong>
                        </span>

                        <span>
                            LineString:{' '}
                            <strong>
                                {
                                    compareFeatures.filter(
                                        (item) => item.type === 'LineString'
                                    ).length
                                }
                                </strong>
                            </span>
                    </div>

                    {compareFeatures.length === 0 ? (
                        <div className="geojson-compare-success">
                            A két GeoJSON tartalma megegyezik.
                        </div>
                    ) : (
                        <div className="geojson-compare-table">

                            {/* FEJLÉC */}

                            <div className="geojson-compare-row header">
                                <div>
                                    GeoJSON A
                                </div>

                                <div>
                                    Eltérés
                                </div>

                                <div>
                                    GeoJSON B
                                </div>
                            </div>

                            {/* SOROK */}

                            {compareFeatures.map((item) => (
                                <div
                                    key={item.key}
                                    className={`geojson-compare-row ${item.status}`}
                                >

                                    {/* A */}

                                    <div className="geojson-compare-cell">

                                        <div className="geojson-compare-id">
                                            <strong>
                                                {item.type}
                                            </strong>

                                            <span>
                                                id: {String(item.id)}
                                            </span>
                                        </div>

                                        {renderFeature(item, 'A')}

                                    </div>

                                    {/* KÖZÉPSŐ DIFF */}

                                    <div className="geojson-compare-diff">

                                        {item.status === 'onlyA' && (
                                            <span className="diff-label only-a">
                                                Csak A-ban
                                            </span>
                                        )}

                                        {item.status === 'onlyB' && (
                                            <span className="diff-label only-b">
                                                Csak B-ben
                                            </span>
                                        )}

                                        {item.status === 'changed' && (
                                            <>
                                                {item.diff.onlyA.length > 0 && (
                                                    <div>
                                                        <strong>A-ban van:</strong>

                                                        <div className="diff-values">
                                                            {item.diff.onlyA.map(
                                                                (value) => (
                                                                    <span key={value}>
                                                                        {value}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.diff.onlyB.length > 0 && (
                                                    <div>
                                                        <strong>B-ben van:</strong>

                                                        <div className="diff-values">
                                                            {item.diff.onlyB.map(
                                                                (value) => (
                                                                    <span key={value}>
                                                                        {value}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                    </div>

                                    {/* B */}

                                    <div className="geojson-compare-cell">

                                        <div className="geojson-compare-id">
                                            <strong>
                                                {item.type}
                                            </strong>

                                            <span>
                                                id: {String(item.id)}
                                            </span>
                                        </div>

                                        {renderFeature(item, 'B')}

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}
                </>
            )}

        </div>
    );
};

export default GeoJsonCompare;