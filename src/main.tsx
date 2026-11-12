import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { OfflineProvider } from './context/OfflineContext';
import './index.css';

// Enregistrement du Service Worker pour le support PWA et la mise en cache locale
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[FACTUREAU] Service Worker opérationnel, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[FACTUREAU] Enregistrement SW non supporté ou bloqué:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <OfflineProvider>
      <App />
    </OfflineProvider>
  </ThemeProvider>
);
