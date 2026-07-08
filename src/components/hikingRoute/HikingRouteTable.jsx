import { useEffect, useState } from 'react';
import './HikingRouteTable.css'

export function HikingRouteTable({ selectedWays, setSelectedWaysView, onSetVisited, onSetVisitedDatas }) {

  const [clickedRows, setClickedRows] = useState([])
  
  useEffect(() => {
    const filtered = selectedWays.features.filter(f => f.properties.visited === false);

    setSelectedWaysView(filtered.length > 0 
      ? { ...selectedWays, features: filtered } 
      : null
    );
}, [selectedWays, setSelectedWaysView]);

  function handleRowClick(feature){
    console.log('click: ', feature)
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
              index={i}
              feature={f}
              onRowClick={handleRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapTableRow({ index, feature, onRowClick }) {
  const { id, properties } = feature;

  return (
    <tr 
      onClick={() => { onRowClick?.(feature);}}
      style={{ cursor: "pointer" }}
      className={properties.visited ? 'row-visited' : ''}
    >
      <td>{index} - {properties.uid}</td>
      <td>{properties.originalId ?? '-'}</td>
      <td>
        <span>{(properties.visitedData ?? []).join(', ')}</span>
      </td>
    </tr>
  );
}