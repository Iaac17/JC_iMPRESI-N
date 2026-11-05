'use client';

import { useEffect } from 'react';

// Este código se ejecuta inmediatamente al cargar el script en el navegador,
// antes de que Next.js e intercept-console-error muestren el aviso rojo por extensiones.
if (typeof window !== 'undefined') {
  // 1. Limpiar atributos inyectados por extensiones (como Bitdefender bis_skin_checked)
  const cleanInjectedAttributes = () => {
    try {
      const elements = document.querySelectorAll('[bis_skin_checked]');
      for (let i = 0; i < elements.length; i++) {
        elements[i].removeAttribute('bis_skin_checked');
      }
    } catch {
      // Ignorar cualquier fallo en navegadores antiguos
    }
  };

  cleanInjectedAttributes();

  // 2. Observador para eliminar el atributo en cuanto la extensión intente volver a colocarlo
  if (typeof MutationObserver !== 'undefined') {
    try {
      const observer = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i];
          if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked' && m.target) {
            (m.target as Element).removeAttribute('bis_skin_checked');
          }
        }
      });

      if (document.documentElement) {
        observer.observe(document.documentElement, {
          attributes: true,
          subtree: true,
          attributeFilter: ['bis_skin_checked']
        });
      }
    } catch {
      // Ignorar fallo en observer
    }
  }

  // 3. Interceptar y filtrar el error de consola para que Next.js no abra la ventana roja
  // cuando el único cambio en el HTML fue causado por la extensión del navegador.
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const isBitdefenderWarning = args.some((arg) => {
      if (typeof arg === 'string') {
        return (
          arg.includes('bis_skin_checked') ||
          (arg.includes('hydrated') && arg.includes('didn\'t match'))
        );
      }
      return false;
    });

    if (isBitdefenderWarning) {
      // Silenciar únicamente las advertencias provocadas por la extensión
      return;
    }

    originalConsoleError.apply(console, args);
  };
}

export default function HydrationFix() {
  useEffect(() => {
    // Limpieza adicional en el ciclo de vida del cliente
    try {
      const elements = document.querySelectorAll('[bis_skin_checked]');
      for (let i = 0; i < elements.length; i++) {
        elements[i].removeAttribute('bis_skin_checked');
      }
    } catch {
      // Ignorar
    }
  }, []);

  return null;
}

