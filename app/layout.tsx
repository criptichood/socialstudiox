import React from 'react';
import type { Metadata } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Social Studio X - Brand & Post Generator',
  description: 'Creative visual studio and brand layout workspace generator.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300 antialiased">
        {children}
      </body>
    </html>
  );
}
