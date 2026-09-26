// Small shared UI helpers: class colours, search highlighting, inline icons (no icon library).

// Class (組別) -> colour token in styles.css. Unknown classes fall back to a neutral tone.
const TONES = { 極限: 'extreme', 性能: 'performance', 運動: 'sport', 越野: 'offroad' };
export const tone = (cls) => TONES[cls] ?? 'other';

// Wraps every case-insensitive occurrence of q (already lower-cased) in <mark>.
export function highlight(text, q) {
  if (!q || !text) return text;
  const lower = text.toLowerCase();
  const out = [];
  let i = 0;
  let j;
  while ((j = lower.indexOf(q, i)) !== -1) {
    if (j > i) out.push(text.slice(i, j));
    out.push(<mark key={j}>{text.slice(j, j + q.length)}</mark>);
    i = j + q.length;
  }
  if (i === 0) return text;
  if (i < text.length) out.push(text.slice(i));
  return out;
}

const Icon = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);
export const SearchIcon = () => <Icon size={18}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>;
export const CloseIcon = () => <Icon size={16}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
export const SunIcon = () => <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
export const MoonIcon = () => <Icon><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></Icon>;
export const GridIcon = () => <Icon size={18}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Icon>;
export const TableIcon = () => <Icon size={18}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 10v10" /></Icon>;
export const ChatIcon = () => <Icon size={18}><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z" /></Icon>;
