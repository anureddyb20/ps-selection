import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vice Verse – Problem Statement Selection Portal',
  description: 'Official portal for participating teams to select and reserve problem statement codes for Vice Verse. Strictly 2 teams per PS code.',
  keywords: 'Vice Verse, Problem Statements, Engineering, Hackathon, Ideathon',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="font-sans antialiased">
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
          {children}
        </div>
      </body>
    </html>
  );
}
