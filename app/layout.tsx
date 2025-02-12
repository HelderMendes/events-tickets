import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import Header from '@/components/Header';
import SyncUserWithConvex from '@/components/SyncUserWithConvex';
import { Toaster } from '@/components/ui/toaster';
import { Lexend } from 'next/font/google';

const lexend = Lexend({
  weight: ['300', '600'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Event Tickets',
  description: 'Created with convex connect, clerk, strip in NextJs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={lexend.className}>
        <ConvexClientProvider>
          <ClerkProvider>
            <Header />
            <SyncUserWithConvex />
            {children}
            <Toaster />
          </ClerkProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
