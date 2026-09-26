import { memo } from 'react';
import { highlight, tone } from '../ui';

const cellText = (v) => (v.pair ? `${v.pair[0]} / ${v.pair[1]}` : v.text ?? '—');

const Row = memo(function Row({ car, hasUpdated, q }) {
  return (
    <tr>
      <th scope="row" className="col-name">{highlight(car.name, q)}</th>
      <td><span className={`badge tone-${tone(car.cls)}`}>{car.cls}</span></td>
      {car.values.flatMap((s, si) => s.map((v, fi) => (
        <td key={`${si}-${fi}`} className={v.text ? 'num' : 'num empty'}>{cellText(v)}</td>
      )))}
      {hasUpdated && <td className={car.updated ? 'date' : 'date empty'}>{car.updated ?? '—'}</td>}
    </tr>
  );
});

// Lazy-loaded by App.jsx. Mirrors the sheet's two-level header, so 改裝方向 gets one column per part.
export default function CarTable({ groups, sections, columns, q }) {
  const hasUpdated = Boolean(columns.updated);
  const colCount = 2 + sections.reduce((n, s) => n + s.fields.length, 0) + (hasUpdated ? 1 : 0);
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="車輛表格">
      <table className="data-table">
        <thead>
          <tr>
            <th rowSpan={2} className="col-name">{columns.name}</th>
            <th rowSpan={2}>{columns.cls}</th>
            {sections.map((s) => <th key={s.title} colSpan={s.fields.length} scope="colgroup" className="col-group">{s.title}</th>)}
            {hasUpdated && <th rowSpan={2}>{columns.updated}</th>}
          </tr>
          <tr>
            {sections.flatMap((s) => s.fields.map((f) => (
              <th key={f.col} className="col-sub">{f.label}{f.hint && <small>{f.hint.join('/')}</small>}</th>
            )))}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.key}>
            {g.label && (
              <tr className="group-row">
                <th colSpan={colCount} scope="rowgroup">
                  <span className={`dot tone-${tone(g.key)}`} />{g.label}<span className="count">{g.cars.length}</span>
                </th>
              </tr>
            )}
            {g.cars.map((car) => <Row key={car.id} car={car} hasUpdated={hasUpdated} q={q} />)}
          </tbody>
        ))}
      </table>
    </div>
  );
}
