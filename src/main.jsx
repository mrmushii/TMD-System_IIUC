// src/main.jsx (or index.js)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter here
import App, { AuthProvider } from './App'; // Import App and AuthProvider
import './index.css'; // Your global CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* BrowserRouter wraps everything */}
      <AuthProvider> {/* AuthProvider wraps App */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);