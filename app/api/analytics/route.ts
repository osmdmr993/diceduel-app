import { NextResponse } from 'next/server';

interface ActiveSession {
  lastSeen: number;
  source: string;
}

let analyticsState = {
  totalVisitors: 0,
  returningVisitors: 0,
  visitorsWithWalletExtension: 0,
  visitorsWithoutWallet: 0,
  clickedConnectWalletCount: 0,
  uniqueWalletsConnected: new Set<string>(),
  clickedPlayGameCount: 0,
  totalGamesPlayed: 0,
  totalBetVolumeUSDT: 0.0,
  totalHouseEdgeUSDT: 0.0,
  totalFreeSpinsClaimed: 0,
  totalWelcomeBonusesClaimed: 0,
  trafficSources: {} as Record<string, number>,
  walletTypes: {
    metamask: 0,
    binance: 0,
    okx: 0,
    other: 0
  },
  activeSessions: {} as Record<string, ActiveSession>,
  lastUpdated: Date.now()
};

export async function GET() {
  try {
    const now = Date.now();
    const activeThreshold = now - 5 * 60 * 1000;
    const activeVisitorsCount = Object.values(analyticsState.activeSessions).filter(
      (s) => s.lastSeen > activeThreshold
    ).length;

    return NextResponse.json({
      success: true,
      totalVisitors: analyticsState.totalVisitors,
      activeVisitorsNow: Math.max(activeVisitorsCount, 1),
      returningVisitors: analyticsState.returningVisitors,
      visitorsWithWalletExtension: analyticsState.visitorsWithWalletExtension,
      visitorsWithoutWallet: analyticsState.visitorsWithoutWallet,
      clickedConnectWalletCount: analyticsState.clickedConnectWalletCount,
      connectedWalletsCount: analyticsState.uniqueWalletsConnected.size,
      clickedPlayGameCount: analyticsState.clickedPlayGameCount,
      totalGamesPlayed: analyticsState.totalGamesPlayed,
      totalBetVolumeUSDT: +analyticsState.totalBetVolumeUSDT.toFixed(2),
      totalHouseEdgeUSDT: +analyticsState.totalHouseEdgeUSDT.toFixed(2),
      totalFreeSpinsClaimed: analyticsState.totalFreeSpinsClaimed,
      totalWelcomeBonusesClaimed: analyticsState.totalWelcomeBonusesClaimed,
      trafficSources: analyticsState.trafficSources,
      walletTypes: analyticsState.walletTypes,
      lastUpdated: analyticsState.lastUpdated
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'İstatistikler okunamadı.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      eventType, 
      sessionId,
      isReturning, 
      hasWallet, 
      walletType,
      walletAddress, 
      betAmount, 
      source,
      clientSyncStats
    } = body;

    analyticsState.lastUpdated = Date.now();

    if (clientSyncStats) {
      if (clientSyncStats.totalVisitors > analyticsState.totalVisitors) {
        analyticsState.totalVisitors = clientSyncStats.totalVisitors;
      }
    }

    if (sessionId) {
      analyticsState.activeSessions[sessionId] = {
        lastSeen: Date.now(),
        source: source || 'Direct/Organik'
      };
    }

    if (eventType === 'VISIT') {
      analyticsState.totalVisitors += 1;
      if (isReturning) {
        analyticsState.returningVisitors += 1;
      }
      if (hasWallet) {
        analyticsState.visitorsWithWalletExtension += 1;
      } else {
        analyticsState.visitorsWithoutWallet += 1;
      }

      const cleanSource = source ? String(source).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 40) : 'Direct/Organik';
      analyticsState.trafficSources[cleanSource] = (analyticsState.trafficSources[cleanSource] || 0) + 1;

    } else if (eventType === 'CLICK_CONNECT_WALLET') {
      analyticsState.clickedConnectWalletCount += 1;
    } else if (eventType === 'CONNECT_WALLET') {
      if (walletAddress) {
        analyticsState.uniqueWalletsConnected.add(walletAddress.toLowerCase());
      }
      if (walletType && (walletType in analyticsState.walletTypes)) {
        analyticsState.walletTypes[walletType as keyof typeof analyticsState.walletTypes] += 1;
      }
    } else if (eventType === 'CLAIM_WELCOME_BONUS') {
      analyticsState.totalWelcomeBonusesClaimed += 1;
    } else if (eventType === 'CLICK_PLAY_GAME') {
      analyticsState.clickedPlayGameCount += 1;
    } else if (eventType === 'GAME_PLAY') {
      analyticsState.totalGamesPlayed += 1;
      const bet = parseFloat(betAmount || '0');
      if (!isNaN(bet) && bet > 0) {
        analyticsState.totalBetVolumeUSDT += bet;
        analyticsState.totalHouseEdgeUSDT += bet * 0.03;
      }
    } else if (eventType === 'SPIN_CLAIMED') {
      analyticsState.totalFreeSpinsClaimed += 1;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Olay kaydedilemedi.' }, { status: 500 });
  }
}
