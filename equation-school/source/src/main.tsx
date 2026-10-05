import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './explore.css';
import './balance.css';
import './builder.css';
import './algebra-extras.css';
import './geometry.css';
import './function-graph.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
