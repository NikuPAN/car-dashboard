import { useState, useEffect, useMemo, useDeferredValue, useRef, useCallback, lazy, Suspense } from 'react';
import loadCarData from './load_data';
import CarCard from './components/CarCard';
import { tone, SearchIcon, CloseIcon, SunIcon, MoonIcon, GridIcon, TableIcon, ChatIcon } from './ui';
import logo from './assets/logo.webp';

// The table is the secondary view: its code is only downloaded when someone switches to it.
const CarTable = lazy(() => import('./components/CarTable'));

// Per-viewer preferences. Storage can be unavailable (private mode, blocked site data), so every access is guarded.
const readPref = (key, allowed, fallback) => {
  try { const v = localStorage.getItem(key); return allowed.includes(v) ? v : fallback; } catch { return fallback; }
};
const writePref = (key, value) => { try { localStorage.setItem(key, value); } catch { /* not persisted */ } };

const SORTS = [
  { key: 'sheet', label: '預設排序' },
  { key: 'name', label: '名稱 A–Z' },
  { key: 'updated', label: '最近更新' },
];

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [cls, setCls] = useState('all');
  const [sort, setSort] = useState('sheet');
  const [view, setView] = useState(() => readPref('cd-view', ['cards', 'table'], 'cards'));
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'));
  const searchRef = useRef(null);
  const topbarRef = useRef(null);

  const load = useCallback(() => {
    setError(null);
    loadCarData().then(setData).catch((e) => { console.error(e); setError(e); });
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f6f8' : '#0e1014');
    writePref('cd-theme', theme);
  }, [theme]);
  useEffect(() => { writePref('cd-view', view); }, [view]);

  // The sticky header's height feeds the table's scroll area (--topbar-h), since the toolbar wraps on narrow screens.
  useEffect(() => {
    const el = topbarRef.current;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--topbar-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // "/" jumps to the search box, Escape clears it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Typing stays responsive: filtering runs on the deferred value while the input updates immediately.
  const q = useDeferredValue(search.trim().toLowerCase());
  const matching = useMemo(() => (data ? data.cars.filter((c) => !q || c.search.includes(q)) : []), [data, q]);
  const counts = useMemo(() => {
    const m = new Map();
    for (const c of matching) m.set(c.cls, (m.get(c.cls) ?? 0) + 1);
    return m;
  }, [matching]);
  const visible = useMemo(() => {
    const list = cls === 'all' ? matching : matching.filter((c) => c.cls === cls);
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' }));
    if (sort === 'updated') return [...list].sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? '') || a.id - b.id);
    return list;
  }, [matching, cls, sort]);
  // Sheet order keeps the sheet's class sections; the other sorts are one flat list.
  const groups = useMemo(() => {
    if (!data) return [];
    if (sort !== 'sheet') return [{ key: 'all', label: null, cars: visible }];
    return data.classes.map((c) => ({ ...c, cars: visible.filter((car) => car.cls === c.key) })).filter((g) => g.cars.length);
  }, [data, visible, sort]);

  const clearSearch = () => { setSearch(''); searchRef.current?.focus(); };

  return (
    <>
      <div className="topbar" ref={topbarRef}>
        <header className="appbar container">
          <img className="logo" src={logo} width="32" height="32" alt="" />
          <h1 className="title">車輛底盤調教 <span className="by">by 鹹魚老默</span></h1>
          <div className="spacer" />
          {data?.meta.link && (
            <a className="icon-btn with-label" href={data.meta.link} target="_blank" rel="noopener noreferrer">
              <ChatIcon /><span>Discord</span>
            </a>
          )}
          <button type="button" className="icon-btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? '切換至淺色模式' : '切換至深色模式'} title={theme === 'dark' ? '淺色模式' : '深色模式'}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <div className="toolbar container">
          <div className="search">
            <SearchIcon />
            <input ref={searchRef} type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearch(''); }}
              placeholder="搜尋車輛或組別…" aria-label="搜尋車輛或組別" autoComplete="off" spellCheck="false" />
            {search ? (
              <button type="button" className="clear" onClick={clearSearch} aria-label="清除搜尋"><CloseIcon /></button>
            ) : <kbd aria-hidden="true">/</kbd>}
          </div>

          <div className="filters">
            <div className="chips" role="group" aria-label="組別">
              <button type="button" className="chip" aria-pressed={cls === 'all'} onClick={() => setCls('all')}>
                全部<span className="count">{matching.length}</span>
              </button>
              {data?.classes.map((c) => (
                <button key={c.key} type="button" className={`chip tone-${tone(c.key)}`} aria-pressed={cls === c.key}
                  onClick={() => setCls(cls === c.key ? 'all' : c.key)}>
                  <span className="dot" />{c.key}<span className="count">{counts.get(c.key) ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="controls">
              <label className="select">
                <span className="sr-only">排序</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
              <div className="segmented" role="group" aria-label="顯示方式">
                <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')} title="卡片">
                  <GridIcon /><span>卡片</span>
                </button>
                <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')} title="表格">
                  <TableIcon /><span>表格</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container main">
        {error ? (
          <div className="state">
            <p>無法載入資料（Google Sheet）。</p>
            <button type="button" className="btn" onClick={load}>重試</button>
          </div>
        ) : !data ? (
          <p className="state" aria-live="polite">載入資料中…</p>
        ) : visible.length === 0 ? (
          <div className="state">
            <p>找不到符合「{search.trim()}」的車輛{cls !== 'all' && `（${cls}組）`}。</p>
            <button type="button" className="btn" onClick={() => { setSearch(''); setCls('all'); }}>清除搜尋及篩選</button>
          </div>
        ) : (
          <>
            <p className="result-count" aria-live="polite">顯示 {visible.length} / {data.cars.length} 部車</p>
            {view === 'cards' ? groups.map((g) => (
              <section key={g.key} className="group" aria-label={g.label ?? '全部車輛'}>
                {g.label && (
                  <h2 className={`group-title tone-${tone(g.key)}`}>
                    <span className="dot" />{g.label}<span className="count">{g.cars.length}</span>
                  </h2>
                )}
                <div className="card-grid">
                  {g.cars.map((car) => <CarCard key={car.id} car={car} sections={data.sections} q={q} />)}
                </div>
              </section>
            )) : (
              <Suspense fallback={<p className="state">載入表格…</p>}>
                <CarTable groups={groups} sections={data.sections} columns={data.columns} q={q} />
              </Suspense>
            )}
          </>
        )}
      </main>

      <footer className="container footer">
        資料來源：Google Sheet{data?.meta.sheetUpdated && `・更新於 ${data.meta.sheetUpdated}`}
      </footer>
    </>
  );
}
