import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// Self-hosted fonts (bundled into /assets): the CSP only allows same-origin
// styles and fonts, and visitors' browsers never call Google.
import '@fontsource-variable/inter';
import '@fontsource-variable/outfit';
import '@fontsource-variable/montserrat';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
