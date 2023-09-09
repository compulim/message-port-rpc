import { createRoot } from 'react-dom/client';
import React from 'react';

import App from './App';

window.addEventListener('message', ({ ports }) => {
  const [firstPort, secondPort] = ports;

  if (!firstPort || !secondPort) {
    throw new Error('Handshake message must contains at least 2 ports.');
  }

  // TODO: Check origin.
  const mainElement = document.getElementsByTagName('main')[0];

  mainElement && createRoot(mainElement).render(<App ports={Object.freeze([firstPort, secondPort] as const)} />);
});
