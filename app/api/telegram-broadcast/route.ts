import { NextResponse } from 'next/server';

const LIVE_WINS_CHANNEL_ID = '@diceduel_live_wins';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winnerName, gameName, amount } = body;

    if (!winnerName || !gameName || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Eksik veya geçersiz veri gönderildi.' },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.error('HATA: TELEGRAM_BOT_TOKEN ortam değişkeni bulunamadı.');
      return NextResponse.json(
        { error: 'Sunucu yapılandırma hatası: Bot token eksik.' },
        { status: 500 }
      );
    }

    const text = `🎉 *CANLI KAZANÇ BİLDİRİMİ* 🚀\n\nOyuncu: *${winnerName}*\nOyun: *${gameName}*\nKazanç: *+${amount.toFixed(2)} USDT*\n\n🎲 Oyna & Kazan: https://diceduel.fun`;

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: LIVE_WINS_CHANNEL_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const data = await res.json();

    if (!data.ok) {
      console.error('Telegram API Yanıt Hatası:', data);
      return NextResponse.json(
        { error: 'Telegram mesajı gönderilemedi.', details: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Rotası Hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu.', details: error.message },
      { status: 500 }
    );
  }
}
