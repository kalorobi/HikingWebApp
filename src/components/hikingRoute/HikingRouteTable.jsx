import './HikingRouteTable.css'

export function HikingRouteTable({ features, onSetVisited, onSetVisitedDatas }) {
  if(!features) return;
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Név</th>
            <th>Visited</th>
            <th>Dátumok</th>
          </tr>
        </thead>
        <tbody>
          {features.map((f, i) => (
            <MapTableRow
              key={f.id}
              index={i}
              feature={f}
              onSetVisited={onSetVisited}
              onSetVisitedDatas={onSetVisitedDatas}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapTableRow({ index, feature, onSetVisited, onSetVisitedDatas }) {
  const { id, properties } = feature;

  const handleVisitedChange = (e) => {
    onSetVisited(id, e.target.checked);
  };

  const handleAddDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const current = properties.visitedData ?? [];
    if (!current.includes(today)) {
      onSetVisitedDatas(id, [...current, today]);
    }
  };

  return (
    <tr>
        <td>{index}</td>
      <td>{properties.originalId ?? '-'}</td>
      <td>
        <input
          type="checkbox"
          checked={properties.visited ?? false}
          onChange={handleVisitedChange}
        />
      </td>
      <td>
        <span>{(properties.visitedData ?? []).join(', ')}</span>
      </td>
    </tr>
  );
}