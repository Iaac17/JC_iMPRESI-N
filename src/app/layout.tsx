import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import HydrationFix from '@/components/HydrationFix';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jc-impresion.vercel.app'),
  title: {
    default: 'JC_IMPRESIÓN 3D | Modelos a Escala, Impresión 3D y Mantenimiento',
    template: '%s | JC_IMPRESIÓN 3D'
  },
  description:
    'Especialistas en modelos a escala para maquetas arquitectónicas y urbanas, impresión 3D con visor interactivo y Realidad Aumentada, planos técnicos, copias y mantenimiento de computadoras e impresoras. ¡Tú lo imaginas, nosotros lo creamos!',
  keywords: [
    'JC Impresión 3D',
    'modelos a escala',
    'maquetas arquitectónicas',
    'impresión 3D San Cristóbal de Las Casas',
    'impresión 3D Chiapas',
    'visor 3D',
    'realidad aumentada',
    'impresión de planos',
    'mantenimiento de computadoras',
    'mantenimiento de impresoras',
    'piezas 3D personalizadas'
  ],
  authors: [{ name: 'JC IMPRESIÓN 3D' }],
  creator: 'JC IMPRESIÓN 3D',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://jc-impresion.vercel.app',
    title: 'JC_IMPRESIÓN 3D | Modelos a Escala, Impresión 3D y Mantenimiento',
    description:
      'Fabricamos modelos a escala para maquetas, prototipos 3D, impresión de planos técnicos y servicio de mantenimiento de equipos. Visor 3D y Realidad Aumentada disponibles.',
    siteName: 'JC_IMPRESIÓN 3D',
    images: [
      {
        url: '/images/jc_brand.png',
        width: 800,
        height: 600,
        alt: 'JC_IMPRESIÓN 3D - ¡Tú lo imaginas, nosotros lo creamos!'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JC_IMPRESIÓN 3D | Modelos a Escala y Servicios',
    description: 'Modelos 3D para maquetas, impresión convencional de planos y mantenimiento de computadoras.',
    images: ['/images/jc_brand.png']
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/images/jc_brand.png', type: 'image/png' }
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'JC_IMPRESIÓN 3D',
    image: 'https://jc-impresion.vercel.app/images/jc_brand.png',
    telephone: '+52-967-371-8208',
    url: 'https://jc-impresion.vercel.app',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'San Cristóbal de Las Casas',
      addressRegion: 'Chiapas',
      addressCountry: 'MX'
    },
    priceRange: '$$',
    description:
      'Taller de impresión 3D, modelos a escala para maquetas arquitectónicas y urbanismo, impresión convencional de documentos y planos, y mantenimiento técnico especializado de computadoras e impresoras.',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '20:00'
      }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios JC Impresión 3D',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Modelos a Escala e Impresión 3D'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Impresión Convencional y Planos Técnicos'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mantenimiento de Computadoras e Impresoras'
          }
        }
      ]
    }
  };

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#111214] text-[#E4E4E7] font-sans selection:bg-[#E50920] selection:text-white" suppressHydrationWarning>
        <HydrationFix />
        {children}
      </body>
    </html>
  );
}
