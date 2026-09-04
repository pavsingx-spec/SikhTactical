import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Sikh Tactical | Event Registration',
  description: 'Step beyond the ordinary. Register for a Sikh Tactical outdoor challenge and receive your QR arrival pass.',
  openGraph: {
    title: 'Sikh Tactical | Event Registration',
    description: 'Step beyond the ordinary. Register for a Sikh Tactical outdoor challenge.',
    images: [{ url: `${siteUrl}/og.png`, width: 1672, height: 941 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sikh Tactical | Event Registration',
    description: 'Step beyond the ordinary. Register for a Sikh Tactical outdoor challenge.',
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
