import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { removeStaticHeadTags } from './components/SEO';
// Self-hosted fonts (bundled into /assets): the CSP only allows same-origin
// styles and fonts, and visitors' browsers never call Google.
import '@fontsource-variable/inter';
import '@fontsource-variable/outfit';
import '@fontsource-variable/montserrat';
import './index.css';

// Each page renders its own title, description, canonical and share tags.
removeStaticHeadTags();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
