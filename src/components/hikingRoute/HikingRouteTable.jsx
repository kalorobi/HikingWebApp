import { useEffect, useMemo, useState } from 'react';
import './HikingRouteTable.css'
import { Tooltip } from 'react-tooltip';
import { TouristSign, TOURIST_SIGNS } from '../../assets/ikons/TouristSign';
import logger from '../../utils/Logger';

const log = logger.scope('HikingRouteTable');

export default function HikingRouteTable({ selectedWays, selectedRelations, gpxTime, setSelectedWaysView, onSetVisited }) {

  const [viewIds, setViewIds] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Ha új a selectedWays (pl. más útvonalat választottunk), 
  // állítsuk vissza az alapértelmezett (nem látogatott) szettre
  useEffect(() => {
    const initial = new Set(
      selectedWays.features
        .filter(f => f.properties.visited === false)
        .map(f => f.id)
    );
    setViewIds(initial);
  }, [selectedWays]);

  // A viewIds alapján állítjuk elő a selectedWaysView-t
  useEffect(() => {
    const filtered = selectedWays.features.filter(f => viewIds.has(f.id));

    setSelectedWaysView(filtered.length > 0
      ? { ...selectedWays, features: filtered }
      : null
    );
  }, [selectedWays, viewIds, setSelectedWaysView]);

  useEffect(() => {
    if (!gpxTime) return;

    const year = gpxTime.getFullYear();
    const month = String(gpxTime.getMonth() + 1).padStart(2, '0');
    const day = String(gpxTime.getDate()).padStart(2, '0');

    setSelectedDate(`${year}-${month}-${day}`);
  }, [gpxTime]);

  function handleRowClick(feature) {
    const id = feature.id;

    setViewIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectClick() {
    const initial = new Set(
      selectedWays.features.map(f => f.id)
    );
    setViewIds(initial);   
  }

  return (
    <div>
      <div>
        {/* ide kell majd egy turistajel rajzoló */}
        {selectedRelations?.map((rel, i) => {
          const code = rel.properties?.jel;
          const sign = TOURIST_SIGNS[code];

          return (
            <span key={rel.id ?? i} style={{margin: "2px"} }>
              {!sign && (
                <span>
                  {code}
                </span>
              )}
              <TouristSign
                type={sign?.type}
                color={sign?.color}
                scale={0.15}
              />
            </span>
          );
        })}
      </div>
      <table>
        <thead>
          <tr>
            <th 
              onClick={handleSelectClick}
              data-tooltip-id="select-tooltip"
              data-tooltip-content="Minden kijelölés"
            >#</th>
            <th>Név</th>
            <th>Hossz:</th>
            <th>Dátumok</th>
          </tr>
        </thead>
        <tbody>
          {selectedWays.features.map((f, i) => (
            <MapTableRow
              key={f.id}
              isInView={viewIds.has(f.id)}
              index={i}
              feature={f}
              visited={f.properties.visited}
              onRowClick={handleRowClick}
            />
          ))}
        </tbody>
      </table>

      <Tooltip id="select-tooltip" className='hikingTooltip' place="bottom"/>

      <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
        <label htmlFor="dateSelect">Dátum:</label>
        <input
          className='dateInput'
          id="dateSelect"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button
          className='btn'
          onClick={() => onSetVisited(selectedDate)}
        >
          OK
        </button>
      </div>
    </div>
  );
}

function MapTableRow({ index, feature, isInView, visited, onRowClick }) {
  const { properties } = feature;

  return (
    <tr 
      onClick={() => { onRowClick?.(feature); }}
      style={{ cursor: "pointer" }}
      className={isInView ? properties.visited ? 'row-selectedVisited': 'row-selected' : ''}
    >
      <td className={visited ? 'row-visited' : ''}>{index}</td>
      <td>{properties.originalId ?? '-'}</td>
      <td>
        {((properties.length ?? properties.distance) / 1000).toLocaleString("hu-HU", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        })} km
      </td>
      <td>
          <span className="visited-dates">
            {(properties.visitedDates ?? []).slice(-1).join('\n')}
            {(properties.visitedDates ?? []).length > 1 &&
              ` +${(properties.visitedDates ?? []).length - 1}`}
          </span>
      </td>
    </tr>
  );
}