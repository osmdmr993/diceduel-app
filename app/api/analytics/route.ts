import { NextResponse } from 'next/server';

// Sunucu tarafı derin kullanıcı davranış ve huni deposu
let analyticsData = {
  totalVisitors: 0,
  visitorsWithWalletExtension: 0,
  visitorsWithoutWallet: 0,
  clickedConnectWalletCount: 0,
  uniqueWalletsConnected: new Set<string>(),
  clickedPlayGameCount: 0,
  totalGamesPlayed: 0,
  totalBetVolumeUSDT: 0.0,
  totalHouseEdgeUSDT: 0.0,
  totalFreeSpinsClaimed: 0,
  lastUpdated: Date.now()
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      totalVisitors: analyticsData.totalVisitors,
      visitorsWithWalletExtension: analyticsData.visitorsWithWalletExtension,
      visitorsWithoutWallet: analyticsData.visitorsWithoutWallet,
      clickedConnectWalletCount: analyticsData.clickedConnectWalletCount,
      connectedWalletsCount: analyticsData.uniqueWalletsConnected.size,
      clickedPlayGameCount: analyticsData.clickedPlayGameCount,
      totalGamesPlayed: analyticsData.totalGamesPlayed,
      totalBetVolumeUSDT: +analyticsData.totalBetVolumeUSDT.toFixed(2),
      totalHouseEdgeUSDT: +analyticsData.totalHouseEdgeUSDT.toFixed(2),
      totalFreeSpinsClaimed: analyticsData.totalFreeSpinsClaimed,
      lastUpdated: analyticsData.lastUpdated
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'İstatistikler okunamadı.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, hasWallet, walletAddress, betAmount } = body;

    analyticsData.lastUpdated = Date.now();

    if (eventType === 'VISIT') {
      analyticsData.totalVisitors += 1;
      if (hasWallet) {
        analyticsData.visitorsWithWalletExtension += 1;
      } else {
        analyticsData.visitorsWithoutWallet += 1;
      }
    } else if (eventType === 'CLICK_CONNECT_WALLET') {
      analyticsData.clickedConnectWalletCount += 1;
    } else if (eventType === 'CONNECT_WALLET' && walletAddress) {
      analyticsData.uniqueWalletsConnected.add(walletAddress.toLowerCase());
    } else if (eventType === 'CLICK_PLAY_GAME') {
      analyticsData.clickedPlayGameCount += 1;
    } else if (eventType === 'GAME_PLAY') {
      analyticsData.totalGamesPlayed += 1;
      const bet = parseFloat(betAmount || '0');
      if (!isNaN(bet) && bet > 0) {
        analyticsData.totalBetVolumeUSDT += bet;
        analyticsData.totalHouseEdgeUSDT += bet * 0.03;
      }
    } else if (eventType === 'SPIN_CLAIMED') {
      analyticsData.totalFreeSpinsClaimed += 1;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Olay kaydedilemedi.' }, { status: 500 });
  }
}
