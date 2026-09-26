import { memo } from 'react';
import { highlight, tone } from '../ui';

function Value({ v }) {
  if (!v.text) return <span className="empty">—</span>;
  if (v.pair) return <>{v.pair[0]}<span className="sep">/</span>{v.pair[1]}</>;
  return v.text;
}

// One car, fully visible (no expanding): the first sheet section (改裝方向) as compact cells,
// the remaining sections (懸吊, 車輪) side by side as label/value rows.
export default memo(function CarCard({ car, sections, q }) {
  const [tune, ...specs] = sections;
  return (
    <article className={`card tone-${tone(car.cls)}`}>
      <div className="card-head">
        <h3 className="card-name">{highlight(car.base, q)}</h3>
        <span className="badge">{car.cls}</span>
      </div>
      {(car.variant || car.updated) && (
        <p className="card-meta">
          {car.variant && <span className="tag">{highlight(car.variant, q)}</span>}
          {car.updated && <time dateTime={car.updated}>更新 {car.updated}</time>}
        </p>
      )}
      {tune && (
        <div className="tune">
          <h4 className="section-label">{tune.title}</h4>
          <div className="tune-cells">
            {tune.fields.map((f, i) => (
              <div className="cell" key={f.col}>
                <span className="cell-label">{f.label}</span>
                <span className="cell-value"><Value v={car.values[0][i]} /></span>
              </div>
            ))}
          </div>
        </div>
      )}
      {specs.length > 0 && (
        <div className="specs">
          {specs.map((s, si) => (
            <div className="spec" key={s.title}>
              <h4 className="section-label">{s.title}</h4>
              <dl>
                {s.fields.map((f, fi) => (
                  <div className="row" key={f.col}>
                    <dt>{f.label}{f.hint && <small>{f.hint.join('/')}</small>}</dt>
                    <dd><Value v={car.values[si + 1][fi]} /></dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </article>
  );
});
