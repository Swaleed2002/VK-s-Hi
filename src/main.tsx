import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { ThemeProvider } from './components/ThemeProvider.tsx';

defineCustomElements(window);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
