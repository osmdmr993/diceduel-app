import './globals.css';

export const metadata = {
  title: 'DiceDuel P2P - Web3 Zar Arenası',
  description: 'P2P Zar Düellosu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
