import React, { useState, useEffect, useMemo, useDeferredValue, memo, lazy, Suspense } from 'react';
import {
  createTheme, ThemeProvider, CssBaseline,
  AppBar, Toolbar, Typography, IconButton,
  Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import TableRowsIcon from '@mui/icons-material/TableRows';
import GridViewIcon from '@mui/icons-material/GridView';
import loadCarData from './load_data';
import logo from './assets/logo.webp';

// The card view is only downloaded when someone switches to it.
const CardView = lazy(() => import('./components/CardView'));

// Styled search bar
const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.action.selected, 0.15),
  '&:hover': { backgroundColor: alpha(theme.palette.action.selected, 0.25) },
  margin: theme.spacing(1, 0),
  width: '100%',
  height: 48
}));
const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0,2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));
const StyledInput = styled('input')(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(1,1,1,0),
  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'inherit',
  height: '100%'
}));

// Memoised so filtering only mounts/unmounts the rows that changed (rows are keyed by their position in the sheet).
const CarRow = memo(function CarRow({ car }) {
  return (
    <TableRow hover>
      {Object.values(car).map((val, j) => (
        <TableCell key={j} sx={{ whiteSpace: 'nowrap' }}>
          {val}
        </TableCell>
      ))}
    </TableRow>
  );
});

export default function App() {
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('dark'); // default dark mode
  const [view, setView] = useState('table');

  useEffect(() => { loadCarData().then(setCars).catch(console.error); }, []);
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  // Lower-case each name once; `id` is the row's position in the sheet, a stable React key.
  const indexed = useMemo(
    () => cars.map((car, id) => ({ id, car, name: typeof car['車輛'] === 'string' ? car['車輛'].toLowerCase() : null })),
    [cars]
  );
  // Typing stays responsive: the list re-filters with the deferred value while the input updates immediately.
  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase();
    return indexed.filter(r => r.name !== null && r.name.includes(q));
  }, [indexed, deferredSearch]);

  // Layout constants
  const APPBAR_HEIGHT = 64;
  const SEARCHBAR_HEIGHT = 48;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Fixed AppBar */}
      <AppBar position="fixed" color="primary" elevation={1}>
        <Toolbar sx={{ width: { xs: '100%', lg: '80vw' }, mx: 'auto' }}>
        <Box component="img" src={logo} alt="Logo" width={32} height={32} sx={{ width: 32, height: 32, mr: 1 }} />
          <Typography variant="h6" noWrap>
            車輛底盤調教 by 鹹魚老默
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={() => setView(v => v === 'card' ? 'table' : 'card')}>
            {view === 'card' ? <TableRowsIcon /> : <GridViewIcon />}
          </IconButton>
          <IconButton color="inherit" onClick={() => setMode(m => m === 'light' ? 'dark' : 'light')}>
            {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Offset */}

      {/* Main Container */}
      <Box sx={{ width: { xs: '100%', lg: '80vw' }, mx: 'auto', mt: 2, mb: 2 }}>
        {/* Static Search Bar */}
        <SearchBar>
          <SearchIconWrapper><SearchIcon /></SearchIconWrapper>
          <StyledInput placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </SearchBar>

        {/* Scrollable Content */}
        <Box sx={{
          height: `calc(100vh - ${APPBAR_HEIGHT}px - ${SEARCHBAR_HEIGHT}px - 32px)`,
          overflowY: 'auto'
        }}>
          {view === 'card' ? (
            <Suspense fallback={null}>
              <CardView rows={filtered} />
            </Suspense>
          ) : (
            <TableContainer component={Paper}>
              <Table aria-label="car table">
                <TableHead>
                  <TableRow>
                    {Object.keys(filtered[0]?.car || {}).map(key => (
                      <TableCell
                        key={key}
                        sx={{ minWidth: 120, whiteSpace: 'nowrap' }}
                      >
                        <strong>{key}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map(r => <CarRow key={r.id} car={r.car} />)}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
