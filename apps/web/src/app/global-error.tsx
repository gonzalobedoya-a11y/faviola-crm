'use client';

import type { ReactNode } from 'react';

export default function GlobalError({ reset }: { error: Error; reset: () => void }): ReactNode {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Error crítico</h2>
          <p>La aplicación encontró un problema.</p>
          <button type="button" onClick={reset}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
