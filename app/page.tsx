'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ethers } from 'ethers';
import { 
  Wallet, Swords, Plus, Flame, ShieldCheck, Trophy, RotateCcw, Sparkles, 
  ArrowDownCircle, ArrowUpCircle, X, CheckCircle2, LogOut, Coins, FileCode2, 
  Share2, Copy, History, Gift, CircleDot, Dices, Send, ReceiptText, Download, 
  Printer, MessageCircle, Info, ChevronDown, Loader2, Clock, Lock, Unlock, 
  ExternalLink, Volume2, VolumeX, Crown, AlertTriangle, Medal, Bomb, Play, Timer, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// AYARLAR
const TELEGRAM_BOT_TOKEN = '8840072261:AAGPbmSnlpXjcFIzgUCOAGXDzKc38629jwM';
const ADMIN_TELEGRAM_CHAT_ID = '5821245544';
const CHANNEL_USERNAME = '@DiceDuel_Live'; // Kanal ismin buraya
const BSC_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const CONTRACT_ADDRESS = '0xC9c586A92465C7254C3e19FebAAeD9D5c61f974f';
const BSC_CHAIN_ID = 56;
const BSC_CHAIN_ID_HEX = '0x38';

const BOT_NAMES = ['KriptoPasa_34', 'AnadoluKaplani', 'Bozkurt_06', 'ZarUstasi', 'Dede_USDT', 'PiyasaAvcisi'];

const TRANSLATIONS: Record<string, any> = {
  tr: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'BSC Mainnet Canlı',
    txBtn: 'İşlemler (PDF/CSV)',
    dailySpin: 'Günlük Çark',
    inviteBtn: 'Davet Et (%0.5)',
    vault: 'Kasa ⚡',
    connectWallet: 'Cüzdan Bağla',
    tabDice: '🎲 ZAR DÜELLOSU',
    tabCoin: '🪙 YAZI - TURA',
    tabRoulette: '🔴⚫ RULET',
    tabMines: '💣 MAYIN TARLASI',
    openRoom: 'Zar Odası Aç',
    challenge: 'Meydan Oku',
    liveRooms: 'Canlı Zar Odaları',
    rollDice: 'Zar At',
    you: 'Sen',
    fairRng: 'Provably Fair RNG',
    reward: 'Ödül',
    winner: 'Kazanan',
    backLobby: 'Lobiye Dön',
    selectHeads: 'YAZI SEÇ',
    selectTails: 'TURA SEÇ',
    flipCoin: 'Parayı Çevir',
    coinSubText: 'Canlı Oyuncu Eşleşmeli Düello • 1.94x Çarpan',
    rouletteSubText: 'Kırmızı / Siyah • 1.94x Çarpan',
    betAmount: 'Bahis Tutarı',
    recentGames: 'Son Biten Oyunlar',
    leaderboardTitle: 'Haftanın Kralları',
    weeklyBadge: 'Haftalık',
    winsText: 'Galibiyet',
    liveDist: 'Canlı Dağıtım',
    contractBadge: 'Doğrulanmış BSC Akıllı Sözleşmesi',
    evmVerified: 'Mainnet Doğrulandı',
    support: 'Destek & SSS',
    lpPoolBtn: 'LP Havuzu',
    stakeTitle: 'Kasa Ortaklığı & LP Staking',
    poolGuideTitle: 'Kasa Havuzu (LP) Nasıl Çalışır?',
    poolGuideText: 'Platformda oynanan tüm oyunlardan %3 ev komisyonu kesilir.',
    dailySpinNote: 'Her 24 saatte bir şansınızı deneyin!',
    spinBtn: 'Ücretsiz Çevir',
    spinWait: 'Kalan Süre',
    spinRolling: 'Çark Dönüyor...',
    waitingPlayer: 'Canlı Oyuncu Aranıyor...',
    refTitle: 'Arkadaşını Davet Et & Kazan',
    refDesc: 'Aktif yatırımcı olan davetlilerinizin oynadığı her bahisten anında %0.5 nakit komisyon kazanın.',
    copyLink: 'Davet Linkini Kopyala',
    linkCopied: 'Link Kopyalandı!',
    shareTelegramWin: 'Zaferini Telegram\'da Paylaş',
    adminPanel: 'Yönetici Kasası',
    wrongNetwork: 'Lütfen cüzdanınızı BSC (BNB Chain) Ağına geçirin!',
    cashout: 'Nakit Çek',
    startMines: 'Mayın Tarlasını Başlat',
    spinRoulette: 'Rulet Çarkını Çevir',
    inGameLock: 'Oyun devam ederken işlem yapılamaz!',
    sybilError: 'Anti-Sybil Kalkanı: Komisyon kazanmak için cüzdanınızda en az 1 aktif işlem olmalıdır.',
    maxBetText: 'Maks:',
    minBetText: 'Min:',
    activeRoomsText: 'Aktif Oda',
    restartText: 'Yeniden Başlat',
    allTxs: 'Tümü',
    inTxs: 'Yatırılanlar',
    outTxs: 'Çekilenler',
    winTxs: 'Kazançlar',
    lossTxs: 'Kayıplar',
    noTxs: 'Henüz kayıtlı bir işlem bulunmuyor.',
    vaultMgmt: 'Kasa Yönetimi',
    depositUsdt: 'USDT Yatır',
    withdrawUsdt: 'USDT Çek',
    amountLabel: 'Tutar',
    adminPanelTitle: 'Kurucu Kasa Gelir Paneli',
    adminPanelDesc: 'Platformda oynanan tüm oyunların %3 ev komisyonu akıllı sözleşmede birikir.',
    adminWithdrawLabel: 'Çekilecek Kasa Geliri (USDT)',
    adminBtnText: 'Kasa Gelirini Cüzdana Aktar',
    flexibleStake: 'Esnek',
    instantWithdraw: 'Anında Çekim',
    days7: '7 Gün',
    bonusProfit: '+Bonus Kâr',
    days30: '30 Gün',
    maxProfit: 'Maksimum Kâr',
    lockedTotal: 'Kilitli Toplam',
    accumulatedComm: 'Biriken Komisyon',
    claimYieldBtn: 'Kâr Payını Çek',
    unlockBtn: 'Kilidi Aç',
    joinPoolLabel: 'Havuza Ortak Ol',
    becomePartnerBtn: 'Ortak Ol',
    inviteLinkTitle: 'Özel Davet Bağlantınız:',
    selectWalletTitle: 'BSC Mainnet cüzdanınızı seçin:',
    binanceWalletDesc: 'Binance App & Extension',
    metamaskWalletDesc: 'EVM & Extension',
    okxWalletDesc: 'OKX App & Extension',
    otherWalletDesc: 'Rabby, Trust, Bybit, Phantom',
    demoWalletDesc: 'Test & Simülasyon',
    supportBotTitle: 'Resmi Canlı Destek',
    supportActive: '7/24 Aktif',
    walletText: 'Cüzdan',
    txPendingText: 'Cüzdanda Onay Bekleniyor...',
    depositAction: 'Kontrata USDT Aktar',
    withdrawAction: 'Çekim Talebi Oluştur',
    popularBadge: 'Popüler',
    universalBadge: 'Evrensel',
    testBadge: 'Deneme',
    liveLobby: 'Canlı Lobi',
    adminPrivilegeTitle: 'Platform Sahibi Yetkisi Devrede',
    colorRed: 'KIRMIZI',
    colorGreen: 'YEŞİL (0/00)',
    colorBlack: 'SİYAH',
    maxBetLabel: 'Maksimum Bahis',
    withdrawPendingAlert: 'Güvenlik Protokolü: Tüm çekim işlemleri manuel onay sürecine tabidir. Talebiniz alınmış olup, 24 saat içerisinde cüzdanınıza aktarılacaktır.',
    pendingStatus: 'Bekliyor',
    walletRequiredForSpin: 'Lütfen çarkı çevirmeden önce cüzdanınızı bağlayın!',
    refStatsTotalInvites: 'Davet Edilen Arkadaş',
    refStatsTotalEarned: 'Toplam Komisyon',
    refBonusNotice: '⚠️ Şart: Bonusu aktif etmek için her iki tarafın da cüzdanını bağlaması zorunludur.',
    stakeRequiredAlert: '⚠️ Kâr payını çekmek için önce LP Havuzuna USDT kilitlemelisiniz!',
    maxBetNotice: '💡 Kasa Güvenliği: Maksimum bahis sınırı 20 USDT\'dir.',
    justNow: 'Az önce',
    searchingMatch: 'Ağda eşleşme aranıyor...',
    playerFound: 'Oyuncu bulundu, bağlantı kuruluyor...',
    matchReady: 'Eşleşme tamamlandı! Zarlar hazırlanıyor...',
    headsName: 'YAZI',
    tailsName: 'TURA'
  },
  en: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'BSC Mainnet Live',
    txBtn: 'Statements (PDF/CSV)',
    dailySpin: 'Daily Spin',
    inviteBtn: 'Invite (%0.5)',
    vault: 'Vault ⚡',
    connectWallet: 'Connect Wallet',
    tabDice: '🎲 DICE DUEL',
    tabCoin: '🪙 COIN FLIP',
    tabRoulette: '🔴⚫ ROULETTE',
    tabMines: '💣 MINES',
    openRoom: 'Create Room',
    challenge: 'Challenge',
    liveRooms: 'Live Rooms',
    rollDice: 'Roll',
    you: 'You',
    fairRng: 'Provably Fair RNG',
    reward: 'Reward',
    winner: 'Winner',
    backLobby: 'Lobby',
    selectHeads: 'HEADS',
    selectTails: 'TAILS',
    flipCoin: 'Flip Coin',
    coinSubText: 'Live PvP Matchup Duel • 1.94x Multiplier',
    rouletteSubText: 'Red / Black • 1.94x Multiplier',
    betAmount: 'Bet Amount',
    recentGames: 'Recent Games',
    leaderboardTitle: 'Weekly Champions',
    weeklyBadge: 'Weekly',
    winsText: 'Wins',
    liveDist: 'Live Payouts',
    contractBadge: 'Verified BSC Smart Contract',
    evmVerified: 'Verified',
    support: 'Support',
    lpPoolBtn: 'LP Pool',
    stakeTitle: 'House Bankroll & LP Staking',
    poolGuideTitle: 'How House LP Works?',
    poolGuideText: 'A 3% house edge is collected from all games.',
    dailySpinNote: 'Test your luck every 24 hours!',
    spinBtn: 'Free Spin',
    spinWait: 'Cooldown',
    spinRolling: 'Spinning...',
    waitingPlayer: 'Searching for live player...',
    refTitle: 'Refer Friends & Earn',
    refDesc: 'Earn 0.5% instant cash commission from active invited traders.',
    copyLink: 'Copy Invite Link',
    linkCopied: 'Link Copied!',
    shareTelegramWin: 'Brag on Telegram',
    adminPanel: 'House Admin',
    wrongNetwork: 'Please switch network to BSC!',
    cashout: 'Cash Out',
    startMines: 'Start Mines Game',
    spinRoulette: 'Spin Roulette Wheel',
    inGameLock: 'Cannot act while game is active!',
    sybilError: 'Anti-Sybil Shield: Wallet must have active volume.',
    maxBetText: 'Max:',
    minBetText: 'Min:',
    activeRoomsText: 'Active Rooms',
    restartText: 'Restart',
    allTxs: 'All',
    inTxs: 'Deposits',
    outTxs: 'Withdrawals',
    winTxs: 'Wins',
    lossTxs: 'Losses',
    noTxs: 'No transaction records found yet.',
    vaultMgmt: 'Vault Management',
    depositUsdt: 'Deposit USDT',
    withdrawUsdt: 'Withdraw USDT',
    amountLabel: 'Amount',
    adminPanelTitle: 'Founder Revenue Panel',
    adminPanelDesc: 'A 3% house edge from all games accumulates in the smart contract.',
    adminWithdrawLabel: 'Withdraw Revenue (USDT)',
    adminBtnText: 'Transfer Revenue to Wallet',
    flexibleStake: 'Flexible',
    instantWithdraw: 'Instant Withdrawal',
    days7: '7 Days',
    bonusProfit: '+Bonus Profit',
    days30: '30 Days',
    maxProfit: 'Max Profit',
    lockedTotal: 'Locked Total',
    accumulatedComm: 'Accumulated Commission',
    claimYieldBtn: 'Claim Yield',
    unlockBtn: 'Unlock',
    joinPoolLabel: 'Join Pool',
    becomePartnerBtn: 'Become Partner',
    inviteLinkTitle: 'Your Special Invite Link:',
    selectWalletTitle: 'Select your BSC Mainnet wallet:',
    binanceWalletDesc: 'Binance App & Extension',
    metamaskWalletDesc: 'EVM & Extension',
    okxWalletDesc: 'OKX App & Extension',
    otherWalletDesc: 'Rabby, Trust, Bybit, Phantom',
    demoWalletDesc: 'Test & Simulation',
    supportBotTitle: 'Official Support',
    supportActive: '24/7 Active',
    walletText: 'Wallet',
    txPendingText: 'Awaiting Approval...',
    depositAction: 'Deposit to Contract',
    withdrawAction: 'Request Withdrawal',
    popularBadge: 'Popular',
    universalBadge: 'Universal',
    testBadge: 'Test',
    liveLobby: 'Live Lobby',
    adminPrivilegeTitle: 'Platform Owner Privilege Active',
    colorRed: 'RED',
    colorGreen: 'GREEN (0/00)',
    colorBlack: 'BLACK',
    maxBetLabel: 'Max Bet',
    withdrawPendingAlert: 'Security Protocol: All withdrawals are subject to a manual review process.',
    pendingStatus: 'Pending',
    walletRequiredForSpin: 'Please connect your wallet first!',
    refStatsTotalInvites: 'Invited Friends',
    refStatsTotalEarned: 'Total Commission',
    refBonusNotice: '⚠️ Condition: Both parties must connect their wallets to claim the bonus.',
    stakeRequiredAlert: '⚠️ You must stake USDT in the LP Pool to claim yield!',
    maxBetNotice: '💡 House Safety: Max bet limit is 20 USDT.',
    justNow: 'Just now',
    searchingMatch: 'Searching for live opponent...',
    playerFound: 'Opponent found, establishing connection...',
    matchReady: 'Match completed! Preparing dices...',
    headsName: 'HEADS',
    tailsName: 'TAILS'
  }
};

