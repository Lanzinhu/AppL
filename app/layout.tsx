import './globals.css';
import './cards-3d.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasker',
  description: 'Demo Next + Postgres + Drizzle',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <svg width="0" height="0" aria-hidden="true">
          <defs>
            <filter id="filterEdges">
              <feConvolveMatrix
                kernelMatrix="0 1 0 1 -4 1 0 1 0"
                order="3 3"
                bias="0"
                divisor="1"
                preserveAlpha="true" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
