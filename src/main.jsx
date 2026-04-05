import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const config = window.__TORQUE_CONFIG__ || {};

const root = createRoot(document.getElementById('root'));
root.render(<App config={config} />);
