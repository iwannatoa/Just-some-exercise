import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'World Map Generator',
  description: 'Generate random fantasy world maps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <div className='min-h-screen bg-gray-50'>
          <header className='bg-white border-b'>
            <div className='container mx-auto px-4 py-4'>
              <div className='flex items-center justify-between'>
                <h1 className='text-xl font-bold'>World Map Generator</h1>
                <nav className='flex gap-4'>
                  <Link
                    href='/'
                    className='text-blue-600 font-medium'
                  >
                    Home
                  </Link>
                  <Link
                    href='/map'
                    className='text-gray-600 hover:text-blue-600'
                  >
                    Map
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className='bg-white border-t mt-8'>
            <div className='container mx-auto px-4 py-6 text-center text-gray-600'>
              <p>© {new Date().getFullYear()} World Map Generator</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
