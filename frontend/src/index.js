// Main entry point for the React application.
import React, { Suspense, startTransition } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import i18n for English and Korean translations
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
startTransition(() => {
  root.render(
    <React.StrictMode>
      <Suspense fallback={
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }} />
          <p style={{ marginLeft: '12px' }}>Loading application...</p>
        </div>
      }>
        <App />
      </Suspense>
    </React.StrictMode>
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();