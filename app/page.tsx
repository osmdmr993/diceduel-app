'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { 
  Wallet, Swords, Plus, Flame, TrendingUp, ShieldCheck, 
  Trophy, RotateCcw, Activity, WifiOff, Sparkles, 
  ArrowDownCircle, ArrowUpCircle, X, CheckCircle2, LogOut,
  Coins, FileCode2, Volume2, VolumeX,
  History, Copy, Check, Gift, Users, CircleDot, Dices, Send,
  ReceiptText, Download, Printer, CheckCircle,
  MessageCircle, Info, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = 'https://diceduel-server.onrender.com';
const CONTRACT_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138';

let socket: Socket;

const TRANSLATIONS: Record<string, any> = {
  tr: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'Canlı Çoklu Oyun Ağı',
    connecting: 'Sunucu Bağlanıyor...',
    txBtn: 'İşlemler (PDF/CSV)',
    dailySpin: 'Günlük Çark',
    inviteBtn: 'Davet Et (%0.5)',
    vault: 'Kasa ⚡',
    connectWallet: 'Cüzdan Bağla',
    tabDice: '🎲 ZAR DÜELLOSU',
    tabCoin: '🪙 YAZI - TURA',
    openRoom: 'Zar Odası Aç',
    challenge: 'Meydan Oku',
    liveRooms: 'Canlı Zar Odaları',
    rollDice: 'Zar At',
    you: 'Sen',
    fairRng: 'Provably Fair RNG',
    reward: 'Ödül',
    winner: 'Kazanan',
    backLobby: 'Lobiye Dön',
    shareVictory: 'Zaferini Arkadaşlarınla Paylaş:',
    selectHeads: 'YAZI SEÇ',
    selectTails: 'TURA SEÇ',
    flipCoin: 'Parayı Çevir',
    betAmount: 'Bahis Tutarı (USDT)',
    recentGames: 'Son Biten Oyunlar & Kazananlar',
    liveDist: 'Canlı Dağıtım',
    contractBadge: 'Emanet Kontratı',
    evmVerified: 'EVM Doğrulandı',
    support: 'Destek & SSS',
    poolGuideTitle: 'Kasa Havuzu (LP) Nedir?',
    poolGuideText: 'Platformda oynanan tüm oyunlardan %3 ev komisyonu kesilir. Bu komisyonun yarısı (%1.5) havuz ortaklarına anlık paylaştırılır. İstediğiniz zaman anaparanızı ve biriken USDT payınızı çekebilirsiniz.',
    dailySpinNote: 'Her 24 saatte bir ücretsiz çevirin!',
    spinBtn: 'Ücretsiz Çevir',
    spinWait: 'Yarın Tekrar Gel (24 Saat)',
    spinRolling: 'Çark Dönüyor...',
  },
  en: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'Live Multi-Gaming Network',
    connecting: 'Server Connecting...',
    txBtn: 'Statements (PDF/CSV)',
    dailySpin: 'Daily Spin',
    inviteBtn: 'Invite (%0.5)',
    vault: 'Vault ⚡',
    connectWallet: 'Connect Wallet',
    tabDice: '🎲 DICE DUEL',
    tabCoin: '🪙 COIN FLIP',
    openRoom: 'Create Dice Room',
    challenge: 'Challenge',
    liveRooms: 'Live Dice Rooms',
    rollDice: 'Roll Dice',
    you: 'You',
    fairRng: 'Provably Fair RNG',
    reward: 'Reward',
    winner: 'Winner',
    backLobby: 'Back to Lobby',
    shareVictory: 'Share Your Victory:',
    selectHeads: 'CHOOSE HEADS',
    selectTails: 'CHOOSE TAILS',
    flipCoin: 'Flip Coin',
    betAmount: 'Bet Amount (USDT)',
    recentGames: 'Recent Completed Games & Winners',
    liveDist: 'Live Payouts',
    contractBadge: 'Escrow Contract',
    evmVerified: 'EVM Verified',
    support: 'Support & FAQ',
    poolGuideTitle: 'What is House Liquidity (LP)?',
    poolGuideText: 'A 3% house fee is collected on each game. Half of this fee (1.5%) is distributed directly to liquidity providers. You can withdraw your staked USDT and accumulated rewards anytime.',
    dailySpinNote: 'Spin for free every 24 hours!',
    spinBtn: 'Free Spin',
    spinWait: 'Come Back Tomorrow (24h)',
    spinRolling: 'Spinning Wheel...',
  },
  ru: {
    hubTitle: 'DiceDuel Игровая Арена',
    liveNet: 'Сеть Мульти-Игр Онлайн',
    connecting: 'Подключение к серверу...',
    txBtn: 'Транзакции (PDF/CSV)',
    dailySpin: 'Колесо Удачи',
    inviteBtn: 'Пригласить (%0.5)',
    vault: 'Касса ⚡',
    connectWallet: 'Подключить Кошелек',
    tabDice: '🎲 ДУЭЛЬ КОСТЕЙ',
    tabCoin: '🪙 ОРЕЛ И РЕШКА',
    openRoom: 'Создать Комнату',
    challenge: 'Бросить Вызов',
    liveRooms: 'Активные Комнаты',
    rollDice: 'Бросить',
    you: 'Вы',
    fairRng: 'Provably Fair RNG',
    reward: 'Награда',
    winner: 'Победитель',
    backLobby: 'В Лобби',
    shareVictory: 'Поделиться Победой:',
    selectHeads: 'ОРЕЛ',
    selectTails: 'РЕШКА',
    flipCoin: 'Бросить Монету',
    betAmount: 'Ставка (USDT)',
    recentGames: 'Недавние Игры и Победители',
    liveDist: 'Выплаты Онлайн',
    contractBadge: 'Смарт-Контракт',
    evmVerified: 'EVM Проверено',
    support: 'Поддержка & FAQ',
    poolGuideTitle: 'Что такое Пул Ликвидности (LP)?',
    poolGuideText: 'С каждой игры взимается комиссия 3%. Половина (1.5%) распределяется между поставщиками ликвидности. Вы можете забрать свои USDT и доход в любое время.',
    dailySpinNote: 'Крутите бесплатно каждые 24 часа!',
    spinBtn: 'Крутить Бесплатно',
    spinWait: 'Приходите Завтра (24ч)',
    spinRolling: 'Колесо крутится...',
  },
  es: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'Red de Juegos en Vivo',
    connecting: 'Conectando al Servidor...',
    txBtn: 'Historial (PDF/CSV)',
    dailySpin: 'Ruleta Diaria',
    inviteBtn: 'Invitar (%0.5)',
    vault: 'Bóveda ⚡',
    connectWallet: 'Conectar Wallet',
    tabDice: '🎲 DUELO DE DADOS',
    tabCoin: '🪙 CARA O CRUZ',
    openRoom: 'Crear Sala',
    challenge: 'Desafiar',
    liveRooms: 'Salas en Vivo',
    rollDice: 'Lanzar Dados',
    you: 'Tú',
    fairRng: 'Provably Fair RNG',
    reward: 'Premio',
    winner: 'Ganador',
    backLobby: 'Volver al Lobby',
    shareVictory: 'Comparte tu Victoria:',
    selectHeads: 'ELEGIR CARA',
    selectTails: 'ELEGIR CRUZ',
    flipCoin: 'Lanzar Moneda',
    betAmount: 'Apuesta (USDT)',
    recentGames: 'Últimas Partidas y Ganadores',
    liveDist: 'Pagos en Vivo',
    contractBadge: 'Contrato Escrow',
    evmVerified: 'EVM Verificado',
    support: 'Soporte & FAQ',
    poolGuideTitle: '¿Qué es el Fondo de Liquidez (LP)?',
    poolGuideText: 'Se cobra una comisión del 3% por juego. El 1.5% se reparte entre los socios del fondo. Puedes retirar tus fondos y ganancias en cualquier momento.',
    dailySpinNote: '¡Gira gratis cada 24 horas!',
    spinBtn: 'Giro Gratis',
    spinWait: 'Vuelve Mañana (24h)',
    spinRolling: 'Girando Ruleta...',
  },
  de: {
    hubTitle: 'DiceDuel Gaming Hub',
    liveNet: 'Live Multi-Gaming Netzwerk',
    connecting: 'Server verbindet...',
    txBtn: 'Auszüge (PDF/CSV)',
    dailySpin: 'Tägliches Rad',
    inviteBtn: 'Einladen (%0.5)',
    vault: 'Tresor ⚡',
    connectWallet: 'Wallet Verbinden',
    tabDice: '🎲 WÜRFEL DUELL',
    tabCoin: '🪙 MÜNZWURF',
    openRoom: 'Raum Erstellen',
    challenge: 'Herausfordern',
    liveRooms: 'Live Räume',
    rollDice: 'Würfeln',
    you: 'Du',
    fairRng: 'Provably Fair RNG',
    reward: 'Gewinn',
    winner: 'Gewinner',
    backLobby: 'Zurück zur Lobby',
    shareVictory: 'Teile deinen Sieg:',
    selectHeads: 'KOPF WÄHLEN',
    selectTails: 'ZAHL WÄHLEN',
    flipCoin: 'Münze Werfen',
    betAmount: 'Einsatz (USDT)',
    recentGames: 'Letzte Spiele & Gewinner',
    liveDist: 'Live Auszahlung',
    contractBadge: 'Treuhandvertrag',
    evmVerified: 'EVM Verifiziert',
    support: 'Support & FAQ',
    poolGuideTitle: 'Was ist der Haus-Pool (LP)?',
    poolGuideText: 'Von jedem Spiel wird eine Hausgebühr von 3% erhoben. 1.5% gehen direkt an die Pool-Teilhaber. Auszahlungen sind jederzeit möglich.',
    dailySpinNote: 'Alle 24 Stunden kostenlos drehen!',
    spinBtn: 'Kostenlos Drehen',
    spinWait: 'Morgen wiederkommen (24h)',
    spinRolling: 'Rad dreht sich...',
  },
  zh: {
    hubTitle: 'DiceDuel 游戏中心',
    liveNet: '实时多游戏网络',
    connecting: '正在连接服务器...',
    txBtn: '交易明细 (PDF/CSV)',
    dailySpin: '每日幸运轮盘',
    inviteBtn: '邀请好友 (%0.5)',
    vault: '金库 ⚡',
    connectWallet: '连接钱包',
    tabDice: '🎲 骰子对决',
    tabCoin: '🪙 抛硬币',
    openRoom: '创建房间',
    challenge: '发起挑战',
    liveRooms: '实时对决房间',
    rollDice: '掷骰子',
    you: '你',
    fairRng: '可验证公平 (Provably Fair)',
    reward: '奖金',
    winner: '获胜者',
    backLobby: '返回大厅',
    shareVictory: '分享你的胜利:',
    selectHeads: '选择正面',
    selectTails: '选择反面',
    flipCoin: '抛硬币',
    betAmount: '下注金额 (USDT)',
    recentGames: '最近完成的游戏与获胜者',
    liveDist: '实时派奖',
    contractBadge: '托管智能合约',
    evmVerified: 'EVM 已验证',
    support: '客服与支持',
    poolGuideTitle: '什么是金库流动性池 (LP)?',
    poolGuideText: '每场游戏收取3%的手续费，其中1.5%直接按比例分配给流动性池提供者。您可以随时提取本金和USDT收益。',
    dailySpinNote: '每24小时可免费旋转一次！',
    spinBtn: '免费抽奖',
    spinWait: '明天再来 (24小时)',
    spinRolling: '轮盘旋转中...',
  }
};