export default function PlatformPage() {
  const [lang, setLang] = useState<string>('tr');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  const [balance, setBalance] = useState<number>(0.0);
  const [account, setAccount] = useState<string | null>(null);
  const [isGameLocked, setIsGameLocked] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<boolean>(false);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [totalInvites, setTotalInvites] = useState<number>(0);
  const [totalRefEarnings, setTotalRefEarnings] = useState<number>(0.0);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Telegram Kanal Bildirim Fonksiyonu
  const sendTelegramChannelAlert = async (winner: string, game: string, payout: number) => {
    try {
      const message = `🚀 *DiceDuel Canlı Kazanç!* 🎲\n\n👤 *${winner}* — *${game}* oyununda *+${payout.toFixed(2)} USDT* kazandı! 💰\n\n👇 Sen de şansını dene:\nhttps://t.me/diceduel_fun_bot`;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHANNEL_USERNAME,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.error("Kanal bildirimi gönderilemedi", e);
    }
  };

  // Oyun kazanma anında (Örnek: executeDiceDuel içindeki if(isPlayerWin) bloğu):
  // sendTelegramChannelAlert(winnerPlayer, gameDesc, +netWin.toFixed(2));

  // ... (Geri kalan tüm fonksiyonlar, state yönetimi ve UI bileşenleri aynı şekilde korunur)
  // Bu yapıyı mevcut platformuna entegre et.

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
       {/* ... UI KISIMLARI AYNEN DEVAM EDER ... */}
       <div className="text-center">
         <h1 className="text-4xl font-black mb-4">{t.hubTitle}</h1>
         <p className="text-slate-400">Platforma hoş geldin. Her şey hazır!</p>
       </div>
    </main>
  );
}
