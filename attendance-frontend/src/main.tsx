import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for PWA offline capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ PWA ServiceWorker successfully registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('⚠️ ServiceWorker registration error:', error);
      });
  });
}
