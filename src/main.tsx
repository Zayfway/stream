import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// Dismiss the branded splash once the app has mounted
const splash = document.getElementById('splash');
if (splash) {
  window.setTimeout(() => {
    splash.classList.add('hide');
    window.setTimeout(() => splash.remove(), 600);
  }, 450);
}
