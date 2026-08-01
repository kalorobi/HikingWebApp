import { useEffect, useMemo, useState } from 'react';
import './HikingRouteTable.css'
import logger from '../../utils/Logger';

const log = logger.scope('HikingRouteTable');

export function HikingRouteTable({ selectedWays, setSelectedWaysView, onSetVisited, onSetVisitedDatas }) {

  const [viewIds, setViewIds] = useState(new Set());

  // Ha új a selectedWays (pl. más útvonalat választottunk), 
  // állítsuk vissza az alapértelmezett (nem látogatott) szettre
  useEffect(() => {
    const initial = new Set(
      selectedWays.features
        .filter(f => f.properties.visited === false)
        .map(f => f.properties.uid)
    );
    setViewIds(initial);
  }, [selectedWays]);

  // A viewIds alapján állítjuk elő a selectedWaysView-t
  useEffect(() => {
    const filtered = selectedWays.features.filter(f => viewIds.has(f.properties.uid));

    setSelectedWaysView(filtered.length > 0
      ? { ...selectedWays, features: filtered }
      : null
    );
  }, [selectedWays, viewIds, setSelectedWaysView]);

  function handleRowClick(feature) {
    const uid = feature.properties.uid;
    log.debug('click: ', feature.id);
    log.debug('relations', feature.properties.relations)

    //onSetVisited(feature.id, !feature.properties.visited);

    setViewIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Név</th>
            <th>Dátumok</th>
          </tr>
        </thead>
        <tbody>
          {selectedWays.features.map((f, i) => (
            <MapTableRow
              key={f.id}
              isInView={viewIds.has(f.properties.uid)}
              index={i}
              feature={f}
              visited={f.properties.visited}
              onRowClick={handleRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapTableRow({ index, feature, isInView, visited, onRowClick }) {
  const { properties } = feature;

  return (
    <tr 
      onClick={() => { onRowClick?.(feature); }}
      style={{ cursor: "pointer" }}
      className={isInView ? 'row-selected' : ''}
    >
      <td className={visited ? 'row-visited' : ''}>{index}</td>
      <td>{properties.originalId ?? '-'}</td>
      <td>
        <span className="visited-dates">
          {(properties.visitedDates ?? []).join('\n')}
        </span>
      </td>
    </tr>
  );
}