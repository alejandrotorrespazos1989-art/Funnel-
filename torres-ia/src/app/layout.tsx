import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TORRES&IA — Panel personal',
  description: 'Impresión 3D, finanzas, inversión y marca personal en un solo sitio.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
