import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean | string;
          'ar-modes'?: string;
          'camera-controls'?: boolean | string;
          'auto-rotate'?: boolean | string;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          exposure?: string;
          poster?: string;
          loading?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }

  namespace React.JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean | string;
          'ar-modes'?: string;
          'camera-controls'?: boolean | string;
          'auto-rotate'?: boolean | string;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          exposure?: string;
          poster?: string;
          loading?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}
