import './globals.css'; // This ensures Tailwind styling maps correctly!
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SF Transit Monitor',
  description: 'Real-time Muni, BART, Caltrain, and GGT arrivals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}