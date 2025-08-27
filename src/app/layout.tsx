
import './globals.css';
import LayoutWrapper from './layout-wrapper';
import { metadata } from './metadata';

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className='h-screen flex flex-col bg-background text-foreground'>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
