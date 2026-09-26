import React from 'react';
import Grid from '@mui/material/Grid';
import CarCard from './CarCard';

// Lazy-loaded by App.jsx: this chunk (Grid, Card, Collapse…) is only fetched when the card view is opened.
export default function CardView({ rows }) {
  return (
    <Grid container spacing={2} direction="column">
      {rows.map(r => (
        <Grid key={r.id} size={12}>
          <CarCard car={r.car} />
        </Grid>
      ))}
    </Grid>
  );
}
