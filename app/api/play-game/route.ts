import { NextResponse } from 'next/server';
import crypto from 'crypto';

const MIN_BET = 0.5;
const MAX_BET = 20.0;
const HOUSE_EDGE = 0.03; // %3 ev komisyonu

const MINES_MULTIPLIERS = [1.14, 1.32, 1.55, 1.85, 2.25, 2.78, 3.50, 4.50, 6.00, 8.50];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameType, betAmount, choice, step } = body;

    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet < MIN_BET || bet > MAX_BET) {
      return NextResponse.json(
        { error: `Geçersiz bahis tutarı. (Min: ${MIN_BET}, Maks: ${MAX_BET} USDT)` },
        { status: 400 }
      );
    }

    const serverSeed = crypto.randomBytes(16).toString('hex');
    const randomBuffer = crypto.randomBytes(4);
    const randomFloat = randomBuffer.readUInt32BE(0) / 0xffffffff;

    // 1. ZAR DÜELLOSU MANTIĞI
    if (gameType === 'dice') {
      const isPlayerWin = randomFloat < 0.485; // %3 ev avantajı dengesi
      let p1 = isPlayerWin ? Math.floor(randomFloat * 40) + 60 : Math.floor(randomFloat * 50) + 1;
      let p2 = isPlayerWin ? Math.floor(randomFloat * 50) + 1 : Math.floor(randomFloat * 40) + 60;
      
      if (p1 === p2) p1 += 1; // Beraberlik engelleme

      const won = p1 > p2;
      const payout = won ? +(bet * 2 * (1 - HOUSE_EDGE)).toFixed(2) : 0;

      return NextResponse.json({
        success: true,
        gameType: 'dice',
        p1Score: p1,
        p2Score: p2,
        won,
        payout,
        serverSeed
      });
    }

    // 2. YAZI - TURA (COIN FLIP) MANTIĞI
    if (gameType === 'coinflip') {
      if (!choice || !['YAZI', 'TURA'].includes(choice)) {
        return NextResponse.json({ error: 'Geçersiz seçim.' }, { status: 400 });
      }

      const isPlayerWin = randomFloat < 0.485;
      const resultFace = isPlayerWin ? choice : (choice === 'YAZI' ? 'TURA' : 'YAZI');
      const won = resultFace === choice;
      const payout = won ? +(bet * 2 * (1 - HOUSE_EDGE)).toFixed(2) : 0;

      return NextResponse.json({
        success: true,
        gameType: 'coinflip',
        resultFace,
        won,
        payout,
        serverSeed
      });
    }

    // 3. RULET MANTIĞI
    if (gameType === 'roulette') {
      if (!choice || !['RED', 'BLACK', 'GREEN'].includes(choice)) {
        return NextResponse.json({ error: 'Geçersiz rulet rengi.' }, { status: 400 });
      }

      let resultColor: 'RED' | 'BLACK' | 'GREEN';
      const isPlayerWin = randomFloat < 0.485;

      if (choice === 'GREEN') {
        resultColor = randomFloat < 0.05 ? 'GREEN' : (randomFloat < 0.5 ? 'RED' : 'BLACK');
      } else {
        if (isPlayerWin) {
          resultColor = choice;
        } else {
          resultColor = randomFloat < 0.1 ? 'GREEN' : (choice === 'RED' ? 'BLACK' : 'RED');
        }
      }

      const won = resultColor === choice;
      const multiplier = choice === 'GREEN' ? 14 : 2;
      const payout = won ? +(bet * multiplier * (1 - HOUSE_EDGE)).toFixed(2) : 0;

      return NextResponse.json({
        success: true,
        gameType: 'roulette',
        resultColor,
        won,
        payout,
        serverSeed
      });
    }

    // 4. MAYIN TARLASI (MINES) ADIM MANTIĞI
    if (gameType === 'mines') {
      const currentStep = parseInt(step || '1', 10);
      const hitMineChance = currentStep <= 2 ? 0.15 : currentStep <= 4 ? 0.32 : 0.60;
      const isMineHit = randomFloat < hitMineChance;

      if (isMineHit) {
        return NextResponse.json({
          success: true,
          gameType: 'mines',
          exploded: true,
          won: false,
          payout: 0,
          serverSeed
        });
      }

      const multIdx = Math.min(currentStep - 1, MINES_MULTIPLIERS.length - 1);
      const currentMultiplier = MINES_MULTIPLIERS[multIdx];
      const payout = +(bet * currentMultiplier).toFixed(2);

      return NextResponse.json({
        success: true,
        gameType: 'mines',
        exploded: false,
        multiplier: currentMultiplier,
        currentStep,
        payout,
        serverSeed
      });
    }

    return NextResponse.json({ error: 'Geçersiz oyun türü.' }, { status: 400 });
  } catch (error: any) {
    console.error('Oyun API Hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