const LANG_OPTIONS = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

interface Room {
  id: string;
  creator: string;
  betAmount: number;
}

interface MatchHistoryItem {
  id: string;
  winner: string;
  loser: string;
  game: string;
  payout: number;
  time: string;
}

interface TransactionRecord {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'GAME_WIN' | 'SPIN' | 'REF_COMMISSION';
  title: string;
  amount: number;
  date: string;
  txHash: string;
  status: 'COMPLETED' | 'SUCCESS';
}

export default function PlatformPage() {
  const [lang, setLang] = useState<string>('en');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [activeTab, setActiveTab] = useState<'dice' | 'coinflip'>('dice');
  const [account, setAccount] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [isDemoWallet, setIsDemoWallet] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [balance, setBalance] = useState<number>(250.0);
  const [betInput, setBetInput] = useState<string>('5');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);

  // Oyun State'leri
  const [activeGame, setActiveGame] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [coinChoice, setCoinChoice] = useState<'YAZI' | 'TURA'>('YAZI');
  const [coinResult, setCoinResult] = useState<'YAZI' | 'TURA' | null>(null);
  const [gameResult, setGameResult] = useState<{
    opponent: string;
    p1Score: any;
    p2Score: any;
    winner: string | null;
  }>({ opponent: 'Rakip', p1Score: null, p2Score: null, winner: null });

  // Günlük Çark
  const [isSpinModalOpen, setIsSpinModalOpen] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinReward, setSpinReward] = useState<number | null>(null);
  const [canSpin, setCanSpin] = useState<boolean>(true);

  // Referans Sistemi
  const [isRefModalOpen, setIsRefModalOpen] = useState<boolean>(false);
  const [refEarnings, setRefEarnings] = useState<number>(8.50);
  const [totalInvited, setTotalInvited] = useState<number>(6);

  // Provably Fair & Destek Modalları
  const [isFairModalOpen, setIsFairModalOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);

  // Finans & İşlem Geçmişi
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [txFilter, setTxFilter] = useState<'ALL' | 'IN' | 'OUT' | 'WINS'>('ALL');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([
    { id: 'tx-101', type: 'DEPOSIT', title: 'Başlangıç USDT Yatırma', amount: 250.00, date: '20.08.2026 11:15', txHash: '0x8f2a...c89e', status: 'COMPLETED' },
    { id: 'tx-102', type: 'GAME_WIN', title: 'Zar Düellosu Zaferi (89-45)', amount: 19.40, date: '20.08.2026 11:20', txHash: '0x4e31...b52a', status: 'SUCCESS' },
    { id: 'tx-103', type: 'REF_COMMISSION', title: 'Referans Ortaklık Payı (%0.5)', amount: 1.25, date: '20.08.2026 11:24', txHash: '0x1a7c...f901', status: 'SUCCESS' }
  ]);

  // Canlı Maç Geçmişi
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([
    { id: 'm-1', winner: 'CryptoWhale_88', loser: 'SolanaKing', game: '🎲 Zar (89-45)', payout: 19.40, time: '1m ago' },
    { id: 'm-2', winner: 'LuckyStrike', loser: 'MoonBuster', game: '🪙 Yazı-Tura', payout: 9.70, time: '2m ago' },
    { id: 'm-3', winner: 'AlphaSeeker', loser: 'DegenTrader', game: '🎲 Zar (78-54)', payout: 38.80, time: '4m ago' },
  ]);

  // Ses & Titreşim Motoru
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rollSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Kasa / Staking Modalları
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [modalAmount, setModalAmount] = useState<string>('50');
  const [txSuccessMsg, setTxSuccessMsg] = useState<string | null>(null);

  const [isStakeModalOpen, setIsStakeModalOpen] = useState<boolean>(false);
  const [stakedAmount, setStakedAmount] = useState<number>(100.0);
  const [accumulatedYield, setAccumulatedYield] = useState<number>(14.20);
  const [stakeInput, setStakeInput] = useState<string>('25');
  const [stakeSuccessMsg, setStakeSuccessMsg] = useState<string | null>(null);

  const isRollingRef = useRef<boolean>(false);
  const currentBetRef = useRef<number>(0);

  const triggerTelegramHaptic = (style: 'light' | 'medium' | 'heavy' | 'success') => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.HapticFeedback) {
        if (style === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred(style);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
      if (browserLang.startsWith('tr')) setLang('tr');
      else if (browserLang.startsWith('ru')) setLang('ru');
      else if (browserLang.startsWith('es')) setLang('es');
      else if (browserLang.startsWith('de')) setLang('de');
      else if (browserLang.startsWith('zh')) setLang('zh');
      else setLang('en');

      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }
    }
  }, []);

  const addTransaction = (type: TransactionRecord['type'], title: string, amount: number) => {
    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      type,
      title,
      amount,
      date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      txHash: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      status: 'COMPLETED'
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const exportToCSV = () => {
    triggerTelegramHaptic('medium');
    const headers = 'ID,Islem Turu,Detay,Tutar (USDT),Tarih,Islem Hashi,Durum\n';
    const rows = transactions.map(t => `"${t.id}","${t.type}","${t.title}","${t.amount}","${t.date}","${t.txHash}","${t.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `diceduel_statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printStatement = () => {
    triggerTelegramHaptic('medium');
    window.print();
  };

  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playClickSound = () => {
    triggerTelegramHaptic('light');
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  };

  const playWinSound = () => {
    triggerTelegramHaptic('success');
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.25);
      });
    } catch (e) {}
  };

  const playLoseSound = () => {
    triggerTelegramHaptic('heavy');
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
  };

  const copyToClipboard = (text: string, type: string) => {
    triggerTelegramHaptic('medium');
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const shareOnTwitter = (winAmount: number, game: string) => {
    triggerTelegramHaptic('medium');
    const text = encodeURIComponent(`🎲 DiceDuel - Won ${winAmount.toFixed(2)} USDT on ${game}! 🚀 Provably Fair Web3 Arena:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=https://diceduel.fun`, '_blank');
  };

  const shareOnTelegram = (winAmount: number, game: string) => {
    triggerTelegramHaptic('medium');
    const text = encodeURIComponent(`🎲 DiceDuel - Won ${winAmount.toFixed(2)} USDT on ${game}!`);
    window.open(`https://t.me/share/url?url=https://diceduel.fun&text=${text}`, '_blank');
  };

  const pushMatchRecord = (winner: string, loser: string, gameDesc: string, bet: number) => {
    const payout = +(bet * 2 * 0.97).toFixed(2);
    setMatchHistory((prev) => [
      { id: `m-${Date.now()}`, winner, loser, game: gameDesc, payout, time: 'Just now' },
      ...prev.slice(0, 5),
    ]);
  };

  useEffect(() => {
    socket = io(SERVER_URL);
    socket.on('connect', () => setIsServerConnected(true));
    socket.on('disconnect', () => setIsServerConnected(false));
    socket.on('rooms_update', (updatedRooms: Room[]) => setRooms(updatedRooms));

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSelectWallet = async (type: 'binance' | 'okx' | 'bybit' | 'metamask' | 'trust' | 'walletconnect' | 'demo') => {
    initAudio();
    triggerTelegramHaptic('medium');
    setIsWalletModalOpen(false);

    if (type === 'demo') {
      const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setAccount(`0x${randomHex}`);
      setIsDemoWallet(true);
      setWalletType('Demo');
      return;
    }

    const win = window as any;
    let provider = type === 'binance' ? (win.BinanceChain || win.ethereum) : (type === 'okx' ? (win.okxwallet || win.ethereum) : win.ethereum);

    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsDemoWallet(false);
          setWalletType(type.toUpperCase());
          return;
        }
      } catch (e) {}
    }

    const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setAccount(`0x${randomHex}`);
    setIsDemoWallet(true);
    setWalletType('Demo');
  };

  // ZAR DÜELLOSU
  const handleStartDiceGame = (amount: number) => {
    initAudio();
    triggerTelegramHaptic('heavy');
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    currentBetRef.current = amount;
    setBalance((prev) => prev - amount);
    setActiveGame(true);
    setIsRolling(true);
    isRollingRef.current = true;

    if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
    rollSoundIntervalRef.current = setInterval(playClickSound, 110);

    const opponentName = lang === 'tr' ? 'Kasa' : 'House';
    setGameResult({ opponent: opponentName, p1Score: null, p2Score: null, winner: null });

    setTimeout(() => {
      if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
      isRollingRef.current = false;
      setIsRolling(false);

      const p1 = Math.floor(Math.random() * 100) + 1;
      let p2 = Math.floor(Math.random() * 100) + 1;
      while (p1 === p2) p2 = Math.floor(Math.random() * 100) + 1;
      
      const isMeWinner = p1 > p2;
      const winnerDisplayName = isMeWinner ? (lang === 'tr' ? 'Sen' : 'You') : (lang === 'tr' ? 'Kasa' : 'House');

      setGameResult({ 
        opponent: opponentName, 
        p1Score: p1, 
        p2Score: p2, 
        winner: winnerDisplayName 
      });

      setAccumulatedYield((prev) => +(prev + 0.08).toFixed(2));

      const winnerPlayer = isMeWinner ? (account ? `${account.substring(0, 6)}...` : 'You') : opponentName;
      const loserPlayer = isMeWinner ? opponentName : (account ? `${account.substring(0, 6)}...` : 'You');
      pushMatchRecord(winnerPlayer, loserPlayer, `🎲 Dice (${p1}-${p2})`, amount);

      if (isMeWinner) {
        const netWin = amount * 2 * 0.97;
        triggerConfetti();
        playWinSound();
        setBalance((prev) => prev + netWin);
        addTransaction('GAME_WIN', `Dice Win (${p1} vs ${p2})`, +netWin.toFixed(2));
      } else {
        playLoseSound();
      }
    }, 4200);
  };

  // YAZI - TURA OYUNU
  const handleStartCoinFlip = (amount: number) => {
    initAudio();
    triggerTelegramHaptic('heavy');
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    currentBetRef.current = amount;
    setBalance((prev) => prev - amount);
    setActiveGame(true);
    setIsRolling(true);
    setCoinResult(null);

    if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
    rollSoundIntervalRef.current = setInterval(playClickSound, 100);

    const houseName = lang === 'tr' ? 'Kasa' : 'House';
    setGameResult({ opponent: houseName, p1Score: coinChoice, p2Score: null, winner: null });

    setTimeout(() => {
      if (rollSoundIntervalRef.current) clearInterval(rollSoundIntervalRef.current);
      setIsRolling(false);

      const outcomes: ('YAZI' | 'TURA')[] = ['YAZI', 'TURA'];
      const landed = outcomes[Math.floor(Math.random() * outcomes.length)];
      setCoinResult(landed);

      const isWon = landed === coinChoice;
      const winnerName = isWon ? (lang === 'tr' ? 'Sen' : 'You') : houseName;

      setGameResult({ opponent: houseName, p1Score: coinChoice, p2Score: landed, winner: winnerName });
      setAccumulatedYield((prev) => +(prev + 0.08).toFixed(2));

      const winnerPlayer = isWon ? (account ? `${account.substring(0, 6)}...` : 'You') : houseName;
      const loserPlayer = isWon ? houseName : (account ? `${account.substring(0, 6)}...` : 'You');
      pushMatchRecord(winnerPlayer, loserPlayer, `🪙 CoinFlip (${landed})`, amount);

      if (isWon) {
        const netWin = amount * 2 * 0.97;
        triggerConfetti();
        playWinSound();
        setBalance((prev) => prev + netWin);
        addTransaction('GAME_WIN', `CoinFlip Win (${landed})`, +netWin.toFixed(2));
      } else {
        playLoseSound();
      }
    }, 3800);
  };

  // GÜNLÜK ÇARK
  const handleSpinWheel = () => {
    if (!canSpin || isSpinning) return;
    initAudio();
    triggerTelegramHaptic('medium');
    setIsSpinning(true);

    const rand = Math.random() * 100;
    let chosen = 0.05;
    if (rand < 45) chosen = 0.05;
    else if (rand < 80) chosen = 0.10;
    else if (rand < 95) chosen = 0.25;
    else if (rand < 99) chosen = 0.50;
    else chosen = 2.00;

    let ticks = 0;
    const tickInterval = setInterval(() => {
      playClickSound();
      ticks++;
      if (ticks > 25) clearInterval(tickInterval);
    }, 120);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinReward(chosen);
      setBalance((prev) => +(prev + chosen).toFixed(2));
      setCanSpin(false);
      triggerConfetti();
      playWinSound();
      addTransaction('SPIN', 'Daily Spin Reward', chosen);
    }, 3500);
  };

  const handleBalanceTransaction = () => {
    initAudio();
    triggerTelegramHaptic('medium');
    const val = parseFloat(modalAmount);
    if (isNaN(val) || val <= 0) return;
    if (!account) return alert(lang === 'tr' ? 'Lütfen önce cüzdanınızı bağlayın!' : 'Please connect wallet first!');

    if (modalTab === 'deposit') {
      setBalance((prev) => prev + val);
      setTxSuccessMsg(`+${val} USDT Deposited!`);
      addTransaction('DEPOSIT', 'Deposit to Vault', val);
    } else {
      if (val > balance) return alert(lang === 'tr' ? 'Kasada yeterli bakiye yok!' : 'Insufficient balance in vault!');
      setBalance((prev) => prev - val);
      setTxSuccessMsg(`-${val} USDT Withdrawn!`);
      addTransaction('WITHDRAW', 'Withdraw to Wallet', val);
    }
    setTimeout(() => { setTxSuccessMsg(null); setIsModalOpen(false); }, 1200);
  };

  const handleStakeAdd = () => {
    initAudio();
    triggerTelegramHaptic('medium');
    const val = parseFloat(stakeInput);
    if (isNaN(val) || val <= 0 || val > balance) return alert(lang === 'tr' ? 'Yetersiz bakiye!' : 'Insufficient balance!');
    setBalance((prev) => prev - val);
    setStakedAmount((prev) => prev + val);
    setStakeSuccessMsg(`+${val} USDT Staked to LP Pool!`);
    addTransaction('WITHDRAW', 'LP Stake Stash', val);
    setTimeout(() => setStakeSuccessMsg(null), 1500);
  };

  const handleClaimYield = () => {
    initAudio();
    triggerTelegramHaptic('success');
    if (accumulatedYield <= 0) return;
    setBalance((prev) => +(prev + accumulatedYield).toFixed(2));
    setStakeSuccessMsg(`+${accumulatedYield} USDT LP Reward Claimed!`);
    addTransaction('REF_COMMISSION', 'LP House Commission', +accumulatedYield.toFixed(2));
    setAccumulatedYield(0);
    setTimeout(() => setStakeSuccessMsg(null), 1500);
  };

  const filteredTransactions = transactions.filter(t => {
    if (txFilter === 'IN') return t.type === 'DEPOSIT';
    if (txFilter === 'OUT') return t.type === 'WITHDRAW';
    if (txFilter === 'WINS') return t.type === 'GAME_WIN' || t.type === 'SPIN';
    return true;
  });

  const currentWinPayout = +(currentBetRef.current * 2 * 0.97).toFixed(2);
  const refLink = account ? `https://diceduel.fun/?ref=${account}` : 'https://diceduel.fun/?ref=connect_wallet';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-8 font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Üst Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-400 font-black text-lg">🎲</div>
            <div>
              <h1 className="font-bold text-sm md:text-base leading-none">{t.hubTitle}</h1>
              <div className={`flex items-center gap-1 mt-1 text-[10px] ${isServerConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isServerConnected ? <Activity className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                <span>{isServerConnected ? t.liveNet : t.connecting}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dil Menüsü */}
            <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              >
                <span>{LANG_OPTIONS.find(l => l.code === lang)?.flag || '🌐'}</span>
                <span className="uppercase text-[11px] text-slate-200">{lang}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }} 
                    className="absolute right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[130px] space-y-1"
                  >
                    {LANG_OPTIONS.map(opt => (
                      <button
                        key={opt.code}
                        onClick={() => { setLang(opt.code); setIsLangMenuOpen(false); triggerTelegramHaptic('light'); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition ${lang === opt.code ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Ödemeler / İşlemler */}
            <button 
              onClick={() => { setIsTxModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95 shadow-sm"
              title={t.txBtn}
            >
              <ReceiptText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{t.txBtn}</span>
            </button>

            {/* Günlük Çark */}
            <button 
              onClick={() => { setIsSpinModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-400 transition active:scale-95 shadow-sm"
            >
              <Gift className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.dailySpin}</span>
              {canSpin && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
            </button>

            {/* Canlı Destek & SSS */}
            <button 
              onClick={() => { setIsSupportModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sky-400 transition active:scale-95"
              title={t.support}
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            {/* Kasa Payı Havuzu */}
            <button 
              onClick={() => { setIsStakeModalOpen(true); triggerTelegramHaptic('medium'); }}
              className="hidden sm:flex items-center gap-1 px-2.5 py-2 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-xl text-xs font-semibold text-emerald-400 transition active:scale-95"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{accumulatedYield.toFixed(2)}</span>
            </button>

            {/* Bakiye */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
              <div className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-amber-400">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>{balance.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => { setIsModalOpen(true); triggerTelegramHaptic('medium'); }}
                className="px-2 py-2 bg-slate-700 hover:bg-slate-600 text-[11px] font-bold text-slate-200 border-l border-slate-600 transition active:scale-95"
              >
                {t.vault}
              </button>
            </div>

            {/* Cüzdan */}
            {account ? (
              <div className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{account.substring(0, 5)}..</span>
                <button onClick={() => { setAccount(null); setIsDemoWallet(false); }} className="text-slate-400 hover:text-rose-400 ml-1">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setIsWalletModalOpen(true); triggerTelegramHaptic('medium'); }} 
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                {t.connectWallet}
              </button>
            )}
          </div>
        </header>

        {/* Oyun Seçim Sekmeleri */}
        {!activeGame && (
          <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto">
            <button
              onClick={() => { setActiveTab('dice'); triggerTelegramHaptic('light'); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                activeTab === 'dice' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dices className="w-4 h-4" /> {t.tabDice}
            </button>
            <button
              onClick={() => { setActiveTab('coinflip'); triggerTelegramHaptic('light'); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                activeTab === 'coinflip' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CircleDot className="w-4 h-4" /> {t.tabCoin}
            </button>
          </div>
        )}

        {/* Oyun Arenası */}
        {activeGame ? (
          <div className="flex flex-col items-center justify-center p-5 bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl mx-auto shadow-2xl">
            <div className="flex justify-between w-full items-center mb-6 px-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.fairRng}</span>
              </div>
              <div className="text-xs font-semibold text-slate-300">{t.reward}: <span className="text-amber-400 font-bold">{currentWinPayout.toFixed(2)} USDT</span></div>
            </div>

            {activeTab === 'dice' ? (
              <div className="grid grid-cols-2 gap-4 w-full relative mb-6">
                <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                  <span className="text-xs text-slate-400 mb-2">{t.you}</span>
                  <motion.div animate={isRolling ? { rotate: [0, 360] } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }} className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black shadow-lg">
                    {isRolling ? '?' : gameResult.p1Score ?? '-'}
                  </motion.div>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 border border-slate-700 text-xs font-black text-slate-400 w-8 h-8 rounded-full flex items-center justify-center">VS</div>
                <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                  <span className="text-xs text-slate-400 mb-2 truncate max-w-[100px]">{gameResult.opponent}</span>
                  <motion.div animate={isRolling ? { rotate: [0, -360] } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }} className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-rose-500 to-amber-600 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black shadow-lg">
                    {isRolling ? '?' : gameResult.p2Score ?? '-'}
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center my-4 space-y-3">
                <span className="text-xs text-slate-400">Seçim: <span className="font-bold text-amber-400">{coinChoice}</span></span>
                <motion.div 
                  animate={isRolling ? { rotateY: [0, 1800], scale: [1, 1.15, 1] } : {}} 
                  transition={{ repeat: isRolling ? Infinity : 0, duration: 0.8, ease: "linear" }}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 flex items-center justify-center text-xl md:text-2xl font-black text-slate-950 border-4 border-yellow-300 shadow-2xl shadow-amber-500/30"
                >
                  {isRolling ? '🪙' : coinResult || coinChoice}
                </motion.div>
              </div>
            )}

            {gameResult.winner && !isRolling && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base md:text-lg">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>{t.winner}: {gameResult.winner}!</span>
                </div>

                {(gameResult.winner === 'Sen' || gameResult.winner === 'You') && (
                  <div className="w-full bg-slate-950/80 border border-emerald-800/40 p-3 rounded-2xl my-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {t.shareVictory}
                    </span>
                    <div className="flex items-center gap-2 w-full max-w-xs">
                      <button onClick={() => shareOnTwitter(currentWinPayout, activeTab === 'dice' ? 'Dice Duel' : 'Coin Flip')} className="flex-1 py-2 px-3 bg-black hover:bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition active:scale-95">
                        <span className="text-sm font-black">𝕏</span> X
                      </button>
                      <button onClick={() => shareOnTelegram(currentWinPayout, activeTab === 'dice' ? 'Dice Duel' : 'Coin Flip')} className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition active:scale-95">
                        <Send className="w-3.5 h-3.5" /> Telegram
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={() => setActiveGame(false)} className="flex items-center gap-2 mt-1 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 active:scale-95">
                  <RotateCcw className="w-4 h-4" /> {t.backLobby}
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          activeTab === 'dice' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3.5 h-fit">
                <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-200"><Plus className="w-4 h-4 text-indigo-400" /> {t.openRoom}</h2>
                <div>
                  <input type="number" value={betInput} onChange={(e) => setBetInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none" />
                </div>
                <button onClick={() => handleStartDiceGame(parseFloat(betInput))} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95">
                  {t.challenge}
                </button>
              </div>

              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3.5">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-200"><Flame className="w-4 h-4 text-rose-400" /> {t.liveRooms}</h2>
                  <span className="text-[10px] text-indigo-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Live Sync</span>
                </div>
                <div className="space-y-2">
                  {rooms.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                      <span className="text-xs font-semibold text-slate-300">{r.creator}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-400">{r.betAmount} USDT</span>
                        <button onClick={() => handleStartDiceGame(r.betAmount)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 active:scale-95 transition">
                          <Swords className="w-3.5 h-3.5" /> {t.rollDice}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 max-w-lg mx-auto space-y-4 shadow-2xl">
              <div className="text-center space-y-0.5">
                <h2 className="text-base md:text-lg font-black text-white flex items-center justify-center gap-2"><CircleDot className="w-5 h-5 text-amber-400" /> {t.tabCoin}</h2>
                <p className="text-[11px] text-slate-400">50% Chance • 1.94x Win Multiplier</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => { setCoinChoice('YAZI'); triggerTelegramHaptic('light'); }} className={`py-3 rounded-2xl font-black text-xs md:text-sm border transition flex flex-col items-center gap-1 ${coinChoice === 'YAZI' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-lg">🦅</span> {t.selectHeads}</button>
                <button onClick={() => { setCoinChoice('TURA'); triggerTelegramHaptic('light'); }} className={`py-3 rounded-2xl font-black text-xs md:text-sm border transition flex flex-col items-center gap-1 ${coinChoice === 'TURA' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-lg">🪙</span> {t.selectTails}</button>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">{t.betAmount}</label>
                <input type="number" value={betInput} onChange={(e) => setBetInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500" />
              </div>

              <div className="flex gap-1.5">
                {['5', '10', '25', '50'].map((preset) => (
                  <button key={preset} onClick={() => { setBetInput(preset); triggerTelegramHaptic('light'); }} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg transition">+{preset}</button>
                ))}
              </div>

              <button onClick={() => handleStartCoinFlip(parseFloat(betInput))} className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs md:text-sm rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95">
                🪙 {t.flipCoin} ({(parseFloat(betInput || '0') * 1.94).toFixed(2)} USDT)
              </button>
            </div>
          )
        )}

        {/* CANLI MAÇ GEÇMİŞİ */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" /> {t.recentGames}
            </h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> {t.liveDist}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <AnimatePresence>
              {matchHistory.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate max-w-[85px]">{m.winner}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{m.game}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-400">+{m.payout} USDT</div>
                    <div className="text-[9px] text-slate-500">{m.time}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.contractBadge}:</span>
            <span className="font-mono text-[10px] text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{CONTRACT_ADDRESS.substring(0, 10)}...</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{t.evmVerified}</span>
          </div>
        </footer>

        {/* 1. MODAL: GÜNLÜK ÇARK */}
        <AnimatePresence>
          {isSpinModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl relative text-center">
                <button onClick={() => setIsSpinModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white mb-0.5 flex items-center justify-center gap-2"><Gift className="w-4 h-4 text-amber-400" /> {t.dailySpin}</h3>
                <p className="text-[11px] text-slate-400 mb-4">{t.dailySpinNote}</p>
                <div className="flex justify-center my-3">
                  <motion.div animate={isSpinning ? { rotate: [0, 1440] } : {}} transition={{ duration: 3.5, ease: "easeOut" }} className="w-32 h-32 rounded-full border-4 border-amber-500 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 flex items-center justify-center text-3xl font-black shadow-2xl relative">
                    🎁
                    <div className="absolute top-0 w-2.5 h-2.5 bg-amber-400 rotate-45 -translate-y-1"></div>
                  </motion.div>
                </div>
                {spinReward && <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl my-2 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-400" /> +{spinReward.toFixed(2)} USDT!</div>}
                <button onClick={handleSpinWheel} disabled={!canSpin || isSpinning} className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg disabled:opacity-40">
                  {isSpinning ? t.spinRolling : canSpin ? t.spinBtn : t.spinWait}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. MODAL: KASA & LP HAVUZU */}
        <AnimatePresence>
          {isStakeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative space-y-4">
                <button onClick={() => setIsStakeModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white flex items-center gap-2"><Coins className="w-5 h-5 text-emerald-400" /> Kasa Payı & LP Havuzu</h3>
                
                <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {t.poolGuideTitle}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{t.poolGuideText}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl"><span className="text-[10px] text-slate-400 block mb-0.5">Kilitli USDT</span><span className="text-sm font-black text-indigo-300">{stakedAmount.toFixed(2)} USDT</span></div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl"><span className="text-[10px] text-slate-400 block mb-0.5">Biriken Pay</span><span className="text-sm font-black text-emerald-400">+{accumulatedYield.toFixed(2)} USDT</span></div>
                </div>

                <button onClick={handleClaimYield} disabled={accumulatedYield <= 0} className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40"><Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Biriken Payı Çek</button>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-300 font-bold block">Havuz Ortaklığını Artır</label>
                  <div className="flex gap-2">
                    <input type="number" value={stakeInput} onChange={(e) => setStakeInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none" />
                    <button onClick={handleStakeAdd} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition">Ortak Ol</button>
                  </div>
                </div>
                {stakeSuccessMsg && <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl"><CheckCircle2 className="w-4 h-4" /><span>{stakeSuccessMsg}</span></div>}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. MODAL: DESTEK & SSS */}
        <AnimatePresence>
          {isSupportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative space-y-4">
                <button onClick={() => setIsSupportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-sky-400" /> {t.support}</h3>
                
                <div className="space-y-2 text-xs">
                  <a href="https://t.me/diceduel_fun_bot" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-950 hover:bg-sky-950/30 border border-slate-800 hover:border-sky-500/50 rounded-2xl transition">
                    <div className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="font-bold text-slate-200">Resmi Telegram Destek Botu</div>
                        <div className="text-[10px] text-slate-500">@diceduel_fun_bot</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800/40">7/24 Aktif</span>
                  </a>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                    <div className="font-bold text-slate-200 text-[11px]">Sıkça Sorulan Sorular:</div>
                    <div className="text-[10px] text-slate-400 space-y-1">
                      <p>• <b>Para çekimleri ne zaman yansır?</b> Akıllı sözleşme üzerinden anında cüzdanınıza transfer edilir.</p>
                      <p>• <b>Oyunlar adil mi?</b> SHA-256 tabanlı Provably Fair algoritması ile sonuçlar önceden zincir üstünde mühürlenir.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. MODAL: İŞLEMLER */}
        <AnimatePresence>
          {isTxModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-2xl shadow-2xl relative space-y-3.5 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm md:text-base text-white">{t.txBtn}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={exportToCSV} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition"><Download className="w-3 h-3" /> CSV</button>
                    <button onClick={printStatement} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition"><Printer className="w-3 h-3" /> PDF</button>
                    <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-white transition ml-1"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {[{ id: 'ALL', label: 'Tümü' }, { id: 'IN', label: 'Yatırılanlar' }, { id: 'OUT', label: 'Çekilenler' }, { id: 'WINS', label: 'Kazançlar' }].map(f => (
                    <button key={f.id} onClick={() => setTxFilter(f.id as any)} className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${txFilter === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>{f.label}</button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                  {filteredTransactions.map(tx => (
                    <div key={tx.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${tx.type === 'WITHDRAW' ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'}`}>
                          {tx.type === 'DEPOSIT' && '📥'}{tx.type === 'WITHDRAW' && '📤'}{tx.type === 'GAME_WIN' && '🏆'}{tx.type === 'SPIN' && '🎁'}{tx.type === 'REF_COMMISSION' && '👥'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{tx.title}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{tx.date} • {tx.txHash}</div>
                        </div>
                      </div>
                      <div className={`text-xs font-black ${tx.type === 'WITHDRAW' ? 'text-rose-400' : 'text-emerald-400'}`}>{tx.type === 'WITHDRAW' ? '-' : '+'}{tx.amount.toFixed(2)} USDT</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 5. MODAL: KASA & YATIR-ÇEK */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white mb-3 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-400" /> Kasa Yönetimi</h3>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl mb-3 border border-slate-800">
                  <button onClick={() => setModalTab('deposit')} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${modalTab === 'deposit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><ArrowDownCircle className="w-4 h-4" /> USDT Yatır</button>
                  <button onClick={() => setModalTab('withdraw')} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${modalTab === 'withdraw' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><ArrowUpCircle className="w-4 h-4" /> USDT Çek</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">Tutar (USDT)</label>
                    <input type="number" value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none" />
                  </div>
                  <div className="flex gap-1.5">
                    {['10', '50', '100', '250'].map((preset) => (
                      <button key={preset} onClick={() => setModalAmount(preset)} className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg transition">+{preset}</button>
                    ))}
                  </div>
                  {txSuccessMsg && <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl"><CheckCircle2 className="w-4 h-4" /><span>{txSuccessMsg}</span></div>}
                  <button onClick={handleBalanceTransaction} className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition active:scale-95 ${modalTab === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'}`}>
                    {modalTab === 'deposit' ? 'Kontrata USDT Aktar' : 'Kontrattan Cüzdana Çek'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 6. MODAL: CÜZDAN BAĞLANTI */}
        <AnimatePresence>
          {isWalletModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsWalletModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-base text-white mb-1 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-400" /> {t.connectWallet}</h3>
                <p className="text-[11px] text-slate-400 mb-3">Borsa veya Web3 cüzdanınızı seçin.</p>
                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  <button onClick={() => handleSelectWallet('binance')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-amber-950/20 border border-slate-800 rounded-2xl transition"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">🟡</div><div className="text-left"><div className="text-xs font-bold text-slate-200">Binance Web3 Wallet</div><div className="text-[9px] text-slate-500">Binance App & Extension</div></div></div><span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">Popüler</span></button>
                  <button onClick={() => handleSelectWallet('okx')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl transition"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-xs">⬛</div><div className="text-left"><div className="text-xs font-bold text-slate-200">OKX Web3 Wallet</div><div className="text-[9px] text-slate-500">OKX App & Extension</div></div></div></button>
                  <button onClick={() => handleSelectWallet('bybit')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-orange-950/20 border border-slate-800 rounded-2xl transition"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs">🟧</div><div className="text-left"><div className="text-xs font-bold text-slate-200">Bybit / Bitget Wallet</div><div className="text-[9px] text-slate-500">Web3 Cüzdanları</div></div></div></button>
                  <button onClick={() => handleSelectWallet('metamask')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-orange-950/20 border border-slate-800 rounded-2xl transition"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs">🦊</div><div className="text-left"><div className="text-xs font-bold text-slate-200">MetaMask</div><div className="text-[9px] text-slate-500">Web3 Cüzdanı</div></div></div></button>
                  <button onClick={() => handleSelectWallet('demo')} className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-indigo-950/20 border border-slate-800 rounded-2xl transition"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs">⚡</div><div className="text-left"><div className="text-xs font-bold text-slate-200">Hızlı Demo Cüzdan</div><div className="text-[9px] text-slate-500">Anında Test Et</div></div></div><span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">Kolay</span></button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
