import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DiceDuel P2P - Web3 Gaming & Dice Duel Arena',
  description: 'Provably Fair P2P Dice Duels, CoinFlip, and Daily USDT Rewards on BNB Chain & Telegram Mini App.',
  keywords: ['web3 gaming', 'dice duel', 'crypto casino', 'provably fair', 'coinflip', 'telegram mini app', 'usdt game'],
  openGraph: {
    title: '🎲 DiceDuel P2P - Web3 Arena',
    description: 'Zar Düellosu, Yazı-Tura ve Günlük Ücretsiz USDT Çarkı. Telegram & Web3 uyumlu.',
    url: 'https://diceduel.fun',
    siteName: 'DiceDuel Gaming Hub',
    images: [
      {
        url: 'https://diceduel.fun/diceduel_telegram_cover.png',
        width: 640,
        height: 360,
        alt: 'DiceDuel Gaming Hub Banner',
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🎲 DiceDuel P2P - Web3 Gaming Arena',
    description: 'Provably Fair Dice Duels & CoinFlip. Win USDT instantly!',
    images: ['https://diceduel.fun/diceduel_telegram_cover.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
