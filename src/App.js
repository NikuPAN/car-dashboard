import React, { useState, useEffect, useMemo } from 'react';
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import TableRowsIcon from '@mui/icons-material/TableRows';
import GridViewIcon from '@mui/icons-material/GridView';
import loadCarData from './load_data';
import CarCard from './components/CarCard';

// Styled search bar
const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.action.selected, 0.15),
  '&:hover': { backgroundColor: alpha(theme.palette.action.selected, 0.25) },
  margin: theme.spacing(1, 0),
  width: '100%',
  height: 40
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

export default function App() {
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('light');
  const [view, setView] = useState('card');

  useEffect(() => { loadCarData().then(setCars).catch(console.error); }, []);
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const filtered = useMemo(
    () => cars.filter(c => c['車輛']?.toLowerCase().includes(search.toLowerCase())),
    [cars, search]
  );

  // Heights for AppBar and SearchBar
  const APPBAR_HEIGHT = 64;
  const SEARCHBAR_HEIGHT = 48;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Fixed AppBar at top, width 80% */}
      <AppBar position="fixed" color="primary" elevation={1}>
        <Toolbar sx={{ width: '75vw', mx: 'auto' }}>
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
      {/* Spacer for fixed AppBar */}
      <Toolbar />

      {/* Container for static SearchBar and scrollable content */}
      <Box sx={{ width: '75vw', mx: 'auto', mt: 2 }}>
        {/* Static search bar */}
        <SearchBar>
          <SearchIconWrapper><SearchIcon /></SearchIconWrapper>
          <StyledInput
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchBar>
        {/* Scrollable content area */}
        <Box
          sx={{
            height: `calc(100vh - ${APPBAR_HEIGHT}px - ${SEARCHBAR_HEIGHT}px - 32px)`,
            overflowY: 'auto'
          }}
        >
          {view === 'card' ? (
            <Grid container spacing={2} direction="column">
              {filtered.map((car, i) => (
                <Grid item key={i} xs={12}>
                  <CarCard car={car} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table size="large">
                <TableHead>
                  <TableRow>
                    {Object.keys(filtered[0] || {}).map(k => (
                      <TableCell key={k}><strong>{k}</strong></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((car, idx) => (
                    <TableRow key={idx} hover>
                      {Object.values(car).map((v, j) => (
                        <TableCell key={j}>{v}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
