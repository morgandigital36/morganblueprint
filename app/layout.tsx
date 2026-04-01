import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

const manrope = Manrope({subsets:['latin'],variable:'--font-sans'});

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'AI Blueprint',
  description: 'AI-powered blueprint application',
  applicationName: 'AI Blueprint',
  appleWebApp: {
    capable: true,
    title: 'AI Blueprint',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("font-sans", manrope.variable)}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
