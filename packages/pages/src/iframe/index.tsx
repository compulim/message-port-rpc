import { createRoot } from 'react-dom/client';
import React from 'react';

import App from './App';

window.addEventListener('message', ({ ports }) => {
  // TODO: Check origin.
  const mainElement = document.getElementsByTagName('main')[0];

  mainElement && createRoot(mainElement).render(<App port={ports[0]} />);
});
