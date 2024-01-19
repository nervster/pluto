import '@/app/ui/global.css'
import {inter} from '@/app/ui/fonts'
import { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: {
    template: '%s | Pluto Dashboard',
    default: 'Pluto Dashboard',
  },
  description: 'The Bottom-Up Budgeting App',
  metadataBase: new URL('https://github.com/nervster/pluto'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
