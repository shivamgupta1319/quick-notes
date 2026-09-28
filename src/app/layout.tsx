import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { APP_NAME } from '@/config/nav';
import './globals.css';

export const metadata: Metadata = { title: { default: APP_NAME, template: `%s · ${APP_NAME}` } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
